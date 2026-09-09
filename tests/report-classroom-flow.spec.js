import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const appUrl = pathToFileURL(path.resolve('index.html')).toString();

for (const width of [390, 1440]) {
  test(`F13: first action starts the level test at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await page.goto(appUrl);
    await page.locator('#studentNameInput').fill('Test'); await page.locator('.login-btn-primary').click();
    await expect(page.locator('#homeStartMixedQuizBtn')).toBeEnabled();
    await page.locator('#homeStartMixedQuizBtn').click();
    expect(await page.evaluate(() => loadDiagnosisState().status)).toBe('in_progress');
    await expect(page.locator('#diagnosisPanel')).toBeVisible();
  });
}

test('F13: teacher finds one bounded lesson before entering a pupil code', async ({ page }) => {
  await page.goto(appUrl);
  await page.getByText('For læreren: første 20 minutter', { exact: true }).click();
  await expect(page.locator('#welcomeTeacherGuide')).toContainText('el, la, los og las');
  await expect(page.locator('#welcomeTeacherGuide')).toContainText('dagens oppsummering');
  await page.getByRole('button', { name: 'Start felles artikkeløving', exact: true }).click();
  await expect(page.locator('#grammarLessonPage')).toBeVisible();
  await page.locator('.grammar-lesson-actions button').click();
  const skillIds = await page.evaluate(() => grammarExercises.map(exercise => exercise.skillId));
  expect(skillIds.length).toBeGreaterThan(0);
  expect(skillIds.every(id => ['a0.articles.definite_singular', 'a0.articles.definite_plural'].includes(id))).toBe(true);
});

test('F14/F15: a first-day grammar answer is acknowledged and can be shown locally without printing or sending', async ({ page }) => {
  await page.goto(appUrl);
  await page.evaluate(() => { studentName = 'Test'; showMainApp(); showPage('grammar'); currentGrammarTopic = grammarTopics.articles; startGrammarExercises(); window.print = () => { window.printCalls = (window.printCalls || 0) + 1; }; });
  const wrong = await page.evaluate(() => grammarExercises[0].options.find(value => value !== grammarExercises[0].answer));
  await page.locator('.grammar-option').getByText(wrong, { exact: true }).click();
  await page.evaluate(() => { endGrammarSession(); showPage('home'); });
  await expect(page.locator('#homeQuizStreak')).not.toContainText('ikke øvd');
  await expect(page.locator('#homeQuizStreak')).toContainText('grammatikk');
  await page.locator('#navHomework').click();
  await page.getByRole('button', { name: 'Vis dagens oppsummering', exact: true }).click();
  await expect(page.locator('#weeklyReportPrintRoot')).toContainText('Dagens oppsummering');
  await expect(page.locator('#weeklyReportPrintRoot')).toContainText('Ingen data er sendt');
  await expect(page.locator('#weeklyReportPrintRoot')).toContainText('Hva trenger du hjelp til');
  expect(await page.evaluate(() => window.printCalls || 0)).toBe(0);
  expect(await page.evaluate(() => buildWeeklyReportData(getWeekDays().filter(day => day.isToday)).totalWords)).toBe(1);
  await page.locator('#weeklyReportPrintRoot').getByRole('button', { name: 'Tilbake', exact: true }).click();
  await expect(page.locator('#submitHomeworkBtn')).toBeEnabled();
});
