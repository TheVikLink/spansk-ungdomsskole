# Chapter Text Import Duplicate Sync

## Goal
Prototype teacher-friendly chapter vocabulary import from pasted OCR text and support duplicate chapter/category cards with shared progress.

## Non-goals
- No cloud OCR or image upload.
- No bundled textbook scans or extracted copyrighted content.
- No full automatic yellow-box detection in this pass.
- No login, backend, analytics, or teacher dashboard.

## Acceptance Criteria
- Teachers can open a chapter import dialog, paste OCR text, preview editable rows, delete/edit rows, and import them as glossary cards.
- Lines separated by tab, multiple spaces, or spaced dash parse into Norwegian-Spanish pairs.
- Slash alternatives like `entender / comprender` become separate cards.
- Same Norwegian-Spanish pair is allowed in a different category, but still rejected in the same category.
- Reviewing one duplicate pair syncs the same direction's spaced-repetition state to matching cards in other categories.
- New behavior is covered by Playwright and included in `npm run test:all`.

## Files To Change
- `index.html`
- `package.json`
- `tests/chapter-text-import.spec.js`
- `tests/teacher-glossary-import.spec.js`
- `thoughts/shared/plans/2026-06-04_chapter_text_import_duplicate_sync.md`

## Test Plan
- Red/green: `npx playwright test tests/chapter-text-import.spec.js --browser chromium`
- Regression: `npx playwright test tests/teacher-glossary-import.spec.js --browser chromium`
- Full gate: `npm run test:all`
- Patch hygiene: `git diff --check`

## Tasks
1. Add parser, duplicate-policy, and progress-sync tests.
2. Add a paste-OCR chapter import dialog with editable preview rows.
3. Change duplicate validation to same-category only.
4. Sync spaced-repetition progress across matching duplicate cards.
5. Add the new suite to package verification.
6. Run verification, close/sync Beads, and report remaining OCR-library decision.
