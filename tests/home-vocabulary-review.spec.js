import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

async function openHome(page) {
  await page.goto(appUrl);
  await page.locator('#studentNameInput').fill('Demo');
  await page.locator('.login-btn-primary').click();
}

function feedCard(page, title) {
  return page.locator('#homeLearningFeed article').filter({
    has: page.getByRole('heading', { name: title, exact: true })
  }).first();
}

async function findNewWordsCard(page) {
  const card = feedCard(page, /^Lær \d+ nye ord$/);
  for (let batch = 0; batch < 4 && await card.count() === 0; batch++) {
    await page.getByRole('button', { name: 'Vis flere' }).click();
  }
  await expect(card).toBeVisible();
  return card;
}

test('mobile home shows daily XP for the current week and keeps Brainmap in the main menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.clock.setFixedTime(new Date(2026, 10, 24, 12));
  await openHome(page);
  await page.evaluate(() => {
    const monday = { date: '2026-11-23', words: 5, correct: 3, activity: 'grammar', sessionId: 'monday', xp: 4 };
    practiceHistory = [
      monday,
      { ...monday },
      { date: '2026-11-24', words: 3, correct: 2, activity: 'vocabulary', sessionId: 'tuesday', xp: 2 },
      { date: '2026-11-22', words: 20, correct: 15, activity: 'mixed-quiz', sessionId: 'previous-week', xp: 8 },
      { date: '2026-11-24', words: 8, correct: 7, activity: 'grammar' }
    ];
    savePracticeHistory();
  });
  await page.reload();

  const week = page.locator('#homeWeekActivity');
  await expect(week.getByRole('heading', { name: 'Din fremgang denne uka' })).toBeVisible();
  await expect(week.locator('#homeFeedWeeklyXp')).toContainText('6 XP');
  const days = week.locator('[data-home-day]');
  await expect(days).toHaveCount(7);
  await expect(days.locator('strong')).toHaveText(['4 XP', '2 XP', '0 XP', '0 XP', '0 XP', '0 XP', '0 XP']);
  await expect(days.nth(1)).toHaveAttribute('aria-current', 'date');
  await expect(week).not.toContainText('besvarte oppgaver');
  await expect(page.locator('#homePage')).not.toContainText('Grammatikkart');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#navBrainmap').click();
  await expect(page.locator('#brainmapPage')).toBeVisible();
});

test('the feed starts new words while Gloser stays available for free choice', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHome(page);
  const known = await page.evaluate(() => {
    const hello = cards.find(card => getVocabularyCanonicalId(card) === 'vocab-0064');
    hello.noEs = { ...hello.noEs, repetitions: 3, interval: 7 };
    applyTeacherWordImport({ importableCount: 2, skippedCount: 0, valid: [
      { norsk: 'øve', spansk: 'practicar', category: 'prøve uke 47' },
      { norsk: 'huske', spansk: 'recordar', category: 'prøve uke 47' }
    ] });
    document.getElementById('newCardsLimit').value = '0';
    renderHomePage();
    return hello.id;
  });
  const card = await findNewWordsCard(page);
  const heading = await card.getByRole('heading').textContent();
  await card.getByRole('button', { name: 'Start økten' }).click();
  await expect(page.locator('#vocabStudy')).toBeVisible();
  const practice = await page.evaluate(() => ({
    ids: [...new Set(sessionCards.map(item => item.card.id))],
    themes: [...new Set(sessionCards.map(item => item.card.category))],
    includesCustomWords: sessionCards.some(item => item.card.isCustom)
  }));
  expect(heading).toBe(`Lær ${practice.ids.length} nye ord`);
  expect(practice.ids.length).toBeGreaterThan(0);
  expect(practice.ids).not.toContain(known);
  expect(practice.themes).toHaveLength(1);
  expect(practice.includesCustomWords).toBe(false);

  page.on('dialog', dialog => dialog.accept());
  await page.locator('#navHome').click();
  await page.locator('#navVocab').click();
  await expect(page.locator('#vocabSettings')).toBeVisible();
});

test('a new-word card follows a recently successful theme', async ({ page }) => {
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
  const card = await findNewWordsCard(page);
  await expect(card).toContainText('Mat og drikke');
  await card.getByRole('button', { name: 'Start økten' }).click();
  await expect(page.locator('#vocabStudy')).toBeVisible();
  const picked = await page.evaluate(() => [...new Map(sessionCards.map(({ card }) =>
    [card.id, { id: card.id, category: normalizeCategorySlug(card.category) }]
  )).values()]);
  expect(picked).toHaveLength(5);
  expect(picked.every(card => card.category === 'mat-og-drikke' && !practiced.includes(card.id))).toBe(true);
});

test('the feed prioritizes beginner words and offers other themes after they have been practised', async ({ page }) => {
  await openHome(page);
  const starter = await findNewWordsCard(page);
  await expect(starter).toContainText('Vanlige startord');
  await starter.getByRole('button', { name: 'Start økten' }).click();
  await expect(page.locator('#vocabStudy')).toBeVisible();
  const first = await page.evaluate(() => [...new Set(sessionCards.map(({ card }) => card.es))]);
  expect(first).toContain('hola');

  page.on('dialog', dialog => dialog.accept());
  await page.locator('#navHome').click();
  await page.evaluate(() => {
    for (const card of cards.filter(card => ['hilsener', 'verb', 'bindeord', 'fremtid'].includes(card.category))) {
      card.reviews = 1;
    }
    cards.find(card => card.canonicalId === 'vocab-0307').reviews = 1;
    renderHomePage();
  });
  const next = await findNewWordsCard(page);
  await expect(next).toContainText('nye ord fra ordlista');
  await next.getByRole('button', { name: 'Start økten' }).click();
  await expect(page.locator('#vocabStudy')).toBeVisible();
  expect(await page.evaluate(() => sessionCards.every(({ card }) =>
    !['hilsener', 'verb', 'bindeord', 'fremtid'].includes(card.category) && card.canonicalId !== 'vocab-0307'
  ))).toBe(true);
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
    const card = feedCard(page, 'Repeter 2 ord');
    await expect(card).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`home-review-${width}.png`), fullPage: true });
    await card.getByRole('button', { name: 'Start økten' }).click();
    await expect(page.locator('#vocabStudy')).toBeVisible();
    expect(await page.evaluate(() => ({
      mode: currentVocabMode,
      queue: sessionCards.map(item => `${item.card.id}:${item.direction}`).sort(),
      configuredLimit: document.getElementById('reviewCardsLimit').value
    }))).toEqual({ mode: 'review', queue: expected, configuredLimit: '0' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('a fresh pupil has no review card and no teacher introduction on either entry page', async ({ page }) => {
  await page.goto(appUrl);
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await expect(page.getByText('For læreren: første 20 minutter', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start felles artikkeløving', exact: true })).toHaveCount(0);
  await page.locator('#studentNameInput').fill('Ny elev');
  await page.locator('.login-btn-primary').click();
  await expect(feedCard(page, /^Repeter \d+ ord$/)).toHaveCount(0);
  await expect(page.locator('#homeStartMixedQuizBtn')).toHaveText('Start dagens quiz');
  await expect(page.getByText('For læreren: første 20 minutter', { exact: true })).toHaveCount(0);
});

test('each review card caps a large backlog at ten words with both due directions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openHome(page);
  await page.evaluate(() => {
    cards.slice(0, 60).forEach(card => {
      card.noEs = { ...card.noEs, repetitions: 1, nextReview: '2020-01-01T00:00:00Z' };
      card.esNo = { ...card.noEs };
    });
    renderHomePage();
  });
  const review = feedCard(page, 'Repeter 10 ord');
  await expect(review).toBeVisible();
  await review.getByRole('button', { name: 'Start økten' }).click();
  expect(await page.evaluate(() => ({
    words: new Set(sessionCards.map(item => item.card.id)).size,
    questions: sessionCards.length
  }))).toEqual({ words: 10, questions: 20 });
});

test('returning home refreshes the feed after a completed review', async ({ page }) => {
  await openHome(page);
  await page.evaluate(() => {
    cards[0].noEs = { ...cards[0].noEs, repetitions: 1, nextReview: '2020-01-01T00:00:00Z' };
    renderHomePage();
  });
  const review = feedCard(page, 'Repeter 1 ord');
  await expect(review).toBeVisible();
  await review.getByRole('button', { name: 'Start økten' }).click();
  await page.evaluate(() => rateCard(2));
  await page.locator('#navHome').click();
  await expect(review).toHaveCount(0);
  await page.reload();
  await expect(review).toHaveCount(0);
});
