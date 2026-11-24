import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).href;
const entries = JSON.parse(readFileSync('data/vocabulary-canonical-review.json', 'utf8')).entries;

async function practiseSession(page, memory) {
  const area = page.locator('#flashcardArea');
  const counter = await page.locator('#cardCounter').innerText();
  const match = /^1 \/ (\d+)$/.exec(counter);
  expect(match, counter).toBeTruthy();
  const count = Number(match[1]);
  for (let i = 0; i < count; i++) {
    const card = await area.evaluate(el => ({
      prompt: el.querySelector('.card-word')?.textContent,
      direction: el.querySelector('.direction-badge')?.textContent.trim(),
      category: el.querySelector('.card-category')?.textContent,
      mode: el.querySelector('#typedVocabInput') ? 'type' : el.querySelector('#vocabSelect') ? 'select' : 'flip'
    }));
    const key = [card.category, card.direction, card.prompt].join('|');
    if (card.mode === 'flip') {
      await area.getByRole('button').press('Enter');
      const answer = await area.locator('.card-answer').innerText();
      if (memory.has(key)) expect(answer, key).toBe(memory.get(key));
      memory.set(key, answer);
      await page.keyboard.press('1');
    } else {
      const answer = memory.get(key);
      expect(answer, key).toBeTruthy();
      if (card.mode === 'type') {
        await area.getByRole('textbox').fill(answer);
      } else {
        await area.getByRole('combobox').selectOption({ label: answer });
      }
      await page.getByRole('button', { name: 'Sjekk svar', exact: true }).press('Enter');
      await expect(area.locator('.grammar-feedback'), key).toHaveText(/Riktig!/);
      await page.getByRole('button', { name: 'Neste kort' }).press('Enter');
    }
  }
  await expect(area.locator('.session-stat-value').nth(1)).toHaveText('100%');
  await page.locator('#buttonArea').getByRole('button', { name: /Tilbake/ }).click();
  return count;
}

test('a returning learner masters every standard word in both directions over three study days', async ({ page }) => {
  test.setTimeout(15 * 60_000);
  const memory = new Map();
  const days = ['2026-01-06', '2026-01-08', '2026-01-12'];
  const expectedIds = entries.map(entry => entry.id).sort();
  for (const [round, day] of days.entries()) {
    await test.step(`Study day ${day}`, async () => {
      await page.clock.setFixedTime(new Date(day + 'T12:00:00Z'));
      await page.goto(appUrl);
      if (round === 0) {
        await page.locator('#studentNameInput').fill('Gloseøveren');
        await page.locator('.login-btn-primary').click();
      }
      await page.locator('#navVocab').click();
      await expect(page.locator(round ? '#statDue' : '#statNew')).toHaveText(String(entries.length * (round ? 2 : 1)));
      await page.locator('#newCardsLimit').fill('50');
      await page.locator('#reviewCardsLimit').fill('100');
      let answered = 0;
      while (answered < entries.length * 2) {
        await page.locator(`[data-vocab-mode="${round ? 'review' : 'new'}"]`).click();
        answered += await practiseSession(page, memory);
      }
      expect(answered).toBe(entries.length * 2);
      await expect(page.locator(round ? '#statDue' : '#statNew')).toHaveText('0');
    });
  }
  await page.reload();
  await page.locator('#navVocab').click();
  await expect(page.locator('#statMastered')).toHaveText(String(entries.length));
  const masteredIds = await page.evaluate(() => JSON.parse(localStorage.getItem('spansk123Data_v4'))
    .filter(card => card.noEs.repetitions >= 3 && card.esNo.repetitions >= 3)
    .map(card => card.canonicalId).sort());
  expect(masteredIds).toEqual(expectedIds);
});
