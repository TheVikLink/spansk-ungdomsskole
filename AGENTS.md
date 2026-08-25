# AGENTS.md - Spansk Ungdomsskole

## Mission
Interactive Spanish learning app for Norwegian lower-secondary students. The product started as a no-login, local-first classroom tool for vocabulary, flashcards, verb conjugation, grammar, and games, and may grow into a real edtech product with login, teacher dashboards, homework assignments, reading feedback, and dictation.

## Critical Guardrails
- Student privacy comes first. Do not add cloud sync, login, analytics, recording upload, teacher dashboards, or personal-data collection without an explicit privacy/data-minimization plan.
- Keep the current no-login classroom flow working unless the task explicitly changes it.
- Local progress export/import is a core safety feature. Do not break compatibility without a migration plan and tests.
- Content must fit Norwegian 9th grade Spanish learners around CEFR A0-A1/A1. Prefer useful, high-frequency vocabulary and classroom-relevant grammar.
- Practice should stay active: students answer, type, choose, speak, or recall. Avoid flows that auto-reveal answers before meaningful effort.
- Games should reinforce vocabulary, grammar, reading, listening, pronunciation, or retrieval practice; avoid unrelated game mechanics.
- Reading and dictation features must handle microphone/audio permissions clearly and avoid storing voice or identifiable student data unless explicitly approved.

Forbidden:
- Silent collection of student identifiers, voice recordings, free-text submissions, or usage analytics.
- Backend persistence or third-party services added without a documented GDPR/privacy review.
- Removing export/import or making local data unrecoverable without a documented replacement.
- Large rewrites of the single-file app unless the task is specifically an architecture migration.

## Language Rules
- User-facing Norwegian text should use clear bokmål, concrete verbs, and consistent terminology.
- Avoid mixed English/Norwegian UI labels unless the Spanish-learning context requires it.
- Spanish examples should be idiomatic, age-appropriate, and include accents/diacritics where correct.
- When adding explanations, keep them short enough for students to use while practicing.

## Fast Context Map
Current repo shape:
- `index.html` - main all-in-one app, styles, data, state, and UI logic.
- `eksempel-gloser-laerer.json` - example teacher glossary import file.
- `README.md` - teacher-facing setup, privacy, and deployment notes.
- `.beads/` - Beads task tracking metadata.
- `thoughts/shared/plans/` - plans for multi-step work.

Change routing:
- App behavior/UI: read relevant sections in `index.html`; verify by opening the static file or serving the repo locally.
- Vocabulary/import/export/progress: read the storage, import, export, and migration code in `index.html`; test old and new JSON payloads manually or with a focused script if one exists.
- Teacher/homework flow: read `README.md` and the homework-related code in `index.html`; verify Google Forms assumptions before changing IDs or submission shape.
- Documentation-only changes: update `README.md` or `AGENTS.md`; run lightweight text checks and `git diff --check`.

## Preferred Workflow
For any behavior change, use:
1. Research: read current code and reproduce/understand the issue before editing.
2. Plan: write a plan in `thoughts/shared/plans/` for multi-step or risky work.
3. Implement: use TDD where a test harness exists; otherwise make the smallest verifiable slice and add tests when practical.
4. Verify: run fresh verification commands. Do not claim something "should pass" without evidence.
5. Commit: commit only after verification is green, when committing is in scope.
6. Handoff: update Beads and summarize remaining risk or follow-up work.

Use adversarial plan review or stress testing only for high-risk work: privacy/security, account systems, student data persistence, migrations, large architecture changes, or major pedagogy shifts.

## Branch Policy
Current default branch is `main`.
- Small documentation or classroom fixes may be done directly on `main` when the user asks for local edits.
- Larger features should use a feature branch from `main` and a PR back to `main`.
- Before multi-teacher SaaS work begins, introduce a stronger branch/deployment policy, likely `staging -> main`, and document it here.
- Do not push, deploy, or publish unless the user asked for that delivery step or the task explicitly includes it.

## Task Tracking - Beads (`bd`)
`bd` is the source of truth for task tracking in this repo.

Rules:
- Use `bd` for task tracking. Do not create parallel markdown task lists for live work.
- Create or claim a Beads issue before writing code for non-trivial work.
- Claim the issue and mark it `in_progress` when work starts.
- Use `--json` when output will be parsed by agents.
- Do not use `bd edit`; it opens an interactive editor and blocks agent workflows.
- Prefer `bd --no-daemon ...` in agent sessions.
- Run `bd --no-daemon sync` before push and at session end when Beads changed.

Quick commands:
```bash
bd --no-daemon ready --json
bd --no-daemon list --status=in_progress --json
bd --no-daemon create --title="..." --type=task|bug|feature --priority=2
bd --no-daemon update <id> --claim --status=in_progress
bd --no-daemon dep add <child> <parent>
bd --no-daemon close <id>
bd --no-daemon sync
```

## Verification Gates
This repo currently has no package scripts or automated test suite. Use the strongest available checks for the touched area.

### Content audit infrastructure

- `npm run extract:items` — extracts every curriculum item to `output/audit-items.json` (glossary, diagnosis, grammar, verbs, puzzles, prepositions, answer alternatives, definite forms).
- `npm run check:content-accuracy` — runs 13 mechanical invariant checks on the extracted catalog (parenthetical annotations, definite-form endings, orphan maps, prompt collisions, verb conjugation completeness, grammar distractor identity, sentence puzzle integrity, accent/ñ presence, Norwegian context coverage). Corpus-dependent checks (synonym coverage, idiom correctness, distractor validity) require expert review and are documented but skipped automatically.
- `tests/answer-acceptance-fuzz.spec.js` — fuzz-tests every glossary pair, diagnosis answer, and verb conjugation for correct acceptance, accent/ñ classification, and definite-form acceptance.
- `tests/student-feedback.spec.js` — regression tests for the student feedback channel (storage, export, delete, anonymity, reset).

### Student feedback channel privacy model

Students can flag items they believe were unfairly marked wrong via a «Jeg mener svaret mitt er riktig» button after wrong answers in vocabulary, mixed quiz, verb, and grammar sessions.

**Data collected:** item reference, prompt shown, student answer, expected answer, student explanation (free-text), student label (anonymous by default), timestamp.

**Storage:** `localStorage` key `spansk123_studentFeedback_v1`, schema v1. No automatic transmission. Teacher exports JSON manually from Settings → Tilbakemeldinger. `resetAllData()` clears feedback.

**Guardrail compliance:** Not silent (student actively writes and saves). No backend. No third-party services. Anonymous by default. Export is manual. Documented in README.md.

Minimum for documentation/workflow changes:
```bash
bd --no-daemon list --json
git diff --check
```

For app behavior changes:
- Open or serve `index.html` and manually verify the changed flow on desktop and mobile widths.
- Test local progress persistence, export, and import when touching storage or progress.
- Test at least one happy path and one failure path for vocabulary, verbs, grammar, games, homework, reading, or dictation changes as relevant.
- Add automated tests before or during any refactor that extracts logic from `index.html`.

Before pilots/deployments:
- Verify the app loads from a clean browser profile or cleared site data.
- Verify export/import recovery.
- Verify mobile usability.
- Verify that no new personal data leaves the device unless explicitly approved and documented.
- Verify GitHub Pages or deployment target after publishing.

## Product Evolution Rules
For login, teacher dashboards, homework assignment systems, or cloud progress:
- Start with a written data model and privacy model: what data, why it is needed, retention, access, deletion, and export.
- Prefer data minimization and pseudonymous student identifiers.
- Separate teacher/admin data from student learning events.
- Design account recovery and classroom handoff before replacing local-only progress.
- Keep a no-login or low-friction classroom mode if feasible.

For reading feedback:
- Prefer on-device speech recognition where practical.
- Make microphone permission explicit and contextual.
- Do not store raw audio by default.
- Treat pronunciation feedback as formative, not grading.

For dictation:
- Make audio replay controls predictable.
- Accept reasonable punctuation/accent variants only when pedagogically intended.
- Keep exact-match modes available when the goal is word-for-word listening.

## Session Start Checklist
1. `bd --no-daemon ready --json`
2. `bd --no-daemon list --status=in_progress --json`
3. `git log --oneline -5`
4. `git status --short`
5. Read `AGENTS.md`, then only the files relevant to the current task.

## Handoff Routine
1. File Beads issues for known follow-up work.
2. Run relevant verification gates.
3. Update or close the active Beads issue.
4. Run `bd --no-daemon sync` if Beads changed.
5. Report exact verification evidence and any remaining risks.
