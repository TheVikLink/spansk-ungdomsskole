import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('grammar lesson catalog and relevance', () => {
  test('shows the grammar rule card by default before exercises', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      showPage('grammar');
      localStorage.clear();
      startGrammarTopic('articles');
      return {
        lessonVisible: !document.getElementById('grammarLessonPage').classList.contains('hidden'),
        hasDetailedTheory: document.getElementById('grammarLessonContent').textContent.includes('Vanlige ord på -ma')
      };
    });

    expect(result).toEqual({ lessonVisible: true, hasDetailedTheory: true });
  });

  test('opens exercises directly after first theory visit but keeps theory available', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      showPage('grammar');
      startGrammarTopic('articles');
      const firstVisitShowsTheory = !document.getElementById('grammarLessonPage').classList.contains('hidden');
      openGrammarTopicTheory('articles');
      const canOpenTheoryAgain = !document.getElementById('grammarLessonPage').classList.contains('hidden');
      startGrammarTopic('articles');
      const secondVisitStartsExercises = !document.getElementById('grammarExerciseArea').textContent.includes('Start øvelser');
      return { firstVisitShowsTheory, secondVisitStartsExercises, canOpenTheoryAgain };
    });

    expect(result).toEqual({ firstVisitShowsTheory: true, secondVisitStartsExercises: true, canOpenTheoryAgain: true });
  });

  test('opens the detailed lesson from the topic theory action and preserves indefinite article options', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      showPage('grammar');
      openGrammarTopicTheory('articles');
      const detailedTheoryVisible = document.getElementById('grammarLessonContent').textContent.includes('Vanlige ord på -ma');
      startGrammarLessonPractice('a0.articles.indefinite');
      return {
        detailedTheoryVisible,
        options: [...new Set(grammarExercises.filter(exercise => !exercise.isTransfer).flatMap(exercise => exercise.options))].sort(),
        wrongOptionForIndefinite: grammarExercises.some(exercise => exercise.skillId?.includes('indefinite') && exercise.options.includes('El'))
      };
    });

    expect(result.detailedTheoryVisible).toBe(true);
    expect(result.options).toEqual(['Un', 'Una', 'Unas', 'Unos']);
    expect(result.wrongOptionForIndefinite).toBe(false);
  });

  test('routes the adjective topic to a focused regular adjective lesson', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      showPage('grammar');
      startGrammarTopic('adjectives');
      const lessonText = document.getElementById('grammarLessonContent').textContent;
      const lessonVisible = !document.getElementById('grammarLessonPage').classList.contains('hidden');
      startGrammarLessonPractice('a1.adjectives.regular_o');
      return {
        lessonVisible,
        hasGoal: lessonText.includes('alto') && lessonText.includes('alta'),
        options: [...new Set(grammarExercises.filter(exercise => !String(exercise.id || '').includes('.transfer.')).flatMap(exercise => exercise.options))].sort(),
        hasOnlyFocusedSkill: grammarExercises.every(exercise => exercise.skillId === 'a1.adjectives.regular_o')
      };
    });

    expect(result).toEqual({
      lessonVisible: true,
      hasGoal: true,
      options: ['Alta', 'Altas', 'Alto', 'Altos'],
      hasOnlyFocusedSkill: true
    });
  });

  test('routes the adjective topic to a focused -e adjective lesson', async ({ page }) => {
    await page.goto(appUrl);
    const result = await page.evaluate(() => {
      localStorage.clear();
      showPage('grammar');
      startGrammarLessonPractice('a1.adjectives.common_gender');
      return {
        sourceSkills: [...new Set(grammarExercises.filter(exercise => !String(exercise.id || '').includes('.transfer.')).map(exercise => exercise.skillId))],
        transferCount: grammarExercises.filter(exercise => exercise.isTransfer).length,
        options: [...new Set(grammarExercises.flatMap(exercise => exercise.options))].sort()
      };
    });
    expect(result).toEqual({
      sourceSkills: ['a1.adjectives.common_gender'],
      transferCount: 5,
      options: ['Grande', 'Grandes', 'Inteligente', 'Inteligentes', 'Interesante', 'Interesantes']
    });
  });

  test('keeps ser, estar and hay lessons focused on separate skills', async ({ page }) => {
    await page.goto(appUrl);
    const result = await page.evaluate(() => {
      localStorage.clear();
      showPage('grammar');
      const lessons = ['a1.ser.identity', 'a1.estar.location', 'a1.hay_estar.contrast'].map(lessonId => {
        startGrammarLessonPractice(lessonId);
        return {
          lessonId,
          sourceSkills: [...new Set(grammarExercises.filter(exercise => !exercise.isTransfer).map(exercise => exercise.skillId))],
          transferCount: grammarExercises.filter(exercise => exercise.isTransfer).length,
          hasInvalidAnswer: grammarExercises.some(exercise => !exercise.options.some(option => String(option).toLocaleLowerCase() === String(exercise.answer).toLocaleLowerCase()))
        };
      });
      return lessons;
    });
    expect(result).toEqual([
      { lessonId: 'a1.ser.identity', sourceSkills: ['a1.ser.identity'], transferCount: 5, hasInvalidAnswer: false },
      { lessonId: 'a1.estar.location', sourceSkills: ['a1.estar.location'], transferCount: 5, hasInvalidAnswer: false },
      { lessonId: 'a1.hay_estar.contrast', sourceSkills: ['a1.hay_estar.contrast'], transferCount: 5, hasInvalidAnswer: false }
    ]);
  });

  test('shows published lessons in the grammar landing page and emphasizes Spanish terms in Norwegian text', async ({ page }) => {
    await page.goto(appUrl);
    const result = await page.evaluate(() => {
      localStorage.clear();
      showPage('grammar');
      const catalog = document.getElementById('grammarLessonCatalog');
      const lessonHtml = renderGrammarLesson(getGrammarLesson('a1.estar.location'));
      return {
        catalogButtons: catalog.querySelectorAll('button').length,
        hasEstarBold: lessonHtml.includes('<strong lang="es">estar</strong>'),
        doesNotBoldNorwegianEn: !lessonHtml.includes('<strong lang="es">en</strong>')
      };
    });
    expect(result).toEqual({ catalogButtons: 7, hasEstarBold: true, doesNotBoldNorwegianEn: true });
  });

  test('returns published lessons for answered skills and puts mistakes first', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => getRelevantGrammarLessons([
      { skillId: 'a0.articles.definite_plural', correct: true },
      { skillId: 'a0.articles.definite_singular', correct: false },
      { skillId: 'a0.articles.indefinite_singular', correct: false }
    ], [
      { id: 'definite', status: 'published', skillIds: ['a0.articles.definite_singular', 'a0.articles.definite_plural'], title: 'Bestemt' },
      { id: 'indefinite', status: 'published', skillIds: ['a0.articles.indefinite_singular'], title: 'Ubestemt' },
      { id: 'draft', status: 'draft', skillIds: ['a0.articles.definite_singular'], title: 'Utkast' }
    ]));

    expect(result.map(lesson => lesson.id)).toEqual(['definite', 'indefinite']);
  });

  test('does not recommend a lesson for unanswered skills or unpublished content', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => getRelevantGrammarLessons([
      { skillId: 'a0.articles.definite_singular', correct: false, answered: false },
      { skillId: 'a0.articles.definite_plural', correct: false, answered: true }
    ], [
      { id: 'draft', status: 'draft', skillIds: ['a0.articles.definite_singular'] },
      { id: 'reviewed', status: 'reviewed', skillIds: ['a0.articles.definite_plural'] }
    ]));

    expect(result).toEqual([]);
  });

  test('renders the published lesson from a result and returns without changing storage', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      grammarLessonCatalog.lessons[0].status = 'published';
      const before = JSON.stringify(localStorage);
      const opened = openGrammarLesson(grammarLessonCatalog.lessons[0].id, document.body);
      const visible = !document.getElementById('grammarLessonPage').classList.contains('hidden');
      const hasExamples = document.querySelectorAll('.grammar-lesson-example').length;
      returnFromGrammarLesson();
      return { opened, visible, hasExamples, storageChanged: before !== JSON.stringify(localStorage) };
    });

    expect(result).toEqual({ opened: true, visible: true, hasExamples: 4, storageChanged: false });
  });

  test('starts focused article practice with a transfer item without mutating the source bank', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      grammarLessonCatalog.lessons[0].status = 'published';
      showPage('grammar');
      const sourceOptions = JSON.stringify(grammarTopics.articles.exercises.map(exercise => exercise.options));
      const started = startGrammarLessonPractice(grammarLessonCatalog.lessons[0].id);
      return {
        started,
        grammarPageVisible: !document.getElementById('grammarPage').classList.contains('hidden'),
        exerciseVisible: !document.getElementById('grammarExercise').classList.contains('hidden'),
        count: grammarExercises.length,
        skills: [...new Set(grammarExercises.map(exercise => exercise.skillId))],
        hasTransfer: grammarExercises.some(exercise => exercise.isTransfer && exercise.sentence.includes('bicicletas')),
        transferCount: grammarLessonCatalog.lessons[0].transferExercises.length,
        exceptionCount: grammarLessonCatalog.lessons[0].transferExercises.filter(exercise => exercise.id.endsWith('.problema')).length,
        optionsAreFocused: grammarExercises.every(exercise => exercise.options.every(option => ['El', 'La', 'Los', 'Las'].includes(option))),
        sourceUnchanged: sourceOptions === JSON.stringify(grammarTopics.articles.exercises.map(exercise => exercise.options))
      };
    });

    expect(result).toEqual({
      started: true,
      grammarPageVisible: true,
      exerciseVisible: true,
      count: 14,
      skills: ['a0.articles.definite_singular', 'a0.articles.definite_plural'],
      hasTransfer: true,
      transferCount: 5,
      exceptionCount: 1,
      optionsAreFocused: true,
      sourceUnchanged: true
    });
  });

  test('finalizing a mixed quiz twice does not register it twice', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      practiceHistory = [];
      mixedQuizState = {
        index: 2,
        answered: 2,
        correct: 1,
        startedAt: new Date().toISOString(),
        quiz: { items: [{ questionId: 'q1' }, { questionId: 'q2' }] },
        results: []
      };
      finishMixedQuiz();
      const once = JSON.stringify({ history: practiceHistory, quiz: loadQuizStats() });
      finishMixedQuiz();
      return { unchanged: once === JSON.stringify({ history: practiceHistory, quiz: loadQuizStats() }), sessions: practiceHistory.reduce((sum, item) => sum + item.sessions, 0) };
    });

    expect(result).toEqual({ unchanged: true, sessions: 1 });
  });
});
