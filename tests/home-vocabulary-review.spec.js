import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

async function openHome(page) {
  await page.goto(appUrl);
  await page.locator('#studentNameInput').fill('Demo');
  await page.locator('.login-btn-primary').click();
}

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
  await expect(page.locator('#homeStartMixedQuizBtn')).toHaveText('Start nivåtest');
  await expect(page.getByText('For læreren: første 20 minutter', { exact: true })).toHaveCount(0);
});

test('home shows the whole backlog while each review session is bounded', async ({ page }) => {
  await openHome(page);
  await page.evaluate(() => {
    cards.slice(0, 60).forEach(card => {
      card.noEs = { ...card.noEs, repetitions: 1, nextReview: '2020-01-01T00:00:00Z' };
    });
    renderHomePage();
  });
  await expect(page.locator('#homeVocabularyReviewCount')).toHaveText('60 ord klare for repetisjon');
  await expect(page.locator('#homeVocabularyReview')).toContainText('Økten starter med opptil 50 oppgaver.');
  await page.getByRole('button', { name: 'Start repetisjon', exact: true }).click();
  expect(await page.evaluate(() => sessionCards.length)).toBe(50);
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
