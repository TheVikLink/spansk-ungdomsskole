# Fix vocabulary entry point and quiz feedback

## Goal

Make new-word practice start reliably, remove legacy chapter categories from the learner-facing glossary list, and provide immediate feedback for every quiz answer.

## Non-goals

- No backend, login, analytics, or cloud data changes.
- No redesign of the vocabulary or quiz architecture.
- No deletion of the underlying vocabulary; chapter words are reassigned to existing relevant categories.

## Acceptance criteria

- Clicking “Lære nye ord” with selected categories starts a new-word session or gives a clear actionable explanation.
- “Kapittel 7: gloser” and “Kapittel 8: Tareas de casa” do not appear as selectable categories or chapter cards.
- Existing saved cards are migrated to the new categories by word pair without losing progress.
- Typed adaptive vocabulary cards accept submission and show correct/incorrect feedback.
- Mixed quiz includes typed, dropdown-select, and multiple-choice modes when candidates support them.
- Each submitted quiz answer shows feedback before the next question.

## Files to change

- `index.html`
- `tests/adaptive-quiz.spec.js`
- `tests/student-learning-flow-audit.spec.js` (only if the expected entry flow changes)

## Test plan

- Run the focused Playwright tests for adaptive quiz and student learning flow.
- Run `git diff --check`.
- Manually verify the static app at desktop and mobile widths, including fresh local storage and an existing saved-data migration.

## Steps

1. Add failing browser tests for the new-word launch, category migration, typed response submission, and immediate quiz feedback.
2. Implement the smallest fixes in `index.html`.
3. Run focused tests, then the full available Playwright suite.
4. Inspect the final diff and update/close the Beads issue with verification evidence.
