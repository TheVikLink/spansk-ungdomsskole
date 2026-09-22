import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('adaptive scaffolding in response modes (spansk-ungdomsskole-6j4)', () => {
  test('defines explicit scaffolding policies across all four exercise families', async ({ page }) => {
    await page.goto(appUrl);

    const policy = await page.evaluate(() => {
      return {
        hasPolicy: typeof ADAPTIVE_SCAFFOLDING_POLICY === 'object',
        families: Object.keys(ADAPTIVE_SCAFFOLDING_POLICY),
        vocabLevels: ADAPTIVE_SCAFFOLDING_POLICY.vocabulary.levels,
        grammarLevels: ADAPTIVE_SCAFFOLDING_POLICY.grammar.levels,
        verbLevels: ADAPTIVE_SCAFFOLDING_POLICY.verbs.levels,
        mixedTarget: ADAPTIVE_SCAFFOLDING_POLICY.mixedQuiz.targetDistribution
      };
    });

    expect(policy.hasPolicy).toBe(true);
    expect(policy.families).toEqual(expect.arrayContaining(['vocabulary', 'grammar', 'verbs', 'mixedQuiz']));
    expect(policy.vocabLevels.newOrWeak.mode).toBe('flip');
    expect(policy.vocabLevels.developing.mode).toBe('select');
    expect(policy.vocabLevels.mastered.mode).toBe('typed');
    expect(policy.grammarLevels.newOrWeak.mode).toBe('choice');
    expect(policy.verbLevels.newOrWeak.mode).toBe('choice');
    expect(policy.verbLevels.mastered.mode).toBe('typed_challenge');
    expect(policy.mixedTarget).toEqual({ typed: 5, select: 3, choice: 2 });
  });

  test('resolves scaffolding response modes according to cell strength and lapses', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      return {
        vocabNew: getScaffoldedResponseMode('vocabulary', { strength: 0, lapses: 0 }),
        vocabDev: getScaffoldedResponseMode('vocabulary', { strength: 2, lapses: 0 }),
        vocabMaster: getScaffoldedResponseMode('vocabulary', { strength: 4, lapses: 0 }),
        vocabLapsed: getScaffoldedResponseMode('vocabulary', { strength: 4, lapses: 1 }),
        vocabRetry: getScaffoldedResponseMode('vocabulary', { strength: 4, lapses: 0 }, { scaffoldedAfterError: true }),
        grammarWeak: getScaffoldedResponseMode('grammar', { strength: 1, lapses: 0 }),
        grammarDev: getScaffoldedResponseMode('grammar', { strength: 3, lapses: 0 }),
        grammarRetry: getScaffoldedResponseMode('grammar', { strength: 4, lapses: 0 }, { scaffoldedAfterError: true }),
        verbNew: getScaffoldedResponseMode('verbs', { strength: 0, lapses: 0 }),
        verbDev: getScaffoldedResponseMode('verbs', { strength: 2, lapses: 0 }),
        verbMaster: getScaffoldedResponseMode('verbs', { strength: 5, lapses: 0 })
      };
    });

    expect(result.vocabNew).toBe('flip');
    expect(result.vocabDev).toBe('select');
    expect(result.vocabMaster).toBe('typed');
    expect(result.vocabLapsed).toBe('select');
    expect(result.vocabRetry).toBe('select');
    expect(result.grammarWeak).toBe('choice');
    expect(result.grammarDev).toBe('select');
    expect(result.grammarRetry).toBe('choice');
    expect(result.verbNew).toBe('choice');
    expect(result.verbDev).toBe('typed_hint');
    expect(result.verbMaster).toBe('typed_challenge');
  });

  test('re-queues a failed vocabulary card with scaffolding and visible Støtte etter feil badge', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      const testCard = {
        id: 99,
        no: 'eple',
        es: 'manzana',
        category: 'mat',
        noEs: { easeFactor: 2.5, interval: 7, repetitions: 4, strength: 4, lapses: 0 },
        esNo: { easeFactor: 2.5, interval: 7, repetitions: 4, strength: 4, lapses: 0 }
      };
      cards = [testCard];
      sessionCards = [
        { card: testCard, direction: 'no-es', responseMode: 'typed', typed: true }
      ];
      activeSessionType = 'vocabulary';
      currentIndex = 0;
      sessionStats = { reviewed: 0, correct: 0, newLearned: 0 };
      showVocabCard();

      const initialBadge = document.querySelector('.card-type-badge')?.textContent.trim();
      const initialMode = currentCard.responseMode;

      // Fail the card
      rateCard(0, false);

      const queuedRetry = sessionCards[sessionCards.length - 1];

      // Advance to the retry item
      currentIndex = 1;
      showVocabCard();

      const retryBadge = document.querySelector('.card-type-badge')?.textContent.trim();
      const hasSelect = Boolean(document.getElementById('vocabSelect'));

      return {
        initialBadge,
        initialMode,
        queuedRetryMode: queuedRetry.responseMode,
        queuedRetryScaffolded: queuedRetry.scaffoldedAfterError,
        retryBadge,
        hasSelect
      };
    });

    expect(result.initialBadge).toBe('Skriv svaret');
    expect(result.initialMode).toBe('typed');
    expect(result.queuedRetryMode).toBe('select');
    expect(result.queuedRetryScaffolded).toBe(true);
    expect(result.retryBadge).toContain('Støtte etter feil');
    expect(result.hasSelect).toBe(true);
  });

  test('submitting a scaffolded vocabulary retry gives positive acknowledgement', async ({ page }) => {
    await page.goto(appUrl);

    const feedback = await page.evaluate(() => {
      localStorage.clear();
      const testCard = {
        id: 99,
        no: 'eple',
        es: 'manzana',
        category: 'mat',
        noEs: { easeFactor: 2.5, interval: 0, repetitions: 1, strength: 2, lapses: 1 },
        esNo: { easeFactor: 2.5, interval: 0, repetitions: 1, strength: 2, lapses: 0 }
      };
      cards = [testCard];
      currentCard = {
        card: testCard,
        direction: 'no-es',
        responseMode: 'select',
        scaffoldedAfterError: true
      };
      sessionCards = [currentCard];
      currentIndex = 0;
      currentCardRated = false;
      activeSessionType = 'vocabulary';
      sessionStats = { reviewed: 0, correct: 0, newLearned: 0 };

      // Render the select card
      showVocabCard();

      // Select correct answer
      const select = document.getElementById('vocabSelect');
      select.selectedIndex = 1;
      submitVocabSelectAnswer();

      return document.getElementById('vocabSelectFeedback')?.textContent.trim();
    });

    expect(feedback).toContain('Riktig med støtte');
  });

  test('mixed quiz allocates choice to weakest recognition candidates and select to stronger candidates', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      const cell = (strength, attempts = 1, lapses = 0) => ({
        strength,
        attempts,
        correct: strength >= 2 ? attempts : 0,
        lapses,
        dueAt: null,
        lastSeenAt: '2026-08-07T09:00:00.000Z'
      });

      const learningProgress = {
        schemaVersion: 1,
        createdAt: '2026-08-07T08:00:00.000Z',
        updatedAt: '2026-08-07T09:00:00.000Z',
        wordProgress: {
          'core.hola': { noToEs: cell(0, 0), esToNo: cell(0, 0) },
          'core.gracias': { noToEs: cell(0, 0), esToNo: cell(0, 0) },
          'core.madre': { noToEs: cell(0, 0), esToNo: cell(0, 0) },
          'core.cinco': { noToEs: cell(0, 0), esToNo: cell(0, 0) }
        },
        skillProgress: {
          // Weakest skills
          'a0.identity.me_llamo': cell(0, 2, 1),
          'a1.verbs.regular_ar.present': cell(1, 2, 1),
          // Stronger skills
          'a0.identity.soy_de': cell(3, 3, 0),
          'a0.articles.indefinite_singular': cell(3, 3, 0),
          'a0.articles.definite_singular': cell(5, 5, 0),
          'a1.verbs.regular_er.present': cell(3, 3, 0)
        }
      };

      const quiz = buildMixedQuiz({
        cards: [],
        skillsCatalog: learningCatalog,
        learningProgress,
        diagnosis: { status: 'complete', answers: [] },
        now: '2026-08-07T10:00:00.000Z',
        seed: 'test-allocation-seed',
        size: 10
      });

      const recognitionItems = quiz.items.filter(item => item.sourceResponseMode === 'choice');
      return {
        totalItems: quiz.items.length,
        modeCounts: quiz.items.reduce((acc, item) => {
          acc[item.responseMode] = (acc[item.responseMode] || 0) + 1;
          return acc;
        }, {}),
        choiceItems: recognitionItems.filter(item => item.responseMode === 'choice').map(i => ({ id: i.targetId, strength: i.strength, lapses: i.lapses })),
        selectItems: recognitionItems.filter(item => item.responseMode === 'select').map(i => ({ id: i.targetId, strength: i.strength, lapses: i.lapses }))
      };
    });

    expect(result.totalItems).toBe(10);
    expect(result.modeCounts).toEqual({ typed: 5, select: 3, choice: 2 });
    // The 2 choice items must have received maximum support (lowest strength / highest lapses)
    for (const choiceItem of result.choiceItems) {
      for (const selectItem of result.selectItems) {
        expect(choiceItem.strength).toBeLessThanOrEqual(selectItem.strength);
      }
    }
  });

  test('mixed quiz renders appropriate mode labels and isolates constraint hints from prompt', async ({ page }) => {
    await page.goto(appUrl);

    const labels = await page.evaluate(() => {
      return {
        choice: getMixedQuizModeLabel({ responseMode: 'choice' }),
        select: getMixedQuizModeLabel({ responseMode: 'select' }),
        typed: getMixedQuizModeLabel({ responseMode: 'typed' }),
        typedHint: getMixedQuizModeLabel({ responseMode: 'typed', answerConstraint: { type: 'startsWith', value: 'c' } }),
        scaffolded: getMixedQuizModeLabel({ responseMode: 'select', scaffoldedAfterError: true })
      };
    });

    expect(labels.choice).toBe('💡 Flervalg');
    expect(labels.select).toBe('📝 Nedtrekk');
    expect(labels.typed).toBe('✍️ Skriv inn');
    expect(labels.typedHint).toBe('✍️ Skriv inn (med hint)');
    expect(labels.scaffolded).toBe('💡 Støtte etter feil');

    // Verify rendering in mixed quiz DOM isolates prompt from answer-constraint
    await page.evaluate(() => {
      studentName = 'Test';
      showMainApp();
      showPage('vocab');
      const itemWithHint = {
        questionId: 'test.hint',
        itemType: 'word',
        direction: 'no-es',
        prompt: 'et hus',
        responseMode: 'typed',
        acceptedAnswers: [{ value: 'una casa' }],
        answerConstraint: { type: 'startsWith', value: 'u' }
      };
      mixedQuizState = {
        quiz: { items: [itemWithHint] },
        index: 0,
        answered: 0,
        correct: 0,
        startedAt: new Date(),
        results: []
      };
      document.getElementById('vocabSettings').classList.add('hidden');
      document.getElementById('mixedQuizStudy').classList.remove('hidden');
      renderMixedQuizQuestion();
    });

    const promptText = await page.locator('.mixed-quiz-prompt').textContent();
    expect(promptText).toBe('et hus');
    const constraintText = await page.locator('.answer-constraint').textContent();
    expect(constraintText).toContain('begynner på «u»');
    const modePillText = await page.locator('.mixed-quiz-mode-pill').textContent();
    expect(modePillText).toBe('✍️ Skriv inn (med hint)');
  });


  test('verb practice shows choice buttons for beginner/weak verbs and removes them for mastered verbs', async ({ page }) => {
    await page.goto(appUrl);

    // Beginner verb (strength 0)
    const beginnerResult = await page.evaluate(() => {
      localStorage.clear();
      selectedVerbs = new Set(['hablar']);
      selectedTense = 'presente';
      startVerbSession();
      return {
        hasChoiceButtons: document.querySelectorAll('.verb-choice-btn').length > 0,
        badgeText: document.querySelector('.verb-scaffolding-badge')?.textContent.trim(),
        inputExists: Boolean(document.getElementById('verbInput'))
      };
    });

    expect(beginnerResult.hasChoiceButtons).toBe(true);
    expect(beginnerResult.badgeText).toContain('Velg eller skriv');
    expect(beginnerResult.inputExists).toBe(true);

    // Mastered verb (strength 5)
    const masteredResult = await page.evaluate(() => {
      const progress = normalizeLearningProgress(null);
      progress.skillProgress['a1.verbs.regular_ar.present'] = {
        attempts: 10,
        correct: 10,
        strength: 5,
        lapses: 0
      };
      saveLearningProgress(progress);
      selectedVerbs = new Set(['hablar']);
      selectedTense = 'presente';
      startVerbSession();
      return {
        hasChoiceButtons: document.querySelectorAll('.verb-choice-btn').length > 0,
        scaffoldingBadge: document.querySelector('.verb-scaffolding-badge')
      };
    });

    expect(masteredResult.hasChoiceButtons).toBe(false);
    expect(masteredResult.scaffoldingBadge).toBeNull();
  });

  test('clicking a verb choice option populates verbInput and highlights button', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev';
      showMainApp();
      showPage('verbs');
      selectedVerbs = new Set(['hablar']);
      selectedTense = 'presente';
      startVerbSession();
    });

    const firstBtn = page.locator('.verb-choice-btn').first();
    const btnText = await firstBtn.textContent();
    await firstBtn.click();

    const inputValue = await page.locator('#verbInput').inputValue();
    expect(inputValue.trim()).toBe(btnText.trim());
    await expect(firstBtn).toHaveClass(/btn-primary/);
  });

  test('grammar exercises display scaffolding badges and wrong answer explains future support', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      showPage('grammar');
      currentGrammarTopic = grammarTopics.articles;
      startGrammarExercises();

      const badge = document.querySelector('.grammar-scaffolding-badge')?.textContent.trim();

      // Click wrong option
      const currentEx = grammarExercises[0];
      const wrongOpt = currentEx.options.find(o => o.toLowerCase() !== currentEx.answer.toLowerCase());
      const wrongBtn = [...document.querySelectorAll('.grammar-option')].find(b => b.textContent.trim() === wrongOpt);
      selectGrammarAnswer(wrongOpt, wrongBtn);

      const note = document.querySelector('.grammar-scaffolding-note')?.textContent.trim();
      return { badge, note };
    });

    expect(result.badge).toContain('Støtte');
    expect(result.note).toContain('forsterket støtte');
  });

  test('grammar renders and submits the contracted adaptive controls', async ({ page }) => {
    await page.goto(appUrl);
    const skillId = 'a0.articles.definite_singular';
    for (const [name, cell, control] of [
      ['weak', { strength: 1, attempts: 1, lapses: 0 }, 'choice'],
      ['developing', { strength: 3, attempts: 3, lapses: 0 }, 'select'],
      ['mastered', { strength: 4, attempts: 4, lapses: 0 }, 'typed']
    ]) {
      await page.evaluate(({ skillId, cell }) => {
        localStorage.clear();
        studentName = 'Elev adaptive';
        localStorage.setItem('spansk123_studentName', studentName);
        showMainApp();
        const progress = normalizeLearningProgress(null);
        progress.skillProgress[skillId] = { ...cell, correct: cell.attempts, starResults: Array(cell.attempts).fill(true) };
        saveLearningProgress(progress);
        showPage('grammar');
        currentGrammarTopic = grammarTopics.articles;
        startGrammarExercises({ filterSkillIds: [skillId] });
      }, { skillId, cell });
      const answer = await page.evaluate(() => grammarExercises[grammarCurrentIndex].answer);
      if (control === 'choice') {
        await expect(page.locator('.grammar-option')).toHaveCount(4);
        await page.locator('.grammar-option').getByText(answer, { exact: true }).click();
      } else if (control === 'select') {
        await expect(page.locator('#grammarSelect')).toBeVisible();
        await page.locator('#grammarSelect').selectOption({ label: answer });
        await page.locator('#grammarSubmitBtn').click();
      } else {
        await expect(page.locator('#grammarAnswerInput')).toBeVisible();
        await page.locator('#grammarAnswerInput').fill(answer);
        await page.locator('#grammarSubmitBtn').click();
      }
      await expect(page.locator('#grammarFeedback')).toContainText('Riktig');
      expect(await page.evaluate(skill => loadLearningProgress().skillProgress[skill].attempts, skillId)).toBe(cell.attempts + 1);
      await page.evaluate(() => abandonActiveSession());
    }
  });

  test('derived vocabulary response mode handles imported progress without strength safely', async ({ page }) => {
    await page.goto(appUrl);

    const modes = await page.evaluate(() => {
      // Legacy SM2 shapes from old exports without strength field
      return [
        getVocabularyResponseMode({ repetitions: 0, interval: 0 }),
        getVocabularyResponseMode({ repetitions: 2, interval: 1 }),
        getVocabularyResponseMode({ repetitions: 3, interval: 6 }),
        getVocabularyResponseMode({ repetitions: 4, interval: 10 }),
        getVocabularyResponseMode({ repetitions: 4, interval: 10, lapses: 2 }) // With lapses
      ];
    });

    expect(modes[0]).toBe('flip');
    expect(modes[1]).toBe('select');
    expect(modes[2]).toBe('select');
    expect(modes[3]).toBe('typed');
    expect(modes[4]).toBe('select'); // Demoted due to lapses
  });
});
