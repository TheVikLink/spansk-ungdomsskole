# Storage, migration and privacy audit — spansk-ungdomsskole-dvx

## Goal

Produce an evidence-backed audit of local persistence, import/export, migration, reset, user-provided text, and browser data surfaces without changing app behavior.

## Non-goals

- No backend, account, analytics, cloud-sync, or dependency work.
- No app or test changes during the audit.
- No claim that intentional local-first behavior is a defect.

## Acceptance criteria

- Every app-owned browser-storage key, export/import field, reset path, download/upload, network call, service-worker cache, and text-to-HTML path is inventoried.
- Any finding gives an exact first unsafe state, source location, reproduction, impact, and minimal remediation.
- Old, malformed, partial, future-schema, duplicate, and clean-profile import/recovery behaviors have fresh test evidence.
- Confirmed defects are filed separately; the audit Bead records the evidence and outcome.

## Files to change

- `thoughts/shared/plans/2026-09-14_storage-privacy-audit-dvx.md` — this audit plan.
- `.beads/issues.jsonl` — audit status/notes and verified follow-up issues only.

## Test plan

- `npx playwright test tests/import-export-compat.spec.js tests/storage-recovery.spec.js tests/backup-privacy.spec.js tests/student-feedback.spec.js --browser chromium --workers=2 --reporter=list`
- Targeted clean-context probes for export → import, malformed data, reset, and dangerous text.
- `git diff --check`

## Steps

1. Inventory persistence keys, schemas, import/export fields, reset behavior, browser caches, file flows, and network-capable APIs.
2. Trace validation and state writes from untrusted import/feedback/glossary text to rendered DOM and persistent storage.
3. Compare runtime behavior with existing compatibility, recovery, privacy, and feedback tests.
4. Execute targeted clean-context/fuzz probes and focused parallel Playwright coverage.
5. File only reproducible defects, close the audit Bead with evidence, and sync Beads.
