import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { getActivity } from '../server/activity-catalog.js';
import { createRevocationJournal } from '../server/revocation-journal.js';
import { deleteOwnAccount } from '../server/account-deletion.js';
import { verifyRestoredSchoolDatabase } from '../server/recovery.js';
import { loadConfig } from '../server/config.js';

const config = loadConfig();
const loopback = new Set(['127.0.0.1', 'localhost', '::1']);
if (config.mode !== 'local-oidc-test' || !loopback.has(new URL(config.publicOrigin).hostname)
    || !loopback.has(new URL(config.oidc.issuer).hostname)) {
  throw new Error('This verification is restricted to the synthetic local OIDC/loopback setup');
}
const migrationUrl = new URL(process.env.MIGRATION_DATABASE_URL || '');
if (!loopback.has(migrationUrl.hostname) || decodeURIComponent(migrationUrl.pathname) !== '/spansk_school') {
  throw new Error('Restore verification requires the loopback-only synthetic spansk_school migration database');
}

const base = config.publicOrigin;
const issuer = config.oidc.issuer;
const composeFile = fileURLToPath(new URL('../docker-compose.school.yml', import.meta.url));
const project = process.env.SCHOOL_POSTGRES_PROJECT || 'spansk123-school-local';
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const container = docker('compose', '-p', project, '-f', composeFile, 'ps', '-q', 'school-postgres');
if (!container) throw new Error(`No school-postgres container found for Compose project ${project}`);
const image = docker('inspect', '--format', '{{.Config.Image}}', container);
if (image !== 'postgres:17-alpine') throw new Error('Restore verification requires the configured postgres:17-alpine image');
const runPostgresTool = (password, tool, args) => execFileSync(
  'docker', ['exec', '-e', 'PGPASSWORD', container, tool, ...args],
  { env: { ...process.env, PGPASSWORD: password }, stdio: ['ignore', 'pipe', 'pipe'] },
);

const appPool = new pg.Pool({ connectionString: config.databaseUrl, max: 4 });
const journalPool = new pg.Pool({ connectionString: config.journalDatabaseUrl, max: 2 });
const migratorPool = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL, max: 2 });
const journal = createRevocationJournal(journalPool);
let classId;
let restorePool;
let restoreDatabase;
let backupPath;
let restoreUserId;
let restoreClassId;
let restoreAssignmentId;
let restoreTeacherGrantId;
let restoreStudentGrantId;
const tenantFixtureOwners = [];
const tenantFixtureSchools = [];
const tenantFixtureUsers = [];
const tenantFixtureClasses = [];
const tenantFixtureAssignments = [];
const cleanupFailures = [];
const syntheticSessionHashes = [];
const clean = async (action) => { try { await action(); } catch { cleanupFailures.push(true); } };

class LocalBrowser {
  cookies = new Map();

  async request(url, options = {}) {
    const target = new URL(url, base);
    const headers = { ...(options.headers || {}) };
    if (this.cookies.size) headers.cookie = [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
    if (options.body !== undefined && !headers['content-type']) headers['content-type'] = 'application/json';
    if (options.body !== undefined && target.origin === base && options.method !== 'GET') headers.origin = base;
    const response = await fetch(target, { ...options, headers, redirect: 'manual', signal: AbortSignal.timeout(10_000) });
    for (const line of response.headers.getSetCookie()) {
      const [pair, ...attributes] = line.split(';');
      const separator = pair.indexOf('=');
      if (separator < 0) continue;
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      if (attributes.some((attribute) => /^\s*max-age=0\s*$/iu.test(attribute))) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    return response;
  }

  csrf() { return decodeURIComponent(this.cookies.get('spansk_csrf_dev') || ''); }

  async json(path, { method = 'GET', body } = {}) {
    const headers = { accept: 'application/json' };
    if (method !== 'GET') headers['x-csrf-token'] = this.csrf();
    const response = await this.request(path, { method, body: body === undefined ? undefined : JSON.stringify(body), headers });
    return { status: response.status, body: await response.json() };
  }
}

async function signIn(browser, accountId) {
  let response = await browser.request('/auth/login');
  assert.equal(response.status, 303);
  let next = new URL(response.headers.get('location'));
  for (let step = 0; step < 12; step += 1) {
    if (next.origin === base && next.pathname === '/auth/callback') break;
    response = await browser.request(next);
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      next = new URL(response.headers.get('location'), next);
      if (next.origin === base && next.pathname === '/auth/callback') break;
      if (next.origin === base && next.pathname === '/school') throw new Error('Unexpected synthetic OIDC redirect');
      continue;
    }
    const html = await response.text();
    const action = html.match(/<form\b[^>]*\baction="([^"]+)"/iu)?.[1];
    assert.ok(action && next.origin === issuer, `Expected local OIDC account selection (HTTP ${response.status})`);
    const login = await browser.request(new URL(action, issuer), {
      method: 'POST', headers: { origin: issuer, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ account: accountId }),
    });
    assert.ok(login.status >= 300 && login.status < 400, `Synthetic OIDC account selection failed (HTTP ${login.status})`);
    next = new URL(login.headers.get('location'), issuer);
  }
  assert.equal(next.origin, base);
  assert.equal(next.pathname, '/auth/callback');
  response = await browser.request(next);
  assert.equal(response.status, 303);
  const token = browser.cookies.get('spansk_session_dev');
  assert.ok(token, 'synthetic callback should establish a local session cookie');
  syntheticSessionHashes.push(createHash('sha256').update(token).digest());
}

async function verifyHttpFlow() {
  const serverVersion = await migratorPool.query('SHOW server_version');
  assert.match(serverVersion.rows[0].server_version, /^17\./u, 'the native verification must run on PostgreSQL 17');
  const runtime = await appPool.query('SELECT current_user,rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user');
  assert.deepEqual(runtime.rows[0], { current_user: 'app_runtime', rolsuper: false, rolbypassrls: false });
  assert.equal((await appPool.query('SELECT count(*)::int AS n FROM school')).rows[0].n, 0, 'RLS hides school rows without trusted request context');
  const journalRole = await journalPool.query(`SELECT current_user,has_table_privilege(current_user,'entitlement_revocation','INSERT') AS can_insert,
    has_table_privilege(current_user,'entitlement_revocation','UPDATE') AS can_update,
    has_table_privilege(current_user,'entitlement_revocation','DELETE') AS can_delete`);
  assert.deepEqual(journalRole.rows[0], { current_user: 'journal_runtime', can_insert: true, can_update: false, can_delete: false });

  const teacher = new LocalBrowser();
  await signIn(teacher, 'demo-teacher');
  assert.equal((await teacher.json('/api/session')).body.role, 'teacher');
  const page = await teacher.request('/school');
  assert.equal(page.status, 200);
  assert.match(page.headers.get('cache-control'), /no-store/iu);

  const created = await teacher.json('/api/classes', { method: 'POST', body: {
    name: `PostgreSQL-verifikasjon ${randomUUID().slice(0, 8)}`, schoolYear: '2026-2027',
  } });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  classId = created.body.id;
  const missingCsrf = await teacher.request('/api/classes', {
    method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ name: `Mangler CSRF ${randomUUID().slice(0, 8)}`, schoolYear: '2026-2027' }),
  });
  assert.equal(missingCsrf.status, 403, 'mutating class endpoints require a CSRF token');

  const classlessTeacher = new LocalBrowser();
  await signIn(classlessTeacher, 'demo-teacher-b');
  assert.equal((await classlessTeacher.json('/api/classes')).body.classes.length, 0, 'classless teacher must not inherit another teacher’s class');
  assert.equal((await classlessTeacher.json(`/api/classes/${classId}/progress`)).status, 404, 'classless teacher must not read another teacher’s class progress');

  const invite = await teacher.json(`/api/classes/${classId}/invitations`, { method: 'POST', body: { role: 'student' } });
  assert.equal(invite.status, 201);

  const student = new LocalBrowser();
  await signIn(student, 'demo-student-a');
  assert.equal((await student.json('/api/join-class', { method: 'POST', body: { code: invite.body.code } })).status, 200);
  assert.equal((await student.json('/api/classes')).status, 403, 'students cannot list teacher classes');
  assert.equal((await student.json(`/api/classes/${classId}/progress`)).status, 403, 'pending students cannot read teacher progress');
  assert.equal((await student.json('/api/activities')).status, 403, 'students cannot read the teacher activity catalog endpoint');
  const request = await teacher.json(`/api/classes/${classId}/requests`);
  assert.equal(request.body.requests.length, 1);
  assert.equal((await teacher.json(`/api/classes/${classId}/members/${request.body.requests[0].studentId}/approve`, { method: 'POST', body: {} })).status, 200);

  const activityIds = ['vocabulary.all.v1', 'grammar.a0Foundation.v1', 'verbs.present.v1', 'listening.leo-sevilla.v1'];
  const assignments = [];
  for (const activityId of activityIds) {
    const activity = getActivity(activityId);
    const published = await teacher.json('/api/assignments', { method: 'POST', body: {
      classId, activityId, title: `Syntetisk ${activity.area}`, questionCount: 1,
    } });
    assert.equal(published.status, 201, JSON.stringify(published.body));
    const openedList = await student.json('/api/assignments');
    assert.ok(openedList.body.assignments.some((item) => item.id === published.body.id));
    const opened = await student.json(`/api/assignments/${published.body.id}`);
    assert.equal(opened.status, 200, JSON.stringify(opened.body));
    assert.equal(opened.body.exercise.questions.length, 1);
    if (activity.audio) {
      const audio = await student.request(opened.body.exercise.audio);
      assert.equal(audio.status, 200);
      assert.match(audio.headers.get('content-type'), /audio\/wav/iu);
    }
    const question = activity.questions[0];
    const saved = await student.json(`/api/assignments/${published.body.id}/answers`, { method: 'POST', body: {
      eventId: randomUUID(), practiceSession: opened.body.practiceSession,
      questionId: question.id, answerId: question.correctOptionId,
    } });
    assert.equal(saved.status, 200, JSON.stringify(saved.body));
    assert.equal(saved.body.outcome, 'correct');
    assignments.push({ id: published.body.id, activity });
  }
  assert.equal((await student.json(`/api/classes/${classId}/progress`)).status, 403, 'student cannot read teacher progress');
  const progress = await teacher.json(`/api/classes/${classId}/progress`);
  assert.equal(progress.status, 200);
  for (const { id, activity } of assignments) {
    assert.ok(progress.body.rows.some((row) => row.assignmentId === id && row.area === activity.area && row.attempted === 1 && row.correct === 1));
  }
  const exported = await student.json('/api/me/export', { method: 'POST', body: {} });
  assert.equal(exported.status, 200);
  for (const { activity } of assignments) {
    assert.ok(exported.body.learningEvents.some((event) => event.content_id === activity.id && event.outcome === 'correct'));
  }
  assert.ok(exported.body.learningEvents.every((event) => !Object.hasOwn(event, 'answer') && !Object.hasOwn(event, 'raw_answer')));
}

async function verifyNativeTenantMatrix() {
  const ownerA = randomUUID();
  const ownerB = randomUUID();
  tenantFixtureOwners.push(ownerA, ownerB);
  await migratorPool.query(`INSERT INTO school_owner(id,display_name,external_reference,status,verification_reference,verified_by,verified_at)
    VALUES ($1,'Syntetisk eier A',$2,'active','synthetic-only','local-test',now()),
           ($3,'Syntetisk eier B',$4,'active','synthetic-only','local-test',now())`,
  [ownerA, `native-tenant-a-${ownerA}`, ownerB, `native-tenant-b-${ownerB}`]);

  const schools = [
    { id: randomUUID(), ownerId: ownerA, name: 'Skole A1' },
    { id: randomUUID(), ownerId: ownerA, name: 'Skole A2' },
    { id: randomUUID(), ownerId: ownerB, name: 'Skole B1' },
  ];
  tenantFixtureSchools.push(...schools.map((school) => school.id));
  for (const school of schools) {
    await migratorPool.query('INSERT INTO school(id,owner_id,feide_org_id,name) VALUES($1,$2,$3,$4)', [
      school.id, school.ownerId, `native-${school.id}`, school.name,
    ]);
    const classIdForSchool = randomUUID();
    tenantFixtureClasses.push(classIdForSchool);
    await migratorPool.query('INSERT INTO school_class(id,school_id,name,school_year) VALUES($1,$2,$3,$4)', [
      classIdForSchool, school.id, `Klasse ${school.name}`, '2026-2027',
    ]);
    const teachers = [randomUUID(), randomUUID()];
    const students = [randomUUID(), randomUUID()];
    tenantFixtureUsers.push(...teachers, ...students);
    for (const [index, userId] of teachers.entries()) {
      await migratorPool.query('INSERT INTO app_user(id,display_name,status) VALUES($1,$2,\'active\')', [userId, `${school.name} syntetisk lærer ${index + 1}`]);
      await migratorPool.query("INSERT INTO school_membership(school_id,user_id,role,status) VALUES($1,$2,'teacher','active')", [school.id, userId]);
      await migratorPool.query("INSERT INTO class_membership(school_id,class_id,user_id,role,status) VALUES($1,$2,$3,'teacher','active')", [school.id, classIdForSchool, userId]);
    }
    for (const [index, userId] of students.entries()) {
      await migratorPool.query('INSERT INTO app_user(id,display_name,status) VALUES($1,$2,\'active\')', [userId, `${school.name} syntetisk elev ${index + 1}`]);
      await migratorPool.query("INSERT INTO school_membership(school_id,user_id,role,status) VALUES($1,$2,'student','active')", [school.id, userId]);
      await migratorPool.query("INSERT INTO class_membership(school_id,class_id,user_id,role,status) VALUES($1,$2,$3,'student','active')", [school.id, classIdForSchool, userId]);
    }
    const assignmentId = randomUUID();
    tenantFixtureAssignments.push(assignmentId);
    await migratorPool.query(`INSERT INTO assignment(id,school_id,class_id,created_by,area,content_id,content_version,question_limit,title)
      VALUES($1,$2,$3,$4,'vocabulary','native.tenant.check','1',1,'Syntetisk tenantkontroll')`, [
      assignmentId, school.id, classIdForSchool, teachers[0],
    ]);
    for (const [index, studentId] of students.entries()) {
      await migratorPool.query('INSERT INTO assignment_recipient(school_id,assignment_id,student_id) VALUES($1,$2,$3)', [school.id, assignmentId, studentId]);
      await migratorPool.query(`INSERT INTO learning_event(id,school_id,assignment_id,student_id,area,content_id,content_version,question_id,outcome,attempt,practice_session)
        VALUES($1,$2,$3,$4,'vocabulary','native.tenant.check','1',$5,'correct',1,$6)`, [
        randomUUID(), school.id, assignmentId, studentId, `synthetic-question-${index + 1}`, randomUUID(),
      ]);
    }
    school.classId = classIdForSchool;
    school.teacherId = teachers[0];
  }

  const client = await appPool.connect();
  try {
    assert.equal(client.user, 'app_runtime', 'tenant matrix must run as the least-privileged application role');
    for (const school of schools) {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.school_id',$1,true),set_config('app.user_id',$2,true),set_config('app.role','teacher',true)", [school.id, school.teacherId]);
      assert.deepEqual((await client.query('SELECT id FROM school')).rows.map((row) => row.id), [school.id], `${school.name}: only the selected school is visible`);
      assert.deepEqual((await client.query('SELECT id FROM school_class')).rows.map((row) => row.id), [school.classId], `${school.name}: teacher sees only the class they teach`);
      assert.equal((await client.query('SELECT count(*)::int AS n FROM class_membership')).rows[0].n, 4, `${school.name}: class roster remains within the school and class`);
      assert.equal((await client.query('SELECT count(*)::int AS n FROM assignment')).rows[0].n, 1, `${school.name}: assignment listing is school-scoped`);
      assert.equal((await client.query('SELECT count(*)::int AS n FROM assignment_recipient')).rows[0].n, 2, `${school.name}: recipients are school-scoped`);
      assert.equal((await client.query('SELECT count(*)::int AS n FROM learning_event')).rows[0].n, 2, `${school.name}: learning progress is school-scoped`);
      await client.query('ROLLBACK');
    }

    await client.query('BEGIN');
    await client.query("SELECT set_config('app.school_id',$1,true),set_config('app.user_id',$2,true),set_config('app.role','teacher',true)", [schools[1].id, schools[0].teacherId]);
    assert.deepEqual((await client.query('SELECT id FROM school_class')).rows, [], 'teacher from school A1 cannot read school A2, although both schools have the same owner');
    assert.deepEqual((await client.query('SELECT id FROM assignment')).rows, [], 'same-owner teacher cannot read another school assignment');
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
}

async function verifyRealDumpRestore() {
  const owner = await migratorPool.query(`SELECT s.id FROM school s JOIN school_owner o ON o.id=s.owner_id
    WHERE o.external_reference='synthetic-local-school-owner' AND s.status='active' LIMIT 1`);
  assert.equal(owner.rowCount, 1, 'synthetic active school must exist');
  restoreUserId = randomUUID();
  const subject = `restore-verification-${randomUUID()}`;
  const issuerValue = config.oidc.issuer;
  await migratorPool.query("INSERT INTO app_user(id,display_name,status) VALUES($1,'Syntetisk gjenopprettingstest','active')", [restoreUserId]);
  await migratorPool.query('INSERT INTO feide_identity(issuer,subject,user_id) VALUES($1,$2,$3)', [issuerValue, subject, restoreUserId]);
  await migratorPool.query("INSERT INTO school_membership(school_id,user_id,role,status) VALUES($1,$2,'student','active')", [owner.rows[0].id, restoreUserId]);
  const restoreTeacherId = '81000000-0000-4000-8000-000000000001';
  const restoreStudentId = '81000000-0000-4000-8000-000000000003';
  restoreClassId = randomUUID();
  restoreAssignmentId = randomUUID();
  restoreTeacherGrantId = randomUUID();
  restoreStudentGrantId = randomUUID();
  await migratorPool.query('INSERT INTO school_class(id,school_id,name,school_year) VALUES($1,$2,$3,$4)', [
    restoreClassId, owner.rows[0].id, `Restore-klasse ${randomUUID().slice(0, 8)}`, '2026-2027',
  ]);
  await migratorPool.query("INSERT INTO class_membership(school_id,class_id,user_id,grant_id,role,status) VALUES($1,$2,$3,$4,'teacher','active')", [
    owner.rows[0].id, restoreClassId, restoreTeacherId, restoreTeacherGrantId,
  ]);
  await migratorPool.query("INSERT INTO class_membership(school_id,class_id,user_id,grant_id,role,status) VALUES($1,$2,$3,$4,'student','active')", [
    owner.rows[0].id, restoreClassId, restoreStudentId, restoreStudentGrantId,
  ]);
  await migratorPool.query(`INSERT INTO assignment(id,school_id,class_id,created_by,area,content_id,content_version,question_limit,title,status)
    VALUES($1,$2,$3,$4,'vocabulary','vocabulary.all.v1','restore-test-v1',1,'Syntetisk restorelekse','published')`, [
    restoreAssignmentId, owner.rows[0].id, restoreClassId, restoreTeacherId,
  ]);
  await migratorPool.query("INSERT INTO assignment_recipient(school_id,assignment_id,student_id,status) VALUES($1,$2,$3,'assigned')", [
    owner.rows[0].id, restoreAssignmentId, restoreStudentId,
  ]);
  const tokenHash = createHash('sha256').update(randomBytes(32)).digest();
  const csrfHash = createHash('sha256').update(randomBytes(32)).digest();
  await appPool.query("SELECT app_create_session($1,$2,$3,'student',$4,$5,$6,$7)", [
    tokenHash, restoreUserId, owner.rows[0].id, csrfHash, Buffer.from('synthetic encrypted token'), new Date(Date.now() + 3_600_000), null,
  ]);

  const snapshotCheckpoint = await journal.checkpoint();
  const password = process.env.MIGRATOR_PASSWORD;
  assert.ok(password, 'migration credential must be configured in the private local environment');
  const suffix = randomUUID().replaceAll('-', '');
  restoreDatabase = `restore_${suffix.slice(0, 20)}`;
  backupPath = `/tmp/${restoreDatabase}.dump`;
  runPostgresTool(password, 'pg_dump', ['-h', '127.0.0.1', '-U', 'app_migrator', '-d', 'spansk_school', '-Fc', '-f', backupPath]);
  runPostgresTool(password, 'createdb', ['-h', '127.0.0.1', '-U', 'app_migrator', restoreDatabase]);
  runPostgresTool(password, 'pg_restore', ['-h', '127.0.0.1', '-U', 'app_migrator', '-d', restoreDatabase, '--exit-on-error', backupPath]);

  const restoreUrl = new URL(process.env.MIGRATION_DATABASE_URL);
  restoreUrl.pathname = `/${restoreDatabase}`;
  restorePool = new pg.Pool({ connectionString: restoreUrl.toString(), max: 1 });
  await journal.revoke(restoreTeacherGrantId, 'class_membership_removed');
  await journal.revoke(restoreStudentGrantId, 'class_membership_removed');
  await migratorPool.query("UPDATE class_membership SET status='revoked' WHERE grant_id=ANY($1::uuid[])", [[restoreTeacherGrantId, restoreStudentGrantId]]);
  await migratorPool.query("UPDATE assignment_recipient SET status='removed' WHERE assignment_id=$1 AND student_id=$2", [restoreAssignmentId, restoreStudentId]);
  const deletion = await deleteOwnAccount(appPool, journal, restoreUserId);
  assert.equal(deletion.deleted, true);
  const replay = await verifyRestoredSchoolDatabase({ pool: restorePool, journal, snapshotCheckpoint });
  assert.ok(replay.reappliedAccountDeletions >= 1, 'post-snapshot account deletion must be replayed');
  const user = await restorePool.query('SELECT status,display_name FROM app_user WHERE id=$1', [restoreUserId]);
  assert.deepEqual(user.rows[0], { status: 'deleted', display_name: 'Slettet konto' });
  assert.equal((await restorePool.query('SELECT count(*)::int AS n FROM feide_identity WHERE user_id=$1', [restoreUserId])).rows[0].n, 0);
  assert.equal((await restorePool.query("SELECT count(*)::int AS n FROM school_membership WHERE user_id=$1 AND status='active'", [restoreUserId])).rows[0].n, 0);
  const removedTeacher = await restorePool.query(`SELECT sm.status AS school_status,cm.status AS class_status
    FROM school_membership sm JOIN class_membership cm ON cm.school_id=sm.school_id AND cm.user_id=sm.user_id
    WHERE sm.user_id=$1 AND cm.class_id=$2`, [restoreTeacherId, restoreClassId]);
  assert.deepEqual(removedTeacher.rows[0], { school_status: 'active', class_status: 'revoked' }, 'a still-active teacher must not regain a removed class grant after restore');
  await restorePool.query('BEGIN');
  await restorePool.query("SELECT set_config('app.user_id',$1,true)", [restoreTeacherId]);
  assert.equal((await restorePool.query("SELECT app_is_class_member($1,$2,'teacher') AS allowed", [owner.rows[0].id, restoreClassId])).rows[0].allowed, false);
  await restorePool.query('ROLLBACK');
  assert.equal((await restorePool.query('SELECT status FROM assignment_recipient WHERE assignment_id=$1 AND student_id=$2', [restoreAssignmentId, restoreStudentId])).rows[0].status, 'removed', 'a removed student must not regain a homework recipient after restore');
  const restoredSessions = await restorePool.query('SELECT revoked_at IS NOT NULL AS revoked,encrypted_id_token IS NULL AS token_cleared FROM app_session WHERE user_id=$1', [restoreUserId]);
  assert.equal(restoredSessions.rows.length, 1);
  assert.deepEqual(restoredSessions.rows[0], { revoked: true, token_cleared: true });
  assert.ok(replay.reappliedMembershipRevocations >= 2, 'post-snapshot class membership revocations must be replayed');
  return { invalidatedSessions: replay.invalidatedSessions, reappliedMembershipRevocations: replay.reappliedMembershipRevocations };
}

try {
  await verifyHttpFlow();
  await verifyNativeTenantMatrix();
  const restoreResults = await verifyRealDumpRestore();
  console.log(`Native PostgreSQL verification passed: least-privilege/RLS, two synthetic owners across three schools with two teachers/two students per school and cross-school denial, negative CSRF and class/role boundaries, synthetic OIDC teacher/student flow across four homework areas, and pg_dump/pg_restore with newer class-removal/account-deletion journal replay (${restoreResults.reappliedMembershipRevocations} class grants replayed; ${restoreResults.invalidatedSessions} restored sessions invalidated).`);
} finally {
  if (restorePool) await clean(() => restorePool.end());
  if (restoreDatabase) await clean(() => migratorPool.query(`DROP DATABASE IF EXISTS "${restoreDatabase}" WITH (FORCE)`));
  if (backupPath && process.env.MIGRATOR_PASSWORD) {
    await clean(() => runPostgresTool(process.env.MIGRATOR_PASSWORD, 'rm', ['-f', '--', backupPath]));
  }
  if (restoreClassId) {
    await clean(() => migratorPool.query('DELETE FROM assignment_recipient WHERE assignment_id=$1', [restoreAssignmentId]));
    await clean(() => migratorPool.query('DELETE FROM assignment WHERE id=$1', [restoreAssignmentId]));
    await clean(() => migratorPool.query('DELETE FROM class_membership WHERE class_id=$1', [restoreClassId]));
    await clean(() => migratorPool.query('DELETE FROM school_class WHERE id=$1', [restoreClassId]));
  }
  if (classId) {
    await clean(() => migratorPool.query('DELETE FROM learning_event WHERE assignment_id IN (SELECT id FROM assignment WHERE class_id=$1)', [classId]));
    await clean(() => migratorPool.query('DELETE FROM assignment_recipient WHERE assignment_id IN (SELECT id FROM assignment WHERE class_id=$1)', [classId]));
    await clean(() => migratorPool.query('DELETE FROM assignment WHERE class_id=$1', [classId]));
    await clean(() => migratorPool.query('DELETE FROM class_invite WHERE class_id=$1', [classId]));
    await clean(() => migratorPool.query('DELETE FROM class_membership WHERE class_id=$1', [classId]));
    await clean(() => migratorPool.query('DELETE FROM school_class WHERE id=$1', [classId]));
  }
  if (tenantFixtureAssignments.length) {
    await clean(() => migratorPool.query('DELETE FROM learning_event WHERE assignment_id=ANY($1::uuid[])', [tenantFixtureAssignments]));
    await clean(() => migratorPool.query('DELETE FROM assignment_recipient WHERE assignment_id=ANY($1::uuid[])', [tenantFixtureAssignments]));
    await clean(() => migratorPool.query('DELETE FROM assignment WHERE id=ANY($1::uuid[])', [tenantFixtureAssignments]));
  }
  if (tenantFixtureClasses.length) {
    await clean(() => migratorPool.query('DELETE FROM class_membership WHERE class_id=ANY($1::uuid[])', [tenantFixtureClasses]));
    await clean(() => migratorPool.query('DELETE FROM school_class WHERE id=ANY($1::uuid[])', [tenantFixtureClasses]));
  }
  if (tenantFixtureSchools.length) await clean(() => migratorPool.query('DELETE FROM school_membership WHERE school_id=ANY($1::uuid[])', [tenantFixtureSchools]));
  if (tenantFixtureUsers.length) await clean(() => migratorPool.query('DELETE FROM app_user WHERE id=ANY($1::uuid[])', [tenantFixtureUsers]));
  if (tenantFixtureSchools.length) await clean(() => migratorPool.query('DELETE FROM school WHERE id=ANY($1::uuid[])', [tenantFixtureSchools]));
  if (tenantFixtureOwners.length) await clean(() => migratorPool.query('DELETE FROM school_owner WHERE id=ANY($1::uuid[])', [tenantFixtureOwners]));
  for (const tokenHash of syntheticSessionHashes) await clean(() => migratorPool.query('DELETE FROM app_session WHERE token_hash=$1', [tokenHash]));
  if (restoreUserId) {
    await clean(() => migratorPool.query('DELETE FROM app_session WHERE user_id=$1', [restoreUserId]));
    await clean(() => migratorPool.query('DELETE FROM school_membership WHERE user_id=$1', [restoreUserId]));
    await clean(() => migratorPool.query('DELETE FROM feide_identity WHERE user_id=$1', [restoreUserId]));
    await clean(() => migratorPool.query('DELETE FROM app_user WHERE id=$1', [restoreUserId]));
  }
  await Promise.all([clean(() => appPool.end()), clean(() => journalPool.end()), clean(() => migratorPool.end())]);
  if (cleanupFailures.length) {
    console.error('Synthetic PostgreSQL verification cleanup was incomplete. Check the temporary restore database, dump file, or synthetic test rows before running again.');
    process.exitCode = 1;
  }
}
