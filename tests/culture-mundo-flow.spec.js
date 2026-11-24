import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { startStaticAppServer } from './helpers/static-app-server.js';
const allPacks = JSON.parse(readFileSync('data/culture-packages.json')).packages;
const lessons = allPacks.filter(pack => pack.id.startsWith('un-dia-en-'));
let server;
test.beforeAll(async () => { server = await startStaticAppServer(); });
test.afterAll(async () => server.close());

test('the catalogue opens every requested country and its teacher guide', async ({ page }) => {
  await page.goto(server.url + 'docs/kultur/index.html');
  await expect(page.getByRole('heading', { name: 'Mundo AM', exact: true })).toBeVisible();
  await expect(page.locator('.culture-card')).toHaveCount(7);
  for (const pack of lessons) {
    const card = page.locator('.culture-card').filter({ has: page.getByRole('heading', { name: pack.title, exact: true }) });
    await expect(card.getByRole('link', { name: 'Åpne elevøkten' })).toHaveAttribute('href', `${pack.id}/index.html`);
    await expect(card.getByRole('link', { name: 'Lærerveiledning' })).toHaveAttribute('href', `${pack.id}/laerer.html`);
  }
});

for (const pack of lessons) {
  test(`${pack.id}: complete reading, local lookups and four active questions`, async ({ page }) => {
    await page.goto(server.url + `docs/kultur/${pack.id}/index.html`);
    await expect(page.getByRole('heading', { name: pack.title, exact: true })).toBeVisible();
    expect(await page.locator('.reading p').allTextContents()).toEqual(pack.countries[0].paragraphs);
    await expect(page.locator('details.reading-glossary')).toHaveCount(0);
    await expect(page.locator('[data-teacher-key]')).toHaveCount(0);
    const word = page.locator('.reading-word').first();
    const translation = await word.getAttribute('data-translation');
    await word.focus();
    await expect(page.locator('#reading-translation-text')).toHaveText(translation);
    await page.keyboard.press('Escape');
    await expect(page.locator('#reading-translation')).toBeHidden();
    await page.locator('.hotspot').first().click();
    await expect(page.locator('.word-panel').first()).toBeVisible();
    await page.getByRole('button', { name: 'Lukk ordstøtten' }).click();
    for (const [index, q] of pack.questions.entries()) {
      const form = page.locator('form.question').nth(index);
      if (!index) {
        await form.getByRole('button', { name: 'Sjekk svaret' }).click();
        await expect(form.locator('.answer-feedback')).toHaveText('Velg et svar først.');
        await form.getByRole('radio', { name: q.options.find(option => option.id !== q.answerId).text, exact: true }).check();
        await form.getByRole('button', { name: 'Sjekk svaret' }).click();
        await expect(form.locator('.answer-feedback')).toContainText('Prøv igjen');
        await expect(form.locator('.answer-explanation')).toBeHidden();
      }
      await form.getByRole('radio', { name: q.options.find(option => option.id === q.answerId).text, exact: true }).check();
      await form.getByRole('button', { name: 'Sjekk svaret' }).click();
      await expect(form.locator('.answer-feedback')).toHaveText('Riktig.');
      await expect(form.locator('.answer-explanation')).toHaveText(q.explanation);
    }
    await page.getByRole('link', { name: 'Lærerveiledning', exact: true }).click();
    await expect(page.locator('[data-teacher-key]')).toBeVisible();
    for (const answer of pack.teacher.answers) await expect(page.locator('[data-teacher-key]')).toContainText(answer.answer);
    await expect(page.getByRole('heading', { name: 'Vurdering før elevbruk' })).toHaveCount(0);
  });

  test(`${pack.id}: its ten vocabulary words and return link work`, async ({ page }) => {
    await page.goto(server.url + `docs/kultur/${pack.id}/index.html`);
    await page.getByRole('link', { name: pack.recall.buttonLabel, exact: true }).click();
    await page.locator('#studentNameInput').fill('Demo');
    await page.locator('.login-btn-primary').click();
    await expect(page.locator('#vocabStudy')).toBeVisible();
    await expect(page.locator('#cultureVocabularyContext')).toContainText(pack.title);
    expect(await page.evaluate(id => getCultureVocabularyCards(id).length, pack.id)).toBe(10);
    const words = await page.evaluate(() => [...new Set(sessionCards.map(item => item.card.es.toLocaleLowerCase()))].sort());
    expect(words).toEqual(pack.vocabulary.map(word => word.es.toLocaleLowerCase()).sort());
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('link', { name: 'Tilbake til teksten', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`docs/kultur/${pack.id}/index.html#${pack.countries[0].id}-title$`));
  });
}

test('all country texts fit mobile width and keep their reading below their image', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  for (const pack of lessons) {
    await page.goto(server.url + `docs/kultur/${pack.id}/index.html`);
    const boxes = await page.locator('.country').evaluate(country => ({ image: country.querySelector('.image-frame').getBoundingClientRect().bottom, reading: country.querySelector('.reading').getBoundingClientRect().top, overflow: document.documentElement.scrollWidth > innerWidth }));
    expect(boxes.reading).toBeGreaterThan(boxes.image);
    expect(boxes.overflow).toBe(false);
    await page.locator('.reading-word').first().tap();
    const panel = await page.locator('#reading-translation').boundingBox();
    expect(panel.x).toBeGreaterThanOrEqual(0);
    expect(panel.x + panel.width).toBeLessThanOrEqual(390);
  }
  await context.close();
});

test('missing image leaves country reading and a useful list of image words', async ({ page }) => {
  const pack = lessons[0];
  await page.route(`**/${pack.countries[0].visual.path.split('/').pop()}`, route => route.abort());
  await page.goto(server.url + `docs/kultur/${pack.id}/index.html`);
  await expect(page.locator('.image-error')).toBeVisible();
  await expect(page.locator('.picture-fallback')).toBeVisible();
  expect(await page.locator('.reading p').allTextContents()).toEqual(pack.countries[0].paragraphs);
  await expect(page.locator('.hotspots')).toBeHidden();
});

for (const width of [360, 390]) test(`every image word has a separate touch target at ${width}px`, async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  for (const pack of allPacks) {
    await page.goto(server.url + `docs/kultur/${pack.id}/index.html`);
    const points = await page.locator('.hotspot').evaluateAll(buttons => buttons.map(button => {
      const box = button.getBoundingClientRect();
      return { id: button.id, x: box.x + box.width / 2, y: box.y + box.height / 2, diameter: box.width };
    }));
    for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
      const a = points[i], b = points[j];
      expect(Math.hypot(a.x - b.x, a.y - b.y), `${pack.id}: ${a.id} overlaps ${b.id}`).toBeGreaterThanOrEqual((a.diameter + b.diameter) / 2);
    }
    for (const point of pack.countries.flatMap(country => country.visual.hotspots)) {
      await page.locator(`#${point.id}`).tap();
      const panel = page.locator(`#${await page.locator(`#${point.id}`).getAttribute('aria-controls')}`);
      const term = [...pack.vocabulary, ...pack.supportTerms].find(term => term.id === point.termId);
      await expect(panel.locator('.word-panel-content')).toContainText(term.es);
      await expect(panel.locator('.word-panel-content')).toContainText(term.no);
      await panel.getByRole('button', { name: 'Lukk ordstøtten' }).tap();
    }
  }
  await context.close();
});

test('scheduled country words use their own practice wording and preserve their return route', async ({ page }) => {
  const pack = lessons.find(pack => pack.id === 'un-dia-en-honduras');
  await page.goto(server.url + 'index.html#gloser/' + pack.id);
  await page.locator('#studentNameInput').fill('Demo');
  await page.locator('.login-btn-primary').click();
  await page.evaluate(id => {
    for (const card of getCultureVocabularyCards(id)) {
      card.noEs = { ...card.noEs, repetitions: 2, nextReview: '2999-01-02T12:00:00Z' };
      card.esNo = { ...card.esNo, repetitions: 2, nextReview: '2999-01-02T12:00:00Z' };
    }
    saveData();
  }, pack.id);
  await page.reload();
  await expect(page.locator('#cultureVocabularyContext')).toContainText(pack.title);
  await expect(page.getByRole('button', { name: 'Øv ekstra på glosene' })).toBeVisible();
  await expect(page.locator('#cultureVocabularyContext')).not.toContainText('juleglosene');
  await page.getByRole('link', { name: 'Tilbake til teksten', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`docs/kultur/${pack.id}/index.html#${pack.countries[0].id}-title$`));
});

for (const width of [360, 1280]) {
  test(`real location photos load locally with readable credits at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const external = [];
    page.on('request', request => { if (!request.url().startsWith(server.url)) external.push(request.url()); });
    for (const pack of lessons) {
      await page.goto(server.url + `docs/kultur/${pack.id}/index.html`);
      const figures = page.locator('[data-real-word-picture], .location-photo');
      await expect(figures).toHaveCount(2);
      for (let i = 0; i < 2; i++) {
        const figure = figures.nth(i);
        await figure.scrollIntoViewIfNeeded();
        await expect(figure.locator('img')).toBeVisible();
        await expect.poll(() => figure.locator('img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
        await expect(figure.locator('.photo-credit')).toContainText('CC BY 2.0');
        const imagePath = await figure.locator('img').getAttribute('src');
        const photo = pack.countries[0].photos.find(photo => '../../../' + photo.path === imagePath);
        await figure.locator('summary').click();
        await expect(figure.locator('details').getByRole('link', { name: photo.originalTitle, exact: true })).toHaveAttribute('href', photo.sourceUrl);
        const box = await figure.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
      const bodyPhoto = page.locator('.reading > .location-photo:not(.panorama)');
      if (await bodyPhoto.count()) {
        expect(await bodyPhoto.evaluate(el => getComputedStyle(el).float)).toBe('none');
      }
    }
    expect(external).toEqual([]);
  });
}

test('changing a checked answer clears stale feedback (un-dia-en-peru)', async ({ page }) => {
  await page.goto(server.url + 'docs/kultur/un-dia-en-peru/index.html');
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
  await form.getByRole('button', { name: 'Sjekk svaret' }).click();
  await expect(form.locator('.answer-feedback')).toContainText('Prøv igjen');
  await form.getByRole('button', { name: 'Se forklaring' }).click();
  await expect(form.locator('.answer-explanation')).toBeVisible();
  await correct.check();
  await assertCleared();
});
