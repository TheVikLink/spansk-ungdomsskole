import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

let server;
let origin;

test.beforeAll(async () => {
  server = createServer(async (request, response) => {
    const name = new URL(request.url, 'http://localhost').pathname.slice(1);
    const file = name === 'school' ? 'school.html' : name;
    if (!['school.html', 'school.js', 'school.css'].includes(file)) { response.writeHead(404).end(); return; }
    response.setHeader('content-type', file.endsWith('.js') ? 'text/javascript; charset=utf-8' : file.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/html; charset=utf-8');
    response.end(await readFile(resolve('server/public', file)));
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  origin = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(async () => { await new Promise((done) => server.close(done)); });

test('retries an uncertain homework save with the identical event and warns before discard', async ({ page }) => {
  const attempts = [];
  let serverCommitted = false;
  let wrongAnswerSaved = false;
  await page.route(`${origin}/api/**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/runtime-mode') return route.fulfill({ json: { localOidcTest: false } });
    if (url.pathname === '/api/session') return route.fulfill({ json: { userId: '50000000-0000-4000-8000-000000000001', role: 'student', displayName: 'Syntetisk elev' } });
    if (url.pathname === '/api/assignments' && route.request().method() === 'GET') return route.fulfill({ json: { assignments: [{ id: '30000000-0000-4000-8000-000000000001', title: 'Spørsmål', area: 'vocabulary', className: 'Spansk 8', answered: Number(wrongAnswerSaved), questionCount: 1 }] } });
    if (url.pathname.endsWith('/30000000-0000-4000-8000-000000000001') && route.request().method() === 'GET') return route.fulfill({ json: {
      assignment: { id: '30000000-0000-4000-8000-000000000001', title: 'Spørsmål', area: 'vocabulary', dueAt: null },
      exercise: { questionCount: 1, questions: [{ id: 'vocab.1', prompt: 'Hvordan sier du «hola»?', options: [{ id: 'answer.hola', text: 'hei' }, { id: 'answer.adios', text: 'ha det' }] }] },
      answers: wrongAnswerSaved ? [{ question_id: 'vocab.1', outcome: 'incorrect' }] : [], practiceSession: '40000000-0000-4000-8000-000000000001',
    } });
    if (url.pathname.endsWith('/answers') && route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      if (body.answerId === 'answer.adios') {
        wrongAnswerSaved = true;
        return route.fulfill({ json: { outcome: 'incorrect', explanation: 'Hola betyr hei.' } });
      }
      attempts.push(body);
      if (attempts.length === 1) {
        serverCommitted = true;
        return route.abort('failed');
      }
      expect(serverCommitted).toBe(true);
      expect(body).toEqual(attempts[0]);
      return route.fulfill({ json: { duplicate: true, outcome: 'correct', explanation: 'Du fant riktig svar.' } });
    }
    return route.fulfill({ status: 404, json: { error: 'Not found' } });
  });

  await page.goto(`${origin}/school.html`);
  await expect(page.locator('main button').first()).toHaveText('Start lekse');
  await expect(page.locator('main li')).toContainText('Spansk 8');
  await page.getByRole('button', { name: 'Start lekse' }).click();
  await page.getByLabel('ha det', { exact: true }).check();
  await page.getByRole('button', { name: 'Sjekk svaret' }).click();
  await expect(page.getByRole('status')).toContainText('Ikke helt.');
  const retryAnswer = page.getByRole('button', { name: 'Prøv et nytt svar' });
  await expect(retryAnswer).toBeFocused();
  await page.getByRole('button', { name: 'Se resultat' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Se lekse' }).click();
  await expect(page.getByRole('heading', { name: 'Leksen er gjennomført' })).toBeVisible();
  await page.getByRole('button', { name: 'Øv igjen på feil svar' }).click();
  await page.getByLabel('hei').check();
  await page.getByRole('button', { name: 'Sjekk svaret' }).click();
  await expect(page.getByText(/Svaret er ikke bekreftet lagret/)).toBeVisible();

  await expect(page.getByRole('button', { name: 'Prøv å lagre igjen' })).toBeFocused();
  await expect(page.getByRole('status')).toHaveCount(1);

  const unload = await page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(unload).toBe(true);
  let logoutSent = false;
  await page.route(`${origin}/auth/logout`, async route => {
    logoutSent = true;
    await route.fulfill({ status: 503, body: 'Unexpected logout while an answer is pending' });
  });
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Logg ut', exact: true }).click();
  expect(logoutSent).toBe(false);
  await expect(page.getByText(/Svaret er ikke bekreftet lagret/)).toBeVisible();
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: '← Mine lekser' }).click();
  await expect(page.getByText('Oppgave 1 av 1')).toBeVisible();
  await page.getByRole('button', { name: 'Prøv å lagre igjen' }).click();
  await expect(page.getByText(/Svar lagret/)).toBeVisible();
  await expect(page.getByText(/Svaret er ikke bekreftet lagret/)).toHaveCount(0);
  const resultButton = page.getByRole('button', { name: 'Se resultat' });
  await expect(resultButton).toBeFocused();
  await resultButton.press('Enter');
  await expect(page.getByText('Ordforråd – 1/1 besvart')).toBeVisible();
  await expect(page.getByText('1 oppgave er lagret.', { exact: false })).toBeVisible();
  expect(attempts).toHaveLength(2);
  expect(attempts[1]).toEqual(attempts[0]);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});


test('expired lesson session preserves the memory queue and retries only after same-user reauthentication', async ({ page }) => {
  let expired = false;
  let popupStarted = false;
  const submissions = [];
  await page.route(`${origin}/api/**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/runtime-mode') return route.fulfill({ json: { localOidcTest: false } });
    if (url.pathname === '/api/session') {
      if (expired && !popupStarted) return route.fulfill({ status: 401, json: { error: 'Utløpt' } });
      return route.fulfill({ json: { userId: '50000000-0000-4000-8000-000000000001', role: 'student', displayName: 'Syntetisk elev' } });
    }
    if (url.pathname === '/api/assignments' && route.request().method() === 'GET') return route.fulfill({ json: { assignments: [{ id: '30000000-0000-4000-8000-000000000001', title: 'Spørsmål', area: 'vocabulary', answered: 0, questionCount: 1 }] } });
    if (url.pathname.endsWith('/30000000-0000-4000-8000-000000000001') && route.request().method() === 'GET') return route.fulfill({ json: {
      assignment: { id: '30000000-0000-4000-8000-000000000001', title: 'Spørsmål', area: 'vocabulary', dueAt: null },
      exercise: { questionCount: 1, questions: [{ id: 'vocab.1', prompt: 'Hvordan sier du «hola»?', options: [{ id: 'answer.hola', text: 'hei' }] }] },
      answers: submissions.length > 1 ? [{ question_id: 'vocab.1', outcome: 'correct' }] : [], practiceSession: '40000000-0000-4000-8000-000000000001',
    } });
    if (url.pathname.endsWith('/answers') && route.request().method() === 'POST') {
      submissions.push(route.request().postDataJSON());
      if (submissions.length === 1) {
        expired = true;
        return route.fulfill({ status: 401, json: { error: 'Utløpt' } });
      }
      return route.fulfill({ json: { duplicate: true, outcome: 'correct', explanation: 'Du fant riktig svar.' } });
    }
    return route.fulfill({ status: 404, json: { error: 'Not found' } });
  });
  await page.context().route(`${origin}/auth/login`, async (route) => {
    popupStarted = true;
    await route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Syntetisk reinnlogging</title><p>Testvindu</p>' });
  });

  await page.goto(`${origin}/school.html`);
  await page.getByRole('button', { name: 'Start lekse' }).click();
  await page.getByLabel('hei').check();
  await page.getByRole('button', { name: 'Sjekk svaret' }).click();
  await expect(page.getByRole('heading', { name: 'Leksebesvarelsen venter i minnet' })).toBeVisible();
  expect(submissions).toHaveLength(1);
  await page.getByRole('button', { name: 'Logg inn igjen og lagre' }).click();
  await expect.poll(() => popupStarted, { timeout: 2000 }).toBe(true);
  await expect(page.getByText('Leksen er gjennomført')).toBeVisible({ timeout: 5000 });
  expect(submissions).toHaveLength(2);
  expect(submissions[1]).toEqual(submissions[0]);
});

test('never sends a pending homework answer after a different student logs in', async ({ page }) => {
  let expired = false;
  let popupStarted = false;
  const submissions = [];
  await page.route(`${origin}/api/**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/runtime-mode') return route.fulfill({ json: { localOidcTest: false } });
    if (url.pathname === '/api/session') {
      if (expired && !popupStarted) return route.fulfill({ status: 401, json: { error: 'Utløpt' } });
      return route.fulfill({ json: { userId: popupStarted ? '50000000-0000-4000-8000-000000000002' : '50000000-0000-4000-8000-000000000001', role: 'student', displayName: 'Syntetisk elev' } });
    }
    if (url.pathname === '/api/assignments' && route.request().method() === 'GET') return route.fulfill({ json: { assignments: [{ id: '30000000-0000-4000-8000-000000000001', title: 'Spørsmål', area: 'vocabulary', answered: 0, questionCount: 1 }] } });
    if (url.pathname.endsWith('/30000000-0000-4000-8000-000000000001') && route.request().method() === 'GET') return route.fulfill({ json: {
      assignment: { id: '30000000-0000-4000-8000-000000000001', title: 'Spørsmål', area: 'vocabulary', dueAt: null },
      exercise: { questionCount: 1, questions: [{ id: 'vocab.1', prompt: 'Hvordan sier du «hola»?', options: [{ id: 'answer.hola', text: 'hei' }] }] },
      answers: [], practiceSession: '40000000-0000-4000-8000-000000000001',
    } });
    if (url.pathname.endsWith('/answers') && route.request().method() === 'POST') {
      submissions.push(route.request().postDataJSON()); expired = true;
      return route.fulfill({ status: 401, json: { error: 'Utløpt' } });
    }
    return route.fulfill({ status: 404, json: { error: 'Not found' } });
  });
  await page.context().route(`${origin}/auth/login`, async (route) => {
    popupStarted = true;
    await route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Syntetisk kontobytte</title>' });
  });
  await page.goto(`${origin}/school.html`);
  await page.getByRole('button', { name: 'Start lekse' }).click();
  await page.getByLabel('hei').check();
  await page.getByRole('button', { name: 'Sjekk svaret' }).click();
  await page.getByRole('button', { name: 'Logg inn igjen og lagre' }).click();
  await expect(page.getByText('En annen konto ble logget inn')).toBeVisible();
  expect(submissions).toHaveLength(1);
  await expect(page.getByRole('button', { name: 'Forkast svaret og fortsett med innlogget konto' })).toBeVisible();
});

test('a BFCache-restored school page reloads and resolves the current account again', async ({ page }) => {
  let sessionCalls = 0;
  await page.route(`${origin}/api/**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/runtime-mode') return route.fulfill({ json: { localOidcTest: false } });
    if (url.pathname === '/api/session') {
      sessionCalls += 1;
      const secondAccount = sessionCalls > 1;
      return route.fulfill({ json: {
        userId: secondAccount ? '50000000-0000-4000-8000-000000000002' : '50000000-0000-4000-8000-000000000001',
        role: 'student', displayName: secondAccount ? 'Syntetisk konto B' : 'Syntetisk konto A',
      } });
    }
    if (url.pathname === '/api/assignments') return route.fulfill({ json: { assignments: [] } });
    return route.fulfill({ status: 404, json: { error: 'Not found' } });
  });
  await page.goto(`${origin}/school.html`);
  await expect(page.getByText('Syntetisk konto A')).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect(page.getByText('Syntetisk konto B')).toBeVisible();
  expect(sessionCalls).toBe(2);
});

test('a shared-browser tab clears the prior teacher view when another account becomes active', async ({ page }) => {
  let activeAccount = 'A';
  let sessionCalls = 0;
  await page.clock.install();
  await page.route(`${origin}/api/**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/runtime-mode') return route.fulfill({ json: { localOidcTest: false } });
    if (url.pathname === '/api/session') {
      sessionCalls += 1;
      return route.fulfill({ json: {
        userId: activeAccount === 'A' ? '50000000-0000-4000-8000-000000000001' : '50000000-0000-4000-8000-000000000002',
        role: 'teacher', displayName: `Syntetisk lærer ${activeAccount}`,
      } });
    }
    if (url.pathname === '/api/classes') return route.fulfill({ json: { classes: activeAccount === 'A' ? [
      { id: '60000000-0000-4000-8000-000000000001', name: 'Privat klasse for A', schoolYear: '2026-2027', studentCount: 1, pendingMemberCount: 0 },
    ] : [] } });
    if (url.pathname === '/api/activities') return route.fulfill({ json: { activities: [] } });
    if (url.pathname === '/api/assignments') return route.fulfill({ json: { assignments: [] } });
    return route.fulfill({ status: 404, json: { error: 'Not found' } });
  });

  await page.goto(`${origin}/school.html`);
  await expect(page.getByText('Syntetisk lærer A')).toBeVisible();
  const privateClassRow = page.locator('li').filter({ hasText: 'Privat klasse for A' });
  await expect(privateClassRow).toBeVisible();

  activeAccount = 'B'; // Another tab completed a same-origin login and replaced the session cookie.
  await page.clock.fastForward(120_000); // The first tab is left open and idle; no click should be required.
  await expect(page.getByText('Syntetisk lærer B')).toBeVisible();
  await expect(privateClassRow).not.toBeVisible();
  await expect(page.getByText('Du har ikke opprettet noen klasser ennå.')).toBeVisible();
  expect(sessionCalls).toBeGreaterThanOrEqual(3);
});

test('returning to the feed cannot restore a previous pending school response', async ({ page }) => {
  let requests = 0;
  let releasePrevious;
  const previous = new Promise(resolve => { releasePrevious = resolve; });
  await page.route(`${origin}/practice-test`, route => route.fulfill({
    contentType: 'text/html',
    body: '<section><div id="priority" hidden></div></section>'
  }));
  await page.route(`${origin}/api/assignments?studentFeed=1`, async route => {
    requests++;
    if (requests > 1) return route.fulfill({ json: { assignments: [] } });
    await previous;
    await route.fulfill({ json: { assignments: [
      { id: 'prior-class', title: 'Lekse fra forrige økt', className: 'Spansk 8',
        answered: 0, questionCount: 1, pinnedUntil: new Date(Date.now() + 60_000).toISOString() }
    ] } }).catch(() => {}); // The old request may already have been cancelled.
  });

  try {
    await page.goto(`${origin}/practice-test`);
    await page.evaluate(async () => {
      const { mountSchoolFeedPriority } = await import('/school.js');
      mountSchoolFeedPriority(document.getElementById('priority'));
    });
    await expect.poll(() => requests).toBe(1);
    await page.evaluate(() => {
      window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });
    await expect(page.getByRole('link', { name: 'Mine lekser' })).toBeVisible();
    releasePrevious();
    await expect(page.getByText('Lekse fra forrige økt')).toHaveCount(0);
  } finally {
    releasePrevious();
  }
});
