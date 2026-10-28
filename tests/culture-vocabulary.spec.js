import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { startStaticAppServer } from './helpers/static-app-server.js';

const pack = JSON.parse(readFileSync('data/culture-packages.json')).packages[0];
let server;
test.beforeAll(async () => { server = await startStaticAppServer(); });
test.afterAll(async () => server.close());

test('the lesson button starts only its ten words in ordinary vocabulary practice', async ({ page }) => {
  await page.goto(server.url + 'docs/kultur/jul-spania-chile/index.html');
  await page.getByRole('link', { name: 'Lær juleglosene' }).click();
  await page.locator('#studentNameInput').fill('Demo');
  await page.locator('.login-btn-primary').click();
  await expect(page.locator('#vocabStudy')).toBeVisible();
  await expect(page.locator('#cultureVocabularyContext')).toContainText(pack.title);
  const words = await page.evaluate(() => [...new Set(sessionCards.map(item => item.card.es.toLocaleLowerCase()))].sort());
  expect(words).toEqual(pack.vocabulary.map(word => word.es.toLocaleLowerCase()).sort());
  expect(await page.evaluate(() => sessionCards.length)).toBe(20);
});

test('unknown set IDs fail clearly, including inherited object names', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(server.url + 'index.html#gloser/constructor');
  await page.locator('#studentNameInput').fill('Demo');
  await page.locator('.login-btn-primary').click();
  await expect(page.getByText('Dette glosesettet finnes ikke. Velg en kategori i Gloser.', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  await expect(page.locator('#vocabSettings')).toBeVisible();
});

test('optional theme words accept natural individual answer variants', async ({ page }) => {
  await page.goto(server.url + 'index.html#gloser/jul-spania-chile');
  await page.locator('#studentNameInput').fill('Demo');
  await page.locator('.login-btn-primary').click();
  const result = await page.evaluate(() => {
    const word = id => cards.find(card => card.cultureTermId === id);
    const check = (id, direction, answer) => evaluateDiagnosisAnswer({
      acceptedAnswers: getVocabularyAcceptedAnswers(word(id), direction, direction === 'no-es' ? word(id).es : word(id).no)
    }, answer).correct;
    return [check('juntos', 'no-es', 'juntas'), check('cenar', 'es-no', 'å spise middag'), check('costumbre', 'es-no', 'tradisjon')];
  });
  expect(result).toEqual([true, true, true]);
});

test('optional words stay out of the default category selection after activation and reload', async ({ page }) => {
  await page.goto(server.url + 'index.html');
  await page.locator('#studentNameInput').fill('Demo');
  await page.locator('.login-btn-primary').click();
  const originalCount = await page.evaluate(() => cards.length);
  await page.locator('#navVocab').click();
  await page.locator('#vocabCategoryDisclosure summary').click();
  const category = page.locator('[data-category="culture:jul-spania-chile"]');
  await expect(category).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => cards.filter(card => card.cultureSetId).length)).toBe(0);
  await category.click();
  expect(await page.evaluate(() => cards.length)).toBe(originalCount + 7);
  await page.getByRole('button', { name: 'Velg alle', exact: true }).click();
  expect(await page.evaluate(() => getFilteredCards().some(card => card.cultureSetId))).toBe(false);
  await page.reload();
  await page.locator('#navVocab').click();
  expect(await page.evaluate(() => getFilteredCards().some(card => card.cultureSetId))).toBe(false);
  expect(await page.evaluate(() => cards.length)).toBe(originalCount + 7);
});

test('all scheduled words show a return date and offer extra practice without changing the plan', async ({ page }) => {
  await page.goto(server.url + 'index.html#gloser/jul-spania-chile');
  await page.locator('#studentNameInput').fill('Demo');
  await page.locator('.login-btn-primary').click();
  await page.evaluate(() => {
    for (const card of getCultureVocabularyCards('jul-spania-chile')) {
      card.noEs = { ...card.noEs, repetitions: 2, nextReview: '2999-01-02T12:00:00Z' };
      card.esNo = { ...card.esNo, repetitions: 2, nextReview: '2999-01-02T12:00:00Z' };
    }
    saveData();
  });
  await page.reload();
  await expect(page.locator('#cultureVocabularyContext')).toContainText('Neste repetisjon');
  const before = await page.evaluate(() => JSON.stringify(getCultureVocabularyCards('jul-spania-chile').map(card => [card.noEs, card.esNo])));
  await page.getByRole('button', { name: 'Øv ekstra på juleglosene' }).click();
  expect(await page.evaluate(() => isCustomStudySession)).toBe(true);
  await page.evaluate(() => { flipCard(); rateCard(2); });
  expect(await page.evaluate(() => sessionStats.reviewed)).toBe(1);
  const after = await page.evaluate(() => JSON.stringify(getCultureVocabularyCards('jul-spania-chile').map(card => [card.noEs, card.esNo])));
  expect(after).toBe(before);
});

test('restart keeps the set and full export/import preserves both ordinary and theme progress', async ({ page, browser }) => {
  await page.goto(server.url + 'index.html#gloser/jul-spania-chile');
  await page.locator('#studentNameInput').fill('Demo');
  await page.locator('.login-btn-primary').click();
  const payload = await page.evaluate(() => {
    for (const card of getCultureVocabularyCards('jul-spania-chile')) {
      card.noEs = { ...card.noEs, repetitions: 2, nextReview: '2999-01-01T00:00:00Z' };
      card.esNo = { ...card.esNo, repetitions: 2, nextReview: '2999-01-01T00:00:00Z' };
    }
    const theme = cards.find(card => card.cultureTermId === 'familia');
    theme.noEs.nextReview = '2020-01-01T00:00:00Z';
    const unrelated = cards.find(card => !card.cultureSetId && card.canonicalId !== 'vocab-0117' && card.canonicalId !== 'vocab-0119' && card.canonicalId !== 'vocab-0102');
    unrelated.noEs = { ...unrelated.noEs, repetitions: 1, nextReview: '2020-01-01T00:00:00Z' };
    saveData();
    abandonActiveSession();
    restartCurrentVocabMode();
    return { queue: sessionCards.map(item => item.card.cultureTermId), backup: buildProgressExportData() };
  });
  expect(payload.queue).toEqual(['familia']);
  expect(payload.backup.version).toBe('spansk123_export_v1');
  const context = await browser.newContext();
  const restored = await context.newPage();
  await restored.goto(server.url + 'index.html');
  const result = await restored.evaluate(backup => {
    importProgressData(backup);
    loadData();
    selectCultureCategory('jul-spania-chile');
    return {
      count: getCultureVocabularyCards('jul-spania-chile').length,
      themeCount: cards.filter(card => card.cultureSetId).length,
      themeDue: cards.find(card => card.cultureTermId === 'familia').noEs.nextReview,
      standardCopies: cards.filter(card => card.canonicalId === 'vocab-0117').length,
      standardRepetitions: cards.find(card => card.canonicalId === 'vocab-0117').noEs.repetitions
    };
  }, payload.backup);
  expect(result).toEqual({ count: 10, themeCount: 7, themeDue: '2020-01-01T00:00:00Z', standardCopies: 1, standardRepetitions: 2 });
  await context.close();
});

test('cancelling a set change keeps the active queue and URL', async ({ page }) => {
  await page.goto(server.url + 'index.html#gloser/jul-spania-chile');
  await page.locator('#studentNameInput').fill('Demo');
  await page.locator('.login-btn-primary').click();
  const before = await page.evaluate(() => sessionCards.map(item => item.card.id));
  page.on('dialog', dialog => dialog.dismiss());
  await page.evaluate(() => { location.hash = 'gloser/ukjent'; });
  await expect(page).toHaveURL(/#gloser\/jul-spania-chile$/);
  expect(await page.evaluate(() => sessionCards.map(item => item.card.id))).toEqual(before);
  await expect(page.locator('#vocabStudy')).toBeVisible();
});

test('the lesson and its practice link work from local files offline', async ({ page, context }) => {
  await context.setOffline(true);
  await page.goto(pathToFileURL(path.resolve('docs/kultur/jul-spania-chile/index.html')).toString());
  await page.getByRole('link', { name: 'Lær juleglosene' }).click();
  await page.locator('#studentNameInput').fill('Demo');
  await page.locator('.login-btn-primary').click();
  await expect(page.locator('#vocabStudy')).toBeVisible();
  expect(await page.evaluate(() => getCultureVocabularyCards(currentCultureSetId).length)).toBe(10);
});

test('return to reading preserves the active queue when cancelled and reaches the heading when accepted', async ({ page }) => {
  await page.goto(server.url + 'index.html#gloser/jul-spania-chile');
  await page.locator('#studentNameInput').fill('Demo');
  await page.locator('.login-btn-primary').click();
  const state = () => page.evaluate(() => JSON.stringify({ queue: sessionCards, current: currentIndex, type: activeSessionType }));
  const before = await state();
  const url = page.url();
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('#cultureVocabularyContext').getByRole('link', { name: 'Tilbake til teksten' }).click();
  expect(page.url()).toBe(url);
  expect(await state()).toBe(before);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#cultureVocabularyContext').getByRole('link', { name: 'Tilbake til teksten' }).click();
  await expect(page).toHaveURL(/jul-spania-chile\/index.html#espana-title$/);
  await expect(page.locator('#espana-title')).toBeInViewport();
});

test('welcome describes the selected lesson without storing progress or creating cards', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const snapshot = () => page.evaluate(() => ({ storage: { ...localStorage }, themes: cards.filter(card => card.cultureSetId).length }));
  await page.goto(server.url + 'index.html');
  const before = await snapshot();
  await expect(page.locator('#cultureWelcomeContext')).toBeHidden();
  for (const id of ['un-dia-en-peru', 'jul-spania-chile']) {
    await page.evaluate(id => { location.hash = 'gloser/' + id; }, id);
    const selected = JSON.parse(readFileSync('data/culture-packages.json')).packages.find(p => p.id === id);
    await expect(page.locator('#cultureWelcomeContext')).toContainText(`Du skal øve på de 10 ordene fra «${selected.title}».`);
    await expect(page.locator('#cultureWelcomeContext')).toContainText('Du trenger ingen konto.');
    const link = page.locator('#cultureWelcomeContext').getByRole('link', { name: 'Tilbake til teksten' });
    await expect(link).toHaveAttribute('href', `docs/kultur/${id}/index.html#${selected.countries[0].id}-title`);
    expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44);
    if (process.env.CULTURE_UX_CAPTURE === '1' && id === 'un-dia-en-peru') {
      mkdirSync('output/playwright', { recursive: true });
      await page.screenshot({ path: 'output/playwright/kultur-ux-etter-velkomstkontekst.png', fullPage: true });
    }
    expect(await snapshot()).toEqual(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
  for (const hash of ['', '#gloser/constructor', '#gloser/ukjent']) {
    await page.evaluate(hash => { location.hash = hash; }, hash);
    await expect(page.locator('#cultureWelcomeContext')).toBeHidden();
    await expect(page.locator('#cultureWelcomeContext a')).toHaveCount(0);
    expect(await snapshot()).toEqual(before);
  }
});

for (const id of ['un-dia-en-peru', 'jul-spania-chile']) test(`first visit to ${id} shows context and starts exactly ten words in both directions`, async ({ page }) => {
  await page.goto(server.url + 'index.html#gloser/' + id);
  await expect(page.locator('#cultureWelcomeContext')).toContainText('Profilen og fremgangen lagres i denne nettleseren.');
  expect(await page.evaluate(() => ({ storage: localStorage.length, themes: cards.filter(card => card.cultureSetId).length }))).toEqual({ storage: 0, themes: 0 });
  await page.locator('#studentNameInput').fill('Demo');
  await page.locator('.login-btn-primary').click();
  await expect(page.locator('#vocabStudy')).toBeVisible();
  expect(await page.evaluate(id => ({
    count: getCultureVocabularyCards(id).length,
    queue: sessionCards.length,
    unique: new Set(sessionCards.map(item => item.card.id + ':' + item.direction)).size
  }), id)).toEqual({ count: 10, queue: 20, unique: 20 });
});
