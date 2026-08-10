import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('teacher assignment packages', () => {
  test('imports assignment-v1 packages as active local homework and custom vocabulary', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      cards = [];
      activeAssignment = null;

      return importAssignmentPackage({
        schemaVersion: 'assignment-v1',
        assignmentTitle: 'Kapittel 9: fritid',
        teacherDisplayName: 'María Lærer',
        schoolDisplayName: 'Test ungdomsskole',
        dueDate: '2026-08-20',
        instructions: 'Øv på ordene minst to dager før fredag.',
        requiredPracticeDays: 2,
        vocabulary: [
          { norsk: 'å spille fotball', spansk: 'jugar al fútbol', category: 'Kapittel 9' },
          ['å lese', 'leer', 'Kapittel 9']
        ],
        verbFocuses: ['ar'],
        grammarTopics: ['gustar']
      });
    });

    expect(result).toEqual({
      imported: true,
      assignmentTitle: 'Kapittel 9: fritid',
      importedWords: 2,
      skippedWords: 0,
      message: 'Leksepakken "Kapittel 9: fritid" er importert'
    });

    const stored = await page.evaluate(() => ({
      assignment: activeAssignment,
      savedAssignment: JSON.parse(localStorage.getItem('spansk123_activeAssignment')),
      cards: cards.map(card => ({
        no: card.no,
        es: card.es,
        category: card.category,
        assignmentId: card.assignmentId,
        isCustom: card.isCustom
      }))
    }));

    expect(stored.assignment).toMatchObject({
      schemaVersion: 'assignment-v1',
      assignmentTitle: 'Kapittel 9: fritid',
      teacherDisplayName: 'María Lærer',
      schoolDisplayName: 'Test ungdomsskole',
      dueDate: '2026-08-20',
      instructions: 'Øv på ordene minst to dager før fredag.',
      requiredPracticeDays: 2,
      verbFocuses: ['ar'],
      grammarTopics: ['gustar']
    });
    expect(stored.savedAssignment).toEqual(stored.assignment);
    expect(stored.cards).toEqual([
      {
        no: 'å spille fotball',
        es: 'jugar al fútbol',
        category: 'kapittel-9',
        assignmentId: stored.assignment.id,
        isCustom: true
      },
      {
        no: 'å lese',
        es: 'leer',
        category: 'kapittel-9',
        assignmentId: stored.assignment.id,
        isCustom: true
      }
    ]);
  });

  test('keeps existing built-in vocabulary available for assignment practice', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      studentName = '9A-14';
      showMainApp();
      const existingCard = cards.find(card => card.no === '1' && card.es === 'uno');
      const imported = importAssignmentPackage({
        schemaVersion: 'assignment-v1',
        assignmentTitle: 'Uke 35: tall',
        vocabulary: [{ norsk: existingCard.no, spansk: existingCard.es, category: existingCard.category }],
        minuteTargets: { vocabulary: 10 }
      });
      const resolved = resolveAssignmentVocabularyCards(activeAssignment).map(card => card.id);
      return {
        imported,
        assignment: { importedWords: activeAssignment.importedWords, skippedWords: activeAssignment.skippedWords, vocabularyCount: activeAssignment.vocabularyCount },
        resolved
      };
    });

    expect(result.imported).toMatchObject({ importedWords: 0, skippedWords: 1 });
    expect(result.assignment).toEqual({ importedWords: 0, skippedWords: 1, vocabularyCount: 1 });
    expect(result.resolved).toHaveLength(1);

    await page.evaluate(() => {
      showPage('homework');
      startActiveAssignmentVocabulary();
    });
    await expect(page.getByRole('button', { name: /Avslutt/ }).first()).toBeVisible();
    await expect(page.locator('#vocabStudy')).toBeVisible();
  });

  test('resolves mixed existing and new assignment words without duplicates', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      studentName = '9A-14';
      showMainApp();
      const existing = cards.find(card => card.no === 'hei' && card.es === 'hola');
      const imported = importAssignmentPackage({
        schemaVersion: 'assignment-v1',
        assignmentTitle: 'Uke 36: hilsener',
        vocabulary: [
          { norsk: existing.no, spansk: existing.es, category: existing.category },
          { norsk: 'god morgen', spansk: 'buenos días', category: existing.category }
        ],
        minuteTargets: { vocabulary: 10 }
      });
      const resolved = resolveAssignmentVocabularyCards(activeAssignment);
      return {
        imported,
        resolved: resolved.map(card => ({ no: card.no, es: card.es, assignmentId: card.assignmentId || null })),
        pairCount: new Set(resolved.map(card => `${card.no}::${card.es}`)).size
      };
    });

    expect(result.imported).toMatchObject({ importedWords: 1, skippedWords: 1 });
    expect(result.resolved).toHaveLength(2);
    expect(result.pairCount).toBe(2);
    expect(result.resolved.find(card => card.no === 'god morgen').assignmentId).toBeTruthy();
  });

  test('keeps assignment practice available after re-import without adding duplicates', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      studentName = '9A-14';
      showMainApp();
      const packageData = {
        schemaVersion: 'assignment-v1',
        id: 'assignment-reimport',
        assignmentTitle: 'Uke 37: hilsener',
        vocabulary: [
          { norsk: 'hei', spansk: 'hola', category: 'hilsener' },
          { norsk: 'god morgen', spansk: 'buenos días', category: 'hilsener' }
        ],
        minuteTargets: { vocabulary: 10 }
      };
      const first = importAssignmentPackage(packageData);
      const second = importAssignmentPackage(packageData);
      const resolved = resolveAssignmentVocabularyCards(activeAssignment);
      return {
        first,
        second,
        resolved: resolved.map(card => `${card.no}::${card.es}`),
        matchingCards: cards.filter(card => card.category === 'hilsener' && ['hei', 'god morgen'].includes(card.no)).length
      };
    });

    expect(result.first).toMatchObject({ importedWords: 1, skippedWords: 1 });
    expect(result.second).toMatchObject({ importedWords: 0, skippedWords: 2 });
    expect(result.resolved).toEqual(['hei::hola', 'god morgen::buenos días']);
    expect(result.matchingCards).toBe(2);
  });

  test('imports assignment packages from the homework file input', async ({ page }) => {
    await page.goto(appUrl);

    await page.fill('#studentNameInput', '9A-14');
    await page.click('button:has-text("Start")');
    await page.click('#navHomework');

    const assignmentJson = JSON.stringify({
      schemaVersion: 'assignment-v1',
      assignmentTitle: 'Uke 34: skole',
      dueDate: '2026-08-21',
      requiredPracticeDays: 3,
      vocabulary: [
        { norsk: 'skole', spansk: 'escuela', category: 'Uke 34' }
      ]
    });

    await page.setInputFiles('#assignmentFileInput', {
      name: 'uke-34-lekse.json',
      mimeType: 'application/json',
      buffer: Buffer.from(assignmentJson)
    });

    await expect(page.locator('#activeAssignmentPanel')).toContainText('Uke 34: skole');
    await expect(page.locator('#activeAssignmentPanel')).toContainText('1 gloser');
    await expect(page.locator('#homeworkSummary')).toContainText('3 påkrevd');
  });

  test('builds a printable weekly report for the active assignment', async ({ page }) => {
    await page.goto(appUrl);

    const report = await page.evaluate(() => {
      studentName = '9A-14';
      activeAssignment = {
        id: 'assignment-test',
        assignmentTitle: 'Uke 34: skole',
        teacherDisplayName: 'María Lærer',
        dueDate: '2026-08-21',
        instructions: 'Øv tre dager.',
        requiredPracticeDays: 2,
        importedWords: 4,
        skippedWords: 0,
        verbFocuses: ['ar'],
        grammarTopics: ['gustar']
      };
      practiceHistory = [
        { date: '2026-08-03', words: 10, correct: 8, sessions: 1 },
        { date: '2026-08-05', words: 12, correct: 9, sessions: 2 },
        { date: '2026-08-06', words: 8, correct: 7, sessions: 1 }
      ];

      return buildWeeklyReportData([
        { name: 'Man', dateStr: '2026-08-03', practiced: true },
        { name: 'Tir', dateStr: '2026-08-04', practiced: false },
        { name: 'Ons', dateStr: '2026-08-05', practiced: true },
        { name: 'Tor', dateStr: '2026-08-06', practiced: true },
        { name: 'Fre', dateStr: '2026-08-07', practiced: false },
        { name: 'Lør', dateStr: '2026-08-08', practiced: false },
        { name: 'Søn', dateStr: '2026-08-09', practiced: false }
      ]);
    });

    expect(report).toMatchObject({
      studentName: '9A-14',
      weekRange: '3.8.2026-9.8.2026',
      practiceDayCount: 3,
      requiredDays: 2,
      totalWords: 30,
      totalSessions: 4,
      accuracy: 80,
      activeAssignment: {
        title: 'Uke 34: skole',
        teacher: 'María Lærer',
        dueDate: '2026-08-21',
        importedWords: 4
      }
    });
    expect(report.practiceDays).toEqual(['Man', 'Ons', 'Tor']);
  });

  test('keeps the active assignment in full progress export and import', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      studentName = '9A-14';
      activeAssignment = {
        id: 'assignment-test',
        schemaVersion: 'assignment-v1',
        assignmentTitle: 'Uke 34: skole',
        requiredPracticeDays: 2,
        importedWords: 3
      };
      saveActiveAssignment();

      const exported = buildProgressExportData();
      activeAssignment = null;
      localStorage.removeItem('spansk123_activeAssignment');
      const imported = importProgressData(exported);

      return {
        exportedAssignment: exported.activeAssignment,
        imported,
        activeAssignment,
        storedAssignment: JSON.parse(localStorage.getItem('spansk123_activeAssignment'))
      };
    });

    expect(result.exportedAssignment).toMatchObject({
      id: 'assignment-test',
      assignmentTitle: 'Uke 34: skole'
    });
    expect(result.imported).toMatchObject({
      imported: true,
      format: 'spansk123_export_v1'
    });
    expect(result.activeAssignment).toEqual(result.exportedAssignment);
    expect(result.storedAssignment).toEqual(result.exportedAssignment);
  });

  test('builds assignment-v1 packages from teacher builder selections', async ({ page }) => {
    await page.goto(appUrl);

    const assignment = await page.evaluate(() => {
      localStorage.clear();
      cards = [
        { no: 'skole', es: 'la escuela', norsk: 'skole', spansk: 'la escuela', category: 'skole' },
        { no: 'bok', es: 'el libro', norsk: 'bok', spansk: 'el libro', category: 'skole' },
        { no: 'mor', es: 'la madre', norsk: 'mor', spansk: 'la madre', category: 'familie' }
      ];

      return buildTeacherAssignmentPackage({
        assignmentTitle: 'Uke 34: skole',
        teacherDisplayName: 'María Lærer',
        schoolDisplayName: 'Test ungdomsskole',
        dueDate: '2026-08-21',
        instructions: 'Øv før fredag.',
        requiredPracticeDays: 2,
        vocabularyCategories: ['skole'],
        verbFocuses: ['ar'],
        grammarTopics: ['gustar'],
        minuteTargets: { vocabulary: 12, verbs: 8, grammar: 5 }
      });
    });

    expect(assignment).toMatchObject({
      schemaVersion: 'assignment-v1',
      assignmentTitle: 'Uke 34: skole',
      teacherDisplayName: 'María Lærer',
      schoolDisplayName: 'Test ungdomsskole',
      dueDate: '2026-08-21',
      instructions: 'Øv før fredag.',
      requiredPracticeDays: 2,
      verbFocuses: ['ar'],
      grammarTopics: ['gustar'],
      minuteTargets: { vocabulary: 12, verbs: 8, grammar: 5 }
    });
    expect(assignment.vocabulary).toEqual([
      { norsk: 'skole', spansk: 'la escuela', category: 'skole' },
      { norsk: 'bok', spansk: 'el libro', category: 'skole' }
    ]);
  });

  test('shows active assignment minute progress for students', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      studentName = '9A-14';
      showMainApp();
      activeAssignment = {
        id: 'assignment-test',
        schemaVersion: 'assignment-v1',
        assignmentTitle: 'Uke 34: skole',
        requiredPracticeDays: 2,
        importedWords: 4,
        minuteTargets: { vocabulary: 10, verbs: 5, grammar: 5 }
      };
      practiceHistory = [
        { date: new Date().toISOString().split('T')[0], words: 20, correct: 15, sessions: 1, activity: 'vocabulary', minutes: 6 },
        { date: new Date().toISOString().split('T')[0], words: 8, correct: 6, sessions: 1, activity: 'verbs', minutes: 5 }
      ];
      showPage('homework');
    });

    await expect(page.locator('#activeAssignmentPanel')).toContainText('Tidsmål');
    await expect(page.locator('#activeAssignmentPanel')).toContainText('Gloser: 6 av 10 min');
    await expect(page.locator('#activeAssignmentPanel')).toContainText('Verb: 5 av 5 min');
    await expect(page.locator('#activeAssignmentPanel')).toContainText('Grammatikk: 0 av 5 min');
  });

  test('teacher can create and download an assignment package from the homework page', async ({ page }) => {
    await page.goto(appUrl);
    await page.fill('#studentNameInput', 'Lærer');
    await page.click('button:has-text("Start")');
    await page.click('#navHomework');

    await expect(page.getByRole('heading', { name: 'Lag leksepakke' })).toBeVisible();
    await expect(page.getByText('For lærer')).toBeVisible();
    await expect(page.locator('[data-builder-vocab-category]')).not.toHaveCount(0);
    await page.locator('#assignmentBuilder > summary').click();
    await expect(page.locator('#builderAssignmentTitle')).toBeVisible();
    await page.fill('#builderAssignmentTitle', 'Uke 35: familie');
    await page.fill('#builderTeacherName', 'María Lærer');
    await page.fill('#builderVocabMinutes', '12');
    await page.fill('#builderVerbMinutes', '7');
    await page.fill('#builderGrammarMinutes', '5');
    await page.getByLabel(/Familie \(/).check();
    await page.locator('#builderGrammarTopics').getByLabel('❤️ Gustar').check();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Last ned leksepakke' }).click();
    await expect(page.locator('#assignmentBuilderStatus')).toContainText('hoppes over');
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const assignment = JSON.parse(Buffer.concat(chunks).toString('utf8'));

    expect(download.suggestedFilename()).toBe('uke-35-familie.json');
    expect(assignment).toMatchObject({
      schemaVersion: 'assignment-v1',
      assignmentTitle: 'Uke 35: familie',
      teacherDisplayName: 'María Lærer',
      verbFocuses: ['ar'],
      grammarTopics: ['gustar'],
      minuteTargets: { vocabulary: 12, verbs: 7, grammar: 5 }
    });
    expect(assignment.vocabulary.length).toBeGreaterThan(0);
    expect(assignment.vocabulary.every(word => word.category === 'familie')).toBe(true);
  });

  test('teacher builder requires content for selected minute targets', async ({ page }) => {
    await page.goto(appUrl);
    await page.fill('#studentNameInput', 'Lærer');
    await page.click('button:has-text("Start")');
    await page.click('#navHomework');

    await expect(page.getByRole('heading', { name: 'Lag leksepakke' })).toBeVisible();
    await page.locator('#assignmentBuilder > summary').click();
    await page.fill('#builderVocabMinutes', '10');
    await page.fill('#builderVerbMinutes', '0');
    await page.fill('#builderGrammarMinutes', '0');

    await page.getByRole('button', { name: 'Last ned leksepakke' }).click();
    await expect(page.locator('#assignmentBuilderStatus')).toContainText('Velg minst én glosekategori, eller sett minutter gloser til 0');
  });

  test('student can start assigned practice from the homework page', async ({ page }) => {
    await page.goto(appUrl);
    page.on('dialog', dialog => dialog.accept());

    await page.evaluate(() => {
      localStorage.clear();
      studentName = '9A-14';
      showMainApp();
      cards = [];
      importAssignmentPackage({
        schemaVersion: 'assignment-v1',
        assignmentTitle: 'Uke 35: familie',
        requiredPracticeDays: 2,
        vocabulary: [
          { norsk: 'mor', spansk: 'la madre', category: 'Uke 35' },
          { norsk: 'far', spansk: 'el padre', category: 'Uke 35' }
        ],
        verbFocuses: ['ar'],
        grammarTopics: ['gustar'],
        minuteTargets: { vocabulary: 10, verbs: 5, grammar: 5 }
      });
      showPage('homework');
    });

    await page.getByRole('button', { name: 'Start gloser' }).click();
    await expect(page.locator('#vocabStudy')).toBeVisible();

    await page.evaluate(() => showPage('homework'));
    await page.getByRole('button', { name: 'Start verb' }).click();
    await expect(page.locator('#verbExercise')).toBeVisible();
    await expect(page.locator('#verbExercise')).toContainText('Leksemål: øv verb i minst 5 min');

    await page.evaluate(() => showPage('homework'));
    await page.getByRole('button', { name: 'Start grammatikk' }).click();
    await expect(page.locator('#grammarExercise')).toBeVisible();
    await expect(page.locator('#grammarExercise')).toContainText('Leksemål: øv grammatikk i minst 5 min');
  });

  test('homework page does not assume fixed Spanish weekdays and surfaces teacher builder', async ({ page }) => {
    await page.goto(appUrl);
    await page.fill('#studentNameInput', 'Lærer');
    await page.click('button:has-text("Start")');
    await page.click('#navHomework');

    await expect(page.locator('#homeworkPage')).not.toContainText('mandag/tirsdag');
    await expect(page.locator('#homeworkPage')).not.toContainText('Mandag og tirsdag');
    await expect(page.getByRole('heading', { name: 'Lag leksepakke' })).toBeVisible();
    await expect(page.getByText('For lærer')).toBeVisible();
    await page.locator('#assignmentBuilder > summary').click();
    await expect(page.locator('#builderAssignmentTitle')).toBeVisible();

    const countedDays = await page.evaluate(() => {
      const days = getWeekDays();
      return days.length;
    });
    expect(countedDays).toBe(7);
  });
});
