import { test, expect } from '@playwright/test';
import { startSchoolFixture } from './helpers/school-server.js';
let school;
test.beforeAll(async () => { school = await startSchoolFixture(); });
test.afterAll(async () => { await school?.close(); });

test('normal browser login reaches the teacher and creates a class without cookie injection', async ({ page }) => {
  await page.goto(`${school.origin}/school`);
  await page.getByRole('link', { name: 'Åpne lokal testinnlogging' }).click();
  await page.getByRole('button', { name: 'Syntetisk lærer', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Læreroversikt', exact: true })).toBeVisible();
  await page.getByLabel('Klassenavn', { exact: true }).fill('DEMO – vanlig innlogging');
  await page.getByRole('button', { name: 'Opprett klasse', exact: true }).click();
  await expect(page.getByText('DEMO – vanlig innlogging, skoleår', { exact: false })).toBeVisible();
});


test('logout preserves strict CSRF validation and permits a fresh student login', async ({ page }) => {
  await page.goto(`${school.origin}/school`);
  await page.getByRole('link', { name: 'Åpne lokal testinnlogging' }).click();
  await page.getByRole('button', { name: 'Syntetisk lærer', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Læreroversikt', exact: true })).toBeVisible();
  const requestPromise = page.waitForRequest(request => new URL(request.url()).pathname === '/auth/logout');
  await page.getByRole('button', { name: 'Logg ut', exact: true }).click();
  const logoutRequest = await requestPromise;
  expect(await logoutRequest.headerValue('origin')).toBe(school.origin);
  await expect(page.getByRole('heading', { name: 'Den lokale økten er avsluttet.' })).toBeVisible();
  await page.getByRole('link', { name: 'Logg ut av Feide', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Yes, sign me out' })).toBeVisible();
  await page.getByRole('button', { name: 'Yes, sign me out' }).click();
  await expect(page.getByRole('heading', { name: 'Den lokale økten er avsluttet.' })).toBeVisible();
  await page.getByRole('link', { name: 'Tilbake', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Åpne lokal testinnlogging' })).toBeVisible();
  expect((await page.request.get(`${school.origin}/api/session`)).status()).toBe(401);
  await page.getByRole('link', { name: 'Åpne lokal testinnlogging' }).click();
  await page.getByRole('button', { name: 'Syntetisk elev A', exact: true }).click();
  await expect(page).toHaveURL(`${school.origin}/?school=start`);
  await page.getByRole('link', { name: 'Mine lekser', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mine lekser', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Læreroversikt', exact: true })).toHaveCount(0);
});

for (const width of [390, 1280]) {
  test(`logout rejects invalid Origin and CSRF at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${school.origin}/school`);
    await page.getByRole('link', { name: 'Åpne lokal testinnlogging' }).click();
    await page.getByRole('button', { name: 'Syntetisk lærer', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Læreroversikt', exact: true })).toBeVisible();
    const cookies = await page.context().cookies(school.origin);
    const csrf = cookies.find(cookie => cookie.name === 'spansk_csrf_dev').value;
    const session = cookies.find(cookie => cookie.name === 'spansk_session_dev').value;
    for (const headers of [
      { 'x-csrf-token': csrf },
      { origin: 'null', 'x-csrf-token': csrf },
      { origin: 'https://foreign.invalid', 'x-csrf-token': csrf },
      { origin: school.origin },
      { origin: school.origin, 'x-csrf-token': 'wrong' },
    ]) {
      const response = await page.request.post(`${school.origin}/auth/logout`, { headers: { accept: 'application/json', ...headers }, data: {} });
      expect(response.status()).toBe(403);
      expect((await page.request.get(`${school.origin}/api/session`)).status()).toBe(200);
    }
    await page.getByRole('button', { name: 'Logg ut', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Den lokale økten er avsluttet.' })).toBeVisible();
  await page.getByRole('link', { name: 'Logg ut av Feide', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Yes, sign me out' })).toBeVisible();
    // Replay the old bearer only as a negative request; never seed a browser login.
    const replay = await page.request.get(`${school.origin}/api/session`, { headers: { cookie: `spansk_session_dev=${session}` } });
    expect(replay.status()).toBe(401);
    await page.getByRole('button', { name: 'Yes, sign me out' }).click();
    await expect(page.getByRole('heading', { name: 'Den lokale økten er avsluttet.' })).toBeVisible();
  });
}

test('a lost logout response revokes the original session and allows a fresh session check', async ({ page }) => {
  await page.goto(`${school.origin}/school`);
  await page.getByRole('link', { name: 'Åpne lokal testinnlogging' }).click();
  await page.getByRole('button', { name: 'Syntetisk lærer', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Læreroversikt', exact: true })).toBeVisible();
  const oldSession = (await page.context().cookies(school.origin)).find(cookie => cookie.name === 'spansk_session_dev').value;
  await page.route(`${school.origin}/auth/logout`, async route => {
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    await route.abort('failed');
  });
  const failed = page.waitForEvent('requestfailed', request => new URL(request.url()).pathname === '/auth/logout');
  await page.getByRole('button', { name: 'Logg ut', exact: true }).click();
  await failed;
  expect((await page.request.get(`${school.origin}/api/session`, { headers: { cookie: `spansk_session_dev=${oldSession}` } })).status()).toBe(401);
  // The failed native navigation can still be committing its browser error page.
  // A new tab in the same context tests the return without racing that navigation.
  const returned = await page.context().newPage();
  await returned.goto(`${school.origin}/school`);
  await expect(returned.getByRole('link', { name: 'Åpne lokal testinnlogging' })).toBeVisible();
});
