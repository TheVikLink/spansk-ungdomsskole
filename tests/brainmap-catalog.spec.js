import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

const repairedTargets = [
  'a0.identity.age', 'a0.existential.hay', 'a0.possession.tener',
  'a0.greetings.como_estas', 'a0.work.trabajar', 'a0.location.vivo_en',
  'a0.professions.zero_article', 'a0.questions.que_es_eso',
  'a0.articles.indefinite_plural', 'a1.adjectives.common_gender', 'a1.adjectives.gender_number'
];

for (const width of [1280, 390]) {
  for (const skillId of repairedTargets) {
    test(`Brainmap ${skillId} starts relevant practice and records its skill at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(appUrl);
      const route = await page.evaluate(skillId => {
        localStorage.clear(); studentName = 'Lokal test'; showMainApp(); showPage('brainmap');
        return getBrainmapSkillActionDescriptors()[skillId];
      }, skillId);
      const node = page.locator(`[data-brainmap-skill-action][onclick="activateBrainmapSkill('${skillId}')"]`);
      const summary = page.locator('details.brainmap-group').filter({ has: node }).locator('summary');
      await summary.focus();
      await page.keyboard.press('Enter');
      await node.focus();
      await page.keyboard.press('Enter');
      if (route.kind === 'lesson') {
        await expect(page.locator('#grammarLessonPage')).toBeVisible();
        await page.locator('.grammar-lesson-actions button').click();
      } else {
        await page.getByRole('button', { name: '▶️ Start øvelser', exact: true }).click();
      }
      const targets = route.practiceSkillIds || [skillId];
      const exercises = await page.evaluate(() => grammarExercises.map(exercise => exercise.skillId));
      expect(exercises.some(id => targets.includes(id))).toBe(true);
      if (route.kind !== 'lesson') expect(exercises.every(id => targets.includes(id))).toBe(true);
      for (let index = 0; index < exercises.length; index++) {
        const current = await page.evaluate(() => grammarExercises[grammarCurrentIndex]);
        const before = await page.evaluate(id => loadLearningProgress().skillProgress[id]?.attempts || 0, current.skillId);
        const answerPattern = new RegExp(`^${current.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const choice = page.locator('.grammar-options').getByRole('button', { name: answerPattern });
        if (await choice.count()) await choice.click();
        else if (await page.locator('#grammarSelect').count()) {
          const value = await page.locator('#grammarSelect option').evaluateAll((options, answer) => options.find(option => option.value.toLowerCase() === answer.toLowerCase())?.value, current.answer);
          await page.locator('#grammarSelect').selectOption(value);
          await page.locator('#grammarSubmitBtn').click();
        } else {
          await page.locator('#grammarAnswerInput').fill(current.answer);
          await page.locator('#grammarSubmitBtn').click();
        }
        expect(await page.evaluate(id => loadLearningProgress().skillProgress[id]?.attempts, current.skillId)).toBe(before + 1);
        if (targets.includes(current.skillId)) break;
        await page.locator('#grammarNextBtn').click();
      }
      expect(await page.evaluate(ids => ids.some(id => loadLearningProgress().skillProgress[id]?.attempts > 0), targets)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
}

test.describe('A0-A1 Brainmap catalog', () => {
  test('a focused next-step link can open practice that exists only in a published lesson', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      studentName = 'Lokal test'; showMainApp(); showPage('brainmap');
      startBrainmapSkillPractice('a0.articles.indefinite_plural');
    });
    await expect(page.locator('#grammarLessonPage')).toBeVisible();
    await expect(page.locator('.grammar-lesson-actions button')).toBeVisible();
  });

  test('every ready route has real practice for its declared target', async ({ page }) => {
    await page.goto(appUrl);
    const empty = await page.evaluate(() => {
      const descriptors = getBrainmapSkillActionDescriptors();
      const candidates = buildMixedQuizCandidates({ cards, learningProgress: loadLearningProgress(), diagnosis: loadDiagnosisState() });
      return learningCatalog.skills.filter(skill => skill.contentStatus === 'ready').filter(skill => {
        const action = descriptors[skill.id];
        if (action.kind === 'grammar') {
          const targets = action.practiceSkillIds || [action.practiceSkillId || skill.id];
          return !targets.every(id => grammarTopics[action.topicId]?.exercises.some(exercise => getGrammarExerciseSkillId(action.topicId, exercise) === id));
        }
        if (action.kind === 'verbs') return !Object.values(verbDatabase).some(verb => getVerbPracticeSkillId({ verb, tense: 'presente' }) === skill.id);
        if (action.kind === 'lesson') return !getGrammarLesson(action.lessonId)?.transferExercises.some(exercise => exercise.skillId === skill.id);
        if (action.kind === 'skillDetail') return !candidates.some(candidate => candidate.targetId === skill.id);
        return true;
      }).map(skill => skill.id);
    });
    expect(empty).toEqual([]);
  });

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
    expect(catalog.filter(skill => skill.status === 'ready' && (!skill.route || skill.route === 'planned')).map(skill => skill.id)).toEqual([]);
    expect(catalog.filter(skill => skill.status === 'planned' && skill.route !== 'planned').map(skill => skill.id)).toEqual([]);
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
