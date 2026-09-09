import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('Lingo Links game', () => {
  test('replaces the Glose-duell placeholder and starts with a 4x4 board', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      showMainApp();
      showPage('games');
    });

    await expect(page.getByRole('button', { name: /Lingo Links/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Glose-duell/ })).toHaveCount(0);

    await page.getByRole('button', { name: /Lingo Links/ }).click();
    await expect(page.locator('#lingoLinksSetup')).toBeVisible();
    await page.getByRole('button', { name: /Start Lingo Links/ }).click();

    await expect(page.locator('#lingoLinksGame')).toBeVisible();
    await expect(page.locator('[data-ll-card]')).toHaveCount(16);

    const board = await page.evaluate(() => ({
      cards: lingoLinksState.cards.length,
      groups: lingoLinksState.groups.length,
      visibleCategoryLabels: document.querySelectorAll('[data-ll-category]').length,
      uniqueCards: new Set(lingoLinksState.cards.map(card => card.id)).size
    }));

    expect(board).toEqual({ cards: 16, groups: 4, visibleCategoryLabels: 0, uniqueCards: 16 });
  });

  test('solves a group, counts a wrong guess, and shows a hint after three mistakes', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      showMainApp();
      showPage('games');
      showGameSetup('lingo-links');
      lingoLinksState = {
        cards: [
          { id: 'a1', es: 'uno', category: 'tall' },
          { id: 'a2', es: 'dos', category: 'tall' },
          { id: 'a3', es: 'tres', category: 'tall' },
          { id: 'a4', es: 'cuatro', category: 'tall' },
          { id: 'b1', es: 'rojo', category: 'farger' },
          { id: 'b2', es: 'azul', category: 'farger' },
          { id: 'b3', es: 'verde', category: 'farger' },
          { id: 'b4', es: 'negro', category: 'farger' },
          { id: 'c1', es: 'lunes', category: 'dager' },
          { id: 'c2', es: 'martes', category: 'dager' },
          { id: 'c3', es: 'miércoles', category: 'dager' },
          { id: 'c4', es: 'jueves', category: 'dager' },
          { id: 'd1', es: 'uno', category: 'test' },
          { id: 'd2', es: 'dos', category: 'test' },
          { id: 'd3', es: 'tres', category: 'test' },
          { id: 'd4', es: 'cuatro', category: 'test' }
        ],
        groups: [
          { category: 'tall', cards: ['a1', 'a2', 'a3', 'a4'] },
          { category: 'farger', cards: ['b1', 'b2', 'b3', 'b4'] },
          { category: 'dager', cards: ['c1', 'c2', 'c3', 'c4'] },
          { category: 'test', cards: ['d1', 'd2', 'd3', 'd4'] }
        ],
        selectedIds: [], solvedCategories: [], mistakes: 0, hintShown: false, complete: false
      };
      document.getElementById('lingoLinksSetup').classList.add('hidden');
      document.getElementById('lingoLinksGame').classList.remove('hidden');
      renderLingoLinksBoard();
      lingoLinksState.selectedIds = ['a1', 'a2', 'a3', 'b1'];
      renderLingoLinksBoard();
      submitLingoLinksGroup();
      const wrongMistakes = lingoLinksState.mistakes;
      for (let i = 0; i < 2; i++) {
        lingoLinksState.selectedIds = ['b1', 'b2', 'c1', 'c2'];
        submitLingoLinksGroup();
      }
      const afterHint = {
        wrongMistakes,
        mistakes: lingoLinksState.mistakes,
        hintShown: lingoLinksState.hintShown,
        feedback: document.getElementById('lingoLinksFeedback').textContent
      };
      lingoLinksState.selectedIds = ['a1', 'a2', 'a3', 'a4'];
      renderLingoLinksBoard();
      submitLingoLinksGroup();
      return { afterHint, solved: lingoLinksState.solvedCategories };
    });

    expect(result.afterHint).toMatchObject({ wrongMistakes: 1, mistakes: 3, hintShown: true });
    expect(result.afterHint.feedback).toContain('Hint');
    expect(result.solved).toContain('tall');
  });

  test('keeps the final solved group and its correct feedback visible until the student opens the result', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      showMainApp();
      showPage('games');
      lingoLinksState = {
        cards: [
          { id: 'a1', es: 'llueve', category: 'vær' },
          { id: 'a2', es: 'nieva', category: 'vær' },
          { id: 'a3', es: 'hace sol', category: 'vær' },
          { id: 'a4', es: 'hace frío', category: 'vær' }
        ],
        groups: [{ category: 'vær', cards: ['a1', 'a2', 'a3', 'a4'] }],
        selectedIds: ['a1', 'a2', 'a3', 'a4'], solvedCategories: [], mistakes: 0, hintShown: false, complete: false
      };
      document.getElementById('lingoLinksSetup').classList.add('hidden');
      document.getElementById('lingoLinksComplete').classList.add('hidden');
      document.getElementById('lingoLinksGame').classList.remove('hidden');
      submitLingoLinksGroup();
    });

    await expect(page.locator('#lingoLinksGame')).toBeVisible();
    await expect(page.locator('#lingoLinksComplete')).toBeHidden();
    await expect(page.locator('#lingoLinksFeedback')).toContainText('vær og årstider');
    await expect(page.locator('[data-ll-card]')).toHaveCount(4);
    await expect(page.getByRole('button', { name: 'Se resultat' })).toBeVisible();

    await page.getByRole('button', { name: 'Se resultat' }).click();
    await expect(page.locator('#lingoLinksComplete')).toBeVisible();
  });

  test('clears feedback from the previous round when a new Lingo Links round starts', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      showMainApp();
      showPage('games');
      document.getElementById('lingoLinksFeedback').textContent = 'Ikke helt. Prøv å finne en annen sammenheng.';
      document.getElementById('lingoLinksFeedback').className = 'mt-4 min-h-8 text-sm text-rose-700';
      startLingoLinks();
    });

    await expect(page.locator('#lingoLinksFeedback')).toBeEmpty();
    await expect(page.locator('#lingoLinksFeedback')).toHaveClass(/min-h-8 text-sm$/);
  });

  test('keeps the game usable at a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      showMainApp();
      showPage('games');
      showGameSetup('lingo-links');
      lingoLinksState = {
        cards: Array.from({ length: 16 }, (_, index) => ({ id: `card-${index}`, es: `ord ${index}`, category: `gruppe-${Math.floor(index / 4)}` })),
        groups: Array.from({ length: 4 }, (_, group) => ({ category: `gruppe-${group}`, cards: Array.from({ length: 4 }, (_, offset) => `card-${group * 4 + offset}`) })),
        selectedIds: [], solvedCategories: [], mistakes: 0, hintShown: false, complete: false
      };
      document.getElementById('lingoLinksSetup').classList.add('hidden');
      document.getElementById('lingoLinksGame').classList.remove('hidden');
      renderLingoLinksBoard();
    });

    await expect(page.locator('[data-ll-card]')).toHaveCount(16);
    const layout = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(layout.width).toBeLessThanOrEqual(layout.viewport);
  });
});
