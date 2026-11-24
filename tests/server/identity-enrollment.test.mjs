import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { linkFeideIdentity, redeemClassInvite, redeemSchoolInvite } from '../../server/identity-service.js';
import { createSessionService, hashSessionToken } from '../../server/session-service.js';
import { createRevocationJournal } from '../../server/revocation-journal.js';

const sessionSecret = 'local-session-secret-only-123456';
const digest = (text) => createHash('sha256').update(text).digest();

async function database() {
  const db = new PGlite();
  await db.exec('CREATE ROLE app_runtime NOLOGIN NOBYPASSRLS');
  await db.exec(await readFile(new URL('../../server/migrations/001_initial.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../../server/migrations/004_session_auth_level.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../../server/journal-migrations/001_revocations.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../../server/journal-migrations/002_account_deletion.sql', import.meta.url), 'utf8'));
  return db;
}

test('class invitations only enroll a student whose school membership was already approved', async () => {
  const db = await database();
  try {
    await db.exec(`
      INSERT INTO school(id,feide_org_id,name) VALUES ('10000000-0000-0000-0000-000000000001','org-a','Syntetisk skole');
      INSERT INTO app_user(id,display_name,status) VALUES ('00000000-0000-0000-0000-000000000001','Syntetisk lærer','active');
      INSERT INTO feide_identity(issuer,subject,user_id) VALUES ('http://oidc.test','demo-teacher','00000000-0000-0000-0000-000000000001');
      INSERT INTO school_membership(school_id,user_id,role,status) VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','teacher','active');
      INSERT INTO app_user(id,display_name,status) VALUES ('00000000-0000-0000-0000-000000000002','Elev forhåndsgodkjent','active');
      INSERT INTO feide_identity(issuer,subject,user_id) VALUES ('http://oidc.test','approved-student','00000000-0000-0000-0000-000000000002');
      INSERT INTO school_membership(school_id,user_id,role,status) VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','student','active');
      INSERT INTO school_class(id,school_id,name,school_year) VALUES ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Spanskgruppe A','2026-2027');
      INSERT INTO class_membership(school_id,class_id,user_id,role) VALUES ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','teacher');
    `);
    const linkedTeacher = await linkFeideIdentity(db, { issuer: 'http://oidc.test', subject: 'demo-teacher', displayName: 'Lærer syntetisk' });
    assert.equal(linkedTeacher.userId, '00000000-0000-0000-0000-000000000001');
    assert.equal(linkedTeacher.membership.role, 'teacher');

    const pending = await linkFeideIdentity(db, { issuer: 'http://oidc.test', subject: 'demo-student', displayName: 'Elev syntetisk' });
    assert.equal(pending.status, 'pending');
    assert.equal(pending.membership, null);
    const sessions = createSessionService(db, { sessionSecret });
    const journal = createRevocationJournal(db);
    const pendingSession = await sessions.create({ userId: pending.userId, schoolId: null, role: 'pending', idToken: 'synthetic-student-id-token' });
    assert.equal((await sessions.resolve(pendingSession.token)).role, 'pending');

    const inviteCode = randomBytes(24).toString('base64url');
    const classInviteRow = await db.query('INSERT INTO class_invite(school_id,class_id,token_hash,created_by,expires_at) VALUES($1,$2,$3,$4,now()+interval \'1 day\') RETURNING id', [
      '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', digest(inviteCode), '00000000-0000-0000-0000-000000000001',
    ]);
    await assert.rejects(redeemClassInvite(db, journal, {
      userId: pending.userId, code: inviteCode, sessionTokenHash: hashSessionToken(pendingSession.token), sessionSecret,
    }));
    assert.equal((await db.query('SELECT used_at FROM class_invite')).rows[0].used_at, null);

    const approved = await linkFeideIdentity(db, { issuer: 'http://oidc.test', subject: 'approved-student', displayName: 'Elev godkjent' });
    assert.equal(approved.membership.role, 'student');
    const approvedSession = await sessions.create({ userId: approved.userId, schoolId: approved.membership.schoolId, role: 'student', idToken: 'synthetic-student-id-token' });
    const joined = await redeemClassInvite(db, journal, {
      userId: approved.userId, code: inviteCode, sessionTokenHash: hashSessionToken(approvedSession.token), sessionSecret,
    });
    assert.equal(joined.school_id, '10000000-0000-0000-0000-000000000001');
    assert.equal(joined.role, 'student');
    assert.equal(joined.idToken, 'synthetic-student-id-token');
    assert.ok(await sessions.resolve(pendingSession.token));
    assert.equal(await sessions.resolve(approvedSession.token), null);
    const active = await sessions.create({ userId: approved.userId, schoolId: joined.school_id, role: joined.role, idToken: joined.idToken });
    assert.equal((await sessions.resolve(active.token)).role, 'student');
    const membership = await db.query('SELECT role,status FROM class_membership WHERE user_id=$1', [approved.userId]);
    assert.deepEqual(membership.rows[0], { role: 'student', status: 'pending' });
    await db.query("SELECT set_config('app.user_id',$1,false),set_config('app.school_id',$2,false),set_config('app.role','student',false)", ['00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001']);
    await assert.rejects(db.query("SELECT app_approve_class_member($1,$2) AS approved", ['20000000-0000-0000-0000-000000000001', approved.userId]), { code: '28000' });
    await db.query("SELECT set_config('app.user_id','00000000-0000-0000-0000-000000000001',false),set_config('app.role','teacher',false)");
    assert.equal((await db.query("SELECT app_approve_class_member($1,$2) AS approved", ['20000000-0000-0000-0000-000000000001', approved.userId])).rows[0].approved, true);
    assert.equal((await db.query("SELECT app_approve_class_member($1,$2) AS approved", ['20000000-0000-0000-0000-000000000001', approved.userId])).rows[0].approved, false);
    assert.deepEqual((await db.query('SELECT role,status FROM class_membership WHERE user_id=$1', [approved.userId])).rows[0], { role: 'student', status: 'active' });
    await assert.rejects(redeemClassInvite(db, journal, {
      userId: approved.userId, code: inviteCode, sessionTokenHash: hashSessionToken(active.token), sessionSecret,
    }));

    // A restore of the pre-redemption snapshot must not make the consumed class code usable again.
    const restored = await database();
    try {
      await restored.exec(`
        INSERT INTO school(id,feide_org_id,name) VALUES ('10000000-0000-0000-0000-000000000001','org-a','Syntetisk skole');
        INSERT INTO app_user(id,display_name,status) VALUES
         ('00000000-0000-0000-0000-000000000001','Syntetisk lærer','active'),
         ('00000000-0000-0000-0000-000000000002','Syntetisk elev','active');
        INSERT INTO school_membership(school_id,user_id,role,status) VALUES
         ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','teacher','active'),
         ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','student','active');
        INSERT INTO school_class(id,school_id,name,school_year) VALUES ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Spanskgruppe A','2026-2027');
        INSERT INTO class_membership(school_id,class_id,user_id,role) VALUES ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','teacher');
      `);
      await restored.query(`INSERT INTO class_invite(id,school_id,class_id,token_hash,created_by,expires_at)
        VALUES($1,$2,$3,$4,$5,now()+interval '1 day')`, [classInviteRow.rows[0].id, '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', digest(inviteCode), '00000000-0000-0000-0000-000000000001']);
      await restored.query(`INSERT INTO app_session(token_hash,user_id,school_id,role,csrf_hash,expires_at)
        VALUES($1,$2,$3,'student',$4,now()+interval '1 day')`, [hashSessionToken(approvedSession.token), approved.userId, '10000000-0000-0000-0000-000000000001', randomBytes(32)]);
      await assert.rejects(redeemClassInvite(restored, journal, {
        userId: approved.userId, code: inviteCode, sessionTokenHash: hashSessionToken(approvedSession.token), sessionSecret,
      }), { code: 'INVITE_INVALID' });
      assert.equal((await restored.query('SELECT count(*)::int AS n FROM class_membership WHERE user_id=$1', [approved.userId])).rows[0].n, 0);
    } finally { await restored.close(); }
  } finally { await db.close(); }
});

test('a revoked Feide identity cannot silently bind to a new account', async () => {
  const db = await database();
  try {
    const first = await linkFeideIdentity(db, { issuer: 'http://oidc.test', subject: 'recycled-sub', displayName: 'Testkonto' });
    await db.query('UPDATE feide_identity SET revoked_at=now() WHERE issuer=$1 AND subject=$2', ['http://oidc.test', 'recycled-sub']);
    await assert.rejects(linkFeideIdentity(db, { issuer: 'http://oidc.test', subject: 'recycled-sub', displayName: 'Ny person' }), { code: '28000' });
    assert.equal((await db.query('SELECT count(*)::int AS n FROM app_user')).rows[0].n, 1);
    assert.ok(first.userId);
  } finally { await db.close(); }
});

test('school-admin invitation gives a pending Feide identity only a time-limited teacher membership at that school', async () => {
  const db = await database();
  try {
    await db.exec(`
      INSERT INTO school(id,feide_org_id,name) VALUES ('10000000-0000-0000-0000-000000000010','org-admin','Syntetisk skole');
      INSERT INTO app_user(id,display_name,status) VALUES ('00000000-0000-0000-0000-000000000010','Syntetisk administrator','active');
      INSERT INTO school_membership(school_id,user_id,role,status) VALUES ('10000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000010','school_admin','active');
    `);
    const pending = await linkFeideIdentity(db, { issuer: 'http://oidc.test', subject: 'teacher-approved-by-admin', displayName: 'Syntetisk medlærer' });
    const sessions = createSessionService(db, { sessionSecret });
    const journal = createRevocationJournal(db);
    const session = await sessions.create({ userId: pending.userId, schoolId: null, role: 'pending', idToken: 'teacher-id-token' });
    const code = randomBytes(24).toString('base64url');
    const inviteRow = await db.query(`INSERT INTO school_invite(school_id,token_hash,created_by,expires_at)
      VALUES($1,$2,$3,now()+interval '1 day') RETURNING id`, ['10000000-0000-0000-0000-000000000010', digest(code), '00000000-0000-0000-0000-000000000010']);
    const membership = await redeemSchoolInvite(db, journal, {
      userId: pending.userId, code, sessionTokenHash: hashSessionToken(session.token), sessionSecret,
    });
    assert.equal(membership.school_id, '10000000-0000-0000-0000-000000000010');
    assert.equal(membership.role, 'teacher');
    assert.equal(membership.idToken, 'teacher-id-token');
    assert.equal(await sessions.resolve(session.token), null);
    const active = await sessions.create({ userId: pending.userId, schoolId: membership.school_id, role: membership.role, idToken: membership.idToken });
    assert.equal((await sessions.resolve(active.token)).role, 'teacher');
    assert.deepEqual((await db.query('SELECT role,status FROM school_membership WHERE user_id=$1', [pending.userId])).rows[0], { role: 'teacher', status: 'active' });
    await assert.rejects(redeemSchoolInvite(db, journal, {
      userId: pending.userId, code, sessionTokenHash: hashSessionToken(active.token), sessionSecret,
    }));

    // Simulate restoring the pre-redemption snapshot while retaining the newer journal.
    const restored = await database();
    try {
      await restored.exec(`
        INSERT INTO school(id,feide_org_id,name) VALUES ('10000000-0000-0000-0000-000000000010','org-admin','Syntetisk skole');
        INSERT INTO app_user(id,display_name,status) VALUES
         ('00000000-0000-0000-0000-000000000010','Syntetisk administrator','active'),
         ('${pending.userId}','Syntetisk medlærer','pending');
      `);
      await restored.query(`INSERT INTO school_invite(id,school_id,token_hash,created_by,expires_at)
        VALUES($1,$2,$3,$4,now()+interval '1 day')`, [inviteRow.rows[0].id, '10000000-0000-0000-0000-000000000010', digest(code), '00000000-0000-0000-0000-000000000010']);
      await restored.query(`INSERT INTO app_session(token_hash,user_id,role,csrf_hash,expires_at)
        VALUES($1,$2,'pending',$3,now()+interval '1 day')`, [hashSessionToken(session.token), pending.userId, randomBytes(32)]);
      await assert.rejects(redeemSchoolInvite(restored, journal, {
        userId: pending.userId, code, sessionTokenHash: hashSessionToken(session.token), sessionSecret,
      }), { code: 'INVITE_INVALID' });
      assert.equal((await restored.query('SELECT count(*)::int AS n FROM school_membership WHERE user_id=$1', [pending.userId])).rows[0].n, 0);
    } finally { await restored.close(); }
  } finally { await db.close(); }
});

test('a teacher who belongs to another school can accept an invitation after choosing a school', async () => {
  const db = await database();
  try {
    await db.exec(`
      INSERT INTO school(id,feide_org_id,name) VALUES
       ('10000000-0000-0000-0000-000000000020','org-existing','Eksisterende skole'),
       ('10000000-0000-0000-0000-000000000021','org-new','Ny skole');
      INSERT INTO app_user(id,display_name,status) VALUES
       ('00000000-0000-0000-0000-000000000020','Syntetisk lærer','active'),
       ('00000000-0000-0000-0000-000000000021','Syntetisk administrator','active');
      INSERT INTO school_membership(school_id,user_id,role,status) VALUES
       ('10000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000020','teacher','active'),
       ('10000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000021','school_admin','active');
    `);
    const sessions = createSessionService(db, { sessionSecret });
    const session = await sessions.create({ userId: '00000000-0000-0000-0000-000000000020', schoolId: null, role: 'select_school', idToken: 'multi-school-id-token' });
    const code = randomBytes(24).toString('base64url');
    await db.query(`INSERT INTO school_invite(school_id,token_hash,created_by,expires_at)
      VALUES($1,$2,$3,now()+interval '1 day')`, ['10000000-0000-0000-0000-000000000021', digest(code), '00000000-0000-0000-0000-000000000021']);
    const joined = await redeemSchoolInvite(db, createRevocationJournal(db), {
      userId: '00000000-0000-0000-0000-000000000020', code, sessionTokenHash: hashSessionToken(session.token), sessionSecret,
    });
    assert.equal(joined.school_id, '10000000-0000-0000-0000-000000000021');
    assert.equal(joined.role, 'teacher');
    assert.equal(joined.idToken, 'multi-school-id-token');
    assert.equal(await sessions.resolve(session.token), null);
    assert.deepEqual((await db.query('SELECT school_id,role,status FROM school_membership WHERE user_id=$1 ORDER BY school_id', ['00000000-0000-0000-0000-000000000020'])).rows, [
      { school_id: '10000000-0000-0000-0000-000000000020', role: 'teacher', status: 'active' },
      { school_id: '10000000-0000-0000-0000-000000000021', role: 'teacher', status: 'active' },
    ]);
  } finally { await db.close(); }
});
