import { Hono } from 'hono';
import { authMiddleware, hashPassword, verifyPassword } from '../auth';

const profileApp = new Hono();

profileApp.use('*', authMiddleware());

// Helper function to validate email
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Helper function to validate VN phone numbers
const validatePhone = (phone) => {
  if (!phone) return true;
  const cleaned = phone.replace(/[\s-]/g, '');
  if (/^0[35789]\d{8}$/.test(cleaned) || /^\+84[35789]\d{8}$/.test(cleaned)) {
    return true;
  }
  return false;
};

// GET /api/profile
profileApp.get('/', async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  
  const userData = await db.prepare('SELECT id, username, email, full_name, phone_number, avatar_url, about_me, is_admin FROM user WHERE id = ?').bind(user.id).first();
  return c.json({ success: true, user: userData });
});

// GET /api/profile/activity
profileApp.get('/activity', async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  
  const items = await db.prepare('SELECT * FROM item WHERE user_id = ? ORDER BY date_posted DESC').bind(user.id).all();
  
  const lostItems = [];
  const foundItems = [];
  
  for (const item of items.results) {
    // Add images for the app 
    const images = await db.prepare('SELECT image_url FROM item_image WHERE item_id = ?').bind(item.id).all();
    item.images = images.results.map(img => img.image_url);
    
    if (item.item_type === 'Lost') lostItems.push(item);
    if (item.item_type === 'Found') foundItems.push(item);
  }
  
  return c.json({ success: true, lost_items: lostItems, found_items: foundItems });
});

// PUT /api/profile (edit profile)
profileApp.put('/', async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  const data = await c.req.json();
  
  const { full_name, email, phone, about, avatar_url } = data;
  
  if (email && !validateEmail(email)) {
    return c.json({ success: false, message: 'Invalid email format' }, 400);
  }
  
  if (phone && !validatePhone(phone)) {
    return c.json({ success: false, message: 'Invalid phone number format' }, 400);
  }
  
  // Check email conflict
  if (email) {
    const existing = await db.prepare('SELECT id FROM user WHERE email = ? AND id != ?').bind(email, user.id).first();
    if (existing) {
      return c.json({ success: false, message: 'Email is already in use' }, 400);
    }
  }

  // Real avatar uploading would go here for multipart forms using Cloudinary
  
  await db.prepare('UPDATE user SET full_name = ?, email = ?, phone_number = ?, about_me = ?, avatar_url = ? WHERE id = ?')
    .bind(full_name || '', email || '', phone || '', about || '', avatar_url || '', user.id).run();
    
  return c.json({ success: true, message: 'Profile updated' });
});

// PUT /api/profile/password
profileApp.put('/password', async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  const { old_password, new_password, confirm_password } = await c.req.json();
  
  if (!old_password || !new_password || !confirm_password) {
    return c.json({ success: false, message: 'All fields are required' }, 400);
  }
  
  if (new_password !== confirm_password) {
    return c.json({ success: false, message: 'New passwords do not match' }, 400);
  }
  
  if (new_password.length < 6) {
    return c.json({ success: false, message: 'Password must be at least 6 characters' }, 400);
  }

  const currentUser = await db.prepare('SELECT password_hash FROM user WHERE id = ?').bind(user.id).first();
  const isValid = await verifyPassword(old_password, currentUser.password_hash) || currentUser.password_hash === old_password;
  
  if (!isValid) {
    return c.json({ success: false, message: 'Incorrect old password' }, 400);
  }
  
  const hashedNew = await hashPassword(new_password);
  await db.prepare('UPDATE user SET password_hash = ? WHERE id = ?').bind(hashedNew, user.id).run();
  
  return c.json({ success: true, message: 'Password updated successfully' });
});

export default profileApp;
