import { test, expect } from '@playwright/test';
import { startStaticAppServer } from './helpers/static-app-server.js';

let server;
test.beforeAll(async () => { server = await startStaticAppServer(); });
test.afterAll(async () => server.close());

test('Inés og Diego forteller i presens og har fasit som følger de nye manusene', async ({ page }) => {
  await page.goto(server.url);
  const [ines, diego] = await page.evaluate(() => ['ines-valparaiso-a1', 'diego-cartagena-a1'].map(id => LISTENING_STORIES.find(story => story.id === id)));
  for (const story of [ines, diego]) {
    expect(story.transcript).not.toMatch(/\b(ayer|pasado|salí|tenía|iba|estaba|decidí|vi|pintaba|había|decía|quedé|hablé|perdí|importó|llegué|despertó|organizaba|quería|recogían|separaban|explicó|veía|dio|volví|haber ayudado)\b/iu);
    expect(story.transcript.split(/\s+/).length).toBeGreaterThanOrEqual(85);
    expect(story.questions).toHaveLength(3);
  }
  expect([ines.fullAudio, diego.fullAudio]).toEqual(['Hola soy Inés.mp3', 'Diego de Cartagena.mp3']);
  expect([ines.durationSeconds, diego.durationSeconds]).toEqual([30.9, 32.124]);
  expect(ines.transcript).toContain('Hoy estoy en la biblioteca. Leo un libro sobre animales.');
  expect(ines.transcript).toContain('el ascensor está cerrado. Por eso voy a pie.');
  expect(ines.transcript).toContain('Pinta un gato azul con una bicicleta');
  expect(ines.transcript).toContain('Estoy contenta porque tengo una nueva amiga.');
  expect(ines.translation).toContain('Jeg er glad fordi jeg har en ny venninne.');
  expect(ines.questions.map(q => q.options.find(o => o.id === q.correctOptionId).text)).toEqual(['Heisen er stengt.', 'En blå katt med en sykkel.', 'Hun har en ny venninne.']);
  expect(diego.transcript).toContain('Nuestra escuela organiza una limpieza de la playa.');
  expect(diego.transcript).toContain('El plástico es peligroso para las tortugas. No es comida');
  expect(diego.transcript).toContain('Estoy cansado, pero contento.');
  expect(diego.translation).toContain('Jeg er trøtt, men glad.');
  expect(diego.questions.map(q => q.options.find(o => o.id === q.correctOptionId).text)).toEqual(['Skolen arrangerer strandrydding.', 'Det er farlig for skilpadder.', 'Trøtt, men glad.']);
});

for (const width of [390, 1280]) {
  test(`nye opptak brukes i stedet for gamle offline-filer ved ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(server.url);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await page.evaluate(async () => {
      const cache = await caches.open(DICTATION_AUDIO_CACHE);
      for (const filename of ['Hola soy Inés y vivo.wav', 'Hola me llamo Diego .wav']) {
        const url = new URL(`audio/lyttehistorier/${encodeURIComponent(filename)}`, location.href).href;
        await cache.put(url, await fetch(url));
      }
    });
    await page.evaluate(() => { studentName = 'Lokal test'; showMainApp(); showPage('dictation'); });
    for (const id of ['ines-valparaiso-a1', 'diego-cartagena-a1']) {
      await page.evaluate(storyId => startListeningStory(storyId), id);
      await page.getByRole('button', { name: 'Last ned lyd til bruk uten nett', exact: true }).click();
      await expect(page.locator('#listeningDownloadStatus')).toContainText('Hele historien er lastet ned');
      await page.evaluate(() => endListeningStory());
    }
    await context.setOffline(true);
    await page.reload();
    await page.evaluate(() => { studentName = 'Lokal test'; showMainApp(); showPage('dictation'); });
    await expect(page.getByRole('button', { name: 'Start lyttehistorien', exact: true })).toHaveCount(5);
    for (const [title, filename] of [['En uventet ettermiddag i Valparaíso', 'Hola soy Inés.mp3'], ['Diego hjelper på stranden', 'Diego de Cartagena.mp3']]) {
      const card = page.locator('.listening-story-card').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
      await card.getByRole('button', { name: 'Start lyttehistorien' }).click();
      await expect(page.locator('#listeningStoryAudio')).toHaveJSProperty('src', new URL(`audio/lyttehistorier/${encodeURIComponent(filename)}`, server.url).href);
      await expect(page.locator('#listeningDownloadStatus')).toContainText('Hele historien er lastet ned');
      await page.locator('#listeningStoryAudio').evaluate(audio => audio.play());
      await expect.poll(() => page.locator('#listeningStoryAudio').evaluate(audio => audio.currentTime)).toBeGreaterThan(0);
      await page.evaluate(() => endListeningStory());
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `output/listening-present/available-${width}.png`, fullPage: true });
  });
}
