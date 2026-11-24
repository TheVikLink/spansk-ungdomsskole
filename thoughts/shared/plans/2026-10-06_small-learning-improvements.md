# Seven approved learner and teacher improvements

## Goal and scope

Implement all seven recommendations from the 6 October audit as a locally verified delivery. Beads epic `spansk-ungdomsskole-lfn5` owns status; its seven existing children own the individual changes. The user authorized implementation on 6 October. Publication is a separate delivery step.

Work on `codex/small-learning-improvements`, based on published `f57ca19d`, in the isolated managed worktree. Preserve unrelated Feide and culture work in the original checkout. Do not add authentication, persistence, analytics, frameworks, dependencies or audio generation. Keep canonical vocabulary, assignment-v1 files, progress and backups compatible.

## Implementation sequence and acceptance

1. **865n — homework choices.** Content checkboxes explicitly include activities. Begin with no content and zero time targets; remove the preselected verb group. Do not infer exclusion from a zero target. Validate positive targets without content next to their section, associate messages with controls, announce and focus the first error. Do not reset teacher selections when the builder rerenders. Verify single-area and mixed downloads, empty/error flows, zero-target content and pupil import.
2. **9vh4 — listening replay.** Add a player for the supplied recording to each question, using question-phase loading/error status. Replay preserves answer and position. Pause on advancing, results and exit. Keep the transcript gated and use no synthesized fallback. Verify playback state, failure/offline, cleanup and both viewport widths.
3. **ez53 — grammar action.** Add the existing lesson-specific practice action after the introduction, retaining the bottom action. Both start the same questions. Verify phone placement, keyboard order and existing return flow.
4. **9o5z — pronoun meaning.** Reuse `pronounsNorwegian` beside the target pronoun. Keep answers, scoring and hints unchanged. Verify six pronouns in all three tense modes.
5. **dj3r — next review date.** Add a reusable availability helper based on the same local-midnight cutoff as `getDueCards`; a stored timestamp after midnight first becomes eligible on the following calendar day. Display future availability, untouched progress, error-only/new and due states distinctly. Do not change scheduling. The helper is available for planned culture work tc0b.4; do not implement a second scheduler or integrate unpublished culture content. Verify local-midnight/DST, invalid imports and both directions.
6. **x7uo — teacher handoff.** After a successful export show selectable pupil instructions, the public URL, current import/start labels for included areas, and manual report sharing. No automatic clipboard/network action. Verify instructions against a separate synthetic pupil importing the actual download.
7. **73o4 — reused words.** Success leads with package vocabulary count, then accurate new/existing counts. Change presentation only. Verify existing/new/mixed/repeated imports and unchanged progress.

## Files and verification

Behavior and accessible markup: `index.html`. Focused regressions: `tests/small-learning-improvements.spec.js`, `tests/assignment-package.spec.js` and `tests/listening-release.spec.js`. Existing tests needing an explicit choice between the two grammar actions: `tests/brainmap-catalog.spec.js`, `tests/report-classroom-flow.spec.js`, `tests/report-session-accounting.spec.js` and `tests/session-result-feedback.spec.js`. Teacher documentation: `README.md`; final evidence: `docs/verification-small-improvements-2026-10-06.md`. Build-generated `dist/tailwind.css` and `sw.js` follow the normal build; the manifest stays unchanged. No vocabulary-source changes expected.

For each slice first run the new focused browser test against the unchanged behavior and confirm the intended failure, then implement and run that test plus the closest existing spec. Use Node 22 with `env PATH="/opt/homebrew/opt/node@22/bin:$PATH"`. Commands: `npx playwright test tests/small-learning-improvements.spec.js --browser chromium --workers=1`, relevant existing specs, `npm run build:app`, `npm run test:all`, and `git diff --check`.

Fresh full verification must pass before local delivery. Browser regressions use synthetic local state at desktop and 390px phone widths; review screenshots and perform an actual download/import handoff. Verify progress/export/import through the existing compatibility suite. Physical phones, screen-reader speech and learning/time-saving outcomes remain outside technical verification. Record concrete results in Beads, not a parallel live checklist here.
