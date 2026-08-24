# Full curriculum language and answer-acceptance audit

## Goal

Make every curriculum exercise linguistically accurate and fair: accept all pedagogically correct answers, or give a clear context hint before requiring one specific form.

## Non-goals

- No new login, cloud storage, analytics, or student-data collection.
- No broad rewrite of the single-file app.
- No silent acceptance of answers that change the intended meaning or grammar target.

## Acceptance criteria

- Every vocabulary, grammar, verb, game, diagnosis, and mixed-quiz item has a documented answer contract.
- Synonym pairs such as `comenzar`/`empezar` are both accepted when the Norwegian prompt does not distinguish them.
- Context-sensitive answers are either all accepted when equivalent or the prompt explicitly constrains the expected form.
- Article forms, Norwegian definite forms, Spanish accents, case, punctuation, and reasonable infinitive/conjugation variants are tested consistently.
- Automated catalog checks fail on missing answer metadata, duplicate/ambiguous choices, or an answer contract that rejects an approved equivalent.
- Full browser and content checks pass before merging.

## Files to change

- `index.html` — source catalog, answer contracts, validation, and feedback.
- `tests/` — catalog and browser regression coverage.
- `scripts/` — pure catalog audit checks where useful.
- `thoughts/shared/plans/` — audit findings and decisions.

## Test plan

- `npm run check:content`
- `npm run check:diagnosis-catalog`
- `npm run check:learning-catalog`
- `npx playwright test tests/adaptive-quiz.spec.js tests/vocab-learning-mechanics.spec.js tests/grammar-explanations.spec.js --workers=1 --browser chromium`
- `git diff --check`

## Steps

1. Inventory every catalog and exercise producer, including vocabulary, diagnosis, grammar, verbs, games, and mixed quiz.
2. Extract current accepted answers and identify prompts with synonyms, multiple valid Norwegian forms, or context-dependent Spanish choices.
3. Define a small, explicit answer-contract format that keeps validation pure and preserves exact-match exercises where exactness is intentional.
4. Add failing tests for representative synonym, article, accent, conjugation, and context cases, including `comenzar`/`empezar`.
5. Update content and validation logic with the smallest safe changes.
6. Run the complete verification set, review all remaining ambiguous items manually, commit, and update the Beads issue.
