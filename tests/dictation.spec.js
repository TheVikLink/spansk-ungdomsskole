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
    await expect(page.locator('#dictationExercise audio')).toHaveAttribute('src', /Sofi%CC%81a%20vive%20en%20antigua%20Guatemala%201\.wav$/);
    const expected = await page.evaluate(() => DICTATION_STORIES.find(s => s.id === 'antigua-volcan').segments[0][0]);
    await expect(page.locator('#dictationAnswer')).toBeVisible();
    expect(expected).toBe('Sofía vive en Antigua Guatemala.');
  });

  test('bruker WAV-kilde for alle Sofía-segmenter', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Diktat-test'; showMainApp(); showPage('dictation'); });
    await page.getByRole('button', { name: 'Start historien' }).nth(2).click();
    await page.getByRole('button', { name: 'Start øvelsen' }).click();

    for (let index = 1; index <= 8; index += 1) {
      await expect(page.locator('#dictationSegmentAudio')).toHaveAttribute('src', new RegExp(`${index}\\.wav$`));
      if (index < 8) {
        await page.getByRole('button', { name: 'Sjekk svar' }).click();
        await page.getByRole('button', { name: 'Neste segment' }).click();
      }
    }
  });

  test('bruker de innspilte WAV-filene i Madrid- og Oaxaca-mappene', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Diktat-test'; showMainApp(); showPage('dictation'); });
    await page.getByRole('button', { name: 'Start historien' }).nth(1).click();
    await expect(page.locator('#dictationFullStoryAudio')).toHaveAttribute('src', /Luis%20est.*Oaxaca.*\.wav$/);
    await page.getByRole('button', { name: 'Start øvelsen' }).click();
    await expect(page.locator('#dictationSegmentAudio')).toHaveAttribute('src', /Luis%20est.*Oaxaca.*1\.wav$/);
  });

  test('viser hint med spansk først, bruker aksentknapper og sender med Enter', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Diktat-test'; showMainApp(); showPage('dictation'); });
    await page.getByRole('button', { name: 'Start historien' }).first().click();
    await page.getByRole('button', { name: 'Start øvelsen' }).click();
    await expect(page.locator('.dictation-hints')).toHaveText('');
    await expect(page.getByRole('button', { name: 'Sett inn á' })).toBeVisible();
    await page.getByRole('button', { name: 'Sett inn á' }).click();
    await expect(page.locator('#dictationAnswer')).toHaveValue('á');
    await page.locator('#dictationAnswer').press('Enter');
    await expect(page.locator('#dictationSolution')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('#dictationExercise .study-header')).toContainText('2 / 8');
    await page.getByRole('button', { name: 'Sjekk svar' }).click();
    await page.getByRole('button', { name: 'Neste segment' }).click();
    await expect(page.locator('.dictation-hints')).toContainText('la plaza = torget');
  });

  test('bruker spansk-først-formatet i alle historiehint', async ({ page }) => {
    await page.goto(appUrl);
    const hints = await page.evaluate(() => DICTATION_STORIES.flatMap(story => story.hints));
    expect(hints.length).toBeGreaterThan(0);
    expect(hints.every(hint => /^.+ = .+$/u.test(hint) && !hint.includes(':'))).toBe(true);
  });

  test('viser bare hint som finnes i aktuell fasit', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Diktat-test'; showMainApp(); showPage('dictation'); });
    await page.getByRole('button', { name: 'Start historien' }).nth(1).click();
    await page.getByRole('button', { name: 'Start øvelsen' }).click();
    await expect(page.locator('.dictation-hints')).toHaveText('');
    await page.locator('#dictationAnswer').fill('Luis está en Oaxaca.');
    await page.getByRole('button', { name: 'Sjekk svar' }).click();
    await page.getByRole('button', { name: 'Neste segment' }).click();
    await expect(page.locator('.dictation-hints')).toContainText('el mercado = marked');
  });
});
