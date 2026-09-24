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
