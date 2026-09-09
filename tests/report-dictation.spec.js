import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const appUrl = pathToFileURL(path.resolve('index.html')).toString();
async function start(page) {
  await page.goto(appUrl);
  await page.evaluate(() => { studentName = 'Test'; showMainApp(); showPage('dictation'); startDictation('madrid-plaza'); });
  await page.getByRole('button', { name: 'Start øvelsen', exact: true }).click();
}

test('F16: empty click-through is review, and cannot earn a completed dictation', async ({ page }) => {
  await start(page);
  for (let i = 0; i < 8; i++) {
    await page.getByRole('button', { name: 'Sjekk svar', exact: true }).click();
    await expect(page.locator('#dictationSolution')).toContainText('ikke skrevet');
    await page.getByRole('button', { name: 'Neste segment', exact: true }).click();
  }
  await expect(page.locator('#dictationExercise')).toContainText('0 av 8');
  await expect(page.locator('#dictationExercise')).not.toContainText('Diktat fullført');
  expect(await page.evaluate(() => loadDictationData().completed)).toEqual([]);
});

test('F16: completion on two days survives repeated finish and export/import without text storage', async ({ page }) => {
  await start(page);
  for (let day = 0; day < 2; day++) {
    if (day) {
      await page.clock.setFixedTime(new Date('2026-09-10T10:00:00Z'));
      await page.evaluate(() => { endDictation(); startDictation('madrid-plaza'); });
      await page.getByRole('button', { name: 'Start øvelsen', exact: true }).click();
    } else await page.clock.setFixedTime(new Date('2026-09-09T10:00:00Z'));
    for (let i = 0; i < 8; i++) {
      const expected = await page.evaluate(() => dictationState.story.segments[dictationState.index][0]);
      await page.locator('#dictationAnswer').fill(expected);
      await page.getByRole('button', { name: 'Sjekk svar', exact: true }).click();
      await page.getByRole('button', { name: 'Neste segment', exact: true }).click();
    }
    await page.evaluate(() => nextDictationSegment());
  }
  const data = await page.evaluate(() => {
    const exported = buildProgressExportData().dictation;
    localStorage.removeItem(DICTATION_KEY); importDictationData(exported); importDictationData(exported);
    return loadDictationData();
  });
  expect(data.completed).toEqual([{ storyId: 'madrid-plaza', completedOn: '2026-09-09' }, { storyId: 'madrid-plaza', completedOn: '2026-09-10' }]);
  expect(JSON.stringify(data)).not.toContain('Ana vive');
});

test('F11: Enter on dictation end and inside feedback keeps its native meaning', async ({ page }) => {
  await start(page);
  await page.locator('#dictationAnswer').fill('a');
  await page.locator('#dictationAnswer').press('Enter');
  await page.evaluate(() => showFeedbackDialog({ prompt: 'Test', studentAnswer: 'a', expectedAnswer: 'b', itemRef: 'test', source: 'test' }));
  await page.locator('#feedbackExplanation').fill('Linje');
  await page.locator('#feedbackExplanation').press('End');
  await page.keyboard.press('Enter');
  await expect(page.locator('#feedbackExplanation')).toHaveValue('Linje\n');
  expect(await page.evaluate(() => dictationState.index)).toBe(0);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '✕ Avslutt', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#dictationOverview')).toBeVisible();
});

test('F09: audio failure is visible in preview and segment and disables dependent actions', async ({ page }) => {
  await page.goto(appUrl);
  await page.evaluate(() => { studentName = 'Test'; showMainApp(); showPage('dictation'); startDictation('madrid-plaza'); });
  await page.locator('#dictationFullStoryAudio').evaluate(audio => audio.dispatchEvent(new Event('error')));
  await expect(page.locator('#dictationAudioError')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start øvelsen', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Prøv lyden igjen', exact: true }).click();
  await page.getByRole('button', { name: 'Start øvelsen', exact: true }).click();
  await page.locator('#dictationSegmentAudio').evaluate(audio => audio.dispatchEvent(new Event('error')));
  await expect(page.locator('#dictationAudioError')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sjekk svar', exact: true })).toBeDisabled();
});
