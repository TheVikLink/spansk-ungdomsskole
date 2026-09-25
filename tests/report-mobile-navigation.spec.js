import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

for (const width of [360, 390, 640, 768, 1024, 1440]) {
  test(`F02: every menu button is reachable at ${width}px with a long label and large text`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(appUrl);
    await page.locator('#studentNameInput').fill('Elevkode-med-et-veldig-langt-kallenavn-9A');
    await page.locator('.login-btn-primary').click();
    await page.addStyleTag({ content: '.nav-link, .user-name { font-size: 24px !important; }' });
    const links = page.locator('.nav-links button');
    const ids = await links.evaluateAll(buttons => buttons.map(button => button.id));
    expect(ids.length).toBeGreaterThan(5);
    for (const id of [...ids, ...ids.slice().reverse()]) {
      const button = page.locator(`#${id}`);
      if (!await button.isVisible()) {
        const more = page.locator('.nav-more');
        if (!await more.evaluate(details => details.open)) await more.locator('summary').click();
      }
      await button.click({ timeout: 2500 });
      await expect(button).toHaveAttribute('aria-current', 'page');
    }
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(hasOverflow).toBe(false);
    if ([390, 1440].includes(width)) await page.screenshot({ path: testInfo.outputPath(`nav-${width}.png`), fullPage: true });
  });
}
