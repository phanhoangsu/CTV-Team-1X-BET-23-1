/**
 * Password hashing using Web Crypto API (PBKDF2)
 * Replaces werkzeug.security.generate_password_hash / check_password_hash
 */

const ITERATIONS = 100000;
const KEY_LENGTH = 32;
const ALGORITHM = 'PBKDF2';

function arrayBufferToHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToArrayBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

/**
 * Hash a password using PBKDF2-SHA256
 * @param {string} password 
 * @returns {Promise<string>} Format: "pbkdf2:sha256:iterations$salt$hash"
 */
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = arrayBufferToHex(salt);

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    ALGORITHM,
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: ALGORITHM,
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  const hashHex = arrayBufferToHex(derivedBits);
  return `pbkdf2:sha256:${ITERATIONS}$${saltHex}$${hashHex}`;
}

/**
 * Verify a password against a stored hash
 * @param {string} password 
 * @param {string} storedHash Format: "pbkdf2:sha256:iterations$salt$hash"
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash) {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;

    const meta = parts[0]; // "pbkdf2:sha256:iterations"
    const saltHex = parts[1];
    const hashHex = parts[2];

    const iterations = parseInt(meta.split(':')[2]) || ITERATIONS;
    const salt = new Uint8Array(hexToArrayBuffer(saltHex));

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      ALGORITHM,
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: ALGORITHM,
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      KEY_LENGTH * 8
    );

    const computedHex = arrayBufferToHex(derivedBits);
    return computedHex === hashHex;
  } catch {
    return false;
  }
}
