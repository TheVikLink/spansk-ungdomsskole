/** The journal is a separate PostgreSQL service/database from learning snapshots. */
export function createRevocationJournal(pool) {
  return {
    async revoke(grantId, reason, subjectId = grantId) {
      const allowed = new Set(['class_membership_removed', 'school_membership_removed', 'user_blocked', 'user_deleted', 'assignment_retention', 'school_blocked', 'class_invitation_used', 'school_invitation_used', 'school_invitation_revoked']);
      if (!allowed.has(reason)) throw new Error('Unsupported revocation reason');
      const client = pool.connect ? await pool.connect() : pool;
      try {
        await client.query('BEGIN');
        const inserted = await client.query('INSERT INTO entitlement_revocation(grant_id,reason) VALUES($1,$2) ON CONFLICT(grant_id) DO NOTHING RETURNING id', [grantId, reason]);
        let entryId = inserted.rows[0]?.id;
        if (!entryId) {
          const prior = await client.query('SELECT e.id,e.reason,coalesce(s.subject_id,e.grant_id) AS subject_id FROM entitlement_revocation e LEFT JOIN entitlement_revocation_subject s ON s.event_id=e.id WHERE e.grant_id=$1', [grantId]);
          if (!prior.rowCount || prior.rows[0].reason !== reason || prior.rows[0].subject_id !== subjectId) throw new Error('Journal event conflicts with an existing immutable event');
          entryId = prior.rows[0].id;
        } else if (subjectId !== grantId) {
          await client.query('INSERT INTO entitlement_revocation_subject(event_id,subject_id) VALUES($1,$2)', [entryId, subjectId]);
        }
        await client.query('COMMIT');
      } catch (error) {
        try { await client.query('ROLLBACK'); } catch {}
        throw error;
      } finally {
        if (client !== pool) client.release();
      }
    },
    async isRevoked(grantId) {
      const result = await pool.query('SELECT 1 FROM entitlement_revocation e LEFT JOIN entitlement_revocation_subject s ON s.event_id=e.id WHERE coalesce(s.subject_id,e.grant_id)=$1 LIMIT 1', [grantId]);
      return result.rowCount > 0;
    },
    async assertNotRevoked(grantId) {
      if (await this.isRevoked(grantId)) throw Object.assign(new Error('Access has been revoked'), { code: 'ACCESS_REVOKED' });
    },
    async checkpoint() {
      const result = await pool.query('SELECT coalesce(max(id),0)::text AS sequence, count(*)::text AS entries FROM entitlement_revocation');
      return result.rows[0];
    },
    async entriesThrough(sequence) {
      const result = await pool.query('SELECT e.id,e.grant_id,coalesce(s.subject_id,e.grant_id) AS subject_id,e.reason FROM entitlement_revocation e LEFT JOIN entitlement_revocation_subject s ON s.event_id=e.id WHERE e.id<=$1 ORDER BY e.id', [sequence]);
      return result.rows;
    },
  };
}
