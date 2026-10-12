import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import pg from 'pg';
import { chromium } from '@playwright/test';
import { getActivity } from '../server/activity-catalog.js';
import { loadConfig } from '../server/config.js';

const config = loadConfig();
const loopback = new Set(['127.0.0.1', 'localhost', '::1']);
if (config.mode !== 'local-oidc-test' || !loopback.has(new URL(config.publicOrigin).hostname)
    || !loopback.has(new URL(config.oidc.issuer).hostname)) {
  throw new Error('This verification is restricted to the synthetic local OIDC/loopback setup');
}
const database = new URL(process.env.MIGRATION_DATABASE_URL || '');
if (!loopback.has(database.hostname) || decodeURIComponent(database.pathname) !== '/spansk_school') {
  throw new Error('UI verification requires the loopback-only synthetic spansk_school database');
}

const pool = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL, max: 2 });
const browser = await chromium.launch({ headless: true });
const origins = new Set([new URL(config.publicOrigin).origin, new URL(config.oidc.issuer).origin]);
const className = `Nettlesertest ${randomUUID().slice(0, 8)}`;
let classId;
const syntheticSessionHashes = [];

async function assertNoHorizontalOverflow(page, screen) {
  const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, page: document.documentElement.scrollWidth }));
  assert.ok(dimensions.page <= dimensions.viewport, `${screen} overflows horizontally at ${dimensions.viewport}px (${dimensions.page}px content)`);
}

async function assertNamedControls(page, screen) {
  const unnamed = await page.locator('input:not([type="hidden"]), select, textarea').evaluateAll((controls) => controls
    .filter((control) => !control.labels?.length && !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby'))
    .map((control) => `${control.tagName.toLowerCase()}[type="${control.type || ''}"]`));
  assert.deepEqual(unnamed, [], `${screen} form controls must have accessible names`);
}

class LocalBrowser {
  cookies = new Map();

  async request(url, options = {}) {
    const target = new URL(url, config.publicOrigin);
    const headers = { ...(options.headers || {}) };
    if (this.cookies.size) headers.cookie = [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
    if (options.body !== undefined && !headers['content-type']) headers['content-type'] = 'application/json';
    if (options.body !== undefined && target.origin === config.publicOrigin && options.method !== 'GET') headers.origin = config.publicOrigin;
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
}

async function createBrowserSession(context, accountId) {
  const session = new LocalBrowser();
  let response = await session.request('/auth/login');
  assert.equal(response.status, 303);
  let next = new URL(response.headers.get('location'));
  for (let step = 0; step < 12; step += 1) {
    if (next.origin === config.publicOrigin && next.pathname === '/auth/callback') break;
    response = await session.request(next);
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      next = new URL(response.headers.get('location'), next);
      continue;
    }
    const html = await response.text();
    const action = html.match(/<form\b[^>]*\baction="([^"]+)"/iu)?.[1];
    assert.ok(action && next.origin === config.oidc.issuer, 'Expected local synthetic OIDC account selector');
    const login = await session.request(new URL(action, config.oidc.issuer), {
      method: 'POST', headers: { origin: config.oidc.issuer, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ account: accountId }),
    });
    assert.ok(login.status >= 300 && login.status < 400, 'Synthetic OIDC login failed');
    next = new URL(login.headers.get('location'), config.oidc.issuer);
  }
  assert.equal(next.origin, config.publicOrigin);
  assert.equal(next.pathname, '/auth/callback');
  response = await session.request(next);
  assert.equal(response.status, 303);
  const token = session.cookies.get('spansk_session_dev');
  assert.ok(token, 'synthetic OIDC callback should establish a session');
  syntheticSessionHashes.push(createHash('sha256').update(token).digest());
  await context.addCookies([...session.cookies]
    .filter(([name]) => ['spansk_session_dev', 'spansk_csrf_dev'].includes(name))
    .map(([name, value]) => ({ name, value, url: config.publicOrigin, sameSite: 'Lax', httpOnly: name === 'spansk_session_dev' })));
}

async function login(page, account) {
  await page.goto(`${config.publicOrigin}/school`);
  await createBrowserSession(page.context(), account);
  await page.reload();
  const expectedHeading = account === 'demo-teacher' ? 'Læreroversikt' : 'Mine lekser';
  try { await page.getByRole('heading', { name: expectedHeading }).waitFor({ timeout: 15_000 }); }
  catch {
    throw new Error(`Synthetic ${account} login did not reach ${expectedHeading}; URL=${page.url()}; page=${(await page.locator('body').innerText()).slice(0, 500)}`);
  }
}

try {
  const teacherContext = await browser.newContext();
  const teacher = await teacherContext.newPage();
  teacher.on('request', (request) => {
    const origin = new URL(request.url()).origin;
    assert.ok(origins.has(origin), `Unexpected non-loopback request origin: ${origin}`);
  });
  await login(teacher, 'demo-teacher');
  await teacher.setViewportSize({ width: 390, height: 844 });
  await assertNoHorizontalOverflow(teacher, 'teacher overview');
  await assertNamedControls(teacher, 'teacher overview');
  await teacher.getByLabel('Klassenavn').fill(className);
  await teacher.getByLabel('Klassenavn').focus();
  await teacher.keyboard.press('Tab');
  await teacher.keyboard.press('Tab');
  assert.equal(await teacher.evaluate(() => document.activeElement.textContent), 'Opprett klasse', 'class creation must be reachable by keyboard');
  await teacher.keyboard.press('Enter');
  const classRow = teacher.locator('li').filter({ hasText: className }).first();
  await classRow.waitFor();
  classId = await pool.query('SELECT id FROM school_class WHERE name=$1 AND school_year=$2', [className, `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`]).then((result) => result.rows[0]?.id);
  assert.ok(classId, 'UI-created class should be present in PostgreSQL');

  await classRow.getByRole('button', { name: 'Inviter elev' }).click();
  const inviteStatus = teacher.getByRole('status').filter({ hasText: 'Invitasjonskode:' });
  await inviteStatus.waitFor();
  const inviteText = await inviteStatus.innerText();
  const code = inviteText.match(/Invitasjonskode:\s*([A-Za-z0-9_-]+)/u)?.[1];
  assert.ok(code, `Could not read synthetic class invitation from UI: ${inviteText}`);

  const studentContext = await browser.newContext();
  const student = await studentContext.newPage();
  student.on('request', (request) => {
    const origin = new URL(request.url()).origin;
    assert.ok(origins.has(origin), `Unexpected non-loopback request origin: ${origin}`);
  });
  await student.goto(`${config.publicOrigin}/school?browser-back-test=1`);
  await createBrowserSession(studentContext, 'demo-student-a');
  await student.reload();
  await student.getByRole('heading', { name: 'Mine lekser' }).waitFor();
  await student.setViewportSize({ width: 390, height: 844 });
  await assertNoHorizontalOverflow(student, 'student homework list');
  await assertNamedControls(student, 'student homework list');
  await student.getByLabel('Engangskode fra spansklæreren').fill(code);
  await student.keyboard.press('Tab');
  assert.equal(await student.evaluate(() => document.activeElement.textContent), 'Bli med i klassen', 'student invitation must be reachable by keyboard');
  await student.keyboard.press('Enter');
  await student.getByText(/Forespørselen er sendt/u).waitFor();

  await teacher.reload();
  await classRow.getByRole('button', { name: /Forespørsler/u }).click();
  await teacher.getByRole('button', { name: 'Godkjenn elev' }).click();
  await teacher.reload();

  const activityIds = ['vocabulary.all.v1', 'grammar.a0Foundation.v1', 'verbs.present.v1', 'listening.leo-sevilla.v1'];
  const assignments = [];
  for (const [index, activityId] of activityIds.entries()) {
    const activity = getActivity(activityId);
    await teacher.locator('select').nth(0).selectOption(classId);
    await teacher.getByLabel('Øvingsområde og tema').selectOption(activityId);
    await teacher.getByLabel('Tittel på lekse').fill(`UI ${activity.area} ${index + 1}`);
    await teacher.getByLabel('Antall oppgaver').fill('1');
    await teacher.getByRole('button', { name: 'Publiser lekse' }).click();
    const title = `UI ${activity.area} ${index + 1}`;
    await teacher.getByRole('status').filter({ hasText: title }).waitFor();
    assignments.push({ activity, title });
  }

  for (const { activity, title } of assignments) {
    await student.reload();
    const row = student.locator('li').filter({ hasText: title });
    await row.getByRole('button', { name: 'Fortsett' }).click();
    const answer = activity.questions[0].options.find((option) => option.id === activity.questions[0].correctOptionId);
    assert.ok(answer, `No correct synthetic option for ${activity.id}`);
    await student.getByLabel(answer.text, { exact: true }).focus();
    await student.keyboard.press('Space');
    await student.keyboard.press('Tab');
    assert.equal(await student.evaluate(() => document.activeElement.textContent), 'Sjekk svaret', 'homework answer submission must be reachable by keyboard');
    await student.keyboard.press('Enter');
    await student.getByText(/Riktig\..*Svar lagret\./u).waitFor();
    await student.getByRole('button', { name: 'Neste oppgave' }).click();
    await student.getByRole('heading', { name: 'Leksen er gjennomført' }).waitFor();
    await assertNoHorizontalOverflow(student, `student ${activity.area} homework`);
  }

  await teacher.reload();
  await assertNoHorizontalOverflow(teacher, 'teacher progress list');
  await classRow.getByRole('button', { name: 'Se fremgang' }).click();
  for (const { activity, title } of assignments) {
    const row = teacher.locator('tbody tr').filter({ hasText: title });
    await row.getByText(activity.area === 'vocabulary' ? 'Ordforråd' : activity.area === 'grammar' ? 'Grammatikk' : activity.area === 'verbs' ? 'Verbbøying' : 'Lytting').waitFor();
    await row.getByText('1/1').first().waitFor();
  }
  await createBrowserSession(studentContext, 'demo-student-b');
  await student.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await student.getByRole('heading', { name: 'Mine lekser' }).waitFor();
  await student.getByText('Læreren har ikke delt noen lekser med deg ennå.').waitFor();
  assert.equal(await student.getByText(assignments[0].title).count(), 0, 'the prior student’s homework must disappear after another same-origin account logs in');
  await student.goBack();
  try { await student.getByText('Syntetisk elev B').waitFor({ timeout: 5_000 }); }
  catch { throw new Error(`Browser-back state did not resolve the new account. URL=${student.url()} Body=${(await student.locator('body').innerText()).slice(0, 500)}`); }
  assert.equal(await student.getByText(assignments[0].title).count(), 0, 'browser back must not restore the prior student’s homework');
  assert.deepEqual(await teacher.evaluate(() => Object.keys(localStorage)), [], 'school UI must not put pupil data in localStorage');
  console.log('Native PostgreSQL browser verification passed: synthetic teacher/elev workflow in four areas, class progress, 390px no-overflow, accessible form names, keyboard class/invitation/answer flow, shared-browser account switch/back, and loopback-only requests.');
  await studentContext.close();
  await teacherContext.close();
} finally {
  if (classId) {
    try {
      const { rows } = await pool.query('SELECT id FROM assignment WHERE class_id=$1', [classId]);
      for (const { id } of rows) {
        await pool.query('DELETE FROM learning_event WHERE assignment_id=$1', [id]);
        await pool.query('DELETE FROM assignment_recipient WHERE assignment_id=$1', [id]);
        await pool.query('DELETE FROM assignment WHERE id=$1', [id]);
      }
      await pool.query('DELETE FROM class_invite WHERE class_id=$1', [classId]);
      await pool.query('DELETE FROM class_membership WHERE class_id=$1', [classId]);
      await pool.query('DELETE FROM school_class WHERE id=$1', [classId]);
    } catch (error) {
      console.error(`Synthetic UI-test cleanup failed for class ${classId}: ${error.message}`);
      process.exitCode = 1;
    }
  }
  for (const tokenHash of syntheticSessionHashes) {
    try { await pool.query('DELETE FROM app_session WHERE token_hash=$1', [tokenHash]); }
    catch (error) { console.error(`Synthetic UI-test session cleanup failed: ${error.message}`); process.exitCode = 1; }
  }
  await browser.close();
  await pool.end();
}
