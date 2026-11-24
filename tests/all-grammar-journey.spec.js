import { expect, test } from '@playwright/test';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { startSchoolFixture } from './helpers/school-server.js';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const appUrl = pathToFileURL(path.resolve('index.html')).href;

async function finishSession(page, bank) {
  const area = page.locator('#grammarExerciseArea');
  const counter = page.locator('#grammarCounter');
  await expect(counter).toHaveText(/^1 \/ \d+$/);
  const count = Number((await counter.innerText()).split(' / ')[1]);
  expect(count).toBeGreaterThan(0);
  const answered = new Set();
  for (let i = 1; i <= count; i++) {
    await expect(counter).toHaveText(`${i} / ${count}`);
    const sentence = (await area.locator('.grammar-sentence').innerText()).replace('______', '___');
    const context = (await area.locator('.grammar-norwegian-context').textContent()).replace(/^Betydning/, '');
    const item = bank.find(ex => ex.sentence === sentence && ex.no === context);
    expect(item, `Ukjent oppgave: ${sentence} (${context})`).toBeDefined();

    const typed = area.getByLabel('Skriv svaret');
    const select = area.getByLabel('Velg svar');
    if (await typed.isVisible()) {
      await typed.fill(item.answer);
      await typed.press('Enter');
    } else if (await select.isVisible()) {
      const value = (await select.locator('option').allTextContents()).find(opt => opt.toLowerCase() === item.answer.toLowerCase());
      expect(value, item.sentence).toBeDefined();
      await select.selectOption({ label: value });
      await area.getByRole('button', { name: 'Sjekk svar' }).click();
    } else {
      await area.getByRole('button', { name: new RegExp(`^${item.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).click();
    }
    await expect(area.locator('#grammarFeedback')).toContainText('✓ Riktig!');
    answered.add(item.sentence + '\n' + item.no);
    await area.getByRole('button', { name: 'Neste' }).click();
  }
  await expect(area.getByRole('heading', { name: /øving fullført/ })).toBeVisible();
  await expect(page.locator('#grammarSessionStats')).toHaveText(`${count} / ${count} riktig`);
  await area.getByRole('button', { name: /Velg tema/ }).click();
  return answered;
}

test('elev fullfører alle grammatikkleksjoner og mestrer hvert tema over flere økter', async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto(appUrl);
  await page.getByLabel('Fornavn eller elevkode').fill('Grammatikkreisen');
  await page.locator('#welcomeForm').getByRole('button', { name: /Start/ }).click();
  const openGrammar = async () => {
    const grammar = page.locator('#navGrammar');
    if (!(await grammar.isVisible())) await page.locator('.nav-more summary').click();
    await grammar.click();
  };
  await openGrammar();

  // The banks describe expected coverage and answers. All progress comes from the UI.
  const { lessons, topics } = await page.evaluate(() => ({
    lessons: grammarLessonCatalog.lessons.filter(lesson => lesson.status === 'published'),
    topics: Object.values(grammarTopics).map(topic => ({
      id: topic.id, name: topic.name, exercises: topic.exercises,
      skills: [...new Set(topic.exercises.map(ex => getGrammarExerciseSkillId(topic.id, ex)))]
    }))
  }));
  expect(topics.length).toBeGreaterThan(0);
  expect(lessons.length).toBeGreaterThan(0);
  const seen = new Set();
  const cards = page.locator('#grammarTopicGrid .grammar-topic-card');
  await expect(cards.locator('.grammar-topic-stats')).toHaveText(topics.map(() => 'Ikke startet'));
  const lessonLinks = page.locator('#grammarLessonCatalog button');
  await expect(lessonLinks).toHaveCount(lessons.length);
  const missingSkills = skills => page.evaluate(ids => {
    const progress = JSON.parse(localStorage.getItem('spansk123_learningProgress_v1'))?.skillProgress;
    return ids.filter(id => progress?.[id]?.strength !== 5);
  }, skills);
  const topicSkillIds = new Set(topics.flatMap(topic => topic.skills));
  for (const lesson of lessons) {
    await test.step(lesson.title, async () => {
      const topic = topics.find(item => item.id === lesson.practice.topicId);
      const transfer = lesson.transferExercises || [];
      const lessonOnlySkills = [...new Set(transfer.map(ex => ex.skillId).filter(id => !topicSkillIds.has(id)))];
      // Some skills are available exclusively in transfer exercises.
      for (let round = 0; round < 4; round++) {
        await lessonLinks.filter({ has: page.getByText(lesson.title, { exact: true }) }).click();
        await expect(page.locator('#grammarLessonTitle')).toHaveText(lesson.title);
        await page.locator('.grammar-lesson-actions button').first().click();
        const answered = await finishSession(page, [...topic.exercises, ...transfer]);
        for (const key of answered) seen.add(topic.id + '\n' + key);
        for (const ex of transfer) expect(answered).toContain(ex.sentence + '\n' + ex.no);
        if (!(await missingSkills(lessonOnlySkills)).length) break;
      }
      expect(await missingSkills(lessonOnlySkills), lesson.title).toEqual([]);
    });
  }

  for (const topic of topics) {
    await test.step(topic.name, async () => {
      const card = cards.filter({ has: page.getByText(topic.name, { exact: true }) });
      // At full strength the learner has also answered in writing.
      for (let round = 0; round < topic.exercises.length + 1; round++) {
        await card.locator('.grammar-topic-name').click();
        if (await page.locator('#grammarLessonTitle').isVisible()) {
          // A first topic visit opens a focused lesson. Return to select the complete topic.
          await page.getByRole('button', { name: /Tilbake til grammatikk/ }).click();
          await card.locator('.grammar-topic-name').click();
        }
        const start = page.getByRole('button', { name: /Start øvelser/ });
        if (await start.isVisible()) await start.click();
        for (const key of await finishSession(page, topic.exercises)) seen.add(topic.id + '\n' + key);
        if (!(await missingSkills(topic.skills)).length && await card.locator('.grammar-mastery-badge').isVisible()) break;
      }
      expect(await missingSkills(topic.skills), `Uferdige ferdigheter i ${topic.name}`).toEqual([]);
      await expect(card.locator('.grammar-mastery-badge')).toBeVisible();
    });
  }

  const exercises = topics.flatMap(topic => topic.exercises);
  const reached = topics.reduce((n, topic) => n + topic.exercises.filter(ex =>
    seen.has([topic.id, ex.sentence, ex.no].join('\n'))
  ).length, 0);
  test.info().annotations.push({ type: 'Temaoppgaver møtt i lokal øving', description: `${reached}/${exercises.length}` });
  await page.reload();
  await openGrammar();
  await expect(cards.locator('.grammar-mastery-badge')).toHaveCount(topics.length);
  const allSkills = [...new Set([...topicSkillIds, ...lessons.flatMap(lesson => lesson.skillIds)])];
  expect(await missingSkills(allSkills)).toEqual([]);
  for (const stats of await cards.locator('.grammar-topic-stats').allTextContents()) {
    expect(stats.trim()).toMatch(/^100% riktig \(\d+ øvelser\)$/);
  }
});

test('skoleelev løser hver enkelt grammatikkoppgave gjennom tildelte lekser', async ({ browser, page: student }) => {
  test.setTimeout(300_000);
  const school = await startSchoolFixture();
  const teacherContext = await browser.newContext();
  try {
    const teacher = await teacherContext.newPage();
    for (const [page, account] of [[teacher, 'Syntetisk lærer'], [student, 'Syntetisk elev A']]) {
      await page.goto(`${school.origin}/school`);
      await page.getByRole('link', { name: 'Åpne lokal testinnlogging' }).click();
      await page.getByRole('button', { name: account, exact: true }).click();
    }
    await student.getByRole('link', { name: 'Mine lekser', exact: true }).click();
    await teacher.getByLabel('Klassenavn').fill('Grammatikkgruppen');
    await teacher.getByRole('button', { name: 'Opprett klasse' }).click();
    const classRow = teacher.locator('li').filter({ hasText: 'Grammatikkgruppen' });
    await classRow.getByRole('button', { name: 'Inviter elev' }).click();
    const invitation = teacher.getByRole('status').filter({ hasText: 'Invitasjonskode:' });
    const code = (await invitation.innerText()).match(/Invitasjonskode:\s*([\w-]+)/)[1];
    await student.getByLabel('Engangskode fra spansklæreren').fill(code);
    await student.getByRole('button', { name: 'Bli med i klassen' }).click();
    await expect(student.getByText(/Forespørselen er sendt/)).toBeVisible();
    await teacher.reload();
    await classRow.getByRole('button', { name: /Forespørsler/ }).click();
    await teacher.getByRole('button', { name: 'Godkjenn elev' }).click();
    await expect(teacher.getByText('Ingen ventende elevforespørsler.')).toBeVisible();
    await teacher.reload();
    await expect(classRow).toContainText('1 elev');

    const { grammar } = JSON.parse(readFileSync(path.resolve('server/content-catalog.json'), 'utf8'));
    const topicIds = [...new Set(grammar.map(ex => ex.topicId))];
    expect(topicIds.length).toBeGreaterThan(0);
    let answersInWindow = 0;
    let windowStartedAt;
    for (const topicId of topicIds) {
      const exercises = grammar.filter(ex => ex.topicId === topicId);
      const title = exercises[0].topicName;
      await test.step(title, async () => {
        await teacher.getByLabel('Øvingsområde og tema').selectOption(`grammar.${topicId}.v1`);
        await teacher.getByLabel('Tittel på lekse').fill(title);
        await teacher.getByLabel('Antall oppgaver').fill(String(exercises.length));
        await teacher.getByRole('button', { name: 'Publiser lekse' }).click();
        await expect(teacher.getByRole('status').filter({ hasText: `«${title}»` })).toContainText('publisert til 1');
        await student.reload();
        const row = student.locator('li').filter({ has: student.getByText(title, { exact: true }) });
        await row.getByRole('button', { name: 'Start lekse' }).click();
        const remaining = new Set(exercises);
        for (let i = 1; i <= exercises.length; i++) {
          const number = student.getByText(`Oppgave ${i} av ${exercises.length}`, { exact: true });
          await expect(number).toBeVisible();
          const prompt = await student.locator('.question-prompt').textContent();
          const meaning = await student.locator('.question-meaning').allTextContents();
          const exercise = exercises.find(ex => prompt === ex.sentence && (ex.no || '') === meaning.join('\n'));
          expect(exercise, prompt).toBeDefined();
          expect(remaining.delete(exercise), `Oppgaven ble gjentatt: ${prompt}`).toBe(true);
          await student.getByRole('radio', { name: exercise.answer, exact: true }).check();
          // The school API accepts 50 answer submissions per minute on the same route.
          if (answersInWindow === 50) {
            await delay(Math.max(0, 60_100 - (Date.now() - windowStartedAt)));
            answersInWindow = 0;
          }
          await student.getByRole('button', { name: 'Sjekk svaret' }).click();
          await expect(student.getByRole('status')).toContainText(/Riktig\..*Svar lagret\./);
          if (answersInWindow === 0) windowStartedAt = Date.now();
          answersInWindow++;
          await student.getByRole('button', { name: i === exercises.length ? 'Se resultat' : 'Neste oppgave' }).click();
        }
        expect(remaining.size).toBe(0);
        await expect(student.getByRole('heading', { name: 'Leksen er gjennomført' })).toBeVisible();
        await student.reload();
        await expect(row).toContainText(`${exercises.length}/${exercises.length} besvart`);
      });
    }
  } finally {
    await teacherContext.close();
    await school.close();
  }
});
