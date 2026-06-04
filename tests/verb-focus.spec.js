import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('verb focus categories', () => {
  test('offers stem-changing verb focus groups with matching selected verbs', async ({ page }) => {
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

    const selections = await page.evaluate(() => {
      const focusIds = ['stem-e-ie', 'stem-o-ue', 'stem-e-i'];
      return Object.fromEntries(focusIds.map(focus => {
        selectVerbFocus(focus);
        return [focus, [...selectedVerbs].sort()];
      }));
    });

    expect(selections).toEqual({
      'stem-e-ie': ['empezar', 'entender', 'preferir', 'querer', 'tener', 'venir'],
      'stem-o-ue': ['dormir', 'poder', 'volver'],
      'stem-e-i': ['decir', 'pedir', 'repetir', 'servir']
    });
  });
});
