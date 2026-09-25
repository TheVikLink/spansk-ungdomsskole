import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test('uses a compact welcome hint at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appUrl);

  await expect(page.locator('label[for="studentNameInput"]')).toHaveText('Fornavn eller elevkode');
  await expect(page.locator('#studentNameInput')).toHaveAttribute('placeholder', 'Navn eller elevkode');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('puts vocabulary progress on its own readable row at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appUrl);
  await page.locator('#studentNameInput').fill('Test');
  await page.locator('.login-btn-primary').click();
  await page.locator('#navVocab').click();
  await page.locator('.vocab-mode-card.new').click();
  await expect(page.locator('#vocabStudy')).toBeVisible();

  const layout = await page.locator('#vocabStudy .study-header').evaluate((header) => {
    const actionButtons = [...header.querySelectorAll('button')];
    const progress = header.querySelector('.session-progress');
    const actionsBottom = Math.max(...actionButtons.map(button => button.getBoundingClientRect().bottom));
    const progressRect = progress.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    return {
      actionsBottom,
      headerWidth: headerRect.width,
      progressTop: progressRect.top,
      progressWidth: progressRect.width,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth
    };
  });

  expect(layout.progressTop).toBeGreaterThanOrEqual(layout.actionsBottom + 4);
  expect(layout.progressWidth).toBeGreaterThanOrEqual(layout.headerWidth - 1);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth);
});

test('keeps vocabulary rating choices in the first mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appUrl);
  await page.locator('#studentNameInput').fill('Test');
  await page.locator('.login-btn-primary').click();
  await page.locator('#navVocab').click();
  await page.locator('.vocab-mode-card.new').click();
  await page.locator('#flashcardArea .flashcard[role="button"]').click();
  await page.evaluate(() => window.scrollTo(0, 0));

  const ratingBounds = await page.locator('.rating-buttons').evaluate(element => ({
    top: element.getBoundingClientRect().top,
    viewportHeight: window.innerHeight
  }));
  expect(ratingBounds.top).toBeLessThan(ratingBounds.viewportHeight);
});

test('shows one level-test action before diagnosis is complete', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('#studentNameInput').fill('Test');
  await page.locator('.login-btn-primary').click();

  await expect(page.getByRole('button', { name: 'Start nivåtest', exact: true })).toHaveCount(1);
});

test('places the locked mixed quiz after available vocabulary practice', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appUrl);
  await page.locator('#studentNameInput').fill('Test');
  await page.locator('.login-btn-primary').click();
  await page.locator('#navVocab').click();

  const layout = await page.evaluate(() => ({
    launcherTop: document.getElementById('mixedQuizLauncher').getBoundingClientRect().top,
    modesTop: document.querySelector('.vocab-mode-grid').getBoundingClientRect().top
  }));
  expect(layout.launcherTop).toBeGreaterThan(layout.modesTop);
});

test('keeps secondary mobile navigation behind an expandable control', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appUrl);
  await page.locator('#studentNameInput').fill('Test');
  await page.locator('.login-btn-primary').click();

  const more = page.locator('.nav-more');
  await expect(more).not.toHaveAttribute('open', '');
  await expect(more.locator('summary')).toContainText('Spill og lytteøvelser');
  await more.locator('summary').click();
  await expect(page.locator('#navGrammar')).toBeVisible();
  await expect(page.locator('#navHomework')).toBeVisible();
});

test('explains what each start activity is for at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appUrl);
  await page.locator('#studentNameInput').fill('Test');
  await page.locator('.login-btn-primary').click();

  await expect(page.locator('[data-home-activity="brainmap"]')).toContainText('Se hva du bør øve mer på');
  await expect(page.locator('[data-home-activity="dictation"]')).toContainText('Lytt og svar på spørsmål');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('marks one understandable vocabulary mode as recommended at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appUrl);
  await page.locator('#studentNameInput').fill('Test');
  await page.locator('.login-btn-primary').click();
  await page.locator('#navVocab').click();

  const recommended = page.locator('.vocab-mode-card.recommended');
  await expect(recommended).toHaveCount(1);
  await expect(recommended).toContainText('Anbefalt i dag');
});

test('keeps technical build information out of the student home page', async ({ page }) => {
  await page.goto(appUrl);
  await page.locator('#studentNameInput').fill('Test');
  await page.locator('.login-btn-primary').click();

  await expect(page.locator('#appVersionLabel')).toHaveCount(0);
  await expect(page.getByText(/^Versjon /)).toHaveCount(0);
});
