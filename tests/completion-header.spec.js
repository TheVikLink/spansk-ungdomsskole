import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('practice completion headers', () => {
  test('grammar completion header matches final summary', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      showPage('grammar');
      currentGrammarTopic = grammarTopics.articles;
      document.getElementById('grammarSettings').classList.add('hidden');
      document.getElementById('grammarExercise').classList.remove('hidden');
      grammarExercises = currentGrammarTopic.exercises.slice(0, 10);
      grammarStats = { correct: 9, total: 10, errors: 1 };
      grammarCurrentIndex = 10;
      endGrammarSession();
    });

    await expect(page.locator('#grammarProgressFill')).toHaveAttribute('style', /width:\s*100%/);
    await expect(page.locator('#grammarSessionStats')).toHaveText('9 / 10 riktig');
    await expect(page.locator('#grammarCounter')).toHaveText('10 / 10');
    await expect(page.locator('#grammarExerciseArea .session-stat-value').nth(0)).toHaveText('9');
    await expect(page.locator('#grammarExerciseArea .session-stat-value').nth(1)).toHaveText('10');
    await expect(page.locator('#grammarExerciseArea .session-stat-value').nth(2)).toHaveText('90%');
  });

  test('verb completion header matches final summary', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      showPage('verbs');
      document.getElementById('verbSettings').classList.add('hidden');
      document.getElementById('verbExercise').classList.remove('hidden');
      verbStats = { correct: 7, total: 10 };
      verbCurrentIndex = 10;
      endVerbSession();
    });

    await expect(page.locator('#verbProgressFill')).toHaveAttribute('style', /width:\s*100%/);
    await expect(page.locator('#verbSessionStats')).toHaveText('7 / 10 riktig');
    await expect(page.locator('#verbCounter')).toHaveText('10 / 10');
    await expect(page.locator('#verbExerciseArea .session-stat-value').nth(0)).toHaveText('7');
    await expect(page.locator('#verbExerciseArea .session-stat-value').nth(1)).toHaveText('10');
    await expect(page.locator('#verbExerciseArea .session-stat-value').nth(2)).toHaveText('70%');
  });
});
