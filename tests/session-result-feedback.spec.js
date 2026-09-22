import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();
const areas = { grammar: '#grammarExerciseArea', verbs: '#verbExerciseArea', vocabulary: '#flashcardArea', quiz: '#mixedQuizQuestion' };
async function submitGrammarAnswer(page, answer) {
  const choice = page.locator('.grammar-option').filter({ hasText: answer }).getByText(answer, { exact: true });
  if (await choice.count()) return choice.click();
  const select = page.locator('#grammarSelect');
  if (await select.count()) {
    await select.selectOption({ label: answer });
    return page.locator('#grammarSubmitBtn').click();
  }
  await page.locator('#grammarAnswerInput').fill(answer);
  return page.locator('#grammarSubmitBtn').click();
}
const cases = [
  { name: 'all correct', correct: 14, answered: 14, planned: 14, message: 'Du svarte riktig på alle oppgavene.', cards: 'Alle 14 kortforsøk er registrert som riktige.' },
  { name: 'one mistake', correct: 13, answered: 14, planned: 14, message: 'Du svarte riktig på 13 av 14 oppgaver.', cards: '13 av 14 kortforsøk er registrert som riktige.' },
  { name: 'rounded percentage is not all correct', correct: 199, answered: 200, planned: 200, message: 'Du svarte riktig på 199 av 200 oppgaver.', cards: '199 av 200 kortforsøk er registrert som riktige.' },
  { name: 'one answer then stop', correct: 1, answered: 1, planned: 14, message: 'Du svarte riktig på oppgaven du besvarte.', cards: 'Kortforsøket er registrert som riktig.' },
  { name: 'no answers', correct: 0, answered: 0, planned: 14, message: 'Ingen svar ennå.', cards: 'Ingen kortforsøk ennå.' }
];

async function boot(page) {
  await page.goto(appUrl);
  await page.evaluate(() => { studentName = 'Test'; showMainApp(); });
}

for (const mode of Object.keys(areas)) {
  for (const scenario of cases) {
    test(`${mode}: ${scenario.name} gets an accurate result message`, async ({ page }) => {
      await boot(page);
      await page.evaluate(({ mode, correct, answered, planned }) => {
        if (mode === 'grammar') {
          showPage('grammar'); currentGrammarTopic = grammarTopics.articles; startGrammarExercises();
          grammarSession.answers = Array.from({ length: answered }, (_, i) => ({ correct: i < correct }));
          grammarSession.plannedCount = planned;
          endGrammarSession();
        } else if (mode === 'verbs') {
          showPage('verbs'); selectedVerbs = new Set(['hablar']); startVerbSession();
          verbStats = { correct, answered, total: planned }; endVerbSession();
        } else if (mode === 'vocabulary') {
          showPage('vocab'); startVocabSession('new', cards.slice(0, 1));
          sessionStats = { correct, reviewed: answered, newLearned: 0 }; endVocabSession();
        } else {
          showPage('vocab'); startBrainmapSkillPractice('a0.articles.definite_singular');
          mixedQuizState.answered = answered; mixedQuizState.correct = correct;
          mixedQuizState.quiz.items = Array.from({ length: planned }, () => ({}));
          finishMixedQuiz();
        }
      }, { mode, ...scenario });
      const area = page.locator(areas[mode]);
      await expect(area.locator('[data-practice-result-message]')).toContainText(mode === 'vocabulary' ? scenario.cards : scenario.message);
      await expect(area).not.toContainText('de fleste');
      if (scenario.answered === 0) {
        await expect(area).not.toContainText('100%');
        await expect(area).not.toContainText('0%');
        await expect(area).not.toContainText('🎉');
      }
    });
  }
}

for (const width of [1440, 390]) {
  test(`article template: 14 real answers, theory return and next practice at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(appUrl);
    await page.locator('#studentNameInput').fill('Test');
    await page.locator('.login-btn-primary').click();
    await page.locator('#navGrammar').click();
    await page.locator('.grammar-topic-card[onclick="startGrammarTopic(\'articles\')"] .grammar-topic-theory-link').click();
    await page.locator('#grammarLessonContent .grammar-lesson-actions button').click();
    expect(await page.evaluate(() => grammarExercises.length)).toBe(14);
    for (let i = 0; i < 14; i++) {
      const answer = await page.evaluate(() => grammarExercises[grammarCurrentIndex].answer);
      await submitGrammarAnswer(page, answer);
      await page.locator('#grammarExerciseArea').getByRole('button', { name: /Vis hint/ }).click();
      await page.locator('#grammarFeedback [data-feedback-next]').click();
    }
    const result = page.locator('#grammarExerciseArea');
    await expect(result).toContainText('14 av 14 oppgaver besvart.');
    await expect(result).toContainText('Du svarte riktig på alle oppgavene.');
    const before = await page.evaluate(() => { const { exportDate, ...data } = buildProgressExportData(); return data; });
    await result.getByRole('button', { name: 'Lær mer: Velg el, la, los eller las', exact: true }).click();
    await page.getByRole('button', { name: /Tilbake til resultatet/ }).click();
    await expect(result).toContainText('Du svarte riktig på alle oppgavene.');
    expect(await page.evaluate(() => { const { exportDate, ...data } = buildProgressExportData(); return data; })).toEqual(before);
    await page.screenshot({ path: testInfo.outputPath(`result-all-correct-${width}.png`), fullPage: true });
    await result.getByRole('button', { name: /Øv mer/ }).click();
    await expect(page.locator('#grammarCounter')).toContainText('1 /');
    expect(await page.evaluate(() => practiceHistory.reduce((n, entry) => n + entry.words, 0))).toBe(14);
  });
}

test('every grammar topic uses the same accurate completion template', async ({ page }) => {
  await boot(page);
  const topics = await page.evaluate(() => Object.keys(grammarTopics));
  expect(topics.length).toBeGreaterThan(5);
  for (const topic of topics) {
    await page.evaluate(topic => {
      showPage('grammar'); currentGrammarTopic = grammarTopics[topic]; startGrammarExercises();
      grammarSession.answers = grammarExercises.map(exercise => ({ ...exercise, correct: true }));
      endGrammarSession();
    }, topic);
    const result = page.locator('#grammarExerciseArea');
    await expect(result.locator('[data-practice-result-message]')).toContainText('Du svarte riktig på alle oppgavene.');
    await expect(result.getByRole('button', { name: /Øv mer/ })).toBeVisible();
    await expect(result.getByRole('button', { name: /Velg tema/ })).toBeVisible();
  }
});
