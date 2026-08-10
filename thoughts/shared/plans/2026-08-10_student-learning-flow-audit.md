# Student And Learning Flow Audit

## Goal

Improve the first-session experience for a new 13–16-year-old student across diagnosis, daily quiz, navigation, vocabulary practice, Brainmap, and post-quiz continuation.

## Product guardrails

- Preserve the clear welcome screen and the start → diagnosis → daily quiz spine.
- Keep local-first storage, export/import, no login, and no analytics.
- Keep one diagnosis answer mapped to exactly one progress cell.
- Do not change question IDs, accepted answers, strength transitions, result bands, or streak storage semantics unless a separate contract is approved.
- Keep verb feedback and full conjugation-table behavior unchanged; the audit explicitly finds this flow strong.

## Scope

This plan covers the complete audit supplied on 2026-08-10. It includes major/critical findings and the low-cost minor polish that is directly connected to those flows.

## Findings and proposed contracts

### 1. Diagnosis feedback is required

Current behavior submits an answer and immediately renders the next question. Change this to a transient feedback state:

- Store the answer and progress exactly once as today.
- Add an in-memory `diagnosisFeedback` object with `{ questionId, answer, correct, canonicalAnswer }`; it is UI state only and is never written to localStorage or export data.
- Set `canonicalAnswer` to the first declared accepted answer for the catalog question, with a safe fallback of `Svar ikke registrert` if content validation finds an empty accepted-answer list. The content gate must reject empty accepted-answer lists before implementation is considered complete.
- While `diagnosisFeedback` exists, disable the answer controls and make a second submit a no-op. The visible question remains the submitted question, so the student can connect the result to the answer.
- Keep the answered question visible until the student activates `Neste` or `Se resultat`.
- Correct: `✓ Riktig`.
- Wrong: `✗ Riktig svar var: ...` plus a short note that mistakes only help choose the starting level.
- Typed and choice questions use the same interaction.
- `Neste` clears the feedback and renders the next question. `Se resultat` clears it and completes exactly once. Enter activates only the currently visible feedback action; it must not submit a second answer.
- If the tab reloads during feedback, the diagnosis resumes from persisted answers without replaying or reapplying the feedback. Restart replaces the diagnosis answer set but does not erase other progress.
- Feedback is not persisted or added to the diagnosis export schema.

### 2. Mixed quiz feedback must state the result

- Correct: `✓ Riktig`.
- Wrong: `✗ Feil — riktig svar: ...`.
- Near-miss/accent result: `Nesten riktig — sjekk aksenten`.
- Define the UI mapping explicitly: `correct` renders `✓ Riktig`, `accent_or_case_variant` renders the near-miss message, and `wrong`/`skipped` renders `✗ Feil — riktig svar: ...`. Extend the existing pure evaluator so that an answer whose accent-normalized form matches an accepted answer returns `accent_or_case_variant`; exact normalized matches remain `correct`. Accent normalization may fold `áéíóúü` to their base letters for this comparison but must preserve `ñ`; it must not alter the stored answer or displayed canonical answer. Keep the existing progress transition and result-band semantics unchanged, and add pure tests for exact, accent variant, wrong, and blank answers.
- Preserve the existing contained feedback visual treatment from the previous frontend audit.
- Keep the manual `Neste`/`Se resultat` action.
- Do not reveal the answer before an attempt.

### 3. Navigation must protect active sessions

Introduce one central guard before `showPage()` hides the active exercise view:

- Detect active mixed quiz, vocabulary session, verb session, and grammar session.
- When changing to another page, ask: `Du holder på med en økt. Avslutt og bytt fane?`
- Cancel keeps the current exercise and page unchanged.
- Define one explicit `activeSessionType` (`mixedQuiz | vocabulary | verbs | grammar | null`) set when a session starts and cleared on completion or abandonment. Its descriptor has `{ type, page, isActive, cleanup }`; this avoids treating stale hidden state as a live session and prevents multiple sessions being cleaned up accidentally.
- Route all user-facing navigation buttons and nav links through a guarded `requestPageChange(page)` rather than putting prompts into render functions. Internal page changes from question advancement, completion rendering, and the current-page action bypass the guard.
- Confirm uses a shared idempotent abandonment cleanup: clear only the active session's in-memory state, leave already-written item progress intact, do not record a completion/practice-history entry or streak increment for an incomplete session, then perform the requested navigation. A second cleanup call must be a no-op.
- Do not call completion-oriented `end*Session()` functions from this path unless they are split into explicit `abandon*Session()` and `complete*Session()` operations with separate tests.
- Already completed sessions and ordinary page changes never prompt.
- Completion paths clear `activeSessionType` before rendering their completion view; abandonment clears it before navigation.
- Preserve progress already recorded for answered items; do not double-record homework history on confirmed navigation.
- Existing explicit `Avslutt` confirmations continue to work.
- Guard only user-requested page changes. Internal transitions to completion or the next question bypass the guard, and clicking the already-visible page does not prompt.

### 4. Home needs a post-quiz state

Derive completion from the existing local quiz stats for the browser's local date:

- Add a pure helper `hasCompletedDailyQuizForDate(stats, localDate)` that returns true only when a full mixed quiz has called `completeQuizForToday()` for that local ISO date. Missing, corrupt, or legacy stats return false without writing data.
- Before the first quiz today: `Du har ikke øvd i dag ennå.`
- After completion: show `✅ Dagens quiz fullført`.
- Replace the repeated `Start dagens quiz` primary action with the exact next action `Øv på gloser`, targeting the vocabulary page. Brainmap remains available as a secondary home action.
- Keep the streak line. After completion it should encourage returning tomorrow without implying another required quiz today.
- A repeated quiz remains possible through the vocabulary/manual path; this change only clarifies the Start page's primary recommendation.
- Completion must be idempotent: repeated rendering and returning to Start cannot increment `dailyQuizCounts`, streaks, or practice history.

### 5. Reduce vocabulary choice overload

- Keep the three main vocabulary modes and chapter practice visible.
- Put the category chooser in a collapsed `details`/advanced section by default.
- Open or reveal category choices when the student selects `Nye ord` or `Blandet`, because those modes depend on category selection.
- Mode selection must preserve the existing selected mode and category values. Selecting `Repetere` closes the disclosure; selecting `Nye ord` or `Blandet` opens it without clearing categories. If no category is selected, retain the existing fallback behavior and show the same validation/message as before.
- Do not remove category selection, teacher-imported vocabulary, limits, or existing settings.
- Keep the first action for a student who simply wants to practice to one tap.

### 6. Make Brainmap explanation complete

- Show five status swatches with labels: `Grå = ikke startet`, `Rød = trenger øving`, `Gul = på vei`, `Grønn = god kontroll`, `Gull = svært sterk`.
- For an unstarted node (`attempts === 0`), show `Ikke startet` without `0.0 / 5` in both visible text and accessible name; retain `styrke X.X av 5` for attempted nodes. This changes presentation only, not status thresholds or aggregation.
- Preserve existing accessible names, status text, color semantics, direction split, and practice-category buttons.
- Do not change brainmap aggregation or progress calculations.

### 7. Minor practice polish

- Add deliberate line/spacing separation in vocabulary rating buttons: `Igjen` plus `Nå (1)` and `Bra` plus `1 dag (2)`.
- Hide inactive `Glose-duell — Kommer snart...` from the student game chooser until it is usable, or render it as a clearly non-actionable teaser without a misleading interactive affordance.
- Keep existing verb feedback and conjugation table unchanged.

### 8. Offline trust message

- Add a short, accurate local-first message in a low-noise location such as Start or settings: `Fungerer også uten internett etter at appen er lastet inn.`
- Do not claim offline behavior before the service worker/app-shell behavior is verified in a clean browser profile.
- The test must register the service worker from a clean context, load once online, reload with network blocked, and assert the app shell is available. If that gate cannot be reproduced, omit the message rather than making an unverified claim.

## Non-goals

- No redesign of the welcome screen.
- No cloud sync, login, Feide, analytics, leaderboards, or new personal data.
- No changes to quiz selection, diagnosis scoring, progress transitions, or streak storage.
- No broad visual redesign beyond the audit findings.

## Acceptance criteria

- A wrong diagnosis answer remains visible with readable feedback until manual continuation.
- Repeated submit, Enter, reload, and restart do not apply a diagnosis answer or progress transition more than once.
- A wrong/correct/near-miss mixed-quiz answer has an explicit result label and remains manually advanceable.
- Navigating away from an active quiz, vocabulary, verb, or grammar session always gives a confirmation; cancel preserves the session.
- Confirmed abandonment preserves completed item progress but creates no completion record, practice-history entry, or streak increment for the incomplete session.
- Start clearly distinguishes before-quiz and after-quiz states on the local date.
- Vocabulary categories are not part of the default first-choice surface but remain available when needed.
- Brainmap explains all five colors and does not force an unstarted student to interpret `0.0 / 5`.
- Rating buttons are readable; inactive games are not misleadingly actionable.
- Offline copy is only shown after clean-profile service-worker verification.
- Mobile 390×844 has no horizontal overflow and no exercise state is lost by an accidental navigation tap.

## Files to change

- `index.html`: diagnosis feedback state, mixed-quiz labels/near-miss display, navigation guard, home completion state, vocabulary category disclosure, Brainmap text, rating labels, inactive game treatment, offline copy.
- `src/styles/tailwind.css`: feedback states, category disclosure, rating-button layout, Brainmap legend/empty state, optional offline badge.
- `dist/tailwind.css`: regenerated CSS output.
- `tests/diagnosis-flow.spec.js`: manual diagnosis feedback and Enter behavior.
- `tests/adaptive-quiz.spec.js` or a focused quiz UX test: explicit correct/wrong/near-miss labels.
- New `tests/student-learning-flow-audit.spec.js`: navigation guard, home before/after state, vocabulary disclosure, Brainmap scale, mobile containment, and rating labels.
- `tests/pwa-and-ui-smoke.spec.js`: offline message/service-worker clean-profile evidence if the message is implemented.
- `package.json`: focused test script and `test:all` registration.

## Implementation order

1. Add failing tests for diagnosis feedback, duplicate-submit protection, reload/restart semantics, and manual continuation.
2. Implement diagnosis feedback without changing persisted schema.
3. Specify/verify the evaluator resultKind mapping, then add explicit mixed-quiz result labels and near-miss presentation.
4. Add the central active-session navigation guard and idempotent confirmed abandonment cleanup before wiring it into navigation.
5. Add home before/after quiz state using existing quiz stats.
6. Collapse/reveal vocabulary categories based on selected mode.
7. Complete Brainmap legend/empty-state semantics and apply the small practice polish.
8. Verify service-worker behavior before adding offline copy.
9. Run mobile/desktop audit tests, full regression, CSS build, and diff checks.

## Test plan

Focused:

```bash
npm run test:diagnosis
npm run test:adaptive-quiz
npm run test:student-learning-flow-audit
```

Full gates:

```bash
npm run test:all
npm run build:css
git diff --check
```

Tests should use deterministic local dates and fixtures. They must verify both the visible UI and persisted invariants: no duplicate answer, no duplicate session record, preserved progress after cancelled navigation, and correct derived home state.

The focused flow suite must cover every session type (mixed quiz, vocabulary, verb, grammar) for both Cancel and Confirm, including a session with zero answered items, plus navigation to an already-visible page and internal completion transitions. It must assert that an incomplete confirmed abandonment does not call completion/history/streak writers and that stale hidden state cannot trigger a second prompt.

## Remaining risk

The navigation guard is the highest-risk change because the current session end functions also render completion views and record practice history. Implement a shared idempotent cleanup path before wiring it into `showPage()`.
