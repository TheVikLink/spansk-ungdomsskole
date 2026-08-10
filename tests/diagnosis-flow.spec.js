import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('diagnosis quiz v1', () => {
  test('normalizes and starts diagnosis with stable question ids', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      const empty = normalizeDiagnosisState(null);
      const started = startDiagnosis('2026-08-07T10:00:00.000Z');
      return {
        empty,
        started,
        expectedQuestionIds: diagnosisQuestionCatalog.map(question => question.id),
        stored: JSON.parse(localStorage.getItem('spansk123_diagnosis_v1'))
      };
    });

    expect(result.empty).toEqual({
      schemaVersion: 1,
      status: 'not_started',
      startedAt: null,
      completedAt: null,
      questionIds: [],
      answers: [],
      resultBand: null,
      recommendedSkillIds: []
    });
    expect(result.started.status).toBe('in_progress');
    expect(result.started.startedAt).toBe('2026-08-07T10:00:00.000Z');
    expect(result.started.questionIds).toEqual(result.expectedQuestionIds);
    expect(result.started.answers).toEqual([]);
    expect(result.stored).toEqual(result.started);
  });

  test('answering a diagnosis question stores the answer and updates one progress cell', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      document.getElementById('mainApp').classList.remove('hidden');
      startDiagnosis('2026-08-07T10:00:00.000Z');
      const state = answerDiagnosisQuestion(
        'diag.vocab.greeting.hola.es_no',
        'hei',
        '2026-08-07T10:01:00.000Z'
      );
      return {
        state,
        progress: JSON.parse(localStorage.getItem('spansk123_learningProgress_v1'))
      };
    });

    expect(result.state.answers).toEqual([
      {
        questionId: 'diag.vocab.greeting.hola.es_no',
        targetType: 'word',
        targetId: 'core.hola',
        direction: 'esToNo',
        correct: true,
        resultKind: 'correct',
        responseMode: 'typed',
        answeredAt: '2026-08-07T10:01:00.000Z'
      }
    ]);
    expect(result.progress.wordProgress['core.hola'].esToNo).toMatchObject({
      strength: 2,
      attempts: 1,
      correct: 1,
      lapses: 0,
      lastSeenAt: '2026-08-07T10:01:00.000Z'
    });
    expect(result.progress.wordProgress['core.hola'].noToEs).toMatchObject({
      strength: 0,
      attempts: 0
    });
    expect(result.progress.skillProgress).toEqual({});
  });

  test('completes diagnosis with deterministic result band and recommendations', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      startDiagnosis('2026-08-07T10:00:00.000Z');
      diagnosisQuestionCatalog.forEach((question, index) => {
        const answer = index < 8 ? question.acceptedAnswers[0] : 'feil';
        answerDiagnosisQuestion(question.id, answer, `2026-08-07T10:${String(index + 1).padStart(2, '0')}:00.000Z`);
      });
      return completeDiagnosisResult('2026-08-07T10:20:00.000Z');
    });

    expect(result.status).toBe('complete');
    expect(result.completedAt).toBe('2026-08-07T10:20:00.000Z');
    expect(result.resultBand).toBe('A1-start');
    expect(result.recommendedSkillIds).toEqual([
      'a1.verbs.regular_ar.present',
      'a1.verbs.regular_er.present',
      'a1.gustar.basic'
    ]);
  });

  test('new pupil can complete the diagnosis quiz from the app UI', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.fill('#studentNameInput', 'Elevkode 8A-12');
    await page.click('button:has-text("Start")');

    await expect(page.getByRole('heading', { name: 'Finn nivået mitt' })).toBeVisible();
    await page.getByRole('button', { name: 'Start diagnose' }).click();

    for (let i = 0; i < 12; i++) {
      const responseMode = await page.locator('#diagnosisPanel').getAttribute('data-response-mode');
      if (responseMode === 'typed') {
        const accepted = await page.locator('#diagnosisPanel').getAttribute('data-accepted-answer');
        await page.fill('#diagnosisAnswerInput', accepted);
        await page.getByRole('button', { name: 'Svar' }).click();
      } else {
        const accepted = await page.locator('#diagnosisPanel').getAttribute('data-accepted-answer');
        await page.locator('#diagnosisPanel').getByRole('button', { name: accepted, exact: true }).click();
      }
      await page.locator('#diagnosisPanel button').filter({ hasText: i === 11 ? 'Se resultat' : 'Neste' }).click();
    }

    await expect(page.getByRole('heading', { name: 'Resultat' })).toBeVisible();
    await expect(page.locator('#diagnosisResultBand')).toContainText('A1');
    await expect(page.locator('#diagnosisPanel')).toContainText('Fremgangen er lagret bare på denne enheten.');
  });

  test('keeps an answered diagnosis question visible until manual continuation', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      document.getElementById('mainApp').classList.remove('hidden');
      startDiagnosis('2026-08-07T10:00:00.000Z');
      document.getElementById('diagnosisPanel').classList.remove('hidden');
      renderDiagnosisPanel();
      submitDiagnosisAnswer('feil');
    });

    await expect(page.locator('#diagnosisPanel')).toContainText('hola');
    await expect(page.locator('#diagnosisPanel')).toContainText('Riktig svar var');
    const diagnosisPanel = page.locator('#diagnosisPanel');
    await expect(diagnosisPanel.locator('button', { hasText: 'Neste' })).toBeVisible();
    await expect(page.locator('#diagnosisPanel')).not.toContainText('takk');

    await diagnosisPanel.locator('button', { hasText: 'Neste' }).click();
    await expect(page.locator('#diagnosisPanel')).toContainText('takk');
  });

  test('advances diagnosis feedback with Enter without submitting twice', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      document.getElementById('mainApp').classList.remove('hidden');
      startDiagnosis('2026-08-07T10:00:00.000Z');
      document.getElementById('diagnosisPanel').classList.remove('hidden');
      renderDiagnosisPanel();
      submitDiagnosisAnswer('feil');
    });

    await page.keyboard.press('Enter');
    const answerCount = await page.evaluate(() => loadDiagnosisState().answers.length);
    expect(answerCount).toBe(1);
    await expect(page.locator('#diagnosisPanel')).toContainText('takk');
  });

  test('imported prior progress skips diagnosis after browser data was cleared', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      const imported = importProgressData({
        version: 'spansk123_export_v1',
        studentName: 'Elevkode 9A-14',
        vocabData: [{ id: 1, no: 'hei', es: 'hola' }],
        grammarData: {},
        practiceHistory: [{ date: '2026-08-07', words: 10, correct: 8, sessions: 1 }]
      });
      const diagnosis = loadDiagnosisState();
      return {
        imported,
        diagnosis,
        storedName: localStorage.getItem('spansk123_studentName'),
        storedCards: JSON.parse(localStorage.getItem('spansk123Data_v4'))
      };
    });

    expect(result.imported.imported).toBe(true);
    expect(result.storedName).toBe('Elevkode 9A-14');
    expect(result.storedCards).toHaveLength(1);
    expect(result.diagnosis).toMatchObject({
      status: 'complete',
      resultBand: 'A0',
      answers: [],
      recommendedSkillIds: []
    });
  });
});
