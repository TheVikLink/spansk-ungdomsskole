import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

const completedDiagnosis = {
  schemaVersion: 1,
  status: 'complete',
  startedAt: null,
  completedAt: '2026-08-10T08:00:00.000Z',
  questionIds: [],
  answers: [],
  resultBand: 'A0',
  recommendedSkillIds: []
};

test.describe('frontend audit fixes', () => {
  test('keeps the teacher assignment builder collapsed on the student homework page', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(diagnosis => {
      localStorage.clear();
      localStorage.setItem('spansk123_diagnosis_v1', JSON.stringify(diagnosis));
      studentName = 'Elev audit';
      showMainApp();
      showPage('homework');
    }, completedDiagnosis);

    await expect(page.locator('#assignmentBuilder')).not.toHaveAttribute('open', '');
    await expect(page.locator('#assignmentBuilder > summary')).toContainText('Lag leksepakke');
  });

  test('keeps mobile navigation compact and settings touch-sized', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(appUrl);
    await page.evaluate(diagnosis => {
      localStorage.clear();
      localStorage.setItem('spansk123_diagnosis_v1', JSON.stringify(diagnosis));
      studentName = 'Elev audit';
      showMainApp();
    }, completedDiagnosis);

    const metrics = await page.evaluate(() => {
      const nav = document.querySelector('.nav-bar').getBoundingClientRect();
      const settings = document.querySelector('.logout-btn').getBoundingClientRect();
      return { navHeight: nav.height, settingsWidth: settings.width, settingsHeight: settings.height };
    });

    expect(metrics.navHeight).toBeLessThanOrEqual(70);
    expect(metrics.settingsWidth).toBeGreaterThanOrEqual(44);
    expect(metrics.settingsHeight).toBeGreaterThanOrEqual(44);
  });

  test('shows a visible focus indicator on the welcome name input', async ({ page }) => {
    await page.goto(appUrl);
    await page.locator('#studentNameInput').focus();

    const focusStyle = await page.locator('#studentNameInput').evaluate(input => {
      const styles = getComputedStyle(input);
      return { outlineStyle: styles.outlineStyle, outlineWidth: styles.outlineWidth, boxShadow: styles.boxShadow };
    });

    expect(focusStyle.outlineStyle).not.toBe('none');
    expect(focusStyle.outlineWidth).not.toBe('0px');
  });

  test('exposes the vocabulary flashcard as a keyboard-operable button', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev audit';
      showMainApp();
      showPage('vocab');
      startVocabSession('new');
    });

    const card = page.locator('#flashcardArea .flashcard');
    await expect(card).toHaveAttribute('role', 'button');
    await expect(card).toHaveAttribute('tabindex', '0');
    await card.focus();
    await expect(card).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#buttonArea .rating-btn')).toHaveCount(2);
  });

  test('exposes Brainmap status in each node accessible name', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(diagnosis => {
      localStorage.clear();
      localStorage.setItem('spansk123_diagnosis_v1', JSON.stringify(diagnosis));
      studentName = 'Elev audit';
      showMainApp();
      showPage('brainmap');
    }, completedDiagnosis);

    const names = await page.locator('[data-brainmap-skill-action]').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')));
    expect(names.length).toBeGreaterThan(0);
    expect(names.every(name => /Ikke startet|Trenger øving|På vei|God kontroll|Svært sterk/.test(name))).toBe(true);
  });
});
