import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('corrupt localStorage recovery', () => {
  test('recovers from corrupt vocabulary storage without blocking app startup', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('spansk123_studentName', 'Elev 3');
      localStorage.setItem('spansk123Data_v4', '{ skadet json');
    });
    await page.reload();

    await expect(page.locator('#mainApp')).toBeVisible();
    await expect(page.locator('.toast')).toContainText('Lagret fremgang var skadet');

    const recovery = await page.evaluate(() => {
      const backupKey = Object.keys(localStorage).find(key => key.startsWith('spansk123_corrupt_spansk123Data_v4_'));
      return {
        pageCardCount: cards.length,
        storedCardCount: JSON.parse(localStorage.getItem('spansk123Data_v4')).length,
        backupKey,
        backupValue: backupKey ? localStorage.getItem(backupKey) : null
      };
    });

    expect(pageErrors).toEqual([]);
    expect(recovery.pageCardCount).toBeGreaterThan(400);
    expect(recovery.storedCardCount).toBe(recovery.pageCardCount);
    expect(recovery.backupKey).toBeTruthy();
    expect(recovery.backupValue).toBe('{ skadet json');
  });

  test('recovers from corrupt grammar and practice history storage', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('spansk123_studentName', 'Elev 4');
      localStorage.setItem('spansk123Grammar_v1', '{ feil grammatikk');
      localStorage.setItem('spansk123_practiceHistory', '{ feil historikk');
    });
    await page.reload();

    await expect(page.locator('#mainApp')).toBeVisible();

    const recovery = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return {
        grammarProgress,
        practiceHistory,
        grammarBackup: keys.find(key => key.startsWith('spansk123_corrupt_spansk123Grammar_v1_')),
        historyBackup: keys.find(key => key.startsWith('spansk123_corrupt_spansk123_practiceHistory_'))
      };
    });

    expect(pageErrors).toEqual([]);
    expect(recovery.grammarProgress).toEqual({});
    expect(recovery.practiceHistory).toEqual([]);
    expect(recovery.grammarBackup).toBeTruthy();
    expect(recovery.historyBackup).toBeTruthy();
  });

  test('preserves corrupt old-app data during migration check', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('spanskSRData', '{ gammel skadet json');
      checkForOldAppData();

      const backupKey = Object.keys(localStorage).find(key => key.startsWith('spansk123_corrupt_spanskSRData_'));
      return {
        backupKey,
        backupValue: backupKey ? localStorage.getItem(backupKey) : null
      };
    });

    expect(result.backupKey).toBeTruthy();
    expect(result.backupValue).toBe('{ gammel skadet json');
  });
});
