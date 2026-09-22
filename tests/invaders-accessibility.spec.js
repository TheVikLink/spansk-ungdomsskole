import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test('qhu: Invaders answers are keyboard buttons and reduced motion disables falling', async ({ page }) => {
  await page.goto(appUrl);
  await page.evaluate(() => {
    showMainApp();
    showPage('games');
    viQuestionPool = [{ norwegian: 'Jeg snakker', verbDisplay: 'hablar', correct: 'hablo', wrongs: ['hablas', 'habla'] }];
    viGameActive = true;
    viPickQuestion();
    selectedPrepositions = new Set(['en', 'a la izquierda', 'a la derecha']);
    piGameActive = true;
    piPickQuestion();
  });

  for (const selector of ['#viCard0', '#viCard1', '#viCard2', '#piCard0', '#piCard1', '#piCard2']) {
    const card = page.locator(selector);
    await expect(card).toHaveRole('button');
    await expect(card).toHaveAttribute('aria-label', /Svar [123]: .+/);
    await card.focus();
    await page.keyboard.press('Enter');
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const state = await page.evaluate(() => {
    viAnswering = false;
    piAnswering = false;
    viStartFalling();
    piStartFalling();
    return { viFallAnimId, piFallAnimId };
  });
  expect(state.viFallAnimId).toBeNull();
  expect(state.piFallAnimId).toBeNull();
});
