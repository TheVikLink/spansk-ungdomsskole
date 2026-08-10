import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

const completedDiagnosis = {
  schemaVersion: 1,
  status: 'complete',
  startedAt: null,
  completedAt: '2026-08-10T08:00:00.000Z',
  questionIds: [],
  answers: [],
  resultBand: 'A0',
  recommendedSkillIds: []
};

test.describe('skolestart pilot audit', () => {
  test('fresh pupil sees a diagnosis-first start flow', async ({ page }) => {
    await page.goto(appUrl);
    await page.locator('#studentNameInput').fill('Pilot-elev-1');
    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.locator('#homePage')).toBeVisible();
    await expect(page.locator('#diagnosisPanel')).toContainText('Finn nivået mitt');
    await expect(page.getByRole('button', { name: 'Start nivåtest først' })).toBeDisabled();
  });

  test('imported progress restores the pupil without requiring diagnosis again', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      importProgressData({
        version: 'spansk123_export_v1',
        studentName: 'Pilot-elev-2',
        vocabData: [],
        grammarData: {},
        practiceHistory: [],
        learningProgress: { schemaVersion: 1, wordProgress: {}, skillProgress: {} }
      });
      showMainApp();
    });

    await expect(page.locator('#homePage')).toBeVisible();
    await expect(page.locator('#diagnosisPanel')).toContainText('Diagnose hoppet over');
    await expect(page.getByRole('button', { name: 'Start dagens quiz' })).toBeEnabled();
  });

  test('core views fit a mobile viewport and render at desktop width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(appUrl);
    await page.evaluate(diagnosis => {
      localStorage.clear();
      localStorage.setItem('spansk123_diagnosis_v1', JSON.stringify(diagnosis));
      studentName = 'Pilot-elev-3';
      showMainApp();
    }, completedDiagnosis);

    for (const pageName of ['home', 'vocab', 'brainmap', 'homework']) {
      await page.evaluate(name => showPage(name), pageName);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => showPage('home'));
    await expect(page.locator('#homePage')).toBeVisible();
  });

  test('default homework delivery stays local and opens no external URL', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Pilot-elev-4';
      practiceHistory = getWeekDays().filter(day => !day.isClassDay).slice(0, 2).map((day, index) => ({
        date: day.dateStr,
        words: 10 + index,
        correct: 8 + index,
        sessions: 1
      }));
      savePracticeHistory();
      showMainApp();
      showPage('homework');
      const openedUrls = [];
      const originalOpen = window.open;
      window.open = url => openedUrls.push(url);
      const submitResult = submitHomework();
      window.open = originalOpen;
      return {
        openedUrls,
        submittedExternally: submitResult.submittedExternally,
        hint: document.getElementById('homeworkHint').textContent
      };
    });

    expect(result.openedUrls).toEqual([]);
    expect(result.submittedExternally).toBe(false);
    expect(result.hint).toContain('Ingen data er sendt');
  });
});
