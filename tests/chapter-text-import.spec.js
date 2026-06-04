import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('chapter text import prototype', () => {
  test('parses pasted OCR text and splits slash alternatives into separate cards', async ({ page }) => {
    await page.goto(appUrl);

    const rows = await page.evaluate(() => parseChapterVocabularyText(`
å forstå    entender / comprender
å begynne - empezar
alltid      siempre
    `, 'Kapittel 9'));

    expect(rows).toEqual([
      { norsk: 'å forstå', spansk: 'entender', category: 'Kapittel 9' },
      { norsk: 'å forstå', spansk: 'comprender', category: 'Kapittel 9' },
      { norsk: 'å begynne', spansk: 'empezar', category: 'Kapittel 9' },
      { norsk: 'alltid', spansk: 'siempre', category: 'Kapittel 9' }
    ]);
  });

  test('allows existing words in a new chapter category but rejects same-category duplicates', async ({ page }) => {
    await page.goto(appUrl);

    const summary = await page.evaluate(() => {
      cards = [
        {
          id: 1,
          no: 'å forstå',
          es: 'entender',
          norsk: 'å forstå',
          spansk: 'entender',
          category: 'verb',
          noEs: { repetitions: 2 },
          esNo: { repetitions: 1 }
        },
        {
          id: 2,
          no: 'å forstå',
          es: 'entender',
          norsk: 'å forstå',
          spansk: 'entender',
          category: 'kapittel-9',
          noEs: { repetitions: 0 },
          esNo: { repetitions: 0 }
        }
      ];

      return analyzeTeacherWordImport([
        ['å forstå', 'entender', 'Kapittel 9'],
        ['å forstå', 'comprender', 'Kapittel 9']
      ]);
    });

    expect(summary.valid).toEqual([
      { norsk: 'å forstå', spansk: 'comprender', category: 'Kapittel 9' }
    ]);
    expect(summary.problems).toEqual([
      { row: 1, reason: 'Finnes allerede i samme kategori: å forstå - entender' }
    ]);
  });

  test('syncs review progress across duplicate cards in different categories', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      cards = [
        normalizeCard({
          id: 1,
          no: 'å forstå',
          es: 'entender',
          category: 'verb',
          noEs: { repetitions: 2, nextReview: yesterday.toISOString(), interval: 1, easeFactor: 2.5 },
          esNo: { repetitions: 0 }
        }, 0),
        normalizeCard({
          id: 2,
          no: 'å forstå',
          es: 'entender',
          category: 'kapittel-9',
          noEs: { repetitions: 0, nextReview: null, interval: 0, easeFactor: 2.5 },
          esNo: { repetitions: 0 }
        }, 1)
      ];
      currentCard = { card: cards[0], direction: 'no-es' };
      sessionCards = [currentCard];
      currentIndex = 0;
      sessionStats = { reviewed: 0, correct: 0, newLearned: 0 };
      isCustomStudySession = false;

      rateCard(2);

      return cards.map(card => ({
        id: card.id,
        category: card.category,
        repetitions: card.noEs.repetitions,
        interval: card.noEs.interval,
        nextReview: card.noEs.nextReview
      }));
    });

    expect(result[0].repetitions).toBeGreaterThan(2);
    expect(result[1]).toMatchObject({
      id: 2,
      category: 'kapittel-9',
      repetitions: result[0].repetitions,
      interval: result[0].interval,
      nextReview: result[0].nextReview
    });
  });
});
