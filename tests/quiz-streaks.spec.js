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
