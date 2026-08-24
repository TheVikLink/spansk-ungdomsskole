import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('student learning flow audit', () => {
  test('cancelled navigation preserves an active mixed quiz', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      document.getElementById('mainApp').classList.remove('hidden');
      document.getElementById('vocabPage').classList.remove('hidden');
      mixedQuizState = { quiz: { items: [{ questionId: 'test.item' }] }, index: 0, answered: 0, correct: 0, startedAt: new Date() };
      activeSessionType = 'mixedQuiz';
      const originalConfirm = window.confirm;
      window.confirm = () => false;
      const changed = showPage('brainmap');
      window.confirm = originalConfirm;
      return {
        changed,
        activeSessionType,
        mixedQuizStateStillPresent: Boolean(mixedQuizState),
        brainmapHidden: document.getElementById('brainmapPage').classList.contains('hidden')
      };
    });

    expect(result.changed).toBe(false);
    expect(result.activeSessionType).toBe('mixedQuiz');
    expect(result.mixedQuizStateStillPresent).toBe(true);
    expect(result.brainmapHidden).toBe(true);
  });

  test('confirmed navigation abandons an active session without completion writes', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      document.getElementById('mainApp').classList.remove('hidden');
      document.getElementById('vocabPage').classList.remove('hidden');
      mixedQuizState = { quiz: { items: [{ questionId: 'test.item' }] }, index: 0, answered: 0, correct: 0, startedAt: new Date() };
      activeSessionType = 'mixedQuiz';
      const originalConfirm = window.confirm;
      window.confirm = () => true;
      const changed = showPage('brainmap');
      window.confirm = originalConfirm;
      return {
        changed,
        activeSessionType,
        mixedQuizStateCleared: mixedQuizState === null,
        brainmapVisible: !document.getElementById('brainmapPage').classList.contains('hidden'),
        practiceHistory: localStorage.getItem('spansk123_practiceHistory')
      };
    });

    expect(result.changed).not.toBe(false);
    expect(result.activeSessionType).toBeNull();
    expect(result.mixedQuizStateCleared).toBe(true);
    expect(result.brainmapVisible).toBe(true);
    expect(result.practiceHistory).toBeNull();
  });

  test('protects vocabulary, verb, and grammar sessions from navigation loss', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      document.getElementById('mainApp').classList.remove('hidden');
      const cases = [
        ['vocabulary', 'vocab'],
        ['verbs', 'verbs'],
        ['grammar', 'grammar']
      ];
      const outcomes = [];
      const originalConfirm = window.confirm;
      for (const [type, pageName] of cases) {
        activeSessionType = type;
        window.confirm = () => false;
        const cancelled = showPage(pageName === 'vocab' ? 'home' : 'home');
        const preserved = activeSessionType === type;
        window.confirm = () => true;
        const changed = showPage('home');
        outcomes.push({ type, cancelled, preserved, changed, cleared: activeSessionType === null });
      }
      window.confirm = originalConfirm;
      return outcomes;
    });

    expect(result).toEqual([
      { type: 'vocabulary', cancelled: false, preserved: true, changed: undefined, cleared: true },
      { type: 'verbs', cancelled: false, preserved: true, changed: undefined, cleared: true },
      { type: 'grammar', cancelled: false, preserved: true, changed: undefined, cleared: true }
    ]);
  });

  test('home distinguishes an unfinished daily quiz from a completed one', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      saveDiagnosisState({
        schemaVersion: 1,
        status: 'complete',
        startedAt: null,
        completedAt: '2026-08-07T09:00:00.000Z',
        questionIds: [],
        answers: [],
        resultBand: 'A0',
        recommendedSkillIds: []
      });
      document.getElementById('mainApp').classList.remove('hidden');
      document.getElementById('homePage').classList.remove('hidden');
      renderHomePage();
      const before = {
        text: document.getElementById('homeQuizStreak').textContent,
        button: document.getElementById('homeStartMixedQuizBtn').textContent
      };
      completeQuizForToday(new Date());
      renderHomePage();
      return {
        before,
        after: {
          text: document.getElementById('homeQuizStreak').textContent,
          title: document.getElementById('homeQuizTitle').textContent,
          button: document.getElementById('homeStartMixedQuizBtn').textContent
        }
      };
    });

    expect(result.before.text).toContain('Du har ikke øvd i dag ennå.');
    expect(result.before.button).toContain('Start dagens quiz');
    expect(result.after.title).toContain('Ta en ny quiz');
    expect(result.after.button).toContain('Ta en ny quiz');
    expect(result.after.text).toContain('1/5 mot dagens merke');
  });

  test('starts new-word practice when the new-word mode is selected', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev audit';
      showMainApp();
      showPage('vocab');
    });

    const disclosure = page.locator('#vocabCategoryDisclosure');
    await expect(disclosure).not.toHaveAttribute('open', '');
    await page.locator('.vocab-mode-card.new').click();
    await expect(page.locator('#vocabStudy')).toBeVisible();
  });

  test('starts a new-word session from the new-word mode card', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev audit';
      showMainApp();
      showPage('vocab');
    });
    await page.locator('.vocab-mode-card.new').click();
    await expect(page.locator('#vocabStudy')).toBeVisible();
    await expect(page.locator('#vocabSettings')).toBeHidden();
  });

  test('does not expose legacy chapter categories', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev audit';
      showMainApp();
      showPage('vocab');
    });
    await expect(page.locator('#categoryGrid')).not.toContainText('Kapittel 7');
    await expect(page.locator('#categoryGrid')).not.toContainText('Kapittel 8');
    await expect(page.locator('text=Kapittel 7')).toHaveCount(0);
    await expect(page.locator('text=Kapittel 8')).toHaveCount(0);
  });

  test('explains all Brainmap colors and keeps strength hidden for unstarted nodes', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev audit';
      showMainApp();
      showPage('brainmap');
    });

    await expect(page.locator('.brainmap-legend')).toContainText('Gull = svært sterk');
    const firstNode = page.locator('.brainmap-node-gray').first();
    await expect(firstNode).toContainText('Ikke startet');
    await expect(firstNode).not.toContainText('/ 5');
    await expect(firstNode).not.toHaveAttribute('aria-label', /av 5/);
  });

  test('separates vocabulary rating labels from their intervals', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev audit';
      showMainApp();
      showPage('vocab');
      startVocabSession('new');
    });
    await page.locator('#flashcardArea .flashcard').click();

    await expect(page.locator('.rating-btn').first()).toContainText('Igjen');
    await expect(page.locator('.rating-btn').first().locator('.interval')).toContainText('Nå');
    await expect(page.locator('.rating-btn').first().locator('.key')).toContainText('(1)');
  });
});
