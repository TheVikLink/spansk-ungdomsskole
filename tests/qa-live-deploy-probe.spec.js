import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// QA live-probe: dokumenterer hva elevene faktisk ser på GitHub Pages i dag.
// serviceWorkers blokkert for å teste rå deployet build (ikke gammel cache).

const liveUrl = 'https://theviklink.github.io/spansk-ungdomsskole/';
const artifactDir = path.resolve('output/qa-audit/live');

test.use({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });

test('QA: live deploy probe', async ({ page }) => {
    fs.mkdirSync(path.join(artifactDir, 'checkpoints'), { recursive: true });
    const events = [];
    async function checkpoint(step, note = '', targetPage = page) {
        const p = path.join(artifactDir, 'checkpoints', `${step}.png`);
        await targetPage.screenshot({ path: p });
        events.push({ step, note, text: (await targetPage.locator('body').innerText()).slice(0, 800) });
    }

    const appResponse = await page.goto(liveUrl, { waitUntil: 'domcontentloaded' });
    expect(appResponse, 'live app must return a response').not.toBeNull();
    expect(appResponse.status(), 'live app must return HTTP 200').toBe(200);
    await expect(page.locator('#welcomeScreen')).toBeVisible();
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await checkpoint('live-welcome');

    // Sjekk sw.js CACHE_NAME på live
    const swResp = await page.request.get(liveUrl + 'sw.js');
    expect(swResp.status(), 'live service worker must return HTTP 200').toBe(200);
    const swText = await swResp.text();
    const cacheMatch = swText.match(/const\s+CACHE_NAME\s*=\s*`([^`]+)`/);
    expect(cacheMatch, 'live service worker must declare CACHE_NAME').not.toBeNull();
    expect(cacheMatch[1], 'live service worker must use the app cache namespace').toMatch(/^spansk123-/);
    events.push({ step: 'live-sw', note: `CACHE_NAME=${cacheMatch ? cacheMatch[1] : 'ukjent'}` });

    await page.locator('#studentNameInput').fill('QA-Live');
    await page.locator('#welcomeScreen').getByRole('button', { name: /Start|Begynn/ }).click();
    await page.evaluate(() => {
        startDiagnosis('2026-09-14T10:00:00.000Z');
        diagnosisQuestionCatalog.forEach((question, index) => {
            answerDiagnosisQuestion(question.id, getDiagnosisAnswerValue(question.acceptedAnswers[0]), `2026-09-14T10:${String(index + 1).padStart(2, '0')}:00.000Z`);
        });
        completeDiagnosisResult('2026-09-14T10:20:00.000Z');
    });
    await checkpoint('live-home');

    // Glosemodus: finnes kapittel-seksjon fortsatt på live?
    await page.locator('#navVocab').click();
    const bodyText = await page.locator('#vocabPage').innerText();
    expect(bodyText, 'retired chapter practice must not appear on live').not.toMatch(/KAPITTELØVING|Kapittel 7/);
    events.push({ step: 'live-vocab', note: 'Kapitteløving ikke synlig.' });
    await checkpoint('live-vocab');

    // Start the quiz before opening another active practice session.
    const startQuiz = page.getByRole('button', { name: 'Start quiz', exact: true });
    await expect(startQuiz).toBeEnabled();
    await startQuiz.click();
    await expect(page.locator('.mixed-quiz-question')).toBeVisible();
    await checkpoint('live-quiz-q1');

    // The quiz is now active. Check grammar in an independent page sharing
    // the same local student state rather than navigating away from it.
    const grammarPage = await page.context().newPage();
    await grammarPage.goto(liveUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await grammarPage.locator('#navGrammar').click();
    await grammarPage.locator('#grammarTopicGrid button').filter({ hasText: /Gustar/ }).first().click();
    const startEx = grammarPage.getByRole('button', { name: /Start øvelser/ });
    await expect(startEx).toBeVisible();
    await startEx.click();
    await expect(grammarPage.locator('.grammar-norwegian-context')).toBeVisible();
    events.push({ step: 'live-gustar-context', note: 'Norsk kontekst synlig.' });
    await checkpoint('live-gustar-q1', '', grammarPage);
    await grammarPage.close();

    fs.writeFileSync(path.join(artifactDir, 'manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), events }, null, 2));
    console.log('Live probe ferdig:', events.map(e => `${e.step}: ${e.note || ''}`).join(' | '));
});
