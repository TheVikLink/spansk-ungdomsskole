import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FREE_SAMPLE_LESSON_IDS,
  createSchoolLicenseCode,
  createStudentLessonToken,
  isFreeLessonId,
  studentLessonCookieName,
  verifySchoolLicenseCode,
  verifyStudentLessonToken,
} from '../../src/domain/school-license.js';
import { createUndervisningRouter } from '../../server/undervisning-access.js';
import { buildVercelPublic } from '../../scripts/build-vercel-public.mjs';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const TEST_SECRET = 'test-signing-secret-at-least-32-chars-long';

async function withRouterServer(options, run) {
  const app = express();
  app.use(createUndervisningRouter({ projectRoot, getSecret: () => TEST_SECRET, cookieSecure: false, enforcePaywall: true, ...options }));
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('createSchoolLicenseCode and verifySchoolLicenseCode validate signatures, plans, and expiry', () => {
  assert.deepEqual(FREE_SAMPLE_LESSON_IDS, ['wordkeys-recognizable', 'hilsener', 'tall', 'jul-spania-chile']);
  assert.equal(isFreeLessonId('tall'), true);
  assert.equal(isFreeLessonId('jul-spania-chile'), true);
  assert.equal(isFreeLessonId('familie'), false);

  const code = createSchoolLicenseCode({
    school: 'Fjell ungdomsskole',
    plan: 'undervisningspakke',
    expiresAt: '2027-08-31',
    licenseId: 'lic-demo-01',
  }, TEST_SECRET);

  const ok = verifySchoolLicenseCode(code, TEST_SECRET, new Date('2026-11-24T12:00:00Z'));
  assert.equal(ok.valid, true);
  assert.deepEqual(ok.license, {
    id: 'lic-demo-01',
    plan: 'undervisningspakke',
    school: 'Fjell ungdomsskole',
    expiresAt: '2027-08-31',
  });

  // Tampered payload
  const [prefix, payloadB64, sigB64] = code.split('.');
  const tamperedPayload = Buffer.from(JSON.stringify({
    v: 1, id: 'lic-demo-01', plan: 'kommunepakke', school: 'Gratis skole', exp: '2099-12-31',
  }), 'utf8').toString('base64url');
  assert.equal(verifySchoolLicenseCode(`${prefix}.${tamperedPayload}.${sigB64}`, TEST_SECRET).valid, false);

  // Wrong secret
  assert.equal(verifySchoolLicenseCode(code, 'another-completely-different-secret-key').valid, false);

  // Expired
  const expired = verifySchoolLicenseCode(code, TEST_SECRET, new Date('2027-09-01T00:00:00Z'));
  assert.deepEqual(expired, { valid: false, reason: 'expired' });

  // Malformed
  assert.deepEqual(verifySchoolLicenseCode('not-a-code', TEST_SECRET), { valid: false, reason: 'malformed' });
});

test('time-limited demo code SPANSK2026 unlocks Undervisningspakken through 2026-12-31 and expires afterward', async () => {
  const promoOk = verifySchoolLicenseCode('spansk2026', TEST_SECRET, new Date('2026-12-31T23:59:59Z'));
  assert.deepEqual(promoOk, {
    valid: true,
    license: {
      id: 'demo-spansk2026',
      plan: 'undervisningspakke',
      school: 'Prøvetilgang (Spansk på 1-2-3)',
      expiresAt: '2026-12-31',
    },
  });
  assert.deepEqual(verifySchoolLicenseCode('SPANSK2026', TEST_SECRET, new Date('2027-01-01T00:00:00Z')), {
    valid: false,
    reason: 'expired',
  });

  await withRouterServer({}, async (origin) => {
    const activateRes = await fetch(`${origin}/api/license/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'SPANSK2026' }),
    });
    assert.equal(activateRes.status, 200);
    const cookie = activateRes.headers.get('set-cookie').split(';')[0];
    assert.equal((await fetch(`${origin}/undervisning/familie/index.html`, { headers: { Cookie: cookie } })).status, 200);
    assert.equal((await fetch(`${origin}/undervisning/familie/arbeidsark.pdf`, { headers: { Cookie: cookie } })).status, 200);
    assert.equal((await fetch(`${origin}/undervisning/familie/partnerkort.pdf`, { headers: { Cookie: cookie } })).status, 200);
  });
});

test('createUndervisningRouter allows free sample lessons and locks paid lessons until license activation', async () => {
  await withRouterServer({}, async (origin) => {
    // Free sample lesson HTML + PDF work without license
    for (const freeId of FREE_SAMPLE_LESSON_IDS) {
      const htmlRes = await fetch(`${origin}/undervisning/${freeId}/index.html`);
      assert.equal(htmlRes.status, 200, `${freeId} HTML should be free`);
      const pdfRes = await fetch(`${origin}/undervisning/${freeId}/partnerkort.pdf`);
      assert.equal(pdfRes.status, 200, `${freeId} PDF should be free`);
    }

    // Christmas sample lesson student page, worksheet PDF, audio, and student-link work without license
    assert.equal((await fetch(`${origin}/undervisning/jul-spania-chile/elev.html`)).status, 200);
    assert.equal((await fetch(`${origin}/undervisning/jul-spania-chile/arbeidsark.pdf`)).status, 200);
    assert.equal((await fetch(`${origin}/undervisning/jul-spania-chile/jul-spania-chile.mp3`)).status, 200);
    const freeStudentLink = await fetch(`${origin}/api/license/student-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: 'jul-spania-chile' }),
    });
    assert.equal(freeStudentLink.status, 200);
    assert.deepEqual(await freeStudentLink.json(), {
      url: '/undervisning/jul-spania-chile/elev.html',
      free: true,
    });

    // Paid lesson HTML redirects to portal; PDF/MP3 return 402
    const lockedHtml = await fetch(`${origin}/undervisning/familie/index.html`, { redirect: 'manual' });
    assert.equal(lockedHtml.status, 302);
    assert.equal(lockedHtml.headers.get('location'), '/undervisning/?las=familie');

    const lockedNoSlash = await fetch(`${origin}/undervisning/familie`, { redirect: 'manual' });
    assert.equal(lockedNoSlash.status, 302);
    assert.equal(lockedNoSlash.headers.get('location'), '/undervisning/?las=familie');

    const lockedPdf = await fetch(`${origin}/undervisning/familie/partnerkort.pdf`);
    assert.equal(lockedPdf.status, 402);

    const lockedMp3 = await fetch(`${origin}/undervisning/familie/familie.mp3`);
    assert.equal(lockedMp3.status, 402);

    // Path traversal or unknown files return 404
    assert.equal((await fetch(`${origin}/undervisning/..%2Fpackage.json`)).status, 404);
    assert.equal((await fetch(`${origin}/undervisning/familie/secret.env`)).status, 404);

    // Invalid and expired codes are rejected
    const badActivate = await fetch(`${origin}/api/license/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'SP123.bad.sig' }),
    });
    assert.equal(badActivate.status, 400);

    const expiredCode = createSchoolLicenseCode({
      school: 'Gammel skole',
      expiresAt: '2025-01-01',
    }, TEST_SECRET);
    const expActivate = await fetch(`${origin}/api/license/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: expiredCode }),
    });
    assert.equal(expActivate.status, 400);
    assert.match((await expActivate.json()).error, /utløpt/u);

    // Valid activation sets HttpOnly cookie and unlocks paid lessons
    const validCode = createSchoolLicenseCode({
      school: 'Nordstrand ungdomsskole',
      expiresAt: '2027-08-31',
    }, TEST_SECRET);
    const okActivate = await fetch(`${origin}/api/license/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: validCode }),
    });
    assert.equal(okActivate.status, 200);
    const body = await okActivate.json();
    assert.equal(body.active, true);
    assert.equal(body.school, 'Nordstrand ungdomsskole');
    const setCookie = okActivate.headers.get('set-cookie');
    assert.ok(setCookie?.includes('HttpOnly'));
    const cookieHeader = setCookie.split(';')[0];

    const statusRes = await fetch(`${origin}/api/license/status`, { headers: { Cookie: cookieHeader } });
    assert.equal(statusRes.status, 200);
    assert.equal((await statusRes.json()).school, 'Nordstrand ungdomsskole');

    const unlockedHtml = await fetch(`${origin}/undervisning/familie/index.html`, { headers: { Cookie: cookieHeader } });
    assert.equal(unlockedHtml.status, 200);
    const unlockedPdf = await fetch(`${origin}/undervisning/familie/partnerkort.pdf`, { headers: { Cookie: cookieHeader } });
    assert.equal(unlockedPdf.status, 200);
    assert.equal(Buffer.from(await unlockedPdf.arrayBuffer()).subarray(0, 5).toString(), '%PDF-');

    // Trailing slash redirect preserves relative paths when licensed
    const unlockedNoSlash = await fetch(`${origin}/undervisning/familie`, {
      redirect: 'manual',
      headers: { Cookie: cookieHeader },
    });
    assert.equal(unlockedNoSlash.status, 302);
    assert.equal(unlockedNoSlash.headers.get('location'), '/undervisning/familie/');

    // Deactivate clears access
    const deactivate = await fetch(`${origin}/api/license/deactivate`, {
      method: 'POST',
      headers: { Cookie: cookieHeader },
    });
    assert.equal(deactivate.status, 200);
    assert.ok(deactivate.headers.get('set-cookie')?.includes('Max-Age=0'));
  });
});

test('buildVercelPublic stages only top-level portal assets and free sample lessons into public CDN', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'spansk-vercel-undervisning-'));
  const output = path.join(root, 'public');
  const put = async (relative, text = relative) => {
    const target = path.join(root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, text);
  };
  try {
    await Promise.all([
      put('index.html', '<h1>App</h1>'),
      put('manifest.webmanifest', '{}'),
      put('sw.js', 'self.test = true;'),
      put('dist/tailwind.css', 'body{}'),
      put('audio/test.mp3', 'audio'),
      put('server/public/school.js', 'school'),
      put('server/public/school.css', 'css'),
      put('server/content-media/abc.wav', 'wav'),
      put('undervisning/index.html', 'portal'),
      put('undervisning/time.css', 'css'),
      put('undervisning/writing.js', 'js'),
      put('undervisning/pakke.js', 'pakke'),
      put('undervisning/teacher.js', 'teacher'),
      put('undervisning/tall/index.html', 'free'),
      put('undervisning/hilsener/partnerkort.pdf', '%PDF-'),
      put('undervisning/jul-spania-chile/index.html', 'free'),
      put('undervisning/wordkeys-recognizable/index.html', 'free'),
      put('undervisning/familie/index.html', 'paid'),
      put('undervisning/familie/partnerkort.pdf', '%PDF-paid'),
    ]);

    await buildVercelPublic({ rootDir: root, outputDir: output });
    const listFiles = async (dir, prefix = '') => {
      const entries = await readdir(dir, { withFileTypes: true });
      const nested = await Promise.all(entries.map((entry) => (
        entry.isDirectory()
          ? listFiles(path.join(dir, entry.name), `${prefix}${entry.name}/`)
          : [`${prefix}${entry.name}`]
      )));
      return nested.flat();
    };
    const undervisningFiles = (await listFiles(path.join(output, 'undervisning'))).sort();
    assert.deepEqual(undervisningFiles, [
      'hilsener/partnerkort.pdf',
      'index.html',
      'jul-spania-chile/index.html',
      'pakke.js',
      'tall/index.html',
      'teacher.js',
      'time.css',
      'wordkeys-recognizable/index.html',
      'writing.js',
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('service worker bypasses /undervisning routes so paywall redirects stay network-only', async () => {
  const swText = await readFile(path.join(projectRoot, 'sw.js'), 'utf8');
  assert.match(swText, /pathname\s*===\s*'\/undervisning'/u);
  assert.match(swText, /pathname\.startsWith\('\/undervisning\/'\)/u);
});

test('createStudentLessonToken and /api/license/student-link scope student access without exposing teacher keys or partner cards', async () => {
  assert.equal(studentLessonCookieName(true), '__Secure-spansk123_elev');
  assert.equal(studentLessonCookieName(false), 'spansk123_elev_dev');

  const token = createStudentLessonToken({ lessonId: 'familie', expiresAt: '2027-08-31' }, TEST_SECRET);
  assert.deepEqual(
    verifyStudentLessonToken(token, 'familie', TEST_SECRET, new Date('2026-11-25T08:00:00Z')),
    { valid: true, lessonId: 'familie', expiresAt: '2027-08-31' },
  );
  assert.equal(verifyStudentLessonToken(token, 'dyr', TEST_SECRET, new Date('2026-11-25T08:00:00Z')).valid, false);
  assert.equal(verifyStudentLessonToken(token, 'familie', TEST_SECRET, new Date('2027-09-01T00:00:00Z')).reason, 'expired');

  await withRouterServer({}, async (origin) => {
    const unauthLink = await fetch(`${origin}/api/license/student-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: 'familie' }),
    });
    assert.equal(unauthLink.status, 401);

    const freeLink = await fetch(`${origin}/api/license/student-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: 'tall' }),
    });
    assert.equal(freeLink.status, 200);
    assert.deepEqual(await freeLink.json(), { url: '/undervisning/tall/elev.html', free: true });

    const validCode = createSchoolLicenseCode({ school: 'Solli skole', expiresAt: '2027-08-31' }, TEST_SECRET);
    const act = await fetch(`${origin}/api/license/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: validCode }),
    });
    assert.equal(act.status, 200);
    const teacherCookie = act.headers.get('set-cookie').split(';')[0];

    const linkRes = await fetch(`${origin}/api/license/student-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: teacherCookie },
      body: JSON.stringify({ lessonId: 'familie' }),
    });
    assert.equal(linkRes.status, 200);
    const linkData = await linkRes.json();
    assert.equal(linkData.free, false);
    assert.match(linkData.url, /^\/undervisning\/familie\/elev\.html\?elev=SP123E\./u);

    // Student opens shared link in a fresh browser without teacher cookie
    const studentPage = await fetch(`${origin}${linkData.url}`);
    assert.equal(studentPage.status, 200);
    const studentHtml = await studentPage.text();
    assert.match(studentHtml, /Elevside/u);
    assert.equal(studentHtml.includes('For læreren'), false);
    const setStudentCookie = studentPage.headers.get('set-cookie');
    assert.ok(setStudentCookie?.includes('Path=/undervisning/familie/'));
    const studentCookie = setStudentCookie.split(';')[0];

    // Student can load MP3 for that lesson, but CANNOT open teacher page, fasit, script, PDFs, or another lesson
    assert.equal((await fetch(`${origin}/undervisning/familie/familie.mp3`, { headers: { Cookie: studentCookie } })).status, 200);
    assert.equal((await fetch(`${origin}/undervisning/familie/index.html`, { redirect: 'manual', headers: { Cookie: studentCookie } })).status, 302);
    assert.equal((await fetch(`${origin}/undervisning/familie/lyttemanus.txt`, { headers: { Cookie: studentCookie } })).status, 402);
    assert.equal((await fetch(`${origin}/undervisning/familie/partnerkort.pdf`, { headers: { Cookie: studentCookie } })).status, 402);
    assert.equal((await fetch(`${origin}/undervisning/familie/arbeidsark.pdf`, { headers: { Cookie: studentCookie } })).status, 402);
    assert.equal((await fetch(`${origin}/undervisning/dyr/elev.html`, { redirect: 'manual', headers: { Cookie: studentCookie } })).status, 302);
  });
});
