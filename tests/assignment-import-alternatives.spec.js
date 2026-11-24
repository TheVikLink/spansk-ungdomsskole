import { test, expect } from '@playwright/test';
import { startStaticAppServer } from './helpers/static-app-server.js';

let server;
test.beforeAll(async () => { server = await startStaticAppServer(); });
test.afterAll(async () => server.close());

async function enter(page) {
  await page.goto(server.url);
  await page.evaluate(() => { studentName = 'Lokal importkontroll'; showMainApp(); showPage('homework'); });
}

test('all standard-category packages reuse existing complete cards and their progress', async ({ page }) => {
  await enter(page);
  const results = await page.evaluate(() => {
    const original = JSON.stringify(cards);
    const categories = Object.keys(getCategories());
    return categories.map(category => {
      cards = JSON.parse(original);
      cards.filter(card => card.category === category).forEach(card => {
        card.noEs = { ...card.noEs, repetitions: 3, nextReview: '2030-01-01T00:00:00Z' };
        card.reviews = 5; card.correct = 4;
      });
      const before = JSON.stringify(cards);
      const assignment = buildTeacherAssignmentPackage({ assignmentTitle: category, vocabularyCategories: [category] });
      const result = importAssignmentPackage(assignment);
      return { category, expected: assignment.vocabulary.length, imported: result.importedWords,
        resolved: resolveAssignmentVocabularyCards().length, unchanged: JSON.stringify(cards) === before,
        feedback: getAssignmentImportFeedback(result) };
    });
  });
  for (const row of results) {
    expect(row.imported, row.category).toBe(0);
    expect(row.resolved, row.category).toBe(row.expected);
    expect(row.unchanged, row.category).toBe(true);
    expect(row.feedback, row.category).toContain(`${row.expected} ${row.expected === 1 ? 'glose' : 'gloser'} finnes allerede i ordlisten`);
  }
});

test('new slash alternatives remain available after backup recovery and repeated file imports', async ({ page }) => {
  await enter(page);
  const assignment = { schemaVersion: 'assignment-v1', id: 'assignment-alternatives', assignmentTitle: 'Egne alternativer',
    vocabulary: [{ norsk: 'å gå / å dra', spansk: 'ir / marcharse', category: '  Egen kategori  ' }] };
  const upload = () => page.locator('#assignmentFileInput').setInputFiles({ name: 'alternativer.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(assignment)) });
  await upload();
  await expect(page.locator('#assignmentImportStatus')).toContainText('4 gloser i leksepakken er klare');
  await expect(page.locator('#assignmentImportStatus')).toContainText('4 nye gloser lagt til');
  await expect(page.locator('#activeAssignmentPanel')).toContainText('4 gloser');
  const before = await page.evaluate(() => {
    const resolved = resolveAssignmentVocabularyCards();
    resolved[0].noEs = { ...resolved[0].noEs, repetitions: 3, nextReview: '2030-01-01T00:00:00Z' };
    resolved[0].reviews = 5; saveData();
    const backup = buildProgressExportData();
    importProgressData(backup); loadData(); loadActiveAssignment(); renderHomeworkPage();
    return { cards: JSON.stringify(cards), importedAt: activeAssignment.importedAt,
      pairs: resolveAssignmentVocabularyCards().map(card => `${card.no}::${card.es}`).sort() };
  });
  expect(before.pairs).toEqual(['å dra::ir', 'å dra::marcharse', 'å gå::ir', 'å gå::marcharse']);
  await upload();
  await expect(page.locator('#assignmentImportStatus')).toContainText('4 gloser finnes allerede i ordlisten');
  expect(await page.evaluate(() => JSON.stringify(cards))).toBe(before.cards);
  expect(await page.evaluate(() => activeAssignment.importedAt)).toBe(before.importedAt);
  await page.getByRole('button', { name: 'Start gloser', exact: true }).click();
  await expect(page.locator('#vocabStudy')).toBeVisible();
  expect(await page.evaluate(() => [...new Set(sessionCards.map(item => item.card.no+'::'+item.card.es))].sort())).toEqual(before.pairs);
});

test('unavailable vocabulary gets a clear warning while a verbs-only package succeeds', async ({ page }) => {
  await enter(page);
  const upload = assignment => page.locator('#assignmentFileInput').setInputFiles({ name: 'kontroll.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(assignment)) });
  await upload({ schemaVersion: 'assignment-v1', assignmentTitle: 'Ugyldig glose', vocabulary: [{ norsk: 'x'.repeat(81), spansk: 'prueba', category: 'egen' }] });
  await expect(page.locator('#assignmentImportStatus')).toContainText('Ingen gloser i leksepakken er tilgjengelige');
  await expect(page.locator('#assignmentImportStatus')).toContainText('Be læreren kontrollere leksefilen');
  await expect(page.locator('#assignmentImportStatus')).not.toHaveClass(/text-emerald/);
  await expect(page.locator('.toast')).toHaveClass(/error/);
  await upload({ schemaVersion: 'assignment-v1', assignmentTitle: 'Bare verb', vocabulary: [], verbFocuses: ['ar'] });
  await expect(page.locator('#assignmentImportStatus')).toContainText('er importert');
  await expect(page.locator('#assignmentImportStatus')).not.toContainText('Ingen gloser');
  await expect(page.locator('#activeAssignmentPanel').getByRole('button', { name: 'Start verb', exact: true })).toBeVisible();
  await expect(page.locator('.toast')).toHaveClass(/success/);
});

test('an actual Bindeord download reuses all 22 cards in a separate mobile pupil profile', async ({ page, browser }) => {
  await enter(page);
  await page.locator('#assignmentBuilder > summary').click();
  await page.getByLabel(/Bindeord \(/).check();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Last ned leksepakke', exact: true }).click();
  const download = await pending;
  const chunks = [];
  for await (const chunk of await download.createReadStream()) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const pupil = await context.newPage();
    await enter(pupil);
    const before = await pupil.evaluate(() => JSON.stringify(cards));
    await pupil.locator('#assignmentFileInput').setInputFiles({ name: 'bindeord.json', mimeType: 'application/json', buffer });
    await expect(pupil.locator('#assignmentImportStatus')).toContainText('22 gloser finnes allerede i ordlisten');
    await expect(pupil.locator('#assignmentImportStatus')).not.toContainText('nye gloser lagt til');
    expect(await pupil.evaluate(() => JSON.stringify(cards))).toBe(before);
    const available = await pupil.evaluate(() => resolveAssignmentVocabularyCards().map(card => card.id));
    expect(available).toHaveLength(22);
    await pupil.getByRole('button', { name: 'Start gloser', exact: true }).click();
    const inSession = await pupil.evaluate(() => [...new Set(sessionCards.map(item => item.card.id))]);
    expect(inSession.length).toBeGreaterThan(0);
    expect(inSession.every(id => available.includes(id))).toBe(true);
  } finally { await context.close(); }
});
