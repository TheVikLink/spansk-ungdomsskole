# Local Quiz Streaks

## Goal

Track daily mixed-quiz activity locally and show students a clear daily streak plus a five-quizzes-per-day milestone.

## Non-goals

- No login, cloud sync, analytics, leaderboard, or student identifier collection.
- No streaks for individual practice modes in this slice.
- No replacement of the existing learning-progress model.

## Contract

- Storage key: `spansk123_quizStats_v1`.
- Schema version: `1`.
- A completed mixed quiz records one count against the browser's local `YYYY-MM-DD` date.
- Repeating completion on the same date is idempotent for streak-day counting, while the daily quiz count increases.
- `currentStreak` counts consecutive completed local dates ending today or the most recent completed date; `longestStreak` is retained.
- `fiveQuizDays` increases once when a date reaches exactly five completed mixed quizzes and never again for that date.
- Export includes quiz stats. Import unions completed dates, uses the maximum count per date, and recomputes derived streak values.
- Unsupported/future schema data is backed up and write-blocked consistently with learning progress.
- Delete-all removes quiz stats and any unsupported quiz-stats backups.

## Acceptance criteria

- Pure helpers are covered for local dates, first/second same-day completion, five-quiz milestone, consecutive days, gaps, and import merge.
- Completing all ten mixed-quiz items writes one streak event and shows the current streak in the completion view.
- Export/import preserves stronger existing streak history and does not double-count same-day activity.
- Existing `test:all`, content, CSS, and diff checks remain green.

## Files

- `index.html`: quiz stats schema, local-date/streak helpers, mixed-quiz completion, export/import, delete-all, completion UI.
- `tests/quiz-streaks.spec.js`: pure helper, UI, and export/import coverage.
- `package.json`: focused script and `test:all` registration.
- `tests/backup-privacy.spec.js`: delete-all regression for quiz stats.

## Steps

1. Add one failing test for normalized stats and one-date idempotent completion.
2. Implement the minimal pure stats helpers and verify focused green.
3. Add milestone, streak-gap, and merge tests, then implement and verify.
4. Wire full mixed-quiz completion, export/import, delete-all, and completion UI.
5. Run focused tests, full suite, CSS build, diff checks, then close and sync the Bead.

## Verification

```bash
npm run test:quiz-streaks
npm run test:backup-privacy
npm run test:all
npm run build:css
git diff --check
```
