# Manually approved translations

## Goal

Provide a human-editable source file for approved vocabulary translations and merge it into the app's generated answer alternatives.

## Non-goals

- Change the vocabulary card UI or answer normalization.
- Add cloud storage or collect student data.
- Replace the existing audit pipeline.

## Acceptance criteria

- A teacher can add Norwegian alternatives in one readable JSON file.
- Only entries with `status: "approved"` are applied.
- Existing generated alternatives remain intact.
- `por supuesto` accepts both `naturligvis` and `selvfølgelig`.
- Tests and content checks pass.

## Files to change

- `data/godkjente-oversettelser.json`
- `scripts/apply-approved-alternatives.mjs`
- `tests/curriculum-audit.test.mjs`
- `README.md`
- generated `index.html`

## Test plan

- `node --test tests/curriculum-audit.test.mjs`
- `npx playwright test tests/vocab-learning-mechanics.spec.js --browser chromium`
- `npm run check:content-accuracy`
- `git diff --check`

## Tasks

1. Add the readable approved-translation source with the current manual approvals.
2. Add a deterministic converter/merge step to `audit:apply`.
3. Add unit coverage and document the editing workflow.
4. Regenerate `index.html`, run all checks, and push the change.
