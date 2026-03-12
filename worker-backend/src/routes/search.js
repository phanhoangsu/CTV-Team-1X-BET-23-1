import { Hono } from 'hono';

const searchApp = new Hono();

// GET /api/search - Re-routing to posts logic with exact same pagination and sorting
searchApp.get('/', async (c) => {
  const db = c.env.DB;
  const q = c.req.query('q') || '';
  const type = c.req.query('type') || '';
  const status = c.req.query('status') || '';
  const location = c.req.query('location') || '';
  const specific_location = c.req.query('sub_location') || '';
  const category = c.req.query('category') || '';
  const sort = c.req.query('sort') || 'newest';
  const page = parseInt(c.req.query('page') || '1', 10);
  const perPage = parseInt(c.req.query('per_page') || '12', 10);

  let sql = 'SELECT * FROM item WHERE 1=1';
  let params = [];

  if (type) {
    sql += ' AND item_type = ?'; params.push(type);
  }
  if (status && status !== 'all') {
    sql += ' AND status = ?'; params.push(status);
  } else if (!status) {
    sql += ' AND status = "Open"';
  }
  if (location) {
    sql += ' AND LOWER(location) = LOWER(?)'; params.push(location);
  }
  if (specific_location) {
    sql += ' AND LOWER(specific_location) = LOWER(?)'; params.push(specific_location);
  }
  if (category) {
    sql += ' AND LOWER(category) = LOWER(?)'; params.push(category);
  }

  // Simplified text search
  if (q) {
    sql += ' AND (LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?) OR LOWER(location) LIKE LOWER(?))';
    const s = `%${q}%`;
    params.push(s, s, s);
  }

  if (sort === 'oldest') {
    sql += ' ORDER BY date_posted ASC';
  } else {
    // Relevance sort is complex in pure SQL without FTS, defaulting to newest
    sql += ' ORDER BY date_posted DESC';
  }

  // Get total
  const countSql = sql.replace('SELECT *', 'SELECT count(*) as total');
  const totalRes = await db.prepare(countSql).bind(...params).first();
  const total = totalRes ? totalRes.total : 0;
  
  // Pagination
  sql += ' LIMIT ? OFFSET ?';
  params.push(perPage, (page - 1) * perPage);

  const { results } = await db.prepare(sql).bind(...params).all();

  // Attach images
  for (let i = 0; i < results.length; i++) {
    const images = await db.prepare('SELECT image_url FROM item_image WHERE item_id = ?').bind(results[i].id).all();
    results[i].images = images.results.map(img => img.image_url);
    // Backward compatibility wrapper for old API format
    results[i] = { ...results[i], image_url: results[i].images[0] || null };
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return c.json({
    items: results,
    total: total,
    page: page,
    per_page: perPage,
    total_pages: totalPages
  });
});

// GET /api/search/locations - Hierarchical locations
searchApp.get('/locations', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare('SELECT DISTINCT location, specific_location FROM item WHERE location IS NOT NULL AND location != ""').all();
  
  const locMap = {};
  for (const row of results) {
    const loc = row.location.trim();
    const sub = row.specific_location ? row.specific_location.trim() : null;
    
    if (!locMap[loc]) {
      locMap[loc] = new Set();
    }
    if (sub) {
      locMap[loc].add(sub);
    }
  }

  const output = Object.keys(locMap).sort().map(loc => ({
    name: loc,
    sub_locations: Array.from(locMap[loc]).sort()
  }));

  return c.json(output);
});

// GET /api/search/categories - List of categories
searchApp.get('/categories', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare('SELECT name FROM category ORDER BY name ASC').all();
  return c.json(results.map(row => row.name));
});

export default searchApp;
