import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('vocabulary category cleanup', () => {
  test('does not expose legacy chapter-focused queues', async ({ page }) => {
    await page.goto(appUrl);

    const queue = await page.evaluate(() => {
      return {
        options: chapterFocusOptions,
        unknownQueue: buildChapterFocusQueue('kapittel-8-tareas')
      };
    });

    expect(queue.options).toEqual([]);
    expect(queue.unknownQueue).toEqual([]);
  });

  test('keeps the learner-facing vocabulary launcher free of legacy chapter buttons', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev 5';
      showMainApp();
      showPage('vocab');
    });

    await expect(page.getByRole('button', { name: /Lære nye ord Start en kort økt/ })).toBeVisible();
    await expect(page.locator('[data-chapter-focus]')).toHaveCount(0);
    await expect(page.locator('text=Kapittel 7')).toHaveCount(0);
    await expect(page.locator('text=Kapittel 8')).toHaveCount(0);
  });
});
