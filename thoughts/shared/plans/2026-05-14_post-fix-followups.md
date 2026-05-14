# Post-Fix Flow Followups

## Goal
Implement the remaining post-fix audit followups while preserving chapter-specific category choice for vocabulary.

## Non-goals
- Do not remove or hide vocabulary category choice by default in this pass.
- Do not add login, teacher dashboards, cloud sync, teacher-pushed cards, or analytics.
- Do not change export/import progress formats.
- Do not rewrite the single-file app architecture.

## Acceptance Criteria
- Verb practice offers recommended focus modes and a visible fast path before the full verb grid.
- Grammar theory starts with a short pattern-noticing scaffold and keeps the dense rules as reference.
- Vocabulary completion does not show stale live-session header stats.
- Prepo Invaders setup presents prepositions as scan-friendly focus chips with a default selection and a small spatial preview.
- The deferred vocabulary category Bead records that category choice remains necessary until teacher-pushed vocabulary exists.

## Files To Change
- `index.html`
- `.beads/issues.jsonl`
- `thoughts/shared/plans/2026-05-14_post-fix-followups.md`
- `output/playwright/post-fix-followups-check.cjs` for local regression verification only

## Test Plan
- Red check first: `npx --yes --package playwright node output/playwright/post-fix-followups-check.cjs` should fail before implementation.
- Green check after implementation: same command should pass.
- Browser screenshot audit: run a targeted Playwright screenshot pass for vocabulary completion, verbs, grammar theory, and Prepo setup.
- Static check: `git diff --check`.
- Beads sync: `bd --no-daemon sync`.

## Tasks
1. Add a failing Playwright regression script for the four active followups.
2. Add verb focus mode controls and defaults.
3. Add grammar theory scaffold sections while keeping existing rule reference.
4. Hide or update the vocabulary study header on completion.
5. Add Prepo Invaders selectable focus chips and visual preview.
6. Verify, close completed Beads, and sync.
