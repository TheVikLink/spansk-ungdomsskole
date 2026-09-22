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
      schemaVersion: 2,
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
      diagnosis: JSON.parse(localStorage.getItem('spansk123_diagnosis_v2'))
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
      schemaVersion: 2,
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

  test('migrates sparse vocabulary IDs without redirecting an appended card rating', async ({ page }) => {
    await page.goto(appUrl);

    const imported = await page.evaluate(() => {
      localStorage.clear();
      practiceHistory = [];
      return importProgressData({
        version: 'spansk123_export_v1',
        studentName: 'Migreringstest',
        vocabData: [{
          id: 1,
          no: 'egen testglose',
          es: 'palabra propia',
          category: 'egne gloser',
          noEs: { repetitions: 4, interval: 7, easeFactor: 2.5, nextReview: null },
          esNo: { repetitions: 3, interval: 4, easeFactor: 2.5, nextReview: null },
          reviews: 7,
          correct: 6
        }]
      });
    });

    expect(imported.imported).toBe(true);
    await page.reload();

    const result = await page.evaluate(() => {
      const preserved = cards.find(card => card.no === 'egen testglose' && card.es === 'palabra propia');
      const appended = cards.find(card => card.no === '1' && card.es === 'uno');
      const before = {
        preservedReviews: preserved?.reviews,
        appendedReviews: appended?.reviews
      };

      currentCard = { card: appended, direction: 'no-es', responseMode: 'flip' };
      sessionCards = [currentCard];
      currentIndex = 0;
      currentCardRated = false;
      sessionStats = { reviewed: 0, correct: 0, newLearned: 0 };
      sessionStartTime = new Date();
      isCustomStudySession = false;
      practiceSessions.vocabulary = { sessionId: 'sparse-id-migration', finalized: false };
      rateCard(2, false);

      const exported = buildProgressExportData();
      const exportedPreserved = exported.vocabData.find(card => card.no === 'egen testglose' && card.es === 'palabra propia');
      const exportedAppended = exported.vocabData.find(card => card.no === '1' && card.es === 'uno');
      return {
        idsAreUnique: new Set(cards.map(card => card.id)).size === cards.length,
        preserved: { id: preserved?.id, reviews: preserved?.reviews, correct: preserved?.correct },
        appended: { id: appended?.id, reviews: appended?.reviews, correct: appended?.correct },
        before,
        exported: {
          preserved: { id: exportedPreserved?.id, reviews: exportedPreserved?.reviews, correct: exportedPreserved?.correct },
          appended: { id: exportedAppended?.id, reviews: exportedAppended?.reviews, correct: exportedAppended?.correct }
        }
      };
    });

    expect(result).toEqual({
      idsAreUnique: true,
      preserved: { id: 1, reviews: 7, correct: 6 },
      appended: { id: expect.any(Number), reviews: 1, correct: 1 },
      before: { preservedReviews: 7, appendedReviews: 0 },
      exported: {
        preserved: { id: 1, reviews: 7, correct: 6 },
        appended: { id: expect.any(Number), reviews: 1, correct: 1 }
      }
    });
    expect(result.appended.id).not.toBe(1);
    expect(result.exported.appended.id).toBe(result.appended.id);
  });

  test('rejects executable values in imported practice history before rendering it', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      window.__importHistoryXss = false;
      importProgressData({
        version: 'spansk123_export_v1',
        practiceHistory: [{
          date: '2026-09-14',
          words: '<img src="missing.png" onerror="window.__importHistoryXss=true">',
          correct: 0,
          sessions: 1,
          activity: 'grammar'
        }]
      });
      showMainApp();
      showPage('homework');
    });

    await page.waitForTimeout(250);
    const rendered = await page.evaluate(() => ({
      executed: window.__importHistoryXss,
      images: document.querySelectorAll('#practiceHistory img').length,
      stored: JSON.parse(localStorage.getItem('spansk123_practiceHistory') || '[]')
    }));

    expect(rendered).toEqual({ executed: false, images: 0, stored: [] });
  });

  test('reconciles corrected canonical vocabulary while preserving legacy progress idempotently', async ({ page }) => {
    await page.goto(appUrl);
    const result = await page.evaluate(() => {
      localStorage.clear();
      cards = [
        { id: 7, no: 'smykke', es: 'la cadena', norsk: 'smykke', spansk: 'la cadena', category: 'klær', noEs: { repetitions: 4 }, esNo: { repetitions: 3 }, reviews: 7, correct: 6 },
        { id: 8, no: 'I morgen skal jeg besøke bestemora mi', es: 'Mañana voy a visitar mi abuela', norsk: 'I morgen skal jeg besøke bestemora mi', spansk: 'Mañana voy a visitar mi abuela', category: 'fremtid', noEs: { repetitions: 2 }, esNo: { repetitions: 5 }, reviews: 5, correct: 4 },
        { id: 900, no: 'egen glose', es: 'palabra propia', norsk: 'egen glose', spansk: 'palabra propia', category: 'egne', noEs: { repetitions: 1 }, esNo: { repetitions: 0 }, reviews: 1, correct: 1 }
      ];
      mergeNewVocabulary();
      const first = cards.map(card => ({ no: card.no, es: card.es, id: card.id, noEs: card.noEs.repetitions, esNo: card.esNo.repetitions, reviews: card.reviews, correct: card.correct }));
      mergeNewVocabulary();
      const second = cards.map(card => ({ no: card.no, es: card.es, id: card.id, noEs: card.noEs.repetitions, esNo: card.esNo.repetitions, reviews: card.reviews, correct: card.correct }));
      return { first, second };
    });

    expect(result.first).toEqual(result.second);
    expect(result.first.filter(card => card.es === 'la cadena').map(card => card.no)).toEqual(['kjede']);
    expect(result.first.filter(card => card.no === 'I morgen skal jeg besøke bestemora mi').map(card => card.es)).toEqual(['Mañana voy a visitar a mi abuela']);
    expect(result.first.find(card => card.no === 'kjede')).toMatchObject({ id: 7, noEs: 4, esNo: 3, reviews: 7, correct: 6 });
    expect(result.first.find(card => card.es === 'Mañana voy a visitar a mi abuela')).toMatchObject({ id: 8, noEs: 2, esNo: 5, reviews: 5, correct: 4 });
    expect(result.first).toEqual(expect.arrayContaining([expect.objectContaining({ id: 900, no: 'egen glose', es: 'palabra propia' })]));
  });
});
