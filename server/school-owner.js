import { z } from 'zod';

const uuid = z.string().uuid();
const operatorId = z.string().regex(/^[A-Za-z0-9@._-]{2,80}$/u);
const authorizationReference = z.string().regex(/^[A-Za-z0-9._/-]{4,120}$/u);

/** Journal each current school-access grant durably before blocking the owner in the school database. */
export async function blockSchoolOwner(pool, journal, request) {
  const parsed = z.object({ ownerId: uuid, operatorId, authorizationReference }).safeParse(request);
  if (!parsed.success) throw new Error('Verified school-owner block details are required');
  const { ownerId, operatorId: actor, authorizationReference: reference } = parsed.data;
  const client = pool.connect ? await pool.connect() : pool;
  let inTransaction = false;
  try {
    await client.query('BEGIN');
    inTransaction = true;
    const locked = await client.query('SELECT * FROM app_lock_school_owner_access_grants($1)', [ownerId]);
    if (!locked.rowCount) throw new Error('School owner was not found');
    if (locked.rows[0].owner_status !== 'active') {
      await client.query('ROLLBACK');
      inTransaction = false;
      return { blocked: false, schools: 0 };
    }
    const schools = locked.rows.map((row) => row.access_grant_id).filter(Boolean);
    for (const grantId of schools) await journal.revoke(grantId, 'school_blocked');
    const blocked = await client.query('SELECT app_block_school_owner($1,$2,$3) AS blocked', [ownerId, actor, reference]);
    if (!blocked.rows[0]?.blocked) throw new Error('School owner changed while the block was being applied; access grants remain revoked');
    await client.query('COMMIT');
    inTransaction = false;
    return { blocked: true, schools: schools.length };
  } catch (error) {
    if (inTransaction) await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    if (client !== pool) client.release();
  }
}
