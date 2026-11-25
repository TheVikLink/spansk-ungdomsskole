import { test, expect } from '@playwright/test';
import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createUndervisningRouter } from '../server/undervisning-access.js';
import { createSchoolLicenseCode } from '../src/domain/school-license.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const TEST_SECRET = 'playwright-test-license-secret-32-chars';

async function startUndervisningServer() {
  const app = express();
  app.use(createUndervisningRouter({
    projectRoot,
    getSecret: () => TEST_SECRET,
    cookieSecure: false,
    enforcePaywall: true,
  }));
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve())),
  };
}

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
]) {
  test(`Undervisningspakken portal filtering, lock redirect and school license activation at ${viewport.width}px`, async ({ page }) => {
    const server = await startUndervisningServer();
    try {
      await page.setViewportSize(viewport);
      await page.goto(`${server.url}/undervisning/`);

      await expect(page.getByRole('heading', { name: 'Undervisningstimer i spansk' })).toBeVisible();
      await expect(page.locator('.catalog-section h2').first()).toHaveText('Gratis prøvetimer');
      await expect(page.locator('.catalog-section').first().locator('li[data-lesson-id]')).toHaveCount(3);
      await expect(page.locator('.catalog li[data-lesson-id]')).toHaveCount(46);

      // Zero horizontal overflow
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow).toBe(false);

      // Filter to 3 free sample lessons
      await page.getByRole('button', { name: 'Gratis prøvetimer (3)' }).click();
      await expect(page.locator('.catalog li[data-lesson-id]:visible')).toHaveCount(3);

      // Search filters cleanly
      await page.getByRole('button', { name: /Alle \(46\)/ }).click();
      await page.locator('#lessonSearchInput').fill('familie');
      await expect(page.locator('.catalog li[data-lesson-id="familie"]')).toBeVisible();
      await expect(page.locator('.catalog li[data-lesson-id="tall"]')).toBeHidden();
      await page.locator('#lessonSearchInput').fill('');

      // Free lesson opens directly without a code
      await page.goto(`${server.url}/undervisning/tall/index.html`);
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Hvor mange billetter?');

      // Paid lesson redirects back to portal with lock notice
      await page.goto(`${server.url}/undervisning/familie/index.html`);
      await expect(page).toHaveURL(/\/undervisning\/\?las=familie$/);
      await expect(page.locator('#lockedNotice')).toBeVisible();
      await expect(page.locator('#lockedNotice')).toContainText('Hvem kommer på besøk?');

      // Activating a valid school license unlocks all 46 lessons and PDF partner cards
      const validCode = createSchoolLicenseCode({
        school: 'Solhaugen ungdomsskole',
        expiresAt: '2027-08-31',
      }, TEST_SECRET);
      await page.locator('#licenseCodeInput').fill(validCode);
      await page.getByRole('button', { name: 'Lås opp alle 46 timer' }).click();

      await expect(page.locator('#licensePanel')).toContainText('Aktiv skolelisens: Solhaugen ungdomsskole');
      await expect(page.locator('#lockedNotice')).toBeHidden();

      await page.goto(`${server.url}/undervisning/familie/index.html`);
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Hvem kommer på besøk?');

      const pdfResponse = await page.request.get(`${server.url}/undervisning/familie/partnerkort.pdf`);
      expect(pdfResponse.status()).toBe(200);
      expect((await pdfResponse.body()).subarray(0, 5).toString()).toBe('%PDF-');
    } finally {
      await server.close();
    }
  });
}
