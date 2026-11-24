import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

for (const width of [390, 1440]) {
    test(`feed starts practice, extends in place and keeps manual choice at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 850 });
        await page.goto(appUrl);
        await page.locator('#studentNameInput').fill('Prøveelev');
        await page.locator('.login-btn-primary').click();
        const feed = page.locator('#homeLearningFeed');
        await expect(feed.locator('article').first()).toContainText('Dagens quiz');
        const initial = await feed.locator('article h3').allTextContents();
        await page.getByRole('button', { name: 'Vis flere' }).click();
        const expanded = await feed.locator('article h3').allTextContents();
        expect(expanded.length).toBeGreaterThan(initial.length);
        expect(expanded.slice(0, initial.length)).toEqual(initial);
        await expect(feed.getByText(/^Opptil \d+ XP$/)).toHaveCount(expanded.length);
        await expect(feed.locator('article').first()).toContainText('Opptil 10 XP');
        await expect(feed.locator('article').nth(initial.length).getByRole('button')).toBeFocused();
        await expect(page.locator('#homePrimaryContent > section')).toHaveCount(2);
        await expect(page.locator('#homePage')).not.toContainText(/Velg tema selv|Grammatikkart|Ingen registrert øving/);
        await expect(page.getByRole('navigation').getByRole('link', { name: 'Undervisningstimer' })).toHaveAttribute('href', 'undervisning/index.html');
        await expect(page.locator('#homePage').getByRole('link', { name: 'Undervisningstimer' })).toHaveCount(0);
        if (width === 390) await page.locator('.nav-more summary').click();
        await page.locator('#navGrammar').click();
        await expect(page.locator('#grammarPage')).toBeVisible();
        await page.locator('#navHome').click();
        await page.locator('#homeStartMixedQuizBtn').click();
        await expect(page.locator('#mixedQuizStudy')).toBeVisible();
        await page.evaluate(() => finishMixedQuiz());
        await page.getByRole('button', { name: 'Start neste økt' }).click();
        await expect(page.locator('#mixedQuizStudy')).toBeHidden();
    });
}

test('a missing listening recording offers another recommendation', async ({ page }) => {
    await page.goto(appUrl);
    await page.locator('#studentNameInput').fill('Prøveelev');
    await page.locator('.login-btn-primary').click();
    const story = page.locator('#homeLearningFeed article').filter({ hasText: /^Lytt til/ }).first();
    for (let batch = 0; batch < 4 && await story.count() === 0; batch++) {
        await page.getByRole('button', { name: 'Vis flere' }).click();
    }
    await story.getByRole('button').click();
    await page.locator('#listeningExercise audio').evaluate(audio => { audio.src = 'missing-feed-recording.mp3'; });
    await expect(page.locator('#listeningStoryAudioError')).toBeVisible();
    await page.locator('#listeningStoryAudioError').getByRole('button', { name: 'Start neste økt' }).click();
    await expect(page.locator('#dictationPage')).toBeHidden();
});

test('the writing card starts written sentence practice independently of the verb level', async ({ page }) => {
    await page.goto(appUrl);
    await page.locator('#studentNameInput').fill('Prøveelev');
    await page.locator('.login-btn-primary').click();
    const card = page.locator('#homeLearningFeed article').filter({ hasText: 'Skriv uttrykk i korte setninger' }).first();
    for (let batch = 0; batch < 4 && await card.count() === 0; batch++) {
        await page.getByRole('button', { name: 'Vis flere' }).click();
    }
    await card.getByRole('button').click();
    await expect(page.getByText('Skriv hele setningen på spansk.')).toBeVisible();
    await page.locator('#grammarAnswerInput').fill('Tengo hambre.');
    await page.locator('#grammarSubmitBtn').click();
    await expect(page.locator('#grammarFeedback')).toContainText('Riktig');
});

test('weekly goal and XP count finished feed sessions, including after backup and reload', async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 10, 24, 12));
    await page.goto(appUrl);
    await page.locator('#studentNameInput').fill('Prøveelev');
    await page.locator('.login-btn-primary').click();
    const weekly = page.locator('#homeQuizWeeklyGoal');
    const xp = page.locator('#homeFeedWeeklyXp');
    await expect(weekly).toHaveText('Ukemål: 0 av 4 øvingsdager');
    await expect(xp).toHaveText('0 XP denne uka');

    await page.locator('#homeStartMixedQuizBtn').click();
    await page.evaluate(() => {
        for (const _ of mixedQuizState.quiz.items) {
            const item = mixedQuizState.quiz.items[mixedQuizState.index];
            submitMixedQuizAnswer(getDiagnosisAnswerValue(item.acceptedAnswers[0]));
            advanceMixedQuizQuestion();
        }
    });
    await expect(page.locator('[data-feed-xp]')).toHaveText('+10 XP (inkludert 2 XP for alt riktig)');
    await page.getByRole('button', { name: 'Avslutt', exact: true }).click();
    await expect(weekly).toHaveText('Ukemål: 1 av 4 øvingsdager');
    await expect(xp).toHaveText('10 XP denne uka');
    await expect(page.locator('[data-home-day="2026-11-24"] strong')).toHaveText('10 XP');

    await page.locator('#homeStartMixedQuizBtn').click();
    await page.evaluate(() => finishMixedQuiz());
    await expect(page.locator('[data-feed-xp]')).toHaveCount(0);
    const backup = await page.evaluate(() => buildProgressExportData());
    expect(backup.practiceHistory.map(entry => entry.xp).filter(xp => xp !== undefined)).toEqual([10]);

    await page.reload();
    await expect(xp).toHaveText('10 XP denne uka');
    expect(await page.evaluate(() => [getPracticeXp(0, 6, 5), getPracticeXp(3, 6, 5), getPracticeXp(6, 6, 5)])).toEqual([0, 2, 5]);
    await page.evaluate(data => {
        localStorage.removeItem('spansk123_practiceHistory');
        importProgressData(data);
        showPage('home');
    }, backup);
    await expect(xp).toHaveText('10 XP denne uka');
    await page.clock.setFixedTime(new Date(2026, 10, 30, 12));
    await page.reload();
    await expect(xp).toHaveText('0 XP denne uka');
});

test('a listening card earns XP once and the ordinary listening view carries no award', async ({ page }) => {
    await page.goto(appUrl);
    await page.locator('#studentNameInput').fill('Prøveelev');
    await page.locator('.login-btn-primary').click();
    const story = page.locator('#homeLearningFeed article').filter({ hasText: /^Lytt til/ }).first();
    for (let batch = 0; batch < 4 && await story.count() === 0; batch++) {
        await page.getByRole('button', { name: 'Vis flere' }).click();
    }
    const reward = (await story.getByText(/^Opptil \d+ XP$/).innerText()).match(/\d+/)[0];
    await story.getByRole('button').click();
    const finishStory = () => page.evaluate(() => {
        listeningState.answers = listeningState.story.questions.map(question => question.correctOptionId);
        renderListeningStoryCompletion();
    });
    await finishStory();
    await expect(page.locator('[data-feed-xp]')).toContainText(`+${reward} XP`);
    await finishStory();
    expect(await page.evaluate(() => getHomeWeekDays(new Date()).reduce((sum, day) => sum + day.xp, 0))).toBe(Number(reward));
    await page.locator('#listeningExercise').getByRole('button', { name: '✕ Tilbake' }).click();
    await page.getByRole('button', { name: 'Start lyttehistorien', exact: true }).first().click();
    await finishStory();
    await expect(page.locator('[data-feed-xp]')).toHaveCount(0);
    expect(await page.evaluate(() => getHomeWeekDays(new Date()).reduce((sum, day) => sum + day.xp, 0))).toBe(Number(reward));
});


test('a short grammar card awards the smaller maximum shown before practice', async ({ page }) => {
    await page.goto(appUrl);
    await page.locator('#studentNameInput').fill('Prøveelev');
    await page.locator('.login-btn-primary').click();
    const grammar = page.locator('#homeLearningFeed article').filter({ hasText: '1 oppgave.' }).first();
    for (let batch = 0; batch < 4 && await grammar.count() === 0; batch++) {
        await page.getByRole('button', { name: 'Vis flere' }).click();
    }
    await expect(grammar).toContainText('Opptil 3 XP');
    await grammar.getByRole('button').click();
    await page.evaluate(() => {
        selectGrammarAnswer(grammarExercises[0].answer, null);
        advanceGrammarExercise();
    });
    await expect(page.locator('[data-feed-xp]')).toHaveText('+3 XP (inkludert 2 XP for alt riktig)');
});
