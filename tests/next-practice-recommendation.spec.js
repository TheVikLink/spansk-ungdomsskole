import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('next practice recommendation', () => {
  test('prioritizes due weak work over new and mastered work', async ({ page }) => {
    await page.goto(appUrl);
    const recommendation = await page.evaluate(() => getNextPracticeRecommendation([
      { questionId: 'new', itemType: 'vocabulary', targetId: 'new', attempts: 0, strength: 0, lapses: 0, dueAt: null, recent: true },
      { questionId: 'mastered', itemType: 'skill', targetId: 'mastered', attempts: 4, strength: 5, lapses: 0, dueAt: '2020-01-01T00:00:00.000Z', recent: false },
      { questionId: 'due-weak', itemType: 'skill', targetId: 'due-weak', attempts: 2, strength: 1, lapses: 2, dueAt: '2020-01-01T00:00:00.000Z', recent: false }
    ], '2026-08-28T00:00:00.000Z'));

    expect(recommendation).toMatchObject({ targetId: 'due-weak', kind: 'skill' });
  });

  test('skips planned catalog skills and falls back predictably', async ({ page }) => {
    await page.goto(appUrl);
    const result = await page.evaluate(() => ({
      planned: getNextPracticeRecommendation([
        { questionId: 'planned', targetId: 'a1.planned', itemType: 'skill', skillStatus: 'planned', attempts: 0, strength: 0, lapses: 0, dueAt: null, recent: true }
      ]),
      empty: getNextPracticeRecommendation([])
    }));

    expect(result.planned).toBeNull();
    expect(result.empty).toMatchObject({ kind: 'mixedQuiz', action: 'Start dagens quiz' });
  });

  test('shows a concrete next-practice action on the home page', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      saveDiagnosisState({ schemaVersion: 2, status: 'complete', questionIds: [], answers: [], recommendedSkillIds: [] });
      localStorage.setItem('spansk123_learningProgress_v1', JSON.stringify({
        schemaVersion: 1,
        skillProgress: { 'a0.identity.me_llamo': { strength: 1, attempts: 2, lapses: 1, dueAt: '2020-01-01T00:00:00.000Z' } },
        wordProgress: {}
      }));
      studentName = 'Elev anbefaling';
      showMainApp();
      showPage('home');
    });

    await expect(page.locator('#homeNextPractice')).toContainText('Neste anbefalte øving');
    await expect(page.locator('#homeNextPractice')).toContainText('Jeg heter Ana');
    await expect(page.getByRole('button', { name: 'Start anbefalt øving' })).toBeVisible();
  });
});
