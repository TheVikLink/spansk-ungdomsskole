import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

const progressCell = (strength, attempts = strength) => ({
  strength,
  attempts,
  correct: strength >= 2 ? attempts : 0,
  lapses: strength < 2 && attempts > 0 ? 1 : 0,
  dueAt: null,
  lastSeenAt: attempts ? '2026-08-07T09:00:00.000Z' : null
});

test.describe('adaptive mixed quiz v1', () => {
  test('builds a deterministic ten-question mix with confidence and recent buckets', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      const cell = (strength, attempts = strength) => ({
        strength,
        attempts,
        correct: strength >= 2 ? attempts : 0,
        lapses: strength < 2 && attempts > 0 ? 1 : 0,
        dueAt: null,
        lastSeenAt: attempts ? '2026-08-07T09:00:00.000Z' : null
      });
      const learningProgress = {
        schemaVersion: 1,
        createdAt: '2026-08-07T08:00:00.000Z',
        updatedAt: '2026-08-07T09:00:00.000Z',
        wordProgress: {
          'core.hola': { noToEs: cell(0, 0), esToNo: cell(0, 0) },
          'core.gracias': { noToEs: cell(0, 0), esToNo: cell(0, 0) },
          'core.madre': { noToEs: cell(0, 0), esToNo: cell(0, 0) },
          'core.cinco': { noToEs: cell(0, 0), esToNo: cell(0, 0) }
        },
        skillProgress: {
          'a0.identity.me_llamo': cell(1, 1),
          'a0.identity.soy_de': cell(2, 2),
          'a0.articles.indefinite_singular': cell(3, 3),
          'a0.articles.definite_singular': cell(5, 5),
          'a1.verbs.regular_ar.present': cell(1, 1),
          'a1.verbs.regular_er.present': cell(2, 2),
          'a1.gustar.basic': cell(0, 0),
          'a1.ser_estar.identity_or_location': cell(0, 0)
        }
      };
      const options = {
        cards: [],
        skillsCatalog: learningCatalog,
        learningProgress,
        diagnosis: { status: 'complete', answers: [] },
        now: '2026-08-07T10:00:00.000Z',
        seed: 'diagnosis-seed',
        size: 10
      };
      const first = buildMixedQuiz(options);
      const second = buildMixedQuiz(options);
      return {
        first,
        second,
        itemTypes: first.items.reduce((counts, item) => {
          counts[item.itemType] = (counts[item.itemType] || 0) + 1;
          return counts;
        }, {}),
        questionIds: first.items.map(item => item.questionId),
        wordDirections: first.items.filter(item => item.targetType === 'word').map(item => `${item.targetId}:${item.direction}`)
      };
    });

    expect(result.first.items).toHaveLength(10);
    expect(result.second.items.map(item => item.questionId)).toEqual(result.questionIds);
    expect(new Set(result.questionIds).size).toBe(10);
    expect(new Set(result.wordDirections).size).toBe(result.wordDirections.length);
    expect(result.itemTypes.vocabulary).toBe(4);
    expect(result.itemTypes.skill).toBe(6);
    expect(result.first.items.filter(item => item.selectionBucket === 'confidence')).toHaveLength(1);
    expect(result.first.items.filter(item => item.selectionBucket === 'recent')).toHaveLength(2);
  });

  test('uses documented fallback when there are fewer than ten candidates', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => buildMixedQuiz({
      cards: [],
      skillsCatalog: {
        skills: [learningCatalog.skills[0]],
        words: [learningCatalog.words[0]]
      },
      learningProgress: {
        schemaVersion: 1,
        wordProgress: {},
        skillProgress: {}
      },
      diagnosis: { status: 'complete', answers: [] },
      now: '2026-08-07T10:00:00.000Z',
      seed: 1,
      size: 10
    }));

    expect(result.items).toHaveLength(2);
    expect(result.fallbackUsed).toBe(true);
  });

  test('requires completed or explicitly skipped diagnosis before personalization', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => buildMixedQuiz({
      cards: [],
      skillsCatalog: learningCatalog,
      learningProgress: { schemaVersion: 1, wordProgress: {}, skillProgress: {} },
      diagnosis: { status: 'in_progress', answers: [] },
      now: '2026-08-07T10:00:00.000Z',
      seed: 1,
      size: 10
    }));

    expect(result).toMatchObject({ status: 'diagnosis_required', items: [] });
  });

  test('updates exactly one progress cell for a mixed quiz answer', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      const item = diagnosisQuestionCatalog.find(question => question.id === 'diag.a1.verbs.regular_ar.present.hablar');
      const answer = answerMixedQuizItem(item, 'hablo', '2026-08-07T10:10:00.000Z');
      return {
        resultKind: answer.resultKind,
        progress: JSON.parse(localStorage.getItem('spansk123_learningProgress_v1'))
      };
    });

    expect(result.resultKind).toBe('correct');
    expect(result.progress.skillProgress['a1.verbs.regular_ar.present']).toMatchObject({
      strength: 2,
      attempts: 1,
      correct: 1,
      lapses: 0,
      lastSeenAt: '2026-08-07T10:10:00.000Z'
    });
    expect(Object.keys(result.progress.wordProgress)).toHaveLength(0);
    expect(Object.keys(result.progress.skillProgress)).toHaveLength(1);
  });

  test('classifies accent variants separately without changing the accepted answer', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => ({
      exact: evaluateDiagnosisAnswer({ acceptedAnswers: ['hablo'] }, 'hablo'),
      accentVariant: evaluateDiagnosisAnswer({ acceptedAnswers: ['hablo'] }, 'habló'),
      doubleSpace: evaluateDiagnosisAnswer({ acceptedAnswers: ['soy de noruega'] }, 'Soy  de  Noruega'),
      ñIsNotAnAccentVariant: evaluateDiagnosisAnswer({ acceptedAnswers: ['año'] }, 'ano'),
      wrong: evaluateDiagnosisAnswer({ acceptedAnswers: ['hablo'] }, 'comes'),
      blank: evaluateDiagnosisAnswer({ acceptedAnswers: ['hablo'] }, '')
    }));

    expect(result.exact).toEqual({ resultKind: 'correct', correct: true });
    expect(result.accentVariant).toEqual({ resultKind: 'accent_or_case_variant', correct: false });
    expect(result.doubleSpace).toEqual({ resultKind: 'correct', correct: true });
    expect(result.ñIsNotAnAccentVariant).toEqual({ resultKind: 'wrong', correct: false });
    expect(result.wrong).toEqual({ resultKind: 'wrong', correct: false });
    expect(result.blank).toEqual({ resultKind: 'skipped', correct: false });
  });

  test('starts the mixed quiz from the existing vocabulary page and advances manually', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('spansk123_diagnosis_v1', JSON.stringify({
        schemaVersion: 1,
        status: 'complete',
        startedAt: null,
        completedAt: '2026-08-07T09:00:00.000Z',
        questionIds: [],
        answers: [],
        resultBand: 'A0',
        recommendedSkillIds: []
      }));
      studentName = 'Elev 14';
      showMainApp();
      showPage('vocab');
    });

    await expect(page.getByRole('button', { name: 'Start quiz' })).toBeEnabled();
    await page.getByRole('button', { name: 'Start quiz' }).click();
    await expect(page.locator('#mixedQuizStudy')).toBeVisible();
    await expect(page.locator('#mixedQuizStats')).toContainText('0 / 10');

    const responseMode = await page.locator('.mixed-quiz-question').getAttribute('data-response-mode');
    const accepted = await page.locator('.mixed-quiz-question').getAttribute('data-accepted-answer');
    if (responseMode === 'typed') {
      await page.fill('#mixedQuizAnswerInput', accepted);
      await page.getByRole('button', { name: 'Sjekk svar' }).click();
    } else {
      await page.locator('[data-mixed-answer]').filter({ hasText: accepted }).click();
    }

    await expect(page.locator('#mixedQuizFeedback')).toContainText('Riktig');
    await expect(page.getByRole('button', { name: 'Neste' })).toBeVisible();
    await page.getByRole('button', { name: 'Neste' }).click();
    await expect(page.locator('#mixedQuizStats')).toContainText('1 / 10');
  });

  test('labels a wrong mixed-quiz answer explicitly', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('spansk123_diagnosis_v1', JSON.stringify({
        schemaVersion: 1,
        status: 'complete',
        startedAt: null,
        completedAt: '2026-08-07T09:00:00.000Z',
        questionIds: [],
        answers: [],
        resultBand: 'A0',
        recommendedSkillIds: []
      }));
      studentName = 'Elev audit';
      showMainApp();
      showPage('vocab');
      startMixedQuizFromUi();
    });

    const responseMode = await page.locator('.mixed-quiz-question').getAttribute('data-response-mode');
    if (responseMode === 'typed') {
      await page.fill('#mixedQuizAnswerInput', 'helt feil');
      await page.getByRole('button', { name: 'Sjekk svar' }).click();
    } else {
      await page.locator('[data-mixed-answer]').first().click();
    }

    await expect(page.locator('#mixedQuizFeedback')).toContainText('Feil');
    await expect(page.locator('#mixedQuizFeedback')).toContainText('riktig svar');
    await expect(page.getByRole('button', { name: 'Neste' })).toBeVisible();
  });
});
