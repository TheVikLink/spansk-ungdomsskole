# Audit Flow Improvements

## Goal
Implement the accepted Playwright audit findings for the vocabulary launcher, vocabulary session model, semantic controls, game prompt visibility, game defaults, and visual hierarchy.

## Non-goals
- Do not add login, backend sync, analytics, or teacher dashboards.
- Do not change export/import data format.
- Do not rewrite the single-file architecture.
- Do not add new learning content beyond labels/default selections needed for the flow.

## Acceptance Criteria
- Vocabulary page first presents three clear choices: repeat words, repeat plus learn new, learn new.
- Repeat modes include all due cards regardless of selected new-card categories.
- New-card modes let the student choose categories and number of new words.
- Category chips, grammar topics, and game cards are semantic buttons with keyboard focus.
- Verbo Invaders and Prepo Invaders show the prompt before answers are actionable.
- Verbo Invaders starts from a smaller recommended verb set, while still allowing "select all".
- Dense learning screens have clearer primary actions and less setup clutter in the first viewport.

## Files To Change
- `index.html`
- `thoughts/shared/plans/2026-05-14_audit-flow-improvements.md`
- `output/playwright/audit-fixes-check.cjs` for local regression verification only

## Test Plan
- Red check first: `npx --yes --package playwright node output/playwright/audit-fixes-check.cjs` should fail before implementation.
- Green check after implementation: same command should pass.
- Browser smoke: run the existing flow recorder or a targeted screenshot check if needed.
- Static check: `git diff --check`.
- Beads sync: `bd --no-daemon sync`.

## Tasks
1. Add a failing Playwright regression script for the accepted audit behavior.
2. Refactor vocabulary session selection into explicit modes.
3. Replace the dense vocabulary setup with the three-choice launcher plus secondary tools.
4. Convert interactive cards/chips to semantic buttons and add focus-visible styles.
5. Adjust game start positions and recommended Verbo Invaders defaults.
6. Run verification and close the relevant Beads if green.
