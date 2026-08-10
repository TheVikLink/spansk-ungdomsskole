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

async function openReturningStudent(page, pageName = 'home') {
  await page.goto(appUrl);
  await page.evaluate(({ diagnosis, pageName }) => {
    localStorage.clear();
    localStorage.setItem('spansk123_diagnosis_v1', JSON.stringify(diagnosis));
    studentName = 'Visuell audit';
    showMainApp();
    showPage(pageName);
  }, { diagnosis: completedDiagnosis, pageName });
}

test.describe('visual frontend audit fixes', () => {
  test('establishes a measurable heading hierarchy', async ({ page }) => {
    await openReturningStudent(page, 'home');
    const homeHeading = await page.locator('#homeQuizTitle').evaluate(element => getComputedStyle(element).fontWeight);

    await page.evaluate(() => showPage('vocab'));
    const pageHeading = await page.locator('#vocabPage .page-header h2').first().evaluate(element => getComputedStyle(element).fontWeight);

    await page.evaluate(() => showPage('homework'));
    const sectionHeading = await page.locator('#homeworkPage h3').first().evaluate(element => getComputedStyle(element).fontWeight);

    expect(Number(homeHeading)).toBe(700);
    expect(Number(pageHeading)).toBe(600);
    expect(Number(sectionHeading)).toBe(600);
  });

  test('uses consistent primary actions and gives home mode cards a button affordance', async ({ page }) => {
    await page.goto(appUrl);
    const welcomePrimary = await page.locator('.login-btn-primary').evaluate(element => getComputedStyle(element).backgroundColor);

    await openReturningStudent(page, 'home');
    const homePrimary = await page.locator('#homeStartMixedQuizBtn').evaluate(element => getComputedStyle(element).backgroundColor);
    const cardStyle = await page.locator('.home-manual-action').first().evaluate(element => {
      const styles = getComputedStyle(element);
      return { borderStyle: styles.borderStyle, borderColor: styles.borderColor };
    });

    await page.evaluate(() => showPage('vocab'));
    const vocabPrimary = await page.locator('#startMixedQuizBtn').evaluate(element => getComputedStyle(element).backgroundColor);

    expect(homePrimary).toBe(welcomePrimary);
    expect(homePrimary).toBe(vocabPrimary);
    expect(cardStyle.borderStyle).toBe('solid');
    expect(cardStyle.borderColor).toBe('rgb(229, 231, 235)');
  });

  test('keeps welcome support text in a compact size rhythm', async ({ page }) => {
    await page.goto(appUrl);
    const sizes = await page.locator('#welcomeForm .login-hint').evaluateAll(elements => [...new Set(elements.map(element => getComputedStyle(element).fontSize))]);
    expect(sizes).toEqual(['15px']);
  });

  test('distinguishes today from ordinary homework days', async ({ page }) => {
    await openReturningStudent(page, 'homework');
    const states = await page.locator('.homework-day').evaluateAll(elements => elements.map(element => {
      const styles = getComputedStyle(element);
      return {
        today: element.classList.contains('today'),
        background: styles.backgroundColor,
        borderColor: styles.borderColor,
        boxShadow: styles.boxShadow
      };
    }));
    const today = states.find(state => state.today);
    const ordinary = states.find(state => !state.today);

    expect(today).toMatchObject({ background: 'rgb(238, 242, 255)', borderColor: 'rgb(99, 102, 241)' });
    expect(today.boxShadow).not.toBe('none');
    expect(ordinary).toMatchObject({ background: 'rgb(255, 255, 255)', borderColor: 'rgb(229, 231, 235)', boxShadow: 'none' });
  });

  test('separates Brainmap sections and quiets unstarted nodes', async ({ page }) => {
    await openReturningStudent(page, 'brainmap');
    await expect(page.locator('#brainmapMicroskills')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ferdigheter' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ordforråd' })).toBeVisible();
    await expect(page.locator('.brainmap-legend')).toBeVisible();

    const styles = await page.locator('.brainmap-node-gray').first().evaluate(element => {
      const computed = getComputedStyle(element);
      return { borderWidth: computed.borderTopWidth, background: computed.backgroundColor };
    });
    expect(styles).toEqual({ borderWidth: '1px', background: 'rgb(249, 250, 251)' });
  });

  test('contains wrong mixed-quiz feedback and separates the next action', async ({ page }) => {
    await openReturningStudent(page, 'vocab');
    await page.getByRole('button', { name: 'Start quiz' }).click();

    const mode = await page.locator('.mixed-quiz-question').getAttribute('data-response-mode');
    const accepted = await page.locator('.mixed-quiz-question').getAttribute('data-accepted-answer');
    if (mode === 'typed') {
      await page.fill('#mixedQuizAnswerInput', '__feil__');
      await page.getByRole('button', { name: 'Sjekk svar' }).click();
    } else {
      const wrongChoice = page.locator('[data-mixed-answer]').filter({ hasNotText: accepted }).first();
      await wrongChoice.click();
    }

    const metrics = await page.locator('#mixedQuizFeedback').evaluate(element => {
      const styles = getComputedStyle(element);
      const buttonGroup = element.querySelector('.button-group');
      return {
        background: styles.backgroundColor,
        borderLeftWidth: styles.borderLeftWidth,
        paddingTop: styles.paddingTop,
        gap: getComputedStyle(buttonGroup).marginTop
      };
    });

    expect(metrics.background).toBe('rgb(254, 242, 242)');
    expect(metrics.borderLeftWidth).toBe('4px');
    expect(metrics.paddingTop).not.toBe('0px');
    expect(Number.parseFloat(metrics.gap)).toBeGreaterThanOrEqual(12);
  });
});
