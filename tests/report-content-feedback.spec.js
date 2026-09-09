import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test('F05: the profession task produces a valid sentence and states its article constraint', async ({ page }) => {
  await page.goto(appUrl);
  const sentence = await page.evaluate(() => {
    studentName = 'Test';
    showMainApp();
    showPage('grammar');
    currentGrammarTopic = grammarTopics.a0Foundation;
    startGrammarExercises();
    grammarCurrentIndex = grammarExercises.findIndex(item => item.skillId === 'a0.professions.zero_article');
    showGrammarExercise();
    const exercise = grammarExercises[grammarCurrentIndex];
    return exercise.sentence.replace('___', exercise.answer);
  });
  expect(sentence).toBe('Mi madre es profesora');
  const quizInstruction = await page.evaluate(() => buildGrammarSkillCandidates().find(item => item.targetId === 'a0.professions.zero_article').instructionNb);
  expect(quizInstruction).toContain('uten artikkel');
  await expect(page.locator('#grammarExerciseArea')).toContainText('uten artikkel');
  await page.getByRole('button', { name: 'profesora', exact: true }).click();
  await expect(page.locator('#grammarFeedback')).toContainText('Riktig');
});

test('F10: every pilot grammar answer has an explanation tied to its sentence', async ({ page }) => {
  await page.goto(appUrl);
  const explanations = await page.evaluate(() => {
    studentName = 'Test';
    showMainApp();
    showPage('grammar');
    currentGrammarTopic = grammarTopics.hayEstar;
    startGrammarExercises();
    grammarCurrentIndex = grammarExercises.findIndex(item => item.sentence === '___ dos ventanas en el aula');
    showGrammarExercise();
    return Object.values(grammarTopics).flatMap(topic => topic.exercises.map(exercise => ({
      sentence: exercise.sentence, explanation: exercise.hint || exercise.explanation || ''
    })));
  });
  await page.getByRole('button', { name: 'Está', exact: true }).click();
  const feedback = page.locator('#grammarFeedback');
  await expect(feedback).not.toContainText('undefined');
  await expect(feedback).toContainText('hay');
  await expect(feedback).toContainText('dos ventanas');
  expect(explanations.filter(item => !item.explanation.trim())).toEqual([]);
});

test('F10: A0 theory covers the actual tasks and hay/estar examples stay about location', async ({ page }) => {
  await page.goto(appUrl);
  const content = await page.evaluate(() => ({
    foundation: grammarTopics.a0Foundation.theory.content,
    contrast: grammarTopics.hayEstar.exercises.map(item => item.sentence),
    lessons: document.getElementById('grammar-lessons-data')?.textContent || ''
  }));
  for (const term of ['tengo', 'vivo', 'trabajo', 'hay', 'profesora']) expect(content.foundation.toLowerCase()).toContain(term);
  expect(content.contrast.every(sentence => !sentence.includes('abiertas'))).toBe(true);
  expect(content.lessons).not.toContain('ventanas están abiertas');
});

test('F16: empty and fragment dictation answers get modest, distinct feedback', async ({ page }) => {
  await page.goto(appUrl);
  const evaluations = await page.evaluate(() => ['', 'a', 'Camina', 'Camina hasta', 'Camina hasta la plaza.', 'Camina, hasta la plaza.', 'Camina hasta la plasa.', 'Camina hasta la plaza de Madrid.']
    .map(answer => compareDictationAnswer(answer, 'Camina hasta la plaza.')));
  expect(evaluations).toEqual(['empty', 'incomplete', 'incomplete', 'incomplete', 'exact', 'punctuation', 'different', 'different']);
  await page.evaluate(() => {
    studentName = 'Test';
    showMainApp();
    showPage('dictation');
    startDictation(DICTATION_STORIES.find(story => story.audioDir).id);
  });
  await page.getByRole('button', { name: 'Start øvelsen', exact: true }).click();
  await page.locator('#dictationAnswer').fill('a');
  await page.locator('#dictationExercise').getByRole('button', { name: 'Sjekk svar', exact: true }).click();
  await expect(page.locator('#dictationSolution')).not.toContainText('Veldig nærme');
  await expect(page.locator('#dictationSolution')).toContainText('ufullstendig');
});
