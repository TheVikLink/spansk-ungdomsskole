import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { deleteExpiredSchoolData, validateRetentionDays } from '../../server/retention.js';

function asPool(database) {
  return { async connect() { return { query: database.query.bind(database), release() {} }; } };
}

test('retention validates policy input and preview rolls back until explicitly applied', async () => {
  assert.equal(validateRetentionDays('90'), 90);
  assert.throws(() => validateRetentionDays('0'));
  assert.throws(() => validateRetentionDays('90 days'));
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE TABLE app_session(token_hash text, expires_at timestamptz, revoked_at timestamptz);
      CREATE TABLE oidc_transaction(expires_at timestamptz, consumed_at timestamptz);
      CREATE TABLE class_invite(expires_at timestamptz, used_at timestamptz);
      CREATE TABLE assignment(id int PRIMARY KEY, status text, due_at timestamptz, created_at timestamptz);
      CREATE TABLE assignment_recipient(assignment_id int REFERENCES assignment(id) ON DELETE CASCADE);
      CREATE TABLE learning_event(assignment_id int REFERENCES assignment(id) ON DELETE CASCADE);
      CREATE TABLE audit_event(created_at timestamptz);
      INSERT INTO assignment VALUES (1,'closed','2025-01-01','2025-01-01'), (2,'published','2025-01-01','2025-01-01'), (3,'closed',NULL,'2025-01-01');
      INSERT INTO assignment_recipient VALUES (1), (2);
      INSERT INTO learning_event VALUES (1), (2);
    `);
    const pool = asPool(db);
    const options = { learningRetentionDays: 90, auditRetentionDays: 30, now: new Date('2026-09-28T00:00:00Z') };
    const preview = await deleteExpiredSchoolData(pool, options);
    assert.equal(preview.assignments, 1);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM assignment')).rows[0].n, 3);
    await assert.rejects(deleteExpiredSchoolData(pool, { ...options, apply: true }), /external deletion journal/);
    const recorded = [];
    const applied = await deleteExpiredSchoolData(pool, { ...options, apply: true, journal: { async revoke(id, reason) { recorded.push({ id, reason }); } } });
    assert.equal(applied.assignments, 1);
    assert.equal(recorded.length, 1);
    assert.equal(recorded[0].reason, 'assignment_retention');
    assert.deepEqual((await db.query('SELECT id FROM assignment ORDER BY id')).rows, [{ id: 2 }, { id: 3 }]);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM assignment_recipient')).rows[0].n, 1);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM learning_event')).rows[0].n, 1);
  } finally { await db.close(); }
});
