import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { deleteOwnAccount } from '../../server/account-deletion.js';
import { createRevocationJournal } from '../../server/revocation-journal.js';
import { linkFeideIdentity } from '../../server/identity-service.js';

test('account deletion removes personal learning data and Feide bindings idempotently', async () => {
  const db = new PGlite();
  const journalDb = new PGlite();
  try {
    await db.exec('CREATE ROLE app_runtime NOLOGIN NOBYPASSRLS');
    await db.exec(await readFile(new URL('../../server/migrations/001_initial.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../server/migrations/002_school_membership_lifecycle.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../server/migrations/003_account_deletion.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../server/migrations/004_session_auth_level.sql', import.meta.url), 'utf8'));
    await journalDb.exec(await readFile(new URL('../../server/journal-migrations/001_revocations.sql', import.meta.url), 'utf8'));
    await journalDb.exec(await readFile(new URL('../../server/journal-migrations/002_account_deletion.sql', import.meta.url), 'utf8'));
    const ids = (await db.query(`
      INSERT INTO school(feide_org_id,name) VALUES ('urn:synthetic:school','Testskole') RETURNING id;
    `)).rows[0];
    const schoolId = ids.id;
    const userId = (await db.query(`INSERT INTO app_user(display_name,status) VALUES ('Syntetisk elev','active') RETURNING id`)).rows[0].id;
    const classId = (await db.query(`INSERT INTO school_class(school_id,name,school_year) VALUES ($1,'9A','2026') RETURNING id`, [schoolId])).rows[0].id;
    await db.query(`INSERT INTO feide_identity(issuer,subject,user_id) VALUES ('https://idp.example','synthetic-subject',$1)`, [userId]);
    await db.query(`INSERT INTO school_membership(school_id,user_id,role) VALUES ($1,$2,'student')`, [schoolId,userId]);
    await db.query(`INSERT INTO class_membership(school_id,class_id,user_id,role) VALUES ($1,$2,$3,'student')`, [schoolId,classId,userId]);
    const assignmentId = (await db.query(`INSERT INTO assignment(school_id,class_id,created_by,area,content_id,content_version,question_limit,title) VALUES ($1,$2,$3,'vocabulary','synthetic','1',1,'Syntetisk lekse') RETURNING id`, [schoolId,classId,userId])).rows[0].id;
    await db.query(`INSERT INTO assignment_recipient(school_id,assignment_id,student_id) VALUES ($1,$2,$3)`, [schoolId,assignmentId,userId]);
    await db.query(`INSERT INTO learning_event(id,school_id,assignment_id,student_id,area,content_id,content_version,question_id,outcome,attempt,practice_session) VALUES (gen_random_uuid(),$1,$2,$3,'vocabulary','synthetic','1','q1','correct',1,gen_random_uuid())`, [schoolId,assignmentId,userId]);
    await db.query(`INSERT INTO app_session(token_hash,user_id,role,csrf_hash,encrypted_id_token,expires_at) VALUES (decode(repeat('01',32),'hex'),$1,'student',decode(repeat('02',32),'hex'),decode('aa','hex'),now()+interval '1 hour')`, [userId]);
    await db.query('SET ROLE app_runtime');
    await db.query("SELECT set_config('app.user_id',$1,false)", [userId]);
    await assert.rejects(db.query("SELECT app_delete_own_account('00000000-0000-0000-0000-000000000001')"), { code: '28000' });
    await db.query('RESET ROLE');
    const journal = createRevocationJournal(journalDb);
    const deleted = await deleteOwnAccount(db, journal, userId);
    assert.equal(deleted.deleted, true);
    assert.equal((await db.query(`SELECT status,display_name FROM app_user WHERE id=$1`, [userId])).rows[0].status, 'deleted');
    assert.equal((await db.query(`SELECT display_name FROM app_user WHERE id=$1`, [userId])).rows[0].display_name, 'Slettet konto');
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM feide_identity WHERE user_id=$1`, [userId])).rows[0].n, 0);
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM assignment_recipient WHERE student_id=$1`, [userId])).rows[0].n, 0);
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM learning_event WHERE student_id=$1`, [userId])).rows[0].n, 0);
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM school_membership WHERE user_id=$1 AND status='active'`, [userId])).rows[0].n, 0);
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM class_membership WHERE user_id=$1 AND status IN ('active','pending')`, [userId])).rows[0].n, 0);
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM app_session WHERE user_id=$1 AND (revoked_at IS NULL OR encrypted_id_token IS NOT NULL)`, [userId])).rows[0].n, 0);
    assert.equal(await journal.isRevoked(userId), true);
    assert.equal((await journalDb.query('SELECT e.reason FROM entitlement_revocation e JOIN entitlement_revocation_subject s ON s.event_id=e.id WHERE s.subject_id=$1', [userId])).rows[0].reason, 'user_deleted');
    assert.deepEqual(await deleteOwnAccount(db, journal, userId), { deleted: false });
    const reauthenticated = await linkFeideIdentity(db, { issuer: 'https://idp.example', subject: 'synthetic-subject', displayName: 'Ny syntetisk konto' });
    assert.notEqual(reauthenticated.userId, userId, 'a later Feide subject reuse cannot restore the deleted account');
    assert.equal(reauthenticated.status, 'pending');
  } finally { await Promise.all([db.close(), journalDb.close()]); }
});
