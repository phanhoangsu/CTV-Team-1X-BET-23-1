/**
 * Search & Filter routes
 * Replaces: backend/app/search/routes.py + services.py
 */
import { Hono } from 'hono';
import { expandQuery } from '../services/synonyms.js';

const search = new Hono();

/**
 * Fuzzy string similarity (SequenceMatcher equivalent)
 */
function fuzzyRatio(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  if (a === b) return 1.0;

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.length === 0) return 1.0;

  // Simple Levenshtein-based similarity
  const matrix = [];
  for (let i = 0; i <= shorter.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= longer.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= shorter.length; i++) {
    for (let j = 1; j <= longer.length; j++) {
      if (shorter[i - 1] === longer[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[shorter.length][longer.length];
  return 1.0 - distance / longer.length;
}

/**
 * Check if text contains any of the terms (exact or fuzzy)
 */
function textContainsAny(text, terms, fuzzyThreshold = 0.65) {
  const textLower = text.toLowerCase();
  let best = 0.0;

  for (const term of terms) {
    // Exact substring match
    if (textLower.includes(term)) return { matched: true, score: 1.0 };

    // Fuzzy match against each word
    for (const word of textLower.split(/\s+/)) {
      const ratio = fuzzyRatio(term, word);
      if (ratio > best) best = ratio;
    }
  }

  return { matched: best >= fuzzyThreshold, score: best };
}

/**
 * GET /api/search - Main search + filter
 */
search.get('/', async (c) => {
  const q = (c.req.query('q') || '').trim();
  const itemType = (c.req.query('type') || '').trim();
  const status = (c.req.query('status') || '').trim();
  const location = (c.req.query('location') || '').trim();
  const subLocation = (c.req.query('sub_location') || '').trim();
  const category = (c.req.query('category') || '').trim();
  const sort = (c.req.query('sort') || 'newest').trim();
  const page = parseInt(c.req.query('page') || '1');
  const perPage = parseInt(c.req.query('per_page') || '12');

  // Build SQL query with filters
  let sql = 'SELECT * FROM item WHERE 1=1';
  const bindings = [];

  if (itemType) {
    sql += ' AND item_type = ?';
    bindings.push(itemType);
  }

  if (status && status !== 'all') {
    sql += ' AND status = ?';
    bindings.push(status);
  } else if (!status) {
    sql += " AND status = 'Open'";
  }

  if (location) {
    sql += ' AND LOWER(location) = LOWER(?)';
    bindings.push(location);
  }

  if (subLocation) {
    sql += ' AND LOWER(specific_location) = LOWER(?)';
    bindings.push(subLocation);
  }

  if (category) {
    sql += ' AND LOWER(category) = LOWER(?)';
    bindings.push(category);
  }

  // Get all matching items from DB
  const allItems = await c.env.DB.prepare(sql).bind(...bindings).all();
  let resultItems = allItems.results;

  if (q) {
    const expandedTerms = expandQuery(q);

    // Score items
    const scored = [];
    for (const item of resultItems) {
      const combined = `${item.title} ${item.description} ${item.location}`;
      const { matched, score: fuzzyScore } = textContainsAny(combined, expandedTerms);

      if (matched) {
        let score = 0;
        for (const term of expandedTerms) {
          if (item.title && item.title.toLowerCase().includes(term)) score += 3.0;
          else if (item.description && item.description.toLowerCase().includes(term)) score += 1.5;
          else if (item.location && item.location.toLowerCase().includes(term)) score += 1.0;
          score += fuzzyScore;
        }
        scored.push({ item, score });
      }
    }

    // Sort
    if (sort === 'oldest') {
      scored.sort((a, b) => (a.item.date_posted || '').localeCompare(b.item.date_posted || ''));
    } else if (sort === 'relevance') {
      scored.sort((a, b) => b.score - a.score);
    } else {
      scored.sort((a, b) => (b.item.date_posted || '').localeCompare(a.item.date_posted || ''));
    }

    const total = scored.length;
    const start = (page - 1) * perPage;
    const pageItems = scored.slice(start, start + perPage).map(s => s.item);
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    // Get usernames for items
    const items = await enrichItems(c.env.DB, pageItems);

    return c.json({ items, total, page, per_page: perPage, total_pages: totalPages });
  }

  // No text query - just sort
  if (sort === 'oldest') {
    resultItems.sort((a, b) => (a.date_posted || '').localeCompare(b.date_posted || ''));
  } else {
    resultItems.sort((a, b) => (b.date_posted || '').localeCompare(a.date_posted || ''));
  }

  const total = resultItems.length;
  const start = (page - 1) * perPage;
  const pageItems = resultItems.slice(start, start + perPage);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const items = await enrichItems(c.env.DB, pageItems);

  return c.json({ items, total, page, per_page: perPage, total_pages: totalPages });
});

/**
 * GET /api/search/autocomplete - Autocomplete suggestions
 */
search.get('/autocomplete', async (c) => {
  const q = (c.req.query('q') || '').trim();
  if (!q) return c.json({ keywords: [], items: [] });

  const expanded = expandQuery(q);

  // Keyword suggestions
  const keywords = expanded
    .filter(t => t.toLowerCase() !== q.toLowerCase())
    .slice(0, 5);

  // Quick match items
  const conditions = expanded.map(() => '(LOWER(title) LIKE ? OR LOWER(description) LIKE ?)').join(' OR ');
  const bindings = expanded.flatMap(term => [`%${term}%`, `%${term}%`]);

  let quickItems = [];
  if (conditions) {
    const result = await c.env.DB.prepare(
      `SELECT * FROM item WHERE status = 'Open' AND (${conditions}) ORDER BY date_posted DESC LIMIT 3`
    ).bind(...bindings).all();
    quickItems = await enrichItems(c.env.DB, result.results);
  }

  return c.json({ keywords, items: quickItems });
});

/**
 * GET /api/search/locations - Location hierarchy
 */
search.get('/locations', async (c) => {
  const items = await c.env.DB.prepare(
    'SELECT DISTINCT location, specific_location FROM item'
  ).all();

  const locMap = {};
  for (const { location, specific_location } of items.results) {
    if (!location) continue;
    const key = location.trim();
    if (!locMap[key]) locMap[key] = new Set();
    if (specific_location && specific_location.trim()) {
      locMap[key].add(specific_location.trim());
    }
  }

  const result = Object.entries(locMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, subs]) => ({
      name,
      sub_locations: [...subs].sort(),
    }));

  return c.json(result);
});

/**
 * GET /api/search/categories - Category list
 */
search.get('/categories', async (c) => {
  // Try categories table first
  const cats = await c.env.DB.prepare(
    'SELECT name FROM category ORDER BY name'
  ).all();

  if (cats.results.length > 0) {
    return c.json(cats.results.map(c => c.name));
  }

  // Fallback: distinct from items
  const rows = await c.env.DB.prepare(
    'SELECT DISTINCT category FROM item WHERE category IS NOT NULL ORDER BY category'
  ).all();

  return c.json(rows.results.map(r => r.category));
});

/**
 * Enrich items with username and images
 */
async function enrichItems(db, items) {
  return Promise.all(items.map(async (item) => {
    const user = await db.prepare('SELECT username FROM user WHERE id = ?').bind(item.user_id).first();
    const images = await db.prepare('SELECT image_url FROM item_image WHERE item_id = ?').bind(item.id).all();

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      location: item.location,
      specific_location: item.specific_location,
      category: item.category,
      item_type: item.item_type,
      contact_info: item.contact_info,
      image_url: item.image_url,
      date_posted: item.date_posted ? item.date_posted + 'Z' : null,
      incident_date: item.incident_date || null,
      images: images.results.map(img => img.image_url),
      user: user?.username || 'Unknown',
      user_id: item.user_id,
      status: item.status,
    };
  }));
}

export default search;
