# Import Hulltetteren Agent Rules

## Goal
Create repo-local agent instructions that preserve the Hulltetteren workflow conventions while adapting them to this Spanish learning app.

## Non-goals
- Do not change app behavior in `index.html`.
- Do not introduce login, backend storage, dashboards, or architecture changes.
- Do not copy math-specific pedagogy, Konva rules, Prisma rules, or Hulltetteren-only scripts.

## Acceptance Criteria
- Root `AGENTS.md` exists and is specific to this repository.
- Beads is initialized and documented as the task source of truth.
- The workflow includes research, planning, TDD, verification, commit, and handoff expectations.
- Spanish-learning, GDPR/privacy, Norwegian-copy, reading, dictation, and teacher-dashboard guardrails are represented.
- Verification guidance matches the current repo shape: static HTML with no package scripts yet.

## Files To Change
- `AGENTS.md`
- `.beads/**`
- `.gitattributes`
- `thoughts/shared/plans/2026-05-13_import-hulltetteren-agent-rules.md`

## Test Plan
- `bd --no-daemon list --json` should return valid JSON.
- `git diff --check` should report no whitespace errors.
- `git status --short` should show only the intended new workflow files.

## Tasks
1. Read Hulltetteren `AGENTS.md` and identify reusable workflow rules.
2. Initialize Beads in this repository.
3. Create and claim a Beads task for this setup work.
4. Add this implementation plan.
5. Replace generated `AGENTS.md` with adapted Spanish-learning project rules.
6. Run lightweight verification commands.
