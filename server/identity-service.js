import { createHash } from 'node:crypto';
import { decryptIdToken } from './session-service.js';

const hash = (value) => createHash('sha256').update(value).digest();

export async function linkFeideIdentity(pool, { issuer, subject, displayName }) {
  if (![issuer, subject, displayName].every((value) => typeof value === 'string' && value.length > 0)) throw new Error('Incomplete identity');
  const linked = await pool.query('SELECT * FROM app_link_feide_identity($1,$2,$3)', [issuer, subject, displayName]);
  if (!linked.rowCount) throw new Error('Feide identity could not be linked');
  const userId = linked.rows[0].user_id;
  if (linked.rows.length > 1) {
    return { userId, status: 'active', schoolChoices: linked.rows.map((row) => ({ schoolId: row.school_id, role: row.member_role, grantId: row.school_grant_id, name: row.school_name })) };
  }
  const result = linked.rows[0];
  return {
    userId,
    status: result.account_status,
    membership: result.school_id ? { schoolId: result.school_id, role: result.member_role, grantId: result.school_grant_id, name: result.school_name } : null,
  };
}

export async function redeemClassInvite(pool, journal, { userId, code, sessionTokenHash, sessionSecret }) {
  if (typeof code !== 'string' || code.length < 20 || code.length > 100) throw new Error('Invitation code is invalid or expired');
  let invite;
  try { invite = await pool.query('SELECT app_lookup_class_invite($1,$2,$3) AS id', [hash(code), userId, sessionTokenHash]); }
  catch (error) { throw error; }
  const inviteId = invite.rows[0]?.id;
  if (!inviteId || await journal.isRevoked(inviteId)) throw Object.assign(new Error('Invitation code is invalid or expired'), { code: 'INVITE_INVALID' });
  await journal.revoke(inviteId, 'class_invitation_used');
  const result = await pool.query('SELECT * FROM app_redeem_class_invite($1,$2,$3)', [hash(code), userId, sessionTokenHash]);
  if (result.rowCount !== 1) throw Object.assign(new Error('Invitation code is invalid, expired or already used'), { code: 'INVITE_INVALID' });
  return { ...result.rows[0], idToken: decryptIdToken(result.rows[0].encrypted_logout_token, sessionSecret) };
}

export async function redeemSchoolInvite(pool, journal, { userId, code, sessionTokenHash, sessionSecret }) {
  if (typeof code !== 'string' || code.length < 20 || code.length > 100) throw new Error('Invitation code is invalid or expired');
  let invite;
  try { invite = await pool.query('SELECT app_lookup_school_invite($1,$2,$3) AS id', [hash(code), userId, sessionTokenHash]); }
  catch (error) { throw error; }
  const inviteId = invite.rows[0]?.id;
  if (!inviteId || await journal.isRevoked(inviteId)) throw Object.assign(new Error('Invitation code is invalid or expired'), { code: 'INVITE_INVALID' });
  await journal.revoke(inviteId, 'school_invitation_used');
  let result;
  try { result = await pool.query('SELECT * FROM app_redeem_school_invite($1,$2,$3)', [hash(code), userId, sessionTokenHash]); }
  catch (error) {
    if (error.code === '28000') error.code = 'INVITE_INVALID';
    throw error;
  }
  if (result.rowCount !== 1) throw Object.assign(new Error('Invitation code is invalid, expired or already used'), { code: 'INVITE_INVALID' });
  return { ...result.rows[0], idToken: decryptIdToken(result.rows[0].encrypted_logout_token, sessionSecret) };
}
