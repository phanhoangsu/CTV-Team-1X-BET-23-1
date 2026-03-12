import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { authMiddleware } from '../auth';

const messagesApp = new Hono();

messagesApp.use('*', authMiddleware());

// GET /api/messages - List recent chats
messagesApp.get('/', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;

  // Basic query to fetch last message per user interaction
  const sql = `
    SELECT * FROM message 
    WHERE sender_id = ? OR recipient_id = ? 
    ORDER BY timestamp DESC
  `;
  const { results } = await db.prepare(sql).bind(userId, userId).all();

  // Deduplicate to show latest conversation
  const chats = new Map();
  for (const m of results) {
    const otherId = m.sender_id === userId ? m.recipient_id : m.sender_id;
    if (!chats.has(otherId)) {
      chats.set(otherId, m);
    }
  }

  return c.json({ success: true, chats: Array.from(chats.values()) });
});

// GET /api/messages/:id - Fetch message history with a specific user
messagesApp.get('/:id', async (c) => {
  const recipientId = parseInt(c.req.param('id'), 10);
  const userId = c.get('userId');
  const db = c.env.DB;

  const sql = `
    SELECT message.*, sender.username as sender_name 
    FROM message 
    JOIN user sender ON message.sender_id = sender.id 
    WHERE (sender_id = ? AND recipient_id = ?) 
       OR (sender_id = ? AND recipient_id = ?)
    ORDER BY timestamp ASC LIMIT 100
  `;
  const { results } = await db.prepare(sql).bind(userId, recipientId, recipientId, userId).all();

  // Mark all unread messages sent to current_user as read
  await db.prepare('UPDATE message SET is_read = 1 WHERE sender_id = ? AND recipient_id = ?').bind(recipientId, userId).run();

  return c.json({ success: true, messages: results });
});

// POST /api/messages/send
messagesApp.post('/send', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;
  const { recipient_id, message: body } = await c.req.json();

  if (!recipient_id || !body) {
    return c.json({ success: false, message: 'Invalid payload' }, 400);
  }

  const { success, meta } = await db.prepare('INSERT INTO message (sender_id, recipient_id, body) VALUES (?, ?, ?)')
    .bind(userId, recipient_id, body).run();

  // In a real globally distributed system, we would trigger a PubSub event here or write to a queue
  // which the SSE stream on another worker node reads from.

  return c.json({ success, message_id: meta.last_row_id });
});

// GET /api/stream - Realtime Server-Sent Events implementation for Cloudflare Workers
messagesApp.get('/stream', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;

  // The connection stays open. Cloudflare allows up to some amount of time.
  // We periodically poll the DB or just send keepalives depending on constraints.
  // Note: True global realtime on Workers requires Durable Objects. 
  // For this port, we will simulate the SSE stream by polling the DB for unread messages.
  
  return streamSSE(c, async (stream) => {
    // Initial payload
    await stream.writeSSE({
      event: 'connected',
      data: JSON.stringify({ user_id: userId })
    });

    let lastId = 0;
    
    // Get latest max ID initially to not replay old messages
    const { results: initMax } = await db.prepare('SELECT MAX(id) as max_id FROM message').all();
    if (initMax && initMax.length > 0) {
       lastId = initMax[0].max_id || 0;
    }

    try {
      while (true) {
        // Wait 3 seconds (simple polling, acceptable for light demo)
        await stream.sleep(3000);
        
        // Find new messages sent to this user or sent BY this user (to keep sender's chat UI synced if needed)
        // Normally SSE only needs to push inbound, but let's just push inbound notifications.
        const sql = `
          SELECT message.*, sender.username as sender_name 
          FROM message JOIN user sender ON message.sender_id = sender.id 
          WHERE message.id > ? AND (message.recipient_id = ?)
        `;
        const { results: newMsgs } = await db.prepare(sql).bind(lastId, userId).all();
        
        for (const msg of newMsgs) {
          lastId = msg.id;
          
          await stream.writeSSE({
            event: 'receive_message',
            data: JSON.stringify({
              sender_id: msg.sender_id,
              sender_name: msg.sender_name,
              recipient_id: msg.recipient_id,
              message: msg.body,
              timestamp: msg.timestamp
            })
          });

          // Also trigger general notification payload
          await stream.writeSSE({
            event: 'notification',
            data: JSON.stringify({
              sender_id: msg.sender_id,
              sender_name: msg.sender_name,
              message: msg.body
            })
          });
        }
        
        // Keep-alive heartbeat
        await stream.writeSSE({ data: 'keepalive' });
      }
    } catch (e) {
      console.error('SSE Stream aborted manually or by network');
    }
  });
});

export default messagesApp;
