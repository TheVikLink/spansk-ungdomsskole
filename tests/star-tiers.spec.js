import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();
const skill = 'a0.articles.definite_singular';
test.beforeEach(async ({ page }) => { await page.goto(appUrl); await page.evaluate(() => { studentName = 'Test'; showMainApp(); }); });

test('star thresholds have no gaps and never round a near-perfect score to diamond', async ({ page }) => {
  const scores = [0, 49, 50, 74, 74.99, 75, 89, 89.99, 90, 99, 99.99, 100, -1, 101, null];
  expect(await page.evaluate(scores => scores.map(score => getPracticeStarTier(score)?.id || null), scores)).toEqual([
    null, null, 'bronze', 'bronze', 'bronze', 'silver', 'silver', 'silver', 'gold', 'gold', 'gold', 'diamond', null, null, null
  ]);
});

test('recent evidence needs ten answers; old totals and malformed data cannot invent a star', async ({ page }) => {
  const result = await page.evaluate(skill => {
    const badge = cell => getMasteryBadges({ skillProgress: { [skill]: cell } })[0] || null;
    return {
      old: badge({ attempts: 100, correct: 100, strength: 5 }),
      short: badge({ starResults: Array(9).fill(true) }),
      invalid: badge({ starResults: [...Array(10).fill(true), 'false'] }),
      empty: badge({ starResults: [] }),
      enough: badge({ starResults: Array(10).fill(true) })
    };
  }, skill);
  expect(result.old).toBeNull(); expect(result.short).toBeNull(); expect(result.invalid).toBeNull(); expect(result.empty).toBeNull();
  expect(result.enough).toMatchObject({ tier: 'diamond', score: 100, answered: 10, correct: 10 });
});

test('new correct answers can replace earlier mistakes and eventually earn diamond', async ({ page }) => {
  const result = await page.evaluate(skill => {
    let progress = normalizeLearningProgress(null);
    const answer = resultKind => { progress = updateLearningProgress({ progress, targetType: 'skill', targetId: skill, resultKind }); };
    for (let i = 0; i < 10; i++) answer('wrong');
    for (let i = 0; i < 10; i++) answer('correct');
    const bronze = getMasteryBadges(progress)[0];
    for (let i = 0; i < 10; i++) answer('correct');
    return { bronze, diamond: getMasteryBadges(progress)[0], cell: progress.skillProgress[skill] };
  }, skill);
  expect(result.bronze).toMatchObject({ tier: 'bronze', score: 50 });
  expect(result.diamond).toMatchObject({ tier: 'diamond', score: 100 });
  expect(result.cell.starResults).toEqual(Array(20).fill(true));
  expect(result.cell).toMatchObject({ attempts: 30, correct: 20 });
});

test('accent errors and repeated verb forms do not get a perfect topic star', async ({ page }) => {
  const result = await page.evaluate(skill => {
    let progress = normalizeLearningProgress(null);
    for (const resultKind of [...Array(10).fill('correct'), 'accent_or_case_variant']) progress = updateLearningProgress({ progress, targetType: 'skill', targetId: skill, resultKind });
    return {
      accented: getMasteryBadges(progress)[0],
      repeated: getMasteryBadges({ skillProgress: { 'a1.verbs.regular_ar.present': { starResults: Array(20).fill(true), verbForms: ['hablar:0'] } } })
    };
  }, skill);
  expect(result.accented.tier).toBe('gold');
  expect(result.accented.correct).toBe(10);
  expect(result.repeated).toEqual([]);
});

test('awards only higher levels, preserves old IDs and does not re-award after a setback', async ({ page }) => {
  const result = await page.evaluate(skill => {
    const legacy = `mastery:${skill}`;
    localStorage.setItem(MASTERY_BADGES_KEY, JSON.stringify({ schemaVersion: 1, badges: [legacy] }));
    const awards = [10, 15, 18, 20, 10, 20].map(correct => awardMasteryBadges({ skillProgress: { [skill]: { starResults: Array.from({ length: 20 }, (_, i) => i < correct) } } }).newlyEarned.map(badge => badge.tier));
    return { awards, stored: loadMasteryBadges(), legacy };
  }, skill);
  expect(result.awards).toEqual([['bronze'], ['silver'], ['gold'], ['diamond'], [], []]);
  expect(result.stored).toEqual([result.legacy, ...['bronze', 'silver', 'gold', 'diamond'].map(tier => `star:${tier}:${skill}`)]);
});

test('recent score evidence and awards survive export/import in a clean profile', async ({ page, browser }) => {
  const exported = await page.evaluate(skill => {
    let progress = normalizeLearningProgress(null);
    for (let i = 0; i < 20; i++) progress = updateLearningProgress({ progress, targetType: 'skill', targetId: skill, resultKind: i < 18 ? 'correct' : 'wrong' });
    saveLearningProgress(progress); awardMasteryBadges(progress); return buildProgressExportData();
  }, skill);
  const context = await browser.newContext(); const clean = await context.newPage(); await clean.goto(appUrl);
  const restored = await clean.evaluate(data => { importProgressData(data); return { progress: loadLearningProgress(), awards: loadMasteryBadges(), newAwards: awardMasteryBadges().newlyEarned }; }, exported);
  expect(restored.progress.skillProgress[skill]).toEqual(exported.learningProgress.skillProgress[skill]);
  expect(restored.awards).toEqual(exported.masteryBadges.badges); expect(restored.newAwards).toEqual([]);
  await context.close();
});

for (const correct of [true, false]) test(`grammar awards reflect the actual last answer, correct=${correct}, and theory cannot award twice`, async ({ page }) => {
  await page.evaluate(skill => {
    const progress = normalizeLearningProgress(null); progress.skillProgress[skill] = { attempts: 9, correct: 9, strength: 5, starResults: Array(9).fill(true) }; saveLearningProgress(progress);
    showPage('grammar'); currentGrammarTopic = grammarTopics.articles; startGrammarExercises({ filterSkillIds: [skill] });
  }, skill);
  const answer = await page.evaluate(correct => { const e = grammarExercises[0]; return correct ? e.answer : e.options.find(value => value !== e.answer); }, correct);
  await page.locator('.grammar-option').getByText(answer, { exact: true }).click();
  await page.evaluate(() => { endGrammarSession(); endGrammarSession(); });
  const star = page.locator('#grammarExerciseArea .quiz-skill-star');
  await expect(star).toHaveCount(1);
  await expect(star).toHaveAttribute('data-star-tier', correct ? 'diamond' : 'gold');
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  await page.getByRole('button', { name: 'Lær mer: Velg el, la, los eller las', exact: true }).click();
  await page.getByRole('button', { name: /Tilbake til resultatet/ }).click();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
});

test('an actual verb answer earns the next star and repeated finish keeps the same award', async ({ page }) => {
  await page.evaluate(() => {
    const progress = normalizeLearningProgress(null);
    progress.skillProgress['a1.verbs.regular_ar.present'] = { attempts: 9, correct: 9, strength: 5, starResults: Array(9).fill(true), verbForms: ['hablar:0', 'hablar:1', 'hablar:2', 'trabajar:0', 'trabajar:1', 'trabajar:2'] };
    saveLearningProgress(progress); showPage('verbs'); selectedVerbs = new Set(['hablar']); startVerbSession();
  });
  await page.locator('#verbInput').fill(await page.locator('#verbInput').getAttribute('data-expected'));
  await page.getByRole('button', { name: '✓ Sjekk svar', exact: true }).click();
  await page.evaluate(() => { endVerbSession(); endVerbSession(); });
  await expect(page.locator('#verbExerciseArea .quiz-skill-star')).toHaveAttribute('data-star-tier', 'diamond');
  expect(await page.evaluate(() => loadMasteryBadges())).toEqual(['star:diamond:a1.verbs.regular_ar.present']);
});

for (const width of [1440, 390]) test(`all four star materials and their scale are readable at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.evaluate(() => {
    showPage('vocab'); startBrainmapSkillPractice('a0.articles.definite_singular');
    const progress = normalizeLearningProgress(null);
    ['a0.articles.definite_singular', 'a1.gustar.basic', 'a0.articles.definite_plural', 'a1.hay_estar.contrast'].forEach((id, index) => {
      const correct = [10, 15, 18, 20][index];
      progress.skillProgress[id] = { attempts: 20, correct, strength: 4, starResults: Array.from({ length: 20 }, (_, i) => i < correct) };
    });
    saveLearningProgress(progress);
    mixedQuizState.answered = 10; mixedQuizState.correct = 10;
    mixedQuizState.quiz.items = Array.from({ length: 10 }, () => ({})); finishMixedQuiz();
  });
  const stars = page.locator('#mixedQuizQuestion .quiz-skill-star');
  await expect(stars.locator('.quiz-star-tier-label')).toHaveText(['Bronse · 50 %', 'Sølv · 75 %', 'Gull · 90 %', 'Diamant · 100 %']);
  const fills = await stars.locator('summary > svg').evaluateAll(elements => elements.map(el => getComputedStyle(el).fill));
  expect(new Set(fills).size).toBe(4);
  await expect(stars.last().locator('.star-facet-light')).toBeVisible();
  await stars.last().locator('summary').press('Enter');
  await expect(stars.last().locator('p')).toContainText('20 av de siste 20 svarene');
  await stars.last().locator('summary').press('Enter');
  const scale = page.locator('.quiz-star-scale');
  await scale.locator('summary').click();
  await expect(scale.locator('li')).toHaveCount(4);
  await expect(scale).toContainText('minst 10 svar');
  await scale.locator('summary').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.quiz-badge-awards').screenshot({ path: `output/brukertest-rettelser/star-tiers-${width}.png` });
});

test('old progress and old award IDs import without inventing recent outcomes', async ({ page, browser }) => {
  const context = await browser.newContext(); const clean = await context.newPage(); await clean.goto(appUrl);
  const result = await clean.evaluate(skill => {
    importProgressData({ version: 'spansk123_export_v1', learningProgress: { schemaVersion: 1, skillProgress: { [skill]: { attempts: 40, correct: 35, strength: 5 } }, wordProgress: {} }, masteryBadges: { schemaVersion: 1, badges: [`mastery:${skill}`] } });
    return { cell: loadLearningProgress().skillProgress[skill], newAwards: awardMasteryBadges().newlyEarned, ids: loadMasteryBadges() };
  }, skill);
  expect(result.cell).toMatchObject({ attempts: 40, correct: 35, strength: 5 });
  expect(result.cell.starResults).toBeUndefined(); expect(result.newAwards).toEqual([]); expect(result.ids).toEqual([`mastery:${skill}`]);
  await context.close();
});
