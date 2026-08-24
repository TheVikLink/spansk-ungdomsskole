import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// QA live-probe: dokumenterer hva elevene faktisk ser på GitHub Pages i dag.
// serviceWorkers blokkert for å teste rå deployet build (ikke gammel cache).

const liveUrl = 'https://theviklink.github.io/spansk-ungdomsskole/';
const artifactDir = path.resolve('output/qa-audit/live');

test.use({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });

test('QA: live deploy probe', async ({ page }) => {
    test.setTimeout(120000);
    fs.mkdirSync(path.join(artifactDir, 'checkpoints'), { recursive: true });
    const events = [];
    async function checkpoint(step, note = '') {
        const p = path.join(artifactDir, 'checkpoints', `${step}.png`);
        await page.screenshot({ path: p });
        events.push({ step, note, text: (await page.locator('body').innerText()).slice(0, 800) });
    }

    await page.goto(liveUrl, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await checkpoint('live-welcome');

    // Sjekk sw.js CACHE_NAME på live
    const swResp = await page.request.get(liveUrl + 'sw.js');
    const swText = await swResp.text();
    const cacheMatch = swText.match(/CACHE_NAME\s*=\s*'([^']+)'/);
    events.push({ step: 'live-sw', note: `CACHE_NAME=${cacheMatch ? cacheMatch[1] : 'ukjent'}` });

    await page.locator('#studentNameInput').fill('QA-Live');
    await page.locator('#welcomeScreen').getByRole('button', { name: /Start|Begynn/ }).click();
    await checkpoint('live-home');

    // Glosemodus: finnes kapittel-seksjon fortsatt på live?
    await page.locator('#navVocab').click();
    const bodyText = await page.locator('#vocabPage').innerText();
    events.push({ step: 'live-vocab', note: `Kapitteløving synlig: ${/KAPITTELØVING|Kapittel 7/.test(bodyText)}` });
    await checkpoint('live-vocab');

    // Grammatikk gustar: norsk kontekst?
    await page.locator('#navGrammar').click();
    await page.locator('#grammarTopicGrid button').filter({ hasText: /Gustar/ }).first().click();
    const startEx = page.getByRole('button', { name: /Start øvelser/ });
    if (await startEx.isVisible().catch(() => false)) await startEx.click();
    const ctxVisible = await page.locator('.grammar-norwegian-context').isVisible().catch(() => false);
    events.push({ step: 'live-gustar-context', note: `Norsk kontekst i gustar på live: ${ctxVisible}` });
    await checkpoint('live-gustar-q1');

    // Quiz resultat: "Ta en ny quiz"?
    await page.locator('#navVocab').click();
    await page.getByRole('button', { name: 'Start quiz', exact: true }).click().catch(() => {});
    await checkpoint('live-quiz-q1');

    fs.writeFileSync(path.join(artifactDir, 'manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), events }, null, 2));
    console.log('Live probe ferdig:', events.map(e => `${e.step}: ${e.note || ''}`).join(' | '));
});
