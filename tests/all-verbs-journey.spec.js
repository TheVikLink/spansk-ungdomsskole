import { expect, test } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).href;
const people = ['yo', 'tú', 'él/ella', 'nosotros', 'ellos'];

async function completePresentChallenges(page, notebook, groups, history) {
  const exercise = page.locator('#verbExerciseArea');
  const pronouns = [...people, 'vosotros'];
  for (const [skill, verbs] of Object.entries(groups)) {
    const expected = verbs.flatMap(verb => pronouns.map(person => verb + '/' + person));
    const seen = new Set();
    // Læringskartet gir fem oppgaver per besøk og tar usette former først.
    for (let start = 0; start < expected.length; start += 5) {
      await page.locator('#navBrainmap').click();
      const node = page.locator(`[onclick="activateBrainmapSkill('a1.verbs.${skill}.present')"]`);
      await page.locator('details.brainmap-group').filter({ has: node }).locator('summary').click();
      await node.click();
      await expect(exercise.locator('#verbPracticeGoal')).toContainText('Skriv personordet og verbformen');
      for (let i = 0; i < 5; i++) {
        const verb = await exercise.locator('.conjugation-verb').innerText();
        const person = await exercise.locator('.conjugation-prompt .pronoun').innerText();
        const key = verb + '/' + person;
        expect(expected).toContain(key);
        seen.add(key);
        const form = notebook.get(key);
        expect(form, key).toBeTruthy();
        await exercise.getByRole('textbox').fill((person === 'él/ella' ? 'ella' : person) + ' ' + form);
        await exercise.getByRole('button', { name: /Sjekk svar/ }).click();
        await expect(exercise.locator('#verbFeedback')).toContainText('Riktig!');
        await exercise.getByRole('button', { name: 'Neste' }).click();
      }
      await expect(page.locator('#verbSessionStats')).toHaveText('5 / 5 riktig');
      history.push({ words: 5, correct: 5 });
    }
    expect([...seen].sort()).toEqual(expected.sort());
  }
}

for (const [button, tense] of [
  ['Presens', 'Presens'],
  ['Fremtid (ir a)', 'Fremtid (ir a + infinitiv)'],
  ['Presens perfektum', 'Presens perfektum']
]) {
  test('Eleven lærer alle verbformene i vanlig øving – ' + tense, async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto(appUrl);
    await page.locator('#studentNameInput').fill('Verbelev');
    await page.locator('.login-btn-primary').click();
    await page.locator('#navVerbs').click();

    const settings = page.locator('#verbSettings');
    const exercise = page.locator('#verbExerciseArea');
    const verbs = await page.evaluate(() => Object.values(verbDatabase).map(v => v.infinitive));
    expect(verbs.length).toBeGreaterThan(0);
    expect(await settings.locator('.verb-infinitive').allTextContents()).toEqual(verbs);
    const history = [];
    const notebook = new Map();
    // Fire verb gir plass til alle fem personene i en vanlig økt med maks 20 oppgaver.
    for (let offset = 0; offset < verbs.length; offset += 4) {
      const group = verbs.slice(offset, offset + 4);
      const expectedForms = group.flatMap(verb => people.map(person => verb + '/' + person)).sort();
      await settings.getByRole('button', { name: button, exact: true }).click();
      await settings.getByRole('button', { name: 'Fjern alle' }).click();
      for (const verb of group) await settings.getByText(verb, { exact: true }).click();
      await settings.getByRole('button', { name: /Start øving/ }).click();

      for (let round = 0; round < 2; round++) {
        if (round) await exercise.getByRole('button', { name: /Øv mer/ }).click();
        let correct = 0;
        const seen = [];
        for (let i = 0; i < expectedForms.length; i++) {
          const verb = await exercise.locator('.conjugation-verb').innerText();
          const person = await exercise.locator('.conjugation-prompt .pronoun').innerText();
          await expect(exercise.locator('.conjugation-tense')).toHaveText(tense);
          const key = verb + '/' + person;
          seen.push(key);
          const answer = notebook.get(key);
          const input = exercise.getByRole('textbox');
          await input.fill(answer ?? 'no lo sé');
          await exercise.getByRole('button', { name: /Sjekk svar/ }).click();
          const feedback = exercise.locator('#verbFeedback');
          if (answer) {
            await expect(feedback).toContainText('Riktig!');
            correct++;
          } else {
            expect(round, key).toBe(0);
            await expect(feedback).toContainText('Riktig svar:');
            const rows = await exercise.locator('.conjugation-table-row').evaluateAll(rows =>
              rows.map(row => [row.querySelector('.pronoun').textContent, row.querySelector('.form').textContent]));
            for (const [pronoun, form] of rows) notebook.set(verb + '/' + pronoun, form);
          }
          await feedback.getByRole('button', { name: 'Neste' }).click();
        }
        expect(seen.sort()).toEqual(expectedForms);
        expect(correct).toBe(expectedForms.length - (round === 0 ? group.length : 0));
        await expect(exercise.getByRole('heading', { name: 'Øving fullført!' })).toBeVisible();
        await expect(page.locator('#verbSessionStats')).toHaveText(correct + ' / ' + seen.length + ' riktig');
        history.push({ words: seen.length, correct });
      }
      await exercise.getByRole('button', { name: /Tilbake/ }).click();
    }
    if (button === 'Presens') {
      // Kartet har egne presensutfordringer for regelrette verb og fem uregelrette verb.
      const groupTypes = await settings.locator('.verb-card').evaluateAll(cards => cards.map(card => ({
        verb: card.querySelector('.verb-infinitive').textContent,
        type: card.querySelector('.verb-type-badge').textContent
      })));
      const groups = {};
      for (const suffix of ['ar', 'er', 'ir']) {
        groups['regular_' + suffix] = groupTypes.filter(card => card.type === 'regular -' + suffix).map(card => card.verb);
        expect(groups['regular_' + suffix].length).toBeGreaterThan(0);
      }
      for (const verb of ['ser', 'estar', 'ir', 'tener', 'hacer']) groups[verb] = [verb];
      await completePresentChallenges(page, notebook, groups, history);
    }
    await page.reload();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('spansk123_practiceHistory'))
      .filter(row => row.activity === 'verbs' && !row.inProgress && !row.interrupted)
      .map(({ words, correct }) => ({ words, correct })));
    expect(saved).toEqual(history);
  });
}
