import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();
const skills = ['a0.articles.definite_singular', 'a0.articles.definite_plural', 'a1.gustar.basic', 'a1.hay_estar.contrast'];

async function showResult(page, { previousBadges = [], answered = 10, strength = 4 } = {}) {
  await page.goto(appUrl);
  await page.evaluate(({ skills, previousBadges, answered, strength }) => {
    studentName = 'Test'; showMainApp(); showPage('vocab');
    startBrainmapSkillPractice('a0.articles.definite_singular');
    const progress = normalizeLearningProgress(null);
    skills.forEach(id => { progress.skillProgress[id] = { strength, attempts: 5, correct: 4 }; });
    saveLearningProgress(progress);
    localStorage.setItem(MASTERY_BADGES_KEY, JSON.stringify({ schemaVersion: 1, badges: previousBadges }));
    mixedQuizState.answered = answered; mixedQuizState.correct = Math.min(8, answered);
    mixedQuizState.quiz.items = Array.from({ length: 10 }, (_, i) => ({ questionId: `visual-${i}` }));
    finishMixedQuiz();
  }, { skills, previousBadges, answered, strength });
}

for (const width of [1440, 390]) {
  test(`four concise stars and a separate walking badge work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await showResult(page);
    const stars = page.locator('.quiz-skill-star');
    await expect(stars).toHaveCount(4);
    await expect(stars.locator('summary')).toHaveText(['el / la', 'gustar · entall', 'los / las', 'hay / estar']);
    await expect(page.locator('.quiz-badge-awards')).not.toContainText('Gode svar på øvde oppgaver:');
    await expect(stars.first().locator('svg')).toBeVisible();
    const streak = page.locator('#mixedQuizStreakSummary');
    await expect(streak.locator('svg')).toBeVisible();
    await expect(streak).toContainText('1 dag på rad');
    await expect(streak).toContainText('1 quiz i dag');
    const before = await page.evaluate(() => JSON.stringify(localStorage));
    const summary = stars.first().locator('summary');
    await summary.focus(); await page.keyboard.press('Enter');
    await expect(stars.first()).toHaveAttribute('open', '');
    await expect(stars.first().locator('p')).toContainText('Bruke el og la');
    await page.keyboard.press('Enter');
    await expect(stars.first()).not.toHaveAttribute('open');
    await streak.locator('summary').click();
    await expect(streak.locator('p')).toContainText('fullført quiz');
    await streak.locator('summary').click();
    expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const badgeHeight = await page.locator('.quiz-badge-awards').evaluate(el => el.getBoundingClientRect().height);
    expect(badgeHeight).toBeLessThan(width < 500 ? 290 : 160);
    await page.screenshot({ path: `output/brukertest-rettelser/visual-stars-${width}.png`, fullPage: true });
  });
}

test('existing award IDs remain compatible and are not awarded twice', async ({ page, browser }) => {
  await showResult(page);
  const exported = await page.evaluate(() => buildProgressExportData());
  expect(exported.masteryBadges.badges).toEqual(expect.arrayContaining(skills.map(id => `mastery:${id}`)));
  const context = await browser.newContext();
  const clean = await context.newPage(); await clean.goto(appUrl);
  const result = await clean.evaluate(data => {
    importProgressData(data);
    const result = awardMasteryBadges();
    return { newlyEarned: result.newlyEarned, stored: loadMasteryBadges(), html: renderQuizStarAwards(result.newlyEarned) };
  }, exported);
  expect(result.newlyEarned).toEqual([]);
  expect(result.stored).toEqual(exported.masteryBadges.badges);
  expect(result.html).toBe('');
  await context.close();
});

test('no new award stays compact and unearned stars are not invented', async ({ page }) => {
  await showResult(page, { strength: 3 });
  await expect(page.locator('.quiz-badge-awards')).toHaveCount(0);
  await expect(page.locator('#mixedQuizStreakSummary')).toBeVisible();
  expect(await page.evaluate(() => loadMasteryBadges())).toEqual([]);
});

test('streak display counts consecutive quiz dates, expires across a gap and does not change history', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-09T12:00:00Z') });
  await page.goto(appUrl);
  const result = await page.evaluate(() => {
    const stats = normalizeQuizStats({ schemaVersion: 1, dailyQuizCounts: { '2026-09-07': 1, '2026-09-08': 2, '2026-09-09': 3 } });
    const before = JSON.stringify(stats);
    return {
      current: renderQuizStreakBadge(stats),
      expired: renderQuizStreakBadge(stats, new Date('2026-09-12T12:00:00')),
      yesterday: renderQuizStreakBadge(stats, new Date('2026-09-10T12:00:00')),
      unchanged: JSON.stringify(stats) === before
    };
  });
  expect(result.current).toContain('3 dager på rad');
  expect(result.current).toContain('3 quiz i dag');
  expect(result.yesterday).toContain('3 dager på rad');
  expect(result.expired).toContain('0 dager på rad');
  expect(result.expired).not.toContain('quiz-streak-active');
  expect(result.unchanged).toBe(true);
});

test('ending an unanswered quiz does not earn a quiz day', async ({ page }) => {
  await showResult(page, { answered: 0, strength: 0 });
  await expect(page.locator('#mixedQuizStreakSummary')).toContainText('0 dager på rad');
  await expect(page.locator('#mixedQuizStreakSummary')).not.toHaveClass(/quiz-streak-active/);
  await expect(page.locator('.quiz-skill-star')).toHaveCount(0);
});
