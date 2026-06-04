# Directed Learning Improvements

## Goal
Remove the weak chatbot and add higher-value local-first learning mechanics for vocabulary, grammar, offline use, and UI regression coverage.

## Non-goals
- No login, backend, cloud sync, analytics, microphone, or AI chatbot.
- No broad architecture migration out of `index.html`.
- No fuzzy accent matching for typed Spanish answers.

## Acceptance Criteria
- Chatbot navigation, page markup, and chatbot script are gone.
- Cards with identical prompt-side text show a first-letter answer hint, e.g. `å forstå (e)` and `å forstå (c)`.
- A fixed percentage of review cards are typed-answer cards; case is ignored, accents must be exact.
- Leech cards with repeated failures are prioritized ahead of normal due cards, even if scheduled in the future.
- Wrong grammar answers show a short topic-specific explanation.
- The app exposes a manifest and service worker for offline use.
- Playwright covers vocabulary mechanics, grammar explanations, PWA/UI smoke, and no-chatbot behavior.

## Files To Change
- `index.html`
- `package.json`
- `manifest.webmanifest`
- `sw.js`
- `tests/vocab-learning-mechanics.spec.js`
- `tests/grammar-explanations.spec.js`
- `tests/pwa-and-ui-smoke.spec.js`
- `tests/teacher-glossary-import.spec.js`
- `thoughts/shared/plans/2026-06-04_directed_learning_improvements.md`

## Test Plan
- Red/green: `npx playwright test tests/vocab-learning-mechanics.spec.js --browser chromium`
- Red/green: `npx playwright test tests/grammar-explanations.spec.js --browser chromium`
- Red/green: `npx playwright test tests/pwa-and-ui-smoke.spec.js --browser chromium`
- Regression: `npm run test:teacher-import`
- Full gate: `npm run test:all`
- Patch hygiene: `git diff --check`

## Tasks
1. Remove chatbot UI, script, and tests.
2. Add vocabulary helper tests for ambiguity hints, typed review, accent checking, and leech priority.
3. Implement the vocabulary helpers and session integration.
4. Add grammar explanation tests and display logic.
5. Add PWA manifest/service worker and UI smoke checks.
6. Run verification, close Beads, and sync.
