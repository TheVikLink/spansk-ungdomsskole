import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();
const review = JSON.parse(readFileSync('data/vocabulary-canonical-review.json', 'utf8'));

async function openCard(page, no, mode = 'flip', direction = 'es-no') {
  await page.goto(appUrl);
  await page.locator('#studentNameInput').fill('Demo');
  await page.locator('.login-btn-primary').click();
  await page.evaluate(({ no, mode, direction }) => {
    const card = cards.find(card => card.no === no);
    if (!card) throw new Error(`Missing card: ${no}`);
    showPage('vocab');
    document.getElementById('vocabStudy').classList.remove('hidden');
    document.getElementById('vocabSettings').classList.add('hidden');
    sessionCards = [{ card, direction, responseMode: mode, scaffoldedAfterError: mode === 'select' }];
    currentIndex = 0;
    sessionStats = { reviewed: 0, correct: 0, newLearned: 0 };
    sessionStartTime = new Date();
    activeSessionType = 'vocabulary';
    showVocabCard();
  }, { no, mode, direction });
}

for (const width of [390, 1440]) {
  test(`card backs show only the reviewed answer, with distinct greeting hints at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openCard(page, 'god morgen');
    await expect(page.locator('#flashcardArea .card-word')).toHaveText('buenos días (m)');
    await page.locator('#flashcardArea [role="button"]').click();
    await expect(page.locator('.card-answer')).toHaveText(review.entries.find(entry => entry.norsk === 'god morgen').svar['es-no'][0]);
    await expect(page.locator('.card-synonym-hint')).toHaveCount(0);
    await expect(page.locator('#flashcardArea')).not.toContainText('Et annet ord');
    await page.evaluate(() => {
      currentCard.card = cards.find(card => card.no === 'god dag');
      showVocabCard();
    });
    await expect(page.locator('#flashcardArea .card-word')).toHaveText('buenos días (d)');
    await page.evaluate(() => {
      const card = cards.find(card => card.no === 'Russland');
      cards = cards.filter(other => other.id !== card.id);
      cards.unshift({ ...card, canonicalId: undefined, no: 'Russland på spansk', norsk: 'Russland på spansk', reviews: 6 });
      saveData();
      loadData();
      sessionCards = [{ card: cards.find(other => other.id === card.id), direction: 'es-no', responseMode: 'flip' }];
      showVocabCard();
    });
    await expect(page.locator('#flashcardArea .card-word')).toHaveText('Rusia');
    await page.locator('#flashcardArea [role="button"]').click();
    await expect(page.locator('.card-answer')).toHaveText('Russland');
    await expect(page.locator('#flashcardArea')).not.toContainText('på spansk');
    await expect(page.locator('#flashcardArea')).not.toContainText('Et annet ord');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test(`number retry offers nearby answers and sparse pools preserve recall at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openCard(page, '26', 'select', 'no-es');
    await expect(page.locator('#vocabSelect option')).toHaveCount(5);
    await expect(page.locator('#vocabSelect')).toHaveValue('');
    const labels = await page.locator('#vocabSelect option').allTextContents();
    expect(labels).toContain('veintiséis');
    for (const unlikely of ['once', 'doce', 'trece']) expect(labels).not.toContain(unlikely);
    await page.locator('#vocabSelect').selectOption('veintiséis');
    await page.getByRole('button', { name: 'Sjekk svar', exact: true }).click();
    await expect(page.locator('#vocabSelectFeedback')).toContainText('Riktig med støtte');
    await page.evaluate(() => {
      cards = [currentCard.card];
      currentCard.responseMode = 'select';
      showVocabCard();
    });
    await expect(page.locator('#vocabSelect')).toHaveCount(0);
    await expect(page.locator('.card-answer')).toHaveCount(0);
    await expect(page.locator('#flashcardArea [role="button"]')).toBeVisible();
    await page.locator('#flashcardArea [role="button"]').click();
    await expect(page.locator('.card-answer')).toHaveText('veintiséis');
  });

  test(`long typed sentences keep their final characters and caret visible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openCard(page, '26', 'typed', 'no-es');
    const input = page.locator('#typedVocabInput');
    await input.fill('Esta es una frase bastante larga que no cabe en el campo de respuesta');
    await input.press('End');
    await page.keyboard.press('Space');
    await page.keyboard.down('e');
    await page.keyboard.press('n');
    await page.waitForTimeout(450);
    await page.keyboard.up('e');
    await expect(input).toHaveValue(/én$/);
    expect(await input.evaluate(element => ({ atEnd: element.selectionStart === element.value.length,
      endVisible: element.scrollLeft + element.clientWidth >= element.scrollWidth - 3,
      scrollable: element.scrollWidth > element.clientWidth }))).toEqual({ atEnd: true, endVisible: true, scrollable: true });
    await page.keyboard.down('Shift');
    await page.keyboard.down('?');
    await page.waitForTimeout(450);
    await page.keyboard.up('?');
    await page.keyboard.up('Shift');
    await expect(input).toHaveValue(/én¿$/);
    expect(await input.evaluate(element => element.scrollLeft + element.clientWidth >= element.scrollWidth - 3)).toBe(true);
  });
}
