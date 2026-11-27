import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();
const catalogUrl = pathToFileURL(path.resolve('undervisning/index.html')).toString();
const partnerCardUrl = pathToFileURL(path.resolve('undervisning/hilsener/partnerkort.html')).toString();

async function openStudentApp(page, startPage = 'home') {
  await page.goto(appUrl);
  await page.evaluate(target => {
    localStorage.clear();
    studentName = 'QA Elev';
    showMainApp();
    if (target) showPage(target);
  }, startPage);
}

test.describe('QA audit regressions', () => {
  test('uses Kunnskapskart label, keeps Gloser filter clean, hides Vis flere at end, and renders Statistics modal', async ({ page }) => {
    await openStudentApp(page, 'home');

    await expect(page.locator('#navBrainmap')).toContainText('Kunnskapskart');

    // Clicking "Vis flere" repeatedly should eventually hide the button without duplicating cards
    const moreBtn = page.locator('#homeFeedMore');
    for (let i = 0; i < 10; i++) {
      if (!(await moreBtn.isVisible())) break;
      await moreBtn.click();
    }
    await expect(moreBtn).toBeHidden();
    const cardIds = await page.locator('#homeFeedCards [data-home-feed-skill]').evaluateAll(els =>
      els.map(el => el.getAttribute('data-home-feed-skill'))
    );
    expect(new Set(cardIds).size).toBe(cardIds.length);

    // Check por supuesto category placement
    const porSupuestoCategory = await page.evaluate(() => {
      const card = cards.find(item => (item.spansk || item.es || '').toLowerCase().includes('por supuesto'));
      return card ? card.category : null;
    });
    expect(porSupuestoCategory).toBe('ord og uttrykk');

    // Open Kunnskapskart, open a vocabulary category, verify selectedCategories is NOT mutated
    await page.locator('#navBrainmap').click();
    await expect(page.locator('#brainmapPage h2').first()).toContainText('Kunnskapskart');

    const beforeCategories = await page.evaluate(() => Array.from(selectedCategories));
    await page.locator('#brainmapPage button.brainmap-vocabulary-card').first().click();
    await expect(page.locator('#vocabStudy')).toBeVisible();
    const afterCategories = await page.evaluate(() => Array.from(selectedCategories));
    expect(afterCategories).toEqual(beforeCategories);

    // Statistics opens accessible modal (not window.alert) and closes on Escape
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#vocabStudy button:has-text("Avslutt")').click();
    await page.locator('#vocabStudy button:has-text("Tilbake")').click();
    await expect(page.locator('#vocabSettings')).toBeVisible();
    await page.locator('#vocabSettings details').last().evaluate(el => { el.open = true; });
    let dialogTriggered = false;
    page.on('dialog', async dialog => {
      dialogTriggered = true;
      await dialog.dismiss();
    });
    await page.locator('button:has-text("Statistikk")').click();
    const modal = page.locator('.settings-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Statistikk');
    expect(dialogTriggered).toBe(false);

    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
  });

  test('Enter in Verb practice rejects empty submit and pauses on feedback before advancing', async ({ page }) => {
    await openStudentApp(page, 'verbs');
    await page.evaluate(() => startVerbSession({ tenses: ['presente'] }));

    const input = page.locator('#verbInput');
    await expect(input).toBeVisible();

    // Pressing Enter on empty input should keep us on question 1 and not mark it wrong
    await input.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#verbCounter')).toContainText('1 /');
    await expect(page.locator('#verbFeedback')).toContainText('Skriv inn et svar');

    // Submitting a real answer with Enter should show feedback and stay on question 1 until next click/Enter
    await input.fill('hablo');
    await page.keyboard.press('Enter');
    await expect(page.locator('#verbCounter')).toContainText('1 /');
    await expect(page.locator('#verbFeedback button[data-feedback-next]')).toBeVisible();
  });

  test('guards Setningspuslespill reset after solve, Verbo Invaders 0-tense start, and Lingo Links reset state', async ({ page }) => {
    await openStudentApp(page, 'games');

    // 1. Verbo Invaders: unchecking all tenses blocks start
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });
    await page.evaluate(() => {
      showGameSetup('verbo-invaders');
      document.getElementById('gameTensePresente').checked = false;
      document.getElementById('gameTenseFuturo').checked = false;
      document.getElementById('gameTensePerfecto').checked = false;
      startVerboInvaders();
    });
    expect(alertMessage).toContain('verbtid');
    await expect(page.locator('#verboInvadersSetup')).toBeVisible();
    await expect(page.locator('#verboInvadersGame')).toBeHidden();

    // 2. Setningspuslespill: solving a round disables #spResetButton
    await page.evaluate(() => {
      showGameSetup('sentence-puzzle');
      startSentencePuzzle();
    });
    await expect(page.locator('#sentencePuzzleGame')).toBeVisible();
    const resetBtn = page.locator('#spResetButton');
    await expect(resetBtn).toBeEnabled();

    await page.evaluate(() => {
      for (const word of spCurrentPuzzle.words) {
        const tile = Array.from(document.querySelectorAll('.sentence-puzzle-tile:not(:disabled)'))
          .find(el => el.dataset.spWord === word);
        if (tile) tile.click();
      }
      document.getElementById('spCheckButton').click();
    });
    await expect(resetBtn).toBeDisabled();

    // 3. Lingo Links: reset button disabled with 0 selected, enabled with 1 selected
    await page.evaluate(() => {
      showGameSetup('lingo-links');
      startLingoLinks();
    });
    const llReset = page.locator('#lingoLinksResetButton');
    await expect(llReset).toBeDisabled();
    await page.locator('#lingoLinksBoard button[data-ll-card]').first().click();
    await expect(llReset).toBeEnabled();
    await llReset.click();
    await expect(llReset).toBeDisabled();
  });

  test('keeps Kunnskapskart detail modal and partner cards overflow-free on 390px mobile and handles catalog edge cases', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openStudentApp(page, 'brainmap');

    await page.locator('#brainmapPage details summary').first().click();
    await page.locator('[data-brainmap-skill-action]').first().click();
    await expect(page.locator('.brainmap-detail-close')).toBeVisible();

    const mobileOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(mobileOverflow.scrollWidth).toBeLessThanOrEqual(mobileOverflow.clientWidth + 1);

    // Partner card horizontal scroll stays inside .gap-table-wrap
    await page.goto(partnerCardUrl);
    const partnerOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasWrap: Boolean(document.querySelector('.gap-table-wrap'))
    }));
    expect(partnerOverflow.hasWrap).toBe(true);
    expect(partnerOverflow.scrollWidth).toBeLessThanOrEqual(partnerOverflow.clientWidth + 1);

    // Catalog search ignores badge text ("Gratis prøve"), shows empty state on 0 hits, and resets cleanly
    await page.goto(catalogUrl);
    await page.locator('#lessonSearchInput').fill('øve');
    await expect(page.locator('#catalogEmpty')).toBeVisible();
    await page.locator('#catalogResetBtn').click();
    await expect(page.locator('#catalogEmpty')).toBeHidden();
    await expect(page.locator('#lessonSearchInput')).toHaveValue('');
  });
});
