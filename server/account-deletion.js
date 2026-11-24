import { z } from 'zod';
import { randomUUID } from 'node:crypto';

const uuid = z.string().uuid();

/**
 * Delete the authenticated user's account data. The external revocation journal
 * is written before the school database commit, so old sessions fail closed
 * and a restore can replay this deletion if the transaction/backup is stale.
 */
export async function deleteOwnAccount(pool, journal, userId) {
  const parsed = uuid.safeParse(userId);
  if (!parsed.success) throw new Error('Invalid account identifier');
  const client = pool.connect ? await pool.connect() : pool;
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.user_id',$1,true)", [userId]);
    // Locks identity then account in the same order as identity linking. Keep
    // the lock through the external journal write and local transaction.
    const prepared = await client.query('SELECT app_prepare_own_account_deletion($1) AS deletable', [userId]);
    if (!prepared.rows[0].deletable) {
      await client.query('ROLLBACK');
      return { deleted: false };
    }

    // This UUID is an internal pseudonymous account key; no identity or
    // learning history is written to the separate, append-only journal.
    await journal.revoke(randomUUID(), 'user_deleted', userId);
    await client.query('SELECT app_delete_own_account($1)', [userId]);
    await client.query('COMMIT');
    return { deleted: true };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    if (client !== pool) client.release();
  }
}

/** Idempotent replay against a restored snapshot, before it is reopened. */
export async function replayAccountDeletion(client, userId) {
  const user = await client.query('SELECT 1 FROM app_user WHERE id=$1 FOR UPDATE', [userId]);
  if (!user.rowCount) return false;
  await client.query("UPDATE app_user SET status='deleted',display_name='Slettet konto' WHERE id=$1", [userId]);
  await client.query('DELETE FROM feide_identity WHERE user_id=$1', [userId]);
  await client.query("UPDATE school_membership SET status='revoked' WHERE user_id=$1 AND status='active'", [userId]);
  await client.query("UPDATE class_membership SET status='revoked' WHERE user_id=$1 AND status IN ('active','pending')", [userId]);
  await client.query('DELETE FROM assignment_recipient WHERE student_id=$1', [userId]);
  await client.query('DELETE FROM learning_event WHERE student_id=$1', [userId]);
  await client.query('UPDATE app_session SET revoked_at=coalesce(revoked_at,now()),encrypted_id_token=NULL,acr=NULL WHERE user_id=$1', [userId]);
  return true;
}
