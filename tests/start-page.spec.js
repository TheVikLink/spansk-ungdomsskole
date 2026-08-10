import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

const completedDiagnosis = {
  schemaVersion: 1,
  status: 'complete',
  startedAt: null,
  completedAt: '2026-08-07T09:00:00.000Z',
  questionIds: [],
  answers: [],
  resultBand: 'A0',
  recommendedSkillIds: []
};

test.describe('daily quiz start page', () => {
  test('returning pupil lands on Start with the daily quiz as the primary action', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(diagnosis => {
      localStorage.clear();
      localStorage.setItem('spansk123_diagnosis_v1', JSON.stringify(diagnosis));
      studentName = 'Elev 8A-12';
      showMainApp();
    }, completedDiagnosis);

    await expect(page.locator('#homePage')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dagens quiz' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start dagens quiz' })).toBeEnabled();
    await expect(page.locator('#vocabPage')).toBeHidden();
  });

  test('new pupil sees diagnosis before the personalized quiz', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Ny elev';
      showMainApp();
    });

    await expect(page.locator('#diagnosisPanel')).toContainText('Finn nivået mitt');
    await expect(page.getByRole('button', { name: 'Start nivåtest først' })).toBeDisabled();
  });

  test('manual destinations remain available from Start', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(diagnosis => {
      localStorage.clear();
      localStorage.setItem('spansk123_diagnosis_v1', JSON.stringify(diagnosis));
      studentName = 'Elev 9B-4';
      showMainApp();
    }, completedDiagnosis);

    await page.locator('#navVocab').click();
    await expect(page.locator('#vocabPage')).toBeVisible();
    await page.locator('#navBrainmap').click();
    await expect(page.locator('#brainmapPage')).toBeVisible();
    await page.locator('#navHomework').click();
    await expect(page.locator('#homeworkPage')).toBeVisible();
  });

  test('Start and daily quiz remain usable on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(appUrl);

    await page.evaluate(diagnosis => {
      localStorage.clear();
      localStorage.setItem('spansk123_diagnosis_v1', JSON.stringify(diagnosis));
      studentName = 'Elev 10A-2';
      showMainApp();
    }, completedDiagnosis);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    await page.getByRole('button', { name: 'Start dagens quiz' }).click();
    const quizOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(quizOverflow).toBe(false);
  });
});
