import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('lyttehistorier og fortellingsbasert diktat', () => {
  test('fire ekstra lyttehistorier har egne manus, spørsmål og lydfiler', async ({ page }) => {
    await page.goto(appUrl);
    const stories = await page.evaluate(() => LISTENING_STORIES.filter(story => story.id !== 'leo-sevilla'));
    expect(stories).toHaveLength(4);
    expect(stories.map(story => story.id)).toEqual(['carmen-madrid-a0', 'mateo-puebla-a0', 'ines-valparaiso-a1', 'diego-cartagena-a1']);
    expect(Object.fromEntries(stories.map(story => [story.id, story.fullAudio]))).toEqual({
      'carmen-madrid-a0': 'Hola soy Carmen .wav',
      'mateo-puebla-a0': 'Me llamo Mateo y viv.wav',
      'ines-valparaiso-a1': 'Hola soy Inés.mp3',
      'diego-cartagena-a1': 'Diego de Cartagena.mp3'
    });
    const dictationAudio = await page.evaluate(() => DICTATION_STORIES.map(story => story.fullAudio));
    for (const story of stories) {
      expect(story.transcript.length).toBeGreaterThan(100);
      expect(story.translation.length).toBeGreaterThan(80);
      expect(story.questions).toHaveLength(3);
      if (story.fullAudio) {
        expect(story.durationSeconds).toEqual(expect.any(Number));
        expect(story.fullAudio).toMatch(/\.(wav|mp3)$/);
        expect(dictationAudio).not.toContain(story.fullAudio);
      } else {
        expect(story.durationSeconds).toBeNull();
      }
    }
    expect(stories[0].level).toBe('A0');
    expect(stories[0].durationSeconds).toBeGreaterThanOrEqual(25);
    expect(stories[0].durationSeconds).toBeLessThanOrEqual(40);
    for (const story of stories.slice(1).filter(story => story.fullAudio)) {
      expect(story.durationSeconds).toBeGreaterThanOrEqual(30);
      expect(story.durationSeconds).toBeLessThanOrEqual(60);
    }
  });

  test('plasserer Sevilla-historien på A1 og holder pilotlengden mellom 45 og 75 sekunder', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Lytte-test'; showMainApp(); showPage('dictation'); });
    const story = await page.evaluate(() => {
      const story = LISTENING_STORIES.find(item => item.id === 'leo-sevilla');
      return { level: story.level, questionCount: story.questions.length, audio: story.fullAudio };
    });
    expect(story).toMatchObject({ level: 'A1', questionCount: 3, audio: 'Leo-Sevilla.wav' });
    await page.getByRole('button', { name: 'Start lyttehistorien', exact: true }).first().click();
    await expect.poll(() => page.locator('#listeningStoryAudio').evaluate(audio => audio.duration)).toBeGreaterThanOrEqual(45);
    expect(await page.locator('#listeningStoryAudio').evaluate(audio => audio.duration)).toBeLessThanOrEqual(75);
  });

  test('lytteforståelse krever avspilling før spørsmål kan startes', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Lytte-test'; showMainApp(); showPage('dictation'); });
    await expect(page.getByRole('button', { name: 'Start lyttehistorien', exact: true })).toHaveCount(5);
    await page.getByRole('button', { name: 'Start lyttehistorien', exact: true }).first().click();
    await expect(page.locator('#listeningStoryStartBtn')).toBeDisabled();
    await expect(page.locator('#listeningStoryTextSupport')).toHaveCount(0);
    await page.locator('#listeningStoryAudio').evaluate(audio => audio.play());
    await expect(page.locator('#listeningStoryStartBtn')).toBeEnabled();
  });

  test('viser ett forståelsesspørsmål uten tekst og gir fasit etter svar', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Lytte-test'; showMainApp(); showPage('dictation'); });
    await page.getByRole('button', { name: 'Start lyttehistorien', exact: true }).first().click();
    await page.locator('#listeningStoryAudio').evaluate(audio => audio.play());
    await page.getByRole('button', { name: 'Start spørsmål', exact: true }).click();
    await expect(page.locator('#listeningExercise legend')).toHaveText('Hva gjør Leo denne lørdagen?');
    await expect(page.locator('#listeningStoryTextSupport')).toHaveCount(0);
    await page.getByLabel('Han sykler til parken, møter Marta, spiller fotball og kjøper is.').check();
    await page.getByRole('button', { name: 'Sjekk svaret', exact: true }).click();
    await expect(page.locator('#listeningStoryFeedback')).toContainText('Riktig');
    await expect(page.getByRole('button', { name: 'Neste spørsmål', exact: true })).toBeFocused();
  });

  test('viser tekststøtte først etter alle tre svar og lagrer ikke lytteøkten', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Lytte-test'; showMainApp(); showPage('dictation'); });
    const before = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
    await page.getByRole('button', { name: 'Start lyttehistorien', exact: true }).first().click();
    await page.locator('#listeningStoryAudio').evaluate(audio => audio.play());
    await page.getByRole('button', { name: 'Start spørsmål', exact: true }).click();
    await page.getByLabel('Han går til markedet, kjøper frukt og leser en bok.').check();
    await page.getByRole('button', { name: 'Sjekk svaret', exact: true }).click();
    await expect(page.locator('#listeningStoryFeedback')).toContainText('Ikke helt');
    await page.getByRole('button', { name: 'Neste spørsmål', exact: true }).click();
    await page.getByLabel('En gul ball.').check();
    await page.getByRole('button', { name: 'Sjekk svaret', exact: true }).click();
    await page.getByRole('button', { name: 'Neste spørsmål', exact: true }).click();
    await page.getByLabel('De kjøper en sjokoladeis.').check();
    await page.getByRole('button', { name: 'Sjekk svaret', exact: true }).click();
    await page.getByRole('button', { name: 'Se resultatet', exact: true }).click();
    await expect(page.locator('#listeningStoryResult')).toContainText('2 av 3 riktige');
    await expect(page.locator('#listeningStoryTextSupport')).toBeVisible();
    expect(await page.locator('#listeningStoryTextSupport').evaluate(element => element.open)).toBe(false);
    await page.locator('#listeningStoryTextSupport summary').click();
    await expect(page.locator('#listeningStoryTextSupport')).toContainText('Norsk oversettelse');
    const after = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
    expect(after).toEqual(before);
  });

  test('lytteforståelse er brukbar med tastatur på smal skjerm', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Lytte-test'; showMainApp(); showPage('dictation'); });
    await page.getByRole('button', { name: 'Start lyttehistorien', exact: true }).first().click();
    await page.locator('#listeningStoryAudio').evaluate(audio => audio.play());
    await page.getByRole('button', { name: 'Start spørsmål', exact: true }).click();
    await page.locator('input[name="listeningStoryAnswer"]').first().focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await expect(page.locator('input[name="listeningStoryAnswer"]:checked')).toHaveCount(1);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test('viser fem historier med lyd og filtrerer på nivå og region', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Diktat-test'; showMainApp(); });
    await page.locator('#navDictation').click();
    await expect(page.locator('#dictationPage')).toBeVisible();
    await expect(page.locator('#dictationStoryList .dictation-story-card')).toHaveCount(5);
    await expect(page.getByRole('heading', { name: 'Biblioteket i Buenos Aires' })).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'En sykkeltur i Barcelona' })).toHaveCount(1);
    await page.locator('#dictationLevelFilter').selectOption('A0');
    await expect(page.locator('#dictationStoryList .dictation-story-card:visible')).toHaveCount(2);
    await page.locator('#dictationRegionFilter').selectOption('Mexico');
    await expect(page.locator('#dictationStoryList .dictation-story-card:visible')).toHaveCount(1);
  });

  test('viser bare komplette separate lytteoppgaver som pilot', async ({ page }) => {
    await page.goto(appUrl);
    const stories = await page.evaluate(() => LISTENING_STORIES);
    for (const story of stories) {
      expect(story.questions).toHaveLength(3);
      for (const question of story.questions) {
        expect(question.prompt).toBeTruthy();
        expect(question.explanation).toBeTruthy();
        expect(question.options.length).toBeGreaterThanOrEqual(3);
        expect(question.options.filter(option => option.id === question.correctOptionId)).toHaveLength(1);
        expect(new Set(question.options.map(option => option.id)).size).toBe(question.options.length);
      }
    }
  });

  test('spør om Leos handling før balldetaljen og har tekstforankrede distraktorer', async ({ page }) => {
    await page.goto(appUrl);
    const questions = await page.evaluate(() => LISTENING_STORIES.find(story => story.id === 'leo-sevilla').questions);
    expect(questions.map(question => question.id)).toEqual(['leo-main', 'leo-detail', 'leo-before-home']);
    expect(questions[0].options.map(option => option.text)).toContain('Han går til markedet, kjøper frukt og leser en bok.');
    expect(questions[1].options.map(option => option.text)).toContain('En rød ball.');
    expect(questions[2].options.map(option => option.text)).toContain('De spiser ris og salat.');
  });

  test('skjuler fasit før innsending og lagrer bare fullføring', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Diktat-test'; showMainApp(); showPage('dictation'); });
    await page.locator('#dictationStoryList').getByRole('button', { name: 'Start diktat' }).first().click();
    await page.getByRole('button', { name: 'Start øvelsen' }).click();
    await expect(page.locator('#dictationAnswer')).toBeVisible();
    await expect(page.locator('#dictationSolution')).toBeHidden();
    await page.locator('#dictationAnswer').fill('Me llamo Ana.');
    await page.getByRole('button', { name: 'Sjekk svar' }).click();
    await expect(page.locator('#dictationSolution')).toBeVisible();
    await page.evaluate(() => { document.querySelector('#dictationStar5')?.click(); });
    await expect.poll(() => page.evaluate(() => Object.keys(localStorage).filter(k => k.includes('dictation')).map(k => [k, localStorage.getItem(k)]))).toEqual([]);
    await page.getByRole('button', { name: 'Neste segment' }).click();
    await expect(page.locator('#dictationAnswer')).toBeVisible();
  });

  test('kan høre hele historien før øvelsen starter, og lydkilden følger fasiten', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Diktat-test'; showMainApp(); showPage('dictation'); });
    await page.locator('#dictationStoryList').getByRole('button', { name: 'Start diktat' }).nth(2).click();
    await expect(page.locator('#dictationFullStoryAudio')).toBeVisible();
    await expect(page.locator('#dictationAnswer')).toBeHidden();
    await page.getByRole('button', { name: 'Start øvelsen' }).click();
    await expect(page.locator('#dictationExercise audio')).toHaveAttribute('src', /Sof%C3%ADa.*1\.wav$/);
    const expected = await page.evaluate(() => DICTATION_STORIES.find(s => s.id === 'antigua-volcan').segments[0][0]);
    await expect(page.locator('#dictationAnswer')).toBeVisible();
    expect(expected).toBe('Sofía vive en Antigua Guatemala.');
  });

  test('bruker WAV-kilde for alle Sofía-segmenter', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Diktat-test'; showMainApp(); showPage('dictation'); });
    await page.locator('#dictationStoryList').getByRole('button', { name: 'Start diktat' }).nth(2).click();
    await page.getByRole('button', { name: 'Start øvelsen' }).click();
    const failedRequests = [];
    page.on('response', response => {
      if (response.url().includes('/audio/diktat/') && response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`);
    });

    for (let index = 1; index <= 8; index += 1) {
      await expect(page.locator('#dictationSegmentAudio')).toHaveAttribute('src', new RegExp(`${index}\\.wav$`));
      if (index < 8) {
        await page.getByRole('button', { name: 'Sjekk svar' }).click();
        await page.getByRole('button', { name: 'Neste segment' }).click();
      }
    }
    await page.getByRole('button', { name: 'Sjekk svar' }).click();
    await page.getByRole('button', { name: 'Neste segment' }).click();
    await expect(page.locator('.completion-reading section')).toHaveCount(2);
    await expect(page.locator('.completion-reading')).toContainText('Norsk oversettelse');
    expect(failedRequests).toEqual([]);
  });

  test('Buenos Aires-diktatet bruker de nye Tomás-WAV-filene', async ({ page }) => {
    await page.goto(appUrl);
    const story = await page.evaluate(() => DICTATION_STORIES.find(item => item.id === 'buenosaires-biblioteca'));
    expect(story.audioDir).toBe('Tomás vive en Buenos Aires');
    expect(story.fullAudio).toBe('Tomás vive en Buenos Aires .wav');
    expect(story.segments.map(segment => segment[1])).toEqual(
      Array.from({ length: 8 }, (_, index) => `Tomás vive en Buenos Aires ${index + 1}.wav`)
    );
  });

  test('Barcelona-diktatet bruker de nye Nora-WAV-filene', async ({ page }) => {
    await page.goto(appUrl);
    const story = await page.evaluate(() => DICTATION_STORIES.find(item => item.id === 'barcelona-bici'));
    expect(story.audioDir).toBe('Nora pasa una semana');
    expect(story.fullAudio).toBe('Nora pasa una semana.wav');
    expect(story.segments.map(segment => segment[1])).toEqual(
      Array.from({ length: 8 }, (_, index) => `Nora pasa una semana ${index + 1}.wav`)
    );
  });

  test('bruker de innspilte WAV-filene i Madrid- og Oaxaca-mappene', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Diktat-test'; showMainApp(); showPage('dictation'); });
    await page.locator('#dictationStoryList').getByRole('button', { name: 'Start diktat' }).nth(1).click();
    await expect(page.locator('#dictationFullStoryAudio')).toHaveAttribute('src', /Luis%20est.*Oaxaca.*\.wav$/);
    await page.getByRole('button', { name: 'Start øvelsen' }).click();
    await expect(page.locator('#dictationSegmentAudio')).toHaveAttribute('src', /Luis%20est.*Oaxaca.*1\.wav$/);
  });

  test('viser hint med spansk først, bruker aksentknapper og sender med Enter', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Diktat-test'; showMainApp(); showPage('dictation'); });
    await page.locator('#dictationStoryList').getByRole('button', { name: 'Start diktat' }).first().click();
    await page.getByRole('button', { name: 'Start øvelsen' }).click();
    await expect(page.locator('.dictation-hints')).toHaveText('');
    await expect(page.getByRole('button', { name: 'Sett inn á' })).toBeVisible();
    await page.getByRole('button', { name: 'Sett inn á' }).click();
    await expect(page.locator('#dictationAnswer')).toHaveValue('á');
    await page.locator('#dictationAnswer').press('Enter');
    await expect(page.locator('#dictationSolution')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('#dictationExercise .study-header')).toContainText('2 / 8');
    await page.getByRole('button', { name: 'Sjekk svar' }).click();
    await page.getByRole('button', { name: 'Neste segment' }).click();
    await expect(page.locator('.dictation-hints')).toContainText('la plaza = torget');
  });

  test('bruker spansk-først-formatet i alle historiehint', async ({ page }) => {
    await page.goto(appUrl);
    const hints = await page.evaluate(() => DICTATION_STORIES.flatMap(story => story.hints));
    expect(hints.length).toBeGreaterThan(0);
    expect(hints.every(hint => /^.+ = .+$/u.test(hint) && !hint.includes(':'))).toBe(true);
  });

  test('viser bare hint som finnes i aktuell fasit', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => { localStorage.clear(); studentName = 'Diktat-test'; showMainApp(); showPage('dictation'); });
    await page.locator('#dictationStoryList').getByRole('button', { name: 'Start diktat' }).nth(1).click();
    await page.getByRole('button', { name: 'Start øvelsen' }).click();
    await expect(page.locator('.dictation-hints')).toHaveText('');
    await page.locator('#dictationAnswer').fill('Luis está en Oaxaca.');
    await page.getByRole('button', { name: 'Sjekk svar' }).click();
    await page.getByRole('button', { name: 'Neste segment' }).click();
    await expect(page.locator('.dictation-hints')).toContainText('el mercado = marked');
  });
});
