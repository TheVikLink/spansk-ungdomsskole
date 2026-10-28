import { test, expect } from '@playwright/test';
import { startStaticAppServer } from './helpers/static-app-server.js';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { readFileSync, mkdirSync } from 'node:fs';

let server;
test.beforeAll(async () => { server = await startStaticAppServer(); });
test.afterAll(async () => server.close());
const relative = 'docs/kultur/jul-spania-chile/index.html';
const panel = page => page.locator('#espana-word-panel');
const countries = JSON.parse(readFileSync('data/culture-packages.json', 'utf8')).packages[0].countries;

test('all four text questions have one selectable answer before feedback', async ({ page }) => {
  await page.goto(server.url + relative);
  await expect(page.locator('form.question')).toHaveCount(4);
  await expect(page.locator('.open-question')).toHaveCount(0);
  const question = page.locator('form.question').filter({ hasText: 'Hva gjør noen familier i Chile ved midnatt?' });
  await question.getByRole('button', { name: 'Sjekk svaret' }).click();
  await expect(question.locator('.answer-feedback')).toHaveText('Velg et svar først.');
  await question.getByRole('radio', { name: 'Comen doce uvas.', exact: true }).check();
  await question.getByRole('button', { name: 'Sjekk svaret' }).click();
  await expect(question.locator('.answer-feedback')).toContainText('Prøv igjen');
  await question.getByRole('radio', { name: 'Abren los regalos.', exact: true }).check();
  await question.getByRole('button', { name: 'Sjekk svaret' }).click();
  await expect(question.locator('.answer-feedback')).toHaveText('Riktig.');
  await expect(page.locator('#understanding')).not.toContainText('Snakk med en partner');
});

test('text translations open on hover and focus and can be pinned or dismissed', async ({ page }) => {
  await page.goto(server.url + relative);
  const word = page.locator('#espana .reading').getByRole('button', { name: 'en invierno', exact: true });
  const translation = page.locator('#reading-translation');
  await expect(translation).toBeHidden();
  await word.hover();
  await expect(translation).toContainText('om vinteren');
  await translation.hover();
  await expect(translation).toBeVisible();
  await word.click();
  await page.mouse.move(2, 2);
  await expect(translation).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(translation).toBeHidden();
  await word.focus();
  await expect(translation).toBeHidden();
  await word.press('Enter');
  await expect(translation).toContainText('om vinteren');
  await translation.getByRole('button', { name: 'Lukk oversettelsen' }).click();
  await expect(word).toBeFocused();
  await expect(translation).toBeHidden();
  await page.locator('#espana .reading p').first().click({ position: { x: 3, y: 3 } });
  await word.focus();
  await expect(translation).toBeVisible();
  await page.locator('#espana .reading p').first().click({ position: { x: 3, y: 3 } });
  await expect(translation).toBeHidden();
});

test('the updated lesson bypasses an old cached script URL', async ({ page }) => {
  await page.route('**/preview.js', route => route.fulfill({ contentType: 'application/javascript', body: 'throw new Error("Old cached script");' }));
  await page.goto(server.url + relative);
  const question = page.locator('form.question').last();
  await question.getByRole('radio', { name: 'Viejo Pascuero' }).check();
  await question.getByRole('button', { name: 'Sjekk svaret' }).click();
  await expect(question.locator('.answer-feedback')).toHaveText('Riktig.');
  expect(page.url()).not.toContain('santa-name=');
});

test('a missing script cannot submit a student answer as a page request', async ({ page }) => {
  await page.route('**/preview.js*', route => route.abort());
  await page.goto(server.url + relative);
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  const question = page.locator('form.question').first();
  await question.getByRole('radio', { name: 'Nochebuena' }).check();
  await question.getByRole('button', { name: 'Sjekk svaret' }).click();
  await expect(page).toHaveURL(server.url + relative);
  expect(requests).toEqual([]);
});

test('hover is readable, click pins it, and Escape dismisses without reopening on the same focus', async ({ page }) => {
  await page.goto(server.url + relative);
  const gift = page.locator('#espana-regalo');
  await gift.hover();
  await expect(panel(page)).toContainText('el regalo');
  await panel(page).hover();
  await expect(panel(page)).toBeVisible();
  await gift.click();
  await page.locator('h1').hover();
  await expect(panel(page)).toBeVisible();
  await gift.focus();
  await page.keyboard.press('Escape');
  await expect(gift).toBeFocused();
  await expect(panel(page)).toBeHidden();
  await gift.focus();
  await expect(panel(page)).toBeHidden();
  await page.keyboard.press('Enter');
  await expect(panel(page)).toContainText('gave');
  if (process.env.CULTURE_PREVIEW_CAPTURE === '1') {
    await page.locator('#espana').screenshot({ path: 'output/culture-preview/espana-ordpunkt.png' });
  }
  await page.getByRole('button', { name: 'Lukk ordstøtten' }).first().click();
  await expect(gift).toBeFocused();
  await expect(panel(page)).toBeHidden();
});

test('questions require an effort and give distinct missing/wrong/correct feedback', async ({ page }) => {
  await page.goto(server.url + relative);
  const question = page.locator('.question').first();
  await expect(question.locator('.answer-explanation')).toBeHidden();
  await expect(question.getByRole('button', { name: 'Se forklaring' })).toBeHidden();
  await question.getByRole('button', { name: 'Sjekk svaret' }).click();
  await expect(question.locator('.answer-feedback')).toHaveText('Velg et svar først.');
  await expect(question.getByRole('button', { name: 'Se forklaring' })).toBeHidden();
  await question.getByRole('radio', { name: 'Nochevieja' }).check();
  await question.getByRole('button', { name: 'Sjekk svaret' }).click();
  await expect(question.locator('.answer-feedback')).toContainText('Prøv igjen');
  await expect(question.locator('.answer-explanation')).toBeHidden();
  await question.getByRole('button', { name: 'Se forklaring' }).click();
  await expect(question.locator('.answer-explanation')).toContainText('julaften');
  await question.getByRole('radio', { name: 'Nochebuena' }).check();
  await question.getByRole('button', { name: 'Sjekk svaret' }).click();
  await expect(question.locator('.answer-feedback')).toContainText('Riktig.');
});

test('both texts use a centered limited reading column below their images', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(server.url + relative);
  await expect(page.getByLabel('Velg lesestøtte')).toHaveCount(0);
  await expect(page.locator('.reading-glossary')).toHaveCount(0);
  await expect(page.locator('.country summary')).toHaveCount(0);
  await expect(page.getByText('Vis ordliste til bildet', { exact: true })).toHaveCount(0);
  for (const country of countries) {
    const section = page.locator('#' + country.id);
    const card = await section.boundingBox();
    const image = await section.locator('.word-picture').boundingBox();
    const reading = await section.locator('.reading').boundingBox();
    expect(reading.y).toBeGreaterThanOrEqual(image.y + image.height);
    expect(reading.width).toBeLessThan(card.width * .88);
    expect(Math.abs((reading.x + reading.width / 2) - (card.x + card.width / 2))).toBeLessThan(2);
    expect(await section.locator('.reading p').allTextContents()).toEqual(country.paragraphs);
  }
  await expect(page.locator('.picture-fallback').first()).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Les og oversett i par' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Før du avslutter' })).toHaveCount(0);
});

test('missing images expose the alternative text list without blocking reading', async ({ page }) => {
  await page.route(`**/${countries[0].visual.path.split('/').pop()}`, route => route.abort());
  await page.goto(server.url + relative);
  const country = page.locator('#espana');
  await expect(country.locator('.image-error')).toBeVisible();
  await expect(country.locator('.hotspots')).toBeHidden();
  await expect(country.locator('.picture-fallback')).toBeVisible();
  await expect(country.locator('.picture-fallback')).toContainText('mandelkonfekt');
  await expect(country.locator('.reading')).toContainText('Nochebuena');
});

test('the local preview does not send answers or write progress', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
  await page.goto(server.url + relative);
  await page.locator('.question').first().getByRole('radio', { name: 'Nochebuena' }).check();
  await page.locator('.question').first().getByRole('button', { name: 'Sjekk svaret' }).click();
  await page.locator('#chile-cake').click();
  await page.locator('#chile .reading').getByRole('button', { name: 'fruta fresca', exact: true }).click();
  await expect(page.locator('#reading-translation')).toContainText('fersk frukt');
  expect(requests.every(request => request.url.startsWith(server.url) && request.method === 'GET')).toBe(true);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  await page.reload();
  await expect(page.locator('.question input:checked')).toHaveCount(0);
});

test('teacher guidance and its key are separate from the student view', async ({ page }) => {
  await page.goto(server.url + relative);
  await expect(page.locator('[data-teacher-key]')).toHaveCount(0);
  await page.getByRole('link', { name: 'Lærerveiledning', exact: true }).click();
  await expect(page.locator('[data-teacher-key]')).toContainText('6. januar');
  await expect(page.locator('[data-teacher-key]')).toContainText('Abren los regalos.');
  await expect(page.getByRole('heading', { name: 'Vurdering før elevbruk', exact: true })).toHaveCount(0);
  await expect(page.locator('.schedule li')).toHaveCount(6);
});

test('the review preview can be read directly from local files without a server', async ({ page, context }) => {
  await context.setOffline(true);
  await page.goto(pathToFileURL(path.resolve(relative)).toString());
  await expect(page.locator('#espana img')).toBeVisible();
  expect(await page.locator('#espana img').evaluate(img => img.naturalWidth)).toBe(1536);
  await page.locator('#espana-turron').click();
  await expect(panel(page)).toContainText('el turrón');
  await page.locator('#espana .reading').getByRole('button', { name: 'regalos', exact: true }).first().click();
  await expect(page.locator('#reading-translation')).toContainText('gaver');
});

test('both full texts and the printable support link remain readable without JavaScript', async ({ page }) => {
  await page.route('**/preview.js*', route => route.abort());
  await page.goto(server.url + relative);
  for (const country of countries) {
    const section = page.locator('#' + country.id);
    expect(await section.locator('.reading p').allTextContents()).toEqual(country.paragraphs);
    await expect(section.locator('.reading-word').first()).toBeDisabled();
    await expect(section.locator('summary')).toHaveCount(0);
  }
  const pdf = page.getByRole('link', { name: 'Elevark som PDF', exact: true });
  await expect(pdf).toHaveAttribute('href', '../pdf/jul-spania-chile-elev.pdf');
  const response = await page.request.get(new URL(await pdf.getAttribute('href'), page.url()).href);
  expect(response.ok()).toBe(true);
  expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
});

test('printing keeps full texts and hides the transient translation panel', async ({ page }) => {
  await page.goto(server.url + relative);
  await page.locator('#espana .reading').getByRole('button', { name: 'en invierno', exact: true }).click();
  await expect(page.locator('#reading-translation')).toBeVisible();
  await page.evaluate(() => { window.print = () => {}; });
  await page.getByRole('button', { name: 'Skriv ut', exact: true }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#reading-translation')).toBeHidden();
  expect(await page.locator('.reading p').allTextContents()).toEqual(countries.flatMap(country => country.paragraphs));
  await expect(page.locator('.reading-glossary')).toHaveCount(0);
  await page.emulateMedia({ media: 'screen' });
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test('text translations stay inside a mobile screen and support tap dismissal', async ({ page }) => {
    await page.goto(server.url + relative);
    const translation = page.locator('#reading-translation');
    for (const [country, phrase, norwegian] of [
      ['espana', 'el roscón de Reyes', 'kransformet kake'],
      ['chile', 'pasar tiempo juntas', 'tilbringe tid sammen']
    ]) {
      const word = page.locator('#' + country + ' .reading').getByRole('button', { name: phrase, exact: true });
      await word.tap();
      await expect(translation).toBeVisible();
      await expect(translation).toContainText(norwegian);
      const box = await translation.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      expect(box.y + box.height).toBeLessThanOrEqual(844);
      await word.tap();
      await expect(translation).toBeHidden();
      await word.tap();
      await translation.getByRole('button', { name: 'Lukk oversettelsen' }).tap();
      await expect(translation).toBeHidden();
      await word.tap();
      await page.touchscreen.tap(2, 2);
      await expect(translation).toBeHidden();
    }
    await expect(page.locator('.country summary')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await page.locator('.reading p').allTextContents()).toEqual(countries.flatMap(country => country.paragraphs));
  });
  test('tap pins a label, targets do not overlap and no view overflows', async ({ page }) => {
    await page.goto(server.url + relative);
    await page.locator('#chile-cake').tap();
    await expect(page.locator('#chile-word-panel')).toContainText('el pan de Pascua');
    await page.locator('h1').tap();
    await expect(page.locator('#chile-word-panel')).toBeVisible();
    for (const figure of await page.locator('[data-word-picture]').all()) {
      const boxes = await figure.locator('.hotspot').evaluateAll(buttons => buttons.map(button => {
        const r = button.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
      }));
      for (const box of boxes) { expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44); }
      for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
        const x = Math.min(boxes[a].right, boxes[b].right) - Math.max(boxes[a].left, boxes[b].left);
        const y = Math.min(boxes[a].bottom, boxes[b].bottom) - Math.max(boxes[a].top, boxes[b].top);
        expect(x <= 0 || y <= 0).toBe(true);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
});

test('changing a checked answer clears stale feedback (jul-spania-chile)', async ({ page }) => {
  await page.goto(server.url + 'docs/kultur/jul-spania-chile/index.html');
  const forms = page.locator('form.question');
  const form = forms.first();
  const other = forms.nth(1);
  const correct = form.locator('input[value="' + await form.getAttribute('data-answer') + '"]');
  await other.locator('input').first().check();
  await other.getByRole('button', { name: 'Sjekk svaret' }).click();
  const otherFeedback = await other.locator('.answer-feedback').textContent();
  const assertCleared = async () => {
    await expect(form.locator('.answer-feedback')).toHaveText('');
    await expect(form.locator('.answer-feedback')).not.toHaveClass(/correct/);
    for (const selector of ['.answer-hint', '.answer-explanation', '[data-show-explanation]']) await expect(form.locator(selector)).toBeHidden();
    await expect(other.locator('.answer-feedback')).toHaveText(otherFeedback);
  };
  await form.getByRole('button', { name: 'Sjekk svaret' }).click();
  await correct.check();
  await assertCleared();
  await form.getByRole('button', { name: 'Sjekk svaret' }).click();
  await expect(form.locator('.answer-feedback')).toHaveText('Riktig.');
  await correct.focus();
  await page.keyboard.press('ArrowDown');
  await assertCleared();
  await expect(form.locator('input:checked')).toBeFocused();
  if (process.env.CULTURE_UX_CAPTURE === '1') {
    mkdirSync('output/playwright', { recursive: true });
    await form.screenshot({ path: 'output/playwright/kultur-ux-etter-endret-svar.png' });
  }
  await form.getByRole('button', { name: 'Sjekk svaret' }).click();
  await expect(form.locator('.answer-feedback')).toContainText('Prøv igjen');
  await form.getByRole('button', { name: 'Se forklaring' }).click();
  await expect(form.locator('.answer-explanation')).toBeVisible();
  await correct.check();
  await assertCleared();
});
