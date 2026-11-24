import { test, expect } from '@playwright/test';
import { startStaticAppServer } from './helpers/static-app-server.js';

let server;
test.beforeAll(async () => { server = await startStaticAppServer(); });
test.afterAll(async () => server.close());

async function enter(page) {
  await page.goto(server.url);
  await page.evaluate(() => { studentName = 'Uavhengig kontroll'; showMainApp(); showPage('homework'); });
}

for (const width of [390, 1280]) {
  test(`builder field errors and overall status have sufficient contrast at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await enter(page);
    await page.locator('#assignmentBuilder > summary').click();
    for (const area of ['Vocab', 'Verb', 'Grammar']) await page.locator(`#builder${area}Minutes`).fill('10');
    await page.getByRole('button', { name: 'Last ned leksepakke', exact: true }).click();
    for (const id of ['builderVocabError', 'builderVerbError', 'builderGrammarError', 'assignmentBuilderStatus']) {
      await expect(page.locator('#' + id)).toBeVisible();
      const contrast = await page.locator('#' + id).evaluate(element => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d');
        const rgb = color => {
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
        };
        const luminance = color => rgb(color).map(value => value / 255)
          .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
          .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
        const foreground = luminance(getComputedStyle(element).color);
        const background = luminance(getComputedStyle(document.getElementById('assignmentBuilder')).backgroundColor);
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      });
      expect(contrast, id).toBeGreaterThanOrEqual(4.5);
      console.log(`${id} at ${width}px: ${contrast.toFixed(3)}:1`);
    }
    await page.screenshot({ path: `output/small-improvements/builder-errors-${width}.png`, fullPage: true });
  });
}
