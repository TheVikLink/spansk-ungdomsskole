import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('teacher glossary import validation', () => {
  test('normalizes supported teacher glossary formats and reports row-level problems', async ({ page }) => {
    await page.goto(appUrl);

    const summary = await page.evaluate(() => {
      cards = [
        {
          id: 1,
          no: 'hei',
          es: 'hola',
          norsk: 'hei',
          spansk: 'hola',
          category: 'hilsener',
          noEs: { repetitions: 0 },
          esNo: { repetitions: 0 }
        }
      ];

      return analyzeTeacherWordImport([
        ['takk', 'gracias', 'hilsener'],
        ['hei', 'hola', 'hilsener'],
        ['', 'adiós', 'hilsener'],
        ['for langt', 'palabra '.repeat(18), 'test'],
        { norsk: 'god morgen', spansk: 'buenos días', category: 'hilsener' }
      ]);
    });

    expect(summary.valid).toEqual([
      { norsk: 'takk', spansk: 'gracias', category: 'hilsener' },
      { norsk: 'god morgen', spansk: 'buenos días', category: 'hilsener' }
    ]);
    expect(summary.importableCount).toBe(2);
    expect(summary.skippedCount).toBe(3);
    expect(summary.problems).toEqual([
      { row: 2, reason: 'Finnes allerede i samme kategori: hei - hola' },
      { row: 3, reason: 'Mangler norsk eller spansk tekst' },
      { row: 4, reason: 'Spansk tekst er for lang for glosekort' }
    ]);
  });

  test('applies only validated words after import confirmation', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      cards = [];

      const summary = analyzeTeacherWordImport({
        category: 'Kapittel 9',
        words: [
          ['å lese', 'leer'],
          ['å skrive', 'escribir']
        ]
      });

      return applyTeacherWordImport(summary);
    });

    expect(result).toEqual({
      imported: 2,
      skipped: 0,
      message: 'Importerte 2 gloser'
    });

    const stored = await page.evaluate(() => ({
      cards: cards.map(card => ({
        no: card.no,
        es: card.es,
        category: card.category,
        isCustom: card.isCustom
      })),
      saved: JSON.parse(localStorage.getItem('spansk123Data_v4')).map(card => ({
        no: card.no,
        es: card.es,
        category: card.category,
        isCustom: card.isCustom
      }))
    }));

    expect(stored.cards).toEqual([
      { no: 'å lese', es: 'leer', category: 'kapittel-9', isCustom: true },
      { no: 'å skrive', es: 'escribir', category: 'kapittel-9', isCustom: true }
    ]);
    expect(stored.saved).toEqual(stored.cards);
  });

  test('builds a clear confirmation preview for mixed import results', async ({ page }) => {
    await page.goto(appUrl);

    const preview = await page.evaluate(() => buildTeacherImportPreview({
      importableCount: 3,
      skippedCount: 2,
      problems: [
        { row: 4, reason: 'Finnes allerede: hei - hola' },
        { row: 8, reason: 'Mangler norsk eller spansk tekst' }
      ]
    }));

    expect(preview).toContain('Importere 3 nye gloser?');
    expect(preview).toContain('2 rader hoppes over');
    expect(preview).toContain('Rad 4: Finnes allerede: hei - hola');
    expect(preview).toContain('Rad 8: Mangler norsk eller spansk tekst');
  });

  test('treats whitespace and case variants as duplicate teacher rows', async ({ page }) => {
    await page.goto(appUrl);

    const summary = await page.evaluate(() => {
      cards = [
        {
          id: 1,
          no: 'takk',
          es: 'gracias',
          norsk: 'takk',
          spansk: 'gracias',
          category: 'hilsener',
          noEs: { repetitions: 0 },
          esNo: { repetitions: 0 }
        }
      ];

      return analyzeTeacherWordImport([
        [' Takk ', ' GRACIAS ', 'hilsener'],
        ['god kveld', 'buenas noches', 'hilsener'],
        ['god kveld ', ' Buenas Noches ', 'hilsener']
      ]);
    });

    expect(summary.valid).toEqual([
      { norsk: 'god kveld', spansk: 'buenas noches', category: 'hilsener' }
    ]);
    expect(summary.problems).toEqual([
      { row: 1, reason: 'Finnes allerede i samme kategori: Takk - GRACIAS' },
      { row: 3, reason: 'Finnes allerede i samme kategori: god kveld - Buenas Noches' }
    ]);
  });
});
