import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('content accuracy audit', () => {
  test('protects audited glossary translations and metadata labels', async ({ page }) => {
    await page.goto(appUrl);

    const entries = await page.evaluate(() => glossary);
    const find = (norwegian) => entries.find(([no]) => no === norwegian);

    expect(find('jeg står opp tidlig')).toEqual(['jeg står opp tidlig', 'me levanto temprano', 'rutiner']);
    expect(find('konfirmasjon')).toEqual(['konfirmasjon', 'La Confirmación', 'høytider']);
    expect(find('500')).toEqual(['500', 'quinientos', 'tall']);
    expect(find('Russland')).toEqual(['Russland', 'Rusia', 'land']);
    expect(find('Sveits')).toEqual(['Sveits', 'Suiza', 'land']);
    expect(find('Har du klokke?')).toEqual(['Har du klokke?', '¿Tienes reloj?', 'klokka']);
    expect(find('Vet du hva klokka er?')).toEqual(['Vet du hva klokka er?', '¿Sabes qué hora es?', 'klokka']);
    expect(find('pult')).toEqual(['pult', 'el pupitre', 'skole']);
  });

  test('includes the A0 greeting and number words used by diagnosis', async ({ page }) => {
    await page.goto(appUrl);

    const entries = await page.evaluate(() => glossary);
    const find = (norwegian) => entries.find(([no]) => no === norwegian);

    expect(find('hei')).toEqual(['hei', 'hola', 'hilsener']);
    expect(find('takk')).toEqual(['takk', 'gracias', 'hilsener']);

    const expectedNumbers = [
      ['1', 'uno'], ['2', 'dos'], ['3', 'tres'], ['4', 'cuatro'], ['5', 'cinco'],
      ['6', 'seis'], ['7', 'siete'], ['8', 'ocho'], ['9', 'nueve'], ['10', 'diez']
    ];
    for (const [norwegian, spanish] of expectedNumbers) {
      expect(find(norwegian)).toEqual([norwegian, spanish, 'tall']);
    }
  });

  test('includes the first quality-checked greeting, weekday, and body-part slice', async ({ page }) => {
    await page.goto(appUrl);

    const entries = await page.evaluate(() => glossary);
    const find = (norwegian) => entries.find(([no]) => no === norwegian);

    expect(find('god morgen')).toEqual(['god morgen', 'buenos días', 'hilsener']);
    expect(find('god dag')).toEqual(['god dag', 'buenos días', 'hilsener']);
    expect(find('god kveld')).toEqual(['god kveld', 'buenas noches', 'hilsener']);
    expect(find('ha det')).toEqual(['ha det', 'adiós', 'hilsener']);
    expect(find('tirsdag')).toEqual(['tirsdag', 'martes', 'ukedager']);
    expect(find('onsdag')).toEqual(['onsdag', 'miércoles', 'ukedager']);
    expect(find('torsdag')).toEqual(['torsdag', 'jueves', 'ukedager']);
    expect(find('fredag')).toEqual(['fredag', 'viernes', 'ukedager']);
    expect(find('hode')).toEqual(['hode', 'la cabeza', 'kropp']);
    expect(find('øye')).toEqual(['øye', 'el ojo', 'kropp']);
    expect(find('munn')).toEqual(['munn', 'la boca', 'kropp']);
    expect(find('hånd')).toEqual(['hånd', 'la mano', 'kropp']);
    expect(find('fot')).toEqual(['fot', 'el pie', 'kropp']);

    const newPairs = [
      ['god morgen', 'buenos días'], ['god dag', 'buenos días'],
      ['god kveld', 'buenas noches'], ['ha det', 'adiós'],
      ['tirsdag', 'martes'], ['onsdag', 'miércoles'], ['torsdag', 'jueves'], ['fredag', 'viernes'],
      ['hode', 'la cabeza'], ['øye', 'el ojo'], ['munn', 'la boca'], ['hånd', 'la mano'], ['fot', 'el pie']
    ];
    for (const [norwegian, spanish] of newPairs) {
      expect(entries.filter(([no, es]) => no.toLocaleLowerCase() === norwegian && es.toLocaleLowerCase() === spanish)).toHaveLength(1);
    }
  });

  test('avoids known duplicate cards by keeping school and hobby phrases distinct', async ({ page }) => {
    await page.goto(appUrl);

    const entries = await page.evaluate(() => glossary);
    const duplicatePairs = entries
      .map(([no, es]) => `${no}::${es}`)
      .filter((pair, index, all) => all.indexOf(pair) !== index);

    expect(duplicatePairs).not.toContain('lærer (p)::el profesor');
    expect(duplicatePairs).not.toContain('å danse::bailar');
    expect(duplicatePairs).not.toContain('å synge::cantar');
    expect(duplicatePairs).not.toContain('å trene::entrenar');
    expect(entries).toContainEqual(['spansklærer', 'el profesor de español', 'skole']);
    expect(entries).toContainEqual(['innebandy', 'el floorball', 'hobbyer']);
  });
});
