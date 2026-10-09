import crypto from 'crypto';

/**
 * Minimal, dependency-free admin session support.
 *
 * A session is a stateless, HMAC-signed token stored in an httpOnly cookie:
 *
 *     base64url(JSON payload) . base64url(HMAC-SHA256(payload, SESSION_SECRET))
 *
 * The payload carries the admin id/email plus issued-at ("iat") and expiry
 * ("exp") timestamps. Because the cookie is httpOnly and signed server-side,
 * the client cannot forge or read it, and the token cannot be replayed after
 * expiry. Logout clears the cookie.
 *
 * SESSION_SECRET should be set in production (Coolify env). If it is absent we
 * generate an ephemeral secret at boot so the app still runs, but every admin
 * session is invalidated on restart.
 */

const COOKIE_NAME = 'admin_session';
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes, matches the client idle timeout

let secret = process.env.SESSION_SECRET;
if (!secret) {
  secret = crypto.randomBytes(32).toString('hex');
  console.warn(
    '[session] SESSION_SECRET is not set — using an ephemeral secret. ' +
    'Admin sessions will be invalidated on every restart. Set SESSION_SECRET in production.'
  );
}

function sign(payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

/**
 * Create a signed session token for an admin user.
 * @param {{ id: string, email: string }} user
 * @returns {string}
 */
export function createSessionToken(user) {
  const now = Date.now();
  const payload = Buffer.from(
    JSON.stringify({ sub: user.id, email: user.email, iat: now, exp: now + DEFAULT_TTL_MS })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

/**
 * Verify a session token. Returns the decoded payload, or null if the token is
 * missing, malformed, tampered with, or expired.
 * @param {string|undefined} token
 * @returns {{ sub: string, email: string, iat: number, exp: number } | null}
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;

  const idx = token.lastIndexOf('.');
  if (idx < 1) return null;

  const payload = token.slice(0, idx);
  const providedSig = token.slice(idx + 1);
  const expectedSig = sign(payload);

  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data || typeof data.exp !== 'number' || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_TTL_MS = DEFAULT_TTL_MS;

/**
 * Options for the session cookie. `secure` is enabled automatically when
 * NODE_ENV=production (the site is served over HTTPS behind Coolify).
 */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: DEFAULT_TTL_MS,
    path: '/',
  };
}
