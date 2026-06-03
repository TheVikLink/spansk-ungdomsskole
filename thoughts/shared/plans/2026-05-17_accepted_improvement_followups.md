# Accepted Improvement Followups

## Goal
Implement the remaining accepted project improvements: import/export compatibility tests, corrupt localStorage recovery, and chapter-focused vocabulary practice.

## Non-goals
- Do not add login, cloud sync, analytics, voice upload, or backend persistence.
- Do not remove current local export/import formats or change their JSON shape without migration.
- Do not collapse manual category selection; chapter focus is an additional fast path.
- Do not rewrite the single-file app architecture.

## Acceptance Criteria
- Supported import formats can be exercised through repeatable Playwright tests without manually driving a native file picker.
- Corrupt `spansk123Data_v4`, `spansk123Grammar_v1`, and `spansk123_practiceHistory` values do not prevent the app from loading, and the corrupt payload is preserved locally under a backup key.
- Vocabulary offers a chapter-focused practice path while keeping due reviews across all categories available and preserving existing review/mixed/new modes.
- All new behavior is covered by focused tests and existing regressions still pass.

## Files To Change
- `index.html`
- `package.json`
- `tests/import-export-compat.spec.js`
- `tests/storage-recovery.spec.js`
- `tests/chapter-focus.spec.js`
- `.beads/issues.jsonl`

## Test Plan
- `npm run test:import-export`
- `npm run test:storage-recovery`
- `npm run test:chapter-focus`
- `npm run test:backup-privacy`
- `npm run test:completion-header`
- `npm run check:content`
- `npm run check:tailwind`
- `git diff --check`

## Tasks
1. Add a small testable import/export interface, then cover each supported progress payload.
2. Add guarded JSON parsing and corrupt-payload preservation for localStorage loads.
3. Add chapter-focus data, UI entry point, queue selection, and a queue-composition regression.
4. Run full verification, close Beads, and sync.
