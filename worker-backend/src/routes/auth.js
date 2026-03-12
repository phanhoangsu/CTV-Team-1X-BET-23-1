/**
 * Auth routes - Login, Register, Logout
 * Replaces: backend/app/auth/login/routes.py, register/routes.py, logout/routes.py
 */
import { Hono } from 'hono';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { createToken, authRequired, getAvatarUrl } from '../middleware/auth.js';

const auth = new Hono();

/**
 * POST /api/auth/register
 */
auth.post('/register', async (c) => {
  const { username, email, password } = await c.req.json();

  if (!username || !email || !password) {
    return c.json({ success: false, message: 'Vui lòng điền đầy đủ thông tin.' }, 400);
  }

  if (password.length < 6) {
    return c.json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự.' }, 400);
  }

  // Check existing username
  const existingUser = await c.env.DB.prepare(
    'SELECT id FROM user WHERE username = ?'
  ).bind(username).first();

  if (existingUser) {
    return c.json({ success: false, message: 'Tên đăng nhập đã tồn tại.' }, 400);
  }

  // Check existing email
  const existingEmail = await c.env.DB.prepare(
    'SELECT id FROM user WHERE email = ?'
  ).bind(email.toLowerCase()).first();

  if (existingEmail) {
    return c.json({ success: false, message: 'Email này đã được sử dụng.' }, 400);
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);

  const result = await c.env.DB.prepare(
    'INSERT INTO user (username, email, password_hash) VALUES (?, ?, ?)'
  ).bind(username, email.toLowerCase(), passwordHash).run();

  return c.json({
    success: true,
    message: 'Tạo tài khoản thành công! Vui lòng đăng nhập.',
  });
});

/**
 * POST /api/auth/login
 */
auth.post('/login', async (c) => {
  const { username, password } = await c.req.json();

  if (!username || !password) {
    return c.json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu.' }, 400);
  }

  // Find user
  const user = await c.env.DB.prepare(
    'SELECT id, username, email, password_hash, is_admin FROM user WHERE username = ?'
  ).bind(username).first();

  if (!user) {
    return c.json({ success: false, message: 'Đăng nhập thất bại. Kiểm tra lại thông tin.' }, 401);
  }

  // Verify password
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return c.json({ success: false, message: 'Đăng nhập thất bại. Kiểm tra lại thông tin.' }, 401);
  }

  // Create JWT
  const secret = c.env.JWT_SECRET || 'dev-secret';
  const token = await createToken(
    { sub: user.id, username: user.username, is_admin: user.is_admin },
    secret
  );

  // Set cookie
  const response = c.json({
    success: true,
    message: 'Đăng nhập thành công!',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: !!user.is_admin,
    },
    token,
  });

  // Set HTTP-only cookie for auth
  c.header('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`);

  return response;
});

/**
 * POST /api/auth/logout
 */
auth.post('/logout', (c) => {
  // Clear auth cookie
  c.header('Set-Cookie', 'auth_token=; Path=/; HttpOnly; Max-Age=0');
  return c.json({ success: true, message: 'Đã đăng xuất.' });
});

/**
 * GET /api/auth/me - Get current user info
 */
auth.get('/me', authRequired(), async (c) => {
  const user = c.get('user');

  // Get unread message count
  const unreadResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM message WHERE recipient_id = ? AND is_read = 0'
  ).bind(user.id).first();

  return c.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name || '',
      phone_number: user.phone_number || '',
      avatar_url: getAvatarUrl(user),
      about_me: user.about_me || '',
      is_admin: !!user.is_admin,
      last_seen: user.last_seen,
    },
    unread_count: unreadResult?.count || 0,
  });
});

export default auth;
