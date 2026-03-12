/**
 * JWT Authentication utilities for Cloudflare Workers.
 * Uses Web Crypto API (available in Workers runtime).
 */

const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' };

/** Import a secret string as a CryptoKey */
async function getKey(secret) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(secret), ALGORITHM, false, ['sign', 'verify']);
}

/** Base64url encode */
function b64url(buf) {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Base64url decode */
function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * Create a JWT token
 * @param {object} payload - data to encode
 * @param {string} secret - JWT secret
 * @param {number} expiresInHours - token lifetime in hours (default 24)
 */
export async function signJWT(payload, secret, expiresInHours = 24) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInHours * 3600,
  };

  const enc = new TextEncoder();
  const headerB64 = b64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = b64url(enc.encode(JSON.stringify(fullPayload)));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(dataToSign));

  return `${dataToSign}.${b64url(sig)}`;
}

/**
 * Verify and decode a JWT token
 * @returns {object|null} decoded payload or null if invalid
 */
export async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const dataToVerify = `${headerB64}.${payloadB64}`;

    const key = await getKey(secret);
    const enc = new TextEncoder();
    const sig = b64urlDecode(sigB64);

    const valid = await crypto.subtle.verify('HMAC', key, sig, enc.encode(dataToVerify));
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)));

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
 * Hono middleware: extract user from JWT cookie or Authorization header.
 * Sets c.set('user', { id, username, is_admin }) if authenticated.
 */
export function authMiddleware(optional = false) {
  return async (c, next) => {
    let token = null;

    // Try cookie first
    const cookie = c.req.header('Cookie') || '';
    const match = cookie.match(/token=([^;]+)/);
    if (match) token = match[1];

    // Fallback: Authorization header
    const authHeader = c.req.header('Authorization') || '';
    console.log('[AuthMiddleware] Checking incoming request to:', c.req.path);
    console.log('[AuthMiddleware] Authorization Header:', authHeader);
    
    if (!token) {
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (token) {
      const payload = await verifyJWT(token, c.env.JWT_SECRET);
      if (payload) {
        c.set('user', payload);
        c.set('userId', payload.id);
      } else {
        console.warn('Invalid JWT Token detected in authMiddleware.');
      }
    } else {
      console.warn('No token found. Auth header:', authHeader);
    }

    if (!optional && !c.get('user')) {
      // Backend is now API only, always 401 JSON
      return c.json({ success: false, error: 'Unauthorized', message: 'Bạn cần đăng nhập để thực hiện hành động này.' }, 401);
    }

    await next();
  };
}

/**
 * Hono middleware: require admin privileges
 */
export function adminMiddleware() {
  return async (c, next) => {
    const user = c.get('user');
    if (!user || !user.is_admin) {
      return c.json({ error: 'Forbidden - Admin required' }, 403);
    }
    await next();
  };
}

/**
 * Simple password hashing using Web Crypto (PBKDF2).
 * Compatible format for Cloudflare Workers (no native bcrypt).
 */
export async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${saltHex}:${hashHex}`;
}

export async function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('pbkdf2:')) return false;
  const [, saltHex, hashHex] = stored.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(h => parseInt(h, 16)));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const computedHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computedHex === hashHex;
}
