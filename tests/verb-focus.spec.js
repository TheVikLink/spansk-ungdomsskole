import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('verb focus categories', () => {
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
});
