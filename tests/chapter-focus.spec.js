import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('chapter-focused vocabulary practice', () => {
  test('keeps due reviews from all categories and adds weak chapter cards only', async ({ page }) => {
    await page.goto(appUrl);

    const queue = await page.evaluate(() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      cards = [
        {
          id: 1,
          no: 'utenfor kapittel',
          es: 'fuera',
          category: 'farger',
          noEs: { repetitions: 2, nextReview: yesterday.toISOString() },
          esNo: { repetitions: 0, nextReview: null }
        },
        {
          id: 2,
          no: 'å vaske opp',
          es: 'lavar los platos',
          category: 'Kapittel 8: Tareas de casa',
          noEs: { repetitions: 0, nextReview: null },
          esNo: { repetitions: 0, nextReview: null }
        },
        {
          id: 3,
          no: 'hver uke',
          es: 'cada semana',
          category: 'Kapittel 8: Tareas de casa',
          noEs: { repetitions: 2, nextReview: nextWeek.toISOString() },
          esNo: { repetitions: 3, nextReview: nextWeek.toISOString() }
        },
        {
          id: 4,
          no: 'utenfor nytt',
          es: 'nuevo fuera',
          category: 'land',
          noEs: { repetitions: 0, nextReview: null },
          esNo: { repetitions: 0, nextReview: null }
        }
      ];

      return buildChapterFocusQueue('kapittel-8-tareas', { newLimit: 10, reviewLimit: 10 })
        .map(item => ({ id: item.card.id, direction: item.direction }));
    });

    expect(queue).toContainEqual({ id: 1, direction: 'no-es' });
    expect(queue).toContainEqual({ id: 2, direction: 'no-es' });
    expect(queue).toContainEqual({ id: 2, direction: 'es-no' });
    expect(queue).toContainEqual({ id: 3, direction: 'no-es' });
    expect(queue).not.toContainEqual({ id: 3, direction: 'es-no' });
    expect(queue).not.toContainEqual({ id: 4, direction: 'no-es' });
    expect(queue).not.toContainEqual({ id: 4, direction: 'es-no' });
  });

  test('shows chapter focus buttons and starts a chapter session', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev 5';
      showMainApp();
      showPage('vocab');
    });

    await expect(page.getByRole('button', { name: /Lære nye ord Start en kort økt/ })).toBeVisible();
    const chapterButton = page.locator('[data-chapter-focus="kapittel-8-tareas"]');
    await expect(chapterButton).toContainText('Kapittel 8: Tareas de casa');

    await chapterButton.click();

    await expect(page.locator('#vocabStudy')).toBeVisible();
    await expect(page.locator('#flashcardArea .card-category')).toContainText('Kapittel 8: Tareas de casa');
  });
});
