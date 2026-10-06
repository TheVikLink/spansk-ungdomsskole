import { test, expect } from '@playwright/test';
import { startStaticAppServer } from './helpers/static-app-server.js';

let server;
test.beforeAll(async () => { server = await startStaticAppServer(); });
test.afterAll(async () => server.close());

async function enter(page, area = 'homework') {
  await page.goto(server.url);
  await page.evaluate(area => { studentName = 'Lokal test'; showMainApp(); showPage(area); }, area);
}

async function openBuilder(page) {
  await enter(page);
  await page.locator('#assignmentBuilder > summary').click();
}

async function downloadPackage(page) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Last ned leksepakke', exact: true }).click();
  const download = await pending;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

test('builder starts with explicit empty choices and keeps teacher choices when reopened', async ({ page }) => {
  await openBuilder(page);
  await expect(page.locator('#assignmentBuilder input[type=checkbox]:checked')).toHaveCount(0);
  for (const id of ['Vocab', 'Verb', 'Grammar']) await expect(page.locator(`#builder${id}Minutes`)).toHaveValue('0');
  await page.getByLabel(/Hilsener \(/).check();
  await page.locator('#builderVocabMinutes').fill('12');
  await page.evaluate(() => { showPage('home'); showPage('homework'); });
  await expect(page.getByLabel(/Hilsener \(/)).toBeChecked();
  await expect(page.locator('#builderVocabMinutes')).toHaveValue('12');
});

for (const areas of [['vocabulary'], ['verbs'], ['grammar'], ['vocabulary', 'verbs', 'grammar']]) {
  test(`builder exports and pupil imports ${areas.join('+')} with zero or explicit targets`, async ({ page, browser }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openBuilder(page);
    if (areas.includes('vocabulary')) await page.getByLabel(/Hilsener \(/).check();
    if (areas.includes('verbs')) await page.getByLabel('Vanlige -ar-verb', { exact: true }).check();
    if (areas.includes('grammar')) await page.locator('#builderGrammarTopics').getByLabel('❤️ Gustar').check();
    // Selected content with no time requirement remains valid, including all three areas.
    const assignment = await downloadPackage(page);
    expect(assignment.minuteTargets).toEqual({ vocabulary: 0, verbs: 0, grammar: 0 });
    expect(assignment.vocabulary.length > 0).toBe(areas.includes('vocabulary'));
    expect(assignment.verbFocuses).toEqual(areas.includes('verbs') ? ['ar'] : []);
    expect(assignment.grammarTopics).toEqual(areas.includes('grammar') ? ['gustar'] : []);
    const instructions = await page.locator('#assignmentPupilInstructions').inputValue();
    expect(instructions).toContain('https://www.spansk123.no');
    expect(instructions).toContain('Hent leksepakke fra lærer');
    expect(instructions).toContain('Flere områder');
    for (const [area, action] of [['vocabulary', 'Start gloser'], ['verbs', 'Start verb'], ['grammar', 'Start grammatikk']]) {
      expect(instructions.includes(action)).toBe(areas.includes(area));
    }
    const pupilContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pupil = await pupilContext.newPage();
    await pupil.goto(server.url);
    await pupil.locator('#studentNameInput').fill('Lokal elev');
    await pupil.locator('.login-btn-primary').click();
    if (!await pupil.locator('#navHomework').isVisible()) await pupil.locator('.nav-more > summary').click();
    await pupil.locator('#navHomework').click();
    await pupil.locator('#assignmentFileInput').setInputFiles({ name: 'lekse.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(assignment)) });
    await expect(pupil.locator('#assignmentImportStatus')).toContainText('importert');
    expect(await pupil.evaluate(() => activeAssignment.schemaVersion)).toBe('assignment-v1');
    for (const [area, action] of [['vocabulary', 'Start gloser'], ['verbs', 'Start verb'], ['grammar', 'Start grammatikk']]) {
      if (areas.includes(area)) await expect(pupil.locator('#activeAssignmentPanel').getByRole('button', { name: action, exact: true })).toBeVisible();
    }
    await pupilContext.close();
    await page.locator('#assignmentPupilHandoff').screenshot({ path: `output/small-improvements/handoff-${areas.join('-')}-390.png` });
  });
}

test('builder announces section errors and focuses the missing choice without rewriting targets', async ({ page }) => {
  await openBuilder(page);
  await page.locator('#builderVocabMinutes').fill('10');
  await page.locator('#builderGrammarMinutes').fill('5');
  await page.getByRole('button', { name: 'Last ned leksepakke', exact: true }).click();
  await expect(page.locator('#builderVocabError')).toContainText('Velg minst én glosekategori');
  await expect(page.locator('#builderGrammarError')).toContainText('Velg minst én grammatikkoppgave');
  await expect(page.locator('[data-builder-vocab-category]').first()).toBeFocused();
  await expect(page.locator('#assignmentBuilderStatus')).toHaveAttribute('role', 'status');
  await expect(page.locator('#builderVocabMinutes')).toHaveValue('10');
  await page.locator('#builderVocabMinutes').fill('0');
  await page.locator('#builderGrammarMinutes').fill('0');
  await page.getByRole('button', { name: 'Last ned leksepakke', exact: true }).click();
  await expect(page.locator('#assignmentBuilderStatus')).toContainText('Velg minst én');
});

for (const width of [390, 1280]) {
  test(`listening replays without losing answers and stops on navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await enter(page, 'dictation');
    await page.evaluate(() => startListeningStory('carmen-madrid-a0'));
    await page.locator('#listeningStoryAudio').evaluate(audio => audio.play());
    await page.locator('#listeningStoryStartBtn').click();
    const player = page.locator('#listeningQuestionAudio');
    await expect(player).toBeVisible();
    await expect(player).toHaveAttribute('controls', '');
    await expect(page.locator('#listeningStoryTextSupport')).toHaveCount(0);
    await page.locator('input[name=listeningStoryAnswer]').first().check();
    const selection = await page.evaluate(() => listeningState.selectedOptionId);
    await player.evaluate(audio => audio.play());
    await expect.poll(() => player.evaluate(audio => audio.currentTime)).toBeGreaterThan(0);
    expect(await page.evaluate(() => listeningState.selectedOptionId)).toBe(selection);
    await page.locator('#listeningStoryCheckBtn').click();
    const answer = await page.evaluate(() => ({ answers: [...listeningState.answers], submitted: listeningState.submitted }));
    await player.evaluate(audio => { audio.currentTime = 0; return audio.play(); });
    expect(await page.evaluate(() => ({ answers: [...listeningState.answers], submitted: listeningState.submitted }))).toEqual(answer);
    await page.evaluate(() => window.auditPreviousAudio = document.getElementById('listeningQuestionAudio'));
    await page.locator('#listeningStoryCheckBtn').click();
    expect(await page.evaluate(() => window.auditPreviousAudio.paused)).toBe(true);
    await expect(page.locator('#listeningStoryTextSupport')).toHaveCount(0);
    await page.screenshot({ path: `output/small-improvements/listening-question-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#listeningQuestionAudio').evaluate(audio => audio.play());
    await page.evaluate(() => window.auditPreviousAudio = document.getElementById('listeningQuestionAudio'));
    await page.getByRole('button', { name: '✕ Avslutt', exact: true }).click();
    expect(await page.evaluate(() => window.auditPreviousAudio.paused)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('question-phase unavailable audio announces failure without resetting a submitted answer', async ({ page, context }) => {
  await enter(page, 'dictation');
  await page.evaluate(() => startListeningStory('carmen-madrid-a0'));
  await page.locator('#listeningStoryAudio').evaluate(audio => audio.play());
  await page.locator('#listeningStoryStartBtn').click();
  await page.locator('input[name=listeningStoryAnswer]').first().check();
  await page.locator('#listeningStoryCheckBtn').click();
  const before = await page.evaluate(() => JSON.stringify(listeningState.answers));
  await context.setOffline(true);
  await page.locator('#listeningQuestionAudio').evaluate(audio => { audio.src += '?uncached-test'; audio.load(); });
  await expect(page.locator('#listeningQuestionAudioError')).toBeVisible();
  await expect(page.locator('#listeningQuestionAudioStatus')).toContainText('ikke tilgjengelig');
  expect(await page.evaluate(() => JSON.stringify(listeningState.answers))).toBe(before);
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Prøv lyden igjen', exact: true }).click();
  await expect(page.locator('#listeningQuestionAudioError')).toBeHidden();
  await expect.poll(() => page.locator('#listeningQuestionAudio').evaluate(audio => audio.readyState)).toBeGreaterThan(0);
  await page.locator('#listeningQuestionAudio').evaluate(audio => audio.play());
  expect(await page.evaluate(() => JSON.stringify(listeningState.answers))).toBe(before);
});

for (const width of [390, 1280]) {
  test(`grammar introduction and bottom actions start identical focused practice at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await enter(page, 'grammar');
    await page.evaluate(() => openGrammarTopicTheory('articles'));
    const actions = page.locator('#grammarLessonContent .grammar-lesson-actions button');
    await expect(actions).toHaveCount(2);
    const first = await actions.first().boundingBox();
    const theory = await page.locator('.grammar-lesson-section').first().boundingBox();
    expect(first.y + first.height).toBeLessThan(theory.y);
    await actions.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `output/small-improvements/grammar-introduction-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await actions.first().focus();
    await page.keyboard.press('Enter');
    const topSkills = await page.evaluate(() => [...new Set(grammarExercises.map(item => item.skillId))].sort());
    expect(topSkills).toEqual(['a0.articles.definite_plural', 'a0.articles.definite_singular']);
    await page.evaluate(() => { abandonActiveSession(); showPage('grammar'); openGrammarTopicTheory('articles'); });
    await actions.last().click();
    expect(await page.evaluate(() => [...new Set(grammarExercises.map(item => item.skillId))].sort())).toEqual(topSkills);
    await page.evaluate(() => { abandonActiveSession(); showPage('grammar'); openGrammarTopicTheory('articles'); });
    await page.getByRole('button', { name: '← Tilbake til grammatikk', exact: true }).click();
    await expect(page.locator('#grammarPage')).toBeVisible();
  });
}

test('all pronoun meanings support three tenses without changing conjugation or grading', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page, 'verbs');
  const spanish = ['yo', 'tú', 'él/ella', 'nosotros', 'vosotros', 'ellos'];
  const norwegian = ['jeg', 'du', 'han/hun', 'vi', 'dere', 'de'];
  const answers = {
    presente: ['hablo', 'hablas', 'habla', 'hablamos', 'habláis', 'hablan'],
    futuro: ['voy a hablar', 'vas a hablar', 'va a hablar', 'vamos a hablar', 'vais a hablar', 'van a hablar'],
    perfecto: ['he hablado', 'has hablado', 'ha hablado', 'hemos hablado', 'habéis hablado', 'han hablado']
  };
  for (const [tense, forms] of Object.entries(answers)) {
    for (let index = 0; index < 6; index++) {
      await page.evaluate(({ tense, index }) => {
        selectedVerbs.clear(); selectedVerbs.add('hablar');
        startVerbSession({ exercises: [{ verb: verbDatabase.hablar, pronounIndex: index, tense }] });
      }, { tense, index });
      await expect(page.locator('#verbPronounMeaning')).toHaveText(`${spanish[index]} = ${norwegian[index]}`);
      await expect(page.locator('#verbInput')).toHaveAttribute('data-expected', forms[index]);
      await expect(page.locator('#verbInput')).toBeFocused();
      await page.locator('#verbInput').fill(forms[index]);
      await page.keyboard.press('Enter');
      await expect(page.locator('#verbFeedback')).toContainText('Riktig');
      await page.evaluate(() => abandonActiveSession());
    }
  }
});

test.describe('truthful next review dates', () => {
  test.use({ timezoneId: 'Europe/Oslo' });
  for (const [name, now, review, available] of [
    ['after midnight', '2026-10-06T10:00:00Z', '2026-10-07T12:00:00+02:00', '8. oktober 2026'],
    ['exact midnight', '2026-10-06T10:00:00Z', '2026-10-07T00:00:00+02:00', '7. oktober 2026'],
    ['spring DST', '2026-03-28T11:00:00Z', '2026-03-29T01:30:00+01:00', '30. mars 2026'],
    ['autumn DST', '2026-10-24T10:00:00Z', '2026-10-25T12:00:00+01:00', '26. oktober 2026']
  ]) {
    test(`Start shows actual availability at ${name}, preserving imported progress`, async ({ page }) => {
      await page.clock.setFixedTime(new Date(now));
      await enter(page, 'home');
      const before = await page.evaluate(review => {
        cards[0].noEs = { ...cards[0].noEs, repetitions: 2, nextReview: review };
        cards[0].esNo = { ...cards[0].esNo, repetitions: 1, nextReview: '2999-01-01T00:00:00Z' };
        cards[0].reviews = 3;
        saveData();
        const backup = buildProgressExportData();
        importProgressData(backup); loadData();
        renderHomePage();
        return JSON.stringify(cards);
      }, review);
      await expect(page.locator('#homeVocabularyReviewGuidance')).toContainText(`Neste repetisjon: ${available}`);
      await expect(page.getByRole('button', { name: 'Start repetisjon', exact: true })).toBeDisabled();
      expect(await page.evaluate(() => JSON.stringify(cards))).toBe(before);
      // The displayed calendar day really does put the word in the existing due queue.
      const eligibleAt = await page.evaluate(() => getNextVocabularyReviewDate(cards).toISOString());
      await page.clock.setFixedTime(new Date(new Date(eligibleAt).getTime() - 1));
      expect(await page.evaluate(() => getDueCards(cards).length)).toBe(0);
      await page.clock.setFixedTime(new Date(eligibleAt));
      await page.evaluate(() => renderHomePage());
      await expect(page.locator('#homeVocabularyReviewCount')).toHaveText('1 ord klart for repetisjon');
      await expect(page.locator('#homeVocabularyReviewGuidance')).not.toContainText('Neste repetisjon');
    });
  }
  test('fresh, error-only and malformed review dates get honest distinct guidance', async ({ page }) => {
    await enter(page, 'home');
    await expect(page.locator('#homeVocabularyReviewGuidance')).toContainText('Øv på nye ord');
    await page.evaluate(() => { cards[0].noEs.lapses = 1; cards[0].reviews = 1; renderHomePage(); });
    await expect(page.locator('#homeVocabularyReviewGuidance')).toContainText('Du har begynt å øve');
    await page.evaluate(() => { cards[0].noEs.repetitions = 1; cards[0].noEs.nextReview = 'invalid-date'; renderHomePage(); });
    await expect(page.locator('#homeVocabularyReviewGuidance')).not.toContainText('Invalid');
    expect(await page.evaluate(() => getNextVocabularyReviewDate(cards))).toBeNull();
  });
});

test('teacher handoff copies only on request and keeps selectable text if clipboard is denied', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openBuilder(page);
  await page.getByLabel(/Hilsener \(/).check();
  await downloadPackage(page);
  await expect(page.locator('#assignmentPupilInstructions')).toHaveAttribute('readonly', '');
  await page.getByRole('button', { name: 'Kopier elevinstruksen', exact: true }).click();
  const text = await page.locator('#assignmentPupilInstructions').inputValue();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text);
  await expect(page.locator('#assignmentInstructionsStatus')).toContainText('kopiert');
  // Clipboard is a browser boundary, not app logic. Denial must leave a manual copy path.
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } }));
  await page.getByRole('button', { name: 'Kopier elevinstruksen', exact: true }).click();
  await expect(page.locator('#assignmentInstructionsStatus')).toContainText('kopier den manuelt');
  await expect(page.locator('#assignmentPupilInstructions')).toBeFocused();
  expect(await page.locator('#assignmentPupilInstructions').evaluate(input => input.selectionEnd - input.selectionStart)).toBe(text.length);
});

for (const kind of ['existing', 'new', 'mixed']) {
  test(`homework import explains ${kind} words and repeated imports preserve progress`, async ({ page }) => {
    await enter(page);
    const { assignment, before, count } = await page.evaluate(kind => {
      const existing = cards.find(card => card.no === 'hei' && card.es === 'hola');
      existing.noEs = { ...existing.noEs, repetitions: 3, nextReview: '2030-01-01T00:00:00Z' };
      existing.reviews = 5; existing.correct = 4; saveData();
      const existingRow = { norsk: existing.no, spansk: existing.es, category: existing.category };
      const newRow = { norsk: 'egen testfrase', spansk: 'frase de prueba', category: 'test-lokal' };
      const vocabulary = kind === 'existing' ? [existingRow] : kind === 'new' ? [newRow] : [existingRow, newRow];
      return {
        assignment: { schemaVersion: 'assignment-v1', id: 'local-import-test', assignmentTitle: 'Lokal prøve', vocabulary },
        before: JSON.stringify(existing), count: cards.length
      };
    }, kind);
    const upload = () => page.locator('#assignmentFileInput').setInputFiles({ name: 'lekse.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(assignment)) });
    await upload();
    const status = page.locator('#assignmentImportStatus');
    await expect(status).toContainText(kind === 'mixed' ? '2 gloser i leksepakken er klare' : '1 glose i leksepakken er klar');
    if (kind !== 'new') await expect(status).toContainText('finnes allerede i ordlisten');
    if (kind !== 'existing') await expect(status).toContainText('1 ny glose lagt til');
    await expect(status).not.toContainText('0 gloser lagt til');
    await upload();
    await expect(status).toContainText('finnes allerede i ordlisten');
    const after = await page.evaluate(() => ({ existing: JSON.stringify(cards.find(card => card.no === 'hei' && card.es === 'hola')), count: cards.length, resolved: resolveAssignmentVocabularyCards().length }));
    expect(after.existing).toBe(before);
    expect(after.count).toBe(count + (kind === 'existing' ? 0 : 1));
    expect(after.resolved).toBe(kind === 'mixed' ? 2 : 1);
  });
}
