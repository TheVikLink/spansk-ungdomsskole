import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('PWA and UI smoke checks', () => {
  test('removes the chatbot from navigation and app markup', async ({ page }) => {
    await page.goto(appUrl);

    await expect(page.locator('#navChatbot')).toHaveCount(0);
    await expect(page.locator('#chatbotPage')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Chat/ })).toHaveCount(0);
  });

  test('exposes install metadata and service worker registration', async ({ page }) => {
    await page.goto(appUrl);

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', './manifest.webmanifest');

    const hasRegistration = await page.evaluate(() => document.documentElement.innerHTML.includes('serviceWorker.register'));
    expect(hasRegistration).toBe(true);
  });

  test('core classroom views render on mobile without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev 13';
      showMainApp();
    });

    for (const pageName of ['vocab', 'verbs', 'grammar', 'games', 'homework']) {
      await page.evaluate(name => showPage(name), pageName);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow, `${pageName} should not overflow horizontally`).toBe(false);
    }
  });

  test('Brainmap categories are keyboard-accessible buttons', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev 14';
      showMainApp();
      showPage('brainmap');
    });

    const numbersCategory = page.getByRole('button', { name: /Tall.*0 av 48 mestret/i });
    await expect(numbersCategory).toBeVisible();
    await numbersCategory.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('#vocabStudy')).toBeVisible();
    await expect(page.locator('#vocabPage')).toBeVisible();
  });

  test('custom vocabulary form controls have labels and local-only autocomplete metadata', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev 15';
      showMainApp();
      showPage('vocab');
    });

    await page.getByText('Statistikk, import og egne gloser').click();

    await expect(page.getByLabel('Norsk tekst')).toBeVisible();
    await expect(page.getByLabel('Spansk tekst')).toBeVisible();
    await expect(page.getByLabel('Eksisterende kategori')).toBeVisible();
    await expect(page.getByLabel('Ny kategori')).toBeVisible();

    await expect(page.locator('#addWordNorsk')).toHaveAttribute('autocomplete', 'off');
    await expect(page.locator('#addWordSpansk')).toHaveAttribute('autocomplete', 'off');
    await expect(page.locator('#addWordNewCategory')).toHaveAttribute('autocomplete', 'off');
  });

  test('app exposes global landmarks, skip link, nav state, and progress semantics', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev 16';
      showMainApp();
    });

    await expect(page.getByRole('link', { name: 'Hopp til hovedinnhold' })).toHaveAttribute('href', '#mainContent');
    await expect(page.getByRole('main')).toHaveAttribute('id', 'mainContent');
    await expect(page.locator('#navHome')).toHaveAttribute('aria-current', 'page');

    await page.evaluate(() => showPage('homework'));
    await expect(page.locator('#navVocab')).not.toHaveAttribute('aria-current', 'page');
    await expect(page.locator('#navHomework')).toHaveAttribute('aria-current', 'page');

    await page.evaluate(() => {
      showPage('vocab');
      startVocabSession('new');
    });
    await expect(page.getByRole('progressbar', { name: 'Fremgang i gloseøkt' })).toBeVisible();
  });
});
