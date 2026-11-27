import { test, expect } from '@playwright/test';
import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createUndervisningRouter } from '../server/undervisning-access.js';
import { createSchoolLicenseCode } from '../src/domain/school-license.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const TEST_SECRET = 'playwright-test-license-secret-32-chars';

async function startUndervisningServer() {
  const app = express();
  app.use(createUndervisningRouter({
    projectRoot,
    getSecret: () => TEST_SECRET,
    cookieSecure: false,
    enforcePaywall: true,
  }));
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve())),
  };
}

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
]) {
  test(`Undervisningspakken portal filtering, lock redirect and school license activation at ${viewport.width}px`, async ({ page }) => {
    const server = await startUndervisningServer();
    try {
      await page.setViewportSize(viewport);
      await page.goto(`${server.url}/undervisning/`);

      await expect(page.getByRole('heading', { name: 'Undervisningstimer i spansk' })).toBeVisible();
      await expect(page.locator('.catalog-section h2').first()).toHaveText('Gratis prøvetimer');
      await expect(page.locator('.catalog-section').first().locator('li[data-lesson-id]')).toHaveCount(4);
      await expect(page.locator('.catalog li[data-lesson-id]')).toHaveCount(46);

      // Zero horizontal overflow
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow).toBe(false);

      // Filter to 4 free sample lessons
      await page.getByRole('button', { name: 'Gratis prøvetimer (4)' }).click();
      await expect(page.locator('.catalog li[data-lesson-id]:visible')).toHaveCount(4);

      // Search filters cleanly
      await page.getByRole('button', { name: /Alle \(46\)/ }).click();
      await page.locator('#lessonSearchInput').fill('familie');
      await expect(page.locator('.catalog li[data-lesson-id="familie"]')).toBeVisible();
      await expect(page.locator('.catalog li[data-lesson-id="tall"]')).toBeHidden();
      await page.locator('#lessonSearchInput').fill('');

      // Free lessons open directly without a code
      await page.goto(`${server.url}/undervisning/tall/index.html`);
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Hvor mange billetter?');
      await page.goto(`${server.url}/undervisning/jul-spania-chile/index.html`);
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Planlegg julekvelden');

      // Paid lesson redirects back to portal with lock notice
      await page.goto(`${server.url}/undervisning/familie/index.html`);
      await expect(page).toHaveURL(/\/undervisning\/\?las=familie$/);
      await expect(page.locator('#lockedNotice')).toBeVisible();
      await expect(page.locator('#lockedNotice')).toContainText('Hvem kommer på besøk?');

      // Activating a valid school license unlocks all 46 lessons and PDF partner cards
      const validCode = createSchoolLicenseCode({
        school: 'Solhaugen ungdomsskole',
        expiresAt: '2027-08-31',
      }, TEST_SECRET);
      await page.locator('#licenseCodeInput').fill(validCode);
      await page.getByRole('button', { name: 'Lås opp alle 46 timer' }).click();

      await expect(page.locator('#licensePanel')).toContainText('Aktiv skolelisens: Solhaugen ungdomsskole');
      await expect(page.locator('#lockedNotice')).toBeHidden();

      await page.goto(`${server.url}/undervisning/familie/index.html`);
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Hvem kommer på besøk?');

      const pdfResponse = await page.request.get(`${server.url}/undervisning/familie/partnerkort.pdf`);
      expect(pdfResponse.status()).toBe(200);
      expect((await pdfResponse.body()).subarray(0, 5).toString()).toBe('%PDF-');
    } finally {
      await server.close();
    }
  });
}

test('Undervisningspakken analytics tracks anonymous pdf_download, audio_play, license_activate and sanitizes beforeSend', async ({ page }) => {
  const server = await startUndervisningServer();
  const insightsRequests = [];
  page.on('request', (req) => {
    if (req.url().includes('/_vercel/insights/')) {
      insightsRequests.push(req.url());
    }
  });

  try {
    await page.route('**/undervisning/tall/*.pdf', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="partnerkort-a.pdf"',
        },
        body: '%PDF-1.4\n',
      });
    });

    await page.goto(`${server.url}/undervisning/tall/index.html`);
    await expect.poll(() => page.evaluate(() => typeof window.va)).toBe('function');

    const beforeSendCheck = await page.evaluate(() => {
      const entry = (window.vaq || []).find(([cmd]) => cmd === 'beforeSend');
      const beforeSend = entry && entry[1];
      if (typeof beforeSend !== 'function') return { missing: true };
      const cleanPageview = beforeSend({
        type: 'pageview',
        url: `${window.location.origin}/undervisning/tall/elev.html?elev=SP123E.secret&fbclid=abc#hash`,
      });
      const blockedSchool = beforeSend({
        type: 'pageview',
        url: `${window.location.origin}/school?activity=1`,
      });
      const blockedCustom = beforeSend({
        type: 'event',
        url: `${window.location.origin}/undervisning/tall/elev.html`,
        payload: {
          name: 'student_answer',
          data: { text: 'hemmelig' },
        },
      });
      const cleanLicensePayloadEvent = beforeSend({
        type: 'event',
        url: `${window.location.origin}/undervisning/?kode=SPANSK2026`,
        payload: {
          name: 'license_activate',
          data: { type: 'demo', extra: 'drop-me' },
        },
      });
      const cleanPdfPayloadEvent = beforeSend({
        type: 'event',
        url: `${window.location.origin}/undervisning/tall/index.html?kode=SP123-SECRET`,
        payload: {
          name: 'pdf_download',
          data: { lesson: 'tall', file: 'partnerkort-a.pdf', extra: 'drop-me' },
        },
      });
      const cleanAudioPayloadEvent = beforeSend({
        type: 'event',
        url: `${window.location.origin}/undervisning/tall/elev.html?elev=secret`,
        payload: {
          name: 'audio_play',
          data: { lesson: 'tall', file: 'dialog.mp3', extra: 'drop-me' },
        },
      });
      return { cleanPageview, blockedSchool, blockedCustom, cleanLicensePayloadEvent, cleanPdfPayloadEvent, cleanAudioPayloadEvent };
    });

    expect(beforeSendCheck.missing).toBeFalsy();
    expect(beforeSendCheck.cleanPageview?.url).toMatch(/\/undervisning\/tall\/elev\.html$/u);
    expect(beforeSendCheck.cleanPageview?.url).not.toContain('?');
    expect(beforeSendCheck.cleanPageview?.url).not.toContain('#');
    expect(beforeSendCheck.blockedSchool).toBeNull();
    expect(beforeSendCheck.blockedCustom).toBeNull();
    expect(beforeSendCheck.cleanLicensePayloadEvent).toEqual({
      type: 'event',
      url: expect.stringMatching(/\/undervisning\/$/u),
      payload: { name: 'license_activate', data: { type: 'demo' } },
    });
    expect(beforeSendCheck.cleanPdfPayloadEvent).toEqual({
      type: 'event',
      url: expect.stringMatching(/\/undervisning\/tall\/index\.html$/u),
      payload: { name: 'pdf_download', data: { lesson: 'tall', file: 'partnerkort-a.pdf' } },
    });
    expect(beforeSendCheck.cleanAudioPayloadEvent).toEqual({
      type: 'event',
      url: expect.stringMatching(/\/undervisning\/tall\/elev\.html$/u),
      payload: { name: 'audio_play', data: { lesson: 'tall', file: 'dialog.mp3' } },
    });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('a[href="partnerkort-a.pdf"]').first().click(),
    ]);
    await download.cancel().catch(() => {});

    const pdfEvents = await page.evaluate(() =>
      (window.vaq || [])
        .filter(([cmd, payload]) => cmd === 'event' && payload?.name === 'pdf_download')
        .map(([, payload]) => payload)
    );
    expect(pdfEvents).toEqual([
      { name: 'pdf_download', data: { lesson: 'tall', file: 'partnerkort-a.pdf' } },
    ]);

    await page.goto(`${server.url}/undervisning/tall/elev.html`);
    const audioBasename = await page.evaluate(() => {
      const audio = document.querySelector('audio');
      if (!audio) return '';
      const src = audio.currentSrc || audio.getAttribute('src') || '';
      const resolved = new URL(src, window.location.href);
      const file = resolved.pathname.split('/').pop() || '';
      audio.dispatchEvent(new Event('play'));
      audio.dispatchEvent(new Event('play'));
      return file;
    });
    expect(audioBasename).toMatch(/^[a-z0-9-]+\.mp3$/u);

    const audioEvents = await page.evaluate(() =>
      (window.vaq || [])
        .filter(([cmd, payload]) => cmd === 'event' && payload?.name === 'audio_play')
        .map(([, payload]) => payload)
    );
    expect(audioEvents).toEqual([
      { name: 'audio_play', data: { lesson: 'tall', file: audioBasename } },
    ]);

    await page.goto(`${server.url}/undervisning/`);
    await page.locator('#licenseCodeInput').fill('SPANSK2026');
    await page.getByRole('button', { name: 'Lås opp alle 46 timer' }).click();
    await expect(page.locator('#licensePanel')).toContainText('Aktiv skolelisens:');

    const demoActivateEvents = await page.evaluate(() =>
      (window.vaq || [])
        .filter(([cmd, payload]) => cmd === 'event' && payload?.name === 'license_activate')
        .map(([, payload]) => payload)
    );
    expect(demoActivateEvents).toEqual([
      { name: 'license_activate', data: { type: 'demo' } },
    ]);

    await page.context().clearCookies();
    await page.reload();

    const schoolCode = createSchoolLicenseCode({
      school: 'Bergen ungdomsskole',
      expiresAt: '2027-08-31',
    }, TEST_SECRET);
    await page.locator('#licenseCodeInput').fill(schoolCode);
    await page.getByRole('button', { name: 'Lås opp alle 46 timer' }).click();
    await expect(page.locator('#licensePanel')).toContainText('Aktiv skolelisens: Bergen ungdomsskole');

    const schoolActivateEvents = await page.evaluate(() =>
      (window.vaq || [])
        .filter(([cmd, payload]) => cmd === 'event' && payload?.name === 'license_activate')
        .map(([, payload]) => payload)
    );
    expect(schoolActivateEvents).toEqual([
      { name: 'license_activate', data: { type: 'school' } },
    ]);

    expect(insightsRequests).toEqual([]);
  } finally {
    await server.close();
  }
});

test('Undervisningspakken Wave 4: locked Smakebit, hero collapse, local SVG QR, Tavlemodus timer, audio rewind, partnerkort nav & responsive widths', async ({ page }) => {
  const server = await startUndervisningServer();
  const externalRequests = [];
  page.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith(server.url) && !url.startsWith('data:')) {
      externalRequests.push(url);
    }
  });

  try {
    // 1. Locked lesson shows Smakebit preview without leaking transcript/fasit/prompts, and hides hero on activation
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(`${server.url}/undervisning/familie/index.html`);
    await expect(page).toHaveURL(/\/undervisning\/\?las=familie$/);
    await expect(page.locator('.package-hero')).toBeVisible();
    await expect(page.locator('#lockedNotice')).toBeVisible();
    await expect(page.locator('.locked-preview-box')).toContainText('Læringsmål:');
    await expect(page.locator('.locked-preview-box')).toContainText('Eksempel på gloser (4 av');
    await expect(page.locator('#lockedNotice')).toContainText('Skriv inn skolekode');
    await expect(page.locator('#lockedNotice')).toContainText('Prøv gratis time (Tall)');
    await expect(page.locator('#lockedNotice')).not.toContainText('Fasit til lytteøvelsen');
    await expect(page.locator('#lockedNotice')).not.toContainText('B:');

    const validCode = createSchoolLicenseCode({
      school: 'Vesterheim ungdomsskole',
      expiresAt: '2027-08-31',
    }, TEST_SECRET);
    await page.locator('#lockedNotice').getByRole('button', { name: 'Skriv inn skolekode' }).click();
    await expect(page.locator('#licenseCodeInput')).toBeFocused();
    await page.locator('#licenseCodeInput').fill(validCode);
    await page.getByRole('button', { name: 'Lås opp alle 46 timer' }).click();
    await expect(page.locator('#licensePanel')).toContainText('Aktiv skolelisens: Vesterheim ungdomsskole');
    await expect(page.locator('.package-hero')).toBeHidden();

    // Filter summary mentions included free trials inside theme/culture filters
    await page.locator('[data-filter="theme"]').click();
    await expect(page.locator('#catalogCount')).toContainText('inkludert 3 gratis prøvetimer');

    // Deactivating brings hero back
    await page.getByRole('button', { name: 'Fjern skolekode fra denne enheten' }).click();
    await expect(page.locator('.package-hero')).toBeVisible();

    // 2. Free lesson: Local SVG QR, Tavlemodus timer + safe content, audio controls, student preview banner & partnerkort nav
    await page.goto(`${server.url}/undervisning/tall/index.html`);
    await page.getByRole('button', { name: 'Vis QR-kode' }).click();
    const qrModal = page.locator('#qrModalOverlay');
    await expect(qrModal).toBeVisible();
    const qrPath = await qrModal.locator('svg path').getAttribute('d');
    expect((qrPath || '').length).toBeGreaterThan(100);
    await qrModal.getByRole('button', { name: 'Lukk' }).click();
    await expect(qrModal).toBeHidden();

    // Also test QR on a licensed lesson with long signed student token
    await page.goto(`${server.url}/undervisning/`);
    await page.locator('#licenseCodeInput').fill(validCode);
    await page.getByRole('button', { name: 'Lås opp alle 46 timer' }).click();
    await expect(page.locator('#licensePanel')).toContainText('Aktiv skolelisens:');
    await page.goto(`${server.url}/undervisning/familie/index.html`);
    await page.getByRole('button', { name: 'Vis QR-kode' }).click();
    const signedQrPath = await page.locator('#qrModalOverlay svg path').getAttribute('d');
    expect((signedQrPath || '').length).toBeGreaterThan(200);
    await page.keyboard.press('Escape');
    await expect(page.locator('#qrModalOverlay')).toBeHidden();

    // Tavlemodus step navigation, countdown timer, opt-in example answers & zero teacher secret leakage
    await page.getByRole('button', { name: 'Tavlemodus' }).click();
    const board = page.locator('#boardModeOverlay');
    await expect(board).toBeVisible();
    await expect(board.locator('.board-stage-heading')).toContainText('1. Gloser');
    await expect(board.locator('.board-timer-clock')).toHaveText('10:00');
    await board.getByRole('button', { name: '+1 min' }).click();
    await expect(board.locator('.board-timer-clock')).toHaveText('11:00');
    await board.getByRole('button', { name: 'Nullstill' }).click();
    await expect(board.locator('.board-timer-clock')).toHaveText('10:00');
    await board.getByRole('button', { name: 'Start' }).click();
    await expect.poll(async () => board.locator('.board-timer-clock').textContent()).not.toBe('10:00');
    await board.getByRole('button', { name: 'Pause' }).click();

    await board.getByRole('button', { name: 'Neste del →' }).click();
    await expect(board.locator('.board-stage-heading')).toContainText('2. Skriv');
    await expect(board.locator('.board-examples-box')).toBeHidden();
    await board.getByRole('button', { name: 'Vis eksempelsvar' }).click();
    await expect(board.locator('.board-examples-box')).toBeVisible();

    await board.getByRole('button', { name: 'Neste del →' }).click();
    await expect(board.locator('.board-stage-heading')).toContainText('3. Lytt');
    await expect(board).not.toContainText('For læreren: manus, fasit og forberedelse');
    await expect(board).not.toContainText('Fasit til lytteøvelsen');

    await board.getByRole('button', { name: 'Avslutt tavlemodus' }).click();
    await expect(board).toBeHidden();

    // Rewind/restart audio controls on teacher page
    await page.locator('audio').evaluate((el) => {
      Object.defineProperty(el, 'currentTime', { value: 12, writable: true, configurable: true });
    });
    await page.locator('[data-audio-back="-5"]').click();
    expect(await page.locator('audio').evaluate((el) => el.currentTime)).toBe(7);
    await page.locator('[data-audio-restart]').click();
    expect(await page.locator('audio').evaluate((el) => el.currentTime)).toBe(0);

    // Teacher preview banner warns against copying address bar
    await page.getByRole('link', { name: 'Forhåndsvis elevside' }).click();
    await expect(page.locator('.teacher-preview-banner')).toContainText('Ikke kopier adressefeltet');

    // Partnerkort navigation back + print button
    await page.goto(`${server.url}/undervisning/tall/partnerkort.html`);
    await expect(page.locator('.print-nav')).toContainText('Tilbake til lærersiden');
    await expect(page.locator('.print-nav').getByRole('button', { name: 'Skriv ut' })).toBeVisible();

    // Responsive 0-overflow checks across 1920x1080, 1366x768 and 390x844
    for (const vp of [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(vp);
      for (const route of ['/undervisning/', '/undervisning/tall/index.html', '/undervisning/tall/elev.html']) {
        await page.goto(`${server.url}${route}`);
        const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
        expect(hasOverflow, `${route} at ${vp.width}px`).toBe(false);
      }
    }

    expect(externalRequests).toEqual([]);
  } finally {
    await server.close();
  }
});
