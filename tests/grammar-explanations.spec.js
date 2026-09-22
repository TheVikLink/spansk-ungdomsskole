import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('grammar mistake explanations', () => {
  test('grammar exercises show meaning context and no hidden distance hacks', async ({ page }) => {
    await page.goto(appUrl);
    const result = await page.evaluate(() => ['gustar', 'demonstratives', 'possessives'].map(topicId => ({
      topicId,
      missingContext: grammarTopics[topicId].exercises.filter(exercise => !exercise.no).length,
      hiddenDistanceHints: grammarTopics[topicId].exercises.filter(exercise => /der borte/i.test(exercise.sentence)).length
    })));

    expect(result).toEqual([
      { topicId: 'gustar', missingContext: 0, hiddenDistanceHints: 0 },
      { topicId: 'demonstratives', missingContext: 0, hiddenDistanceHints: 0 },
      { topicId: 'possessives', missingContext: 0, hiddenDistanceHints: 0 }
    ]);
  });

  test('uses topic-specific scaffolds for demonstratives and possessives', async ({ page }) => {
    await page.goto(appUrl);
    const result = await page.evaluate(() => ({
      demonstratives: getGrammarScaffold(grammarTopics.demonstratives).prompt,
      possessives: getGrammarScaffold(grammarTopics.possessives).prompt
    }));

    expect(result.demonstratives).toContain('Pekende');
    expect(result.possessives).toContain('Eiendomsord');
  });

  test('keeps correct-answer feedback visible until the learner advances', async ({ page }) => {
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
      [...document.querySelectorAll('#grammarExerciseArea .grammar-option')]
        .find(button => button.textContent.trim() === 'La')
        .click();
    });

    await expect(page.locator('#grammarFeedback')).toContainText('Riktig');
    await expect(page.locator('#grammarNextBtn')).toHaveCount(1);
  });

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

  test('teaches ser and estar by function rather than a permanent-temporary shortcut', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => ({
      serTranslation: verbDatabase.ser.translation,
      theory: grammarTopics.serEstar.theory.content,
      feedback: getGrammarMistakeExplanation('serEstar'),
      eventExercise: grammarTopics.serEstar.exercises.find(exercise => exercise.sentence === 'La fiesta ___ el sábado'),
      present: getVerbMeaning(verbDatabase.ser.translation, 'yo'),
      future: getNorwegianInfinitive(verbDatabase.ser.translation),
      perfect: getNorwegianPerfectum(verbDatabase.ser.translation)
    }));

    expect(result.serTranslation).toBe('å være (identitet, beskrivelse og når noe skjer)');
    expect(result.theory).not.toMatch(/permanent|midlertidig/i);
    expect(result.feedback).not.toMatch(/varige|midlertidige/i);
    expect(result.eventExercise).toMatchObject({ answer: 'es', hint: 'Når noe skjer = SER' });
    expect(result).toMatchObject({ present: 'er', future: 'være', perfect: 'vært' });
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

  test('keeps wrong-answer explanation until the student advances', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev 12';
      showMainApp();
      currentGrammarTopic = grammarTopics.articles;
      grammarExercises = [
        { sentence: '___ casa es grande', answer: 'La', options: ['El', 'La'], hint: 'casa er feminin' },
        { sentence: '___ chico es alto', answer: 'El', options: ['El', 'La'], hint: 'chico er maskulin' }
      ];
      grammarCurrentIndex = 0;
      grammarStats = { correct: 0, total: 2, errors: 0 };
      grammarProgress.articles = { correct: 0, total: 0, recentErrors: 0 };
      document.getElementById('grammarSettings').classList.add('hidden');
      document.getElementById('grammarExercise').classList.remove('hidden');
      showGrammarExercise();
    });

    await page.evaluate(() => {
      const wrongButton = [...document.querySelectorAll('#grammarExerciseArea .grammar-option')]
        .find(button => button.textContent.trim() === 'El');
      wrongButton.click();
    });
    await expect(page.locator('#grammarFeedback')).toContainText('Hvorfor?');
    await page.waitForTimeout(3000);
    await expect(page.locator('#grammarFeedback')).toContainText('Hvorfor?');
    await expect(page.locator('#grammarExerciseArea')).toContainText('casa');

    await page.keyboard.press('Enter');
    await expect(page.locator('#grammarExerciseArea')).toContainText('chico');
  });
});
