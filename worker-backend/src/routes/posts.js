/**
 * Posts routes - CRUD for Lost/Found items
 * Replaces: backend/app/posts/view|create|delete|update/routes.py
 */
import { Hono } from 'hono';
import { authRequired } from '../middleware/auth.js';
import { uploadToCloudinary, deleteFromCloudinary, extractPublicId } from '../utils/cloudinary.js';
import { isSpam, fitData } from '../services/spam.js';

const posts = new Hono();

/**
 * Helper: convert D1 item row to API object
 */
async function itemToDict(db, item) {
  // Get images for this item
  const images = await db.prepare(
    'SELECT image_url FROM item_image WHERE item_id = ?'
  ).bind(item.id).all();

  // Get username
  const user = await db.prepare(
    'SELECT username FROM user WHERE id = ?'
  ).bind(item.user_id).first();

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
}

/**
 * GET /api/posts - List all posts (with optional search)
 */
posts.get('/', async (c) => {
  const query = (c.req.query('q') || '').trim();
  let items;

  if (query) {
    const pattern = `%${query}%`;
    items = await c.env.DB.prepare(
      `SELECT * FROM item 
       WHERE title LIKE ? OR description LIKE ? OR location LIKE ? 
       ORDER BY date_posted DESC`
    ).bind(pattern, pattern, pattern).all();
  } else {
    items = await c.env.DB.prepare(
      'SELECT * FROM item ORDER BY date_posted DESC'
    ).all();
  }

  const results = await Promise.all(
    items.results.map(item => itemToDict(c.env.DB, item))
  );

  return c.json({ success: true, items: results });
});

/**
 * GET /api/posts/:id - Get post detail
 */
posts.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const item = await c.env.DB.prepare('SELECT * FROM item WHERE id = ?').bind(id).first();

  if (!item) {
    return c.json({ success: false, message: 'Bài viết không tồn tại.' }, 404);
  }

  const data = await itemToDict(c.env.DB, item);
  return c.json({ success: true, data });
});

/**
 * POST /api/posts - Create a new post
 */
posts.post('/', authRequired(), async (c) => {
  const user = c.get('user');
  const contentType = c.req.header('Content-Type') || '';

  let title, description, location, specific_location, category, item_type, contact_info, incident_date;
  let files = [];

  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData();
    title = formData.get('title');
    description = formData.get('description');
    location = formData.get('location');
    specific_location = formData.get('specific_location');
    category = formData.get('category');
    item_type = formData.get('item_type');
    contact_info = formData.get('contact_info');
    incident_date = formData.get('incident_date') || null;
    files = formData.getAll('images');
  } else {
    const body = await c.req.json();
    title = body.title;
    description = body.description;
    location = body.location;
    specific_location = body.specific_location;
    category = body.category;
    item_type = body.item_type;
    contact_info = body.contact_info;
    incident_date = body.incident_date || null;
  }

  if (!title || !description || !location || !item_type) {
    return c.json({ success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc.' }, 400);
  }

  // AI Spam Check
  const postText = `${title} ${description}`;
  const allItems = await c.env.DB.prepare(
    'SELECT title, description FROM item'
  ).all();
  const existingTexts = allItems.results.map(i => `${i.title} ${i.description}`);
  fitData(existingTexts);

  const [spam, score] = isSpam(postText);
  if (spam) {
    return c.json({
      success: false,
      message: `Bài viết bị từ chối: Nội dung quá giống với bài viết đã có (Độ trùng lặp: ${score.toFixed(2)}).`,
    }, 400);
  }

  // Insert item
  const result = await c.env.DB.prepare(
    `INSERT INTO item (title, description, location, specific_location, category, item_type, contact_info, incident_date, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(title, description, location, specific_location, category, item_type, contact_info, incident_date, user.id).run();

  const itemId = result.meta.last_row_id;

  // Handle image uploads
  const savedImages = [];
  if (files.length > 0 && c.env.CLOUDINARY_URL) {
    for (const file of files) {
      if (file && file.size > 0) {
        try {
          const uploadResult = await uploadToCloudinary(file, c.env.CLOUDINARY_URL);
          const imageUrl = uploadResult.secure_url;

          await c.env.DB.prepare(
            'INSERT INTO item_image (image_url, item_id) VALUES (?, ?)'
          ).bind(imageUrl, itemId).run();

          savedImages.push(imageUrl);
        } catch (e) {
          console.error('Error uploading image:', e);
        }
      }
    }

    // Set primary image
    if (savedImages.length > 0) {
      await c.env.DB.prepare(
        'UPDATE item SET image_url = ? WHERE id = ?'
      ).bind(savedImages[0], itemId).run();
    }
  }

  // Log action
  await c.env.DB.prepare(
    'INSERT INTO action_log (user_id, action, details) VALUES (?, ?, ?)'
  ).bind(user.id, 'Đăng bài', `Tiêu đề: ${title}`).run();

  return c.json({
    success: true,
    message: 'Đăng tin thành công!',
    item_id: itemId,
  });
});

/**
 * PUT /api/posts/:id - Update a post
 */
posts.put('/:id', authRequired(), async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));

  const item = await c.env.DB.prepare('SELECT * FROM item WHERE id = ?').bind(id).first();
  if (!item) {
    return c.json({ success: false, message: 'Bài viết không tồn tại.' }, 404);
  }

  // Check permission
  if (item.user_id !== user.id && !user.is_admin) {
    return c.json({ success: false, message: 'Bạn không có quyền chỉnh sửa bài viết này.' }, 403);
  }

  const contentType = c.req.header('Content-Type') || '';
  let title, description, location, specific_location, category, item_type, contact_info, status, incident_date;
  let files = [];
  let deletedImagesJson = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData();
    title = formData.get('title') || item.title;
    description = formData.get('description') || item.description;
    location = formData.get('location') || item.location;
    specific_location = formData.get('specific_location');
    category = formData.get('category');
    item_type = formData.get('item_type') || item.item_type;
    contact_info = formData.get('contact_info');
    status = formData.get('status') || item.status;
    incident_date = formData.get('incident_date') || item.incident_date;
    files = formData.getAll('images');
    deletedImagesJson = formData.get('deleted_images');
  } else {
    const body = await c.req.json();
    title = body.title || item.title;
    description = body.description || item.description;
    location = body.location || item.location;
    specific_location = body.specific_location;
    category = body.category;
    item_type = body.item_type || item.item_type;
    contact_info = body.contact_info;
    status = body.status || item.status;
    incident_date = body.incident_date || item.incident_date;
    deletedImagesJson = body.deleted_images ? JSON.stringify(body.deleted_images) : null;
  }

  // Handle deleted images
  if (deletedImagesJson) {
    try {
      const deletedImages = JSON.parse(deletedImagesJson);
      for (const imgUrl of deletedImages) {
        await c.env.DB.prepare(
          'DELETE FROM item_image WHERE image_url = ? AND item_id = ?'
        ).bind(imgUrl, id).run();

        // Delete from Cloudinary
        if (imgUrl.startsWith('http') && c.env.CLOUDINARY_URL) {
          const publicId = extractPublicId(imgUrl);
          if (publicId) {
            try { await deleteFromCloudinary(publicId, c.env.CLOUDINARY_URL); } catch {}
          }
        }
      }
    } catch (e) {
      console.error('Error processing deleted_images:', e);
    }
  }

  // Handle new image uploads
  if (files.length > 0 && c.env.CLOUDINARY_URL) {
    for (const file of files) {
      if (file && file.size > 0) {
        try {
          const uploadResult = await uploadToCloudinary(file, c.env.CLOUDINARY_URL);
          const imageUrl = uploadResult.secure_url;

          await c.env.DB.prepare(
            'INSERT INTO item_image (image_url, item_id) VALUES (?, ?)'
          ).bind(imageUrl, id).run();
        } catch (e) {
          console.error('Error uploading image:', e);
        }
      }
    }
  }

  // Update primary image
  const allImages = await c.env.DB.prepare(
    'SELECT image_url FROM item_image WHERE item_id = ?'
  ).bind(id).all();

  const primaryImage = allImages.results.length > 0 ? allImages.results[0].image_url : null;

  // Update item
  await c.env.DB.prepare(
    `UPDATE item SET title=?, description=?, location=?, specific_location=?, category=?, 
     item_type=?, contact_info=?, status=?, incident_date=?, image_url=? WHERE id=?`
  ).bind(title, description, location, specific_location, category, item_type, contact_info, status, incident_date, primaryImage, id).run();

  // Log action
  await c.env.DB.prepare(
    'INSERT INTO action_log (user_id, action, details) VALUES (?, ?, ?)'
  ).bind(user.id, 'Cập nhật bài', `ID: ${id}`).run();

  return c.json({ success: true, message: 'Cập nhật thành công!' });
});

/**
 * DELETE /api/posts/:id - Delete a post
 */
posts.delete('/:id', authRequired(), async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));

  const item = await c.env.DB.prepare('SELECT * FROM item WHERE id = ?').bind(id).first();
  if (!item) {
    return c.json({ success: false, message: 'Bài viết không tồn tại.' }, 404);
  }

  // Check permission
  if (!user.is_admin && user.id !== item.user_id) {
    return c.json({ success: false, message: 'Bạn không có quyền xóa bài này.' }, 403);
  }

  // Log the deletion
  const actionType = user.is_admin && user.id !== item.user_id ? 'Admin Xóa bài' : 'Người dùng xóa bài';
  await c.env.DB.prepare(
    'INSERT INTO action_log (user_id, action, details) VALUES (?, ?, ?)'
  ).bind(user.id, actionType, `Đã xóa bài: ${item.title}`).run();

  // Delete images from Cloudinary
  if (c.env.CLOUDINARY_URL) {
    const images = await c.env.DB.prepare(
      'SELECT image_url FROM item_image WHERE item_id = ?'
    ).bind(id).all();

    for (const img of images.results) {
      const publicId = extractPublicId(img.image_url);
      if (publicId) {
        try { await deleteFromCloudinary(publicId, c.env.CLOUDINARY_URL); } catch {}
      }
    }
  }

  // Delete item (cascade deletes item_image)
  await c.env.DB.prepare('DELETE FROM item_image WHERE item_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM item WHERE id = ?').bind(id).run();

  return c.json({ success: true, message: 'Đã xóa bài đăng.' });
});

/**
 * POST /api/posts/:id/status - Update post status
 */
posts.post('/:id/status', authRequired(), async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));

  const item = await c.env.DB.prepare('SELECT * FROM item WHERE id = ?').bind(id).first();
  if (!item) {
    return c.json({ success: false, message: 'Bài viết không tồn tại.' }, 404);
  }

  if (item.user_id !== user.id && !user.is_admin) {
    return c.json({ success: false, message: 'Không có quyền thực hiện' }, 403);
  }

  const { status } = await c.req.json();
  if (!status) {
    return c.json({ success: false, message: 'Dữ liệu không hợp lệ' }, 400);
  }

  await c.env.DB.prepare('UPDATE item SET status = ? WHERE id = ?').bind(status, id).run();

  return c.json({ success: true, message: 'Cập nhật trạng thái thành công' });
});

export default posts;
