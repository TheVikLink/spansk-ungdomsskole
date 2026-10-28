import { test, expect } from '@playwright/test';
import { startStaticAppServer } from './helpers/static-app-server.js';

let server;
test.beforeAll(async () => { server = await startStaticAppServer(); });
test.afterEach(() => server.setOffline(false));
test.afterAll(async () => { await server.close(); });
async function open(page) {
  await page.goto(server.url);
  await page.evaluate(() => { studentName = 'Test'; showMainApp(); });
  await page.getByRole('button', { name: 'Åpne uttaleskolen', exact: true }).click();
}
async function listen(page, role) {
  await page.locator(`[data-pron-play="${role}"]`).click();
  await expect.poll(() => page.locator('#pronunciationModelAudio').evaluate(a => a.ended)).toBe(true);
}

test('one card shows word and sentence; one click plays each model without a quiz or reveal step', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await page.getByRole('button', { name: 'Start en kort økt', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Øv på a' })).toBeVisible();
  await expect(page.locator('[data-pron-text="word"]')).toHaveText('casa');
  await expect(page.locator('[data-pron-text="sentence"]')).toHaveText('Ana lava la taza en casa.');
  await expect(page.getByRole('radio')).toHaveCount(0);
  await expect(page.getByText('Hvilken vokal hører du?', { exact: true })).toHaveCount(0);
  await expect(page.locator('#pronunciationReveal')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Neste lyd', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Neste lyd', exact: true })).toBeInViewport();
  await listen(page, 'word');
  await expect(page.getByRole('button', { name: 'Neste lyd', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => buildProgressExportData().pronunciation.practiced)).toEqual([]);
  await listen(page, 'sentence');
  await page.getByRole('button', { name: 'Neste lyd', exact: true }).press('Enter');
  await expect(page.getByRole('heading', { name: 'Øv på e' })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Øv på e' })).toBeInViewport();
  const backup = await page.evaluate(() => buildProgressExportData());
  expect(backup.pronunciation.practiced.map(p => p.itemId)).toEqual(['refold-es-01']);
  expect(JSON.stringify(backup.pronunciation)).not.toMatch(/audio|transcript|blob|record/i);
  const restored = await page.evaluate(backup => { localStorage.removeItem('spansk123_pronunciation_v1'); return importProgressData(backup); }, backup);
  expect(restored.imported).toBe(true);
  await page.getByRole('button', { name: 'Forrige lyd', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Øv på a' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Øv på a' })).toBeInViewport();
  await page.getByRole('button', { name: 'Neste lyd', exact: true }).click();
  expect(await page.evaluate(() => buildProgressExportData().pronunciation.practiced.length)).toBe(1);
  for (const next of ['Neste lyd', 'Fullfør økten']) {
    await listen(page, 'word'); await listen(page, 'sentence');
    await page.getByRole('button', { name: next, exact: true }).click();
  }
  await expect(page.getByRole('heading', { name: 'Ferdig for nå!' })).toBeVisible();
  await expect(page.getByText('Du har øvd på 3 lydkort.', { exact: true })).toBeVisible();
  await expect(page.getByText('lytte-/regeloppgaver', { exact: false })).toHaveCount(0);
  expect(await page.evaluate(() => buildProgressExportData().pronunciation.practiced.length)).toBe(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('missing word audio shows an error beside the model and cannot mark practice', async ({ page }) => {
  await open(page);
  server.setOffline(true);
  await page.getByRole('button', { name: 'Start en kort økt', exact: true }).click();
  await page.locator('[data-pron-play="word"]').click();
  await expect(page.locator('#pronunciationAudioStatus')).toContainText('ikke tilgjengelig');
  await expect(page.getByRole('button', { name: 'Neste lyd', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => buildProgressExportData().pronunciation.practiced)).toEqual([]);
});

test('old import preserves pronunciation; invalid fields and quota cannot replace existing metadata', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const valid = { schemaVersion: 1, catalogVersion: 1, practiced: [{ itemId: 'refold-es-01', contentVersion: 1, practicedOn: '2026-10-07' }] };
    const key = PronunciationCore.KEY;
    localStorage.setItem(key, JSON.stringify(valid));
    const old = importProgressData({ version: 'spansk123_export_v1' });
    const afterOld = localStorage.getItem(key);
    const bad = importProgressData({ version: 'spansk123_export_v1', pronunciation: { ...valid, audio: 'private sound' } });
    const afterBad = localStorage.getItem(key);
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function(k, v) { if (k === key) throw new DOMException('Full', 'QuotaExceededError'); return set.call(this, k, v); };
    const full = importProgressData({ version: 'spansk123_export_v1', pronunciation: valid });
    Storage.prototype.setItem = set;
    return { old, bad, full, original: JSON.stringify(valid), afterOld, afterBad, afterFull: localStorage.getItem(key) };
  });
  expect(result.old.imported).toBe(true);
  expect(result.bad.message).toContain('ikke lagret');
  expect(result.full.message).toContain('ikke nok plass');
  expect([result.afterOld, result.afterBad, result.afterFull]).toEqual([result.original, result.original, result.original]);
});

test('topic links support homework and classroom lookup never changes progress', async ({ page }) => {
  await page.goto(server.url + '#uttale/r-og-rr');
  await page.getByLabel('Fornavn eller elevkode', { exact: true }).fill('Test');
  await page.getByRole('button', { name: '🚀 Start', exact: true }).click();
  await expect(page.locator('.pron-next')).toContainText('r og rr');
  await page.getByRole('button', { name: 'Finn en lyd' }).click();
  await page.getByLabel('Søk etter en lyd eller et ord').fill('queso');
  await page.locator('.pron-library-card > summary').click();
  await page.locator('[data-pron-play="word"]').click();
  await expect.poll(() => page.locator('#pronunciationModelAudio').evaluate(a => a.ended)).toBe(true);
  expect(await page.evaluate(() => buildProgressExportData().pronunciation.practiced)).toEqual([]);
});

test('invalid pronunciation metadata does not block backup of other subjects or export unknown raw fields', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const raw = JSON.stringify({ schemaVersion: 900, audio: 'private sound' });
    localStorage.setItem(PronunciationCore.KEY, raw);
    const warnings = [];
    const data = buildProgressExportData({ warnings });
    return { data, warnings, raw, retained: localStorage.getItem(PronunciationCore.KEY) };
  });
  expect(result.data.version).toBe('spansk123_export_v1');
  expect(result.data).toHaveProperty('vocabData');
  expect(result.data).not.toHaveProperty('pronunciation');
  expect(JSON.stringify(result.data)).not.toContain('private sound');
  expect(result.warnings).toHaveLength(1);
  expect(result.retained).toBe(result.raw);
});


test('the bottom sound menu starts exactly the selected sound and records that sound only', async ({ page }) => {
  await open(page);
  const menu = page.getByRole('navigation', { name: 'Velg en lyd å øve på' });
  await expect(menu.getByRole('button')).toHaveCount(31);
  await menu.getByRole('button', { name: 'Øv på ñ', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Øv på ñ', exact: true })).toBeFocused();
  await expect(page.getByText('Lydkort 1 av 1', { exact: true })).toBeVisible();
  for (const role of ['word', 'sentence']) await listen(page, role);
  await page.getByRole('button', { name: 'Fullfør økten', exact: true }).click();
  expect(await page.evaluate(() => buildProgressExportData().pronunciation.practiced.map(p => p.itemId))).toEqual(['refold-es-25']);
  await page.getByRole('navigation', { name: 'Velg en lyd å øve på' }).getByRole('button', { name: 'Øv på e', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Øv på e', exact: true })).toBeVisible();
});
