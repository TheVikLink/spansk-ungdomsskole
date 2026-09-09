import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

async function openPractice(page, kind) {
  await page.goto(appUrl);
  await page.evaluate(kind => {
    studentName = 'Test';
    showMainApp();
    showPage(kind === 'verb' ? 'verbs' : 'grammar');
    if (kind === 'verb') {
      selectedVerbs = new Set(['hablar']);
      startVerbSession();
    } else {
      currentGrammarTopic = grammarTopics.articles;
      startGrammarExercises();
    }
  }, kind);
}

for (const kind of ['verb', 'grammar']) {
  for (const correct of [true, false]) {
    test(`F01: ${kind} keeps feedback and Next after a ${correct ? 'correct' : 'wrong'} answer and repeated hints`, async ({ page }) => {
      await openPractice(page, kind);
      if (kind === 'verb') {
        const answer = await page.locator('#verbInput').getAttribute('data-expected');
        await page.locator('#verbInput').fill(correct ? answer : 'feil');
        await page.locator('#verbExerciseArea').getByRole('button', { name: 'Sjekk svar' }).click();
      } else {
        const answer = await page.evaluate(correct => {
          const exercise = grammarExercises[grammarCurrentIndex];
          return correct ? exercise.answer : exercise.options.find(value => value !== exercise.answer);
        }, correct);
        await page.locator('.grammar-option').getByText(answer, { exact: true }).click();
      }
      const feedback = page.locator(`#${kind}Feedback`);
      const before = await feedback.textContent();
      const counts = await page.evaluate(() => ({ verb: { ...verbStats }, grammar: { ...grammarStats }, answers: grammarSession?.answers.length || 0 }));
      await page.locator(`#${kind}ExerciseArea`).getByRole('button', { name: /Hint|Vis hint/ }).click();
      await page.locator(`#${kind}ExerciseArea`).getByRole('button', { name: /Hint|Vis hint/ }).click();
      await expect(feedback).toContainText(before.trim());
      await expect(feedback.locator('[data-feedback-next]')).toBeVisible();
      expect(await page.evaluate(() => ({ verb: { ...verbStats }, grammar: { ...grammarStats }, answers: grammarSession?.answers.length || 0 }))).toEqual(counts);
      await feedback.locator('[data-feedback-next]').click();
      await expect(page.locator(`#${kind}Counter`)).toContainText('2 /');
    });
  }
}

test('F11: feedback dialog keeps Enter and Tab inside and restores focus on Escape', async ({ page }) => {
  await openPractice(page, 'grammar');
  const wrong = await page.evaluate(() => grammarExercises[0].options.find(value => value !== grammarExercises[0].answer));
  await page.locator('.grammar-option').getByText(wrong, { exact: true }).click();
  const report = page.getByRole('button', { name: /Jeg mener svaret mitt er riktig/ });
  await report.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: /Jeg mener svaret mitt er riktig/ });
  await expect(dialog).toBeVisible();
  const explanation = dialog.locator('#feedbackExplanation');
  await expect(explanation).toBeFocused();
  await explanation.fill('Første linje');
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Andre linje');
  await expect(explanation).toHaveValue('Første linje\nAndre linje');
  await expect(page.locator('#grammarCounter')).toContainText('1 /');
  await dialog.getByRole('button', { name: 'Avbryt', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(explanation).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Avbryt', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(report).toBeFocused();
  await report.press('Enter');
  await page.locator('#feedbackExplanation').fill('Et lokalt innspill');
  await page.getByRole('button', { name: 'Lagre innspill', exact: true }).press('Enter');
  expect(await page.evaluate(() => loadStudentFeedback().entries.length)).toBe(1);
  await expect(page.locator('#grammarCounter')).toContainText('1 /');
  await expect(report).toBeFocused();
});

test('F11: Enter selects the focused puzzle tile instead of checking the sentence', async ({ page }) => {
  await page.goto(appUrl);
  await page.evaluate(() => {
    studentName = 'Test';
    showMainApp();
    showPage('games');
    showGameSetup('sentence-puzzle');
    startSentencePuzzle();
  });
  const tile = page.locator('#spWordTiles button').first();
  const word = await tile.textContent();
  await tile.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#spBuiltSentence')).toContainText(word.trim());
  await expect(page.locator('#spFeedback')).toBeEmpty();
});

test('F11: quoted answers can open feedback without breaking the action or changing their text', async ({page}) => {
  await page.goto(appUrl);
  await page.evaluate(() => { localStorage.clear(); showMainApp(); showPage('verbs'); selectedVerbs = new Set(['hablar']); selectedTense='presente'; startVerbSession(); });
  const answer = `él dice "hola" y 'adiós'`;
  await page.locator('#verbInput').fill(answer);
  await page.getByRole('button',{name:'✓ Sjekk svar',exact:true}).click();
  await page.getByRole('button',{name:'🤔 Jeg mener svaret mitt er riktig',exact:true}).click();
  await expect(page.locator('[role="dialog"]')).toContainText(answer);
});
