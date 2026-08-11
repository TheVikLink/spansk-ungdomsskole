import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('local quiz streaks', () => {
  test('normalizes empty stats and records the first quiz day once', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      const empty = normalizeQuizStats(null);
      const first = completeQuizStatsForDate(empty, '2026-08-10');
      const second = completeQuizStatsForDate(first, '2026-08-10');
      return { empty, first, second };
    });

    expect(result.empty).toMatchObject({
      schemaVersion: 1,
      currentStreak: 0,
      longestStreak: 0,
      fiveQuizDays: 0,
      completedDates: [],
      dailyQuizCounts: {}
    });
    expect(result.first).toMatchObject({
      currentStreak: 1,
      longestStreak: 1,
      fiveQuizDays: 0,
      completedDates: ['2026-08-10'],
      dailyQuizCounts: { '2026-08-10': 1 }
    });
    expect(result.second).toMatchObject({
      currentStreak: 1,
      longestStreak: 1,
      completedDates: ['2026-08-10'],
      dailyQuizCounts: { '2026-08-10': 2 }
    });
  });

  test('counts five quizzes on a day once and recomputes streaks across gaps', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      let stats = normalizeQuizStats(null);
      for (let count = 0; count < 5; count++) stats = completeQuizStatsForDate(stats, '2026-08-10');
      const afterSix = completeQuizStatsForDate(stats, '2026-08-10');
      const withNextDay = completeQuizStatsForDate(afterSix, '2026-08-11');
      const withGap = completeQuizStatsForDate(withNextDay, '2026-08-13');
      return { stats, afterSix, withNextDay, withGap };
    });

    expect(result.stats).toMatchObject({
      currentStreak: 1,
      longestStreak: 1,
      fiveQuizDays: 1,
      dailyQuizCounts: { '2026-08-10': 5 }
    });
    expect(result.afterSix.fiveQuizDays).toBe(1);
    expect(result.afterSix.dailyQuizCounts['2026-08-10']).toBe(6);
    expect(result.withNextDay).toMatchObject({ currentStreak: 2, longestStreak: 2 });
    expect(result.withGap).toMatchObject({ currentStreak: 1, longestStreak: 2 });
  });

  test('merges imported stats by date without double-counting same-day quizzes', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => mergeQuizStats(
      {
        schemaVersion: 1,
        longestStreak: 4,
        dailyQuizCounts: { '2026-08-10': 3, '2026-08-11': 1 }
      },
      {
        schemaVersion: 1,
        longestStreak: 2,
        dailyQuizCounts: { '2026-08-10': 5, '2026-08-12': 2 }
      }
    ));

    expect(result.dailyQuizCounts).toEqual({
      '2026-08-10': 5,
      '2026-08-11': 1,
      '2026-08-12': 2
    });
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(4);
  });

  test('records a completed mixed quiz and shows the streak result', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      mixedQuizState = {
        index: 10,
        answered: 10,
        correct: 8,
        startedAt: new Date().toISOString(),
        quiz: { items: Array.from({ length: 10 }, (_, index) => ({ questionId: `q${index}` })) }
      };
      finishMixedQuiz();
      return {
        stats: JSON.parse(localStorage.getItem('spansk123_quizStats_v1')),
        summary: document.getElementById('mixedQuizStreakSummary')?.textContent
      };
    });

    expect(result.stats.dailyQuizCounts).toEqual({ [new Date().toISOString().slice(0, 10)]: 1 });
    expect(result.stats.currentStreak).toBe(1);
    expect(result.summary).toContain('1 dag på rad');
  });

  test('shows a complete review and keeps the repeat-quiz action available', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      mixedQuizState = {
        index: 10,
        answered: 10,
        correct: 7,
        startedAt: new Date().toISOString(),
        results: Array.from({ length: 10 }, (_, index) => ({
          questionId: `q${index}`,
          prompt: `spørsmål ${index + 1}`,
          answer: index < 7 ? 'riktig' : 'feil',
          resultKind: index < 7 ? 'correct' : 'wrong',
          correct: index < 7,
          correctAnswers: ['fasit'],
          explanation: 'Kort forklaring.'
        })),
        quiz: { items: Array.from({ length: 10 }, (_, index) => ({ questionId: `q${index}` })) }
      };
      finishMixedQuiz();
      return {
        rows: document.querySelectorAll('.mixed-quiz-review-item').length,
        topActions: Boolean(document.querySelector('.mixed-quiz-result-actions-top')),
        repeatButton: document.querySelector('.mixed-quiz-result-actions-top button')?.textContent,
        explanation: document.querySelector('.mixed-quiz-review-item p:last-child')?.textContent,
        summary: document.getElementById('mixedQuizStreakSummary')?.textContent
      };
    });

    expect(result.rows).toBe(10);
    expect(result.topActions).toBe(true);
    expect(result.repeatButton).toContain('Ta en ny quiz');
    expect(result.explanation).toContain('Kort forklaring');
    expect(result.summary).toContain('1/5');
  });

  test('opens incorrect review rows and keeps correct rows collapsed', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      mixedQuizState = {
        index: 2,
        answered: 2,
        correct: 1,
        startedAt: new Date().toISOString(),
        results: [
          { questionId: 'q1', prompt: 'riktig', answer: 'ja', resultKind: 'correct', correct: true, correctAnswers: ['ja'], explanation: 'Forklaring 1' },
          { questionId: 'q2', prompt: 'feil', answer: 'nei', resultKind: 'wrong', correct: false, correctAnswers: ['ja'], explanation: 'Forklaring 2' }
        ],
        quiz: { items: [{ questionId: 'q1' }, { questionId: 'q2' }] }
      };
      finishMixedQuiz();
      return [...document.querySelectorAll('.mixed-quiz-review-item')].map(row => ({
        open: row.open,
        status: row.querySelector('summary')?.textContent || ''
      }));
    });

    expect(result).toEqual([
      { open: false, status: expect.stringContaining('Riktig') },
      { open: true, status: expect.stringContaining('Feil') }
    ]);
  });

  test('awards a skill badge once when mastery threshold is reached', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      const progress = {
        schemaVersion: 1,
        skillProgress: {
          'a1.verbs.regular_ar.present': { strength: 4, attempts: 3, correct: 3, lapses: 0 }
        },
        wordProgress: {}
      };
      const first = awardMasteryBadges(progress);
      const second = awardMasteryBadges(progress);
      return {
        first: first.newlyEarned.map(badge => badge.id),
        second: second.newlyEarned.map(badge => badge.id),
        stored: JSON.parse(localStorage.getItem('spansk123_masteryBadges_v1'))
      };
    });

    expect(result.first).toEqual(['mastery:a1.verbs.regular_ar.present']);
    expect(result.second).toEqual([]);
    expect(result.stored.badges).toEqual(['mastery:a1.verbs.regular_ar.present']);
  });

  test('includes quiz stats in full export and merges them on import', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('spansk123_quizStats_v1', JSON.stringify({
        schemaVersion: 1,
        dailyQuizCounts: { '2026-08-10': 5 }
      }));
      const exported = buildProgressExportData();
      localStorage.setItem('spansk123_quizStats_v1', JSON.stringify({
        schemaVersion: 1,
        dailyQuizCounts: { '2026-08-10': 2, '2026-08-11': 1 }
      }));
      importProgressData(exported);
      return JSON.parse(localStorage.getItem('spansk123_quizStats_v1'));
    });

    expect(result.dailyQuizCounts).toEqual({ '2026-08-10': 5, '2026-08-11': 1 });
  });
});
