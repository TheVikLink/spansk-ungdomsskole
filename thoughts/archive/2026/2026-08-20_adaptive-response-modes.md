# Adaptive response modes

## Goal

Add a privacy-safe `select` response mode and use it as a deliberate bridge between recognition and typed production for A0–A1 learners.

## Non-goals

- Do not remove typed production from verbs or productive-anchor items.
- Do not make the mixed quiz predominantly select-based.
- Do not add free-text self-marking, accounts, analytics, or new persistence fields.
- Do not change diagnosis response contracts until the mixed quiz/select slice is stable.

## First slice

1. Add pure option-building and response-mode helpers.
2. Render `select` as a real labeled `<select>` with a neutral placeholder and 3–4 diagnostic options.
3. Ensure selecting an option is not submission; the student must explicitly press/check the answer.
4. Add select support to mixed-quiz scoring and feedback.
5. Use select for existing recognition-oriented skill items and a small controlled vocabulary subset.
6. Keep typed/choice behavior unchanged and verify export/import compatibility.

## Later slices

- Replace static typed-review percentage with strength-aware mode selection.
- Balance mixed quizzes around 3 typed, 3 select, 2 choice, and 2 adaptive/review items, with fallback rules for small pools.

## Acceptance criteria

- Every select item has one correct option, 2–3 plausible distractors, a placeholder, and an explicit check action.
- The correct answer is not revealed before submission.
- `answerMixedQuizItem()` accepts select labels/options using the same correctness and near-miss semantics as typed/choice.
- Existing choice and typed tests remain green.
- New-mode tests cover rendering, keyboard selection, submission, wrong feedback, and no-answer submission.
- Mixed-quiz mode distribution is deterministic and bounded; no 10-item quiz exceeds 6 typed items when enough select/choice candidates exist.
- No local-storage schema or export/import format changes.

## Files

- `index.html`
- `tests/adaptive-quiz.spec.js`
- `tests/vocab-learning-mechanics.spec.js`
- `thoughts/shared/plans/2026-08-20_adaptive-response-modes.md`

## Verification

```bash
npx playwright test tests/adaptive-quiz.spec.js tests/vocab-learning-mechanics.spec.js --browser chromium --workers=1
npm run build:css
npm run check:tailwind
git diff --check
npm run test:all
```
