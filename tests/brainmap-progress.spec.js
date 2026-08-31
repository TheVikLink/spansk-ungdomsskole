import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('brainmap v1 progress model', () => {
  test('maps strength and attempts to the contracted status colors', async ({ page }) => {
    await page.goto(appUrl);

    const statuses = await page.evaluate(() => [
      getBrainmapStatus({ strength: 0, attempts: 0 }),
      getBrainmapStatus({ strength: 1, attempts: 1 }),
      getBrainmapStatus({ strength: 2, attempts: 1 }),
      getBrainmapStatus({ strength: 4, attempts: 2 }),
      getBrainmapStatus({ strength: 5, attempts: 3 })
    ]);

    expect(statuses.map(status => status.key)).toEqual(['gray', 'red', 'yellow', 'green', 'gold']);
  });

  test('builds current nodes, keeps direction differences, and hides unknown ids', async ({ page }) => {
    await page.goto(appUrl);

    const model = await page.evaluate(() => buildBrainmapModel({
      schemaVersion: 1,
      createdAt: '2026-08-07T10:00:00.000Z',
      updatedAt: '2026-08-07T10:05:00.000Z',
      skillProgress: {
        'a0.identity.me_llamo': { strength: 1, attempts: 1, correct: 0, lapses: 0, dueAt: null, lastSeenAt: '2026-08-07T10:01:00.000Z' },
        'unknown.future.skill': { strength: 5, attempts: 5, correct: 5, lapses: 0, dueAt: null, lastSeenAt: '2026-08-07T10:02:00.000Z' }
      },
      wordProgress: {
        'core.hola': {
          noToEs: { strength: 5, attempts: 4, correct: 4, lapses: 0, dueAt: null, lastSeenAt: '2026-08-07T10:03:00.000Z' },
          esToNo: { strength: 2, attempts: 2, correct: 2, lapses: 0, dueAt: null, lastSeenAt: '2026-08-07T10:04:00.000Z' }
        },
        'unknown.future.word': {
          noToEs: { strength: 5, attempts: 1, correct: 1, lapses: 0, dueAt: null, lastSeenAt: null },
          esToNo: { strength: 5, attempts: 1, correct: 1, lapses: 0, dueAt: null, lastSeenAt: null }
        }
      }
    }));

    expect(model.skills.length).toBeGreaterThan(20);
    expect(model.skills.find(node => node.id === 'a0.identity.me_llamo')).toMatchObject({ status: 'red', strength: 1 });
    expect(model.skills.some(node => node.id === 'unknown.future.skill')).toBe(false);
    expect(model.vocabularyAreas.find(area => area.id === 'Hilsener')).toMatchObject({
      status: 'yellow',
      directionSplit: true
    });
    expect(model.vocabularyAreas.some(area => area.id === 'unknown.future.word')).toBe(false);
  });

  test('caps a group at yellow when an attempted child is red', async ({ page }) => {
    await page.goto(appUrl);

    const model = await page.evaluate(() => buildBrainmapModel({
      schemaVersion: 1,
      createdAt: '2026-08-07T10:00:00.000Z',
      updatedAt: '2026-08-07T10:05:00.000Z',
      wordProgress: {},
      skillProgress: {
        'a0.identity.me_llamo': { strength: 1, attempts: 1, correct: 0, lapses: 1, dueAt: null, lastSeenAt: '2026-08-07T10:01:00.000Z' },
        'a0.identity.soy_de': { strength: 5, attempts: 5, correct: 5, lapses: 0, dueAt: null, lastSeenAt: '2026-08-07T10:01:00.000Z' },
        'a1.gustar.basic': { strength: 5, attempts: 5, correct: 5, lapses: 0, dueAt: null, lastSeenAt: '2026-08-07T10:01:00.000Z' },
        'a1.ser_estar.identity_or_location': { strength: 5, attempts: 5, correct: 5, lapses: 0, dueAt: null, lastSeenAt: '2026-08-07T10:01:00.000Z' }
      }
    }));
    const group = model.groups.find(node => node.id === 'A0::Setninger og uttrykk');

    expect(group).toMatchObject({ status: 'red' });
  });

  test('renders microskills without removing legacy category practice buttons', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev 14';
      showMainApp();
      showPage('brainmap');
    });

    await expect(page.locator('#brainmapMicroskills')).toBeVisible();
    await expect(page.locator('[data-brainmap-status="gray"]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Tall.*0 av 58 mestret/i })).toBeVisible();
  });

  test('groups every skill into an accessible collapsed cluster with actionable controls', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev audit';
      showMainApp();
      showPage('brainmap');
    });

    expect(await page.locator('[data-brainmap-group]').count()).toBeGreaterThan(3);
    await expect(page.locator('[data-brainmap-group]').first()).not.toHaveAttribute('open', '');
    expect(await page.locator('[data-brainmap-skill-action]').count()).toBeGreaterThan(20);
    await expect(page.locator('[data-brainmap-group] [data-brainmap-skill-action]').first()).toBeHidden();

    await page.locator('[data-brainmap-group] summary').first().press('Enter');
    await expect(page.locator('[data-brainmap-group]').first()).toHaveAttribute('open', '');
    await expect(page.locator('[data-brainmap-group]').first().locator('[data-brainmap-skill-action]').first()).toBeVisible();
  });

  test('exposes total skill routes and deterministic strength intensity', async ({ page }) => {
    await page.goto(appUrl);
    const result = await page.evaluate(() => ({
      ids: learningCatalog.skills.map(skill => skill.id),
      routeIds: Object.keys(getBrainmapSkillActionDescriptors()),
      intensity: [
        getBrainmapStrengthIntensity({ strength: -1, attempts: 1 }),
        getBrainmapStrengthIntensity({ strength: 1, attempts: 1 }),
        getBrainmapStrengthIntensity({ strength: 2, attempts: 1 }),
        getBrainmapStrengthIntensity({ strength: 4, attempts: 1 }),
        getBrainmapStrengthIntensity({ strength: 5, attempts: 1 }),
        getBrainmapStrengthIntensity({ strength: 5, attempts: 0 })
      ]
    }));
    expect(result.routeIds.sort()).toEqual(result.ids.sort());
    expect(result.intensity).toEqual(['low', 'low', 'medium', 'high', 'max', 'none']);
  });

  test('builds Brainmap vocabulary areas from canonical runtime cards', async ({ page }) => {
    await page.goto(appUrl);
    const areas = await page.evaluate(() => buildBrainmapVocabularyAreas([
      { norsk: 'hei', spansk: 'hola', category: 'Hilsener', noEs: { repetitions: 3 }, esNo: { repetitions: 3 } },
      { norsk: 'hei', spansk: 'hola', category: ' hilsener ', noEs: { repetitions: 3 }, esNo: { repetitions: 3 } },
      { norsk: 'takk', spansk: 'gracias', category: 'Ekstra', noEs: { repetitions: 3 }, esNo: { repetitions: 1 } }
    ]));
    expect(areas).toEqual([
      expect.objectContaining({ id: 'hilsener', label: 'Hilsener', count: 1, mastered: 1 }),
      expect.objectContaining({ id: 'ekstra', label: 'Ekstra', count: 1, mastered: 0 })
    ]);
  });

  test('filters skills by level and category without changing progress values', async ({ page }) => {
    await page.goto(appUrl);
    const result = await page.evaluate(() => {
      const model = buildBrainmapModel({ schemaVersion: 1, skillProgress: { 'a0.identity.me_llamo': { strength: 2, attempts: 1 } }, wordProgress: {} });
      return {
        a0: filterBrainmapModel(model, { level: 'A0', category: 'all' }).skills,
        verbs: filterBrainmapModel(model, { level: 'all', category: 'Verb i presens' }).skills,
        original: model.skills.find(skill => skill.id === 'a0.identity.me_llamo')
      };
    });
    expect(result.a0.every(skill => skill.level === 'A0')).toBe(true);
    expect(result.verbs.every(skill => skill.group === 'Verb i presens')).toBe(true);
    expect(result.original).toMatchObject({ strength: 2, attempts: 1 });
  });

  test('renders filter controls and narrows the visible skill nodes', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Elev filter'; showMainApp(); showPage('brainmap'); });
    const allCount = await page.locator('[data-brainmap-skill-action]').count();
    await page.selectOption('#brainmapLevelFilter', 'A0');
    const a0Count = await page.locator('[data-brainmap-skill-action]').count();
    expect(allCount).toBeGreaterThan(a0Count);
    expect(await page.locator('[data-brainmap-skill-action]').evaluateAll(nodes => nodes.every(node => node.querySelector('.brainmap-node-level')?.textContent === 'A0'))).toBe(true);
    await page.selectOption('#brainmapCategoryFilter', 'Artikler og substantiv');
    expect(await page.locator('[data-brainmap-skill-action]').count()).toBeGreaterThan(0);
  });
});
