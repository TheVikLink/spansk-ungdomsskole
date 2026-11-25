import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { startStaticAppServer } from './helpers/static-app-server.js';

const readData = file => JSON.parse(readFileSync('data/' + file, 'utf8'));
const lessons = [
  ...readData('lesson-themes.json'),
  ...readData('lesson-culture.json')
];
const lesson = lessons.find(item => item.category === 'tall');

test.use({ serviceWorkers: 'block' });

test('lærer åpner timekatalogen og eleven bruker riktig glosesett, skriving, lytting og kort', async ({ page }) => {
  const server = await startStaticAppServer();
  try {
    await page.goto(server.url + 'index.html');
    await page.locator('#studentNameInput').fill('Tematest');
    await page.locator('.login-btn-primary').click();
    const lessonNavigation = page.getByRole('navigation').getByRole('link', { name: 'Undervisningstimer', exact: true });
    await expect(lessonNavigation).toBeVisible();
    await lessonNavigation.click();
    await expect(page.getByRole('heading', { name: 'Undervisningstimer i spansk' })).toBeVisible();
    await expect(page.locator('.catalog-section h2').first()).toHaveText('Gratis prøvetimer');
    const links = page.locator('.catalog a');
    await expect(links).toHaveCount(lessons.length);
    const addresses = await links.evaluateAll(elements => elements.map(link => link.href));
    expect(new Set(addresses).size).toBe(lessons.length);
    for (const url of addresses) {
      const response = await page.request.get(url);
      expect(response.status(), url).toBe(200);
    }
    await links.filter({ hasText: lesson.title }).click();
    const flash = page.getByRole('link', { name: 'Åpne glosene' });
    await expect(flash).toHaveAttribute('href', '../../index.html#time/' + lesson.ids.join(','));
    const opened = page.waitForEvent('popup');
    await flash.click();
    const vocab = await opened;
    await expect(vocab.locator('#vocabStudy')).toBeVisible();
    const queue = await vocab.evaluate(() =>
      sessionCards.map(item => item.card.canonicalId + '/' + item.direction).sort()
    );
    expect(queue).toEqual(lesson.ids.flatMap(id => [id + '/es-no', id + '/no-es']).sort());
    await vocab.close();

    const worksheetLink = page.getByRole('link', { name: /Skriv ut elevark/ }).first();
    const worksheetPdf = await page.request.get(await worksheetLink.evaluate(link => link.href));
    expect(worksheetPdf.status()).toBe(200);
    expect((await worksheetPdf.body()).subarray(0, 5).toString()).toBe('%PDF-');

    const printLink = page.getByRole('link', { name: /Skriv ut partnerkortene/ }).first();
    const pdf = await page.request.get(await printLink.evaluate(link => link.href));
    expect(pdf.status()).toBe(200);
    expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
    const teacherDetails = page.locator('details', { hasText: 'For læreren: manus, fasit og forberedelse' });
    await expect(teacherDetails).not.toContainText('Legg ferdig opptak i samme mappe');
    await teacherDetails.locator('summary').click();
    const schoolLink = page.getByRole('link', { name: 'Gi temaet som digital skolelekse (Feide)' });
    await expect(schoolLink).toHaveAttribute('href', `/school?activity=${encodeURIComponent('vocabulary.tall.v1')}&title=${encodeURIComponent(lesson.title)}`);

    // Student page separates answers, transcript, and A/B cards, and provides web inputs + accents
    await page.getByRole('link', { name: 'Åpne elevsiden' }).click();
    await expect(page).toHaveURL(/\/undervisning\/tall\/elev\.html$/);
    await expect(page.getByText('For læreren: manus, fasit og forberedelse')).toHaveCount(0);
    await expect(page.locator('a[href*="partnerkort"], a[href*="lyttemanus"]')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText('Det du skriver blir i denne fanen');
    await expect(page.locator('main')).not.toContainText('svar på papir');

    const firstWriting = page.getByLabel(lesson.writing[0][0]);
    await firstWriting.focus();
    await page.locator('[data-accent-bar] button', { hasText: 'á' }).click();
    await expect(firstWriting).toHaveValue('á');

    // Keyboard long press inserts accented letters and inverted punctuation; quick press stays plain
    await firstWriting.fill('');
    await page.keyboard.down('a');
    await page.waitForTimeout(450);
    await page.keyboard.up('a');
    await page.keyboard.press('e');
    await page.keyboard.down('Shift');
    await page.keyboard.down('?');
    await page.waitForTimeout(450);
    await page.keyboard.up('?');
    await page.keyboard.down('!');
    await page.waitForTimeout(450);
    await page.keyboard.up('!');
    await page.keyboard.up('Shift');
    await expect(firstWriting).toHaveValue('áe¿¡');

    await expect(page.getByText('Sammenlign etter at du har skrevet', { exact: true })).toBeHidden();
    for (const [prompt, example] of lesson.writing) await page.getByLabel(prompt).fill(example);
    await page.getByText('Sammenlign etter at du har skrevet', { exact: true }).click();
    for (const [, example] of lesson.writing) await expect(page.getByText(example, { exact: true })).toBeVisible();

    await expect(page.locator('[data-listening] textarea')).toHaveCount(lesson.questions.length);
    await page.route('**/*.mp3', route => route.fulfill({ status: 404, body: '' }));
    await page.locator('audio').click({ position: { x: 18, y: 26 } });
    await expect(page.getByRole('status')).toContainText('Opptaket kan ikke spilles av');
  } finally {
    await server.close();
  }
});

test('temagloser bruker samme repetisjonsplan ved ekstraøving og neste besøk', async ({ page }) => {
  const server = await startStaticAppServer();
  try {
    await page.setViewportSize({width: 390, height: 844});
    await page.clock.setFixedTime(new Date('2026-01-12T12:00:00Z'));
    await page.goto(server.url + 'index.html#time/' + lesson.ids.join(','));
    await page.locator('#studentNameInput').fill('Temarepetisjon');
    await page.locator('.login-btn-primary').click();
    const area = page.locator('#flashcardArea');
    for (let i = 0; i < lesson.ids.length * 2; i++) {
      await area.getByRole('button').press('Enter');
      await expect(area.locator('.card-answer')).toBeVisible();
      await page.keyboard.press('1');
    }
    await expect(area.locator('.session-complete')).toBeVisible();
    const schedule = () => page.evaluate(ids => JSON.parse(localStorage.getItem('spansk123Data_v4'))
      .filter(card => ids.includes(card.canonicalId))
      .map(({canonicalId, noEs, esNo}) => ({canonicalId, noEs, esNo})), lesson.ids);
    const before = await schedule();
    expect(before).toHaveLength(lesson.ids.length);
    for (const card of before) {
      expect(card.noEs.repetitions).toBe(1);
      expect(card.esNo.repetitions).toBe(1);
    }
    await page.reload();
    await expect(area.locator('.card-type-badge')).toHaveText('Ekstraøving');
    await area.getByRole('button').press('Enter');
    await page.keyboard.press('1');
    expect(await schedule()).toEqual(before);

    await page.clock.setFixedTime(new Date('2026-01-14T12:00:00Z'));
    await page.reload();
    const queued = await page.evaluate(() => ({
      extra: isCustomStudySession,
      keys: sessionCards.map(item => item.card.canonicalId + '/' + item.direction).sort()
    }));
    expect(queued.extra).toBe(false);
    expect(queued.keys).toEqual(lesson.ids.flatMap(id => [id + '/es-no', id + '/no-es']).sort());
  } finally {
    await server.close();
  }
});
