import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { startStaticAppServer } from './helpers/static-app-server.js';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.beforeEach(async ({ page }) => {
  // Guard the external API even on devices where synthesis is available.
  await page.addInitScript(() => {
    window.__speechCalls = [];
    window.SpeechSynthesisUtterance = function (text) { window.__speechCalls.push(text); };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      getVoices: () => [{ lang: 'es-ES', localService: true }],
      cancel: () => window.__speechCalls.push('cancel'),
      speak: () => window.__speechCalls.push('speak')
    } });
  });
});

test.afterEach(async ({ page }) => {
  expect(await page.evaluate(() => window.__speechCalls)).toEqual([]);
});

test('the app contains no browser speech synthesis implementation', async ({ page }) => {
  await page.goto(appUrl);
  expect(readFileSync('index.html', 'utf8')).not.toMatch(/speechSynthesis|SpeechSynthesisUtterance|speakSpanish/);
});

test('a Spanish quiz prompt reports missing recording without offering synthesized audio', async ({ page }) => {
  await page.goto(appUrl);
  await page.evaluate(() => {
    studentName = 'Lokal test'; showMainApp(); showPage('vocab');
    mixedQuizState = {
      quiz: { items: [{ questionId: 'audio.quiz.hola', itemType: 'vocabulary', direction: 'es-no', prompt: 'hola', responseMode: 'typed', acceptedAnswers: [{ value: 'hei' }] }] },
      index: 0, answered: 0, correct: 0, results: []
    };
    document.getElementById('mixedQuizStudy').classList.remove('hidden');
    renderMixedQuizQuestion();
  });
  await expect(page.locator('#mixedQuizQuestion [role="status"]')).toHaveText('Lydopptak er ikke tilgjengelig for denne oppgaven.');
  await expect(page.locator('#mixedQuizQuestion [data-speak-spanish]')).toHaveCount(0);
});

test('a listening story without a recording clearly explains why it cannot start', async ({ page }) => {
  await page.goto(appUrl);
  await page.evaluate(() => {
    studentName = 'Lokal test'; showMainApp(); showPage('dictation');
    LISTENING_STORIES[0].fullAudio = null;
    renderListeningOverview();
  });
  const story = page.locator('.listening-story-card').first();
  await expect(story).toContainText('Historien får ny lyd. Velg en annen historie så lenge.');
  await expect(story.getByRole('button')).toBeDisabled();
  expect(await page.evaluate(() => listeningState)).toBeNull();
});

test.describe('recording failures never synthesize replacement audio', () => {
  test.use({ serviceWorkers: 'block' });
  let server;
  test.beforeAll(async () => { server = await startStaticAppServer(); });
  test.afterAll(async () => { await server?.close(); });

  for (const mode of ['listening', 'dictation']) {
    for (const failure of ['404', 'decode', 'offline', 'playback']) {
      test(`${mode}: ${failure} reports an error without revealing answers or completing practice`, async ({ page, context }) => {
        await page.goto(server.url);
        await page.evaluate(() => { studentName = 'Lokal test'; showMainApp(); showPage('dictation'); });
        const before = await page.evaluate(() => ({ ...localStorage }));
        if (failure === 'offline') await context.setOffline(true);
        if (failure === '404' || failure === 'decode') {
          await page.route('**/audio/**', route => route.fulfill({
            status: failure === '404' ? 404 : 200,
            contentType: failure === '404' ? 'text/plain' : 'audio/wav',
            body: failure === '404' ? 'Not found' : 'not decodable audio'
          }));
        }
        await page.evaluate(mode => mode === 'listening'
          ? startListeningStory('carmen-madrid-a0') : startDictation(DICTATION_STORIES[0].id), mode);
        const audioId = mode === 'listening' ? '#listeningStoryAudio' : '#dictationFullStoryAudio';
        if (failure === 'playback') {
          await page.locator(audioId).evaluate(audio => audio.play());
          await expect.poll(() => page.locator(audioId).evaluate(audio => audio.currentTime)).toBeGreaterThan(0);
          await page.locator(audioId).dispatchEvent('error');
        }
        await expect(page.locator(mode === 'listening' ? '#listeningStoryAudioError' : '#dictationAudioError')).toBeVisible();
        await expect(page.locator(mode === 'listening' ? '#listeningStoryStartBtn' : '#dictationStartBtn')).toBeDisabled();
        await expect(page.locator('#listeningStoryTextSupport, #dictationSolution')).toHaveCount(0);
        expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before);
      });
    }
  }
});

test('a vocabulary card without a recording explains missing audio and never offers TTS', async ({ page }) => {
  await page.goto(appUrl);
  await page.evaluate(() => {
    studentName = 'Lokal test';
    showMainApp();
    showPage('vocab');
    sessionCards = [{ card: cards[0], direction: 'no-es', typed: false }];
    currentIndex = 0;
    document.getElementById('vocabSettings').classList.add('hidden');
    document.getElementById('vocabStudy').classList.remove('hidden');
    showVocabCard();
  });
  await expect(page.locator('#flashcardArea [role="status"]')).toHaveCount(0);
  await page.evaluate(() => flipCard());
  await expect(page.locator('#flashcardArea [role="status"]')).toHaveText('Lydopptak er ikke tilgjengelig for denne oppgaven.');
  await expect(page.locator('#flashcardArea [data-speak-spanish]')).toHaveCount(0);
  expect(await page.evaluate(() => window.__speechCalls)).toEqual([]);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `output/audio-policy/missing-recording-${width}.png`, fullPage: true });
  }
});
