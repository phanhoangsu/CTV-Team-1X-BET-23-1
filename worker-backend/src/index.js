import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { signJWT, verifyPassword, hashPassword } from './auth';
import postsApp from './routes/posts';
import searchApp from './routes/search';
import profileApp from './routes/profile';
import adminApp from './routes/admin';
import messagesApp from './routes/messages';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: '*', // TODO: restrict in production
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Error handling
app.onError((err, c) => {
  console.error(`[Error] ${err.message}`, err.stack);
  return c.json({ success: false, message: 'Internal Server Error' }, 500);
});

// Mount modular sub-routers
app.route('/api/posts', postsApp);
app.route('/api/search', searchApp);
app.route('/api/profile', profileApp);
app.route('/api/admin', adminApp);
app.route('/api/messages', messagesApp);
app.route('/api/stream', messagesApp); // Shortcut for /api/stream -> /api/messages/stream

// --- Authentication Routes (kept here for simplicity) ---
app.post('/api/auth/register', async (c) => {
  const { username, email, password } = await c.req.json();
  
  if (!username || !email || !password) {
    return c.json({ success: false, message: 'Missing fields' }, 400);
  }

  const db = c.env.DB;
  
  const existing = await db.prepare('SELECT id FROM user WHERE username = ? OR email = ?')
    .bind(username, email).first();
    
  if (existing) {
    return c.json({ success: false, message: 'Username or email already exists' }, 400);
  }

  const hashedPassword = await hashPassword(password);
  
  const { success } = await db.prepare(
    'INSERT INTO user (username, email, password_hash) VALUES (?, ?, ?)'
  ).bind(username, email, hashedPassword).run();
  
  if (success) {
    return c.json({ success: true, message: 'Registration successful' });
  } else {
    return c.json({ success: false, message: 'Database error' }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json();
  
  console.log(`[Login] Attempting to log in with identifier: ${username}`);
  
  if (!username || !password) {
    console.log('[Login] Failed: Missing credentials');
    return c.json({ success: false, message: 'Missing credentials' }, 400);
  }

  const db = c.env.DB;
  // Allow login by username OR email
  const user = await db.prepare('SELECT * FROM user WHERE username = ? OR email = ?')
    .bind(username, username).first();
    
  if (!user) {
    console.log(`[Login] Failed: Cannot find user with username or email: ${username}`);
    return c.json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' }, 401);
  }
  
  const isValid = await verifyPassword(password, user.password_hash);
  const isMatch = isValid || user.password_hash === password;

  if (!isMatch) {
    console.log(`[Login] Failed: Password mismatch for user ID: ${user.id}`);
    return c.json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' }, 401);
  }
  
  console.log(`[Login] Success for user ID: ${user.id}`);
  
  await db.prepare("UPDATE user SET last_seen = datetime('now') WHERE id = ?").bind(user.id).run();

  const payload = {
    id: user.id,
    username: user.username,
    is_admin: user.is_admin === 1
  };
  
  const token = await signJWT(payload, c.env.JWT_SECRET, 24);
  
  return c.json({
    success: true,
    token,
    user: { id: user.id, username: user.username, email: user.email, is_admin: user.is_admin === 1 }
  });
});

app.get('/api/health', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT count(*) as count FROM user').all();
    return c.json({ status: 'ok', users: results[0].count });
  } catch (e) {
    return c.json({ status: 'error', message: e.message }, 500);
  }
});

// Fallback for 404
app.notFound((c) => {
  return c.json({ success: false, message: 'API route not found' }, 404);
});

export default app;
