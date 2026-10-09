import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createRevocationJournal } from '../../server/revocation-journal.js';
import { verifyRestoredSchoolDatabase } from '../../server/recovery.js';
import { readFile as readText } from 'node:fs/promises';

test('separate append-only PostgreSQL journal preserves revocations and fails closed', async () => {
  const db = new PGlite();
  try {
    await db.exec(await readFile(new URL('../../server/journal-migrations/001_revocations.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../server/journal-migrations/002_account_deletion.sql', import.meta.url), 'utf8'));
    const journal = createRevocationJournal(db);
    const oldTeacherMembership = '40000000-0000-0000-0000-000000000001';
    assert.equal(await journal.isRevoked(oldTeacherMembership), false);
    await journal.revoke(oldTeacherMembership, 'class_membership_removed');
    await journal.revoke(oldTeacherMembership, 'class_membership_removed');
    assert.equal(await journal.isRevoked(oldTeacherMembership), true);
    const checkpoint = await journal.checkpoint();
    assert.equal(checkpoint.entries, '1');
    await assert.rejects(db.query('UPDATE entitlement_revocation SET reason=$1', ['user_blocked']), /append-only/);
    await assert.rejects(db.query('DELETE FROM entitlement_revocation'), /append-only/);
    await assert.rejects(db.query('TRUNCATE entitlement_revocation_subject'), /append-only/);
    await assert.rejects(db.query('TRUNCATE entitlement_revocation'), /append-only|foreign key constraint/);
    await assert.rejects(journal.assertNotRevoked(oldTeacherMembership), { code: 'ACCESS_REVOKED' });
  } finally {
    await db.close();
  }
});

test('restore requires a current journal and invalidates every restored app session', async () => {
  const journalDb = new PGlite();
  const schoolDb = new PGlite();
  try {
    await journalDb.exec(await readFile(new URL('../../server/journal-migrations/001_revocations.sql', import.meta.url), 'utf8'));
    await journalDb.exec(await readFile(new URL('../../server/journal-migrations/002_account_deletion.sql', import.meta.url), 'utf8'));
    await schoolDb.exec('CREATE ROLE app_runtime NOLOGIN');
    await schoolDb.exec(await readText(new URL('../../server/migrations/001_initial.sql', import.meta.url), 'utf8'));
    await schoolDb.exec(await readText(new URL('../../server/migrations/004_session_auth_level.sql', import.meta.url), 'utf8'));
    const journal = createRevocationJournal(journalDb);
    const snapshot = await journal.checkpoint();
    const grantId = '40000000-0000-0000-0000-000000000002';
    await journal.revoke(grantId, 'class_membership_removed');
    assert.equal(await journal.isRevoked(grantId), true, 'a post-snapshot revoke remains authoritative');

    await schoolDb.exec(`INSERT INTO app_user(id,display_name,status) VALUES ('40000000-0000-0000-0000-000000000003','Syntetisk lærer','active');
      INSERT INTO school(id,feide_org_id,name) VALUES ('40000000-0000-0000-0000-000000000004','synthetic-org','Syntetisk skole');
      INSERT INTO app_session(token_hash,user_id,role,csrf_hash,expires_at) VALUES (decode(repeat('01',32),'hex'),'40000000-0000-0000-0000-000000000003','teacher',decode(repeat('02',32),'hex'),now()+interval '1 day');`);
    const outcome = await verifyRestoredSchoolDatabase({ pool: schoolDb, journal, snapshotCheckpoint: snapshot });
    assert.equal(outcome.invalidatedSessions, 1);
    assert.equal((await schoolDb.query('SELECT revoked_at IS NOT NULL AS revoked FROM app_session')).rows[0].revoked, true);

    await journalDb.exec('DROP TABLE entitlement_revocation_subject; DROP TABLE entitlement_revocation');
    await assert.rejects(verifyRestoredSchoolDatabase({ pool: schoolDb, journal, snapshotCheckpoint: snapshot }));
  } finally {
    await schoolDb.close();
    await journalDb.close();
  }
});

test('restore reapplies school and class membership revocations from the separate journal', async () => {
  const journalDb = new PGlite();
  const schoolDb = new PGlite();
  try {
    await journalDb.exec(await readFile(new URL('../../server/journal-migrations/001_revocations.sql', import.meta.url), 'utf8'));
    await journalDb.exec(await readFile(new URL('../../server/journal-migrations/002_account_deletion.sql', import.meta.url), 'utf8'));
    await schoolDb.exec('CREATE ROLE app_runtime NOLOGIN');
    await schoolDb.exec(await readText(new URL('../../server/migrations/001_initial.sql', import.meta.url), 'utf8'));
    await schoolDb.exec(await readText(new URL('../../server/migrations/004_session_auth_level.sql', import.meta.url), 'utf8'));
    const journal = createRevocationJournal(journalDb);
    const snapshot = await journal.checkpoint();
    await schoolDb.exec(`
      INSERT INTO school(id,feide_org_id,name) VALUES ('40000000-0000-0000-0000-000000000011','restore-org','Gjenopprettingsskole');
      INSERT INTO app_user(id,display_name,status) VALUES ('40000000-0000-0000-0000-000000000012','Syntetisk lærer','active');
      INSERT INTO school_membership(school_id,user_id,grant_id,role,status) VALUES ('40000000-0000-0000-0000-000000000011','40000000-0000-0000-0000-000000000012','40000000-0000-0000-0000-000000000013','teacher','active');
      INSERT INTO school_class(id,school_id,name,school_year) VALUES ('40000000-0000-0000-0000-000000000014','40000000-0000-0000-0000-000000000011','Spansk','2026-2027');
      INSERT INTO class_membership(school_id,class_id,user_id,grant_id,role,status) VALUES ('40000000-0000-0000-0000-000000000011','40000000-0000-0000-0000-000000000014','40000000-0000-0000-0000-000000000012','40000000-0000-0000-0000-000000000015','teacher','active');
      INSERT INTO assignment(id,school_id,class_id,created_by,area,content_id,content_version,question_limit,title)
      VALUES ('40000000-0000-0000-0000-000000000016','40000000-0000-0000-0000-000000000011','40000000-0000-0000-0000-000000000014','40000000-0000-0000-0000-000000000012','grammar','grammar.a0Foundation.v1','1',1,'Syntetisk lekse');
      INSERT INTO assignment_recipient(school_id,assignment_id,student_id,status)
      VALUES ('40000000-0000-0000-0000-000000000011','40000000-0000-0000-0000-000000000016','40000000-0000-0000-0000-000000000012','assigned');
      INSERT INTO app_session(token_hash,user_id,school_id,role,csrf_hash,expires_at)
      VALUES (decode(repeat('03',32),'hex'),'40000000-0000-0000-0000-000000000012','40000000-0000-0000-0000-000000000011','teacher',decode(repeat('04',32),'hex'),now()+interval '1 day');
    `);
    await journal.revoke('40000000-0000-0000-0000-000000000013', 'school_membership_removed');
    await journal.revoke('40000000-0000-0000-0000-000000000015', 'class_membership_removed');
    await journal.revoke('40000000-0000-0000-0000-000000000012', 'user_blocked');

    const outcome = await verifyRestoredSchoolDatabase({ pool: schoolDb, journal, snapshotCheckpoint: snapshot });
    assert.equal(outcome.reappliedMembershipRevocations, 2);
    assert.equal(outcome.reappliedAccountBlocks, 1);
    assert.equal((await schoolDb.query("SELECT status FROM app_user WHERE id='40000000-0000-0000-0000-000000000012'")).rows[0].status, 'blocked');
    assert.equal((await schoolDb.query("SELECT count(*)::int AS n FROM school_membership WHERE status='active'")).rows[0].n, 0);
    assert.equal((await schoolDb.query("SELECT count(*)::int AS n FROM class_membership WHERE status='active'")).rows[0].n, 0);
    assert.equal((await schoolDb.query("SELECT status FROM assignment_recipient")).rows[0].status, 'removed');
    assert.equal((await schoolDb.query('SELECT revoked_at IS NOT NULL AS revoked FROM app_session')).rows[0].revoked, true);
  } finally {
    await schoolDb.close();
    await journalDb.close();
  }
});

test('restore replays owner school blocks, while later verified activation rotates the access grant', async () => {
  const journalDb = new PGlite();
  const schoolDb = new PGlite();
  try {
    await journalDb.exec(await readFile(new URL('../../server/journal-migrations/001_revocations.sql', import.meta.url), 'utf8'));
    await journalDb.exec(await readFile(new URL('../../server/journal-migrations/002_account_deletion.sql', import.meta.url), 'utf8'));
    await schoolDb.exec('CREATE ROLE app_runtime NOLOGIN; CREATE ROLE school_owner_provisioner NOLOGIN NOBYPASSRLS');
    await schoolDb.exec(await readText(new URL('../../server/migrations/001_initial.sql', import.meta.url), 'utf8'));
    await schoolDb.exec(await readText(new URL('../../server/migrations/004_session_auth_level.sql', import.meta.url), 'utf8'));
    await schoolDb.exec(await readText(new URL('../../server/migrations/005_school_owner_tenants.sql', import.meta.url), 'utf8'));
    const journal = createRevocationJournal(journalDb);
    const snapshot = await journal.checkpoint();
    const schoolId = '42000000-0000-0000-0000-000000000001';
    await schoolDb.exec(`
      INSERT INTO school_owner(id,display_name,external_reference,status,verification_reference,verified_by,verified_at)
       VALUES ('42000000-0000-0000-0000-000000000002','Syntetisk eier','restore-owner-420','active','synthetic-only','test-seed',now());
      INSERT INTO school(id,owner_id,feide_org_id,name) VALUES ('${schoolId}','42000000-0000-0000-0000-000000000002','restore-org-420','Restore skole');
      INSERT INTO app_user(id,display_name,status) VALUES ('42000000-0000-0000-0000-000000000003','Syntetisk lærer','active');
      INSERT INTO school_membership(school_id,user_id,role,status) VALUES ('${schoolId}','42000000-0000-0000-0000-000000000003','teacher','active');
      INSERT INTO app_session(token_hash,user_id,school_id,role,csrf_hash,expires_at)
       VALUES (decode(repeat('07',32),'hex'),'42000000-0000-0000-0000-000000000003','${schoolId}','teacher',decode(repeat('08',32),'hex'),now()+interval '1 day');
    `);
    const oldGrant = (await schoolDb.query('SELECT access_grant_id FROM school WHERE id=$1', [schoolId])).rows[0].access_grant_id;
    await journal.revoke(oldGrant, 'school_blocked');
    const restored = await verifyRestoredSchoolDatabase({ pool: schoolDb, journal, snapshotCheckpoint: snapshot });
    assert.equal(restored.reappliedSchoolBlocks, 1);
    assert.equal((await schoolDb.query('SELECT status FROM school WHERE id=$1', [schoolId])).rows[0].status, 'blocked');
    assert.equal((await schoolDb.query('SELECT status FROM school_membership WHERE school_id=$1', [schoolId])).rows[0].status, 'revoked');
    assert.equal((await schoolDb.query('SELECT revoked_at IS NOT NULL AS revoked FROM app_session')).rows[0].revoked, true);

    await schoolDb.query('SELECT app_provision_school_owner($1,$2,$3,$4,$5::uuid[])', [
      'Syntetisk ny eier', 'restore-owner-420-new', 'test-operator', 'TEST/restore-reactivation-420', [schoolId],
    ]);
    const newGrant = (await schoolDb.query('SELECT access_grant_id,status FROM school WHERE id=$1', [schoolId])).rows[0];
    assert.notEqual(newGrant.access_grant_id, oldGrant);
    assert.equal(newGrant.status, 'active');
    const afterActivationCheckpoint = await journal.checkpoint();
    const restoredAgain = await verifyRestoredSchoolDatabase({ pool: schoolDb, journal, snapshotCheckpoint: afterActivationCheckpoint });
    assert.equal(restoredAgain.reappliedSchoolBlocks, 0, 'old journal events do not close a separately verified new grant');
    assert.equal((await schoolDb.query('SELECT status FROM school WHERE id=$1', [schoolId])).rows[0].status, 'active');
  } finally {
    await schoolDb.close();
    await journalDb.close();
  }
});

test('restore replays account deletion and removes restored identity, results and sessions', async () => {
  const journalDb = new PGlite();
  const schoolDb = new PGlite();
  try {
    await journalDb.exec(await readFile(new URL('../../server/journal-migrations/001_revocations.sql', import.meta.url), 'utf8'));
    await journalDb.exec(await readFile(new URL('../../server/journal-migrations/002_account_deletion.sql', import.meta.url), 'utf8'));
    await schoolDb.exec('CREATE ROLE app_runtime NOLOGIN');
    await schoolDb.exec(await readText(new URL('../../server/migrations/001_initial.sql', import.meta.url), 'utf8'));
    await schoolDb.exec(await readText(new URL('../../server/migrations/004_session_auth_level.sql', import.meta.url), 'utf8'));
    const journal = createRevocationJournal(journalDb);
    const snapshot = await journal.checkpoint();
    await schoolDb.exec(`
      INSERT INTO school(id,feide_org_id,name) VALUES ('50000000-0000-0000-0000-000000000001','restore-org','Gjenopprettingsskole');
      INSERT INTO app_user(id,display_name,status) VALUES ('50000000-0000-0000-0000-000000000002','Syntetisk elev','active');
      INSERT INTO feide_identity(issuer,subject,user_id) VALUES ('https://idp.example','synthetic-sub','50000000-0000-0000-0000-000000000002');
      INSERT INTO school_membership(school_id,user_id,role) VALUES ('50000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002','student');
      INSERT INTO school_class(id,school_id,name,school_year) VALUES ('50000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000001','Syntetisk','2026');
      INSERT INTO class_membership(school_id,class_id,user_id,role) VALUES ('50000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000002','student');
      INSERT INTO assignment(id,school_id,class_id,created_by,area,content_id,content_version,question_limit,title)
       VALUES ('50000000-0000-0000-0000-000000000004','50000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000002','grammar','synthetic','1',1,'Syntetisk');
      INSERT INTO assignment_recipient(school_id,assignment_id,student_id) VALUES ('50000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000004','50000000-0000-0000-0000-000000000002');
      INSERT INTO learning_event(id,school_id,assignment_id,student_id,area,content_id,content_version,question_id,outcome,attempt,practice_session)
       VALUES ('50000000-0000-0000-0000-000000000005','50000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000004','50000000-0000-0000-0000-000000000002','grammar','synthetic','1','q1','correct',1,'50000000-0000-0000-0000-000000000006');
      INSERT INTO app_session(token_hash,user_id,role,csrf_hash,encrypted_id_token,expires_at)
       VALUES (decode(repeat('05',32),'hex'),'50000000-0000-0000-0000-000000000002','student',decode(repeat('06',32),'hex'),decode('aa','hex'),now()+interval '1 day');
    `);
    await journal.revoke('50000000-0000-0000-0000-000000000002', 'user_deleted');
    await journal.revoke('50000000-0000-0000-0000-000000000004', 'assignment_retention');
    const outcome = await verifyRestoredSchoolDatabase({ pool: schoolDb, journal, snapshotCheckpoint: snapshot });
    assert.equal(outcome.reappliedAccountDeletions, 1);
    assert.equal(outcome.reappliedRetentionDeletions, 1);
    assert.equal((await schoolDb.query("SELECT count(*)::int AS n FROM assignment WHERE id='50000000-0000-0000-0000-000000000004'")).rows[0].n, 0);
    assert.equal((await schoolDb.query("SELECT status,display_name FROM app_user WHERE id='50000000-0000-0000-0000-000000000002'")).rows[0].status, 'deleted');
    assert.equal((await schoolDb.query("SELECT count(*)::int AS n FROM feide_identity WHERE user_id='50000000-0000-0000-0000-000000000002'")).rows[0].n, 0);
    assert.equal((await schoolDb.query("SELECT count(*)::int AS n FROM assignment_recipient WHERE student_id='50000000-0000-0000-0000-000000000002'")).rows[0].n, 0);
    assert.equal((await schoolDb.query("SELECT count(*)::int AS n FROM learning_event WHERE student_id='50000000-0000-0000-0000-000000000002'")).rows[0].n, 0);
    assert.equal((await schoolDb.query("SELECT revoked_at IS NOT NULL AND encrypted_id_token IS NULL AS revoked FROM app_session")).rows[0].revoked, true);
  } finally {
    await schoolDb.close();
    await journalDb.close();
  }
});
