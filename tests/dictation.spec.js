import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('fortellingsbasert diktat', () => {
  test('viser fem historier og filtrerer på nivå og region', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Diktat-test'; showMainApp(); });
    await page.getByRole('button', { name: /Diktat/ }).click();
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
});
