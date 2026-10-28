import { test, expect } from '@playwright/test';
import { startStaticAppServer } from './helpers/static-app-server.js';

let server;
test.beforeAll(async () => { server = await startStaticAppServer(); });
test.afterAll(async () => server.close());
async function openTheme(page, url = server.url) {
  await page.goto(url);
  await page.locator('#studentNameInput').fill('Test');
  await page.locator('.login-btn-primary').click();
  await page.locator('#navVocab').click();
  await page.locator('#recognitionOpenBtn').click();
}
const stored = page => page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));

test('sentence building teaches es/no es, requires effort and records no progress', async ({ page }) => {
  await openTheme(page);
  const before = await stored(page);
  await page.locator('#recognitionSentencesBtn').click();
  await expect(page.locator('#recognitionThemePanel')).toContainText('es = er');
  await expect(page.locator('#recognitionThemePanel')).toContainText('no es = er ikke');
  await page.locator('#recognitionBeginBtn').click();
  await expect(page.locator('#recognitionLearningTitle')).toBeFocused();
  await expect(page.locator('#recognitionLearningPrompt')).toHaveText('Hotellet er populært.');
  await expect(page.locator('#recognitionLearningFeedback')).toBeEmpty();
  await page.locator('#recognitionLearningCheckBtn').click();
  await expect(page.locator('#recognitionLearningFeedback')).toBeEmpty();
  await page.locator('[data-recognition-token="0"]').click();
  await expect(page.locator('#recognitionBuiltSentence')).toContainText('El');
  await page.locator('#recognitionUndoBtn').click();
  await expect(page.locator('#recognitionBuiltSentence button')).toHaveCount(0);
  for (let i = 0; i < 4; i++) await page.locator(`[data-recognition-token="${i}"]`).click();
  await page.locator('#recognitionLearningCheckBtn').click();
  await expect(page.locator('#recognitionLearningFeedback')).toContainText('Riktig!');
  await page.evaluate(() => submitRecognitionLearning());
  expect(await page.evaluate(() => recognitionLearning.results.filter(Boolean).length)).toBe(1);
  for (let i = 1; i < 4; i++) {
    await page.locator('#recognitionLearningNextBtn').click();
    await page.locator('#recognitionLearningSkipBtn').click();
  }
  await page.locator('#recognitionLearningNextBtn').click();
  await expect(page.locator('#recognitionLearningInput')).toBeVisible();
  await page.locator('#recognitionLearningInput').fill('  LA TRADICIÓN ES POPULAR. ');
  await page.locator('#recognitionLearningCheckBtn').click();
  await expect(page.locator('#recognitionLearningFeedback')).toContainText('Riktig!');
  await page.locator('#recognitionLearningNextBtn').click();
  await page.locator('#recognitionLearningInput').fill('El restaurante es popular');
  await page.locator('#recognitionLearningCheckBtn').click();
  await expect(page.locator('#recognitionLearningFeedback')).toContainText('no es');
  for (let i = 6; i < 8; i++) {
    await page.locator('#recognitionLearningNextBtn').click();
    if (i === 6) {
      await page.locator('#recognitionLearningHintBtn').click();
      await expect(page.locator('[data-recognition-token]').first()).toBeVisible();
    }
    await page.locator('#recognitionLearningSkipBtn').click();
  }
  await page.locator('#recognitionLearningNextBtn').click();
  await expect(page.locator('#recognitionThemePanel')).toContainText('2 av 8 riktige uten støtte');
  await page.locator('#recognitionLearningReturnBtn').click();
  await expect(page.locator('#recognitionSentencesBtn')).toBeFocused();
  expect(await stored(page)).toBe(before);
});

test('families offer examples, an unrevealed probe, navigation and an honest summary', async ({ page }) => {
  await openTheme(page);
  const before = await stored(page);
  await page.locator('#recognitionFamiliesBtn').click();
  await expect(page.locator('#recognitionLearningTitle')).toContainText('-sjon');
  await expect(page.locator('#recognitionFamilyExamples')).toContainText('informasjon');
  await expect(page.locator('#recognitionFamilyExamples')).not.toContainText('situasjon');
  await expect(page.locator('#recognitionLearningPrompt')).toHaveText('la situación');
  await page.locator('#recognitionLearningInput').fill('situasjon');
  await page.locator('#recognitionLearningCheckBtn').click();
  await expect(page.locator('#recognitionLearningFeedback')).toContainText('Riktig!');
  await page.locator('#recognitionLearningNextBtn').click();
  await expect(page.locator('#recognitionLearningTitle')).toContainText('-ista');
  await page.locator('#recognitionFamilyPrevBtn').click();
  await expect(page.locator('#recognitionLearningFeedback')).toContainText('Riktig!');
  await expect(page.locator('#recognitionLearningInput')).toBeDisabled();
  await page.locator('#recognitionLearningNextBtn').click();
  await page.locator('#recognitionFamilyNextBtn').click();
  await expect(page.locator('#recognitionLearningTitle')).toContainText('-el');
  await page.locator('#recognitionFamilyMenu').selectOption('6');
  await expect(page.locator('#recognitionLearningTitle')).toContainText('Engelsk');
  await expect(page.locator('#recognitionFamilyExamples')).toContainText('Engelsk');
  await page.locator('#recognitionLearningHintBtn').click();
  await page.locator('#recognitionLearningInput').fill('horribel');
  await page.locator('#recognitionLearningCheckBtn').click();
  await page.locator('#recognitionLearningNextBtn').click();
  await expect(page.locator('#recognitionThemePanel')).toContainText('2 av 7 prøveord besvart');
  await expect(page.locator('#recognitionThemePanel')).toContainText('1 riktige uten støtte');
  await expect(page.locator('#recognitionThemePanel')).toContainText('1 riktige med støtte');
  await page.locator('#recognitionLearningReturnBtn').click();
  await expect(page.locator('#recognitionFamiliesBtn')).toBeFocused();
  expect(await stored(page)).toBe(before);
});

test('a family hint stays counted after visiting a different family', async ({ page }) => {
  await openTheme(page);
  await page.locator('#recognitionFamiliesBtn').click();
  await page.locator('#recognitionLearningHintBtn').click();
  await page.locator('#recognitionFamilyNextBtn').click();
  await page.locator('#recognitionFamilyPrevBtn').click();
  await expect(page.locator('#recognitionLearningHintBtn')).toBeDisabled();
  await page.locator('#recognitionLearningInput').fill('situasjon');
  await page.locator('#recognitionLearningCheckBtn').click();
  expect(await page.evaluate(() => recognitionLearning.results[0])).toEqual({ correct: true, helped: true });
});

test('sentence checking preserves negation, order and accents while allowing case and final periods', async ({ page }) => {
  await openTheme(page);
  const results = await page.evaluate(() => {
    const item = getRecognitionTheme().sentences[4];
    return ['LA TRADICIÓN ES POPULAR.', 'La tradicio\u0301n es popular', 'La tradición no es popular', 'La tradicion es popular', 'Popular tradición la es', 'La tradición es popular?']
      .map(answer => evaluateRecognitionSentence(item, answer));
  });
  expect(results.map(result => result.correct)).toEqual([true, true, false, false, false, false]);
  expect(results[3].resultKind).toBe('accent_or_case_variant');
});

for (const kind of ['sentences', 'families']) {
  test(`${kind} respects active sessions and clears transient work when navigation is confirmed`, async ({ page }) => {
    await openTheme(page);
    const before = await stored(page);
    await page.locator(kind === 'sentences' ? '#recognitionSentencesBtn' : '#recognitionFamiliesBtn').click();
    const unchanged = await page.evaluate(() => {
      const state = recognitionLearning;
      return startRecognitionLearning(state.kind === 'sentences' ? 'families' : 'sentences') === false && recognitionLearning === state;
    });
    expect(unchanged).toBe(true);
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('#navHome').click();
    await expect(page.locator('#recognitionLearningTitle')).toBeVisible();
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#navHome').click();
    await expect(page.locator('#homePage')).toBeVisible();
    expect(await page.evaluate(() => recognitionLearning)).toBeNull();
    expect(await stored(page)).toBe(before);
  });
}

test('a bad tile order is not accepted and a tile cannot be used twice', async ({ page }) => {
  await openTheme(page);
  await page.locator('#recognitionSentencesBtn').click();
  await page.locator('#recognitionBeginBtn').click();
  await page.locator('[data-recognition-token="0"]').click();
  await page.evaluate(() => pickRecognitionToken(0));
  await expect(page.locator('#recognitionBuiltSentence button')).toHaveCount(1);
  await page.locator('#recognitionResetBtn').click();
  for (const index of [0, 2, 1, 3]) await page.locator(`[data-recognition-token="${index}"]`).click();
  await page.locator('#recognitionLearningCheckBtn').click();
  expect(await page.evaluate(() => recognitionLearning.results[0].correct)).toBe(false);
  await expect(page.locator('#recognitionLearningFeedback')).toContainText('El hotel es popular.');
});

test('unavailable activities offer a focused recovery without starting an empty session', async ({ page }) => {
  await openTheme(page);
  for (const kind of ['sentences', 'families']) {
    await page.evaluate(kind => {
      const node = document.getElementById('recognition-theme-data');
      const data = JSON.parse(node.textContent); data[kind] = []; node.textContent = JSON.stringify(data);
    }, kind);
    await page.locator(kind === 'sentences' ? '#recognitionSentencesBtn' : '#recognitionFamiliesBtn').click();
    await expect(page.locator('#recognitionLearningTitle')).toHaveText('Øvingen er ikke tilgjengelig');
    await expect(page.locator('#recognitionLearningTitle')).toBeFocused();
    expect(await page.evaluate(() => activeSessionType)).toBeNull();
    await page.getByRole('button', { name: 'Tilbake til temaet', exact: true }).click();
  }
});

for (const width of [390, 1280]) {
  test(`learning controls work with keyboard and fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await openTheme(page);
    await page.locator('#recognitionSentencesBtn').click();
    await page.locator('#recognitionBeginBtn').click();
    await page.locator('[data-recognition-token]').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#recognitionBuiltSentence button')).toHaveCount(1);
    await page.locator('#recognitionResetBtn').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/madrigal-sentences-${width}.png` });
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Avslutt og gå til temaet', exact: true }).click();
    await page.locator('#recognitionFamiliesBtn').click();
    await page.locator('#recognitionLearningInput').fill('situasjon');
    await page.keyboard.press('Enter');
    await expect(page.locator('#recognitionLearningFeedback')).toContainText('Riktig!');
    await expect(page.locator('#recognitionLearningNextBtn')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/madrigal-families-${width}.png` });
  });
}

test('both learning activities remain available from the saved app offline', async ({ page, context }) => {
  const offlineServer = await startStaticAppServer();
  try {
    await openTheme(page, offlineServer.url);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    offlineServer.setOffline(true); await context.setOffline(true); await page.reload();
    await page.locator('#navVocab').click(); await page.locator('#recognitionOpenBtn').click();
    await page.locator('#recognitionFamiliesBtn').click();
    await page.locator('#recognitionLearningInput').fill('situasjon');
    await page.locator('#recognitionLearningCheckBtn').click();
    await expect(page.locator('#recognitionLearningFeedback')).toContainText('Riktig!');
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Avslutt og gå til temaet', exact: true }).click();
    await page.locator('#recognitionSentencesBtn').click(); await page.locator('#recognitionBeginBtn').click();
    await expect(page.locator('#recognitionLearningPrompt')).toHaveText('Hotellet er populært.');
  } finally { await offlineServer.close(); }
});

// Page scrollWidth misses inline text painted underneath a neighboring control.
// Measure every line of the label, the input and its focus-ring clearance locally.
async function expectAnswerFieldClear(page, id = 'recognitionLearningInput') {
  const field = page.locator(`#${id}`);
  await field.focus();
  await expect(field).toBeFocused();
  const geometry = await field.evaluate(input => {
    const label = document.querySelector(`label[for="${input.id}"]`);
    const range = document.createRange(); range.selectNodeContents(label);
    const box = input.getBoundingClientRect();
    const parent = input.closest('fieldset, form').getBoundingClientRect();
    const style = getComputedStyle(input);
    const clearance = Math.max(6, parseFloat(style.outlineWidth) + Math.max(0, parseFloat(style.outlineOffset)));
    const lines = [...range.getClientRects()].filter(rect => rect.width && rect.height);
    return {
      clear: lines.every(line => line.right + clearance <= box.left || line.left - clearance >= box.right || line.bottom + clearance <= box.top || line.top - clearance >= box.bottom),
      contained: [box, ...lines].every(rect => rect.left >= parent.left - 1 && rect.right <= parent.right + 1),
      pageFits: document.documentElement.scrollWidth <= innerWidth,
    };
  });
  expect(geometry).toEqual({ clear: true, contained: true, pageFits: true });
}

for (const width of [320, 390, 768, 1120, 1280]) {
  test(`focused learning fields do not cover labels or escape their card at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openTheme(page);
    await page.locator('#recognitionFamiliesBtn').click();
    for (let index = 0; index < 7; index++) {
      await page.locator('#recognitionFamilyMenu').selectOption(String(index));
      await expectAnswerFieldClear(page);
      if (index === 0 && [390, 1120].includes(width)) {
        await page.screenshot({ path: `/tmp/madrigal-focused-${width}.png` });
      }
    }
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Avslutt og gå til temaet', exact: true }).click();
    await page.locator('#recognitionDiscoverBtn').click();
    await expectAnswerFieldClear(page, 'recognitionAnswerInput');
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Avslutt runden', exact: true }).click();
    await page.locator('#recognitionSentencesBtn').click();
    await page.locator('#recognitionBeginBtn').click();
    for (let index = 0; index < 4; index++) {
      await page.locator('#recognitionLearningSkipBtn').click();
      await page.locator('#recognitionLearningNextBtn').click();
    }
    await expectAnswerFieldClear(page);
  });
}

test('long labels at doubled text size wrap without clipping or covering the focused field', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openTheme(page);
  await page.locator('#recognitionFamiliesBtn').click();
  await page.locator('label[for="recognitionLearningInput"]').evaluate(label => {
    label.textContent = 'Hva betyr dette spanske ordet på norsk? Skriv betydningen med dine egne ord.';
    label.style.fontSize = '200%';
  });
  await expectAnswerFieldClear(page);
});

test('hovering near a Madrigal button edge does not make its hit area oscillate', async ({ page }) => {
  await openTheme(page);
  await page.locator('#recognitionDiscoverBtn').click();
  const hint = page.locator('#recognitionHintBtn');
  const box = await hint.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + 0.1);
  const displacement = await hint.evaluate(async button => {
    const positions = [];
    for (let frame = 0; frame < 20; frame++) {
      await new Promise(requestAnimationFrame);
      positions.push(button.getBoundingClientRect().top);
    }
    return Math.max(...positions) - Math.min(...positions);
  });
  expect(displacement).toBeLessThan(0.01);
});
