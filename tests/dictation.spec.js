import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('fortellingsbasert diktat', () => {
  test('viser fem historier og filtrerer på nivå og region', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Diktat-test'; showMainApp(); });
    await page.locator('#navDictation').click();
    await expect(page.locator('#dictationPage')).toBeVisible();
    await expect(page.locator('.dictation-story-card')).toHaveCount(5);
    await page.locator('#dictationLevelFilter').selectOption('A0');
    await expect(page.locator('.dictation-story-card:visible')).toHaveCount(2);
    await page.locator('#dictationRegionFilter').selectOption('Mexico');
    await expect(page.locator('.dictation-story-card:visible')).toHaveCount(1);
  });

  test('skjuler fasit før innsending og lagrer bare fullføring', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Diktat-test'; showMainApp(); showPage('dictation'); });
    await page.getByRole('button', { name: /Start historien/ }).first().click();
    await page.getByRole('button', { name: 'Start øvelsen' }).click();
    await expect(page.locator('#dictationAnswer')).toBeVisible();
    await expect(page.locator('#dictationSolution')).toBeHidden();
    await page.locator('#dictationAnswer').fill('Me llamo Ana.');
    await page.getByRole('button', { name: 'Sjekk svar' }).click();
    await expect(page.locator('#dictationSolution')).toBeVisible();
    await page.evaluate(() => { document.querySelector('#dictationStar5')?.click(); });
    await expect.poll(() => page.evaluate(() => Object.keys(localStorage).filter(k => k.includes('dictation')).map(k => [k, localStorage.getItem(k)]))).toEqual([]);
    await page.getByRole('button', { name: 'Neste segment' }).click();
    await expect(page.locator('#dictationAnswer')).toBeVisible();
  });

  test('kan høre hele historien før øvelsen starter, og lydkilden følger fasiten', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Diktat-test'; showMainApp(); showPage('dictation'); });
    await page.getByRole('button', { name: 'Start historien' }).nth(2).click();
    await expect(page.locator('#dictationFullStoryAudio')).toBeVisible();
    await expect(page.locator('#dictationAnswer')).toBeHidden();
    await page.getByRole('button', { name: 'Start øvelsen' }).click();
    await expect(page.locator('#dictationExercise audio')).toHaveAttribute('src', /antigua-1\.mp3$/);
    const expected = await page.evaluate(() => DICTATION_STORIES.find(s => s.id === 'antigua-volcan').segments[0][0]);
    await expect(page.locator('#dictationAnswer')).toBeVisible();
    expect(expected).toBe('Sofía vive en Antigua Guatemala.');
  });
});
