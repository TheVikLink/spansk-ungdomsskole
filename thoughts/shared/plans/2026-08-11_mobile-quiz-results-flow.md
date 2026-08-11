# Mobile Quiz Results Flow

## Goal

Make the post-quiz screen immediately actionable and easy to scan on a 390x844 mobile viewport while preserving a complete, pedagogical review of every answer.

## Evidence

The model-driven student audit produced 40 checkpoints and showed that the result view contains the complete review, but the primary action appears only after a long list of answer cards. On mobile, the student must scroll through many rows before finding “Ta en ny quiz” or “Se Brainmap”. Incorrect answers are expanded by default, which is pedagogically useful, but correct answers add substantial vertical length without requiring immediate reading.

## Non-goals

- Do not remove any answer, accepted synonym, explanation, or streak information.
- Do not change quiz selection, scoring, progress transitions, badge thresholds, or export formats.
- Do not add cloud storage, analytics, student accounts, or external video upload.
- Do not replace the review with a score-only screen.

## Acceptance criteria

- At 390x844, the result heading, score, streak, and “Ta en ny quiz” action are visible before the first review row.
- “Ta en ny quiz” and “Se Brainmap” remain available after scrolling to the end as well.
- All incorrect and near-miss rows are expanded initially; correct rows are collapsed initially.
- Each row remains keyboard-accessible and exposes status, student answer, accepted answer(s), and explanation when expanded.
- Completing a quiz still preserves ten review rows and increments same-day quiz counts exactly once.
- The video audit gets a regression assertion for top-action visibility and review-row count.
- Desktop layout remains bounded and does not introduce horizontal overflow.

## Files to change

- `index.html`: structure and behavior of the mixed-quiz result view; scroll/focus management.
- `src/styles/tailwind.css`: compact mobile result layout, action bar, and review-row styles.
- `tests/quiz-streaks.spec.js`: result action placement, collapsed/expanded states, and complete review assertions.
- `tests/model-student-video-audit.spec.js`: mobile viewport assertions for the result action and scrollable review.
- `thoughts/shared/plans/2026-08-11_mobile-quiz-results-flow.md`: this implementation record.

## Implementation steps

1. Extract the result header and action bar into a stable block before the review list. Give it a semantic heading and a compact summary of score, streak, and today’s quiz count.
2. Render both action buttons in the top action bar and repeat them at the end only if the mobile layout benefits from it. Use the same handlers as today so a new quiz receives a new seed.
3. Keep incorrect/near-miss `<details>` rows open and correct rows closed. Add explicit status text and `aria-label`/heading relationships without relying on color.
4. Add a compact mobile CSS treatment: reduced result padding, action bar that remains visible while reviewing without covering the global nav, readable row summaries, and no horizontal overflow.
5. After rendering results, move focus to the result heading or top primary action and reset the scroll position to the result start so the student is not dropped into the middle of the review.
6. Add regression tests for the visible top action, ten rows, default disclosure state, keyboard activation, and bottom action availability.
7. Run the model-driven audit again, inspect the updated result checkpoints, then run focused and full verification.

## Test commands

```bash
npx playwright test tests/quiz-streaks.spec.js tests/model-student-video-audit.spec.js --workers=1 --browser chromium
npm run check:content
npm run check:diagnosis-catalog
npm run check:learning-catalog
npm run check:tailwind
npm run audit:student-video
git diff --check
```

Passing means the focused tests and checks are green, the audit manifest reports no console/page errors, the mobile result checkpoint shows the primary action above the first review row, and no horizontal overflow is detected.
