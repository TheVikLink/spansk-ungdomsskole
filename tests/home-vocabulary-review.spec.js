import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

async function openHome(page) {
  await page.goto(appUrl);
  await page.locator('#studentNameInput').fill('Demo');
  await page.locator('.login-btn-primary').click();
}

test('home shows the last seven local days and opens the existing Brainmap on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openHome(page);
  await page.evaluate(() => {
    const daysAgo = days => {
      const date = new Date();
      date.setDate(date.getDate() - days);
      return getLocalDateString(date);
    };
    practiceHistory = [
      { date: daysAgo(0), words: 3, correct: 2, activity: 'vocabulary' },
      { date: daysAgo(6), words: 5, correct: 3, activity: 'grammar' },
      { date: daysAgo(7), words: 20, correct: 15, activity: 'mixed-quiz' }
    ];
    cards[0].noEs = { ...cards[0].noEs, repetitions: 3, interval: 7 };
    saveData();
    savePracticeHistory();
    saveLearningProgress(updateLearningProgress({
      targetType: 'skill', targetId: 'a1.gustar.basic', resultKind: 'correct'
    }));
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Din fremgang' })).toBeVisible();
  await expect(page.locator('#homeWeekActivity')).toContainText('2 av 7');
  await expect(page.locator('#homeWeekActivity')).toContainText('8 besvarte oppgaver');
  await expect(page.locator('#homeWordProgress')).toContainText('1 ord sitter i øvingen');
  await page.locator('#homeWeekActivity [data-home-day]').first().click();
  await expect(page.getByText('5 svar i grammatikk', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Åpne Brainmap' }).click();
  await expect(page.locator('#brainmapPage')).toBeVisible();
  await page.locator('#navHome').click();
  await page.locator('.home-skill-grid .brainmap-node').first().click();
  await expect(page.getByRole('dialog', { name: /gustar/ })).toBeVisible();
});

test('home starts recommended words, new words in a theme and the entire custom list', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHome(page);
  const known = await page.evaluate(() => {
    const hello = cards.find(card => getVocabularyCanonicalId(card) === 'vocab-0064');
    hello.noEs = { ...hello.noEs, repetitions: 3, interval: 7 };
    applyTeacherWordImport({ importableCount: 2, skippedCount: 0, valid: [
      { norsk: 'øve', spansk: 'practicar', category: 'prøve uke 47' },
      { norsk: 'huske', spansk: 'recordar', category: 'prøve uke 47' }
    ] });
    const list = cards.filter(card => card.isCustom);
    for (const card of list) {
      card.noEs = { ...card.noEs, repetitions: 3, interval: 7, nextReview: '2999-01-01' };
      card.esNo = { ...card.noEs };
    }
    document.getElementById('newCardsLimit').value = '0';
    renderHomePage();
    return { hello: hello.id, list: list.map(card => card.id).sort() };
  });
  const recommendedSize = page.getByLabel('Antall nye ord', { exact: true });
  await expect(recommendedSize.locator('option')).toHaveText(['5 ord', '10 ord', '15 ord']);
  await expect(recommendedSize).toHaveValue('5');
  const preview = page.getByRole('list', { name: 'Spanske ord i økta' }).getByRole('listitem');
  await expect(preview).toHaveText(['gracias', 'buenos días', 'hablar', 'comer', 'vivir']);
  await recommendedSize.selectOption('10');
  await expect(preview).toHaveCount(10);
  await recommendedSize.selectOption('15');
  await expect(preview).toHaveCount(15);
  const previewedWords = await preview.allTextContents();
  await recommendedSize.selectOption('5');
  await expect(preview).toHaveText(previewedWords.slice(0, 5));
  await recommendedSize.selectOption('15');
  await page.getByRole('button', { name: 'Start med anbefalte ord' }).click();
  await expect(page.locator('#vocabStudy')).toBeVisible();
  const recommended = await page.evaluate(() => [...new Set(sessionCards.map(item => item.card.id))]);
  expect(recommended).toHaveLength(15);
  expect(recommended).not.toContain(known.hello);
  expect(await page.evaluate(() => [...new Set(sessionCards.map(item => item.card.es))].sort())).toEqual(previewedWords.sort());

  page.on('dialog', dialog => dialog.accept());
  await page.locator('#navHome').click();
  await page.getByText('Velg tema eller gloseliste', { exact: true }).click();
  await page.getByLabel('Tema eller gloseliste', { exact: true }).selectOption({ label: 'Familie' });
  await page.getByRole('button', { name: 'Start nye ord' }).click();
  await expect(page.locator('#vocabStudy')).toBeVisible();
  expect(await page.evaluate(() => sessionCards.every(item => item.card.category === 'familie' && !item.card.isCustom))).toBe(true);

  await page.locator('#navHome').click();
  await page.evaluate(() => {
    cards.filter(card => card.category === 'familie').forEach(card => {
      card.noEs.repetitions = card.esNo.repetitions = 2;
    });
    renderHomePage();
  });
  await page.getByText('Velg tema eller gloseliste', { exact: true }).click();
  await page.getByLabel('Tema eller gloseliste', { exact: true }).selectOption({ label: 'Familie' });
  await expect(page.getByRole('button', { name: 'Start nye ord' })).toBeDisabled();
  await page.getByLabel('Tema eller gloseliste', { exact: true }).selectOption({ label: 'Prøve uke 47' });
  await page.getByRole('button', { name: 'Øv på gloselista' }).click();
  await expect(page.locator('#vocabStudy')).toBeVisible();
  expect(await page.evaluate(() => [...new Set(sessionCards.map(item => item.card.id))].sort())).toEqual(known.list);
});

test('home recommends recently successful themes and includes new words from other themes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openHome(page);
  const practiced = await page.evaluate(() => {
    const earlier = new Date();
    earlier.setDate(earlier.getDate() - 30);
    let progress = loadLearningProgress();
    const practiced = [];
    for (const [canonicalId, daysOld, resultKind] of [
      ['vocab-0485', false, 'correct'],
      ['vocab-0502', false, 'correct'],
      ['vocab-0316', false, 'wrong'],
      ['vocab-0317', false, 'wrong'],
      ['vocab-0173', true, 'correct'],
      ['vocab-0174', true, 'correct']
    ]) {
      const card = cards.find(item => item.canonicalId === canonicalId);
      practiced.push(card.id);
      for (let i = 0; i < 3; i++) {
        progress = updateLearningProgress({
          progress, targetType: 'word', targetId: card.id, direction: 'noToEs', resultKind,
          nowIso: daysOld ? earlier.toISOString() : undefined
        });
      }
    }
    saveLearningProgress(progress);
    renderHomePage();
    return practiced;
  });
  const reason = page.locator('#homeRecommendedReason');
  await expect(reason).toContainText('Mat og drikke');
  await expect(reason).toContainText('andre temaer');
  await expect(reason).not.toContainText(/familie|skole/i);
  await page.getByRole('button', { name: 'Start med anbefalte ord' }).click();
  await expect(page.locator('#vocabStudy')).toBeVisible();
  const picked = await page.evaluate(() => [...new Map(sessionCards.map(({ card }) =>
    [card.id, { id: card.id, category: card.category }]
  )).values()]);
  expect(picked).toHaveLength(5);
  expect(picked.filter(card => normalizeTheme(card.category) === 'mat og drikke')).toHaveLength(3);
  expect(picked.every(card => !practiced.includes(card.id))).toBe(true);
});

function normalizeTheme(category) {
  return category.toLowerCase().replaceAll('-', ' ');
}

test('home keeps the usual starter order and goes beyond starter words as they are practised', async ({ page }) => {
  await openHome(page);
  await expect(page.locator('#homeRecommendedReason')).toContainText('Vanlige startord');
  await page.getByRole('button', { name: 'Start med anbefalte ord' }).click();
  await expect(page.locator('#vocabStudy')).toBeVisible();
  const first = await page.evaluate(() => [...new Set(sessionCards.map(({ card }) => card.es))].sort());
  expect(first).toEqual(['hola', 'gracias', 'buenos días', 'hablar', 'comer'].sort());

  page.on('dialog', dialog => dialog.accept());
  await page.locator('#navHome').click();
  await page.evaluate(() => {
    for (const card of cards.filter(card => ['hilsener', 'verb', 'bindeord', 'fremtid'].includes(card.category))) {
      card.reviews = 1;
    }
    cards.find(card => card.canonicalId === 'vocab-0307').reviews = 1;
    renderHomePage();
  });
  await expect(page.locator('#homeRecommendedReason')).toContainText('nye ord fra ordlista');
  await page.getByRole('button', { name: 'Start med anbefalte ord' }).click();
  await expect(page.locator('#vocabStudy')).toBeVisible();
  expect(await page.evaluate(() => new Set(sessionCards.map(({ card }) => card.category)).size)).toBeGreaterThan(1);
});

for (const width of [390, 1440]) {
  test(`home shows distinct due words and starts their review at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await openHome(page);
    const expected = await page.evaluate(() => {
      const due = { easeFactor: 2.5, interval: 1, repetitions: 1, nextReview: '2020-01-01T00:00:00Z', lapses: 0 };
      cards[0].noEs = { ...due };
      cards[0].esNo = { ...due };
      cards[1].esNo = { ...due };
      cards[2].noEs = { ...due, nextReview: '2999-01-01T00:00:00Z' };
      selectedCategories.clear();
      document.getElementById('reviewCardsLimit').value = '0';
      saveData();
      renderHomePage();
      return [`${cards[0].id}:no-es`, `${cards[0].id}:es-no`, `${cards[1].id}:es-no`].sort();
    });
    await expect(page.locator('#homeVocabularyReviewCount')).toHaveText('2 ord klare for repetisjon');
    await expect(page.getByLabel('Antall ord til repetisjon', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Start repetisjon', exact: true })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`home-review-${width}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Start repetisjon', exact: true }).click();
    await expect(page.locator('#vocabStudy')).toBeVisible();
    expect(await page.evaluate(() => ({
      mode: currentVocabMode,
      queue: sessionCards.map(item => `${item.card.id}:${item.direction}`).sort(),
      configuredLimit: document.getElementById('reviewCardsLimit').value
    }))).toEqual({ mode: 'review', queue: expected, configuredLimit: '0' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('a fresh pupil has an empty review queue and no teacher introduction on either entry page', async ({ page }) => {
  await page.goto(appUrl);
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await expect(page.getByText('For læreren: første 20 minutter', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start felles artikkeløving', exact: true })).toHaveCount(0);
  await page.locator('#studentNameInput').fill('Ny elev');
  await page.locator('.login-btn-primary').click();
  await expect(page.locator('#homeVocabularyReviewCount')).toHaveText('0 ord klare for repetisjon');
  await expect(page.getByRole('button', { name: 'Start repetisjon', exact: true })).toBeDisabled();
  await expect(page.locator('#homeStartMixedQuizBtn')).toHaveText('Start dagens quiz');
  await expect(page.getByText('For læreren: første 20 minutter', { exact: true })).toHaveCount(0);
});

test('home offers only available review sizes and counts both directions as one word', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openHome(page);
  await page.evaluate(() => {
    cards.slice(0, 29).forEach(card => {
      card.noEs = { ...card.noEs, repetitions: 1, nextReview: '2020-01-01T00:00:00Z' };
    });
    renderHomePage();
  });
  const reviewSize = page.getByLabel('Antall ord til repetisjon', { exact: true });
  await expect(reviewSize.locator('option')).toHaveText(['10 ord', '20 ord']);
  await expect(reviewSize).toHaveValue('10');

  await page.evaluate(() => {
    cards.slice(0, 60).forEach(card => {
      card.noEs = { ...card.noEs, repetitions: 1, nextReview: '2020-01-01T00:00:00Z' };
      card.esNo = { ...card.noEs };
    });
    renderHomePage();
  });
  await expect(page.locator('#homeVocabularyReviewCount')).toHaveText('60 ord klare for repetisjon');
  await expect(page.locator('#homeVocabularyReview')).not.toContainText('Økten starter med opptil 50 oppgaver');
  await expect(reviewSize.locator('option')).toHaveText(['10 ord', '20 ord', '30 ord', '40 ord', '50 ord']);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await reviewSize.selectOption('30');
  await page.getByRole('button', { name: 'Start repetisjon', exact: true }).click();
  expect(await page.evaluate(() => ({
    words: new Set(sessionCards.map(item => item.card.id)).size,
    questions: sessionCards.length
  }))).toEqual({ words: 30, questions: 60 });
});

test('returning home refreshes the count after a completed review', async ({ page }) => {
  await openHome(page);
  await page.evaluate(() => {
    cards[0].noEs = { ...cards[0].noEs, repetitions: 1, nextReview: '2020-01-01T00:00:00Z' };
    renderHomePage();
  });
  await expect(page.locator('#homeVocabularyReviewCount')).toHaveText('1 ord klart for repetisjon');
  await page.getByRole('button', { name: 'Start repetisjon', exact: true }).click();
  await page.evaluate(() => rateCard(2));
  await page.locator('#navHome').click();
  await expect(page.locator('#homeVocabularyReviewCount')).toHaveText('0 ord klare for repetisjon');
  await expect(page.getByRole('button', { name: 'Start repetisjon', exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.locator('#homeVocabularyReviewCount')).toHaveText('0 ord klare for repetisjon');
});
