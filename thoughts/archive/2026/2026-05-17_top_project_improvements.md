# Top Project Improvements

## Goal
Ship the highest-value low-risk improvements from a full project critique: content correctness, local progress recoverability, and privacy clarity.

## Non-goals
- Do not add login, cloud sync, analytics, recording, or backend persistence.
- Do not rewrite the single-file app architecture.
- Do not change export/import JSON formats.
- Do not remove Google Forms homework delivery in this pass.

## Acceptance Criteria
- Known Spanish/Norwegian glossary errors are corrected and covered by a repeatable content-quality check.
- Homework/progress UI tells students when they last exported a local backup and nudges them to export when stale.
- The app asks for "fornavn eller elevkode" instead of a broad full-name prompt, and explains that this identifier is stored locally and used for homework delivery.
- New checks are available through `npm` scripts and pass together with existing completion-header tests.

## Files To Change
- `index.html`
- `package.json`
- `scripts/check-content-quality.mjs`
- `tests/backup-privacy.spec.js`
- `thoughts/shared/plans/2026-05-17_top_project_improvements.md`

## Test Plan
- Red: `npm run check:content` fails before the glossary corrections.
- Red: `npx playwright test tests/backup-privacy.spec.js --browser chromium` fails before backup/privacy UI changes.
- Green: `npm run check:content`.
- Green: `npx playwright test tests/backup-privacy.spec.js --browser chromium`.
- Regression: `npm run test:completion-header`.
- Static: `git diff --check`.

## Tasks
1. Add a content-quality check for known high-confidence glossary mistakes, then correct the data.
2. Add a Playwright test for privacy wording and backup status, then implement the UI/state changes.
3. Run fresh verification and update Beads.
