import { test, expect } from '@playwright/test';
import { startStaticAppServer } from './helpers/static-app-server.js';
import { readFileSync } from 'node:fs';
let server;
test.beforeAll(async () => { server = await startStaticAppServer(); });
test.afterEach(() => server.setOffline(false));
test.afterAll(async () => { await server.close(); });

test('all 62 original recordings survive reload without network, including range playback', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto(server.url);
  await page.evaluate(() => { studentName = 'Test'; localStorage.setItem('spansk123_studentName', studentName); showMainApp(); showPage('pronunciation'); });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.evaluate(async () => {
    const cache = await caches.open('spansk123-audio-v1');
    await cache.put('audio/uttale/refold-v1/ESPhoneticWritingSystem_1_letter.mp3', new Response('old alphabet clip'));
  });
  await page.getByRole('button', { name: 'Last ned hele uttaleskolen' }).click();
  await expect(page.locator('#pronunciationDownloadStatus')).toContainText('62 av 62', { timeout: 15000 });
  expect(await page.evaluate(async () => (await (await caches.open('spansk123-audio-v1')).keys()).some(r => r.url.endsWith('_letter.mp3')))).toBe(false);
  server.setOffline(true);
  await page.reload();
  await page.evaluate(() => showPage('pronunciation'));
  await expect(page.locator('#pronunciationDownloadStatus')).toContainText('62 av 62');
  const manifest = JSON.parse(readFileSync('data/pronunciation-audio-manifest.json'));
  const results = await page.evaluate(async files => {
    const values = [];
    for (const file of files) {
      const response = await fetch(file.path); const bytes = await response.arrayBuffer();
      const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), x => x.toString(16).padStart(2, '0')).join('');
      values.push({ status: response.status, sha256 });
    }
    return values;
  }, manifest.files);
  expect(results).toEqual(manifest.files.map(f => ({ status: 200, sha256: f.sha256 })));
  const first = manifest.files[0];
  const range = await page.evaluate(async path => { const r = await fetch(path, { headers: { Range: 'bytes=0-31' } }); return { status: r.status, bytes: [...new Uint8Array(await r.arrayBuffer())] }; }, first.path);
  expect(range.status).toBe(206); expect(range.bytes).toEqual([...readFileSync(first.path).subarray(0, 32)]);
  await page.getByRole('button', { name: 'Start en kort økt', exact: true }).click();
  await page.locator('[data-pron-play="word"]').click();
  await expect.poll(() => page.locator('#pronunciationModelAudio').evaluate(a => a.ended)).toBe(true);
});

test('a damaged cache and an interrupted download can be repaired without retaining invalid sound', async ({ page }) => {
  await page.goto(server.url);
  await page.evaluate(() => { studentName = 'Test'; showMainApp(); showPage('pronunciation'); });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.getByRole('button', { name: 'Last ned hele uttaleskolen' }).click();
  await expect(page.locator('#pronunciationDownloadStatus')).toContainText('62 av 62');
  await page.evaluate(async () => {
    const cache = await caches.open('spansk123-audio-v1');
    const keys = await cache.keys();
    await cache.put(keys[0], new Response('broken', { headers: { 'Content-Type': 'audio/mpeg' } }));
    await cache.delete(keys[1]);
    PronunciationOffline.status();
  });
  await expect(page.locator('#pronunciationDownloadStatus')).toContainText('60 av 62');
  server.setOffline(true);
  await page.getByRole('button', { name: 'Last ned hele uttaleskolen' }).click();
  await expect(page.locator('#pronunciationDownloadStatus')).toContainText('ikke fullført');
  server.setOffline(false);
  await page.getByRole('button', { name: 'Last ned hele uttaleskolen' }).click();
  await expect(page.locator('#pronunciationDownloadStatus')).toContainText('62 av 62');
  await page.evaluate(() => PronunciationOffline.status());
  await expect(page.locator('#pronunciationDownloadStatus')).toContainText('62 av 62');
});
