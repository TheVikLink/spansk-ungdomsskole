import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes, timingSafeEqual } from 'node:crypto';

const hash = (value) => createHash('sha256').update(value).digest();
export const hashSessionToken = hash;

function encryptionKey(secret) {
  return Buffer.from(hkdfSync('sha256', Buffer.from(secret), Buffer.from('spansk123-session-v1'), Buffer.from('encrypted-logout-id-token'), 32));
}

export function encryptIdToken(token, secret, random = randomBytes) {
  if (!token) return null;
  const iv = random(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return Buffer.concat([Buffer.from([1]), iv, cipher.getAuthTag(), ciphertext]);
}

export function decryptIdToken(record, secret) {
  if (!record) return null;
  const value = Buffer.from(record);
  if (value.length < 30 || value[0] !== 1) throw new Error('Unsupported encrypted token format');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(secret), value.subarray(1, 13));
  decipher.setAuthTag(value.subarray(13, 29));
  return Buffer.concat([decipher.update(value.subarray(29)), decipher.final()]).toString('utf8');
}

export function createSessionService(pool, config, { random = randomBytes, now = () => new Date() } = {}) {
  return {
    async create({ userId, schoolId, role, idToken, acr = null, ttlSeconds = 8 * 60 * 60 }) {
      const token = random(32).toString('base64url');
      const csrfToken = random(32).toString('base64url');
      const expiresAt = new Date(now().getTime() + ttlSeconds * 1000);
      await pool.query(
        'SELECT app_create_session($1,$2,$3,$4,$5,$6,$7,$8)',
        [hash(token), userId, schoolId, role, hash(csrfToken), encryptIdToken(idToken, config.sessionSecret, random), expiresAt, acr],
      );
      return { token, csrfToken, expiresAt };
    },
    async resolve(token) {
      if (typeof token !== 'string' || token.length < 40 || token.length > 100) return null;
      const result = await pool.query(
        'SELECT * FROM app_resolve_session($1,$2)',
        [hash(token), now()],
      );
      const session = result.rows[0];
      if (!session) return null;
      const assurance = await pool.query('SELECT app_session_auth_level($1) AS acr', [hash(token)]);
      return { userId: session.user_id, schoolId: session.school_id, schoolGrantId: session.school_grant_id, role: session.role, displayName: session.display_name, csrfHash: session.csrf_hash, expiresAt: session.expires_at, acr: assurance.rows[0]?.acr ?? null };
    },
    async verifyCsrf(session, supplied) {
      if (!session?.csrfHash || typeof supplied !== 'string' || supplied.length > 100) return false;
      const candidate = hash(supplied);
      const expected = Buffer.from(session.csrfHash);
      return expected.length === candidate.length && timingSafeEqual(expected, candidate);
    },
    async logout(token) {
      if (typeof token !== 'string' || token.length < 40 || token.length > 100) return false;
      const result = await pool.query(
        'SELECT app_logout_session($1,$2) AS encrypted_id_token',
        [hash(token), now()],
      );
      return result.rows[0]?.encrypted_id_token ? { idToken: decryptIdToken(result.rows[0].encrypted_id_token, config.sessionSecret) } : null;
    },
  };
}
