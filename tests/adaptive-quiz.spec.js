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
    expect(result.first.items.reduce((counts, item) => {
      counts[item.responseMode] = (counts[item.responseMode] || 0) + 1;
      return counts;
    }, {})).toEqual({ typed: 5, select: 3, choice: 2 });
  });

  test('builds select options with one correct answer and diagnostic distractors', async ({ page }) => {
    await page.goto(appUrl);
    const result = await page.evaluate(() => getSelectOptions({
      acceptedAnswers: [{ answerId: 'gustan', value: 'gustan' }],
      options: [
        { optionId: 'gusta', label: 'gusta' },
        { optionId: 'gustan', label: 'gustan' },
        { optionId: 'gusto', label: 'gusto' },
        { optionId: 'gustas', label: 'gustas' }
      ]
    }));
    expect(result).toHaveLength(4);
    expect(result.filter(option => option.correct)).toEqual([{ optionId: 'gustan', label: 'gustan', correct: true }]);
    expect(result.filter(option => !option.correct)).toHaveLength(3);
  });

  test('mixed quiz converts recognition items to select without submitting on the placeholder', async ({ page }) => {
    await page.goto(appUrl);
    const result = await page.evaluate(() => {
      localStorage.clear();
      const quiz = buildMixedQuiz({
        cards: [],
        skillsCatalog: learningCatalog,
        learningProgress: { schemaVersion: 1, wordProgress: {}, skillProgress: {} },
        diagnosis: { status: 'complete', answers: [] },
        now: '2026-08-11T10:00:00.000Z',
        seed: 'select-mode',
        size: 10
      });
      mixedQuizState = { quiz, index: quiz.items.findIndex(item => item.responseMode === 'select'), answered: 0, correct: 0, startedAt: new Date(), results: [] };
      document.getElementById('mixedQuizStudy').classList.remove('hidden');
      renderMixedQuizQuestion();
      const before = mixedQuizState.answered;
      submitMixedQuizSelectAnswer();
      return { mode: quiz.items.filter(item => item.responseMode === 'select').length, before, after: mixedQuizState.answered, select: Boolean(document.getElementById('mixedQuizSelect')) };
    });
    expect(result.mode).toBeGreaterThan(0);
    expect(result.select).toBe(true);
    expect(result.after).toBe(result.before);
  });

  test('submits adaptive typed vocabulary responses and shows immediate feedback', async ({ page }) => {
    await page.goto(appUrl);
    const result = await page.evaluate(() => {
      localStorage.clear();
      const item = {
        questionId: 'typed-vocab-test',
        itemType: 'vocabulary',
        targetType: 'word',
        prompt: 'hei',
        direction: 'no-es',
        responseMode: 'typed',
        acceptedAnswers: [{ answerId: 'hola', value: 'hola' }]
      };
      mixedQuizState = {
        quiz: { items: [item] }, index: 0, answered: 0, correct: 0,
        startedAt: new Date(), results: []
      };
      document.getElementById('mixedQuizStudy').classList.remove('hidden');
      renderMixedQuizQuestion();
      document.getElementById('mixedQuizAnswerInput').value = 'hola';
      submitMixedQuizTypedAnswer();
      return {
        answered: mixedQuizState.answered,
        feedback: document.getElementById('mixedQuizFeedback').textContent,
        nextButton: Boolean(document.querySelector('#mixedQuizFeedback button'))
      };
    });
    expect(result.answered).toBe(1);
    expect(result.feedback).toContain('Riktig');
    expect(result.nextButton).toBe(true);
  });

  test('keeps both select and multiple-choice recognition modes in a deterministic quiz', async ({ page }) => {
    await page.goto(appUrl);
    const modes = await page.evaluate(() => buildMixedQuiz({
      cards: [],
      skillsCatalog: learningCatalog,
      learningProgress: { schemaVersion: 1, wordProgress: {}, skillProgress: {} },
      diagnosis: { status: 'complete', answers: [] },
      now: '2026-08-11T10:00:00.000Z',
      seed: 'mixed-recognition-modes',
      size: 10
    }).items.map(item => item.responseMode));
    expect(modes).toContain('select');
    expect(modes).toContain('choice');
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

  test('shows feedback after every item in a mixed quiz', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      saveDiagnosisState({ schemaVersion: 1, status: 'complete', questionIds: [], answers: [], resultBand: 'A0' });
      const quiz = buildMixedQuiz({
        cards: [],
        skillsCatalog: learningCatalog,
        learningProgress: { schemaVersion: 1, wordProgress: {}, skillProgress: {} },
        diagnosis: { status: 'complete', answers: [] },
        now: '2026-08-11T10:00:00.000Z',
        seed: 'feedback-all-items',
        size: 10
      });
      mixedQuizState = { quiz, index: 0, answered: 0, correct: 0, startedAt: new Date() };
      document.getElementById('mixedQuizStudy').classList.remove('hidden');
      renderMixedQuizQuestion();

      const feedback = [];
      for (let index = 0; index < quiz.items.length; index++) {
        const item = quiz.items[index];
        const answer = item.responseMode === 'choice'
          ? (item.options || [])[0].label
          : getDiagnosisAnswerValue(item.acceptedAnswers[0]);
        submitMixedQuizAnswer(answer);
        feedback.push({
          questionId: item.questionId,
          text: document.getElementById('mixedQuizFeedback')?.textContent || '',
          nextButton: Boolean(document.querySelector('#mixedQuizFeedback button'))
        });
        if (index < quiz.items.length - 1) advanceMixedQuizQuestion();
      }
      return feedback;
    });

    expect(result).toHaveLength(10);
    expect(result.every(item => item.text.trim().length > 0)).toBe(true);
    expect(result.every(item => item.nextButton)).toBe(true);
  });

  test('accepts equivalent synonyms as one correct meaning', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => evaluateDiagnosisAnswer({
      acceptedAnswers: [
        { answerId: 'alumno', value: 'alumno', canonicalMeaningId: 'student' },
        { answerId: 'estudiante', value: 'estudiante', canonicalMeaningId: 'student' }
      ]
    }, 'estudiante'));

    expect(result).toEqual({ resultKind: 'correct', correct: true });
  });

  test('supports an explicit initial-letter constraint', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => ({
      constrained: evaluateDiagnosisAnswer({
        acceptedAnswers: [{ answerId: 'alumno', value: 'alumno', canonicalMeaningId: 'student' }],
        answerConstraint: { type: 'startsWith', value: 'a' }
      }, 'alumno'),
      otherSynonym: evaluateDiagnosisAnswer({
        acceptedAnswers: [
          { answerId: 'alumno', value: 'alumno', canonicalMeaningId: 'student' },
          { answerId: 'estudiante', value: 'estudiante', canonicalMeaningId: 'student' }
        ],
        answerConstraint: { type: 'startsWith', value: 'a' }
      }, 'estudiante')
    }));

    expect(result.constrained).toEqual({ resultKind: 'correct', correct: true });
    expect(result.otherSynonym.resultKind).toBe('near_miss');
    expect(result.otherSynonym.correct).toBe(false);
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
