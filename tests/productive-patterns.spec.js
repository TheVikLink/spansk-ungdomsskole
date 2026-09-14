import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('productive expression patterns (spansk-ungdomsskole-63l)', () => {
  test('learningCatalog defines all 4 pattern skills with ready contentStatus', async ({ page }) => {
    await page.goto(appUrl);

    const skills = await page.evaluate(() => {
      const ids = [
        'a0.patterns.tengo',
        'a1.patterns.quiero',
        'a1.patterns.me_gusta',
        'a1.patterns.voy_a'
      ];
      return ids.map(id => learningCatalog.skills.find(skill => skill.id === id));
    });

    expect(skills.every(Boolean)).toBe(true);
    expect(skills.map(s => s.group)).toEqual([
      'Setninger og uttrykk',
      'Setninger og uttrykk',
      'Setninger og uttrykk',
      'Setninger og uttrykk'
    ]);
    expect(skills.map(s => s.contentStatus)).toEqual(['ready', 'ready', 'ready', 'ready']);
    expect(skills.map(s => s.sourceNote)).toEqual([
      'grammar-topic',
      'grammar-topic',
      'grammar-topic',
      'grammar-topic'
    ]);
  });

  test('does not overreport full verb paradigm: getGrammarTopicSkillId returns null for patterns', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      const topicSkill = getGrammarTopicSkillId('patterns');
      const exercises = grammarTopics.patterns.exercises;
      const exerciseSkills = exercises.map(ex => getGrammarExerciseSkillId('patterns', ex));
      const distinctSkills = [...new Set(exerciseSkills)].sort();
      return { topicSkill, distinctSkills, totalExercises: exercises.length };
    });

    // CRITICAL: Topic itself must return null so learning-progress-core does not map the entire
    // irregular verb or grammar topic to a single broad skill.
    expect(result.topicSkill).toBeNull();
    expect(result.totalExercises).toBe(24);
    expect(result.distinctSkills).toEqual([
      'a0.patterns.tengo',
      'a1.patterns.me_gusta',
      'a1.patterns.quiero',
      'a1.patterns.voy_a'
    ]);
  });

  test('star labels render chip labels for pattern badges', async ({ page }) => {
    await page.goto(appUrl);

    const labels = await page.evaluate(() => {
      return [
        getQuizStarLabel({ skillId: 'a0.patterns.tengo', label: 'Bruke tengo' }),
        getQuizStarLabel({ skillId: 'a1.patterns.quiero', label: 'Bruke quiero' }),
        getQuizStarLabel({ skillId: 'a1.patterns.me_gusta', label: 'Bruke me gusta' }),
        getQuizStarLabel({ skillId: 'a1.patterns.voy_a', label: 'Bruke voy a' })
      ];
    });

    expect(labels).toEqual(['tengo', 'quiero', 'me gusta', 'voy a']);
  });

  test('grammar lesson a1.patterns.productive is published and renders theory and practice', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      showPage('grammar');
      openGrammarLesson('a1.patterns.productive');
      const title = document.getElementById('grammarLessonTitle')?.textContent;
      const content = document.getElementById('grammarLessonContent')?.textContent;
      return {
        title,
        hasTengo: content?.includes('Tengo'),
        hasQuiero: content?.includes('Quiero'),
        hasMeGusta: content?.includes('Me gusta'),
        hasVoyA: content?.includes('Voy a')
      };
    });

    expect(result.title).toContain('Produktive mønstre');
    expect(result.hasTengo).toBe(true);
    expect(result.hasQuiero).toBe(true);
    expect(result.hasMeGusta).toBe(true);
    expect(result.hasVoyA).toBe(true);
  });

  test('grammarExercises keeps per-exercise distractors when lesson practice is started', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      showPage('grammar');
      startGrammarLessonPractice('a1.patterns.productive');
      const hungerEx = grammarTopics.patterns.exercises.find(e => e.no.includes('sulten'));
      return {
        exerciseCount: grammarExercises.length,
        hungerDistractors: hungerEx?.options
      };
    });

    expect(result.exerciseCount).toBeGreaterThanOrEqual(10);
    expect(result.hungerDistractors).toEqual(['Tengo', 'Soy', 'Estoy', 'Hago']);
  });

  test('selectGrammarExercises avoids repeating Norwegian meaning variations in a single session', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      const topicExercises = grammarTopics.patterns.exercises;
      const selected = selectGrammarExercises(topicExercises, 10);
      const norwegianPrompts = selected.map(e => e.no);
      const uniquePrompts = new Set(norwegianPrompts);
      return {
        selectedCount: selected.length,
        isUnique: uniquePrompts.size === norwegianPrompts.length
      };
    });

    expect(result.selectedCount).toBe(10);
    expect(result.isUnique).toBe(true);
  });

  test('syntactic integrity: no invalid *Tengo estudiar pattern in any exercise', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      const exercises = grammarTopics.patterns.exercises;
      // Search for any exercise that combines Tengo directly with an infinitive without "que"
      const invalidTengoInfinitive = exercises.some(e => {
        const full = e.sentence.replace('___', e.answer);
        return /tengo\s+(estudiar|dormir|comer|bailar|hablar)/i.test(full);
      });
      return { invalidTengoInfinitive, total: exercises.length };
    });

    expect(result.invalidTengoInfinitive).toBe(false);
  });

  test('scaffold and mistake explanations support patterns topic', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      const scaffold = getGrammarScaffold(grammarTopics.patterns);
      const mistake = getGrammarMistakeExplanation('patterns', { answer: 'Tengo' });
      return {
        scaffoldHasParts: scaffold.parts.length > 0,
        scaffoldHasTengo: scaffold.parts.some(p => p.includes('tengo')),
        mistakeHasTengoRule: mistake.includes('tengo for tilstand og alder'),
        mistakeHasQuieroRule: mistake.includes('quiero for ønsker'),
        mistakeHasVoyARule: mistake.includes('voy a for planer')
      };
    });

    expect(result.scaffoldHasParts).toBe(true);
    expect(result.scaffoldHasTengo).toBe(true);
    expect(result.mistakeHasTengoRule).toBe(true);
    expect(result.mistakeHasQuieroRule).toBe(true);
    expect(result.mistakeHasVoyARule).toBe(true);
  });

  test('brainmap descriptors route pattern skills to grammar topic patterns', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      const descriptors = getBrainmapSkillActionDescriptors();
      const tengoDesc = descriptors['a0.patterns.tengo'];
      const quieroDesc = descriptors['a1.patterns.quiero'];
      const meGustaDesc = descriptors['a1.patterns.me_gusta'];
      const voyADesc = descriptors['a1.patterns.voy_a'];
      return { tengoDesc, quieroDesc, meGustaDesc, voyADesc };
    });

    expect(result.tengoDesc).toEqual({ kind: 'grammar', topicId: 'patterns', label: 'Øv på uttrykk med tengo' });
    expect(result.quieroDesc).toEqual({ kind: 'grammar', topicId: 'patterns', label: 'Øv på uttrykk med quiero' });
    expect(result.meGustaDesc).toEqual({ kind: 'grammar', topicId: 'patterns', label: 'Øv på uttrykk med me gusta' });
    expect(result.voyADesc).toEqual({ kind: 'grammar', topicId: 'patterns', label: 'Øv på uttrykk med voy a' });
  });

  test('sentence puzzle includes patterns level and can be solved', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev Mønster';
      showMainApp();
      showPage('games');
    });

    await page.getByRole('button', { name: /Setningspuslespill/ }).click();
    await expect(page.locator('#sentencePuzzleSetup')).toBeVisible();

    // Select the new 'patterns' level
    const patternsOption = page.locator('button[data-sp-level="patterns"]');
    await expect(patternsOption).toBeVisible();
    await patternsOption.click();
    await expect(patternsOption).toHaveClass(/active/);

    await page.getByRole('button', { name: /Start puslespillet/ }).click();
    await expect(page.locator('#sentencePuzzleGame')).toBeVisible();

    // Solve one puzzle correctly
    const result = await page.evaluate(() => {
      const expected = spCurrentPuzzle.words;
      expected.forEach(word => {
        const btn = document.querySelector(`[data-sp-word="${word.replaceAll('"', '\\"')}"]`);
        if (btn) btn.click();
      });
      checkSentencePuzzle();
      return {
        solved: spSolved,
        feedback: document.getElementById('spFeedback')?.textContent,
        currentPoolLength: spQuestionPool.length
      };
    });

    expect(result.solved).toBe(1);
    expect(result.feedback).toContain('Riktig');
    expect(result.currentPoolLength).toBe(14);
  });
});
