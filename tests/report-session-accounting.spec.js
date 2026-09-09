import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();
async function boot(page) {
  await page.goto(appUrl);
  await page.evaluate(() => { localStorage.clear(); studentName = 'Test'; localStorage.setItem('spansk123_studentName', studentName); showMainApp(); });
}
async function start(page, mode) {
  await page.evaluate(mode => {
    showPage(mode === 'vocabulary' || mode === 'mixedQuiz' ? 'vocab' : mode);
    if (mode === 'verbs') { selectedVerbs = new Set(['hablar', 'comer', 'vivir', 'tener']); startVerbSession(); }
    if (mode === 'grammar') { currentGrammarTopic = grammarTopics.articles; startGrammarExercises(); }
    if (mode === 'mixedQuiz') startBrainmapSkillPractice('a0.articles.definite_singular');
    if (mode === 'vocabulary') { startVocabSession('new', cards.slice(0, 2)); currentCard.responseMode = 'typed'; showVocabCard(); }
  }, mode);
}
async function answer(page, mode) {
  if (mode === 'verbs') {
    await page.locator('#verbInput').fill(await page.locator('#verbInput').getAttribute('data-expected'));
    await page.locator('#verbExerciseArea').getByRole('button', { name: 'Sjekk svar' }).click();
  } else if (mode === 'grammar') {
    const expected = await page.evaluate(() => grammarExercises[grammarCurrentIndex].answer);
    await page.locator('.grammar-option').getByText(expected, { exact: true }).click();
  } else if (mode === 'mixedQuiz') {
    const expected = await page.evaluate(() => getDiagnosisAnswerValues(mixedQuizState.quiz.items[0])[0]);
    await page.evaluate(expected => submitMixedQuizAnswer(expected), expected);
  } else {
    await page.locator('#typedVocabInput').fill(await page.evaluate(() => getExpectedAnswerText(currentCard)));
    await page.locator('#buttonArea').getByRole('button', { name: 'Sjekk svar' }).click();
  }
}

for (const mode of ['verbs', 'grammar', 'mixedQuiz', 'vocabulary']) {
  test(`F06/F18: ${mode} saves one actual answer before Next and survives reload once`, async ({ page }) => {
    await boot(page);
    await start(page, mode);
    await answer(page, mode);
    expect(await page.evaluate(() => practiceHistory.reduce((n, e) => n + e.words, 0))).toBe(1);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('spansk123_practiceHistory')));
    const learning = await page.evaluate(() => loadLearningProgress());
    expect(saved[0].minutes).toBeLessThan(1);
    await page.reload();
    await expect(page.locator('#interruptedPracticeNotice')).toContainText('1 svar');
    expect(await page.evaluate(() => practiceHistory.reduce((n, e) => n + e.words, 0))).toBe(1);
    expect(await page.evaluate(() => practiceHistory.every(e => !e.inProgress))).toBe(true);
    expect(await page.evaluate(() => {
      const progress = loadLearningProgress();
      return { wordProgress: progress.wordProgress, skillProgress: progress.skillProgress };
    })).toEqual({ wordProgress: learning.wordProgress, skillProgress: learning.skillProgress });
    await page.reload();
    expect(await page.evaluate(() => practiceHistory.reduce((n, e) => n + e.words, 0))).toBe(1);
  });
}

test('F06: partial verb result counts one answer once and zero grammar answers make no mastery claim', async ({ page }) => {
  await boot(page); await start(page, 'verbs'); await answer(page, 'verbs');
  await page.evaluate(() => { endVerbSession(); endVerbSession(); });
  await expect(page.locator('#verbSessionStats')).toHaveText('1 / 1 riktig');
  await expect(page.locator('#verbExerciseArea')).toContainText('1 av 20');
  await expect(page.locator('#verbExerciseArea')).not.toContainText('mestrer');
  expect(await page.evaluate(() => practiceHistory.reduce((n, e) => n + e.words, 0))).toBe(1);
  await start(page, 'grammar');
  await page.evaluate(() => { endGrammarSession(); endGrammarSession(); });
  await expect(page.locator('#grammarExerciseArea')).toContainText('Ingen svar');
  await expect(page.locator('#grammarExerciseArea')).not.toContainText('mestrer');
  expect(await page.evaluate(() => practiceHistory.reduce((n, e) => n + e.words, 0))).toBe(1);
});

for (const mode of ['verbs', 'grammar']) {
  for (const complete of [false, true]) {
    test(`F06: ${mode} wrong answers, complete=${complete}, have identical UI and exported counts`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await boot(page); await start(page, mode);
      const planned = await page.evaluate(mode => mode === 'verbs' ? verbSessionExercises.length : grammarExercises.length, mode);
      const count = complete ? planned : 1;
      for (let index = 0; index < count; index++) {
        if (mode === 'verbs') {
          await page.locator('#verbInput').fill('feil');
          await page.locator('#verbExerciseArea').getByRole('button', { name: 'Sjekk svar' }).click();
        } else {
          const wrong = await page.evaluate(() => grammarExercises[grammarCurrentIndex].options.find(value => value !== grammarExercises[grammarCurrentIndex].answer));
          await page.locator('.grammar-option').getByText(wrong, { exact: true }).click();
        }
        if (index < count - 1) await page.locator(`#${mode === 'verbs' ? 'verb' : 'grammar'}Feedback [data-feedback-next]`).click();
      }
      await page.evaluate(mode => { if (mode === 'verbs') { endVerbSession(); endVerbSession(); } else { endGrammarSession(); endGrammarSession(); } }, mode);
      await expect(page.locator(`#${mode === 'verbs' ? 'verb' : 'grammar'}SessionStats`)).toHaveText(`0 / ${count} riktig`);
      const entries = await page.evaluate(() => buildProgressExportData().practiceHistory);
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({ words: count, correct: 0, sessions: 1, inProgress: false });
    });
  }
}

test('F08/F17: local identity and separate backup contents are explained where used', async ({ page }) => {
  await page.goto(appUrl);
  await expect(page.locator('#welcomeForm')).toContainText('Elevkoden gjenoppretter ikke data');
  await boot(page);
  await page.evaluate(() => showPage('homework'));
  await expect(page.locator('#homeworkPage')).toContainText('svarene fra nivåtesten');
  await expect(page.locator('#feedbackBackupNotice')).toContainText('Eksporter dem separat');
  await page.evaluate(() => showFeedbackDialog({ prompt: 'Test', studentAnswer: 'a', expectedAnswer: 'b', itemRef: 'test', source: 'test' }));
  await expect(page.getByRole('dialog')).toContainText('Ingen mottar det automatisk');
  await expect(page.getByRole('dialog')).toContainText('poengsummen endres ikke');
});

test('F06/F07: zero answers give no time and local midnight belongs to the correct week', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'Europe/Oslo' });
  const page = await context.newPage();
  await page.clock.install({ time: new Date('2026-09-13T22:30:00Z') });
  await boot(page); await start(page, 'verbs');
  await page.evaluate(() => { verbSessionStartTime = new Date(Date.now() - 600000); endVerbSession(); });
  expect(await page.evaluate(() => practiceHistory)).toEqual([]);
  await start(page, 'grammar'); await answer(page, 'grammar');
  expect(await page.evaluate(() => practiceHistory[0].date)).toBe('2026-09-14');
  expect(await page.evaluate(() => getWeekDays()[0])).toMatchObject({ dateStr: '2026-09-14', practiced: true, isToday: true });
  await context.close();
});

test('F07: package minutes exclude past and independent practice and all grammar topics can start', async ({ page }) => {
  await boot(page); page.on('dialog', d => d.accept());
  await page.evaluate(() => {
    practiceHistory = [{ date: getLocalDateString(), words: 30, correct: 20, activity: 'grammar', minutes: 30, sessions: 1 }];
    importAssignmentPackage({ schemaVersion: 'assignment-v1', id: 'package-a', assignmentTitle: 'Pakke A', grammarTopics: ['articles', 'gustar'], verbFocuses: ['ar'], minuteTargets: { grammar: 10, verbs: 5 } });
    showPage('homework');
  });
  expect(await page.evaluate(() => getAssignmentMinuteProgress().progress.grammar)).toBe(0);
  const grammarButtons = page.locator('#activeAssignmentPanel button').filter({ hasText: 'Start grammatikk' });
  await expect(grammarButtons).toHaveCount(2);
  for (const topic of ['articles', 'gustar']) {
    await page.evaluate(() => showPage('homework'));
    await grammarButtons.nth(topic === 'articles' ? 0 : 1).click();
    if (await page.locator('.grammar-lesson-actions button').isVisible()) await page.locator('.grammar-lesson-actions button').click();
    else if (await page.getByRole('button', { name: '▶️ Start øvelser', exact: true }).isVisible()) await page.getByRole('button', { name: '▶️ Start øvelser', exact: true }).click();
    expect(await page.evaluate(() => currentGrammarTopic.id)).toBe(topic);
    await page.evaluate(() => { grammarSessionStartTime = new Date(Date.now() - 120000); });
    await answer(page, 'grammar');
    await page.evaluate(() => endGrammarSession());
  }
  expect(await page.evaluate(() => getAssignmentMinuteProgress().progress.grammar)).toBeGreaterThanOrEqual(4);
  await page.evaluate(() => { importAssignmentPackage({ schemaVersion: 'assignment-v1', id: 'package-b', assignmentTitle: 'Pakke B', grammarTopics: ['articles'], minuteTargets: { grammar: 10 } }); });
  expect(await page.evaluate(() => getAssignmentMinuteProgress().progress.grammar)).toBe(0);
  await start(page, 'grammar'); await answer(page, 'grammar'); await page.evaluate(() => endGrammarSession());
  expect(await page.evaluate(() => getAssignmentMinuteProgress().progress.grammar)).toBe(0);
});

test('F07/F18: reimport, local calendar, export to clean profile and undo retain accurate history', async ({ page, browser }) => {
  await boot(page);
  const exported = await page.evaluate(() => {
    const data = { schemaVersion: 'assignment-v1', assignmentTitle: 'Samme eldre pakke', vocabulary: [{ norsk: 'hei', spansk: 'hola' }] };
    importAssignmentPackage(data); const id = activeAssignment.id;
    importAssignmentPackage(data);
    if (id !== activeAssignment.id) throw new Error('Reimport changed assignment identity');
    practiceHistory = [{ date: getLocalDateString(), words: 2, correct: 1, sessions: 1, activity: 'verbs', minutes: 0.5, assignmentId: id, sessionId: 'completed', inProgress: false }];
    savePracticeHistory(); return buildProgressExportData();
  });
  const context = await browser.newContext(); const clean = await context.newPage(); await clean.goto(appUrl);
  await clean.evaluate(exported => importProgressData(exported), exported);
  expect(await clean.evaluate(() => practiceHistory)).toEqual(exported.practiceHistory);
  await context.close();
  await start(page, 'vocabulary'); await answer(page, 'vocabulary');
  await page.evaluate(() => undoLastVocabAction());
  expect(await page.evaluate(() => practiceHistory.reduce((n, e) => n + e.words, 0))).toBe(2);
  expect(await page.evaluate(() => getWeekDays().map(d => d.dateStr).includes(getLocalDateString()))).toBe(true);
});
