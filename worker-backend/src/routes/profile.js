/**
 * Profile routes - View, Edit, Change password, About, Guide
 * Replaces: backend/app/profile/routes.py
 */
import { Hono } from 'hono';
import { authRequired, getAvatarUrl } from '../middleware/auth.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

const profile = new Hono();

// ───────────────────── Helpers ─────────────────────

/**
 * Validate Vietnamese phone number
 */
function validatePhone(phone) {
  if (!phone) return { ok: true, result: '' };
  let cleaned = phone.replace(/[\s\-]/g, '');

  if (!/^\+?[0-9]+$/.test(cleaned)) {
    return { ok: false, message: 'Số điện thoại chỉ được chứa chữ số (có thể có dấu + ở đầu).' };
  }

  // Normalize +84 → 0
  if (cleaned.startsWith('+84')) cleaned = '0' + cleaned.slice(3);
  else if (cleaned.startsWith('84') && cleaned.length === 11) cleaned = '0' + cleaned.slice(2);

  if (cleaned.length !== 10) {
    return { ok: false, message: 'Số điện thoại Việt Nam phải có đúng 10 chữ số.' };
  }

  const validPrefixes = ['03', '05', '07', '08', '09'];
  if (!validPrefixes.some(p => cleaned.startsWith(p))) {
    return { ok: false, message: 'Đầu số không hợp lệ. Đầu số hợp lệ: 03x, 05x, 07x, 08x, 09x.' };
  }

  return { ok: true, result: cleaned };
}

/**
 * Validate email
 */
function validateEmail(email) {
  email = (email || '').trim().toLowerCase();
  const pattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  if (!pattern.test(email)) {
    return { ok: false, message: 'Email không đúng định dạng. Ví dụ: abc@gmail.com' };
  }

  const domain = email.split('@')[1];
  if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
    return { ok: false, message: 'Tên miền email không hợp lệ.' };
  }

  return { ok: true, result: email };
}

// ───────────────────── Routes ─────────────────────

/**
 * GET /api/profile - Current user profile
 */
profile.get('/', authRequired(), async (c) => {
  const user = c.get('user');

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
  });
});

/**
 * GET /api/profile/activity - User's posts
 */
profile.get('/activity', authRequired(), async (c) => {
  const user = c.get('user');

  const myItems = await c.env.DB.prepare(
    'SELECT * FROM item WHERE user_id = ? ORDER BY date_posted DESC'
  ).bind(user.id).all();

  const lostItems = myItems.results.filter(i => i.item_type === 'Lost');
  const foundItems = myItems.results.filter(i => i.item_type === 'Found');

  return c.json({
    success: true,
    lost_items: lostItems.map(i => ({
      id: i.id, title: i.title, description: i.description,
      location: i.location, status: i.status, image_url: i.image_url,
      date_posted: i.date_posted, item_type: i.item_type,
    })),
    found_items: foundItems.map(i => ({
      id: i.id, title: i.title, description: i.description,
      location: i.location, status: i.status, image_url: i.image_url,
      date_posted: i.date_posted, item_type: i.item_type,
    })),
  });
});

/**
 * PUT /api/profile - Update profile
 */
profile.put('/', authRequired(), async (c) => {
  const user = c.get('user');
  const contentType = c.req.header('Content-Type') || '';

  let full_name, email, phone, about, avatar_url;
  let avatarFile = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData();
    full_name = (formData.get('full_name') || '').trim();
    email = (formData.get('email') || '').trim();
    phone = (formData.get('phone') || '').trim();
    about = (formData.get('about') || '').trim();
    avatar_url = (formData.get('avatar_url') || '').trim();
    avatarFile = formData.get('avatar_file');
  } else {
    const body = await c.req.json();
    full_name = (body.full_name || '').trim();
    email = (body.email || '').trim();
    phone = (body.phone || '').trim();
    about = (body.about || '').trim();
    avatar_url = (body.avatar_url || '').trim();
  }

  // Handle avatar file upload
  let finalAvatarUrl = user.avatar_url;
  if (avatarFile && avatarFile.size > 0 && c.env.CLOUDINARY_URL) {
    try {
      const result = await uploadToCloudinary(avatarFile, c.env.CLOUDINARY_URL, 'flostfound/avatars');
      finalAvatarUrl = result.secure_url;
    } catch (e) {
      console.error('Avatar upload error:', e);
    }
  } else if (avatar_url) {
    finalAvatarUrl = avatar_url;
  }

  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.ok) {
    return c.json({ success: false, message: emailValidation.message }, 400);
  }

  // Check email uniqueness
  const existingEmail = await c.env.DB.prepare(
    'SELECT id FROM user WHERE email = ? AND id != ?'
  ).bind(emailValidation.result, user.id).first();

  if (existingEmail) {
    return c.json({ success: false, message: 'Email này đã được dùng bởi tài khoản khác.' }, 400);
  }

  // Validate phone
  const phoneValidation = validatePhone(phone);
  if (!phoneValidation.ok) {
    return c.json({ success: false, message: phoneValidation.message }, 400);
  }

  // Update user
  await c.env.DB.prepare(
    `UPDATE user SET full_name=?, email=?, phone_number=?, about_me=?, avatar_url=? WHERE id=?`
  ).bind(
    full_name,
    emailValidation.result,
    phoneValidation.result || phone,
    about,
    finalAvatarUrl,
    user.id
  ).run();

  return c.json({ success: true, message: 'Cập nhật hồ sơ thành công!' });
});

/**
 * PUT /api/profile/password - Change password
 */
profile.put('/password', authRequired(), async (c) => {
  const user = c.get('user');
  const { old_password, new_password, confirm_password } = await c.req.json();

  // Get user with password hash
  const fullUser = await c.env.DB.prepare(
    'SELECT password_hash FROM user WHERE id = ?'
  ).bind(user.id).first();

  // Verify old password
  const valid = await verifyPassword(old_password, fullUser.password_hash);
  if (!valid) {
    return c.json({ success: false, message: 'Mật khẩu hiện tại không đúng!' }, 400);
  }

  if (!new_password || new_password.length < 6) {
    return c.json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' }, 400);
  }

  if (new_password !== confirm_password) {
    return c.json({ success: false, message: 'Xác nhận mật khẩu không khớp.' }, 400);
  }

  // Hash new password and update
  const newHash = await hashPassword(new_password);
  await c.env.DB.prepare(
    'UPDATE user SET password_hash = ? WHERE id = ?'
  ).bind(newHash, user.id).run();

  return c.json({ success: true, message: 'Đổi mật khẩu thành công!' });
});

export default profile;
