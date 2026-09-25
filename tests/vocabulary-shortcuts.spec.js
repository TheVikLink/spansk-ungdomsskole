import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

async function startReview(page) {
  await page.goto(appUrl);
  await page.locator('#studentNameInput').fill('Demo');
  await page.locator('.login-btn-primary').click();
  await page.evaluate(() => {
    cards.slice(0, 3).forEach(card => {
      card.noEs = { ...card.noEs, repetitions: 1, strength: 1, interval: 1, nextReview: '2020-01-01T00:00:00Z' };
    });
    renderHomePage();
  });
  await page.getByRole('button', { name: 'Start repetisjon', exact: true }).click();
  await expect(page.locator('#vocabStudy')).toBeVisible();
  await page.evaluate(() => {
    // Review normally mixes shuffled flip and typed cards. These tests exercise
    // flip-card shortcuts; typed-input protection is covered separately below.
    sessionCards.forEach(item => {
      item.responseMode = 'flip';
      item.typed = false;
    });
    showVocabCard();
  });
  await expect(page.locator('#flashcardArea .flashcard[role="button"]')).toBeVisible();
  await page.evaluate(() => document.activeElement.blur());
}

for (const width of [390, 1440]) {
  for (const key of ['Space', '1', '2']) {
    test(`${key} rates a revealed review card once at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await startReview(page);
      const cardId = await page.evaluate(() => currentCard.card.id);
      await page.keyboard.press('1');
      expect(await page.evaluate(() => sessionStats.reviewed)).toBe(0);
      await expect(page.locator('.rating-good')).toHaveCount(0);

      await page.keyboard.press('Space');
      await expect(page.locator('.rating-good .key')).toHaveText('(1 / mellomrom)');
      await expect(page.locator('.rating-again .key')).toHaveText('(2)');
      expect(await page.evaluate(() => sessionStats.reviewed)).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

      await page.keyboard.press(key);
      const correct = key === '2' ? 0 : 1;
      expect(await page.evaluate(id => {
        const card = cards.find(card => card.id === id);
        const saved = JSON.parse(localStorage.getItem('spansk123Data_v4')).find(card => card.id === id);
        return { reviewed: sessionStats.reviewed, correct: sessionStats.correct, index: currentIndex, showingAnswer,
          reviews: card.reviews, savedReviews: saved.reviews, savedCorrect: saved.correct };
      }, cardId)).toEqual({ reviewed: 1, correct, index: 1, showingAnswer: false, reviews: 1, savedReviews: 1, savedCorrect: correct });
    });
  }
}

test('holding Space cannot rate a just-revealed card or reveal the next card', async ({ page }) => {
  await startReview(page);
  await page.keyboard.down('Space');
  await page.keyboard.down('Space');
  expect(await page.evaluate(() => ({ showingAnswer, reviewed: sessionStats.reviewed }))).toEqual({ showingAnswer: true, reviewed: 0 });
  await page.keyboard.up('Space');
  await page.keyboard.down('Space');
  await page.keyboard.down('Space');
  await page.keyboard.up('Space');
  expect(await page.evaluate(() => ({ showingAnswer, reviewed: sessionStats.reviewed, correct: sessionStats.correct })))
    .toEqual({ showingAnswer: false, reviewed: 1, correct: 1 });
});

test('Space retains native button activation when Igjen has keyboard focus', async ({ page }) => {
  await startReview(page);
  await page.keyboard.press('Space');
  await page.locator('.rating-again').focus();
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => ({ reviewed: sessionStats.reviewed, correct: sessionStats.correct })))
    .toEqual({ reviewed: 1, correct: 0 });
});

test('review shortcuts leave typed answers and hidden vocabulary sessions alone', async ({ page }) => {
  await startReview(page);
  await page.evaluate(() => {
    sessionCards[currentIndex].responseMode = 'typed';
    sessionCards[currentIndex].typed = true;
    showVocabCard();
  });
  await page.keyboard.type('hola 1');
  await expect(page.locator('#typedVocabInput')).toHaveValue('hola 1');
  expect(await page.evaluate(() => sessionStats.reviewed)).toBe(0);
  await page.evaluate(() => {
    document.activeElement.blur();
    currentCard.responseMode = 'flip';
    currentCard.typed = false;
    document.getElementById('vocabPage').classList.add('hidden');
    showingAnswer = true;
  });
  await page.keyboard.press('1');
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => sessionStats.reviewed)).toBe(0);
});
