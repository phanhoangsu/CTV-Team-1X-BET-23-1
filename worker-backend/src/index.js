/**
 * F-LostFound API - Cloudflare Worker Entry Point
 * Main application using Hono framework
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Route modules
import auth from './routes/auth.js';
import posts from './routes/posts.js';
import messages from './routes/messages.js';
import admin from './routes/admin.js';
import profile from './routes/profile.js';
import search from './routes/search.js';

const app = new Hono();

// ───────────────── Global Middleware ─────────────────

// CORS - allow frontend from Cloudflare Pages
app.use('*', cors({
  origin: (origin) => {
    // Allow requests from any Cloudflare Pages domain, localhost, or no origin (same-origin)
    if (!origin) return '*';
    if (origin.includes('.pages.dev')) return origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return origin;
    // Allow custom domains - add your domain here
    return origin;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ───────────────── Health Check ─────────────────

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'F-LostFound API',
    runtime: 'Cloudflare Workers',
    timestamp: new Date().toISOString(),
  });
});

// ───────────────── Mount Routes ─────────────────

app.route('/api/auth', auth);
app.route('/api/posts', posts);
app.route('/api/messages', messages);
app.route('/api/admin', admin);
app.route('/api/profile', profile);
app.route('/api/search', search);

// ───────────────── 404 Handler ─────────────────

app.notFound((c) => {
  return c.json({ error: 'Endpoint không tồn tại.' }, 404);
});

// ───────────────── Error Handler ─────────────────

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({
    error: 'Đã xảy ra lỗi server. Vui lòng thử lại sau.',
    details: c.env.ENVIRONMENT === 'development' ? err.message : undefined,
  }, 500);
});

export default app;
