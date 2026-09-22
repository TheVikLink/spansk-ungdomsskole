import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { startStaticAppServer } from './helpers/static-app-server.js';

let server;
test.beforeAll(async () => { server = await startStaticAppServer(); });
test.afterEach(() => server.setOffline(false));
test.afterAll(async () => server.close());

async function openApp(page) {
  await page.goto(server.url);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.evaluate(() => { studentName = 'Lokal test'; showMainApp(); showPage('dictation'); });
}

test('lyd bruker CORS også lokalt, slik at nettverk og syntetiske byteområder kan kombineres', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => startListeningStory('leo-sevilla'));
  await expect(page.locator('#listeningStoryAudio')).toHaveAttribute('crossorigin', 'anonymous');
  await page.evaluate(() => { endListeningStory(); startDictation(DICTATION_STORIES[0].id); });
  await expect(page.locator('#dictationFullStoryAudio')).toHaveAttribute('crossorigin', 'anonymous');
  await page.locator('#dictationStartBtn').click();
  await expect(page.locator('#dictationSegmentAudio')).toHaveAttribute('crossorigin', 'anonymous');
});

for (const width of [1280, 390]) {
  test(`lytteflyt og lydfeil kan brukes med tastatur ved ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await openApp(page);
    await page.screenshot({ path: `output/listening-release/overview-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Start lyttehistorien', exact: true }).nth(1).click();
    await expect.poll(() => page.evaluate(() => listeningState.audioReady)).toBe(true);
    await page.locator('#listeningStoryAudio').dispatchEvent('error');
    await expect(page.locator('#listeningStoryAudioError')).toBeVisible();
    await page.screenshot({ path: `output/listening-release/error-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Prøv lyden igjen', exact: true }).click();
    await page.locator('#listeningStoryAudio').evaluate(audio => audio.play());
    await page.screenshot({ path: `output/listening-release/preview-${width}.png`, fullPage: true });
    await page.locator('#listeningStoryStartBtn').focus();
    await page.keyboard.press('Enter');
    for (let index = 0; index < 3; index++) {
      await page.locator('input[name="listeningStoryAnswer"]').first().focus();
      await page.keyboard.press('Space');
      await page.keyboard.press('Tab');
      await expect(page.locator('#listeningStoryCheckBtn')).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('#listeningStoryFeedback')).toBeVisible();
      if (index === 0) await page.screenshot({ path: `output/listening-release/feedback-${width}.png`, fullPage: true });
      await page.keyboard.press('Enter');
    }
    await page.locator('#listeningStoryTextSupport summary').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#listeningStoryTextSupport')).toHaveJSProperty('open', true);
    await page.screenshot({ path: `output/listening-release/result-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('diktat skjuler lytteoversikten og kan ikke starte den gamle delte lytteflyten', async ({ page }) => {
  await openApp(page);
  await page.locator('#dictationStoryList').getByRole('button', { name: 'Start diktat', exact: true }).first().click();
  await expect(page.locator('#listeningOverview')).toBeHidden();
  await page.evaluate(() => startListeningStory('carmen-madrid-a0'));
  expect(await page.evaluate(() => listeningState)).toBeNull();
  expect(await page.evaluate(() => typeof startListeningComprehension)).toBe('undefined');
  expect(await page.evaluate(() => DICTATION_STORIES.some(story => 'listeningQuestions' in story))).toBe(false);
  await page.getByRole('button', { name: '✕ Tilbake', exact: true }).click();
  await expect(page.locator('#listeningOverview')).toBeVisible();
});

test('introduksjoner røper ikke Diegos svar eller påstår at Mateo har dårlig tid', async ({ page }) => {
  await openApp(page);
  const stories = await page.evaluate(() => LISTENING_STORIES);
  expect(stories.find(story => story.id === 'diego-cartagena-a1').intro).toBe('Diego forteller om en søndag i Cartagena.');
  expect(stories.find(story => story.id === 'mateo-puebla-a0').intro).toBe('Mateo forteller om en tur til sentrum i Puebla.');
  expect(stories.find(story => story.id === 'diego-cartagena-a1').questions[0].explanation).toBe('Skolen arrangerer strandrydding: «Nuestra escuela organiza una limpieza de la playa».');
  expect(stories.find(story => story.id === 'ines-valparaiso-a1').questions[0].explanation).toBe('Heisen er stengt: «el ascensor está cerrado». Derfor går Inés til fots.');
});

test('alle tilgjengelige historier henter og dekoder egen lyd; diktatfilene og manusene er separate', async ({ page }) => {
  await openApp(page);
  const catalogs = await page.evaluate(() => ({
    listening: LISTENING_STORIES.filter(story => story.fullAudio).map(story => ({ ...story, url: new URL(listeningAudioUrl(story), location.href).href })),
    dictation: DICTATION_STORIES.map(story => ({ transcript: story.segments.map(segment => segment[0]).join(' '), urls: getDictationAudioUrls(story) }))
  }));
  const hash = data => createHash('sha256').update(data).digest('hex');
  const dictationHashes = catalogs.dictation.flatMap(story => story.urls.map(url => {
    expect(new URL(url).pathname).toContain('/audio/diktat/');
    return hash(readFileSync(decodeURIComponent(new URL(url).pathname.replace('/classroom/', ''))));
  }));
  const listeningHashes = [];
  for (const story of catalogs.listening) {
    await page.evaluate(id => startListeningStory(id), story.id);
    await expect(page.locator('#listeningStoryAudio')).toHaveJSProperty('src', story.url);
    await expect.poll(() => page.locator('#listeningStoryAudio').evaluate(audio => audio.duration)).toBeGreaterThan(0);
    const duration = await page.locator('#listeningStoryAudio').evaluate(audio => audio.duration);
    expect(Math.abs(duration - story.durationSeconds)).toBeLessThan(0.1);
    expect(catalogs.dictation.map(item => item.transcript)).not.toContain(story.transcript);
    const response = await page.request.get(story.url);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('audio/');
    const checksum = hash(await response.body());
    expect(dictationHashes).not.toContain(checksum);
    listeningHashes.push(checksum);
    await page.locator('#listeningStoryAudio').evaluate(audio => audio.play());
    await expect.poll(() => page.locator('#listeningStoryAudio').evaluate(audio => audio.currentTime)).toBeGreaterThan(0);
    await page.evaluate(() => endListeningStory());
  }
  expect(new Set(listeningHashes).size).toBe(5);
});

test('spørsmål kan ikke åpnes av play før lyden er klar; feilstatus gjenopprettes', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => startListeningStory('carmen-madrid-a0'));
  await expect.poll(() => page.evaluate(() => listeningState.audioReady)).toBe(true);
  await page.locator('#listeningStoryAudio').dispatchEvent('error');
  await page.locator('#listeningStoryAudio').dispatchEvent('play');
  await expect(page.locator('#listeningStoryStartBtn')).toBeDisabled();
  await expect(page.locator('#listeningStoryAudioStatus')).toContainText('ikke tilgjengelig');
  await page.getByRole('button', { name: 'Prøv lyden igjen', exact: true }).click();
  await expect(page.locator('#listeningStoryAudioError')).toBeHidden();
  await expect.poll(() => page.evaluate(() => listeningState.audioReady)).toBe(true);
  await expect(page.locator('#listeningStoryStartBtn')).toBeDisabled();
  await page.locator('#listeningStoryAudio').evaluate(audio => audio.play());
  await expect(page.locator('#listeningStoryStartBtn')).toBeEnabled();
});

for (const browserOffline of [true, false]) {
  test(`last ned de fem tilgjengelige lyttefilene, last om uten nett og spill dem med byteområder (browserOffline=${browserOffline})`, async ({ page, context }, testInfo) => {
    const mediaRequests = [];
    page.on('response', response => {
      if (response.url().includes('/audio/')) mediaRequests.push({ url: response.url(), status: response.status(), headers: response.headers(), worker: response.fromServiceWorker() });
    });
    page.on('requestfailed', request => {
      if (request.url().includes('/audio/')) mediaRequests.push({ url: request.url(), failure: request.failure() });
    });
    await openApp(page);
    const ids = await page.evaluate(() => LISTENING_STORIES.filter(story => story.fullAudio).map(story => story.id));
    for (const id of ids) {
      await page.evaluate(id => startListeningStory(id), id);
      await page.getByRole('button', { name: 'Last ned lyd til bruk uten nett', exact: true }).click();
      await expect(page.locator('#listeningDownloadStatus')).toContainText('Hele historien er lastet ned');
      await page.evaluate(() => endListeningStory());
    }
    const cached = await page.evaluate(async () => (await (await caches.open(DICTATION_AUDIO_CACHE)).keys()).map(key => new URL(key.url).pathname));
    expect(cached).toHaveLength(5);
    expect(cached.every(path => path.includes('/audio/lyttehistorier/'))).toBe(true);
    server.setOffline(true);
    if (browserOffline) await context.setOffline(true);
    await page.reload();
    await page.evaluate(() => { studentName = 'Lokal test'; showMainApp(); showPage('dictation'); });
    for (const id of ids) {
      await test.step(`Offline playback: ${id}`, async () => {
        await page.evaluate(id => startListeningStory(id), id);
        await expect(page.locator('#listeningDownloadStatus')).toContainText('Hele historien er lastet ned');
        try {
          await page.locator('#listeningStoryAudio').evaluate(audio => audio.play());
        } catch (error) {
          const diagnostics = await page.evaluate(async () => {
            const audio = document.getElementById('listeningStoryAudio');
            const saved = await (await caches.open(DICTATION_AUDIO_CACHE)).match(audio.src);
            return { src: audio.src, error: audio.error && { code: audio.error.code, message: audio.error.message }, readyState: audio.readyState, networkState: audio.networkState, controller: navigator.serviceWorker.controller?.scriptURL, cached: saved && { status: saved.status, headers: Object.fromEntries(saved.headers), bytes: (await saved.arrayBuffer()).byteLength } };
          });
          await testInfo.attach('offline-audio-diagnostics', { body: JSON.stringify({ id, diagnostics, mediaRequests }, null, 2), contentType: 'application/json' });
          console.error('Offline audio diagnostics:', JSON.stringify({ id, diagnostics, mediaRequests }));
          throw error;
        }
        await expect.poll(() => page.locator('#listeningStoryAudio').evaluate(audio => audio.currentTime)).toBeGreaterThan(0);
        const range = await page.evaluate(async () => {
          const response = await fetch(document.getElementById('listeningStoryAudio').src, { headers: { Range: 'bytes=0-99' } });
          return { status: response.status, size: (await response.arrayBuffer()).byteLength };
        });
        expect(range).toEqual({ status: 206, size: 100 });
        await page.evaluate(() => endListeningStory());
      });
    }
  });
}

test('manglende lyd og mislykket nedlasting uten nett gir tydelig feil og kan prøves igjen', async ({ page, context }) => {
  await openApp(page);
  server.setOffline(true);
  await context.setOffline(true);
  await page.evaluate(() => startListeningStory('carmen-madrid-a0'));
  await expect(page.locator('#listeningStoryAudioError')).toBeVisible();
  await expect(page.locator('#listeningStoryStartBtn')).toBeDisabled();
  await page.getByRole('button', { name: 'Last ned lyd til bruk uten nett', exact: true }).click();
  await expect(page.locator('#listeningDownloadStatus')).toContainText('ikke klar til bruk uten nett');
  server.setOffline(false);
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Last ned lyd til bruk uten nett', exact: true }).click();
  await expect(page.locator('#listeningDownloadStatus')).toContainText('Hele historien er lastet ned');
  await expect(page.locator('#listeningStoryAudioError')).toBeHidden();
  await page.locator('#listeningStoryAudio').evaluate(audio => audio.play());
  await expect(page.locator('#listeningStoryStartBtn')).toBeEnabled();
});

test('fasit ligger ikke alltid først, og svar vurderes etter ID når alternativene flyttes', async ({ page }) => {
  await openApp(page);
  const positions = [];
  for (const random of [0, 0.999]) {
    await page.evaluate(random => { Math.random = () => random; startListeningStory('carmen-madrid-a0'); }, random);
    await page.locator('#listeningStoryAudio').evaluate(audio => audio.play());
    await page.locator('#listeningStoryStartBtn').click();
    const values = await page.locator('input[name="listeningStoryAnswer"]').evaluateAll(inputs => inputs.map(input => input.value));
    positions.push(values.indexOf('class'));
    await page.getByLabel('Klassen sin.', { exact: true }).check();
    await page.locator('#listeningStoryCheckBtn').click();
    await expect(page.locator('#listeningStoryFeedback')).toContainText('Riktig svar: Klassen sin.');
    await page.evaluate(() => endListeningStory());
  }
  expect(new Set(positions).size).toBe(2);
});

test('tilgjengelige lyttehistorier viser tekststøtte etter svarene uten lagring eller utsending', async ({ page }) => {
  const traffic = [];
  page.on('request', request => traffic.push({ url: request.url(), method: request.method(), body: request.postData() }));
  await openApp(page);
  const before = await page.evaluate(() => ({ storage: { ...localStorage }, exported: buildProgressExportData().dictation }));
  const stories = await page.evaluate(() => LISTENING_STORIES.filter(story => story.fullAudio));
  expect(stories).toHaveLength(5);
  for (const story of stories) {
    await page.evaluate(id => startListeningStory(id), story.id);
    await page.locator('#listeningStoryAudio').evaluate(audio => audio.play());
    await page.locator('#listeningStoryStartBtn').click();
    for (const [index, question] of story.questions.entries()) {
      await expect(page.locator('#listeningStoryTextSupport')).toHaveCount(0);
      await expect(page.locator('#listeningStoryCheckBtn')).toBeDisabled();
      expect(question.options.filter(option => option.id === question.correctOptionId)).toHaveLength(1);
      expect(new Set(question.options.map(option => option.text)).size).toBe(question.options.length);
      // One wrong answer per story verifies feedback without granting a perfect score.
      const option = question.options.find(option => index === 1 ? option.id !== question.correctOptionId : option.id === question.correctOptionId);
      await page.getByLabel(option.text, { exact: true }).check();
      await page.locator('#listeningStoryCheckBtn').click();
      await expect(page.locator('#listeningStoryFeedback')).toContainText(question.explanation);
      await expect(page.locator('#listeningStoryFeedback')).toContainText(question.options.find(option => option.id === question.correctOptionId).text);
      await expect(page.locator('#listeningStoryTextSupport')).toHaveCount(0);
      await page.locator('#listeningStoryCheckBtn').click();
    }
    await expect(page.locator('#listeningStoryResult')).toContainText('2 av 3 riktige');
    await expect(page.locator('#listeningStoryTextSupport')).toHaveJSProperty('open', false);
    await page.locator('#listeningStoryTextSupport summary').click();
    await expect(page.locator('#listeningStoryTextSupport')).toContainText(story.transcript);
    await expect(page.locator('#listeningStoryTextSupport')).toContainText(story.translation);
    await page.evaluate(() => endListeningStory());
  }
  expect(await page.evaluate(() => ({ storage: { ...localStorage }, exported: buildProgressExportData().dictation }))).toEqual(before);
  expect(traffic.filter(request => new URL(request.url).origin !== new URL(server.url).origin || request.method !== 'GET' || request.body)).toEqual([]);
});
