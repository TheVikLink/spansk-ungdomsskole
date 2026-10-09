const DAYS = 24 * 60 * 60 * 1000;

export function validateRetentionDays(value) {
  const days = Number(value);
  if (!Number.isInteger(days) || days < 1 || days > 3650) throw new Error('Retention days must be an integer from 1 to 3650');
  return days;
}

/** Apply only an explicit school-approved retention period to closed, expired work. */
export async function deleteExpiredSchoolData(pool, { learningRetentionDays, auditRetentionDays, now = new Date(), apply = false, journal = null }) {
  const learningDays = validateRetentionDays(learningRetentionDays);
  const auditDays = validateRetentionDays(auditRetentionDays);
  const cutoff = new Date(now.getTime() - learningDays * DAYS);
  const auditCutoff = new Date(now.getTime() - auditDays * DAYS);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sessions = await client.query('DELETE FROM app_session WHERE expires_at <= $1 OR (revoked_at IS NOT NULL AND revoked_at <= $1)', [now]);
    const oidc = await client.query('DELETE FROM oidc_transaction WHERE expires_at <= $1 OR consumed_at <= $1', [now]);
    const invitations = await client.query('DELETE FROM class_invite WHERE expires_at <= $1 OR used_at <= $1', [now]);
    const expiredAssignments = await client.query(
      `SELECT id FROM assignment WHERE status='closed' AND due_at IS NOT NULL AND due_at <= $1 AND created_at <= $1 FOR UPDATE`,
      [cutoff],
    );
    if (apply && expiredAssignments.rowCount && !journal) throw new Error('An external deletion journal is required before applying learning-data retention');
    if (apply && journal) {
      for (const assignment of expiredAssignments.rows) await journal.revoke(assignment.id, 'assignment_retention');
    }
    const assignments = await client.query(
      `DELETE FROM assignment WHERE status='closed' AND due_at IS NOT NULL AND due_at <= $1 AND created_at <= $1`,
      [cutoff],
    );
    const audit = await client.query('DELETE FROM audit_event WHERE created_at <= $1', [auditCutoff]);
    await client.query(apply ? 'COMMIT' : 'ROLLBACK');
    return { sessions: sessions.rowCount, oidcTransactions: oidc.rowCount, invitations: invitations.rowCount, assignments: assignments.rowCount, auditEvents: audit.rowCount };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
