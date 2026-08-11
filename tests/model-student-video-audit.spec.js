import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();
const artifactDir = path.resolve('output/student-agent-audit/latest');

test.describe.configure({ mode: 'serial' });
test.use({ viewport: { width: 390, height: 844 }, video: 'on', trace: 'retain-on-failure' });

test('simulated student completes diagnosis and two mixed quizzes with evidence checkpoints', async ({ page }) => {
  test.setTimeout(120000);
  fs.rmSync(artifactDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(artifactDir, 'checkpoints'), { recursive: true });

  const events = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));

  let checkpointIndex = 0;
  async function checkpoint(step, note = '') {
    const filename = `${String(checkpointIndex++).padStart(3, '0')}-${step}.png`;
    const screenshotPath = path.join(artifactDir, 'checkpoints', filename);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    events.push({
      at: new Date().toISOString(),
      step,
      note,
      screenshot: path.relative(artifactDir, screenshotPath),
      url: page.url(),
      visibleText: (await page.locator('body').innerText()).slice(0, 1600)
    });
  }

  async function answerCurrentQuestion(sessionName, index) {
    const question = sessionName === 'diagnosis' ? page.locator('#diagnosisPanel') : page.locator('.mixed-quiz-question');
    const mode = await question.getAttribute('data-response-mode');
    if (sessionName === 'diagnosis') {
      if (mode === 'typed') {
        const input = page.locator('#diagnosisAnswerInput');
        await input.fill(index % 3 === 0 ? 'modell svar' : 'hola');
        if (index % 2 === 0) await input.press('Enter');
        else await page.getByRole('button', { name: 'Svar', exact: true }).click();
      } else {
        const accepted = await page.locator('#diagnosisPanel').getAttribute('data-accepted-answer');
        const choice = index % 2 === 0
          ? page.locator('#diagnosisPanel').getByRole('button', { name: accepted, exact: true })
          : page.locator('#diagnosisPanel [data-option-id]').last();
        await choice.click();
    }
    await expect(page.locator('[data-diagnosis-feedback]')).toBeVisible();
      await checkpoint(`diagnosis-feedback-${index + 1}`, 'Svar registrert; eleven må selv trykke videre.');
      await page.getByRole('button', { name: /Neste|Se resultat/ }).click();
      return;
    }

    if (mode === 'typed') {
      await page.locator('#mixedQuizAnswerInput').fill(index % 3 === 0 ? 'feil svar' : 'hola');
      await page.locator('#mixedQuizAnswerInput').press('Enter');
    } else {
      await page.locator('[data-mixed-answer]').first().click();
    }
    await expect(page.locator('#mixedQuizFeedback')).toContainText(/Riktig|Feil|Nesten/);
    await checkpoint(`${sessionName}-feedback-${index + 1}`, 'Feedback etter elevens svar.');
    await page.getByRole('button', { name: /Neste|Se resultat/ }).click();
  }

  await page.goto(appUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await checkpoint('welcome', 'Ny elevprofil i ren nettleser.');
  await page.locator('#studentNameInput').fill('Audit-elev');
  await page.getByRole('button', { name: /Start/ }).first().click();
  await checkpoint('home-before-diagnosis', 'Diagnose skal være første handling.');
  await page.getByRole('button', { name: 'Start diagnose', exact: true }).click();

  for (let index = 0; index < 12; index++) await answerCurrentQuestion('diagnosis', index);
  await checkpoint('diagnosis-result', 'Diagnosen er ferdig og hjemsiden skal tilby dagens quiz.');
  await expect(page.getByRole('button', { name: 'Start dagens quiz', exact: true })).toBeEnabled();

  for (let quizNumber = 1; quizNumber <= 2; quizNumber++) {
    if (quizNumber === 1) {
      await page.getByRole('button', { name: 'Start dagens quiz', exact: true }).click();
    } else {
      await page.getByRole('button', { name: /Ta en ny quiz/ }).click();
    }
    await checkpoint(`quiz-${quizNumber}-start`, 'Blandet quiz med ordforråd, grammatikk og verb.');
    for (let index = 0; index < 10; index++) await answerCurrentQuestion(`quiz-${quizNumber}`, index);
    await expect(page.locator('.mixed-quiz-review-item')).toHaveCount(10);
    await checkpoint(`quiz-${quizNumber}-result`, 'Alle svar, fasiter og forklaringer skal være synlige.');
  }

  const finalText = await page.locator('#mixedQuizStreakSummary').innerText();
  expect(finalText).toContain('2 quiz i dag');
  await checkpoint('quiz-2-same-day-streak', 'Andre quiz samme dag skal telle mot 5-quiz-merket.');

  fs.writeFileSync(path.join(artifactDir, 'manifest.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    runner: 'model-student-video-audit',
    viewport: { width: 390, height: 844 },
    scenario: 'fresh student -> diagnosis -> two mixed quizzes',
    privacy: { localStorageClearedBeforeRun: true, identifierUsed: 'synthetic-audit-only', externalUpload: false },
    events,
    consoleErrors,
    pageErrors,
    video: { postProcessed: false }
  }, null, 2));

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
