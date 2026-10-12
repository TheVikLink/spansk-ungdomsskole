import { replayAccountDeletion } from './account-deletion.js';

/**
 * Final gate after restoring a school database from a snapshot.
 * The revocation journal stays online and append-only. Its membership
 * revocations are replayed against the restored database before it can reopen.
 */
export async function verifyRestoredSchoolDatabase({ pool, journal, snapshotCheckpoint }) {
  const sequence = Number(snapshotCheckpoint?.sequence);
  const snapshotEntries = Number(snapshotCheckpoint?.entries);
  if (!Number.isSafeInteger(sequence) || sequence < 0 || !Number.isSafeInteger(snapshotEntries) || snapshotEntries < 0) {
    throw new Error('Invalid snapshot journal checkpoint');
  }

  const current = await journal.checkpoint();
  const currentSequence = Number(current.sequence);
  const currentEntries = Number(current.entries);
  if (!Number.isSafeInteger(currentSequence) || !Number.isSafeInteger(currentEntries)
      || currentSequence < sequence || currentEntries < snapshotEntries
      || (currentSequence === sequence && currentEntries !== snapshotEntries)) {
    throw new Error('Revocation journal is behind or inconsistent with the restored snapshot');
  }

  const entries = await journal.entriesThrough(current.sequence);
  if (entries.length !== currentEntries) throw new Error('Revocation journal is incomplete');
  const client = pool.connect ? await pool.connect() : pool;
  try {
    await client.query('BEGIN');
    let reappliedMembershipRevocations = 0;
    let reappliedAccountDeletions = 0;
    let reappliedAccountBlocks = 0;
    let reappliedRetentionDeletions = 0;
    let reappliedSchoolBlocks = 0;
    for (const entry of entries) {
      if (entry.reason === 'user_deleted') {
        if (await replayAccountDeletion(client, entry.subject_id)) reappliedAccountDeletions += 1;
      } else if (entry.reason === 'user_blocked') {
        const blocked = await client.query("UPDATE app_user SET status='blocked' WHERE id=$1 AND status<>'deleted'", [entry.subject_id]);
        await client.query('UPDATE app_session SET revoked_at=coalesce(revoked_at,now()),encrypted_id_token=NULL,acr=NULL WHERE user_id=$1', [entry.subject_id]);
        reappliedAccountBlocks += blocked.rowCount;
      } else if (entry.reason === 'assignment_retention') {
        const deleted = await client.query('DELETE FROM assignment WHERE id=$1', [entry.subject_id]);
        reappliedRetentionDeletions += deleted.rowCount;
      } else if (entry.reason === 'school_blocked') {
        const blocked = await client.query("UPDATE school SET status='blocked' WHERE access_grant_id=$1 AND status='active' RETURNING id", [entry.subject_id]);
        for (const school of blocked.rows) {
          await client.query("UPDATE school_membership SET status='revoked' WHERE school_id=$1 AND status='active'", [school.id]);
          await client.query("UPDATE class_membership SET status='revoked' WHERE school_id=$1 AND status IN ('active','pending')", [school.id]);
          await client.query("UPDATE school_invite SET revoked_at=coalesce(revoked_at,now()) WHERE school_id=$1", [school.id]);
          await client.query("UPDATE class_invite SET used_at=coalesce(used_at,now()) WHERE school_id=$1 AND used_at IS NULL", [school.id]);
          await client.query('UPDATE app_session SET revoked_at=coalesce(revoked_at,now()),encrypted_id_token=NULL,acr=NULL WHERE school_id=$1', [school.id]);
        }
        reappliedSchoolBlocks += blocked.rowCount;
      } else if (entry.reason === 'class_membership_removed') {
        const revoked = await client.query(
          "UPDATE class_membership SET status='revoked' WHERE grant_id=$1 AND status IN ('active','pending') RETURNING school_id,class_id,user_id",
          [entry.grant_id],
        );
        for (const member of revoked.rows) {
          await client.query(
            "UPDATE assignment_recipient ar SET status='removed' FROM assignment a WHERE a.school_id=$1 AND a.class_id=$2 AND ar.school_id=a.school_id AND ar.assignment_id=a.id AND ar.student_id=$3 AND ar.status='assigned'",
            [member.school_id, member.class_id, member.user_id],
          );
        }
        reappliedMembershipRevocations += revoked.rowCount;
      } else if (entry.reason === 'school_membership_removed') {
        const revoked = await client.query(
          "UPDATE school_membership SET status='revoked' WHERE grant_id=$1 AND status='active' RETURNING school_id,user_id",
          [entry.grant_id],
        );
        if (revoked.rowCount) {
          await client.query(
            "UPDATE app_session SET revoked_at=coalesce(revoked_at,now()),encrypted_id_token=NULL,acr=NULL WHERE school_id=$1 AND user_id=$2",
            [revoked.rows[0].school_id, revoked.rows[0].user_id],
          );
          reappliedMembershipRevocations += revoked.rowCount;
        }
      }
    }
    // Revoke every restored cookie, regardless of the session's current expiry.
    const sessions = await client.query('UPDATE app_session SET revoked_at=coalesce(revoked_at,now()),encrypted_id_token=NULL,acr=NULL WHERE revoked_at IS NULL');
    await client.query('COMMIT');
    return { journalCheckpoint: current, invalidatedSessions: sessions.rowCount, reappliedMembershipRevocations, reappliedAccountDeletions, reappliedAccountBlocks, reappliedRetentionDeletions, reappliedSchoolBlocks };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    if (client !== pool) client.release();
  }
}
