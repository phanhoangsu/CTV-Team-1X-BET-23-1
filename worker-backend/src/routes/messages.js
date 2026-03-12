/**
 * Messages routes - Chat, Inbox, Polling
 * Replaces: backend/app/messages/chat/routes.py, inbox/routes.py
 * Note: SSE replaced with polling due to Workers limitations
 */
import { Hono } from 'hono';
import { authRequired, getAvatarUrl } from '../middleware/auth.js';

const messages = new Hono();

/**
 * GET /api/messages/inbox - Get conversations list
 */
messages.get('/inbox', authRequired(), async (c) => {
  const user = c.get('user');

  // Get all messages involving current user, ordered by time desc
  const allMsgs = await c.env.DB.prepare(
    `SELECT m.*, 
            s.username as sender_username, s.avatar_url as sender_avatar,
            r.username as recipient_username, r.avatar_url as recipient_avatar
     FROM message m
     JOIN user s ON m.sender_id = s.id
     JOIN user r ON m.recipient_id = r.id
     WHERE m.sender_id = ? OR m.recipient_id = ?
     ORDER BY m.timestamp DESC`
  ).bind(user.id, user.id).all();

  // Build conversations (unique per other user)
  const conversations = {};
  for (const msg of allMsgs.results) {
    const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
    if (!conversations[otherId]) {
      const otherUser = msg.sender_id === user.id
        ? { id: msg.recipient_id, username: msg.recipient_username, avatar_url: msg.recipient_avatar }
        : { id: msg.sender_id, username: msg.sender_username, avatar_url: msg.sender_avatar };

      // Count unread from this user
      const unreadResult = await c.env.DB.prepare(
        'SELECT COUNT(*) as count FROM message WHERE sender_id = ? AND recipient_id = ? AND is_read = 0'
      ).bind(otherId, user.id).first();

      conversations[otherId] = {
        user: {
          id: otherUser.id,
          username: otherUser.username,
          avatar_url: getAvatarUrl(otherUser),
        },
        last_message: {
          body: msg.body,
          timestamp: msg.timestamp,
          sender_id: msg.sender_id,
          is_read: !!msg.is_read,
        },
        unread_count: unreadResult?.count || 0,
      };
    }
  }

  return c.json({
    success: true,
    conversations: Object.values(conversations),
  });
});

/**
 * GET /api/messages/chat/:recipientId - Get chat history
 */
messages.get('/chat/:recipientId', authRequired(), async (c) => {
  const user = c.get('user');
  const recipientId = parseInt(c.req.param('recipientId'));

  // Get recipient info
  const recipient = await c.env.DB.prepare(
    'SELECT id, username, avatar_url, full_name FROM user WHERE id = ?'
  ).bind(recipientId).first();

  if (!recipient) {
    return c.json({ success: false, message: 'Người dùng không tồn tại.' }, 404);
  }

  // Get messages
  const msgs = await c.env.DB.prepare(
    `SELECT * FROM message 
     WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
     ORDER BY timestamp ASC`
  ).bind(user.id, recipientId, recipientId, user.id).all();

  // Mark unread messages as read
  await c.env.DB.prepare(
    'UPDATE message SET is_read = 1 WHERE sender_id = ? AND recipient_id = ? AND is_read = 0'
  ).bind(recipientId, user.id).run();

  return c.json({
    success: true,
    recipient: {
      id: recipient.id,
      username: recipient.username,
      avatar_url: getAvatarUrl(recipient),
      full_name: recipient.full_name || '',
    },
    messages: msgs.results.map(m => ({
      id: m.id,
      sender_id: m.sender_id,
      recipient_id: m.recipient_id,
      body: m.body,
      is_read: !!m.is_read,
      timestamp: m.timestamp,
    })),
  });
});

/**
 * POST /api/messages/send - Send a message
 */
messages.post('/send', authRequired(), async (c) => {
  const user = c.get('user');
  const { recipient_id, message: body } = await c.req.json();

  if (!body || !recipient_id) {
    return c.json({ error: 'Dữ liệu không hợp lệ' }, 400);
  }

  // Check recipient exists
  const recipient = await c.env.DB.prepare(
    'SELECT id FROM user WHERE id = ?'
  ).bind(parseInt(recipient_id)).first();

  if (!recipient) {
    return c.json({ error: 'Người nhận không tồn tại' }, 404);
  }

  const result = await c.env.DB.prepare(
    'INSERT INTO message (sender_id, recipient_id, body) VALUES (?, ?, ?)'
  ).bind(user.id, parseInt(recipient_id), body).run();

  // Get the inserted message
  const msg = await c.env.DB.prepare(
    'SELECT * FROM message WHERE id = ?'
  ).bind(result.meta.last_row_id).first();

  return c.json({
    status: 'ok',
    message: {
      id: msg.id,
      sender_id: msg.sender_id,
      recipient_id: msg.recipient_id,
      body: msg.body,
      timestamp: msg.timestamp,
    },
  });
});

/**
 * GET /api/messages/poll - Poll for new messages (replaces SSE)
 * Query params: since (ISO timestamp) - get messages newer than this
 */
messages.get('/poll', authRequired(), async (c) => {
  const user = c.get('user');
  const since = c.req.query('since') || '2000-01-01T00:00:00';

  // Get new messages for this user
  const newMsgs = await c.env.DB.prepare(
    `SELECT m.*, u.username as sender_name 
     FROM message m 
     JOIN user u ON m.sender_id = u.id
     WHERE m.recipient_id = ? AND m.timestamp > ?
     ORDER BY m.timestamp ASC`
  ).bind(user.id, since).all();

  return c.json({
    messages: newMsgs.results.map(m => ({
      id: m.id,
      sender_id: m.sender_id,
      sender_name: m.sender_name,
      body: m.body,
      timestamp: m.timestamp,
      is_read: !!m.is_read,
    })),
  });
});

/**
 * GET /api/messages/unread-count - Get unread message count
 */
messages.get('/unread-count', authRequired(), async (c) => {
  const user = c.get('user');

  const result = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM message WHERE recipient_id = ? AND is_read = 0'
  ).bind(user.id).first();

  return c.json({ unread_count: result?.count || 0 });
});

export default messages;
