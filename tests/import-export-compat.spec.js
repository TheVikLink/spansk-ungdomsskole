import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('progress import/export compatibility', () => {
  test('builds the current full export format without changing its version', async ({ page }) => {
    await page.goto(appUrl);

    const exported = await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev 12';
      practiceHistory = [{ date: '2026-05-17', words: 8, correct: 7, sessions: 1 }];
      localStorage.setItem('spansk123Data_v4', JSON.stringify([{ id: 99, no: 'hei', es: 'hola' }]));
      localStorage.setItem('spansk123Grammar_v1', JSON.stringify({ progress: { articles: { total: 3, correct: 2 } } }));
      localStorage.setItem('spansk123_learningProgress_v1', JSON.stringify({
        schemaVersion: 1,
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-02T10:00:00.000Z',
        wordProgress: {
          'core.hola': {
            noToEs: { strength: 2 },
            esToNo: { strength: 3 }
          }
        },
        skillProgress: {
          'a0.articles.definite_singular': { strength: 4 }
        }
      }));
      localStorage.setItem('spansk123_diagnosis_v1', JSON.stringify({
        schemaVersion: 1,
        status: 'complete',
        startedAt: '2026-08-07T10:00:00.000Z',
        completedAt: '2026-08-07T10:12:00.000Z',
        questionIds: ['diag.vocab.greeting.hola.es_no'],
        answers: [],
        resultBand: 'A0+',
        recommendedSkillIds: ['a0.articles.definite_singular']
      }));

      return buildProgressExportData();
    });

    expect(exported.version).toBe('spansk123_export_v1');
    expect(exported.studentName).toBe('Elev 12');
    expect(exported.vocabData).toEqual([{ id: 99, no: 'hei', es: 'hola' }]);
    expect(exported.grammarData).toEqual({ progress: { articles: { total: 3, correct: 2 } } });
    expect(exported.practiceHistory).toEqual([{ date: '2026-05-17', words: 8, correct: 7, sessions: 1 }]);
    expect(exported.learningProgress).toMatchObject({
      schemaVersion: 1,
      wordProgress: {
        'core.hola': {
          noToEs: { strength: 2 },
          esToNo: { strength: 3 }
        }
      },
      skillProgress: {
        'a0.articles.definite_singular': { strength: 4 }
      }
    });
    expect(exported.diagnosis).toMatchObject({
      schemaVersion: 1,
      status: 'complete',
      resultBand: 'A0+',
      recommendedSkillIds: ['a0.articles.definite_singular']
    });
    expect(exported.exportDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('imports the current full export format', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      practiceHistory = [];

      return importProgressData({
        version: 'spansk123_export_v1',
        studentName: 'Elevkode 9A-14',
        vocabData: [{ id: 4, no: 'takk', es: 'gracias' }],
        grammarData: { progress: { gustar: { total: 5, correct: 4 } } },
        practiceHistory: [{ date: '2026-05-16', words: 12, correct: 10, sessions: 2 }],
        learningProgress: {
          schemaVersion: 1,
          createdAt: '2026-08-01T10:00:00.000Z',
          updatedAt: '2026-08-02T10:00:00.000Z',
          wordProgress: {},
          skillProgress: {
            'a1.verbs.regular_ar.present': { strength: 3, attempts: 2, correct: 1 }
          }
        },
        diagnosis: {
          schemaVersion: 1,
          status: 'complete',
          startedAt: '2026-08-07T10:00:00.000Z',
          completedAt: '2026-08-07T10:12:00.000Z',
          questionIds: ['diag.vocab.greeting.hola.es_no'],
          answers: [],
          resultBand: 'A0+',
          recommendedSkillIds: ['a0.articles.definite_singular']
        }
      });
    });

    expect(result).toEqual({
      imported: true,
      format: 'spansk123_export_v1',
      message: 'Fremgang importert'
    });

    const stored = await page.evaluate(() => ({
      studentName: localStorage.getItem('spansk123_studentName'),
      vocabData: JSON.parse(localStorage.getItem('spansk123Data_v4')),
      grammarData: JSON.parse(localStorage.getItem('spansk123Grammar_v1')),
      practiceHistory: JSON.parse(localStorage.getItem('spansk123_practiceHistory')),
      learningProgress: JSON.parse(localStorage.getItem('spansk123_learningProgress_v1')),
      diagnosis: JSON.parse(localStorage.getItem('spansk123_diagnosis_v1'))
    }));

    expect(stored.studentName).toBe('Elevkode 9A-14');
    expect(stored.vocabData).toEqual([{ id: 4, no: 'takk', es: 'gracias' }]);
    expect(stored.grammarData).toEqual({ progress: { gustar: { total: 5, correct: 4 } } });
    expect(stored.practiceHistory).toEqual([{ date: '2026-05-16', words: 12, correct: 10, sessions: 2 }]);
    expect(stored.learningProgress.skillProgress['a1.verbs.regular_ar.present']).toMatchObject({
      strength: 3,
      attempts: 2,
      correct: 1,
      lapses: 0
    });
    expect(stored.diagnosis).toMatchObject({
      schemaVersion: 1,
      status: 'complete',
      resultBand: 'A0+',
      recommendedSkillIds: ['a0.articles.definite_singular']
    });
  });

  test('imports the legacy spansk123_v4 vocabulary export', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      return importProgressData({
        version: 'spansk123_v4',
        cards: [{ id: 7, no: 'ja', es: 'sí', noEs: { repetitions: 2 } }]
      });
    });

    expect(result).toEqual({
      imported: true,
      format: 'spansk123_v4',
      message: 'Glosefremgang importert'
    });

    const storedCards = await page.evaluate(() => JSON.parse(localStorage.getItem('spansk123Data_v4')));
    expect(storedCards).toEqual([{ id: 7, no: 'ja', es: 'sí', noEs: { repetitions: 2 } }]);
  });

  test('imports old Spansk Gloselæring exports and converts weekly history', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      practiceHistory = [];

      return importProgressData({
        appVersion: 'spansk_v1',
        cards: [
          {
            norwegian: 'å snakke',
            spanish: 'hablar',
            level: 3,
            interval: 7,
            nextReview: '2026-05-20T00:00:00.000Z',
            reviews: 6,
            correct: 5
          }
        ],
        weeklyLog: [
          { date: '2026-05-15T12:00:00.000Z', cardsReviewed: 10, correct: 8 }
        ]
      });
    });

    expect(result.imported).toBe(true);
    expect(result.format).toBe('spansk_v1');
    expect(result.convertedCards).toBe(1);

    const stored = await page.evaluate(() => ({
      cards: JSON.parse(localStorage.getItem('spansk123Data_v4')),
      history: JSON.parse(localStorage.getItem('spansk123_practiceHistory'))
    }));

    expect(stored.cards).toHaveLength(1);
    expect(stored.cards[0]).toMatchObject({
      no: 'å snakke',
      es: 'hablar',
      category: 'verb',
      noEs: { repetitions: 3, interval: 7, reviews: 6, correct: 5 },
      esNo: { repetitions: 2, interval: 7, reviews: 3, correct: 2 }
    });
    expect(stored.history).toEqual([{ date: '2026-05-15', words: 10, correct: 8, sessions: 1 }]);
  });

  test('imports raw old-app card arrays', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      return importProgressData([
        { norwegian: 'å spise', spanish: 'comer', level: 2, reviews: 4, correct: 3 }
      ]);
    });

    expect(result).toMatchObject({
      imported: true,
      format: 'old_raw_array',
      convertedCards: 1
    });

    const storedCards = await page.evaluate(() => JSON.parse(localStorage.getItem('spansk123Data_v4')));
    expect(storedCards).toHaveLength(1);
    expect(storedCards[0]).toMatchObject({
      no: 'å spise',
      es: 'comer',
      category: 'verb',
      noEs: { repetitions: 2, reviews: 4, correct: 3 }
    });
  });

  test('imports direct old localStorage dumps', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      return importProgressData({
        spanskSRData: JSON.stringify([
          { norwegian: 'å drikke', spanish: 'beber', level: 1, reviews: 2, correct: 1 }
        ])
      });
    });

    expect(result).toMatchObject({
      imported: true,
      format: 'old_localstorage_dump',
      convertedCards: 1
    });

    const storedCards = await page.evaluate(() => JSON.parse(localStorage.getItem('spansk123Data_v4')));
    expect(storedCards).toHaveLength(1);
    expect(storedCards[0]).toMatchObject({
      no: 'å drikke',
      es: 'beber',
      category: 'verb',
      noEs: { repetitions: 1, reviews: 2, correct: 1 }
    });
  });

  test('reports malformed JSON and unknown valid JSON without importing', async ({ page }) => {
    await page.goto(appUrl);

    const results = await page.evaluate(() => {
      localStorage.clear();
      return {
        malformed: importProgressText('{ dette er ikke json'),
        unknown: importProgressText(JSON.stringify({ version: 'noe_ukjent', cards: [] })),
        storedCards: localStorage.getItem('spansk123Data_v4')
      };
    });

    expect(results.malformed).toMatchObject({
      imported: false,
      format: 'parse_error'
    });
    expect(results.malformed.message).toContain('Kunne ikke lese filen');
    expect(results.unknown).toEqual({
      imported: false,
      format: 'unknown',
      message: 'Ukjent filformat'
    });
    expect(results.storedCards).toBeNull();
  });

  test('rejects null progress payloads without throwing', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      return importProgressData(null);
    });

    expect(result).toEqual({
      imported: false,
      format: 'unknown',
      message: 'Ukjent filformat'
    });
  });

  test('does not write malformed non-array vocabData into local storage', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('spansk123Data_v4', JSON.stringify([{ id: 7, no: 'bevart', es: 'preserved' }]));

      const importResult = importProgressData({
        version: 'spansk123_export_v1',
        vocabData: 'not-an-array'
      });

      return {
        importResult,
        storedCards: JSON.parse(localStorage.getItem('spansk123Data_v4'))
      };
    });

    expect(result.importResult).toEqual({
      imported: true,
      format: 'spansk123_export_v1',
      message: 'Fremgang importert'
    });
    expect(result.storedCards).toEqual([{ id: 7, no: 'bevart', es: 'preserved' }]);
  });
});
