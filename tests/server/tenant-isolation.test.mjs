import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('PostgreSQL schema enforces school, class and recipient boundaries with row security', async () => {
  const db = new PGlite();
  try {
    const migration = await readFile(new URL('../../server/migrations/001_initial.sql', import.meta.url), 'utf8');
    await db.exec('CREATE ROLE app_runtime NOLOGIN NOBYPASSRLS');
    await db.exec('CREATE ROLE school_owner_provisioner NOLOGIN NOBYPASSRLS');
    await db.exec(migration);
    await db.exec(await readFile(new URL('../../server/migrations/005_school_owner_tenants.sql', import.meta.url), 'utf8'));
    await db.exec(`
      GRANT USAGE ON SCHEMA public TO app_runtime;
      GRANT SELECT,INSERT,UPDATE,DELETE ON school,school_membership,school_class,class_membership,class_invite,assignment,assignment_recipient,learning_event,audit_event,app_user TO app_runtime;
      GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
      INSERT INTO app_user(id,display_name) VALUES
        ('00000000-0000-0000-0000-000000000001','Lærer A'),
        ('00000000-0000-0000-0000-000000000002','Elev A'),
        ('00000000-0000-0000-0000-000000000003','Elev B'),
        ('00000000-0000-0000-0000-000000000004','Lærer B');
      INSERT INTO school_owner(id,display_name,external_reference,status,verification_reference,verified_by,verified_at) VALUES
        ('11000000-0000-0000-0000-000000000001','Syntetisk eier A','tenant-test-owner-a','active','synthetic-only','test-seed',now()),
        ('11000000-0000-0000-0000-000000000002','Syntetisk eier B','tenant-test-owner-b','active','synthetic-only','test-seed',now());
      INSERT INTO school(id,owner_id,feide_org_id,name) VALUES
        ('10000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000001','org-a','Skole A'),
        ('10000000-0000-0000-0000-000000000002','11000000-0000-0000-0000-000000000002','org-b','Skole B'),
        ('10000000-0000-0000-0000-000000000003','11000000-0000-0000-0000-000000000001','org-a-secondary','Skole A2');
      INSERT INTO school_class(id,school_id,name,school_year) VALUES
        ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','9A','2026'),
        ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','9B','2026'),
        ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','1A','2026'),
        ('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000003','VGS1','2026');
      INSERT INTO class_membership(school_id,class_id,user_id,role) VALUES
        ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','teacher'),
        ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','student'),
        ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','student'),
        ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004','teacher');
      INSERT INTO assignment(id,school_id,class_id,created_by,area,content_id,content_version,question_limit,title) VALUES
        ('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','vocabulary','vocab.basic','1',5,'Ord'),
        ('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','verbs','verbs.present','1',5,'Verb');
      INSERT INTO assignment_recipient(school_id,assignment_id,student_id) VALUES
        ('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002'),
        ('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003');
    `);

    await db.exec(`SET ROLE app_runtime; SELECT set_config('app.school_id','10000000-0000-0000-0000-000000000001',false), set_config('app.user_id','00000000-0000-0000-0000-000000000002',false), set_config('app.role','student',false);`);
    const visibleClasses = await db.query('SELECT id FROM school_class ORDER BY id');
    assert.deepEqual(visibleClasses.rows.map((row) => row.id), ['20000000-0000-0000-0000-000000000001']);
    const visibleAssignments = await db.query('SELECT id FROM assignment ORDER BY id');
    assert.deepEqual(visibleAssignments.rows.map((row) => row.id), ['30000000-0000-0000-0000-000000000001']);
    const recipients = await db.query('SELECT student_id FROM assignment_recipient');
    assert.deepEqual(recipients.rows.map((row) => row.student_id), ['00000000-0000-0000-0000-000000000002']);
    await db.query("SELECT set_config('app.school_id','10000000-0000-0000-0000-000000000002',false)");
    const crossOwner = await db.query('SELECT id FROM school_class');
    assert.deepEqual(crossOwner.rows, []);
    await db.query("SELECT set_config('app.school_id','10000000-0000-0000-0000-000000000003',false)");
    const sameOwnerDifferentSchool = await db.query('SELECT id FROM school_class');
    assert.deepEqual(sameOwnerDifferentSchool.rows, [], 'sharing a legal school owner must not grant access across school tenants');
    await db.query("SELECT set_config('app.school_id','10000000-0000-0000-0000-000000000001',false), set_config('app.user_id','00000000-0000-0000-0000-000000000001',false), set_config('app.role','teacher',false)");
    const teacherClasses = await db.query('SELECT id FROM school_class ORDER BY id');
    assert.deepEqual(teacherClasses.rows.map((row) => row.id), ['20000000-0000-0000-0000-000000000001']);
    const teacherRoster = await db.query('SELECT id FROM app_user ORDER BY id');
    assert.deepEqual(teacherRoster.rows.map((row) => row.id), [
      '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
    ]);
  } finally {
    await db.close();
  }
});

test('school membership lifecycle functions enforce administrator context under app_runtime', async () => {
  const db = new PGlite();
  try {
    await db.exec('CREATE ROLE app_runtime NOLOGIN NOBYPASSRLS');
    await db.exec('CREATE ROLE school_owner_provisioner NOLOGIN NOBYPASSRLS');
    await db.exec(await readFile(new URL('../../server/migrations/001_initial.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../server/migrations/002_school_membership_lifecycle.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../server/migrations/004_session_auth_level.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../server/migrations/005_school_owner_tenants.sql', import.meta.url), 'utf8'));
    await db.exec(`
      INSERT INTO school_owner(id,display_name,external_reference,status,verification_reference,verified_by,verified_at) VALUES
       ('60000000-0000-4000-8000-000000000010','Syntetisk eier A','lifecycle-owner-a','active','synthetic-only','test-seed',now()),
       ('60000000-0000-4000-8000-000000000011','Syntetisk eier B','lifecycle-owner-b','active','synthetic-only','test-seed',now());
      INSERT INTO school(id,owner_id,feide_org_id,name) VALUES
       ('60000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000010','lifecycle-a','Skole A'),
       ('60000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000011','lifecycle-b','Skole B');
      INSERT INTO app_user(id,display_name,status) VALUES
       ('60000000-0000-4000-8000-000000000003','Syntetisk administrator','active'),
       ('60000000-0000-4000-8000-000000000004','Syntetisk elev','active');
      INSERT INTO school_membership(school_id,user_id,role,status) VALUES
       ('60000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000003','school_admin','active'),
       ('60000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000003','school_admin','active'),
       ('60000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000004','student','active');
    `);
    await db.exec('SET ROLE app_runtime');
    await db.query("SELECT set_config('app.school_id','60000000-0000-4000-8000-000000000001',false), set_config('app.user_id','60000000-0000-4000-8000-000000000003',false), set_config('app.role','school_admin',false)");
    const members = await db.query('SELECT user_id FROM app_school_members() ORDER BY user_id');
    assert.deepEqual(members.rows.map((row) => row.user_id), ['60000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000004']);
    assert.equal((await db.query("SELECT app_revoke_school_member('60000000-0000-4000-8000-000000000003') AS result")).rows[0].result, 'self');
    await db.query("SELECT set_config('app.role','teacher',false)");
    await assert.rejects(db.query("SELECT app_revoke_school_member('60000000-0000-4000-8000-000000000004')"), { code: '28000' });
    await db.query("SELECT set_config('app.role','school_admin',false)");
    assert.equal((await db.query("SELECT app_revoke_school_member('60000000-0000-4000-8000-000000000004') AS result")).rows[0].result, 'revoked');
    await db.exec('RESET ROLE');
    assert.equal((await db.query("SELECT status FROM school_membership WHERE user_id='60000000-0000-4000-8000-000000000004' AND school_id='60000000-0000-4000-8000-000000000001'")).rows[0].status, 'revoked');
    assert.equal((await db.query("SELECT status FROM school_membership WHERE user_id='60000000-0000-4000-8000-000000000003' AND school_id='60000000-0000-4000-8000-000000000002'")).rows[0].status, 'active');
  } finally { await db.close(); }
});
