/**
 * JWT Auth Middleware for Hono
 * Replaces Flask-Login session-based authentication
 */

const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' };

/**
 * Create a JWT token
 */
export async function createToken(payload, secret, expiresInHours = 24 * 7) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInHours * 3600,
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(fullPayload)).replace(/=/g, '');
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    ALGORITHM,
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    ALGORITHM.name,
    key,
    new TextEncoder().encode(signingInput)
  );

  const encodedSig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${signingInput}.${encodedSig}`;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSig] = parts;
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      ALGORITHM,
      false,
      ['verify']
    );

    // Decode signature
    const sigB64 = encodedSig.replace(/-/g, '+').replace(/_/g, '/');
    const sigPadded = sigB64 + '='.repeat((4 - (sigB64.length % 4)) % 4);
    const sigBytes = Uint8Array.from(atob(sigPadded), c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify(
      ALGORITHM.name,
      key,
      sigBytes,
      new TextEncoder().encode(signingInput)
    );

    if (!valid) return null;

    // Decode payload
    const payloadPadded = encodedPayload + '='.repeat((4 - (encodedPayload.length % 4)) % 4);
    const payload = JSON.parse(atob(payloadPadded));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Get JWT token from request (cookie or Authorization header)
 */
function getTokenFromRequest(c) {
  // Check Authorization header first
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check cookie
  const cookieHeader = c.req.header('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    if (cookies['auth_token']) {
      return cookies['auth_token'];
    }
  }

  return null;
}

/**
 * Auth middleware - requires valid JWT
 * Sets c.get('user') with the user object from DB
 */
export function authRequired() {
  return async (c, next) => {
    const token = getTokenFromRequest(c);
    if (!token) {
      return c.json({ error: 'Bạn cần đăng nhập để thực hiện thao tác này.' }, 401);
    }

    const secret = c.env.JWT_SECRET || 'dev-secret';
    const payload = await verifyToken(token, secret);
    if (!payload) {
      return c.json({ error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' }, 401);
    }

    // Fetch user from DB
    const user = await c.env.DB.prepare(
      'SELECT id, username, email, full_name, phone_number, avatar_url, about_me, is_admin, last_seen FROM user WHERE id = ?'
    ).bind(payload.sub).first();

    if (!user) {
      return c.json({ error: 'Tài khoản không tồn tại.' }, 401);
    }

    // Update last_seen
    await c.env.DB.prepare(
      "UPDATE user SET last_seen = datetime('now') WHERE id = ?"
    ).bind(user.id).run();

    c.set('user', user);
    await next();
  };
}

/**
 * Admin middleware - requires admin privileges
 */
export function adminRequired() {
  return async (c, next) => {
    const user = c.get('user');
    if (!user || !user.is_admin) {
      return c.json({ error: 'Bạn không có quyền truy cập trang này.' }, 403);
    }
    await next();
  };
}

/**
 * Helper to get avatar URL (same logic as Python model)
 */
export function getAvatarUrl(user) {
  if (user.avatar_url) return user.avatar_url;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=F27123&color=fff&size=128`;
}
