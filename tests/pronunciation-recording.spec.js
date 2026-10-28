import { test, expect } from '@playwright/test';
import { startStaticAppServer } from './helpers/static-app-server.js';
let server;
test.use({ permissions: ['microphone'], launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] } });
test.beforeAll(async () => { server = await startStaticAppServer(); });
test.afterAll(async () => { await server.close(); });
async function openComparison(page) {
  await page.addInitScript(() => {
    window.__streams = []; window.__objectUrls = [];
    const get = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async constraints => { const stream = await get(constraints); window.__streams.push(stream); return stream; };
    const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = blob => { const url = create(blob); window.__objectUrls.push(url); return url; };
    URL.revokeObjectURL = url => { window.__objectUrls = window.__objectUrls.filter(x => x !== url); revoke(url); };
  });
  await page.goto(server.url);
  await page.evaluate(() => { studentName = 'Test'; showMainApp(); showPage('pronunciation'); });
  await page.getByText('Velg et annet tema', { exact: true }).click();
  await page.locator('[data-pron-start="b-v-og-j"]').click();
  await page.getByText('Ta opp og sammenlign (valgfritt)', { exact: true }).click();

}

test('real local recording releases microphone on stop and removes its only object URL on exit', async ({ page }) => {
  const writes = [];
  page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
  await openComparison(page);
  const before = await page.evaluate(() => ({ ...localStorage }));
  await expect(page.getByText('Midlertidig opptak', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ta opp stemmen min' }).click();
  await expect(page.locator('#pronunciationRecorder')).toContainText('Tar opp', { timeout: 15000 });
  await expect(page.getByRole('button', { name: 'Stopp opptaket', exact: true })).toBeFocused();
  await page.waitForTimeout(650);
  await page.getByRole('button', { name: 'Stopp opptaket', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hør mitt opptak' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Hør mitt opptak' })).toBeFocused();
  expect(await page.evaluate(() => window.__streams.flatMap(s => s.getTracks().map(t => t.readyState)))).toEqual(['ended']);
  await page.getByRole('button', { name: 'Hør mitt opptak' }).click();
  await expect.poll(() => page.locator('#pronunciationOwnAudio').evaluate(a => a.currentTime)).toBeGreaterThan(0);
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before);
  expect(await page.evaluate(() => window.__objectUrls.length)).toBe(1);
  await page.getByRole('button', { name: 'Avslutt økten' }).click();
  expect(await page.evaluate(() => window.__objectUrls.length)).toBe(0);
  expect(writes).toEqual([]);
  expect(JSON.stringify(await page.evaluate(() => buildProgressExportData().pronunciation))).not.toMatch(/blob:|base64|audio|transcript/);
});

test('denied microphone leaves model comparison and the next exercise available', async ({ page }) => {
  await openComparison(page);
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Denied', 'NotAllowedError'); }; });
  await page.getByRole('button', { name: 'Ta opp stemmen min' }).click();
  await expect(page.locator('#pronunciationRecordingStatus')).toContainText('Mikrofonen er ikke tillatt');
  for (const role of ['word', 'sentence']) {
    await page.locator(`[data-pron-play="${role}"]`).click();
    await expect.poll(() => page.locator('#pronunciationModelAudio').evaluate(a => a.ended)).toBe(true);
  }
  await page.getByRole('button', { name: 'Neste lyd', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Øv på j og g foran e/i', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__objectUrls.length)).toBe(0);
});

test('a late playback rejection cannot cancel the next recording', async ({ page }) => {
  await openComparison(page);
  await page.getByRole('button', { name: 'Ta opp stemmen min' }).click();
  await expect(page.locator('#pronunciationRecordingStatus')).toContainText('Tar opp');
  await page.waitForTimeout(650);
  await page.getByRole('button', { name: 'Stopp opptaket', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hør mitt opptak' })).toBeEnabled();
  await page.locator('#pronunciationOwnAudio').evaluate(audio => { audio.play = () => new Promise((_, reject) => { window.__rejectOldPlay = reject; }); });
  await page.getByRole('button', { name: 'Hør mitt opptak' }).click();
  await page.getByRole('button', { name: 'Ta et nytt opptak' }).click();
  await expect(page.locator('#pronunciationRecordingStatus')).toContainText('Tar opp');
  await page.evaluate(() => window.__rejectOldPlay(new DOMException('Old sound was removed', 'AbortError')));
  await expect(page.locator('#pronunciationRecordingStatus')).toContainText('Tar opp');
  expect(await page.evaluate(() => window.__streams.at(-1).getTracks().map(t => t.readyState))).toEqual(['live']);
  await page.getByRole('button', { name: 'Avslutt økten' }).click();
  expect(await page.evaluate(() => window.__streams.at(-1).getTracks().map(t => t.readyState))).toEqual(['ended']);
});

test('permission granted after exit immediately releases the late stream without recording', async ({ page }) => {
  await openComparison(page);
  await page.evaluate(() => {
    const get = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = constraints => new Promise(resolve => { window.__grantLater = async () => resolve(await get(constraints)); });
  });
  await page.getByRole('button', { name: 'Ta opp stemmen min' }).click();
  await expect(page.locator('#pronunciationRecordingStatus')).toContainText('Venter');
  await page.getByRole('button', { name: 'Avslutt økten' }).click();
  await page.evaluate(() => window.__grantLater());
  await expect.poll(() => page.evaluate(() => window.__streams.flatMap(s => s.getTracks().map(t => t.readyState)))).toEqual(['ended']);
  expect(await page.evaluate(() => window.__objectUrls.length)).toBe(0);
});

test('time limit releases tracks and hiding the page discards the resulting sound', async ({ page }) => {
  test.setTimeout(45000);
  await openComparison(page);
  await page.getByRole('button', { name: 'Ta opp stemmen min' }).click();
  await expect(page.locator('#pronunciationRecordingStatus')).toContainText('Tar opp');
  await expect(page.getByRole('button', { name: 'Hør mitt opptak' })).toBeEnabled({ timeout: 20000 });
  expect(await page.evaluate(() => window.__streams.flatMap(s => s.getTracks().map(t => t.readyState)))).toEqual(['ended']);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  expect(await page.evaluate(() => window.__objectUrls.length)).toBe(0);
  await expect(page.getByRole('button', { name: 'Hør mitt opptak' })).toHaveCount(0);
});

test('oversized chunks are discarded and reset while recording releases every track', async ({ page }) => {
  await openComparison(page);
  await page.evaluate(() => {
    const Native = MediaRecorder;
    window.MediaRecorder = class extends Native { constructor(...args) { super(...args); window.__recorder = this; } };
  });
  await page.getByRole('button', { name: 'Ta opp stemmen min' }).click();
  await expect(page.locator('#pronunciationRecordingStatus')).toContainText('Tar opp');
  await page.evaluate(() => window.__recorder.dispatchEvent(new BlobEvent('dataavailable', { data: new Blob([new Uint8Array(1000001)]) })));
  await expect(page.locator('#pronunciationRecordingStatus')).toContainText('for stort');
  expect(await page.evaluate(() => window.__streams.flatMap(s => s.getTracks().map(t => t.readyState)))).toEqual(['ended']);
  expect(await page.evaluate(() => window.__objectUrls.length)).toBe(0);
  await page.getByRole('button', { name: 'Ta opp stemmen min' }).click();
  await expect(page.locator('#pronunciationRecordingStatus')).toContainText('Tar opp');
  await page.evaluate(() => clearAllLocalAppData());
  expect(await page.evaluate(() => window.__streams.flatMap(s => s.getTracks().map(t => t.readyState)))).toEqual(['ended', 'ended']);
});


test('collapsing optional recording or moving to the next card discards sound and stops tracks', async ({ page }) => {
  await openComparison(page);
  await page.getByRole('button', { name: 'Ta opp stemmen min' }).click();
  await expect(page.locator('#pronunciationRecordingStatus')).toContainText('Tar opp');
  await page.getByText('Ta opp og sammenlign (valgfritt)', { exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__streams.flatMap(s => s.getTracks().map(t => t.readyState)))).toEqual(['ended']);
  expect(await page.evaluate(() => window.__objectUrls.length)).toBe(0);
  await page.getByText('Ta opp og sammenlign (valgfritt)', { exact: true }).click();
  await page.getByRole('button', { name: 'Ta opp stemmen min' }).click();
  await expect(page.locator('#pronunciationRecordingStatus')).toContainText('Tar opp');
  await page.waitForTimeout(650);
  await page.getByRole('button', { name: 'Stopp opptaket', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hør mitt opptak' })).toBeEnabled();
  expect(await page.evaluate(() => window.__objectUrls.length)).toBe(1);
  for (const role of ['word', 'sentence']) {
    await page.locator(`[data-pron-play="${role}"]`).click();
    await expect.poll(() => page.locator('#pronunciationModelAudio').evaluate(a => a.ended)).toBe(true);
  }
  await page.getByRole('button', { name: 'Neste lyd', exact: true }).click();
  expect(await page.evaluate(() => window.__objectUrls.length)).toBe(0);
  expect(await page.evaluate(() => window.__streams.flatMap(s => s.getTracks().map(t => t.readyState)))).toEqual(['ended', 'ended']);
  await expect(page.getByRole('button', { name: 'Hør mitt opptak' })).toHaveCount(0);
});

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test(`opening recording reveals the full explanation and controls at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openComparison(page);
    await expect.poll(() => page.locator('#pronunciationRecordingOptions').evaluate(el => {
      const box = el.getBoundingClientRect();
      const navigation = document.querySelector('.pron-card-navigation').getBoundingClientRect();
      return box.top >= 0 && box.bottom <= Math.min(innerHeight, navigation.top);
    })).toBe(true);
    await expect(page.getByText('Lydskrift', { exact: true })).toHaveCount(0);
    await expect(page.locator('[data-pron-play="letter"]')).toHaveCount(0);
    expect(await page.evaluate(() => window.__streams.length)).toBe(0);
  });
}
