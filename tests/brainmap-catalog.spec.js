import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('A0-A1 Brainmap catalog', () => {
  test('contains the complete level/category catalog with stable routes', async ({ page }) => {
    await page.goto(appUrl);
    const catalog = await page.evaluate(() => learningCatalog.skills.map(skill => ({
      id: skill.id,
      level: skill.level,
      category: skill.group,
      status: skill.contentStatus,
      route: getBrainmapSkillActionDescriptors()[skill.id]?.kind || null
    })));

    expect(catalog.length).toBeGreaterThan(20);
    expect(new Set(catalog.map(skill => skill.id)).size).toBe(catalog.length);
    expect(new Set(catalog.map(skill => skill.level))).toEqual(new Set(['A0', 'A1']));
    expect(catalog.filter(skill => skill.level === 'A0').length).toBeGreaterThan(5);
    expect(catalog.filter(skill => skill.level === 'A1').length).toBeGreaterThan(15);
    expect(catalog.every(skill => skill.category && ['ready', 'planned'].includes(skill.status))).toBe(true);
    expect(catalog.filter(skill => skill.status === 'ready').every(skill => skill.route)).toBe(true);
  });

  test('keeps legacy skill progress and renders planned skills without a practice route', async ({ page }) => {
    await page.goto(appUrl);
    const result = await page.evaluate(() => {
      const model = buildBrainmapModel({
        schemaVersion: 1,
        skillProgress: { 'a0.identity.me_llamo': { strength: 4, attempts: 2 } },
        wordProgress: {}
      });
      const planned = learningCatalog.skills.find(skill => skill.contentStatus === 'planned');
      return {
        legacy: model.skills.find(skill => skill.id === 'a0.identity.me_llamo'),
        planned: planned && getBrainmapSkillActionDescriptors()[planned.id]
      };
    });

    expect(result.legacy).toMatchObject({ strength: 4, attempts: 2, status: 'green' });
    expect(result.planned).toMatchObject({ kind: 'planned' });
  });
});
