# Mixed Quiz Feedback, Results, Repeat Flow, and Mastery Badges

## Goal

Make the mixed daily quiz the primary repeatable practice loop. Every item must produce visible, durable feedback; equivalent answers must be accepted explicitly; quiz completion must show a review of every answer with explanations and a clear action to take another quiz; and mastered skills must receive local badges.

## Scope and guardrails

- Keep the no-login, local-first architecture.
- Preserve `quizStats.dailyQuizCounts` and the existing daily streak semantics. A student may complete multiple quizzes on the same local date.
- Do not infer synonyms from edit distance. Equivalent answers are explicit catalog data and share one `canonicalMeaningId`.
- Constraints such as “begynner på a” must be visible in the prompt and represented structurally in item data.
- One answer produces one evidence/progress update and one stored result row.
- Existing export/import remains compatible; new fields are optional and normalized on import.

## Implementation slices

### 1. Answer contract and feedback

- Add `answerConstraint` support for `startsWith` with a visible Norwegian instruction.
- Make `evaluateDiagnosisAnswer` apply accepted answers, explicit variants, constraints, and near-miss rules in that order.
- Return the matched answer/canonical meaning and a feedback reason, without increasing `maxEvidence` for synonyms.
- Centralize mixed-quiz feedback rendering so correct, near-miss, wrong, skipped, and constraint mismatch all have a visible message.
- Store each quiz response in `mixedQuizState.results` before advancing.

### 2. Post-quiz review and repeat loop

- Replace the current “back to practice” completion block with a results view listing every question, the student answer, correct answer(s), result class, and a short explanation.
- Keep a primary “Ta en ny quiz” action that starts a fresh deterministic quiz seed, plus secondary actions for Brainmap and other practice.
- Ensure completion records a quiz count every time a 10-item quiz is completed, including quiz 2–5 on the same day.
- Render streak copy for both daily streak and the current day’s quiz count, including progress toward five quizzes today.

### 3. Mastery badges

- Add a versioned local `quizBadges`/mastery state derived from skill progress, not from personal data.
- Award a skill badge only when a skill has enough evidence (minimum attempts and accuracy/strength threshold), and make awards idempotent.
- Show newly earned badges in the results view and the current badge collection on the home page.
- Add export/import normalization for badges so old files remain valid and badge state cannot overwrite newer unsupported data.

## Tests

- Unit/browser tests for synonyms, constraints, all response classes, and one feedback block per quiz item.
- End-to-end test that completes a 10-question quiz, sees ten review rows, starts a second quiz, and increments the same-day count to 2.
- Tests for five-quiz daily streak progress and idempotent badge awards.
- Existing `npm run test:all`, content checks, import/export tests, and `git diff --check` must remain green.

## Risks and decisions

- A detailed review can become too long on mobile; use compact result rows with expandable explanations rather than a second quiz-sized interaction.
- Badge thresholds are product heuristics, not CEFR claims. Label them as “merke”/mastery and keep the underlying progress visible.
- If an item has multiple correct synonyms, display the student’s accepted answer as correct and list alternatives only in the explanation when useful.
