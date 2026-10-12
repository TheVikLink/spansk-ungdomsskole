import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createSchoolApp } from '../../server/app.js';
import { createLocalOidcProvider } from '../../server/local-oidc-provider.js';
import { getActivity } from '../../server/activity-catalog.js';

class LocalBrowser {
  constructor(origin) { this.origin = origin; this.cookies = new Map(); this.cookieHeaders = new Map(); }

  cookieHeader() { return [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; '); }
  csrf() { return this.cookies.get('spansk_csrf_dev') || ''; }

  async request(url, { method = 'GET', body, headers = {} } = {}) {
    const absolute = new URL(url, this.origin);
    const requestHeaders = { ...headers };
    if (this.cookies.size) requestHeaders.cookie = this.cookieHeader();
    if (body !== undefined && !requestHeaders['content-type']) requestHeaders['content-type'] = 'application/json';
    if (body !== undefined && absolute.origin === this.origin && method !== 'GET' && !requestHeaders.origin) requestHeaders.origin = this.origin;
    const response = await fetch(absolute, { method, headers: requestHeaders, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body), redirect: 'manual', signal: AbortSignal.timeout(5000) });
    for (const line of response.headers.getSetCookie()) {
      const [pair, ...attributes] = line.split(';');
      const separator = pair.indexOf('=');
      if (separator < 0) continue;
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      this.cookieHeaders.set(name, line);
      if (attributes.some((attribute) => /^\s*max-age=0\s*$/iu.test(attribute))) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    return response;
  }

  async json(url, options = {}) {
    const headers = { ...(options.headers || {}), accept: 'application/json' };
    if (options.method && options.method !== 'GET') headers['x-csrf-token'] = decodeURIComponent(this.csrf());
    const response = await this.request(url, { ...options, headers });
    return { status: response.status, body: await response.json() };
  }
}

async function freePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function asPool(database) {
  return {
    query: database.query.bind(database),
    async connect() { return { query: database.query.bind(database), release() {} }; },
  };
}

async function authorizationCallback(browser, issuer, accountId, expectedAcr, level) {
  let response = await browser.request(`${browser.origin}/auth/login${level ? `?level=${level}` : ''}`);
  assert.equal(response.status, 303);
  let next = new URL(response.headers.get('location'));
  assert.equal(next.origin, issuer, 'authorization redirect must target the configured OIDC issuer');
  assert.equal(next.searchParams.get('redirect_uri'), `${browser.origin}/auth/callback`, 'callback target must be fixed to this application origin');
  assert.equal(next.searchParams.get('response_type'), 'code');
  assert.equal(next.searchParams.get('response_mode'), 'form_post', 'Feide callback must keep code and state out of the URL');
  assert.equal(next.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(next.searchParams.get('code_challenge'), 'authorization request must include a PKCE challenge');
  assert.ok(next.searchParams.get('state'), 'authorization request must include state');
  assert.ok(next.searchParams.get('nonce'), 'authorization request must include nonce');
  if (expectedAcr) assert.equal(next.searchParams.get('acr_values'), expectedAcr);
  for (let step = 0; step < 12; step += 1) {
    if (next.origin === browser.origin && next.pathname === '/auth/callback') return { url: next, method: 'GET', body: null, issuer };
    response = await browser.request(next);
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      next = new URL(response.headers.get('location'), next);
      if (next.origin === browser.origin && next.pathname === '/school') return;
      continue;
    }
    const html = await response.text();
    const formAction = html.match(/<form\b[^>]*\baction="([^"]+)"/iu)?.[1];
    if (formAction && new URL(formAction, issuer).origin === browser.origin) {
      const form = html.match(/<form\b[^>]*\baction="([^"]+)"[^>]*>([\s\S]*?)<\/form>/iu);
      const fields = new URLSearchParams();
      for (const [, name, value] of form?.[2].matchAll(/<input\s+type="hidden"\s+name="([^"]+)"\s+value="([^"]*)"\s*\/>/giu) || []) fields.append(name, value);
      return { url: new URL(formAction, issuer), method: 'POST', body: fields.toString(), issuer };
    }
    if (!formAction || new URL(next).origin !== issuer) throw new Error(`Local OIDC interaction did not present a login form (HTTP ${response.status})`);
    const login = await browser.request(new URL(formAction, issuer), {
      method: 'POST', headers: { origin: issuer, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ account: accountId }).toString(),
    });
    if (login.status < 300 || login.status >= 400 || !login.headers.get('location')) throw new Error(`Synthetic OIDC login failed (HTTP ${login.status})`);
    next = new URL(login.headers.get('location'), issuer);
    if (next.origin === browser.origin && next.pathname === '/auth/callback') return { url: next, method: 'GET', body: null, issuer };
  }
  throw new Error('OIDC redirect loop exceeded the local test limit');
}

async function signIn(browser, issuer, accountId, expectedAcr, level) {
  const callback = await authorizationCallback(browser, issuer, accountId, expectedAcr, level);
  const response = await browser.request(callback.url, { method: callback.method, body: callback.body, headers: callback.method === 'POST' ? { origin: callback.issuer, 'content-type': 'application/x-www-form-urlencoded' } : {} });
  assert.equal(response.status, 303);
  const destination = new URL(response.headers.get('location'), browser.origin);
  assert.equal(destination.pathname, '/school');
  assert.equal(destination.search, '', 'successful callback redirects to a clean URL without OIDC parameters');
  assert.match(response.headers.get('cache-control') || '', /no-store/u, 'OIDC callback response must not be cached');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer', 'callback URL must not be sent as a referrer');
}

test('synthetic local OIDC → class invite → four homework areas → saved progress', { timeout: 60_000 }, async () => {
  const database = new PGlite();
  const journalDatabase = new PGlite();
  let appServer;
  let providerServer;
  try {
    await database.exec('CREATE ROLE app_runtime NOLOGIN NOBYPASSRLS');
    await database.exec(await readFile(new URL('../../server/migrations/001_initial.sql', import.meta.url), 'utf8'));
    await database.exec(await readFile(new URL('../../server/migrations/002_school_membership_lifecycle.sql', import.meta.url), 'utf8'));
    await database.exec(await readFile(new URL('../../server/migrations/003_account_deletion.sql', import.meta.url), 'utf8'));
    await database.exec(await readFile(new URL('../../server/migrations/004_session_auth_level.sql', import.meta.url), 'utf8'));
    await database.exec('CREATE ROLE school_owner_provisioner NOLOGIN NOBYPASSRLS');
    await database.exec(await readFile(new URL('../../server/migrations/005_school_owner_tenants.sql', import.meta.url), 'utf8'));
    await database.exec(await readFile(new URL('../../server/migrations/006_assignment_content_snapshots.sql', import.meta.url), 'utf8'));
    await journalDatabase.exec(await readFile(new URL('../../server/journal-migrations/001_revocations.sql', import.meta.url), 'utf8'));
    await journalDatabase.exec(await readFile(new URL('../../server/journal-migrations/002_account_deletion.sql', import.meta.url), 'utf8'));
    await database.exec(`
      INSERT INTO school_owner(id,display_name,external_reference,status,verification_reference,verified_by,verified_at)
       VALUES ('10000000-0000-4000-8000-000000000010','Syntetisk eier A','synthetic-owner-e2e-a','active','synthetic-only','e2e-seed',now()),
        ('10000000-0000-4000-8000-000000000011','Syntetisk eier B','synthetic-owner-e2e-b','active','synthetic-only','e2e-seed',now());
      INSERT INTO school(id,owner_id,feide_org_id,name) VALUES ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000010','synthetic-e2e-org','Syntetisk demoskole');
      INSERT INTO app_user(id,display_name,status) VALUES ('00000000-0000-4000-8000-000000000001','Syntetisk lærer','active');
      INSERT INTO feide_identity(issuer,subject,user_id) VALUES ('http://placeholder.test','demo-teacher','00000000-0000-4000-8000-000000000001');
      INSERT INTO school_membership(school_id,user_id,role,status) VALUES ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','teacher','active');
      INSERT INTO app_user(id,display_name,status) VALUES ('00000000-0000-4000-8000-000000000003','Syntetisk skoleadministrator','active');
      INSERT INTO feide_identity(issuer,subject,user_id) VALUES ('http://placeholder.test','demo-admin','00000000-0000-4000-8000-000000000003');
      INSERT INTO school_membership(school_id,user_id,role,status) VALUES ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','school_admin','active');
      INSERT INTO app_user(id,display_name,status) VALUES ('00000000-0000-4000-8000-000000000004','Syntetisk administrator uten MFA','active');
      INSERT INTO feide_identity(issuer,subject,user_id) VALUES ('http://placeholder.test','demo-admin-low','00000000-0000-4000-8000-000000000004');
      INSERT INTO school_membership(school_id,user_id,role,status) VALUES ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000004','school_admin','active');
      INSERT INTO app_user(id,display_name,status) VALUES ('00000000-0000-4000-8000-000000000002','Syntetisk forhåndsgodkjent elev','active');
      INSERT INTO feide_identity(issuer,subject,user_id) VALUES ('http://placeholder.test','demo-student-a','00000000-0000-4000-8000-000000000002');
      INSERT INTO school_membership(school_id,user_id,role,status) VALUES ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','student','active');
    `);
    const appPort = await freePort();
    const issuerPort = await freePort();
    const publicOrigin = `http://127.0.0.1:${appPort}`;
    const issuer = `http://127.0.0.1:${issuerPort}`;
    await database.query('UPDATE feide_identity SET issuer=$1', [issuer]);
    const config = {
      mode: 'local-oidc-test', nodeEnv: 'test', host: '127.0.0.1', port: appPort,
      publicOrigin, databaseUrl: 'postgres://local:local@127.0.0.1:5432/local', journalDatabaseUrl: 'postgres://local:local@127.0.0.1:5433/journal',
      oidc: { issuer, clientId: 'school-e2e', clientSecret: 'synthetic-oidc-client-secret-at-least-32' },
      adminRequiredAcr: 'urn:mace:feide.no:auth:level:fad08:3', teacherRequiredAcr: null,
      sessionSecret: 'synthetic-e2e-session-secret-long-enough-123',
      cookie: { name: 'spansk_session_dev', secure: false, sameSite: 'Lax', path: '/' }, trustedProxyHops: 0,
    };
    const pool = asPool(database);
    const provider = createLocalOidcProvider({ issuer, publicOrigin, clientId: config.oidc.clientId, clientSecret: config.oidc.clientSecret, cookieSecret: config.sessionSecret });
    providerServer = provider.app.listen(issuerPort, '127.0.0.1');
    const school = createSchoolApp({ config, appPool: pool, journalPool: asPool(journalDatabase), serveLocalStaticAssets: true });
    appServer = school.app.listen(appPort, '127.0.0.1');
    await Promise.all([providerServer, appServer].map((server) => server.listening
      ? Promise.resolve()
      : new Promise((resolve) => server.once('listening', resolve))));

    const cookieProbe = new LocalBrowser(publicOrigin);
    assert.equal((await cookieProbe.request('/auth/login')).status, 303);
    const transactionCookie = cookieProbe.cookieHeaders.get('spansk_oidc_tx_dev') || '';
    assert.match(transactionCookie, /Path=\//iu);
    assert.match(transactionCookie, /SameSite=None/iu);
    assert.match(transactionCookie, /HttpOnly/iu);
    assert.doesNotMatch(transactionCookie, /Domain=|Secure/iu, 'loopback HTTP test cookie omits production-only attributes');
    assert.ok(cookieProbe.cookies.has('spansk_oidc_tx_dev'));
    assert.equal((await cookieProbe.request('/auth/callback?code=forged&state=forged')).status, 405, 'query callbacks must not be accepted');

    for (const path of ['/healthz', '/api/runtime-mode', '/school', '/school.js', '/school.css', '/audio/school-content/not-a-hash.wav', '/auth/login', '/not-found']) {
      const response = await fetch(`${publicOrigin}${path}`, { redirect: 'manual' });
      assert.match(response.headers.get('content-security-policy') || '', /object-src 'none'/u, `CSP must cover ${path}`);
      assert.match(response.headers.get('content-security-policy') || '', /base-uri 'none'/u, `CSP must cover ${path}`);
      assert.match(response.headers.get('content-security-policy') || '', /frame-ancestors 'none'/u, `CSP must cover ${path}`);
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff', `nosniff must cover ${path}`);
      assert.equal(response.headers.get('referrer-policy'), 'no-referrer', `referrer policy must cover ${path}`);
      assert.equal(response.headers.get('x-frame-options'), 'DENY', `legacy frame protection remains present on ${path}`);
    }

    const malformedJson = await fetch(`${publicOrigin}/api/assignments`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"incomplete":',
    });
    assert.equal(malformedJson.status, 400, 'malformed JSON must be reported as a client input error');
    assert.match(malformedJson.headers.get('content-security-policy') || '', /frame-ancestors 'none'/u);
    assert.equal(malformedJson.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(malformedJson.headers.get('referrer-policy'), 'no-referrer');
    assert.match(malformedJson.headers.get('cache-control') || '', /no-store/u);
    assert.deepEqual(await malformedJson.json(), { error: 'JSON-forespørselen er ugyldig.' });
    const oversizedJson = await fetch(`${publicOrigin}/api/assignments`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'x'.repeat(17 * 1024) }),
    });
    assert.equal(oversizedJson.status, 413, 'the JSON body limit must be reported without attempting the route');
    assert.match(oversizedJson.headers.get('content-security-policy') || '', /frame-ancestors 'none'/u);
    assert.equal(oversizedJson.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(oversizedJson.headers.get('referrer-policy'), 'no-referrer');
    assert.match(oversizedJson.headers.get('cache-control') || '', /no-store/u);
    assert.deepEqual(await oversizedJson.json(), { error: 'Forespørselen er for stor.' });

    const duplicateStateLogin = new LocalBrowser(publicOrigin);
    const duplicateStateCallback = await authorizationCallback(duplicateStateLogin, issuer, 'demo-teacher');
    const duplicateStateBody = new URLSearchParams(duplicateStateCallback.body);
    duplicateStateBody.append('state', 'attacker-controlled-state');
    assert.equal((await duplicateStateLogin.request(duplicateStateCallback.url, { method: 'POST', headers: { origin: issuer, 'content-type': 'application/x-www-form-urlencoded' }, body: duplicateStateBody.toString() })).status, 403, 'duplicate state parameters must fail closed');
    assert.equal((await duplicateStateLogin.json('/api/session')).status, 401);

    const malformedCallback = new LocalBrowser(publicOrigin);
    const malformedForm = new URLSearchParams({ code: 'synthetic-code', state: 'synthetic-state', redirect_uri: 'https://attacker.invalid/' });
    assert.equal((await malformedCallback.request('/auth/callback', { method: 'POST', headers: { origin: issuer, 'content-type': 'application/x-www-form-urlencoded' }, body: malformedForm.toString() })).status, 403, 'unexpected callback fields must fail closed');
    assert.equal((await malformedCallback.json('/api/session')).status, 401);

    const tamperedLogin = new LocalBrowser(publicOrigin);
    const originalCallback = await authorizationCallback(tamperedLogin, issuer, 'demo-teacher');
    const tamperedBody = new URLSearchParams(originalCallback.body);
    tamperedBody.set('state', 'attacker-controlled-state');
    const tamperedCallback = { ...originalCallback, body: tamperedBody.toString() };
    assert.equal((await tamperedLogin.request(tamperedCallback.url, { method: 'POST', headers: { origin: issuer, 'content-type': 'application/x-www-form-urlencoded' }, body: tamperedCallback.body })).status, 403);
    assert.equal((await tamperedLogin.json('/api/session')).status, 401, 'state mismatch must not create an app session');
    assert.equal((await tamperedLogin.request(originalCallback.url, { method: 'POST', headers: { origin: issuer, 'content-type': 'application/x-www-form-urlencoded' }, body: originalCallback.body })).status, 403, 'the callback transaction is one-use even after a failed state check');

    const teacher = new LocalBrowser(publicOrigin);
    const schoolPage = await teacher.request('/school');
    assert.equal(schoolPage.status, 200);
    assert.match(await schoolPage.text(), /school\.js/u);
    await signIn(teacher, issuer, 'demo-teacher');
    const sessionCookie = teacher.cookieHeaders.get('spansk_session_dev') || '';
    const csrfCookie = teacher.cookieHeaders.get('spansk_csrf_dev') || '';
    assert.match(sessionCookie, /Path=\//iu);
    assert.match(sessionCookie, /SameSite=Lax/iu);
    assert.match(sessionCookie, /HttpOnly/iu);
    assert.match(csrfCookie, /Path=\//iu);
    assert.match(csrfCookie, /SameSite=Strict/iu);
    assert.doesNotMatch(csrfCookie, /HttpOnly/iu, 'CSRF double-submit cookie must remain readable by the client');
    const teacherSession = await teacher.json('/api/session');
    assert.equal(teacherSession.body.role, 'teacher');
    assert.equal((await teacher.json('/api/school/teacher-invitations', { method: 'POST', body: {} })).status, 403);

    const administrator = new LocalBrowser(publicOrigin);
    await signIn(administrator, issuer, 'demo-admin');
    const administratorSession = await administrator.json('/api/session');
    assert.equal(administratorSession.body.role, 'school_admin');
    const lowAdmin = new LocalBrowser(publicOrigin);
    await signIn(lowAdmin, issuer, 'demo-admin-low');
    const lowAdminSession = await lowAdmin.json('/api/session');
    assert.equal(lowAdminSession.status, 403);
    assert.equal(lowAdminSession.body.reauthenticationRequired, true);
    await signIn(lowAdmin, issuer, 'demo-admin-low', config.adminRequiredAcr, 'school_admin');
    const elevatedSession = await lowAdmin.json('/api/session');
    assert.equal(elevatedSession.body.role, 'school_admin', `a step-up login with the requested ACR unlocks admin access: ${JSON.stringify(elevatedSession)}`);
    const revokedInvite = await administrator.json('/api/school/teacher-invitations', { method: 'POST', body: {} });
    assert.equal(revokedInvite.status, 201);
    assert.match(revokedInvite.body.code, /^[A-Za-z0-9_-]{32}$/u);
    assert.equal((await administrator.json(`/api/school/teacher-invitations/${revokedInvite.body.id}/revoke`, { method: 'POST', body: {} })).status, 200);

    const pendingTeacher = new LocalBrowser(publicOrigin);
    await signIn(pendingTeacher, issuer, 'demo-teacher-b');
    assert.equal((await pendingTeacher.json('/api/session')).body.role, 'pending');
    assert.equal((await pendingTeacher.json('/api/classes')).status, 409, 'an unapproved account cannot read class data');
    assert.equal((await pendingTeacher.json('/api/assignments')).status, 409, 'an unapproved account cannot read homework');
    assert.equal((await pendingTeacher.json('/api/school/members')).status, 409, 'an unapproved account cannot enumerate school members');
    assert.equal((await pendingTeacher.json('/api/join-school', { method: 'POST', body: { code: revokedInvite.body.code } })).status, 400);
    const teacherInvite = await administrator.json('/api/school/teacher-invitations', { method: 'POST', body: {} });
    assert.equal(teacherInvite.status, 201);
    assert.equal((await pendingTeacher.json('/api/join-school', { method: 'POST', body: { code: teacherInvite.body.code } })).status, 200);
    assert.equal((await pendingTeacher.json('/api/session')).body.role, 'teacher');
    assert.equal((await pendingTeacher.json('/api/classes')).status, 200);

    const classPayload = JSON.parse('{"name":"Spanskgruppe A","schoolYear":"2026-2027","__proto__":{"role":"school_admin","schoolId":"00000000-0000-4000-8000-000000000001"}}');
    const createdClass = await teacher.json('/api/classes', { method: 'POST', body: classPayload });
    assert.equal(createdClass.status, 201, JSON.stringify(createdClass.body));
    assert.equal((await teacher.json('/api/school/members')).status, 403, 'unexpected prototype fields must not escalate the authenticated role');
    const classId = createdClass.body.id;
    const coTeacherInvite = await teacher.json(`/api/classes/${classId}/invitations`, { method: 'POST', body: { role: 'teacher' } });
    assert.equal(coTeacherInvite.status, 201);
    const coTeacherJoin = await pendingTeacher.json('/api/join-class', { method: 'POST', body: { code: coTeacherInvite.body.code } });
    assert.equal(coTeacherJoin.status, 200);
    assert.equal(coTeacherJoin.body.memberRole, 'teacher');
    const coTeacherRequest = await teacher.json(`/api/classes/${classId}/requests`);
    assert.equal(coTeacherRequest.body.requests.length, 1);
    assert.equal(coTeacherRequest.body.requests[0].role, 'teacher');
    assert.equal((await teacher.json(`/api/classes/${classId}/members/${coTeacherRequest.body.requests[0].studentId}/approve`, { method: 'POST', body: {} })).status, 200);
    assert.ok((await pendingTeacher.json('/api/classes')).body.classes.some((item) => item.id === classId));
    const invitation = await teacher.json(`/api/classes/${classId}/invitations`, { method: 'POST', body: {} });
    assert.equal(invitation.status, 201, JSON.stringify(invitation.body));

    const student = new LocalBrowser(publicOrigin);
    await signIn(student, issuer, 'demo-student-a');
    const studentASession = await student.json('/api/session');
    assert.equal(studentASession.body.role, 'student');
    const joined = await student.json('/api/join-class', { method: 'POST', body: { code: invitation.body.code } });
    assert.equal(joined.status, 200, JSON.stringify(joined.body));
    assert.equal(joined.body.membership, 'pending');
    assert.equal((await student.json('/api/session')).body.role, 'student');
    assert.equal((await student.json('/api/assignments')).body.assignments.length, 0);
    const requests = await teacher.json(`/api/classes/${classId}/requests`);
    assert.equal(requests.body.requests.length, 1);
    assert.equal(requests.body.requests[0].displayName, 'Syntetisk elev A');
    assert.equal((await teacher.json(`/api/classes/${classId}/members/${requests.body.requests[0].studentId}/approve`, { method: 'POST', body: {} })).status, 200);
    assert.equal((await teacher.json(`/api/classes/${classId}/requests`)).body.requests.length, 0);

    const secondStudentUserId = '00000000-0000-4000-8000-000000000005';
    await database.query("INSERT INTO app_user(id,display_name,status) VALUES($1,'Syntetisk elev B','active')", [secondStudentUserId]);
    await database.query("INSERT INTO feide_identity(issuer,subject,user_id) VALUES($1,'demo-student-b',$2)", [issuer, secondStudentUserId]);
    await database.query("INSERT INTO school_membership(school_id,user_id,role,status) VALUES('10000000-0000-4000-8000-000000000001',$1,'student','active')", [secondStudentUserId]);
    await database.query('INSERT INTO class_membership(school_id,class_id,user_id,role,status) VALUES($1,$2,$3,\'student\',\'active\')', ['10000000-0000-4000-8000-000000000001', classId, secondStudentUserId]);
    const secondStudent = new LocalBrowser(publicOrigin);
    await signIn(secondStudent, issuer, 'demo-student-b');
    const secondStudentSession = await secondStudent.json('/api/session');
    assert.equal(secondStudentSession.body.role, 'student');
    assert.notEqual(secondStudentSession.body.userId, studentASession.body.userId);
    for (const [path, method, body] of [
      ['/api/classes', 'GET'], ['/api/activities', 'GET'], [`/api/classes/${classId}/progress`, 'GET'],
      [`/api/classes/${classId}/requests`, 'GET'], [`/api/classes/${classId}/export`, 'POST', {}],
      ['/api/school/members', 'GET'], ['/api/school/teacher-invitations', 'POST', {}],
    ]) assert.equal((await secondStudent.json(path, { method, body })).status, 403, `student role cannot access ${method} ${path}`);
    assert.equal((await administrator.json('/api/classes')).status, 403, 'school administrator does not inherit teacher class access');
    assert.equal((await administrator.json('/api/activities')).status, 403, 'school administrator does not inherit teacher activity access');

    const activityIds = ['vocabulary.all.v1', 'grammar.a0Foundation.v1', 'verbs.present.v1', 'listening.leo-sevilla.v1'];
    const assignments = [];
    for (const activityId of activityIds) {
      const activity = getActivity(activityId);
      const published = await teacher.json('/api/assignments', { method: 'POST', body: {
        classId, activityId, title: `Syntetisk lekse ${activity.area}`, questionCount: 1,
      } });
      assert.equal(published.status, 201, JSON.stringify(published.body));
      assignments.push({ id: published.body.id, activity, publishedQuestion: structuredClone(activity.questions[0]), publishedAudio: activity.audio || null });
    }
    const versions = await database.query('SELECT DISTINCT content_version FROM assignment WHERE school_id=$1', ['10000000-0000-4000-8000-000000000001']);
    assert.equal(versions.rows.length, 4);
    assert.ok(versions.rows.every((row) => /^sha256:[a-f0-9]{64}$/u.test(row.content_version)));
    const storedQuestionCounts = await database.query("SELECT count(*)::int AS n FROM assignment WHERE school_id=$1 AND jsonb_array_length(content_snapshot->'questions')=1", ['10000000-0000-4000-8000-000000000001']);
    assert.equal(storedQuestionCounts.rows[0].n, 4, 'only the questions assigned to learners are copied into each immutable snapshot');
    await database.query("UPDATE class_membership SET status='pending' WHERE school_id=$1 AND class_id=$2 AND user_id=$3", ['10000000-0000-4000-8000-000000000001', classId, studentASession.body.userId]);
    assert.equal((await student.json('/api/assignments')).body.assignments.length, 0, 'pending class membership receives no homework');
    assert.equal((await student.json(`/api/assignments/${assignments[0].id}`)).status, 404, 'pending class membership cannot open a known assignment ID');
    const pendingClassAnswer = await student.json(`/api/assignments/${assignments[0].id}/answers`, { method: 'POST', body: {
      eventId: '50000000-0000-4000-8000-000000000034', practiceSession: '50000000-0000-4000-8000-000000000035',
      questionId: assignments[0].activity.questions[0].id, answerId: assignments[0].activity.questions[0].options[0].id,
    } });
    assert.equal(pendingClassAnswer.status, 404, 'pending class membership cannot submit against a guessed assignment');
    await database.query("UPDATE class_membership SET status='active' WHERE school_id=$1 AND class_id=$2 AND user_id=$3", ['10000000-0000-4000-8000-000000000001', classId, studentASession.body.userId]);
    assert.equal((await student.json('/api/assignments')).body.assignments.length, 4);
    assert.equal((await secondStudent.json('/api/assignments')).body.assignments.length, 4, 'published recipient snapshot includes both active students');
    const secondStudentAssignments = (await secondStudent.json('/api/assignments')).body.assignments;
    assert.deepEqual(new Set(secondStudentAssignments.map((item) => item.id)), new Set(assignments.map((item) => item.id)));

    let firstEventId;
    const liveVocabulary = getActivity(assignments[0].activity.id);
    const liveVocabularyQuestions = structuredClone(liveVocabulary.questions);
    liveVocabulary.questions[0] = { ...liveVocabulary.questions[0], prompt: 'Ny katalogversjon etter publisering', correctOptionId: liveVocabulary.questions[0].options.find((option) => option.id !== liveVocabulary.questions[0].correctOptionId).id };
    const listeningAssignment = assignments.find((assignment) => assignment.activity.area === 'listening');
    const liveListening = getActivity(listeningAssignment.activity.id);
    const liveListeningAudio = liveListening.audio;
    liveListening.audio = `/audio/school-content/${'0'.repeat(64)}.wav`;
    for (const assignment of assignments) {
      const opened = await student.json(`/api/assignments/${assignment.id}`);
      assert.equal(opened.status, 200, JSON.stringify(opened.body));
      assert.equal(opened.body.exercise.questions.length, 1);
      assert.equal(opened.body.exercise.questions[0].prompt, assignment.publishedQuestion.prompt, 'a later catalogue edit cannot change a published exercise');
      if (assignment.activity.area === 'listening') {
        assert.equal(opened.body.exercise.audio, assignment.publishedAudio, 'a later recording/catalogue update cannot change the published audio asset');
        assert.match(opened.body.exercise.audio, /^\/audio\/school-content\/[a-f0-9]{64}\.wav$/u);
        const audio = await student.request(opened.body.exercise.audio);
        assert.equal(audio.status, 200);
        assert.match(audio.headers.get('content-type'), /audio\/wav/u);
        const audioBytes = Buffer.from(await audio.arrayBuffer());
        const audioDigest = createHash('sha256').update(audioBytes).digest('hex');
        assert.equal(audioDigest, opened.body.exercise.audio.split('/').at(-1).slice(0, -4));
      }
      const question = assignment.publishedQuestion;
      if (firstEventId) {
        const crossAssignmentReplay = await student.json(`/api/assignments/${assignment.id}/answers`, { method: 'POST', body: {
          eventId: firstEventId, practiceSession: opened.body.practiceSession,
          questionId: question.id, answerId: question.correctOptionId,
        } });
        assert.equal(crossAssignmentReplay.status, 409);
      }
      const eventId = crypto.randomUUID();
      if (!firstEventId) firstEventId = eventId;
      const saved = await student.json(`/api/assignments/${assignment.id}/answers`, { method: 'POST', body: {
        eventId, practiceSession: opened.body.practiceSession,
        questionId: question.id, answerId: question.correctOptionId,
      } });
      assert.equal(saved.status, 200, JSON.stringify(saved.body));
      assert.equal(saved.body.outcome, 'correct');
      assert.equal(saved.body.saved, true);
      const replay = await student.json(`/api/assignments/${assignment.id}/answers`, { method: 'POST', body: {
        eventId, practiceSession: opened.body.practiceSession,
        questionId: question.id, answerId: question.correctOptionId,
      } });
      assert.equal(replay.status, 200);
      assert.equal(replay.body.duplicate, true);
    }
    liveVocabulary.questions = liveVocabularyQuestions;
    liveListening.audio = liveListeningAudio;

    const firstSnapshot = await database.query('SELECT content_snapshot,content_version FROM assignment WHERE id=$1', [assignments[0].id]);
    const corruptedSnapshot = structuredClone(firstSnapshot.rows[0].content_snapshot);
    corruptedSnapshot.questions[0].prompt += ' endret uten ny versjon';
    await database.query('UPDATE assignment SET content_snapshot=$1::jsonb WHERE id=$2', [JSON.stringify(corruptedSnapshot), assignments[0].id]);
    assert.equal((await student.json(`/api/assignments/${assignments[0].id}`)).status, 404, 'content modified without rotating its digest is unavailable');
    const corruptAnswer = await student.json(`/api/assignments/${assignments[0].id}/answers`, { method: 'POST', body: {
      eventId: '50000000-0000-4000-8000-000000000032', practiceSession: '50000000-0000-4000-8000-000000000033',
      questionId: assignments[0].publishedQuestion.id, answerId: assignments[0].publishedQuestion.correctOptionId,
    } });
    assert.equal(corruptAnswer.status, 404, 'answers are not accepted against a snapshot that fails integrity validation');
    await database.query('UPDATE assignment SET content_snapshot=$1::jsonb WHERE id=$2', [JSON.stringify(firstSnapshot.rows[0].content_snapshot), assignments[0].id]);

    const stored = await database.query('SELECT area,count(*)::int AS n FROM learning_event GROUP BY area ORDER BY area');
    assert.deepEqual(stored.rows, [
      { area: 'grammar', n: 1 }, { area: 'listening', n: 1 }, { area: 'verbs', n: 1 }, { area: 'vocabulary', n: 1 },
    ]);
    const progress = await teacher.json(`/api/classes/${classId}/progress`);
    assert.deepEqual([...new Set(progress.body.rows.map((row) => row.area))].sort(), ['grammar', 'listening', 'verbs', 'vocabulary']);
    const studentAProgress = progress.body.rows.filter((row) => row.studentId === studentASession.body.userId);
    const studentBProgress = progress.body.rows.filter((row) => row.studentId === secondStudentSession.body.userId);
    assert.equal(studentAProgress.length, 4);
    assert.ok(studentAProgress.every((row) => row.attempted === 1 && row.total === 1 && row.correct === 1));
    assert.equal(studentBProgress.length, 4);
    assert.ok(studentBProgress.every((row) => row.attempted === 0 && row.total === 1 && row.correct === 0));

    const studentExport = await student.json('/api/me/export', { method: 'POST', body: {} });
    assert.equal(studentExport.status, 200);
    assert.equal(studentExport.body.learningEvents.length, 4);
    const secondStudentQuestion = assignments[0].activity.questions[0];
    await database.query(`
      INSERT INTO learning_event(id,school_id,assignment_id,student_id,area,content_id,content_version,question_id,outcome,attempt,hints_used,practice_session)
      VALUES('50000000-0000-4000-8000-000000000030','10000000-0000-4000-8000-000000000001',$1,$2,$3,$4,'1',$5,'correct',1,0,'50000000-0000-4000-8000-000000000031')
    `, [assignments[0].id, secondStudentSession.body.userId, assignments[0].activity.area, assignments[0].activity.id, secondStudentQuestion.id]);
    const swappedExport = await secondStudent.json(`/api/me/export?studentId=${studentASession.body.userId}`, { method: 'POST', body: {} });
    assert.equal(swappedExport.status, 200);
    assert.deepEqual(swappedExport.body.learningEvents.map((event) => event.id), ['50000000-0000-4000-8000-000000000030'], 'changing a query user ID cannot export another learner data when this account has its own records');

    await database.query("UPDATE app_user SET status='blocked' WHERE id=$1", [secondStudentSession.body.userId]);
    assert.equal((await secondStudent.json('/api/session')).status, 401, 'blocking an account invalidates its already-issued session');
    assert.equal((await secondStudent.json('/api/assignments')).status, 401, 'a blocked account cannot read assignments through its old cookie');
    assert.equal((await secondStudent.json('/api/me/export', { method: 'POST', body: {} })).status, 401, 'a blocked account cannot export data through its old cookie');
    assert.ok(studentExport.body.learningEvents.every((event) => !Object.hasOwn(event, 'answer')));
    assert.ok(studentExport.body.learningEvents.every((event) => !Object.hasOwn(event, 'answer_id')));

    const closed = await teacher.json(`/api/assignments/${assignments[0].id}/close`, { method: 'POST', body: {} });
    assert.equal(closed.status, 200);
    assert.equal((await student.json('/api/assignments')).body.assignments.length, 3);
    assert.equal((await student.json(`/api/assignments/${assignments[0].id}`)).status, 404);

    const legacyAssignmentId = '30000000-0000-4000-8000-000000000060';
    await database.exec(`
      INSERT INTO assignment(id,school_id,class_id,created_by,area,content_id,content_version,question_limit,title)
        VALUES('${legacyAssignmentId}','10000000-0000-4000-8000-000000000001','${classId}','00000000-0000-4000-8000-000000000001','vocabulary','vocabulary.all.v1','1',1,'Eldre lekse uten snapshot');
      INSERT INTO assignment_recipient(school_id,assignment_id,student_id) VALUES('10000000-0000-4000-8000-000000000001','${legacyAssignmentId}','${studentASession.body.userId}');
    `);
    const legacyTeacherEntry = (await pendingTeacher.json('/api/assignments')).body.assignments.find((item) => item.id === legacyAssignmentId);
    assert.equal(legacyTeacherEntry.contentAvailable, false, 'teachers can identify an old assignment that must be republished');
    assert.ok(!(await student.json('/api/assignments')).body.assignments.some((item) => item.id === legacyAssignmentId));
    assert.equal((await student.json(`/api/assignments/${legacyAssignmentId}`)).status, 404);
    assert.equal((await pendingTeacher.json(`/api/assignments/${legacyAssignmentId}/close`, { method: 'POST', body: {} })).status, 200);

    const invalidCsrf = await student.request(`/api/assignments/${assignments[0].id}/answers`, { method: 'POST', body: {}, headers: { 'content-type': 'application/json', origin: publicOrigin } });
    assert.equal(invalidCsrf.status, 403);

    assert.equal((await teacher.json(`/api/classes/${classId}/members/${coTeacherRequest.body.requests[0].studentId}/revoke`, { method: 'POST', body: {} })).status, 200);
    assert.ok(!(await pendingTeacher.json('/api/classes')).body.classes.some((item) => item.id === classId));
    assert.equal((await teacher.json(`/api/classes/${classId}/members/${teacherSession.body.userId}/revoke`, { method: 'POST', body: {} })).status, 409);
    assert.ok((await teacher.json('/api/classes')).body.classes.some((item) => item.id === classId));

    assert.equal((await teacher.json('/api/school/members')).status, 403);
    const localLogout = await teacher.request('/auth/logout', { method: 'POST', body: {}, headers: {
      'content-type': 'application/json', 'x-csrf-token': decodeURIComponent(teacher.csrf()),
    } });
    assert.equal(localLogout.status, 303);
    const externalLogout = await teacher.request(localLogout.headers.get('location'));
    assert.equal(externalLogout.status, 200, 'the synthetic provider asks for an explicit RP-Initiated Logout confirmation');
    const logoutHtml = await externalLogout.text();
    const logoutAction = logoutHtml.match(/<form\b[^>]*\baction="([^"]+)"/iu)?.[1];
    const logoutXsrf = logoutHtml.match(/name="xsrf"\s+value="([^"]+)"/iu)?.[1];
    assert.ok(logoutAction && logoutXsrf, 'provider confirmation form includes its one-use CSRF value');
    const providerLogout = await teacher.request(new URL(logoutAction, issuer), { method: 'POST', headers: {
      origin: issuer, 'content-type': 'application/x-www-form-urlencoded',
    }, body: new URLSearchParams({ xsrf: logoutXsrf, logout: 'yes' }).toString() });
    assert.equal(providerLogout.status, 303);
    const logoutCallback = new URL(providerLogout.headers.get('location'), issuer);
    assert.equal(logoutCallback.origin, publicOrigin);
    assert.equal(logoutCallback.pathname, '/auth/logout/callback');
    assert.equal((await teacher.json('/api/session')).status, 401, 'local session ends before the provider redirect');
    const logoutCallbackResponse = await teacher.request(logoutCallback);
    assert.equal(logoutCallbackResponse.status, 200, 'the one-use logout state confirms provider return');
    assert.match(logoutCallbackResponse.headers.get('cache-control') || '', /no-store/u, 'logout callback response must not be cached');
    assert.equal(logoutCallbackResponse.headers.get('referrer-policy'), 'no-referrer', 'logout callback URL must not be sent as a referrer');
    assert.equal((await teacher.request(logoutCallback)).status, 400, 'logout callback state cannot be replayed');
    assert.equal((await teacher.json('/api/session')).status, 401);

    const schoolMembers = await administrator.json('/api/school/members');
    assert.equal(schoolMembers.status, 200);
    const teacherBSession = await pendingTeacher.json('/api/session');
    const teacherB = schoolMembers.body.members.find((member) => member.userId === teacherBSession.body.userId);
    assert.equal(teacherB.role, 'teacher');
    const sameOwnerSchoolId = '10000000-0000-4000-8000-000000000003';
    await database.query("INSERT INTO school(id,owner_id,feide_org_id,name) VALUES($1,'10000000-0000-4000-8000-000000000010','synthetic-e2e-org-a2','Syntetisk skole A2')", [sameOwnerSchoolId]);
    const sameOwnerClassId = '20000000-0000-4000-8000-000000000030';
    await database.query("INSERT INTO school_class(id,school_id,name,school_year) VALUES($1,$2,'Annen skole hos samme eier','2026-2027')", [sameOwnerClassId, sameOwnerSchoolId]);
    const otherSchoolId = '10000000-0000-4000-8000-000000000002';
    await database.query("INSERT INTO school(id,owner_id,feide_org_id,name) VALUES($1,'10000000-0000-4000-8000-000000000011','synthetic-e2e-org-b','Syntetisk skole B')", [otherSchoolId]);
    await database.query("INSERT INTO school_membership(school_id,user_id,role,status) VALUES($1,$2,'teacher','active')", [otherSchoolId, teacherB.userId]);
    const foreignClassId = '20000000-0000-4000-8000-000000000020';
    const foreignStudentId = '00000000-0000-4000-8000-000000000020';
    const foreignAdminId = '00000000-0000-4000-8000-000000000021';
    const foreignAssignmentId = '30000000-0000-4000-8000-000000000020';
    const foreignSchoolInviteId = '40000000-0000-4000-8000-000000000020';
    await database.exec(`
      INSERT INTO school_class(id,school_id,name,school_year) VALUES('${foreignClassId}','${otherSchoolId}','Fremmed klasse','2026-2027');
      INSERT INTO class_membership(school_id,class_id,user_id,role,status) VALUES('${otherSchoolId}','${foreignClassId}','${teacherB.userId}','teacher','active');
      INSERT INTO app_user(id,display_name,status) VALUES('${foreignStudentId}','Syntetisk fremmed elev','active'),('${foreignAdminId}','Syntetisk fremmed administrator','active');
      INSERT INTO school_membership(school_id,user_id,role,status) VALUES('${otherSchoolId}','${foreignStudentId}','student','active'),('${otherSchoolId}','${foreignAdminId}','school_admin','active');
      INSERT INTO class_membership(school_id,class_id,user_id,role,status) VALUES('${otherSchoolId}','${foreignClassId}','${foreignStudentId}','student','active');
      INSERT INTO assignment(id,school_id,class_id,created_by,area,content_id,content_version,question_limit,title)
        VALUES('${foreignAssignmentId}','${otherSchoolId}','${foreignClassId}','${teacherB.userId}','${assignments[0].activity.area}','${assignments[0].activity.id}','1',1,'Fremmed lekse');
      INSERT INTO assignment_recipient(school_id,assignment_id,student_id) VALUES('${otherSchoolId}','${foreignAssignmentId}','${foreignStudentId}');
      INSERT INTO school_invite(id,school_id,token_hash,created_by,expires_at) VALUES('${foreignSchoolInviteId}','${otherSchoolId}',decode(repeat('ab',32),'hex'),'${foreignAdminId}',now()+interval '1 day');
    `);
    const otherSchoolTeacher = new LocalBrowser(publicOrigin);
    await signIn(otherSchoolTeacher, issuer, 'demo-teacher-b');
    const schoolChoices = await otherSchoolTeacher.json('/api/session');
    assert.equal(schoolChoices.body.role, 'select_school');
    assert.equal(schoolChoices.body.schools.length, 2, 'one identity can select schools across two owners without collapsing their tenants');
    assert.equal((await otherSchoolTeacher.json('/api/select-school', { method: 'POST', body: { schoolId: otherSchoolId } })).status, 200);
    assert.equal((await otherSchoolTeacher.json('/api/session')).body.schoolId, otherSchoolId);

    // Cross-tenant identifier substitution must not expose or mutate foreign school data.
    assert.ok(!(await pendingTeacher.json('/api/classes')).body.classes.some((item) => item.id === foreignClassId));
    assert.ok(!(await pendingTeacher.json('/api/classes')).body.classes.some((item) => item.id === sameOwnerClassId), 'a shared school owner does not grant access to a second school');
    for (const route of [
      `/api/classes/${foreignClassId}/requests`,
      `/api/classes/${foreignClassId}/progress`,
      `/api/classes/${foreignClassId}/export`,
    ]) assert.ok([403, 404].includes((await pendingTeacher.json(route, { method: route.endsWith('/export') ? 'POST' : 'GET', body: route.endsWith('/export') ? {} : undefined })).status), `teacher A cannot access ${route}`);
    const foreignInviteAttempt = await pendingTeacher.json(`/api/classes/${foreignClassId}/invitations`, { method: 'POST', body: { role: 'student' } });
    assert.ok([403, 404].includes(foreignInviteAttempt.status));
    const issuedForeignClassInvite = await otherSchoolTeacher.json(`/api/classes/${foreignClassId}/invitations`, { method: 'POST', body: { role: 'student' } });
    assert.equal(issuedForeignClassInvite.status, 201);
    assert.equal((await pendingTeacher.json('/api/join-class', { method: 'POST', body: { code: issuedForeignClassInvite.body.code } })).status, 400, 'a school A session cannot redeem a school B class invitation');
    for (const route of [
      `/api/classes/${foreignClassId}/members/${foreignStudentId}/approve`,
      `/api/classes/${foreignClassId}/members/${foreignStudentId}/revoke`,
    ]) assert.ok([403, 404].includes((await pendingTeacher.json(route, { method: 'POST', body: {} })).status), `teacher A cannot mutate ${route}`);
    const foreignAssignmentAttempt = await pendingTeacher.json('/api/assignments', { method: 'POST', body: {
      classId: foreignClassId, activityId: assignments[0].activity.id, title: 'Ugyldig fremmed lekse', questionCount: 1,
    } });
    assert.ok([403, 404].includes(foreignAssignmentAttempt.status));
    assert.equal((await pendingTeacher.json(`/api/assignments/${foreignAssignmentId}/close`, { method: 'POST', body: {} })).status, 404);
    const teacherAssignments = await pendingTeacher.json('/api/assignments');
    assert.ok(!teacherAssignments.body.assignments.some((item) => item.id === foreignAssignmentId));
    assert.ok(!schoolMembers.body.members.some((item) => item.userId === foreignStudentId || item.userId === foreignAdminId));
    assert.equal((await administrator.json(`/api/school/members/${foreignAdminId}/revoke`, { method: 'POST', body: {} })).status, 404);
    assert.equal((await administrator.json(`/api/school/teacher-invitations/${foreignSchoolInviteId}/revoke`, { method: 'POST', body: {} })).status, 404);
    assert.equal((await student.json(`/api/assignments/${foreignAssignmentId}`)).status, 404);
    const foreignAnswer = await student.json(`/api/assignments/${foreignAssignmentId}/answers`, { method: 'POST', body: {
      eventId: '50000000-0000-4000-8000-000000000020', practiceSession: '50000000-0000-4000-8000-000000000021',
      questionId: assignments[0].activity.questions[0].id, answerId: assignments[0].activity.questions[0].options[0].id,
    } });
    assert.equal(foreignAnswer.status, 404);
    assert.equal((await student.json('/api/assignments')).body.assignments.some((item) => item.id === foreignAssignmentId), false);
    assert.equal((await student.json('/api/me/export?studentId=' + foreignStudentId, { method: 'POST', body: {} })).body.student.id, studentASession.body.userId);
    assert.equal((await administrator.json(`/api/school/members/${administratorSession.body.userId}/revoke`, { method: 'POST', body: {} })).status, 409);
    assert.equal((await administrator.json(`/api/school/members/${teacherB.userId}/revoke`, { method: 'POST', body: {} })).status, 200);
    assert.equal((await pendingTeacher.json('/api/session')).status, 401);
    assert.equal((await otherSchoolTeacher.json('/api/session')).body.schoolId, otherSchoolId);
    assert.equal((await otherSchoolTeacher.json('/api/account/delete', { method: 'POST', body: { confirmation: 'nei' } })).status, 400);
    assert.equal((await otherSchoolTeacher.json('/api/account/delete', { method: 'POST', body: { confirmation: 'SLETT KONTO' } })).status, 200);
    assert.equal((await otherSchoolTeacher.json('/api/session')).status, 401, 'deletion ends the current cookie-backed session');
    assert.equal((await database.query("SELECT status FROM app_user WHERE id=$1", [teacherB.userId])).rows[0].status, 'deleted');
    assert.equal((await database.query("SELECT count(*)::int AS n FROM school_membership WHERE user_id=$1 AND status='active'", [teacherB.userId])).rows[0].n, 0);
  } finally {
    if (appServer) await new Promise((resolve) => appServer.close(resolve));
    if (providerServer) await new Promise((resolve) => providerServer.close(resolve));
    await Promise.all([database.close(), journalDatabase.close()]);
  }
});
