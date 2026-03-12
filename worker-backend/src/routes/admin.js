import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../auth';

const adminApp = new Hono();

adminApp.use('*', authMiddleware(false), adminMiddleware());

// GET /api/admin/dashboard
adminApp.get('/dashboard', async (c) => {
  const db = c.env.DB;
  
  // Search query
  const q = c.req.query('q') || '';
  
  let userSql = 'SELECT id, username, email, full_name, is_admin, last_seen FROM user';
  let userParams = [];
  if (q) {
    userSql += ' WHERE username LIKE ? OR email LIKE ?';
    const s = `%${q}%`;
    userParams.push(s, s);
  }
  userSql += ' ORDER BY last_seen DESC LIMIT 50';
  
  const { results: users } = await db.prepare(userSql).bind(...userParams).all();
  
  // Stats
  const { results: totalUsers } = await db.prepare('SELECT COUNT(*) as count FROM user').all();
  const { results: totalItems } = await db.prepare('SELECT COUNT(*) as count FROM item').all();
  const { results: totalLost } = await db.prepare('SELECT COUNT(*) as count FROM item WHERE item_type = "Lost"').all();
  const { results: totalFound } = await db.prepare('SELECT COUNT(*) as count FROM item WHERE item_type = "Found"').all();

  // Last 7 days chart stats (simplified)
  // SQLite dates can be grouped manually by substr
  const { results: chartData } = await db.prepare('SELECT substr(date_posted, 1, 10) as date, item_type, COUNT(*) as count FROM item GROUP BY date, item_type ORDER BY date DESC LIMIT 14').all();
  
  return c.json({
    success: true,
    stats: {
      users: totalUsers[0].count,
      items: totalItems[0].count,
      lost: totalLost[0].count,
      found: totalFound[0].count
    },
    users: users,
    chart: chartData
  });
});

// GET /api/admin/posts
adminApp.get('/posts', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare('SELECT item.*, user.username as author_name FROM item JOIN user ON item.user_id = user.id ORDER BY date_posted DESC LIMIT 100').all();
  return c.json({ success: true, items: results });
});

// GET /api/admin/logs
adminApp.get('/logs', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare('SELECT action_log.*, user.username FROM action_log JOIN user ON action_log.user_id = user.id ORDER BY timestamp DESC LIMIT 200').all();
  return c.json({ success: true, logs: results });
});

export default adminApp;
