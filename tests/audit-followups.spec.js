import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { startStaticAppServer } from './helpers/static-app-server.js';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

for (const width of [390, 1280]) {
  test(`qb76: 60-second Madrigal welcome preview works without leaking answers or overflowing at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto(appUrl);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const preview = page.locator('#welcomeMadrigalPreview');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('Du kan allerede spansk!');
    await expect(preview).toContainText('Ord 1 av 3');
    await expect(preview).toContainText('la música');
    await expect(preview.getByRole('button', { name: /Neste ord/ })).toHaveCount(0);

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);

    await preview.getByRole('button', { name: 'musikk', exact: true }).click();
    await expect(preview).toContainText('Riktig!');
    await preview.getByRole('button', { name: /Neste ord/ }).click();

    await expect(preview).toContainText('Ord 2 av 3');
    await expect(preview).toContainText('el hotel');
    await preview.getByRole('button', { name: 'hotell', exact: true }).click();
    await preview.getByRole('button', { name: /Neste ord/ }).click();

    await expect(preview).toContainText('Ord 3 av 3');
    await expect(preview).toContainText('la información');
    await preview.getByRole('button', { name: 'informasjon', exact: true }).click();
    await preview.getByRole('button', { name: 'Se oppsummering' }).click();

    await expect(preview).toContainText('Du klarte 3 av 3');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);

    // Ensure welcome start button selector stays unambiguous
    const startButtons = page.locator('#welcomeScreen').getByRole('button', { name: /Start|Begynn|Kom i gang/ });
    await expect(startButtons).toHaveCount(1);
    await page.locator('#studentNameInput').fill('MadrigalTester');
    await startButtons.click();
    await expect(page.locator('#homePage')).toBeVisible();
  });

  test(`d3ho: optional approved Spanish audio setting, playback, and error handling at ${width}px`, async ({ page }) => {
    const server = await startStaticAppServer();
    try {
      await page.setViewportSize({ width, height: 850 });
      await page.addInitScript(() => {
        window.__audioPlayCalls = [];
        window.__ttsCalls = 0;
        if (window.speechSynthesis) {
          window.speechSynthesis.speak = () => {
            window.__ttsCalls += 1;
          };
        }
        const origPlay = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
          window.__audioPlayCalls.push(this.getAttribute('src') || this.src);
          if (window.__forceAudioFailure) {
            return Promise.reject(new Error('Audio blocked in test'));
          }
          this.dispatchEvent(new Event('playing'));
          return Promise.resolve();
        };
      });
      await page.goto(server.url);
      await page.evaluate(() => {
        localStorage.clear();
        studentName = 'LydTester';
        showMainApp();
      });

      // Off by default in settings
      await page.getByRole('button', { name: 'Innstillinger' }).click();
      const checkbox = page.locator('#settingsAudioOnCorrect');
      await expect(checkbox).not.toBeChecked();
      await checkbox.check();
      await page.getByRole('button', { name: 'Lagre' }).click();
      expect(await page.evaluate(() => localStorage.getItem('spansk123_audioOnCorrect'))).toBe('1');

      // Typed vocab session with a Refold-covered word ("la casa")
      await page.evaluate(() => {
        showPage('vocab');
        const casa = cards.find(c => c.es === 'la casa');
        startVocabSession('custom', [casa], { direction: 'no-es', limit: 1 });
        sessionCards[0] = {
          card: casa,
          direction: 'no-es',
          responseMode: 'typed',
          typed: true,
        };
        currentIndex = 0;
        showingAnswer = false;
        currentCardRated = false;
        showVocabCard();
      });

      await page.locator('#typedVocabInput').fill('la casa');
      await page.locator('#vocabStudy').getByRole('button', { name: 'Sjekk svar' }).click();

      const audioBtn = page.locator('#typedVocabFeedback .correct-audio-btn');
      await expect(audioBtn).toBeVisible();
      await expect(audioBtn).toHaveAttribute('data-approved-audio-path', 'audio/uttale/refold-v1/ESPhoneticWritingSystem_1_word.mp3');
      await expect(page.locator('#typedVocabFeedback .correct-audio-status')).toContainText('Spiller godkjent opptak.');
      expect(await page.evaluate(() => window.__audioPlayCalls)).toContain('audio/uttale/refold-v1/ESPhoneticWritingSystem_1_word.mp3');
      expect(await page.evaluate(() => window.__ttsCalls)).toBe(0);

      // Failure path shows clear Norwegian error and never calls TTS
      await page.evaluate(() => {
        window.__forceAudioFailure = true;
      });
      await audioBtn.click();
      await expect(page.locator('#typedVocabFeedback .correct-audio-status')).toContainText('Lydopptaket kunne ikke spilles av akkurat nå.');
      expect(await page.evaluate(() => window.__ttsCalls)).toBe(0);
    } finally {
      await server.close();
    }
  });

  test(`q96e: hash routing, browser back navigation, and printable Ukens mestringskort at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto(`${appUrl}#kunnskapskart`);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('spansk123_studentName', 'RuteTester');
    });
    await page.reload();

    await expect(page.locator('#brainmapPage')).toBeVisible();
    await page.locator('#navVocab').click();
    await expect(page).toHaveURL(/#gloser$/);
    await expect(page.locator('#vocabPage')).toBeVisible();

    if (width === 390) await page.locator('.nav-more summary').click();
    await page.locator('#navHomework').click();
    await expect(page).toHaveURL(/#lekse$/);
    await expect(page.locator('#homeworkPage')).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/#gloser$/);
    await expect(page.locator('#vocabPage')).toBeVisible();

    await page.locator('#navHome').click();
    await expect(page).toHaveURL(/#start$/);
    await expect(page.locator('#homePrimaryContent > section')).toHaveCount(2);

    await page.locator('#openWeeklyMasteryCardBtn').click();
    const cardModal = page.locator('#weeklyMasteryCardPrintable');
    await expect(cardModal).toBeVisible();
    await expect(cardModal).toContainText('Ukens mestringskort');
    await expect(cardModal).toContainText('RuteTester');
    const cardText = await cardModal.textContent();
    expect(cardText).not.toContain('\u00b7');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);

    await page.locator('#weeklyMasteryCloseBtn').click();
    await expect(cardModal).toHaveCount(0);
  });
}
