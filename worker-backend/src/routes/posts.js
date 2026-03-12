import { Hono } from 'hono';
import { authMiddleware } from '../auth';

const postsApp = new Hono();

// GET /api/posts - Get list of posts with filtering
postsApp.get('/', async (c) => {
  const db = c.env.DB;
  const q = c.req.query('q') || '';
  const type = c.req.query('type') || '';
  const status = c.req.query('status') || 'Open';
  const page = parseInt(c.req.query('page') || '1', 10);
  const perPage = parseInt(c.req.query('per_page') || '12', 10);
  
  let sql = 'SELECT item.*, user.username as author_name FROM item LEFT JOIN user ON item.user_id = user.id WHERE 1=1';
  const params = [];
  
  if (status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  if (type) {
    sql += ' AND item_type = ?';
    params.push(type);
  }
  
  if (q) {
    sql += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)';
    const searchPattern = `%${q}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }
  
  sql += ' ORDER BY date_posted DESC LIMIT ? OFFSET ?';
  params.push(perPage, (page - 1) * perPage);
  
  const { results } = await db.prepare(sql).bind(...params).all();
  
  // Also fetch images for each post
  for (let i = 0; i < results.length; i++) {
    const images = await db.prepare('SELECT image_url FROM item_image WHERE item_id = ?').bind(results[i].id).all();
    results[i].images = images.results.map(img => img.image_url);
  }
  
  return c.json({ success: true, items: results, page, per_page: perPage });
});

// GET /api/posts/:id - Get a specific post by ID
postsApp.get('/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.env.DB;
  
  const item = await db.prepare('SELECT item.*, user.username as author_name, user.full_name as author_fullname, user.avatar_url FROM item LEFT JOIN user ON item.user_id = user.id WHERE item.id = ?').bind(id).first();
  
  if (!item) {
    return c.json({ success: false, message: 'Item not found' }, 404);
  }
  
  const images = await db.prepare('SELECT image_url FROM item_image WHERE item_id = ?').bind(id).all();
  item.images = images.results.map(img => img.image_url);
  
  return c.json({ success: true, data: item });
});

// POST /api/posts - Create a new post
postsApp.post('/', authMiddleware(), async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;
  
  // We expect a JSON payload for now. Real file uploads will use FormData.
  // For Cloudflare Workers, a proper file upload solution might use R2 or external Cloudinary.
  // To keep it simple and match Python logic, we accept fields here.
  let data;
  try {
    const contentType = c.req.header('Content-Type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.parseBody();
      data = Object.fromEntries(Object.keys(formData).map(k => [k, formData[k]]));
      // Note: File uploads need special handling to push to Cloudinary - omitted here for brevity, 
      // but in a production Worker we would proxy the file to Cloudinary.
    } else {
      data = await c.req.json();
    }
  } catch (e) {
    return c.json({ success: false, message: 'Invalid request body' }, 400);
  }

  const title = data.title || '';
  const desc = data.description || '';
  const location = data.location || '';
  const specific_location = data.specific_location || '';
  const category = data.category || '';
  const itype = data.item_type || 'Lost';
  const phone_number = data.phone_number || '';
  const facebook_url = data.facebook_url || '';
  const incident_date = data.incident_date || null;
  const status = data.status || 'Open';
  
  const contact = `SĐT: ${phone_number}` + (facebook_url ? ` | FB: ${facebook_url}` : '');
  
  // TODO: AI Spam Check (Placeholder for external service call)
  
  const { success, meta } = await db.prepare(`
    INSERT INTO item 
    (title, description, location, specific_location, category, item_type, contact_info, phone_number, facebook_url, incident_date, status, user_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    title, desc, location, specific_location, category, itype, contact, phone_number, facebook_url, incident_date, status, userId
  ).run();
  
  if (success) {
    const insertedId = meta.last_row_id;
    
    // Log action
    await db.prepare('INSERT INTO action_log (user_id, action, details) VALUES (?, ?, ?)')
      .bind(userId, 'Đăng bài', `Tiêu đề: ${title}`).run();
      
    return c.json({ success: true, message: 'Post created successfully', item_id: insertedId });
  }

  return c.json({ success: false, message: 'Database error' }, 500);
});

// PUT /api/posts/:id - Update an existing post
postsApp.put('/:id', authMiddleware(), async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const user = c.get('user');
  const db = c.env.DB;
  
  const item = await db.prepare('SELECT user_id FROM item WHERE id = ?').bind(id).first();
  if (!item) {
    return c.json({ success: false, message: 'Item not found' }, 404);
  }
  
  if (item.user_id !== userId && !user.is_admin) {
    return c.json({ success: false, message: 'Forbidden' }, 403);
  }
  
  const data = await c.req.json();
  // Here we would run an UPDATE query. To save space, we assume all fields are updated.
  const { title, description, location, specific_location, category, item_type, phone_number, facebook_url, incident_date, status } = data;
  const contact = `SĐT: ${phone_number}` + (facebook_url ? ` | FB: ${facebook_url}` : '');
  
  await db.prepare(`
    UPDATE item SET 
      title = ?, description = ?, location = ?, specific_location = ?, category = ?, 
      item_type = ?, contact_info = ?, phone_number = ?, facebook_url = ?, 
      incident_date = ?, status = ?
    WHERE id = ?
  `).bind(
    title, description, location, specific_location, category, 
    item_type, contact, phone_number, facebook_url, 
    incident_date, status, id
  ).run();
  
  await db.prepare('INSERT INTO action_log (user_id, action, details) VALUES (?, ?, ?)')
    .bind(userId, 'Cập nhật bài', `ID: ${id}`).run();
    
  return c.json({ success: true, message: 'Update successful' });
});

// DELETE /api/posts/:id - Delete a post
postsApp.delete('/:id', authMiddleware(), async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const user = c.get('user');
  const db = c.env.DB;
  
  const item = await db.prepare('SELECT user_id, title FROM item WHERE id = ?').bind(id).first();
  if (!item) {
    return c.json({ success: false, message: 'Item not found' }, 404);
  }
  
  if (item.user_id !== userId && !user.is_admin) {
    return c.json({ success: false, message: 'Forbidden' }, 403);
  }
  
  await db.prepare('DELETE FROM item WHERE id = ?').bind(id).run();
  
  const actionType = (user.is_admin && item.user_id !== userId) ? "Admin Xóa bài" : "Người dùng xóa bài";
  await db.prepare('INSERT INTO action_log (user_id, action, details) VALUES (?, ?, ?)')
    .bind(userId, actionType, `Đã xóa bài: ${item.title}`).run();
    
  return c.json({ success: true, message: 'Deleted successfully' });
});

export default postsApp;
