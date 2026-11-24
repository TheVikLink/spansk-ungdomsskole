import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('verb focus categories', () => {
  test('recommends a small regular -ar session before any local verb evidence exists', async ({ page }) => {
    await page.goto(appUrl);

    const recommendation = await page.evaluate(() => getRecommendedVerbPractice({
      schemaVersion: 1,
      wordProgress: {},
      skillProgress: {}
    }));

    expect(recommendation).toMatchObject({
      focus: 'ar',
      tense: 'presente',
      verbKeys: ['hablar', 'trabajar', 'estudiar'],
      reason: 'Start med vanlige -ar-verb i presens.'
    });
  });

  test('moves to regular -er and -ir verbs only after varied -ar evidence', async ({ page }) => {
    await page.goto(appUrl);

    const recommendation = await page.evaluate(() => getRecommendedVerbPractice({
      schemaVersion: 1,
      wordProgress: {},
      skillProgress: {
        'a1.verbs.regular_ar.present': {
          strength: 4,
          attempts: 6,
          correct: 6,
          verbForms: ['hablar:0', 'hablar:1', 'hablar:2', 'trabajar:3', 'trabajar:4', 'trabajar:5']
        }
      }
    }));

    expect(recommendation).toMatchObject({
      focus: 'erir',
      tense: 'presente',
      verbKeys: ['comer', 'beber', 'vivir']
    });
  });

  test('starts the locally recommended verb session and explains the choice', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Test';
      showMainApp();
      showPage('verbs');
    });

    await expect(page.locator('#startRecommendedVerbBtn')).toContainText('Start anbefalt økt');
    await expect(page.locator('#recommendedVerbPracticeReason')).toContainText('Start med vanlige -ar-verb');
    await page.locator('#startRecommendedVerbBtn').click();
    await expect(page.locator('#verbExercise')).not.toHaveClass(/hidden/);
    expect(await page.evaluate(() => [...selectedVerbs].sort())).toEqual(['estudiar', 'hablar', 'trabajar']);
  });

  test('advances the feed from present to near future and then present perfect', async ({ page }) => {
    await page.goto(appUrl);
    const recommendations = await page.evaluate(() => {
      const today = new Date('2026-11-24T12:00:00Z');
      const progress = normalizeLearningProgress(null);
      const recommend = () => getRecommendedFeedVerbPractice(progress, today);
      const verify = ([skillId]) => {
        progress.skillProgress[skillId] = {
          strength: 5,
          attempts: 7,
          correct: 7,
          dueAt: '2026-12-01T12:00:00Z',
          verbRecall: { firstAt: '2026-11-23T12:00:00Z', verifiedAt: today.toISOString(), forms: [] }
        };
      };
      const fresh = recommend();
      feedVerbStages[0].forEach(verify);
      const future = recommend();
      feedVerbStages[1].forEach(verify);
      const perfect = recommend();
      progress.skillProgress['a1.verbs.regular_ar.present'].strength = 2;
      const review = recommend();
      return [fresh, future, perfect, review].map(({ skillId, tense, exercises }) => ({
        skillId, tense, count: exercises.length, people: new Set(exercises.map(exercise => exercise.pronounIndex)).size
      }));
    });
    expect(recommendations).toEqual([
      { skillId: 'a1.verbs.regular_ar.present', tense: 'presente', count: 6, people: 6 },
      { skillId: 'verbs.near_future', tense: 'futuro', count: 6, people: 6 },
      { skillId: 'verbs.perfect.regular', tense: 'perfecto', count: 6, people: 6 },
      { skillId: 'a1.verbs.regular_ar.present', tense: 'presente', count: 6, people: 6 }
    ]);
  });

  test('requires varied, unassisted recall on a later day and restores it from a local backup', async ({ page }) => {
    await page.goto(appUrl);
    const checks = await page.evaluate(() => {
      const skillId = 'verbs.near_future';
      const firstDay = '2026-11-23T12:00:00Z';
      const laterDay = '2026-11-24T12:00:00Z';
      let progress = normalizeLearningProgress(null);
      const answer = (form, nowIso, unassisted = true) => {
        progress = updateLearningProgress({
          progress, targetType: 'skill', targetId: skillId, resultKind: 'correct',
          verbForm: form, verbTense: 'futuro', verbUnassisted: unassisted, nowIso
        });
      };
      const forms = ['hablar:0', 'vivir:1', 'hablar:2', 'vivir:3', 'hablar:5', 'vivir:4'];
      forms.forEach(form => answer(form, firstDay));
      const firstDayRecall = progress.skillProgress[skillId].verbRecall;
      answer('hablar:0', laterDay, false);
      const assisted = progress.skillProgress[skillId].verbRecall.verifiedAt;
      answer('hablar:0', laterDay);
      saveLearningProgress(progress);
      const backup = JSON.parse(JSON.stringify(buildProgressExportData()));
      localStorage.removeItem(LEARNING_PROGRESS_KEY);
      const imported = importProgressData(backup).imported;
      return { firstDayRecall, assisted, imported };
    });
    expect(checks.firstDayRecall.forms).toHaveLength(6);
    expect(checks.firstDayRecall.verifiedAt).toBeNull();
    expect(checks.assisted).toBeNull();
    expect(checks.imported).toBe(true);
    await page.reload();
    expect(await page.evaluate(() => loadLearningProgress().skillProgress['verbs.near_future'].verbRecall.verifiedAt))
      .toBe('2026-11-24T12:00:00Z');
  });

  test('opens a short verb session from home and credits a typed future form', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      studentName = 'Elev';
      showMainApp();
      const future = getRecommendedFeedVerbPractice({
        skillProgress: Object.fromEntries(feedVerbStages[0].map(([id]) =>
          [id, { strength: 5, verbRecall: { verifiedAt: '2026-11-24T12:00:00Z' } }]))
      });
      startRecommendedFeedVerbPractice(future);
    });
    await expect(page.locator('#verbExercise')).toBeVisible();
    await expect(page.locator('.conjugation-prompt')).toContainText('Mañana');
    await expect(page.locator('.verb-choice-btn')).toHaveCount(0);
    const input = page.locator('#verbInput');
    await input.fill(await input.getAttribute('data-expected'));
    await page.getByRole('button', { name: 'Sjekk svar' }).click();
    const future = await page.evaluate(() => loadLearningProgress().skillProgress['verbs.near_future']);
    expect(future.correct).toBe(1);
    expect(future.verbRecall.forms).toHaveLength(1);
  });

  test('allows multiple stem-changing verb focus groups at the same time', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev 9';
      showMainApp();
      showPage('verbs');
    });

    await expect(page.locator('[data-verb-focus="stem-e-ie"]')).toContainText('Stammeendring e→ie');
    await expect(page.locator('[data-verb-focus="stem-o-ue"]')).toContainText('Stammeendring o→ue');
    await expect(page.locator('[data-verb-focus="stem-e-i"]')).toContainText('Stammeendring e→i');

    const selection = await page.evaluate(() => {
      selectVerbFocus('stem-e-ie');
      selectVerbFocus('stem-o-ue');
      selectVerbFocus('stem-e-i');

      return {
        focuses: [...selectedVerbFocuses].sort(),
        verbs: [...selectedVerbs].sort(),
        pressed: Object.fromEntries([...document.querySelectorAll('.verb-focus-card')]
          .map(button => [button.dataset.verbFocus, button.getAttribute('aria-pressed')]))
      };
    });

    expect(selection.focuses).toEqual(['stem-e-i', 'stem-e-ie', 'stem-o-ue']);
    expect(selection.verbs).toEqual([
      'comenzar',
      'decir',
      'dormir',
      'empezar',
      'entender',
      'pedir',
      'poder',
      'preferir',
      'querer',
      'repetir',
      'servir',
      'tener',
      'venir',
      'volver'
    ]);
    expect(selection.pressed).toMatchObject({
      'stem-e-ie': 'true',
      'stem-o-ue': 'true',
      'stem-e-i': 'true',
      ar: 'false'
    });
  });

  test('classifies missing verb accents as near misses without treating ñ as an accent', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => ({
      vosotrosAr: evaluateTypedAnswer('hablais', 'habláis'),
      vosotrosIr: evaluateTypedAnswer('vivis', 'vivís'),
      doubleSpace: evaluateTypedAnswer('  hablo  ', 'hablo'),
      enye: evaluateTypedAnswer('ano', 'año'),
      wrong: evaluateTypedAnswer('comes', 'hablas')
    }));

    expect(result).toEqual({
      vosotrosAr: { resultKind: 'accent_or_case_variant', correct: false },
      vosotrosIr: { resultKind: 'accent_or_case_variant', correct: false },
      doubleSpace: { resultKind: 'correct', correct: true },
      enye: { resultKind: 'wrong', correct: false },
      wrong: { resultKind: 'wrong', correct: false }
    });
  });
});
