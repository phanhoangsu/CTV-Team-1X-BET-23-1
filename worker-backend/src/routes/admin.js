/**
 * Admin routes - Dashboard, Posts management, Logs
 * Replaces: backend/app/admin/dashboard|posts|logs/routes.py
 */
import { Hono } from 'hono';
import { authRequired, adminRequired } from '../middleware/auth.js';

const admin = new Hono();

// All admin routes require auth + admin
admin.use('*', authRequired());
admin.use('*', adminRequired());

/**
 * GET /api/admin/dashboard - Dashboard stats
 */
admin.get('/dashboard', async (c) => {
  const searchQuery = (c.req.query('q') || '').trim();

  // Users
  let users;
  if (searchQuery) {
    const pattern = `%${searchQuery}%`;
    users = await c.env.DB.prepare(
      `SELECT id, username, email, full_name, phone_number, avatar_url, is_admin, last_seen
       FROM user WHERE username LIKE ? OR email LIKE ?`
    ).bind(pattern, pattern).all();
  } else {
    users = await c.env.DB.prepare(
      'SELECT id, username, email, full_name, phone_number, avatar_url, is_admin, last_seen FROM user ORDER BY last_seen DESC'
    ).all();
  }

  // Statistics
  const totalUsers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM user').first();
  const totalItems = await c.env.DB.prepare('SELECT COUNT(*) as count FROM item').first();
  const totalLost = await c.env.DB.prepare("SELECT COUNT(*) as count FROM item WHERE item_type = 'Lost'").first();
  const totalFound = await c.env.DB.prepare("SELECT COUNT(*) as count FROM item WHERE item_type = 'Found'").first();

  // Chart data - items by date (last 7 days with data)
  const lostByDate = await c.env.DB.prepare(
    `SELECT date(date_posted) as d, COUNT(*) as count 
     FROM item WHERE item_type = 'Lost' 
     GROUP BY date(date_posted) ORDER BY d DESC LIMIT 7`
  ).all();

  const foundByDate = await c.env.DB.prepare(
    `SELECT date(date_posted) as d, COUNT(*) as count 
     FROM item WHERE item_type = 'Found' 
     GROUP BY date(date_posted) ORDER BY d DESC LIMIT 7`
  ).all();

  // Merge dates
  const dateMap = {};
  for (const row of lostByDate.results) {
    if (!dateMap[row.d]) dateMap[row.d] = { lost: 0, found: 0 };
    dateMap[row.d].lost = row.count;
  }
  for (const row of foundByDate.results) {
    if (!dateMap[row.d]) dateMap[row.d] = { lost: 0, found: 0 };
    dateMap[row.d].found = row.count;
  }

  const sortedDates = Object.keys(dateMap).sort();
  const chartLabels = sortedDates.slice(-7);
  const chartLostData = chartLabels.map(d => dateMap[d]?.lost || 0);
  const chartFoundData = chartLabels.map(d => dateMap[d]?.found || 0);

  return c.json({
    success: true,
    stats: {
      total_users: totalUsers?.count || 0,
      total_items: totalItems?.count || 0,
      total_lost: totalLost?.count || 0,
      total_found: totalFound?.count || 0,
    },
    chart: {
      labels: chartLabels,
      lost_data: chartLostData,
      found_data: chartFoundData,
    },
    users: users.results.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      full_name: u.full_name || '',
      is_admin: !!u.is_admin,
      last_seen: u.last_seen,
    })),
    search_query: searchQuery,
  });
});

/**
 * GET /api/admin/posts - All posts for admin
 */
admin.get('/posts', async (c) => {
  const items = await c.env.DB.prepare(
    `SELECT i.*, u.username 
     FROM item i JOIN user u ON i.user_id = u.id
     ORDER BY i.date_posted DESC`
  ).all();

  return c.json({
    success: true,
    items: items.results.map(i => ({
      id: i.id,
      title: i.title,
      description: i.description,
      location: i.location,
      item_type: i.item_type,
      status: i.status,
      date_posted: i.date_posted,
      image_url: i.image_url,
      user: i.username,
      user_id: i.user_id,
    })),
  });
});

/**
 * GET /api/admin/logs - Action logs
 */
admin.get('/logs', async (c) => {
  const logs = await c.env.DB.prepare(
    `SELECT l.*, u.username 
     FROM action_log l JOIN user u ON l.user_id = u.id
     ORDER BY l.timestamp DESC`
  ).all();

  return c.json({
    success: true,
    logs: logs.results.map(l => ({
      id: l.id,
      user_id: l.user_id,
      username: l.username,
      action: l.action,
      details: l.details,
      timestamp: l.timestamp,
    })),
  });
});

export default admin;
