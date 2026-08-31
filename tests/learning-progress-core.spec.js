import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('shared learning progress core', () => {
  test('updates a skill cell through one typed interface', async ({ page }) => {
    await page.goto(appUrl);
    const progress = await page.evaluate(() => updateLearningProgress({
      progress: { schemaVersion: 1, skillProgress: {}, wordProgress: {} },
      targetType: 'skill',
      targetId: 'a1.gustar.basic',
      resultKind: 'correct',
      nowIso: '2026-08-28T10:00:00.000Z'
    }));
    expect(progress.skillProgress['a1.gustar.basic']).toMatchObject({ strength: 2, attempts: 1, correct: 1, lapses: 0 });
  });

  test('updates only the selected word direction and returns normalized progress', async ({ page }) => {
    await page.goto(appUrl);
    const progress = await page.evaluate(() => updateLearningProgress({
      progress: { schemaVersion: 1, skillProgress: {}, wordProgress: { hola: { noToEs: null, esToNo: null } } },
      targetType: 'word',
      targetId: 'hola',
      direction: 'noToEs',
      resultKind: 'wrong',
      nowIso: '2026-08-28T10:00:00.000Z'
    }));
    expect(progress.wordProgress.hola.noToEs).toMatchObject({ strength: 0, attempts: 1 });
    expect(progress.wordProgress.hola.esToNo).toMatchObject({ strength: 0, attempts: 0 });
  });

  test('maps each current grammar topic to an explicit Brainmap skill', async ({ page }) => {
    await page.goto(appUrl);
    const ids = await page.evaluate(() => Object.keys(grammarTopics).map(topicId => getGrammarTopicSkillId(topicId)).filter(Boolean));
    expect(ids).toEqual([
      'a0.articles.indefinite_singular',
      'a1.adjectives.gender_number',
      'a1.ser_estar.identity_or_location',
      'a1.gustar.basic',
      'a1.verbs.reflexive.present',
      'a1.adjectives.demonstratives',
      'a1.adjectives.possessives'
    ]);
  });

  test('maps grammar exercises to their actual micro-skill where the exercise gives enough evidence', async ({ page }) => {
    await page.goto(appUrl);
    const ids = await page.evaluate(() => [
      getGrammarExerciseSkillId('articles', { answer: 'una', sentence: 'Tengo ___ casa' }),
      getGrammarExerciseSkillId('articles', { answer: 'Los', sentence: '___ chicos juegan' }),
      getGrammarExerciseSkillId('serEstar', { answer: 'está', sentence: '¿Dónde ___ el baño?' }),
      getGrammarExerciseSkillId('serEstar', { answer: 'soy', sentence: 'Yo ___ de Noruega' })
    ]);
    expect(ids).toEqual([
      'a0.articles.indefinite_singular',
      'a0.articles.definite_plural',
      'a1.ser_estar.identity_or_location',
      'a1.ser_estar.origin'
    ]);
  });

  test('migrates legacy grammar totals into a skill cell without overwriting stronger progress', async ({ page }) => {
    await page.goto(appUrl);
    const result = await page.evaluate(() => migrateLegacyGrammarProgress({
      schemaVersion: 1, skillProgress: { 'a1.gustar.basic': { strength: 5, attempts: 5, correct: 5 } }, wordProgress: {}
    }, { gustar: { total: 10, correct: 2, recentErrors: 3 } }));
    expect(result.skillProgress['a1.gustar.basic'].strength).toBe(5);
    expect(result.skillProgress['a1.adjectives.gender_number']).toBeUndefined();
    expect(result.skillProgress['a1.gustar.basic']).toMatchObject({ attempts: 5 });
  });

  test('selects weak or due grammar exercises before mastered exercises', async ({ page }) => {
    await page.goto(appUrl);
    const selected = await page.evaluate(() => selectGrammarExercises([
      { id: 'mastered', skillId: 'skill.mastered', answer: 'a' },
      { id: 'due', skillId: 'skill.due', answer: 'b' },
      { id: 'new', skillId: 'skill.new', answer: 'c' }
    ], {
      schemaVersion: 1,
      skillProgress: {
        'skill.mastered': { strength: 5, attempts: 5, dueAt: '2030-01-01T00:00:00.000Z' },
        'skill.due': { strength: 2, attempts: 2, dueAt: '2020-01-01T00:00:00.000Z' }
      },
      wordProgress: {}
    }, '2026-08-28T10:00:00.000Z', 3).map(exercise => exercise.id));
    expect(selected).toEqual(['due', 'new', 'mastered']);
  });

  test('exposes ready grammar micro-skills as mixed quiz candidates', async ({ page }) => {
    await page.goto(appUrl);
    const candidates = await page.evaluate(() => buildGrammarSkillCandidates({
      skillsCatalog: {
        skills: [
          { id: 'a0.articles.indefinite_singular', contentStatus: 'ready', group: 'Artikler' },
          { id: 'a1.ser_estar.origin', contentStatus: 'planned', group: 'Ser og estar' }
        ]
      },
      learningProgress: { schemaVersion: 1, skillProgress: {}, wordProgress: {} }
    }));
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every(candidate => candidate.itemType === 'skill')).toBeTruthy();
    expect(candidates.some(candidate => candidate.targetId === 'a0.articles.indefinite_singular')).toBeTruthy();
    expect(candidates.some(candidate => candidate.targetId === 'a1.ser_estar.origin')).toBeFalsy();
  });

  test('loads legacy grammar progress into the shared progress view', async ({ page }) => {
    await page.goto(appUrl);
    const progress = await page.evaluate(() => {
      localStorage.removeItem('spansk123_learningProgress_v1');
      localStorage.setItem('spansk123Grammar_v1', JSON.stringify({
        progress: { gustar: { total: 4, correct: 3, recentErrors: 1 } }
      }));
      return loadLearningProgress('2026-08-28T10:00:00.000Z');
    });
    expect(progress.skillProgress['a1.gustar.basic']).toMatchObject({ attempts: 4, correct: 3 });
  });

  test('includes grammar candidates in the mixed quiz candidate pool', async ({ page }) => {
    await page.goto(appUrl);
    const result = await page.evaluate(() => buildMixedQuizCandidates({
      cards: [],
      skillsCatalog: {
        skills: [{ id: 'a0.articles.indefinite_singular', contentStatus: 'ready', group: 'Artikler' }],
        words: []
      },
      learningProgress: { schemaVersion: 1, skillProgress: {}, wordProgress: {} },
      diagnosis: { answers: [] }
    }));
    expect(result.some(candidate => candidate.skillKind === 'grammar')).toBeTruthy();
  });

  test('covers the remaining A0 foundation micro-skills with concrete exercises', async ({ page }) => {
    await page.goto(appUrl);
    const result = await page.evaluate(() => {
      const a0 = learningCatalog.skills.filter(skill => skill.level === 'A0');
      const candidates = buildGrammarSkillCandidates({
        skillsCatalog: learningCatalog,
        learningProgress: { schemaVersion: 1, skillProgress: {}, wordProgress: {} }
      });
      return {
        planned: a0.filter(skill => skill.contentStatus === 'planned').map(skill => skill.id),
        covered: [...new Set(candidates.map(candidate => candidate.targetId))]
      };
    });
    expect(result.planned).toEqual([]);
    expect(result.covered).toEqual(expect.arrayContaining([
      'a0.identity.age',
      'a0.existential.hay',
      'a0.possession.tener',
      'a0.greetings.como_estas',
      'a0.work.trabajar',
      'a0.location.vivo_en',
      'a0.professions.zero_article',
      'a0.questions.que_es_eso'
    ]));
  });
});
