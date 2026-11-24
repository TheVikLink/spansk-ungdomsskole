# Mixed adaptive quiz v1 implementation plan

## Goal
Add a local 10-question quiz that mixes vocabulary, grammar, and verb microskills using deterministic weak/due/confidence selection and the existing progress schema.

## Non-goals
- No streaks, badges, cloud sync, analytics, accounts, or start-page redesign.
- No replacement of the existing vocabulary, verb, grammar, games, or homework tabs.
- No A2/B1/B2 content expansion in this slice.

## Acceptance criteria
- `buildMixedQuiz` is deterministic for fixed `now`, `seed`, and inputs.
- Target mix is 4 vocabulary, 3 skill, 2 recent/diagnosed weak, and 1 confidence item when candidates allow it; documented fallback fills to 10.
- Due/weak, lapse count, age, and stable ID ordering follow the contract.
- No duplicate question IDs or duplicate word-direction pairs occur.
- Diagnosis must be complete or explicitly skipped before personalized quiz selection.
- Each submitted answer updates exactly one existing word-direction or skill progress cell.
- The quiz is keyboard usable and manual tabs remain available.

## Files to change
- `index.html` - pure selection/progress helpers and mixed quiz UI/session.
- `tests/adaptive-quiz.spec.js` - selection, fallback, duplicate, progress, and UI tests.
- `package.json` - `test:adaptive-quiz` and `test:all` registration.
- `thoughts/shared/plans/2026-08-07_adaptive_quiz_brainmap_redesign.md` - mark the mixed quiz slice as implemented and record any deliberate v1 simplifications.

## Steps
1. Add one failing deterministic-selection test and verify it fails because the engine is absent.
2. Implement candidate normalization and deterministic bucket selection; verify model tests.
3. Add answer handling that updates one progress cell; verify transition and fallback tests.
4. Add a compact quiz panel reachable from the existing app without removing manual activities.
5. Add UI and mobile regression checks; run the full project suite.

## Test plan
- `npm run test:adaptive-quiz`
- `npm run test:learning-progress`
- `npm run test:brainmap`
- `npm run test:diagnosis`
- `npm run test:import-export`
- `npm run test:pwa-ui`
- `npm run check:content`
- `npm run check:tailwind`
- `git diff --check`
