import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('adaptive learning progress schema', () => {
  test('normalizes missing learning progress to empty schema v1', async ({ page }) => {
    await page.goto(appUrl);

    const progress = await page.evaluate(() => normalizeLearningProgress(null, '2026-08-07T10:00:00.000Z'));

    expect(progress).toEqual({
      schemaVersion: 1,
      createdAt: '2026-08-07T10:00:00.000Z',
      updatedAt: '2026-08-07T10:00:00.000Z',
      wordProgress: {},
      skillProgress: {}
    });
  });

  test('normalizes progress cells with defaults and clamps strength', async ({ page }) => {
    await page.goto(appUrl);

    const progress = await page.evaluate(() => normalizeLearningProgress({
      schemaVersion: 1,
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-02T09:00:00.000Z',
      wordProgress: {
        'core.hola': {
          noToEs: { strength: 8, attempts: 2, correct: 1, dueAt: 'not-a-date' },
          esToNo: { strength: -2, lapses: 1, lastSeenAt: '2026-08-02T09:00:00.000Z' }
        }
      },
      skillProgress: {
        'a0.articles.definite_singular': { strength: 3, attempts: 4, correct: 2 }
      }
    }, '2026-08-07T10:00:00.000Z'));

    expect(progress.wordProgress['core.hola']).toEqual({
      noToEs: {
        strength: 5,
        attempts: 2,
        correct: 1,
        lapses: 0,
        dueAt: null,
        lastSeenAt: null
      },
      esToNo: {
        strength: 0,
        attempts: 0,
        correct: 0,
        lapses: 1,
        dueAt: null,
        lastSeenAt: '2026-08-02T09:00:00.000Z'
      }
    });
    expect(progress.skillProgress['a0.articles.definite_singular']).toEqual({
      strength: 3,
      attempts: 4,
      correct: 2,
      lapses: 0,
      dueAt: null,
      lastSeenAt: null
    });
  });

  test('updates progress cells with deterministic strength transitions and due dates', async ({ page }) => {
    await page.goto(appUrl);

    const updates = await page.evaluate(() => ({
      newCorrect: updateProgressCell(
        { strength: 0, attempts: 0, correct: 0, lapses: 0, dueAt: null, lastSeenAt: null },
        'correct',
        '2026-08-07T10:00:00.000Z'
      ),
      stableWrong: updateProgressCell(
        { strength: 4, attempts: 3, correct: 3, lapses: 0, dueAt: null, lastSeenAt: '2026-08-01T10:00:00.000Z' },
        'wrong',
        '2026-08-07T10:00:00.000Z'
      ),
      strongNearMiss: updateProgressCell(
        { strength: 5, attempts: 10, correct: 9, lapses: 0, dueAt: null, lastSeenAt: null },
        'near_miss',
        '2026-08-07T10:00:00.000Z'
      )
    }));

    expect(updates.newCorrect).toEqual({
      strength: 2,
      attempts: 1,
      correct: 1,
      lapses: 0,
      dueAt: '2026-08-09T10:00:00.000Z',
      lastSeenAt: '2026-08-07T10:00:00.000Z'
    });
    expect(updates.stableWrong).toEqual({
      strength: 2,
      attempts: 4,
      correct: 3,
      lapses: 1,
      dueAt: '2026-08-07T10:00:00.000Z',
      lastSeenAt: '2026-08-07T10:00:00.000Z'
    });
    expect(updates.strongNearMiss).toEqual({
      strength: 4,
      attempts: 11,
      correct: 9,
      lapses: 0,
      dueAt: '2026-08-08T10:00:00.000Z',
      lastSeenAt: '2026-08-07T10:00:00.000Z'
    });
  });

  test('loads corrupt progress safely and blocks writes for newer unsupported schema', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('spansk123_learningProgress_v1', '{ skadet');
      const corrupt = loadLearningProgress('2026-08-07T10:00:00.000Z');
      const corruptBackup = Object.keys(localStorage).find(key => key.startsWith('spansk123_corrupt_spansk123_learningProgress_v1_'));

      localStorage.setItem('spansk123_learningProgress_v1', JSON.stringify({
        schemaVersion: 99,
        futureOnly: true
      }));
      const future = loadLearningProgress('2026-08-07T10:05:00.000Z');
      saveLearningProgress({
        schemaVersion: 1,
        createdAt: '2026-08-07T10:05:00.000Z',
        updatedAt: '2026-08-07T10:05:00.000Z',
        wordProgress: {},
        skillProgress: {}
      });
      const unsupportedBackup = Object.keys(localStorage).find(key => key.startsWith('spansk123_learningProgress_unsupported_'));

      return {
        corrupt,
        corruptBackupValue: corruptBackup ? localStorage.getItem(corruptBackup) : null,
        future,
        writeBlockedValue: JSON.parse(localStorage.getItem('spansk123_learningProgress_v1')),
        unsupportedBackupValue: unsupportedBackup ? JSON.parse(localStorage.getItem(unsupportedBackup)) : null
      };
    });

    expect(result.corrupt).toMatchObject({
      schemaVersion: 1,
      wordProgress: {},
      skillProgress: {}
    });
    expect(result.corruptBackupValue).toBe('{ skadet');
    expect(result.future).toMatchObject({
      schemaVersion: 1,
      wordProgress: {},
      skillProgress: {}
    });
    expect(result.writeBlockedValue).toEqual({ schemaVersion: 99, futureOnly: true });
    expect(result.unsupportedBackupValue).toEqual({ schemaVersion: 99, futureOnly: true });
  });
});
