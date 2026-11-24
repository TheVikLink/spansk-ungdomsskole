# Plan: preserve vocabulary identity during sparse-ID migration (`spansk-ungdomsskole-7zz`)

## Goal

Upgrade a saved vocabulary profile with sparse numeric card IDs without creating duplicate IDs or redirecting a rating to another card.

## Non-goals

- Do not reconcile renamed or corrected canonical vocabulary pairs; that is `spansk-ungdomsskole-rtz`.
- Do not change export schema, custom-card matching, or existing card IDs.
- Do not alter learner-facing vocabulary content or the active listening feature work.

## Acceptance criteria

1. `mergeNewVocabulary()` never assigns an ID already held by a saved or previously appended card.
2. A sparse legacy fixture migrates deterministically and idempotently while preserving its original ID and review data.
3. Rating an appended card updates its own review data, not an existing card with the former colliding ID.
4. A full export can import, reload through `loadData()`, and export again without losing either the legacy card or its progress.
5. Existing import/export compatibility and full app verification remain green.

## Files to change

- `tests/import-export-compat.spec.js` — add the end-to-end sparse-ID migration regression.
- `index.html` — allocate a collision-free numeric ID only when appending a missing canonical card.

## Test plan

1. Add a Playwright test that imports a `spansk123_export_v1` fixture containing one eligible custom card with `id: 1` and nonzero review data. It deliberately omits the first glossary pair `1 / uno`, so the previous `cards.length` allocator would append that known pair with the same ID `1`.
2. Reload into the imported student profile so the real startup path calls `loadData()`, then assert that the custom card keeps ID/progress, `1 / uno` is appended with a distinct ID, all IDs are unique, and the exported payload preserves both cards.
3. Rate the appended `1 / uno` card through `rateCard()` and assert only that card’s review state changes.
4. Run `npm run test:import-export`; it must fail before the fix because the old allocator reuses ID `1`.
5. Implement the smallest local allocator change in `mergeNewVocabulary()`.
6. Re-run `npm run test:import-export` until green.
7. Run `npm run build:app` and `npm run test:all`.
8. Check `git diff --check`, verify Beads dependencies are acyclic, close and sync the issue.

## Steps

1. Read the migration and rating paths, confirm the first duplicate ID is created at append time, and retain the original saved-ID values as the compatibility boundary.
2. Write the failing regression through the real browser app and observe the failure.
3. Replace `cards.length` with a monotonic collision-free allocator: preserve all existing IDs untouched, collect finite nonnegative integer IDs, start at one above their maximum (or zero when none exist), increment until unused, and add each allocation to the set.
4. Verify migration idempotence and rating identity through the regression, then run the project gates.
