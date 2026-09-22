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
        stored: JSON.parse(localStorage.getItem('spansk123_diagnosis_v2'))
      };
    });

    expect(result.empty).toEqual({
      schemaVersion: 2,
      status: 'not_started',
      startedAt: null,
      completedAt: null,
      questionIds: [],
      answers: [],
      resultBand: null,
      recommendedSkillIds: [],
      confidence: 'low',
      evidenceCount: 0,
      productiveAnchorCount: 0,
      insufficientEvidence: false,
      observationsVersion: 1,
      itemVersions: {},
      sessionId: null,
      processedResponseIds: []
    });
    expect(result.started.status).toBe('in_progress');
    expect(result.started.startedAt).toBe('2026-08-07T10:00:00.000Z');
    expect(result.started.questionIds).toEqual(result.expectedQuestionIds);
    expect(result.started.answers).toEqual([]);
    expect(result.stored).toEqual(result.started);
  });

  test('shows Norwegian meaning for typed verb diagnosis prompts', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      const state = startDiagnosis('2026-08-07T10:00:00.000Z');
      state.questionIds = ['diag.a1.verbs.regular_ar.present.hablar'];
      saveDiagnosisState(state);
      renderDiagnosisPanel();
    });

    await expect(page.locator('#diagnosisPanel')).toContainText('jeg snakker');
    await expect(page.locator('#diagnosisPanel')).toContainText('yo + hablar');
    await expect(page.locator('#diagnosisPanel')).toContainText('presens');
  });

  test('answering a diagnosis question stores the answer and updates one progress cell', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      document.getElementById('mainApp').classList.remove('hidden');
      startDiagnosis('2026-08-07T10:00:00.000Z');
      const question = diagnosisQuestionCatalog.find(item => item.id === 'diag.vocab.greeting.hola.es_no');
      const state = answerDiagnosisQuestion(
        'diag.vocab.greeting.hola.es_no',
        'hei',
        '2026-08-07T10:01:00.000Z'
      );
      return {
        state,
        questionVersion: question.contentVersion,
        progress: JSON.parse(localStorage.getItem('spansk123_learningProgress_v1'))
      };
    });

    expect(result.state.answers).toHaveLength(1);
    expect(result.state.answers[0]).toMatchObject({
        questionId: 'diag.vocab.greeting.hola.es_no',
        targetType: 'word',
        targetId: 'core.hola',
        direction: 'esToNo',
        correct: true,
        resultKind: 'correct',
        responseMode: 'typed',
        answeredAt: '2026-08-07T10:01:00.000Z',
        contentVersion: result.questionVersion,
        responseClass: 'correct',
        rawResponse: 'hei',
        normalizedResponse: 'hei',
        reclassifiable: true
    });
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
        const answer = index < 8 ? getDiagnosisAnswerValue(question.acceptedAnswers[0]) : 'feil';
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

  test('routes from weighted evidence and marks incomplete evidence explicitly', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => ({
      incomplete: calculateDiagnosisRouting([
        { resultKind: 'correct', productiveAnchor: true },
        { resultKind: 'skipped', productiveAnchor: false }
      ]),
      a1Start: calculateDiagnosisRouting([
        { resultKind: 'correct', productiveAnchor: true },
        { resultKind: 'correct', productiveAnchor: false },
        { resultKind: 'correct', productiveAnchor: false },
        { resultKind: 'correct', productiveAnchor: false },
        { resultKind: 'correct', productiveAnchor: false },
        { resultKind: 'correct', productiveAnchor: false },
        { resultKind: 'near_miss', productiveAnchor: false },
        { resultKind: 'wrong', productiveAnchor: false }
      ]),
      a1: calculateDiagnosisRouting([
        { resultKind: 'correct', productiveAnchor: true },
        { resultKind: 'correct', productiveAnchor: true },
        { resultKind: 'accent_or_case_variant', productiveAnchor: true },
        { resultKind: 'correct', productiveAnchor: false },
        { resultKind: 'correct', productiveAnchor: false },
        { resultKind: 'correct', productiveAnchor: false },
        { resultKind: 'correct', productiveAnchor: false },
        { resultKind: 'correct', productiveAnchor: false },
        { resultKind: 'correct', productiveAnchor: false }
      ])
    }));

    expect(result.incomplete).toMatchObject({ resultBand: 'A0+', insufficientEvidence: true, confidence: 'low' });
    expect(result.a1Start).toMatchObject({ resultBand: 'A1-start', insufficientEvidence: false });
    expect(result.a1).toMatchObject({ resultBand: 'A1', productiveAnchorCount: 3 });
  });

  for (const width of [390, 1440]) {
    test(`completed diagnosis leads to quiz and vocabulary review without a result panel at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(appUrl);
      await page.evaluate(() => localStorage.clear());
      await page.reload();

      await page.fill('#studentNameInput', 'Elevkode 8A-12');
      await page.click('button:has-text("Start")');

      await expect(page.getByRole('heading', { name: 'Finn nivået mitt' })).toBeVisible();
      await page.locator('#homeStartMixedQuizBtn').click();

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
        if (i === 11) {
          await expect(page.locator('[data-diagnosis-feedback]')).toBeVisible();
          await expect(page.locator('#homePage')).toBeHidden();
        }
        await page.locator('#diagnosisPanel button').filter({ hasText: i === 11 ? 'Gå til Start' : 'Neste' }).click();
      }

      await expect(page.locator('#homeStartMixedQuizBtn')).toBeFocused();
      const savedDiagnosis = await page.evaluate(() => loadDiagnosisState());
      expect(savedDiagnosis).toMatchObject({ status: 'complete', resultBand: 'A1' });
      expect(savedDiagnosis.answers).toHaveLength(12);
      for (const visit of ['completed', 'reload', 'return']) {
        if (visit === 'reload') await page.reload();
        if (visit === 'return') {
          await page.locator('#navVocab').click();
          await page.locator('#navHome').click();
        }
        await expect(page.locator('#diagnosisPanel')).toBeHidden();
        await expect(page.getByRole('heading', { name: 'Resultat', exact: true })).toHaveCount(0);
        await expect(page.locator('#homePrimaryContent').getByRole('heading')).toHaveText(['Dagens quiz', 'Repeter gloser']);
        await expect(page.getByRole('button', { name: 'Start dagens quiz', exact: true })).toBeInViewport();
        await expect(page.getByRole('button', { name: 'Start repetisjon', exact: true })).toBeInViewport();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await page.evaluate(() => loadDiagnosisState())).toEqual(savedDiagnosis);
      }
      await page.screenshot({ path: testInfo.outputPath(`home-after-diagnosis-${width}.png`), fullPage: true });
    });
  }

  test('refreshes the home CTA immediately after diagnosis completion', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.fill('#studentNameInput', 'Elevkode 8A-13');
    await page.getByRole('button', { name: 'Start' }).click();
    await page.locator('#homeStartMixedQuizBtn').click();

    for (let i = 0; i < 12; i++) {
      const responseMode = await page.locator('#diagnosisPanel').getAttribute('data-response-mode');
      const accepted = await page.locator('#diagnosisPanel').getAttribute('data-accepted-answer');
      if (responseMode === 'typed') {
        await page.fill('#diagnosisAnswerInput', accepted);
        await page.getByRole('button', { name: 'Svar' }).click();
      } else {
        await page.locator('#diagnosisPanel').getByRole('button', { name: accepted, exact: true }).click();
      }
      await page.locator('#diagnosisPanel button').filter({ hasText: i === 11 ? 'Gå til Start' : 'Neste' }).click();
    }

    await expect(page.locator('#diagnosisPanel')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Start dagens quiz' })).toBeEnabled();
    await page.getByRole('button', { name: 'Start dagens quiz', exact: true }).click();
    await expect(page.locator('#mixedQuizStudy')).toBeVisible();
  });

  test('submits typed diagnosis answers with Enter', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      document.getElementById('mainApp').classList.remove('hidden');
      startDiagnosis('2026-08-10T13:00:00.000Z');
      document.getElementById('diagnosisPanel').classList.remove('hidden');
      renderDiagnosisPanel();
    });

    await page.fill('#diagnosisAnswerInput', 'hei');
    await page.keyboard.press('Enter');
    await expect(page.locator('#diagnosisPanel')).toContainText('Riktig');
    await expect.poll(() => page.evaluate(() => loadDiagnosisState().answers.length)).toBe(1);
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

  test('migrates legacy diagnosis state without inventing reclassifiable answers', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('spansk123_diagnosis_v1', JSON.stringify({
        schemaVersion: 1,
        status: 'complete',
        startedAt: '2026-08-07T10:00:00.000Z',
        completedAt: '2026-08-07T10:05:00.000Z',
        questionIds: ['diag.vocab.greeting.hola.es_no'],
        answers: [{ questionId: 'diag.vocab.greeting.hola.es_no', resultKind: 'correct', answeredAt: '2026-08-07T10:01:00.000Z' }],
        resultBand: 'A0+',
        recommendedSkillIds: []
      }));
      const diagnosis = loadDiagnosisState();
      return { diagnosis, stored: JSON.parse(localStorage.getItem('spansk123_diagnosis_v2')) };
    });

    expect(result.diagnosis.schemaVersion).toBe(2);
    expect(result.diagnosis.answers[0]).toMatchObject({ reclassifiable: false, contentVersion: null, rawResponse: null });
    expect(result.stored.schemaVersion).toBe(2);
  });

  test('preserves newer diagnosis state and blocks writes', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      const future = JSON.stringify({ schemaVersion: 99, status: 'complete', answers: [{ questionId: 'future' }] });
      localStorage.setItem('spansk123_diagnosis_v2', future);
      const loaded = loadDiagnosisState();
      saveDiagnosisState({ schemaVersion: 2, status: 'complete', resultBand: 'A0' });
      return {
        loaded,
        current: localStorage.getItem('spansk123_diagnosis_v2'),
        backups: Object.keys(localStorage).filter(key => key.startsWith('spansk123_diagnosis_unsupported_'))
      };
    });

    expect(result.loaded.status).toBe('not_started');
    expect(result.current).toContain('"schemaVersion":99');
    expect(result.backups).toHaveLength(1);
  });

  test('isolated diagnosis view displays cancel button and hides homePage during testing', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Test Elev';
      localStorage.setItem('spansk123_studentName', studentName);
      showMainApp();
    });

    await expect(page.locator('#homePage')).toBeVisible();
    await expect(page.locator('#diagnosisPanel')).toBeVisible();
    await expect(page.locator('#diagnosisCancelBtn')).toBeHidden();

    await page.locator('#homeStartMixedQuizBtn').click();

    await expect(page.locator('#homePage')).toBeHidden();
    await expect(page.locator('#diagnosisCancelBtn')).toBeVisible();
    await expect(page.locator('#diagnosisCancelBtn')).toHaveText('✕ Avslutt');
    await expect(page.locator('#diagnosisPanel .session-progress')).toBeVisible();
    await expect(page.locator('#diagnosisPanel .card-counter')).toHaveText('1 / 12');
  });

  test('cancelling diagnosis asks for confirmation; dismissing continues while accepting resets to Start', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Test Elev';
      showMainApp();
    });

    await page.locator('#homeStartMixedQuizBtn').click();
    await expect(page.locator('#diagnosisCancelBtn')).toBeVisible();

    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Vil du avbryte nivåtesten?');
      await dialog.dismiss();
    });
    await page.locator('#diagnosisCancelBtn').click();

    await expect(page.locator('#homePage')).toBeHidden();
    await expect(page.locator('#diagnosisCancelBtn')).toBeVisible();
    expect(await page.evaluate(() => loadDiagnosisState().status)).toBe('in_progress');

    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Vil du avbryte nivåtesten?');
      await dialog.accept();
    });
    await page.locator('#diagnosisCancelBtn').click();

    await expect(page.locator('#homePage')).toBeVisible();
    await expect(page.locator('#homeStartMixedQuizBtn')).toBeVisible();
    await expect(page.locator('#homeStartMixedQuizBtn')).toHaveText('Start nivåtest');
    await expect(page.locator('#diagnosisCancelBtn')).toBeHidden();
    expect(await page.evaluate(() => loadDiagnosisState().status)).toBe('not_started');
  });

  test('diagnosis cancel and progress view is usable on mobile screen (390px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Mobil Elev';
      showMainApp();
    });

    await page.locator('#homeStartMixedQuizBtn').click();
    await expect(page.locator('#diagnosisCancelBtn')).toBeVisible();
    await expect(page.locator('#homePage')).toBeHidden();

    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    await page.locator('#diagnosisCancelBtn').click();

    await expect(page.locator('#homePage')).toBeVisible();
    await expect(page.locator('#homeStartMixedQuizBtn')).toBeVisible();
  });

  test('reload restores diagnosis navigation protection only while the diagnosis is in progress', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Test Elev';
      localStorage.setItem('spansk123_studentName', studentName);
      showMainApp();
      startDiagnosisFromUi();
    });
    await page.reload();

    await expect(page.locator('#mainApp')).toBeVisible();
    await expect(page.locator('#diagnosisCancelBtn')).toBeVisible();
    await expect(page.locator('#homePage')).toBeHidden();

    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('#navVocab').click();
    await expect(page.locator('#diagnosisCancelBtn')).toBeVisible();

    page.once('dialog', dialog => dialog.accept());
    await page.locator('#navVocab').click();
    await expect(page.locator('#vocabPage')).toBeVisible();
    expect(await page.evaluate(() => loadDiagnosisState().status)).toBe('not_started');

    const inactiveStates = await page.evaluate(() => {
      renderDiagnosisPanel();
      const notStarted = activeSessionType;
      skipDiagnosisAfterProgressImport();
      renderDiagnosisPanel();
      return { notStarted, complete: activeSessionType };
    });
    expect(inactiveStates).toEqual({ notStarted: null, complete: null });
  });
});
