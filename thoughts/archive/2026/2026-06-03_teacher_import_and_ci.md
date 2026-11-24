# Teacher Import And CI

## Goal
Ship the next low-risk project improvements: safer teacher glossary imports and repeatable CI verification.

## Non-goals
- No login, cloud sync, analytics, backend persistence, or student data collection.
- No export/import progress format change.
- No broad `index.html` architecture rewrite.

## Acceptance Criteria
- Teacher glossary imports are analyzed before mutation and report row-level skipped reasons.
- The existing JSON teacher import formats still work.
- Importing a teacher file requires a preview confirmation when valid rows exist.
- New teacher import behavior has focused Playwright coverage.
- CI runs the same content, Tailwind, and Playwright verification gates used locally.

## Files To Change
- `index.html`
- `package.json`
- `.github/workflows/ci.yml`
- `tests/teacher-glossary-import.spec.js`
- `thoughts/shared/plans/2026-06-03_teacher_import_and_ci.md`

## Test Plan
- Red/green: `npx playwright test tests/teacher-glossary-import.spec.js --browser chromium`
- Full local gate: `npm run test:all`
- Patch hygiene: `git diff --check`

## Tasks
1. Add failing teacher glossary validation tests.
2. Extract import analysis, preview, and apply helpers.
3. Route the existing file-picker import through the helpers.
4. Add npm scripts for teacher import and full verification.
5. Add GitHub Actions CI for the local verification suite.
6. Run verification, close Beads, and sync.
