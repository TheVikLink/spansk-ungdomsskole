import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// QA-audit av hele elevreisen mot lokal index.html (release-kandidat).
// Evidens: output/qa-audit/latest/{checkpoints,manifest.json}

const appUrl = pathToFileURL(path.resolve('index.html')).toString();
const artifactDir = path.resolve('output/qa-audit/latest');

test.describe.configure({ mode: 'serial' });
test.use({ viewport: { width: 390, height: 844 } });

const findings = [];
function finding(id, stage, what, should, severity, reproduce, rootCause, fix) {
    findings.push({ id, stage, what, should, severity, reproduce, rootCause, fix });
}

test('QA: full student journey audit', async ({ page }) => {
    test.setTimeout(420000);
    fs.rmSync(artifactDir, { recursive: true, force: true });
    fs.mkdirSync(path.join(artifactDir, 'checkpoints'), { recursive: true });

    const events = [];
    const consoleErrors = [];
    const pageErrors = [];
    const overflowViolations = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => pageErrors.push(e.message));
    page.on('dialog', async d => {
        events.push({ step: 'dialog', note: `${d.type()}: ${d.message()}` });
        await d.accept();
    });

    let checkpointIndex = 0;
    async function checkpoint(step, note = '') {
        const filename = `${String(checkpointIndex++).padStart(3, '0')}-${step}.png`;
        const screenshotPath = path.join(artifactDir, 'checkpoints', filename);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        if (overflow) overflowViolations.push(step);
        events.push({
            at: new Date().toISOString(), step, note,
            screenshot: path.relative(artifactDir, screenshotPath),
            overflow,
            visibleText: (await page.locator('body').innerText()).slice(0, 1000)
        });
    }

    // ===== STAGE 1: Forstegangsbruker =====
    await page.goto(appUrl);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await checkpoint('s1-welcome', 'Ren nettleser, ingen lagret data.');
    const welcomeVisible = await page.locator('#welcomeScreen').isVisible();
    if (!welcomeVisible) {
        finding('S1-1', 'Forstegangsbruker', 'Velkomstskjerm vises ikke', 'Velkomst/navneskjerm skal vises', 'Kritisk', 'Apen app i ren profil', 'Ukjent', 'Vis welcomeScreen');
    }
    await page.locator('#studentNameInput').fill('QA-Elev');
    await page.locator('#welcomeScreen').getByRole('button', { name: /Start|Begynn|Kom i gang/ }).click();
    await checkpoint('s1-home-fresh', 'Hjem etter navneregistrering.');
    const storedName = await page.evaluate(() => localStorage.getItem('spansk123_studentName'));
    events.push({ step: 's1-storage', note: `studentName lagret lokalt: ${storedName}` });

    // ===== STAGE 2: Nivatest (diagnose) =====
    const startDiagnosisBtn = page.getByRole('button', { name: 'Start diagnose', exact: true });
    const diagnosisOffered = await startDiagnosisBtn.isVisible().catch(() => false);
    events.push({ step: 's2-offer', note: `Diagnose-CTA pa hjem for ny elev: ${diagnosisOffered}` });
    if (diagnosisOffered) await startDiagnosisBtn.click();

    const diagnosisModes = {};
    for (let i = 0; i < 12; i++) {
        const panel = page.locator('#diagnosisPanel');
        await expect(panel).toBeVisible();
        const mode = await panel.getAttribute('data-response-mode');
        diagnosisModes[mode] = (diagnosisModes[mode] || 0) + 1;
        if (i === 0 || i === 5) await checkpoint(`s2-diagnosis-q${i + 1}`, `Modus=${mode}`);
        const accepted = await panel.getAttribute('data-accepted-answer');
        if (mode === 'typed') {
            const input = page.locator('#diagnosisAnswerInput');
            await input.fill(i % 3 === 2 ? 'feilaktig svar' : (accepted || 'hola'));
            await input.press('Enter');
        } else if (i % 3 === 2) {
            await page.locator('#diagnosisPanel [data-option-id]').first().click();
        } else {
            await panel.getByRole('button', { name: accepted, exact: true }).click();
        }
        await expect(page.locator('[data-diagnosis-feedback]')).toBeVisible();
        if (i === 0) await checkpoint('s2-diagnosis-feedback', 'Tilbakemelding etter svar.');
        await page.getByRole('button', { name: /Neste|Se resultat/ }).click();
    }
    await checkpoint('s2-diagnosis-result', `Diagnose ferdig. Moduser: ${JSON.stringify(diagnosisModes)}`);
    events.push({ step: 's2-modes', note: JSON.stringify(diagnosisModes) });

    // ===== STAGE 3 + 7: Blandet quiz og resultatside =====
    await page.getByRole('button', { name: 'Start dagens quiz', exact: true }).click();
    const quiz1Modes = {};
    const quiz1Prompts = [];
    for (let i = 0; i < 10; i++) {
        const q = page.locator('.mixed-quiz-question');
        await expect(q).toBeVisible();
        const mode = await q.getAttribute('data-response-mode');
        quiz1Modes[mode] = (quiz1Modes[mode] || 0) + 1;
        quiz1Prompts.push((await q.innerText()).slice(0, 120));
        if (mode === 'select') await checkpoint(`s3-quiz1-select-q${i + 1}`, 'Nedtrekk (select) i quiz.');
        if (i === 0) await checkpoint('s3-quiz1-first', `Modus=${mode}`);
        if (mode === 'typed') {
            await page.locator('#mixedQuizAnswerInput').fill(i % 2 ? 'feil svar' : 'hola');
            await page.locator('#mixedQuizAnswerInput').press('Enter');
        } else if (mode === 'select') {
            const select = page.locator('#mixedQuizSelect');
            const options = await select.locator('option').allTextContents();
            await select.selectOption({ index: i % 2 ? 1 : Math.max(1, options.length - 1) });
            await page.getByRole('button', { name: 'Sjekk svar', exact: true }).click();
        } else {
            await page.locator('[data-mixed-answer]').nth(i % 2).click();
        }
        await expect(page.locator('#mixedQuizFeedback')).toContainText(/Riktig|Feil|Nesten/);
        if (i === 1) await checkpoint('s3-quiz1-feedback', 'Quiz-tilbakemelding.');
        await page.getByRole('button', { name: /Neste|Se resultat/ }).click();
    }
    await expect(page.locator('.mixed-quiz-review-item')).toHaveCount(10);
    await expect(page.locator('.mixed-quiz-result-actions-top')).toBeVisible();
    await checkpoint('s7-quiz1-results', `Resultatside quiz 1. Moduser: ${JSON.stringify(quiz1Modes)}`);
    events.push({ step: 's3-modes', note: `quiz1: ${JSON.stringify(quiz1Modes)}` });
    const streakText = await page.locator('#mixedQuizStreakSummary').innerText();
    events.push({ step: 's7-streak', note: streakText });

    // ===== STAGE 8: Ny quiz etter fullfort quiz =====
    await page.locator('.mixed-quiz-result-actions-top').getByRole('button', { name: /Ta en ny quiz/ }).click();
    const quiz2Prompts = [];
    for (let i = 0; i < 10; i++) {
        const q = page.locator('.mixed-quiz-question');
        await expect(q).toBeVisible();
        quiz2Prompts.push((await q.innerText()).slice(0, 120));
        const mode = await q.getAttribute('data-response-mode');
        if (mode === 'typed') {
            await page.locator('#mixedQuizAnswerInput').fill('hola');
            await page.locator('#mixedQuizAnswerInput').press('Enter');
        } else if (mode === 'select') {
            await page.locator('#mixedQuizSelect').selectOption({ index: 1 });
            await page.getByRole('button', { name: 'Sjekk svar', exact: true }).click();
        } else {
            await page.locator('[data-mixed-answer]').first().click();
        }
        await expect(page.locator('#mixedQuizFeedback')).toContainText(/Riktig|Feil|Nesten/);
        await page.getByRole('button', { name: /Neste|Se resultat/ }).click();
    }
    await checkpoint('s8-quiz2-results', 'Quiz 2 ferdig samme dag.');
    const overlap = quiz1Prompts.filter(p => quiz2Prompts.includes(p));
    events.push({ step: 's8-overlap', note: `Gjentatte sporsmal quiz1->quiz2: ${overlap.length}` });
    if (overlap.length > 0) {
        finding('S8-1', 'Ny quiz', `${overlap.length} sporsmal gjentatt i quiz 2 samme dag`, 'Ny quiz bor unnga dagens stilte sporsmal', 'Middels', 'Fullfor quiz, trykk Ta en ny quiz', 'excludeIds filtrerer ikke', 'Sjekk getTodayAskedQuestionIds og seed');
    }
    const streak2 = await page.locator('#mixedQuizStreakSummary').innerText();
    events.push({ step: 's8-streak', note: streak2 });
    if (!/2 quiz/.test(streak2)) {
        finding('S8-2', 'Ny quiz', `Streak-tekst etter 2 quizer: "${streak2}"`, 'Skal vise 2 quiz i dag', 'Lav', 'Ta to quizer samme dag', 'completeQuizForToday teller ikke', 'Sjekk quizStats');
    }

    // ===== STAGE 4: Grammatikk =====
    await page.locator('#navGrammar').click();
    await checkpoint('s4-grammar-topics', 'Grammatikk temaoversikt.');
    const grammarAudit = {};
    for (const topicId of ['gustar', 'demonstratives', 'possessives', 'articles']) {
        const topicNames = { gustar: /Gustar/, demonstratives: /Pekende/, possessives: /Eiendomsord/, articles: /Artikler/ };
        await page.locator('#grammarTopicGrid .grammar-topic-card').filter({ hasText: topicNames[topicId] }).first().click();
        // Teori-skjerm forst
        const startEx = page.getByRole('button', { name: /Start ovelser|Start øvelser/ });
        if (await startEx.isVisible().catch(() => false)) {
            if (topicId === 'demonstratives') {
                const theoryText = await page.locator('#grammarTheoryArea').innerText();
                events.push({ step: 's4-scaffold-demonstratives', note: theoryText.slice(0, 200) });
            }
            await checkpoint(`s4-${topicId}-theory`, 'Teori/scaffold for ovelser.');
            await startEx.click();
        }
        const items = [];
        for (let i = 0; i < 20; i++) {
            const area = page.locator('#grammarExerciseArea');
            const text = await area.innerText();
            if (/fullført|fullfort/i.test(text)) break;
            const data = await page.evaluate(() => {
                const ex = grammarExercises[grammarCurrentIndex];
                return ex ? { sentence: ex.sentence, answer: ex.answer, options: ex.options, no: ex.no || null, hint: ex.hint } : null;
            });
            if (!data) break;
            const contextVisible = await page.locator('.grammar-norwegian-context').isVisible().catch(() => false);
            items.push({ i, ...data, contextVisible });
            if (i === 0) await checkpoint(`s4-${topicId}-ex1`, `no-kontekst: ${data.no || 'MANGLER'}`);
            // Svar riktig via fasit fra app-state
            await page.evaluate(() => {
                const ex = grammarExercises[grammarCurrentIndex];
                const btn = [...document.querySelectorAll('.grammar-option')]
                    .find(b => b.textContent.trim().toLowerCase() === ex.answer.toLowerCase());
                btn.click();
            });
            await expect(page.locator('#grammarFeedback')).toContainText(/Riktig/);
            await page.locator('#grammarNextBtn').click();
        }
        grammarAudit[topicId] = items;
        await checkpoint(`s4-${topicId}-complete`, `${items.length} ovelser fullfort.`);
        // Tilbake til temaoversikt
        const velgTema = page.getByRole('button', { name: /Velg tema/ });
        if (await velgTema.isVisible().catch(() => false)) await velgTema.click();
    }
    fs.writeFileSync(path.join(artifactDir, 'grammar-audit.json'), JSON.stringify(grammarAudit, null, 2));
    for (const [topicId, items] of Object.entries(grammarAudit)) {
        const missing = items.filter(x => !x.no);
        if (missing.length && ['gustar', 'demonstratives', 'possessives'].includes(topicId)) {
            finding(`S4-${topicId}`, 'Grammatikk', `${missing.length} ovelser i ${topicId} mangler norsk kontekst`, 'Alle tvetydige temaer skal vise norsk betydning', 'Hoy', `Apne ${topicId}-ovelser`, 'grammarExerciseContextNo dekker ikke alle', 'Legg til no for alle items');
        }
    }

    // ===== STAGE 5: Verb =====
    await page.locator('#navVerbs').click();
    await checkpoint('s5-verb-settings', 'Verb innstillinger.');
    await page.getByRole('button', { name: /Start øving|Start oving/ }).click();
    let verbTableSeen = false;
    for (let i = 0; i < 10; i++) {
        const input = page.locator('#verbInput');
        if (!(await input.isVisible().catch(() => false))) break;
        const expected = await input.getAttribute('data-expected');
        if (i === 0) await checkpoint('s5-verb-q1', `Forventet: ${expected}`);
        await input.fill(i === 1 ? 'helt feil' : expected);
        await page.getByRole('button', { name: /Sjekk svar/ }).click();
        const feedback = page.locator('#verbFeedback');
        await expect(feedback).toContainText(/Riktig|Feil/);
        if (i === 1) {
            const fbText = await feedback.innerText();
            verbTableSeen = /hablo|hablas|habla|tabell|bøying/i.test(fbText);
            await checkpoint('s5-verb-wrong-feedback', 'Feil svar: bøyingstabell synlig?');
        }
        await page.getByRole('button', { name: /Neste|Se resultat|Avslutt/ }).click();
    }
    await checkpoint('s5-verb-done', `Verbøkt ferdig. Tabell ved feil: ${verbTableSeen}`);
    if (!verbTableSeen) {
        finding('S5-1', 'Verb', 'Feil svar viser ikke full bøyingstabell', 'README lover fullstendig bøyingstabell ved feil', 'Middels', 'Svar feil pa verbsporsmal', 'Manglende tabell i feedback', 'Vis konjugasjonstabell ved feil');
    }

    // ===== STAGE 6: Glosemodus =====
    await page.locator('#navVocab').click();
    await checkpoint('s6-vocab-home', 'Gloseinnstillinger med moduskort.');
    // Seed: gjor noen kort modne for aa teste response-moduser i repetisjon
    await page.evaluate(() => {
        const today = new Date();
        const yesterday = new Date(today.getTime() - 86400000).toISOString();
        let changed = 0;
        cards.forEach(c => {
            if (changed < 12 && c.category === 'tall') {
                c.noEs = { easeFactor: 2.5, interval: 3, repetitions: 5, nextReview: yesterday, lapses: 0 };
                c.esNo = { easeFactor: 2.5, interval: 3, repetitions: 5, nextReview: yesterday, lapses: 0 };
                changed++;
            }
        });
        saveData();
    });
    await page.reload();
    await page.locator('#navVocab').click();
    const reviewBtn = page.locator('.vocab-mode-card.review');
    await expect(reviewBtn).toBeVisible();
    const reviewMeta = await page.locator('#reviewModeMeta').innerText();
    events.push({ step: 's6-review-meta', note: reviewMeta });
    await reviewBtn.click();
    await checkpoint('s6-vocab-session-start', 'Repetisjonsokt startet med modne kort.');
    const vocabModes = {};
    for (let i = 0; i < 12; i++) {
        const studyVisible = await page.locator('#vocabStudy').isVisible().catch(() => false);
        if (!studyVisible) break;
        const mode = await page.evaluate(() => {
            const item = typeof sessionCards !== 'undefined' && sessionCards[sessionIndex];
            return item ? item.responseMode : 'unknown';
        });
        vocabModes[mode] = (vocabModes[mode] || 0) + 1;
        if (i === 0) await checkpoint('s6-vocab-card1', `Modus=${mode}`);
        if (mode === 'select') {
            await checkpoint(`s6-vocab-select-${i}`, 'Nedtrekk i glosemodus!');
            await page.locator('#vocabSelect').selectOption({ index: 1 });
            await page.getByRole('button', { name: /Sjekk/ }).click();
        } else if (mode === 'typed') {
            await page.locator('#vocabTypedInput').fill('hola');
            await page.locator('#vocabTypedInput').press('Enter');
        } else {
            await page.locator('#flashcardArea').click();
            const bra = page.getByRole('button', { name: /Bra/ });
            if (await bra.isVisible().catch(() => false)) await bra.click();
        }
        const again = page.getByRole('button', { name: /Igjen/ });
        const next = page.getByRole('button', { name: /Neste/ });
        if (await next.isVisible().catch(() => false)) await next.click();
        else if (await again.isVisible().catch(() => false)) {
            const braBtn = page.getByRole('button', { name: /Bra/ });
            if (await braBtn.isVisible().catch(() => false)) await braBtn.click();
        }
    }
    events.push({ step: 's6-modes', note: `Glosemodus response-moduser (12 modne kort): ${JSON.stringify(vocabModes)}` });
    await checkpoint('s6-vocab-after', 'Etter gloseokt.');

    // ===== STAGE 9: Eksport/import =====
    const stateBefore = await page.evaluate(() => ({
        cards: JSON.parse(localStorage.getItem('spansk123Data_v4') || '[]').length,
        grammar: localStorage.getItem('spansk123Grammar_v1'),
        learning: localStorage.getItem('spansk123_learningProgress_v1'),
        quizStats: localStorage.getItem('spansk123_quizStats_v1')
    }));
    // Full eksport fra Lekse-fanen
    await page.locator('#navHomework').click();
    const dlFull = page.waitForEvent('download');
    await page.getByRole('button', { name: /Last ned fremgang/ }).click();
    const fullFile = await dlFull;
    const fullPath = path.join(artifactDir, 'full-export.json');
    await fullFile.saveAs(fullPath);
    const fullData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    events.push({ step: 's9-full-export', note: `nokler: ${Object.keys(fullData).join(',')}` });

    // Kort-eksport fra Gloser-fanen
    await page.locator('#navVocab').click();
    await page.locator('.vocab-advanced summary').click();
    const dlCards = page.waitForEvent('download');
    await page.getByRole('button', { name: /Eksporter/ }).click();
    const cardsFile = await dlCards;
    const cardsPath = path.join(artifactDir, 'cards-export.json');
    await cardsFile.saveAs(cardsPath);
    const cardsData = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
    events.push({ step: 's9-cards-export', note: `nokler: ${Object.keys(cardsData).join(',')}` });
    if (!cardsData.learningProgress && fullData.learningProgress) {
        finding('S9-1', 'Eksport/import', 'Eksporter-knappen i Gloser eksporterer bare kort (v4), ikke quiz/grammatikk-fremgang', 'Alle eksportknapper bor gi full fremgang (v1)', 'Hoy', 'Gloser -> Statistikk/import -> Eksporter', 'exportProgress() eksporterer kun {cards}', 'Bruk exportAllProgress() overalt');
    }

    // Tøm og importer full fil
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('#studentNameInput').fill('QA-Elev');
    await page.locator('#welcomeScreen').getByRole('button', { name: /Start|Begynn|Kom i gang/ }).click();
    await page.locator('#navVocab').click();
    await page.locator('.vocab-advanced summary').click();
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Importer/ }).first().click();
    const fc = await chooser;
    await fc.setFiles(fullPath);
    await page.waitForTimeout(1000);
    await checkpoint('s9-after-import', 'Etter import av full fremgang.');
    const stateAfter = await page.evaluate(() => ({
        cards: JSON.parse(localStorage.getItem('spansk123Data_v4') || '[]').length,
        grammar: !!localStorage.getItem('spansk123Grammar_v1'),
        learning: !!localStorage.getItem('spansk123_learningProgress_v1')
    }));
    events.push({ step: 's9-restore', note: `for: ${JSON.stringify(stateBefore)}, etter: ${JSON.stringify(stateAfter)}` });
    if (stateAfter.cards !== stateBefore.cards) {
        finding('S9-2', 'Eksport/import', `Kort gjenopprettet: ${stateAfter.cards} vs ${stateBefore.cards}`, 'Alle kort skal gjenopprettes', 'Kritisk', 'Eksporter full, tom lagring, importer', 'Import mister kort', 'Sjekk importProgressData');
    }
    if (!stateAfter.learning) {
        finding('S9-3', 'Eksport/import', 'learningProgress ikke gjenopprettet etter import', 'Quiz-fremgang skal gjenopprettes', 'Hoy', 'Samme som over', 'learningProgress ikke i import', 'Sjekk importProgressData');
    }

    // ===== STAGE 10: Mobilvisning dekket av alle checkpoints (390x844) =====
    if (overflowViolations.length) {
        finding('S10-1', 'Mobilvisning', `Horisontal overflow pa: ${overflowViolations.join(', ')}`, 'Ingen horisontal scrolling pa mobil', 'Middels', 'Kjor audit pa 390px', 'For brede elementer', 'Fiks CSS');
    }

    fs.writeFileSync(path.join(artifactDir, 'manifest.json'), JSON.stringify({
        generatedAt: new Date().toISOString(),
        runner: 'qa-full-journey-audit',
        viewport: { width: 390, height: 844 },
        findings, events, consoleErrors, pageErrors, overflowViolations
    }, null, 2));

    console.log(`\n=== QA-AUDIT: ${findings.length} funn ===`);
    findings.forEach(f => console.log(`[${f.severity}] ${f.id}: ${f.what}`));
    console.log(`Console errors: ${consoleErrors.length}, page errors: ${pageErrors.length}`);

    expect(pageErrors).toEqual([]);
});
