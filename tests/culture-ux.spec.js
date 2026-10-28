import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';

async function capture(locator, name) {
  if (process.env.CULTURE_UX_CAPTURE !== '1') return;
  mkdirSync('output/playwright', { recursive: true });
  await locator.screenshot({ path: 'output/playwright/kultur-ux-etter-' + name + '.png' });
}
import { startStaticAppServer } from './helpers/static-app-server.js';

const packs = JSON.parse(readFileSync('data/culture-packages.json', 'utf8')).packages;
const cases = packs.filter(pack => ['jul-spania-chile', 'un-dia-en-peru'].includes(pack.id));
let server;
test.beforeAll(async () => { server = await startStaticAppServer(); });
test.afterAll(async () => server.close());

for (const pack of cases) {
  for (const javaScriptEnabled of [true, false]) test(`${pack.id}: native lesson shortcuts work with JavaScript ${javaScriptEnabled}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(server.url + `docs/kultur/${pack.id}/index.html`);
    const follow = async (link, id) => {
      await link.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp('#' + id + '$'));
      await expect(page.locator('#' + id)).toBeInViewport();
      await expect(page.locator('#' + id)).toBeFocused();
    };
    await follow(page.getByRole('link', { name: 'Start lesingen', exact: true }), pack.countries[0].id + '-title');
    await follow(page.getByRole('navigation', { name: 'I denne økten' }).nth(1).getByRole('link', { name: 'Spørsmål', exact: true }), 'understanding-title');
    if (javaScriptEnabled && pack.id === 'un-dia-en-peru') await capture(page, 'snarveier-retur-mobil');
    for (const [index, question] of pack.questions.entries()) {
      await follow(page.locator('form.question').nth(index).getByRole('link'), question.countryId + '-title');
    }
    await follow(page.getByRole('navigation', { name: 'I denne økten' }).first().getByRole('link', { name: 'Samtale' }), 'comparison-title');
    if (pack.id === 'un-dia-en-peru') await follow(page.getByRole('link', { name: 'Se bildet', exact: true }), 'peru-picture');
    await follow(page.getByRole('navigation', { name: 'I denne økten' }).last().getByRole('link', { name: 'Gloser', exact: true }), 'word-recall-title');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await context.close();
  });
}

for (const width of [360, 390, 768, 1280, 1440, 1920]) test(`reading has stable width with photos between paragraphs at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  for (const pack of cases) {
    await page.goto(server.url + `docs/kultur/${pack.id}/index.html`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    for (const country of pack.countries) {
      const reading = page.locator('#' + country.id + ' .reading');
      expect(await reading.locator('p').allTextContents()).toEqual(country.paragraphs);
      const layout = await reading.evaluate(el => {
        const probe = document.createElement('div');
        probe.style.cssText = 'width:70ch;position:absolute;visibility:hidden';
        el.append(probe);
        const limit = probe.getBoundingClientRect().width;
        probe.remove();
        const box = el.getBoundingClientRect(), parent = el.parentElement.getBoundingClientRect();
        return { width: box.width, limit, centered: Math.abs(box.left + box.width / 2 - parent.left - parent.width / 2),
          photos: [...el.querySelectorAll('.location-photo')].map(photo => ({
            float: getComputedStyle(photo).float,
            top: photo.getBoundingClientRect().top,
            bottom: photo.getBoundingClientRect().bottom,
            previousBottom: photo.previousElementSibling.getBoundingClientRect().bottom,
            nextTop: photo.nextElementSibling?.getBoundingClientRect().top,
          })),
          widths: [...el.querySelectorAll(':scope > p')].map(p => p.getBoundingClientRect().width)
        };
      });
      if (width === 1440 && pack.id === 'un-dia-en-peru') await capture(reading, 'peru-leseflyt-desktop');
      expect(layout.width).toBeLessThanOrEqual(layout.limit + 2);
      expect(layout.centered).toBeLessThan(2);
      expect(Math.max(...layout.widths) - Math.min(...layout.widths)).toBeLessThan(2);
      for (const photo of layout.photos) {
        expect(photo.float).toBe('none');
        expect(photo.top).toBeGreaterThanOrEqual(photo.previousBottom);
        if (photo.nextTop) expect(photo.bottom).toBeLessThanOrEqual(photo.nextTop);
      }
    }
  }
});

test('product and culture links resolve under a classroom subdirectory on every page role', async ({ page }) => {
  for (const relative of ['docs/kultur/index.html', ...cases.flatMap(pack => ['index.html', 'laerer.html'].map(file => `docs/kultur/${pack.id}/${file}`))]) {
    await page.goto(server.url + relative);
    const product = page.locator('.top-bar').getByRole('link', { name: 'Spansk på 1-2-3', exact: true });
    const culture = page.locator('.top-bar').getByRole('link', { name: 'Kultur', exact: true });
    await expect(product).toBeVisible();
    await expect(culture).toBeVisible();
    for (const link of [product, culture]) expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44);
    await culture.click();
    await expect(page).toHaveURL(server.url + 'docs/kultur/index.html');
    await expect(page.locator('.top-bar').getByRole('link', { name: 'Kultur', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.goto(server.url + relative);
    await page.locator('.top-bar').getByRole('link', { name: 'Spansk på 1-2-3', exact: true }).click();
    await expect(page).toHaveURL(server.url + 'index.html');
  }
});

test('the mobile catalogue shows prerequisites, work form and draft status before opening lessons', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(server.url + 'docs/kultur/index.html');
  await expect(page.locator('.culture-card')).toHaveCount(7);
  await capture(page, 'katalog-mobil');
  for (const [index, pack] of packs.entries()) {
    const card = page.locator('.culture-card').nth(index);
    await expect(card).toContainText('Forkunnskaper: ' + pack.catalogPrerequisites);
    await expect(card).toContainText('Arbeidsform: Lesing og samtale i par');
    await expect(card).toContainText('Arbeidsutkast · til lærervurdering');
    await expect(card).toContainText('45 min');
    await expect(card.getByRole('link', { name: 'Åpne elevøkten', exact: true })).toBeVisible();
    await expect(card.getByRole('link', { name: 'Lærerveiledning', exact: true })).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

for (const javaScriptEnabled of [true, false]) test(`digital recall leads to practice and prints one full table (JavaScript ${javaScriptEnabled})`, async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  for (const pack of cases) {
    await page.goto(server.url + `docs/kultur/${pack.id}/index.html#word-recall-title`);
    const recall = page.locator('#word-recall');
    const details = recall.locator('.recall-words');
    const summary = details.locator('summary');
    await expect(recall.getByRole('link', { name: pack.recall.buttonLabel })).toBeVisible();
    await expect(recall.locator('table:visible')).toHaveCount(0);
    await expect(recall).toContainText('Prøv å huske svaret før du snur kortet.');
    if (javaScriptEnabled && pack.id === 'un-dia-en-peru') await capture(recall, 'ordavslutning-mobil');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(recall.locator('table:visible tbody tr')).toHaveCount(10);
    await expect(summary).toBeFocused();
    const table = await details.locator('table').boundingBox();
    const link = await recall.getByRole('link', { name: pack.recall.buttonLabel }).boundingBox();
    expect(link.y + link.height).toBeLessThan(table.y);
    await page.keyboard.press('Space');
    await expect(recall.locator('table:visible')).toHaveCount(0);
    await expect(summary).toBeFocused();
    await page.emulateMedia({ media: 'print' });
    await expect(recall.locator('table:visible')).toHaveCount(1);
    await expect(recall.locator('table:visible tbody tr')).toHaveCount(10);
    await expect(recall.getByText(pack.recall.instruction, { exact: true })).toBeVisible();
    await expect(details).toBeHidden();
    await expect(recall.getByRole('link', { name: pack.recall.buttonLabel })).toBeHidden();
    await expect(page.locator('.lesson-contents:visible, .local-work-link:visible, .reading-links:visible')).toHaveCount(0);
    await page.emulateMedia({ media: 'screen' });
  }
  await context.close();
});

test('photo credits stay compact with complete keyboard and print details', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const pack of packs.filter(pack => pack.countries[0].visual.kind === 'photograph')) {
    await page.goto(server.url + `docs/kultur/${pack.id}/index.html`);
    const country = pack.countries[0];
    const photos = [country.visual, ...country.photos.filter(photo => photo.id !== country.visual.photoId)];
    for (const [index, photo] of photos.entries()) {
      const figure = page.locator('[data-real-word-picture], .location-photo').nth(index);
      await expect(figure.locator('.photo-caption')).toHaveText(photo.caption);
      await expect(figure.locator('.photo-credit')).toContainText(photo.author);
      await expect(figure.locator('.photo-credit')).toContainText(photo.license);
      await expect(figure.getByText(photo.changes, { exact: true }).locator('visible=true')).toHaveCount(0);
      const details = figure.locator('details.photo-source');
      const summary = details.getByText('Om bildet', { exact: true });
      await expect(summary).toBeVisible();
      expect((await summary.boundingBox()).height).toBeGreaterThanOrEqual(44);
      await summary.focus();
      await page.keyboard.press('Enter');
      await expect(details).toContainText(photo.changes);
      await expect(details).toContainText(photo.date);
      await expect(details.getByRole('link', { name: photo.originalTitle, exact: true })).toHaveAttribute('href', photo.sourceUrl);
      await expect(figure.locator(`a[href="${photo.sourceUrl}"]:visible`)).toHaveCount(1);
      await expect(figure.locator('.culture-print-only')).toBeHidden();
      await page.keyboard.press('Space');
      await expect(details.getByRole('link')).toBeHidden();
    }
    await page.emulateMedia({ media: 'print' });
    const printed = page.locator('[data-real-word-picture]');
    await expect(printed.locator('details')).toBeHidden();
    await expect(printed.locator('.culture-print-only')).toContainText(country.visual.changes);
    await expect(printed.locator('.culture-print-only')).toContainText(country.visual.originalTitle);
    await expect(printed.locator('.culture-print-only')).toBeVisible();
    await expect(page.locator('.location-photo')).toBeHidden();
    await page.emulateMedia({ media: 'screen' });
  }
});
