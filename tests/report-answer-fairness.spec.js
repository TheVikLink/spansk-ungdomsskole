import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test('F03: quiz builders retain every approved vocabulary answer in both directions', async ({ page }) => {
  await page.goto(appUrl);
  const result = await page.evaluate(() => {
    studentName = 'Test';
    showMainApp();
    const candidates = buildMixedQuizCandidates({ cards, learningProgress: loadLearningProgress(), diagnosis: { answers: [] } });
    const failures = [];
    let checked = 0;
    for (const card of cards) {
      for (const [direction, label, primary] of [['noToEs', 'no-es', card.es], ['esToNo', 'es-no', card.no]]) {
        const candidate = candidates.find(item => item.questionId === `mixed.vocab.${card.id}.${direction}`);
        for (const answer of getVocabularyAcceptedAnswers(card, label, primary)) {
          checked++;
          if (!candidate || !evaluateDiagnosisAnswer(candidate, answer.value).correct) {
            failures.push({ card: card.no, direction, answer: answer.value });
          }
        }
      }
    }
    return { checked, failures };
  });
  expect(result.checked).toBeGreaterThan(1046);
  expect(result.failures).toEqual([]);
});

for (const width of [1440, 390]) {
  test(`F03: pupil receives credit for å drikke in a built quiz at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(appUrl);
    await page.evaluate(() => {
      studentName = 'Test';
      showMainApp();
      showPage('vocab');
      const card = cards.find(card => card.es === 'beber');
      const quiz = buildMixedQuiz({ cards: [card], skillsCatalog: { skills: [], words: [] }, diagnosis: { status: 'complete', answers: [] }, size: 2 });
      mixedQuizState = { quiz, index: 0, answered: 0, correct: 0, startedAt: new Date(), results: [] };
      document.getElementById('vocabSettings').classList.add('hidden');
      document.getElementById('mixedQuizStudy').classList.remove('hidden');
      renderMixedQuizQuestion();
    });
    for (let i = 0; i < 2; i++) {
      const prompt = await page.locator('.mixed-quiz-prompt').textContent();
      await page.locator('#mixedQuizAnswerInput').fill(prompt === 'beber' ? 'å drikke' : 'beber');
      await page.getByRole('button', { name: 'Sjekk svar', exact: true }).click();
      await expect(page.locator('#mixedQuizFeedback')).toContainText('✓ Riktig!');
      await page.locator('[data-feedback-next]').click();
    }
    await expect(page.locator('.mixed-quiz-results')).toContainText('2 av 2 riktige');
  });
}

test('F04: diagnosis shows both the instruction and Spanish gap context', async ({ page }) => {
  await page.goto(appUrl);
  await page.evaluate(() => {
    studentName = 'Test';
    showMainApp();
    const state = startDiagnosis();
    state.questionIds = ['diag.a1.gustar.basic.choice'];
    saveDiagnosisState(state);
    renderDiagnosisPanel();
  });
  const panel = page.locator('#diagnosisPanel');
  await expect(panel).toContainText('Velg riktig form av gustar.');
  await expect(panel).toContainText('Me ___ los libros de aventuras.');
  await expect(panel).toContainText('Jeg liker eventyrbøker.');
  await panel.getByRole('button', { name: 'gustan', exact: true }).click();
  await expect(panel).toContainText('✓ Riktig');
});

for (const [id, answer] of [
  ['diag.vocab.family.madre.es_no', 'mora'],
  ['diag.a0.identity.me_llamo.typed', 'Yo me llamo Ana']
]) {
  test(`F04: diagnosis accepts the documented natural answer ${answer}`, async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(id => {
      studentName = 'Test';
      showMainApp();
      const state = startDiagnosis();
      state.questionIds = [id];
      saveDiagnosisState(state);
      renderDiagnosisPanel();
    }, id);
    await page.locator('#diagnosisAnswerInput').fill(answer);
    await page.locator('#diagnosisPanel').getByRole('button', { name: 'Svar', exact: true }).click();
    await expect(page.locator('[data-diagnosis-feedback]')).toContainText('✓ Riktig');
    expect(await page.evaluate(() => loadDiagnosisState().answers[0].correct)).toBe(true);
  });
}

test('F03/F04: approved variants still reject changed meaning and ñ substitutions', async ({ page }) => {
  await page.goto(appUrl);
  const result = await page.evaluate(() => {
    studentName = 'Test';
    showMainApp();
    const candidates = buildMixedQuizCandidates({ cards, learningProgress: loadLearningProgress(), diagnosis: { answers: [] } });
    const drinking = candidates.find(item => item.prompt === 'beber');
    const year = candidates.find(item => item.directionLabel === 'no-es' && item.acceptedAnswers.some(answer => /año/.test(answer.value)));
    const name = diagnosisQuestionCatalog.find(item => item.id === 'diag.a0.identity.me_llamo.typed');
    return [evaluateDiagnosisAnswer(drinking, 'å spise').correct,
      evaluateDiagnosisAnswer(year, year.acceptedAnswers[0].value.replace('ñ', 'n')).correct,
      evaluateDiagnosisAnswer(name, 'Yo me llama Ana').correct];
  });
  expect(result).toEqual([false, false, false]);
});
