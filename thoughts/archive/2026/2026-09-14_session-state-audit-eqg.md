# Session-state audit — spansk-ungdomsskole-eqg

## Goal

Produce an evidence-backed audit of every active learning-session transition, identifying reproducible invalid states without changing application behavior.

## Non-goals

- No app, test, data-schema, or dependency changes.
- No claim that an unverified concern is a defect.
- No audit of content correctness except where it creates invalid session state.

## Acceptance criteria

- Each reported issue identifies its first invalid state, source location, minimal reproduction, and classification: app, test, or fixture/worker isolation.
- Every major session family (mixed quiz, vocabulary, verbs, grammar, diagnosis, dictation/listening) is traced through start, navigation/cancel, reload/recovery, completion, and reset/import boundaries.
- Focused existing tests and state probes provide fresh evidence for all accepted conclusions.
- The Beads issue is updated with the outcome and any verified defects are filed separately.

## Files to change

- `thoughts/shared/plans/2026-09-14_session-state-audit-eqg.md` — this audit plan.
- `.beads/issues.jsonl` — task status/notes and any follow-up issues.

## Test plan

- `npx playwright test tests/student-learning-flow-audit.spec.js tests/report-session-accounting.spec.js --browser chromium --workers=2 --reporter=list`
- Focused browser state probes for each session starter and navigation guard.
- `npm run build:app` only if the audit changes application assets (not expected).

## Steps

1. Inventory globals, session starters, finishers, and navigation guards; write a valid-state contract for each activity.
2. Trace all paths that set or clear `activeSessionType` and activity-local session state, including newly introduced dictation/listening paths.
3. Compare the contracts with existing regression tests and identify direct-global test setup or unproven transitions.
4. Execute focused state probes and the relevant parallel Playwright tests; classify any failure by its first bad state.
5. Record only verified findings, create follow-up Beads for defects, close or document the audit task, and sync Beads.
