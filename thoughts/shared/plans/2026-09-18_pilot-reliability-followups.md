# Pilot reliability follow-ups

## Goal and scope

Implement the user-approved sequence gdco → x7ou → do6v → w7a → 9l5u, preserving the no-login classroom flow and existing uncommitted work. Beads is the live task/status record.

No new audio generation, TTS, services, dependencies, progress schema changes, full curriculum expansion, deployment or large app rewrite. Existing recordings remain unchanged. Teacher approval and the pupil trial remain human work (4or0/ee0).

## Incremental implementation and acceptance

1. **gdco:** Replace vocabulary/quiz synthesis controls with an accessible missing-recording message; preserve recorded listening/dictation. Prove that speech APIs are never called, no-file/404/decode/offline failures stay visible without unlocking answers or recording completion, and recording playback/retry/offline download still work. Files: `index.html`, `tests/tts.spec.js`, listening/dictation specs, `README.md`, `AGENTS.md`.
2. **x7ou:** Inspect actual exercises behind each skill. Add catalog and click-through tests, then align ready/planned status and route to relevant existing exercises with correct skill progress. Do not substitute generic unrelated exercises. Files: `index.html`, `tests/brainmap-catalog.spec.js`, related Brainmap/grammar tests as necessary.
3. **do6v:** Add a failing mutation test to the actual ñ check. Make the check context-aware and cover correct forms and valid n-words. Separate mechanical/corpus consistency from expert review. Files: `scripts/check-content-accuracy.mjs`, a pure helper in `scripts/lib/` if needed, `tests/content-accuracy.test.mjs`, `AGENTS.md`, `README.md`.
4. **w7a:** Build and run the complete gate, then the browser suite with one worker as well as the normal two. Check clean-profile recovery, mobile/keyboard, audio/offline paths and record exact results. Do not claim physical school-device or teacher sign-off from browser emulation. Resolve reproducible failures; report environmental blocks honestly.
5. **9l5u:** Reconcile counts and release status with evidence. Date and preserve historical reports. Files: `README.md`, `PILOT-READINESS.md`, `PILOT.md` if needed, `docs/reality-check-2026-09-18.md`, listening audit report and a dated release verification report.

## Verification

Use red → green cycles for behavior changes; broaden after focused tests pass.

```sh
npx playwright test tests/tts.spec.js tests/dictation.spec.js tests/listening-release.spec.js --browser chromium --workers=1 --reporter=line
npx playwright test tests/brainmap-catalog.spec.js tests/brainmap-progress.spec.js tests/grammar-lessons.spec.js tests/productive-patterns.spec.js --browser chromium --workers=1 --reporter=line
node --test tests/content-accuracy.test.mjs
npm run check:content-accuracy
npm run build:app
npm run test:all
git diff --check
bd --no-daemon dep cycles
bd --no-daemon sync
```

The runner hardcodes two workers and ignores extra arguments. Use the complete one-worker command in `docs/release-verification-2026-09-18.md`. Every ready route needs relevant exercise evidence, not a truthy descriptor. Logs and build identity belong in the release report; unsupported classroom/deployment claims do not.

## Release-discovered audio defect (85ni)

The full two-worker suite reproduced an intermittent offline media failure. Instrumentation found complete cached files, but resumed non-zero byte ranges failed in Chromium's media pipeline. It also reproduces with only the server disconnected, so it is not solely browser offline emulation. HTTP audio lacks the anonymous CORS setting required for cached range playback; retain the existing file:// path, set CORS for the three HTTP audio elements, add an attribute regression and repeatedly exercise both disconnected-server modes before rerunning the full release gate. No retries, arbitrary delays, new dependency or recording changes.
