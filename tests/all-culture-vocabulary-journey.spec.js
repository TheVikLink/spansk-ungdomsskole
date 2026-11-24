import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const readCatalog = name => JSON.parse(readFileSync(path.join('data', name), 'utf8'));
const packs = readCatalog('culture-packages.json').packages;
const standard = new Map(readCatalog('vocabulary-canonical-review.json').entries.map(word => [word.id, word]));

function promptsFor(pack) {
  return pack.vocabulary.flatMap(word => {
    const linked = word.canonicalId ? standard.get(word.canonicalId) : null;
    if (word.canonicalId && !linked) throw new Error('Ukjent standardglose ' + word.canonicalId);
    const no = linked?.norsk ?? word.no;
    const es = linked?.spansk ?? word.es;
    const answers = linked?.svar ?? word.answers;
    return [
      { direction: '🇳🇴 → 🇪🇸', front: no, answer: answers?.['no-es']?.[0] ?? es },
      { direction: '🇪🇸 → 🇳🇴', front: es, answer: answers?.['es-no']?.[0] ?? no }
    ];
  });
}

for (const pack of packs) {
  test('Fra kulturtekst til skriftlig gjenhenting – ' + pack.title, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    const prompts = promptsFor(pack);
    expect(prompts.length).toBeGreaterThan(0);
    await page.clock.setFixedTime(new Date('2026-01-05T12:00:00Z'));
    await page.goto(pathToFileURL(path.resolve('docs/kultur', pack.id, 'index.html')).href);
    await page.getByRole('link', { name: /^Lær .*glosene$/ }).click();
    await page.locator('#studentNameInput').fill('Kulturelev');
    await page.locator('.login-btn-primary').click();

    const card = page.locator('#flashcardArea');
    const buttons = page.locator('#buttonArea');
    // Nytt kort, to repetisjoner og til slutt fri gjenhenting i begge retninger.
    for (const [round, day] of [5, 7, 11, 20].entries()) {
      if (round > 0) {
        await page.clock.setFixedTime(new Date(Date.UTC(2026, 0, day, 12)));
        await page.reload();
      }
      const remaining = new Set(prompts);
      for (let i = 0; i < prompts.length; i++) {
        const front = await card.locator('.card-word').innerText();
        const direction = (await card.locator('.direction-badge').innerText()).trim();
        const entry = [...remaining].find(p => p.direction === direction &&
          (front === p.front || front.startsWith(p.front + ' (')));
        expect(entry, pack.id + ', runde ' + (round + 1) + ', ' + direction + ' ' + front).toBeDefined();
        remaining.delete(entry);
        const typed = card.getByRole('textbox');
        if (round === 3 || await typed.isVisible()) {
          await typed.fill(entry.answer);
        } else if (await card.getByRole('combobox').isVisible()) {
          await card.getByRole('combobox').selectOption({ label: entry.answer });
        } else {
          await card.getByRole('button').click();
          await expect(card.locator('.card-answer')).toHaveText(entry.answer);
          await buttons.getByRole('button', { name: /Bra/ }).click();
          continue;
        }
        await buttons.getByRole('button', { name: 'Sjekk svar' }).click();
        await expect(card.locator('.grammar-feedback.correct')).toBeVisible();
        await buttons.getByRole('button', { name: 'Neste kort' }).click();
      }
      await expect(card.locator('.session-complete')).toContainText('100%');
    }
    await page.reload();
    await expect(page.locator('#cultureVocabularyContext')).toContainText('Neste repetisjon');
  });
}
