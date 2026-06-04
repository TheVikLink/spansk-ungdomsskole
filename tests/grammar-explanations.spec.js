import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('grammar mistake explanations', () => {
  test('returns short topic-specific explanations for wrong grammar answers', async ({ page }) => {
    await page.goto(appUrl);

    const explanations = await page.evaluate(() => ({
      articles: getGrammarMistakeExplanation('articles'),
      serEstar: getGrammarMistakeExplanation('serEstar'),
      fallback: getGrammarMistakeExplanation('unknown')
    }));

    expect(explanations.articles).toContain('substantivets kjønn og tall');
    expect(explanations.serEstar).toContain('ser for identitet');
    expect(explanations.fallback).toContain('Se på mønsteret');
  });

  test('shows the explanation when a grammar answer is wrong', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev 12';
      showMainApp();
      currentGrammarTopic = grammarTopics.articles;
      grammarExercises = [{ sentence: '___ casa es grande', answer: 'La', options: ['El', 'La'], hint: 'casa er feminin' }];
      grammarCurrentIndex = 0;
      grammarStats = { correct: 0, total: 1, errors: 0 };
      grammarProgress.articles = { correct: 0, total: 0, recentErrors: 0 };
      document.getElementById('grammarSettings').classList.add('hidden');
      document.getElementById('grammarExercise').classList.remove('hidden');
      showGrammarExercise();
    });

    await page.evaluate(() => {
      const wrongButton = [...document.querySelectorAll('#grammarExerciseArea .grammar-option')]
        .find(button => button.textContent.trim() === 'El');
      selectGrammarAnswer('El', wrongButton);
    });

    await expect(page.locator('#grammarFeedback')).toContainText('Hvorfor?');
    await expect(page.locator('#grammarFeedback')).toContainText('substantivets kjønn og tall');
  });
});
