# Agent workflow reference

Detailed project instructions linked from [AGENTS.md](../AGENTS.md). Read the relevant section before changing the affected flow. This document holds workflow details and owner context; Beads remains the source of live task status. Moving instructions here does not relax them.

## Klasseromserfaring og salg — presisering 9. november 2026

Produkteieren opplyser at produktet ble utviklet med en egen 9. klasse hen underviste året før, med elevtilbakemeldinger og løpende tilpasning. Registrer dette som faktisk lærerledet klasseromsutvikling opplyst av produkteieren. En ny pilotskole, gratispilot, fem lærerprøver eller representasjon fra begge skoleslag er ikke krav før salg. Kundegjennomgang og frivillig utprøving kan fortsatt brukes ved behov.

Ikke utled at dagens Feide, sentrale lekser, læreroversikt, nye innholdspakker eller produksjonsdrift ble prøvd i den tidligere klassen; omfanget er ikke oppgitt. Behold konkrete feilrettinger, faglig kontroll av nytt/ukontrollert innhold, teknisk stagingverifikasjon og avtaler/godkjenning før den enkelte skole aktiveres. Ikke krev en ny pedagogisk pilot som erstatning for disse konkrete kontrollene. Eldre planer med obligatoriske pilotkrav overstyres av denne presiseringen.

## Google Drive Document Workflow

- Deliver documents directly as native Google Docs in the existing project folder structure. The verified [Spansk nettside folder](https://drive.google.com/drive/folders/1k3tAOUgt22FRmUhf3fINiYQWLg6pFtkY) contains the listening and dictation materials.
- Check the destination and existing documents first. Update the intended document in place when one exists. Preserve unrelated content and sharing settings.
- Verify the native document, destination and content after saving. Return the Google Docs link.

## Content audits and student feedback

### Content audit infrastructure

- `npm run extract:items` — extracts every curriculum item to `output/audit-items.json` (glossary, diagnosis, grammar, verbs, puzzles, prepositions, answer alternatives, definite forms).
- `npm run check:content-accuracy` — runs 13 mechanical invariant checks on the extracted catalog, including a targeted Norwegian-context n-for-ñ check (not a general spellchecker). With `scripts/reference-corpus.json`, three additional consistency checks run: synonym coverage in each direction and corpus orphans. This corpus is largely derived from the app and is not independent validation. Translation idiomaticity and distractor validity still require expert review; the command always discloses that these do not run.
- `tests/content-accuracy.test.mjs` — mutation-tests the real audit command and checks known ñ mistakes, correct Unicode forms, legitimate n-words, and honest audit coverage reporting. Included in `test:all`.
- `tests/answer-acceptance-fuzz.spec.js` — fuzz-tests every glossary pair, diagnosis answer, and verb conjugation for correct acceptance, accent/ñ classification, and definite-form acceptance.
- `tests/student-feedback.spec.js` — regression tests for the student feedback channel (storage, export, delete, anonymity, reset).

### Student feedback channel privacy model

Students can flag items they believe were unfairly marked wrong via a «Jeg mener svaret mitt er riktig» button after wrong answers in vocabulary, mixed quiz, verb, and grammar sessions.

**Data collected:** item reference, prompt shown, student answer, expected answer, student explanation (free-text), student label (anonymous by default), timestamp.

**Storage:** `localStorage` key `spansk123_studentFeedback_v1`, schema v1. No automatic transmission. Teacher exports JSON manually from Settings → Tilbakemeldinger. `resetAllData()` clears feedback.

**Guardrail compliance:** Not silent (student actively writes and saves). No backend. No third-party services. Anonymous by default. Export is manual. Documented in README.md.

## Feature-specific checks

- Local vocabulary/import/export/progress: read the storage and migration code in `index.html`; test old and new JSON payloads and recovery. Teacher vocabulary remains independent of the canonical vocabulary source. `eksempel-gloser-laerer.json` is an import example.
- Local homework/Google Forms: read `README.md` and the relevant code in `index.html`; verify the existing Forms assumptions before changing IDs or submission shape. The server-backed school assignment flow is a separate path; inspect `server/` and `docs/feide/` for that work.
- School accounts, teacher views, homework or cloud progress: start from the existing written data/privacy model and document any change in data, purpose, retention, access, deletion and export. Prefer pseudonymous student identifiers; separate teacher/admin data from learning events. Design account recovery and classroom handoff before replacing local-only progress.
- Reading/pronunciation: microphone permission must be explicit and contextual. Transient self-recording permission does not authorize speech recognition, transcription or scoring, even on-device. Any new reading-feedback processing requires separate owner authorization and a documented privacy model; if authorized, prefer on-device processing where practical and formative feedback rather than grading. Never persist raw audio under the current permission.
- Dictation: provide predictable replay controls. Accept punctuation/accent variants only when pedagogically intended; keep exact-match modes available for word-for-word listening.

## Beads command reference

```bash
bd --no-daemon ready --json
bd --no-daemon list --status=in_progress --json
bd --no-daemon create --title="..." --type=task --priority=2
bd --no-daemon update <id> --claim --status=in_progress
bd --no-daemon dep add <child> <parent>
bd --no-daemon close <id>
bd --no-daemon sync
```

Use `--type=bug` or `--type=feature` when appropriate. Never use `bd edit` in agent sessions; it opens an interactive editor.
