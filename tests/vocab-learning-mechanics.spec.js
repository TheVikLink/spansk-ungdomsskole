import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('vocabulary learning mechanics', () => {
  test('adds first-letter hints for cards that share the same prompt side', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      const sharedNo = [
        { id: 1, no: 'å forstå', es: 'entender' },
        { id: 2, no: 'å forstå', es: 'comprender' }
      ];
      const sharedEs = [
        { id: 3, no: 'rolig', es: 'tranquilo' },
        { id: 4, no: 'stille', es: 'tranquilo' }
      ];

      return {
        noEsFirst: getVocabPromptText({ card: sharedNo[0], direction: 'no-es' }, sharedNo),
        noEsSecond: getVocabPromptText({ card: sharedNo[1], direction: 'no-es' }, sharedNo),
        esNoFirst: getVocabPromptText({ card: sharedEs[0], direction: 'es-no' }, sharedEs),
        esNoSecond: getVocabPromptText({ card: sharedEs[1], direction: 'es-no' }, sharedEs)
      };
    });

    expect(result).toEqual({
      noEsFirst: 'å forstå (e)',
      noEsSecond: 'å forstå (c)',
      esNoFirst: 'tranquilo (r)',
      esNoSecond: 'tranquilo (s)'
    });
  });

  test('selects a stable percentage of due review cards for typed answers', async ({ page }) => {
    await page.goto(appUrl);

    const typed = await page.evaluate(() => {
      const items = Array.from({ length: 12 }, (_, index) => ({
        card: {
          id: index + 1,
          no: `ord ${index + 1}`,
          es: `palabra ${index + 1}`,
          noEs: { repetitions: 2, nextReview: '2026-05-01T00:00:00.000Z' },
          esNo: { repetitions: 0, nextReview: null }
        },
        direction: 'no-es'
      }));

      return markTypedReviewItems(items, 0.25).map(item => ({
        id: item.card.id,
        typed: item.typed === true
      }));
    });

    expect(typed.filter(item => item.typed)).toHaveLength(3);
    expect(typed.filter(item => item.typed).map(item => item.id)).toEqual([1, 5, 9]);
  });

  test('progresses review cards from flip to select to typed by strength', async ({ page }) => {
    await page.goto(appUrl);

    const modes = await page.evaluate(() => [
      getVocabularyResponseMode({ repetitions: 0, strength: 0 }),
      getVocabularyResponseMode({ repetitions: 1, strength: 1 }),
      getVocabularyResponseMode({ repetitions: 2, strength: 2 }),
      getVocabularyResponseMode({ repetitions: 3, strength: 3 }),
      getVocabularyResponseMode({ repetitions: 4, strength: 4 }),
      getVocabularyResponseMode({ repetitions: 5, strength: 5 })
    ]);

    expect(modes).toEqual(['flip', 'flip', 'select', 'select', 'typed', 'typed']);
  });

  test('builds deterministic select options for a vocabulary card', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      const pool = [
        { id: 1, no: 'rød', es: 'rojo' },
        { id: 2, no: 'blå', es: 'azul' },
        { id: 3, no: 'grønn', es: 'verde' },
        { id: 4, no: 'gul', es: 'amarillo' }
      ];
      return getVocabularySelectOptions({ card: pool[0], direction: 'no-es' }, pool);
    });

    expect(result).toHaveLength(4);
    expect(result.filter(option => option.correct)).toEqual([
      { optionId: 'rojo', label: 'rojo', correct: true }
    ]);
    expect(new Set(result.map(option => option.label)).size).toBe(4);
  });

  test('turns a held Spanish vowel into a high accent without opening native accent menus', async ({ page }) => {
    await page.goto(appUrl);
    await page.setContent('<input id="accent-test" autocomplete="off">');
    await page.evaluate(() => setupAccentInput(document.getElementById('accent-test')));
    const input = page.locator('#accent-test');
    await input.focus();

    await page.keyboard.press('a');
    await expect(input).toHaveValue('a');

    await page.keyboard.down('e');
    await page.waitForTimeout(450);
    await page.keyboard.up('e');
    await expect(input).toHaveValue('aé');
  });

  test('typed answers classify accent variants while ignoring case and extra spaces', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => ({
      sameCase: isTypedVocabAnswerCorrect('sí', 'sí'),
      upperCase: isTypedVocabAnswerCorrect('SÍ', 'sí'),
      missingAccent: isTypedVocabAnswerCorrect('si', 'sí'),
      extraSpace: isTypedVocabAnswerCorrect('  Sí  ', 'sí'),
      doubleSpace: isTypedVocabAnswerCorrect('  buenos  días  ', 'buenos días'),
      wrong: isTypedVocabAnswerCorrect('no', 'sí')
    }));

    expect(result).toEqual({
      sameCase: { resultKind: 'correct', correct: true },
      upperCase: { resultKind: 'correct', correct: true },
      missingAccent: { resultKind: 'accent_or_case_variant', correct: false },
      extraSpace: { resultKind: 'correct', correct: true },
      doubleSpace: { resultKind: 'correct', correct: true },
      wrong: { resultKind: 'wrong', correct: false }
    });
  });

  test('keeps ñ distinct while classifying Spanish accent variants', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => ({
      accentVariant: isTypedVocabAnswerCorrect('platano', 'plátano'),
      enye: isTypedVocabAnswerCorrect('ano', 'año'),
      multiWord: isTypedVocabAnswerCorrect('  buenos  días  ', 'buenos días')
    }));

    expect(result).toEqual({
      accentVariant: { resultKind: 'accent_or_case_variant', correct: false },
      enye: { resultKind: 'wrong', correct: false },
      multiWord: { resultKind: 'correct', correct: true }
    });
  });

  test('leech cards are prioritized before normal due cards, even when future scheduled', async ({ page }) => {
    await page.goto(appUrl);

    const order = await page.evaluate(() => {
      cards = [
        {
          id: 1,
          no: 'normal',
          es: 'normal',
          noEs: { repetitions: 2, nextReview: '2026-05-01T00:00:00.000Z', lapses: 0 },
          esNo: { repetitions: 0, nextReview: null, lapses: 0 }
        },
        {
          id: 2,
          no: 'vanskelig',
          es: 'difícil',
          noEs: { repetitions: 4, nextReview: '2099-05-01T00:00:00.000Z', lapses: 3 },
          esNo: { repetitions: 0, nextReview: null, lapses: 0 }
        }
      ];

      return getDueCards(cards).map(item => item.card.id);
    });

    expect(order).toEqual([2, 1]);
  });
});
