import { test, expect } from '@playwright/test';
import { startStaticAppServer } from './helpers/static-app-server.js';
import { legacyWorker } from './helpers/legacy-worker.js';

let server, version = 'test-a';
test.beforeAll(async () => {
  server = await startStaticAppServer({ transform: (filename, bytes) => {
    if (filename === 'sw.js' && version === 'legacy') return legacyWorker;
    if (filename === 'sw.js') return bytes.toString().replace(/const APP_BUILD = '[^']*'/, `const APP_BUILD = '${version}'`) + `\n// ${version}`;
    if (filename === 'index.html') return bytes.toString().replace(/name="app-build" content="[^"]*"/, `name="app-build" content="${version}"`);
    return bytes;
  } });
});

test('F12: upgrading the old v4 cache keeps downloaded audio and unrelated caches', async ({ page, context }) => {
  version = 'legacy'; await openApp(page);
  const audioUrl = await page.evaluate(async () => {
    const url = getDictationAudioUrls(DICTATION_STORIES[0])[1];
    const cache = await caches.open('spansk123-v4');
    await cache.put(url, await fetch(url));
    await caches.open('unrelated-example');
    practiceHistory = [{ date: getLocalDateString(), words: 3, correct: 2, sessions: 1, activity: 'grammar', minutes: 1 }]; savePracticeHistory();
    return url;
  });
  version = 'test-upgraded';
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  await expect(page.locator('#appUpdateNotice')).toBeVisible();
  await page.getByRole('button', { name: 'Last inn oppdateringen', exact: true }).click();
  await expect(page.locator('meta[name="app-build"]')).toHaveAttribute('content', 'test-upgraded');
  const cachesAfter = await page.evaluate(() => caches.keys());
  expect(cachesAfter).toContain('unrelated-example');
  expect(cachesAfter).not.toContain('spansk123-v4');
  server.setOffline(true);
  await context.setOffline(true);
  expect(await page.evaluate(async url => (await fetch(url)).headers.get('content-type'), audioUrl)).toContain('audio/');
  expect(await page.evaluate(() => practiceHistory[0].words)).toBe(3);
});
test.afterAll(async () => server.close());
test.afterEach(() => server.setOffline(false));

async function openApp(page) {
  await page.goto(server.url);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.locator('#studentNameInput').fill('Test');
  await page.locator('.login-btn-primary').click();
}

test('F09: cached shell explains missing audio offline, and missing media never returns HTML', async ({ page, context }) => {
  await openApp(page);
  server.setOffline(true);
  await context.setOffline(true); await page.reload();
  await page.locator('#navDictation').click();
  await page.getByRole('button', { name: 'Start historien' }).first().click();
  await expect(page.locator('#dictationAudioError')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start øvelsen', exact: true })).toBeDisabled();
  const response = await page.evaluate(async () => {
    const result = await fetch('audio/diktat/missing.wav');
    return { status: result.status, type: result.headers.get('content-type'), body: await result.text() };
  });
  expect(response.status).toBe(503);
  expect(response.type).not.toContain('text/html');
  expect(response.body).not.toContain('<html');
  server.setOffline(false);
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Prøv lyden igjen', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start øvelsen', exact: true })).toBeEnabled();
});

test('F09: explicit complete-story download supports real audio and ranges after going offline', async ({ page, context }) => {
  await openApp(page);
  await page.locator('#navDictation').click();
  await page.getByRole('button', { name: 'Start historien' }).first().click();
  await page.getByRole('button', { name: 'Last ned lyd til bruk uten nett' }).click();
  await expect(page.locator('#dictationDownloadStatus')).toContainText('Hele historien er lastet ned');
  server.setOffline(true);
  await context.setOffline(true); await page.reload();
  await page.locator('#navDictation').click();
  await page.getByRole('button', { name: 'Start historien' }).first().click();
  await page.getByRole('button', { name: 'Start øvelsen', exact: true }).click();
  await expect.poll(() => page.locator('#dictationSegmentAudio').evaluate(audio => audio.readyState)).toBeGreaterThanOrEqual(1);
  const range = await page.evaluate(async () => {
    const response = await fetch(document.getElementById('dictationSegmentAudio').src, { headers: { Range: 'bytes=0-99' } });
    return { status: response.status, length: (await response.arrayBuffer()).byteLength, range: response.headers.get('content-range') };
  });
  expect(range).toMatchObject({ status: 206, length: 100 });
  expect(range.range).toMatch(/^bytes 0-99\//);
  for (let i = 0; i < 8; i++) {
    await page.locator('#dictationAnswer').fill(await page.evaluate(() => dictationState.story.segments[dictationState.index][0]));
    await page.getByRole('button', { name: 'Sjekk svar', exact: true }).click();
    await page.getByRole('button', { name: 'Neste segment', exact: true }).click();
  }
  await expect(page.locator('#dictationExercise')).toContainText('8 av 8');
});

test('F12: same used profile receives build B and keeps answers through update and offline reload', async ({ page, context }) => {
  version = 'test-a'; await openApp(page);
  await page.evaluate(() => { showPage('verbs'); selectedVerbs = new Set(['hablar']); startVerbSession(); });
  await page.locator('#verbInput').fill(await page.locator('#verbInput').getAttribute('data-expected'));
  await page.locator('#verbExerciseArea').getByRole('button', { name: 'Sjekk svar' }).click();
  version = 'test-b';
  await page.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration(); await registration.update(); });
  await expect(page.locator('#appUpdateNotice')).toBeVisible();
  await page.getByRole('button', { name: 'Last inn oppdateringen', exact: true }).click();
  await expect(page.locator('meta[name="app-build"]')).toHaveAttribute('content', 'test-a');
  await expect(page.locator('#verbFeedback [data-feedback-next]')).toBeVisible();
  await page.evaluate(() => endVerbSession());
  await page.getByRole('button', { name: 'Last inn oppdateringen', exact: true }).click();
  await expect(page.locator('meta[name="app-build"]')).toHaveAttribute('content', 'test-b');
  expect(await page.evaluate(() => practiceHistory.reduce((sum, entry) => sum + entry.words, 0))).toBe(1);
  server.setOffline(true);
  await context.setOffline(true); await page.reload();
  await expect(page.locator('meta[name="app-build"]')).toHaveAttribute('content', 'test-b');
  expect(await page.evaluate(() => practiceHistory.reduce((sum, entry) => sum + entry.words, 0))).toBe(1);
});
