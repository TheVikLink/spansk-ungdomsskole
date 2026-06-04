import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('privacy wording and local backup reminder', () => {
  test('asks for a data-minimizing student identifier on the welcome screen', async ({ page }) => {
    await page.goto(appUrl);

    await expect(page.locator('#studentNameInput')).toHaveAttribute('placeholder', /Fornavn eller elevkode/);
    await expect(page.locator('.login-hint').first()).toContainText('lagres bare i nettleseren');
    await expect(page.locator('.login-hint').first()).toContainText('lekselevering');
  });

  test('shows backup status and updates when a recent export is recorded', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elevkode 7';
      showMainApp();
      showPage('homework');
    });

    await expect(page.locator('#backupStatus')).toContainText('Ingen sikkerhetskopi');
    await expect(page.locator('#backupStatus')).toContainText('Last ned fremgang');

    await page.evaluate(() => {
      markProgressExported();
    });

    await expect(page.locator('#backupStatus')).toContainText('Sikkerhetskopi tatt i dag');
  });

  test('homework delivery is local-only unless a teacher configures an external form', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      studentName = '9A-14';
      showMainApp();

      const days = getWeekDays().filter(day => !day.isClassDay).slice(0, 2);
      practiceHistory = days.map((day, index) => ({
        date: day.dateStr,
        words: 10 + index,
        correct: 8 + index,
        sessions: 1
      }));
      savePracticeHistory();
      showPage('homework');

      const openedUrls = [];
      const originalOpen = window.open;
      window.open = url => openedUrls.push(url);
      const submitResult = submitHomework();
      window.open = originalOpen;

      return {
        submitResult,
        openedUrls,
        hint: document.getElementById('homeworkHint').textContent
      };
    });

    expect(result.submitResult).toMatchObject({ submittedExternally: false });
    expect(result.openedUrls).toEqual([]);
    expect(result.hint).toContain('Ingen data er sendt');
  });

  test('keeps student identifiers out of exported backup filenames', async ({ page }) => {
    await page.goto(appUrl);

    const filenames = await page.evaluate(() => [
      buildProgressExportFilename('Maria Nordmann', new Date('2026-05-17T12:00:00Z')),
      buildProgressExportFilename('9A-14', new Date('2026-05-17T12:00:00Z'))
    ]);

    expect(filenames).toEqual([
      'spansk-fremgang-2026-05-17.json',
      'spansk-fremgang-2026-05-17.json'
    ]);
    expect(filenames.join(' ')).not.toContain('Maria');
    expect(filenames.join(' ')).not.toContain('9A-14');
  });

  test('delete-all-data clears preserved recovery payloads too', async ({ page }) => {
    await page.goto(appUrl);

    const remainingKeys = await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('spansk123_studentName', 'Elev 8');
      localStorage.setItem('spansk123Data_v4', '[]');
      localStorage.setItem('spansk123Grammar_v1', '{}');
      localStorage.setItem('spansk123_practiceHistory', '[]');
      localStorage.setItem('spansk123_lastExportDate', '2026-05-17');
      localStorage.setItem('spansk123_corrupt_spansk123Data_v4_2026-05-17T12-00-00-000Z', '{ skadet }');
      localStorage.setItem('spansk123_oldImportDone', 'true');
      localStorage.setItem('unrelated_key', 'behold meg');

      clearAllLocalAppData();

      return Object.keys(localStorage).sort();
    });

    expect(remainingKeys).toEqual(['unrelated_key']);
  });
});
