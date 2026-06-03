# Project Improvement Privacy Resilience

## Goal
Implement the highest-confidence immediate improvements from the project critique without changing the no-login local-first classroom flow.

## Non-goals
- No login, cloud sync, analytics, backend persistence, or voice recording.
- No export/import format change.
- No broad rewrite of `index.html`.

## Acceptance Criteria
- Downloaded progress backup filenames do not expose the student's fornavn/elevkode.
- "Slett all data" removes all app-owned localStorage keys, including preserved corrupt recovery payloads, while leaving unrelated browser keys alone.
- Focused Playwright privacy tests pass.
- Existing import/export, storage recovery, chapter focus, content, and Tailwind checks still pass.

## Files To Change
- `index.html`
- `tests/backup-privacy.spec.js`
- `thoughts/shared/plans/2026-06-03_project_improvement_privacy_resilience.md`

## Test Plan
- Red/green: `npx playwright test tests/backup-privacy.spec.js --browser chromium`
- Regression: `npm run test:import-export`
- Regression: `npm run test:storage-recovery`
- Regression: `npm run test:chapter-focus`
- Regression: `npm run test:completion-header`
- Static/content: `npm run check:content`
- Static/design adoption: `npm run check:tailwind`
- Patch hygiene: `git diff --check`

## Tasks
1. Add a failing backup privacy test for identifier-free export filenames.
2. Implement a small filename helper and route progress export through it.
3. Add a failing backup privacy test for complete app-owned localStorage deletion.
4. Implement a scoped local app data cleanup helper and route reset through it.
5. Run fresh verification and close/sync the Beads task.
