import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

const installSpeechMock = async (page, { available = true } = {}) => {
  await page.addInitScript(({ available: isAvailable }) => {
    const calls = [];
    class MockUtterance {
      constructor(text) {
        this.text = text;
        this.lang = '';
        this.voice = null;
      }
    }
    window.SpeechSynthesisUtterance = MockUtterance;
    window.__speechCalls = calls;
    if (isAvailable) {
      Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: {
          cancel: () => calls.push({ type: 'cancel' }),
          speak: utterance => calls.push({ type: 'speak', text: utterance.text, lang: utterance.lang, voice: utterance.voice?.lang || null }),
          getVoices: () => [{ lang: 'nb-NO' }, { lang: 'es-MX' }]
        }
      });
    } else {
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined });
    }
  }, { available });
};

test.describe('local Spanish TTS pilot', () => {
  test('uses a Spanish voice, cancels queued audio, and exposes a safe helper', async ({ page }) => {
    await installSpeechMock(page);
    await page.goto(appUrl);

    const result = await page.evaluate(() => ({
      available: isSpeechAvailable(),
      spoken: speakSpanish('hola')
    }));

    expect(result).toEqual({ available: true, spoken: true });
    await expect.poll(() => page.evaluate(() => window.__speechCalls)).toEqual([
      { type: 'cancel' },
      { type: 'speak', text: 'hola', lang: 'es-ES', voice: 'es-MX' }
    ]);
  });

  test('returns false instead of throwing when speech synthesis is unavailable', async ({ page }) => {
    await installSpeechMock(page, { available: false });
    await page.goto(appUrl);

    const result = await page.evaluate(() => ({
      available: isSpeechAvailable(),
      spoken: speakSpanish('hola')
    }));

    expect(result).toEqual({ available: false, spoken: false });
  });

  test('adds a manual audio control without auto-playing a vocabulary card', async ({ page }) => {
    await installSpeechMock(page);
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev TTS';
      showMainApp();
      showPage('vocab');
      sessionCards = [{ card: cards[0], direction: 'no-es', typed: false }];
      currentIndex = 0;
      document.getElementById('vocabSettings').classList.add('hidden');
      document.getElementById('vocabStudy').classList.remove('hidden');
      showVocabCard();
    });

    expect(await page.evaluate(() => window.__speechCalls)).toEqual([]);
    await page.evaluate(() => flipCard());
    const button = page.locator('#flashcardArea [data-speak-spanish]');
    await expect(button).toBeVisible();
    await button.click();
    await expect.poll(() => page.evaluate(() => window.__speechCalls.length)).toBe(2);
  });

  test('adds manual audio to a Spanish mixed-quiz prompt without auto-playing', async ({ page }) => {
    await installSpeechMock(page);
    await page.goto(appUrl);
    await page.evaluate(() => {
      studentName = 'Elev TTS';
      showMainApp();
      showPage('vocab');
      mixedQuizState = {
        quiz: {
          items: [{
            questionId: 'tts.quiz.hola',
            itemType: 'vocabulary',
            direction: 'es-no',
            prompt: 'hola',
            responseMode: 'typed',
            acceptedAnswers: [{ value: 'hei' }]
          }]
        },
        index: 0,
        answered: 0,
        correct: 0,
        results: []
      };
      document.getElementById('mixedQuizStudy').classList.remove('hidden');
      renderMixedQuizQuestion();
    });

    const button = page.locator('#mixedQuizQuestion [data-speak-spanish]');
    await expect(button).toBeVisible();
    expect(await page.evaluate(() => window.__speechCalls)).toEqual([]);
    await button.click();
    await expect.poll(() => page.evaluate(() => window.__speechCalls.length)).toBe(2);
  });
});
