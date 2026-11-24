import { test, expect } from '@playwright/test';
import { startStaticAppServer } from './helpers/static-app-server.js';

let appServer;
test.beforeAll(async () => { appServer = await startStaticAppServer(); });
test.afterAll(async () => { await appServer.close(); });
async function openTheme(page, url = appServer.url) {
  await page.goto(url);
  await page.locator('#studentNameInput').fill('Test');
  await page.locator('.login-btn-primary').click();
  await page.locator('#navVocab').click();
  await page.locator('#recognitionOpenBtn').click();
  await expect(page.locator('#recognitionTitle')).toContainText('Spansk du kjenner igjen');
}
const storage = page => page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));

test('discovery requires an attempt, hides the bridge and never writes progress', async ({ page }) => {
  await openTheme(page);
  const before = await storage(page);
  await page.locator('#recognitionDiscoverBtn').click();
  await expect(page.locator('.recognition-prompt')).toHaveText('el hotel');
  await expect(page.locator('#recognitionThemePanel')).not.toContainText('Norsk spor');
  await expect(page.locator('#recognitionThemePanel')).not.toContainText('hotell');
  await page.locator('#recognitionAnswerInput').fill('hotell');
  await page.locator('#recognitionCheckBtn').click();
  await expect(page.locator('#recognitionFeedback')).toContainText('Riktig!');
  await expect(page.locator('#recognitionFeedback')).toContainText('Norsk spor: hotell');
  await page.evaluate(() => submitRecognitionAnswer());
  expect(await page.evaluate(() => recognitionRound.answers.length)).toBe(1);
  await page.locator('#recognitionNextBtn').click();
  await page.locator('#recognitionHintBtn').click();
  await page.locator('#recognitionAnswerInput').fill('restaurant');
  await page.locator('#recognitionCheckBtn').click();
  await page.locator('#recognitionNextBtn').click();
  for (let i = 2; i < 10; i++) {
    await page.locator('#recognitionSkipBtn').click();
    await page.locator('#recognitionNextBtn').click();
  }
  await expect(page.locator('#recognitionThemePanel')).toContainText('1 av 10 riktige uten hint. 1 riktige med hint.');
  await page.getByRole('button', { name: 'Tilbake til temaet', exact: true }).click();
  await expect(page.locator('#recognitionDiscoverBtn')).toBeFocused();
  expect(await storage(page)).toBe(before);
});

test('old review dates do not block discovery, and navigation guards preserve the round', async ({ page }) => {
  await openTheme(page);
  await page.evaluate(() => {
    getRecognitionCards(true).forEach(card => {
      for (const direction of ['noEs', 'esNo']) Object.assign(card[direction], { repetitions: 8, nextReview: '2099-01-01' });
    });
    saveData();
  });
  const before = await storage(page);
  await page.locator('#recognitionDiscoverBtn').click();
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('#navHome').click();
  await expect(page.locator('#recognitionAnswerInput')).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#navHome').click();
  await expect(page.locator('#homePage')).toBeVisible();
  expect(await page.evaluate(() => recognitionRound)).toBeNull();
  await page.locator('#navVocab').click();
  await page.locator('#recognitionOpenBtn').click();
  await page.locator('#recognitionDiscoverBtn').click();
  await expect(page.locator('.recognition-prompt')).toHaveText('el hotel');
  expect(await storage(page)).toBe(before);
});

test('theme keeps canonical identities, excludes custom duplicates, and isolates ordinary practice', async ({ page }) => {
  await openTheme(page);
  const result = await page.evaluate(() => {
    const original = getRecognitionCards()[0];
    cards.push({ ...original, id: 99999, isCustom: true, category: 'Spansk du kjenner igjen' });
    return {
      count: getRecognitionCards().length,
      unique: new Set(getRecognitionCards().map(card => card.id)).size,
      shared: getRecognitionCards().find(card => card.id === original.id) === original,
      excludesCustom: !getRecognitionCards().some(card => card.isCustom)
    };
  });
  expect(result).toMatchObject({ count: 87, unique: 87, shared: true, excludesCustom: true });
  await page.getByRole('button', { name: 'Øv på startutvalget', exact: true }).click();
  expect(await page.evaluate(() => {
    const ids = new Set(getRecognitionCards(true).map(card => card.id));
    return sessionCards.length > 0 && sessionCards.every(item => ids.has(item.card.id));
  })).toBe(true);
  const answer = await page.evaluate(() => {
    const item = sessionCards[currentIndex];
    const id = item.card.id;
    const direction = item.direction;
    const before = getDirectionData(item.card, direction).repetitions;
    flipCard(); rateCard(2, false);
    const selectedCategoriesBefore = [...selectedCategories];
    selectedCategories = new Set([item.card.category]);
    const same = getFilteredCards().find(card => card.id === id);
    selectedCategories = new Set(selectedCategoriesBefore);
    return { before, after: getDirectionData(same, direction).repetitions, count: cards.filter(card => card.id === id).length };
  });
  expect(answer.after).toBeGreaterThan(answer.before);
  expect(answer.count).toBe(1);
  await page.evaluate(() => endVocabSession());
  await page.getByRole('button', { name: '▶️ Start ny økt', exact: true }).click();
  expect(await page.evaluate(() => sessionCards.every(item => getRecognitionCards(true).includes(item.card)))).toBe(true);
  await page.evaluate(() => endVocabSession());
  await page.getByRole('button', { name: /Tilbake til temaet/ }).click();
  await expect(page.locator('#recognitionTitle')).toBeVisible();
});

for (const width of [390, 1280]) {
  test(`teacher guide and word collection work with keyboard at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await openTheme(page);
    await page.screenshot({ path: `/tmp/madrigal-local-${width}.png` });
    await page.locator('#recognitionTeacherGuide summary').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#recognitionTeacherGuide')).toHaveAttribute('open', '');
    await expect(page.locator('#recognitionTeacherGuide')).toContainText('La música es importante');
    await page.locator('#recognitionAllWords summary').click();
    await expect(page.locator('.recognition-word')).toHaveCount(87);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#recognitionDiscoverBtn').click();
    await expect(page.locator('#recognitionQuestionTitle')).toBeFocused();
    await page.locator('#recognitionAnswerInput').fill('ikke riktig');
    await page.keyboard.press('Enter');
    await expect(page.locator('#recognitionFeedback')).toContainText('hotell');
    await expect(page.locator('#recognitionNextBtn')).toBeFocused();
  });
}

test('opening the theme clears an earlier culture selection before discovery', async ({ page }) => {
  await openTheme(page);
  await page.evaluate(() => {
    closeRecognitionTheme();
    selectCultureCategory('jul-spania-chile');
    openRecognitionTheme();
  });
  await expect(page.locator('#cultureVocabularyContext')).toBeHidden();
  expect(await page.evaluate(() => currentCultureSetId)).toBeNull();
  await page.locator('#recognitionDiscoverBtn').click();
  await expect(page.locator('.recognition-prompt')).toHaveText('el hotel');
});

test('invalid theme gives an accessible recovery and cannot start an empty round', async ({ page }) => {
  await openTheme(page);
  await page.evaluate(() => {
    document.getElementById('recognition-theme-data').textContent = '{}';
    openRecognitionTheme();
  });
  await expect(page.locator('#recognitionTitle')).toHaveText('Temaet er ikke tilgjengelig');
  await expect(page.locator('#recognitionTitle')).toBeFocused();
  await page.getByRole('button', { name: 'Til ordforråd', exact: true }).click();
  await expect(page.locator('#recognitionOpenBtn')).toBeFocused();
});

test('legacy backup and reimport preserve canonical progress without duplicate theme cards', async ({ page }) => {
  await openTheme(page);
  const result = await page.evaluate(() => {
    const old = cards.find(card => card.canonicalId === 'vocab-0475'); // tomato predates this feature
    old.esNo.repetitions = 4;
    old.esNo.nextReview = '2099-01-01T00:00:00.000Z';
    const legacy = { version: 'spansk123_export_v1', studentName: 'Test', vocabData: cards.filter(card => Number(card.canonicalId?.split('-')[1]) <= 522), practiceHistory: [] };
    cards = [];
    localStorage.removeItem('spansk123Data_v4');
    importProgressData(legacy);
    loadData();
    const afterLegacy = getRecognitionCards().length;
    saveData();
    const exported = buildProgressExportData();
    importProgressData(exported);
    loadData();
    return {
      afterLegacy,
      count: getRecognitionCards().length,
      tomatoCopies: cards.filter(card => card.canonicalId === 'vocab-0475').length,
      repetitions: cards.find(card => card.canonicalId === 'vocab-0475').esNo.repetitions,
      due: cards.find(card => card.canonicalId === 'vocab-0475').esNo.nextReview,
      version: exported.version,
      hasNewStorage: Object.keys(localStorage).some(key => /recognition|wordkeys/i.test(key))
    };
  });
  expect(result).toEqual({ afterLegacy: 87, count: 87, tomatoCopies: 1, repetitions: 4, due: '2099-01-01T00:00:00.000Z', version: 'spansk123_export_v1', hasNewStorage: false });
});

test('reviewed meanings and feminine forms work without mixing social with sociable', async ({ page }) => {
  await openTheme(page);
  const result = await page.evaluate(() => {
    const card = id => cards.find(card => card.canonicalId === id);
    const check = (id, direction, answer) => evaluateDiagnosisAnswer({
      acceptedAnswers: getVocabularyAcceptedAnswers(card(id), direction, direction === 'no-es' ? card(id).es : card(id).no)
    }, answer).correct;
    return {
      valid: [
        ['vocab-0547', 'no-es', 'la turista'], ['vocab-0548', 'no-es', 'la artista'],
        ['vocab-0549', 'no-es', 'la actriz'], ['vocab-0550', 'no-es', 'la doctora'],
        ['vocab-0551', 'no-es', 'la estudiante'], ['vocab-0584', 'no-es', 'fantástica'],
        ['vocab-0589', 'no-es', 'generosa'], ['vocab-0318', 'es-no', 'klasse'],
        ['vocab-0564', 'es-no', 'konversasjon'], ['vocab-0501', 'es-no', 'jogurt'],
        ['vocab-0523', 'es-no', 'hotellet'], ['vocab-0536', 'es-no', 'fotografi'], ['vocab-0528', 'no-es', 'el radio'],
        ['vocab-0575', 'es-no', 'samfunnsmessig'], ['vocab-0577', 'es-no', 'som gjelder musikk']
      ].map(args => check(...args)),
      social: check('vocab-0575', 'no-es', 'social'),
      sociable: check('vocab-0169', 'no-es', 'sociable'),
      wrong: [check('vocab-0575', 'no-es', 'sociable'), check('vocab-0169', 'no-es', 'social'),
        check('vocab-0551', 'no-es', 'la estudianta'), check('vocab-0549', 'no-es', 'la actor')]
    };
  });
  expect(result.valid.every(Boolean)).toBe(true);
  expect(result.social).toBe(true);
  expect(result.sociable).toBe(true);
  expect(result.wrong).toEqual([false, false, false, false]);
  await page.locator('#recognitionAllWords summary').click();
  await expect(page.locator('.recognition-word').filter({ hasText: 'sosial (om samfunnet)' })).toContainText('sociable');
  const musical = page.locator('.recognition-word').filter({ hasText: 'musikalsk (som gjelder musikk)' });
  await expect(musical).toContainText('un instrumento musical');
  await musical.scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/tmp/madrigal-reviewed-meanings.png' });
});

test('meaning clarifications preserve progress on existing social and musical cards', async ({ page }) => {
  await openTheme(page);
  const result = await page.evaluate(() => {
    for (const [id, oldPrompt] of [['vocab-0575', 'sosial'], ['vocab-0577', 'musikalsk']]) {
      const card = cards.find(card => card.canonicalId === id);
      card.no = oldPrompt;
      card.noEs.repetitions = 6;
      card.noEs.nextReview = '2099-01-01T00:00:00.000Z';
    }
    saveData(); loadData();
    return ['vocab-0575', 'vocab-0577'].map(id => {
      const matches = cards.filter(card => card.canonicalId === id);
      return { count: matches.length, no: matches[0].no, repetitions: matches[0].noEs.repetitions, due: matches[0].noEs.nextReview };
    });
  });
  expect(result).toEqual([
    { count: 1, no: 'sosial (om samfunnet)', repetitions: 6, due: '2099-01-01T00:00:00.000Z' },
    { count: 1, no: 'musikalsk (som gjelder musikk)', repetitions: 6, due: '2099-01-01T00:00:00.000Z' }
  ]);
});

test('the built-in collection and discovery work from the cached shell offline', async ({ page, context }) => {
  const server = await startStaticAppServer();
  try {
    await openTheme(page, server.url);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    server.setOffline(true);
    await context.setOffline(true);
    await page.reload();
    await page.locator('#navVocab').click();
    await page.locator('#recognitionOpenBtn').click();
    await expect(page.locator('#recognitionTitle')).toContainText('Spansk du kjenner igjen');
    await page.locator('#recognitionDiscoverBtn').click();
    await page.locator('#recognitionAnswerInput').fill('hotell');
    await page.locator('#recognitionCheckBtn').click();
    await expect(page.locator('#recognitionFeedback')).toContainText('Riktig!');
  } finally { await server.close(); }
});
