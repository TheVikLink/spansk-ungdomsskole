# Content audit infrastructure and student feedback channel

## Goal

1. Build extraction and audit infrastructure that mechanically catches every translation error, missing synonym, wrong definite form, and answer-acceptance gap &mdash; not just the ones a human reviewer happens to notice.
2. Add a privacy-preserving "I think my answer is correct" channel so students can flag items they believe were unfairly marked wrong, and the maintainer can review those flags.

## Non-goals

- No cloud sync, no backend, no analytics, no automatic transmission of student data.
- No rewriting the single-file app architecture.
- No replacing expert human review; the infrastructure *supports* review, it does not replace it.
- No automated synonym discovery from external APIs at runtime.

## Why this matters

The 2026-08-24 manual audit found ~55 items with answer-acceptance bugs across ~450 curriculum items. Manual review caught the obvious cases but cannot guarantee full coverage. Structural invariant checks (parenthetical annotations, definite-form endings, article-stripping for disambiguation) can be automated and will catch entire classes of bugs mechanically. The remaining gap is synonym coverage and idiom correctness, which needs a reference corpus and expert eyes.

## Part 1: Extraction and audit infrastructure

### 1A. Item extraction (`scripts/lib/extract-all-items.mjs`)

A pure module that reads `index.html` and returns a structured catalog of every answer-producing item:

- `glossary`: array of `[no, es, category]` tuples
- `diagnosis`: array of diagnosis questions with `acceptedAnswers`, `options`, `variantRules`, `nearMissRules`
- `grammar`: array of exercises with `sentence`, `answer`, `options`, `hint`, `no` (Norwegian context), `word`/`base`
- `verbs`: array of verb entries with `infinitive`, `translation`, `presente[6]`, `participio`
- `sentencePuzzles`: array of `{ no, words[] }`
- `prepositions`: array of `{ no, es, hint }`
- `vocabularyAnswerAlternatives`: the alternatives map
- `norwegianNounDefiniteForms`: the definite-forms map

This module is the single source of truth for downstream checks and tests.

### 1B. Content accuracy auditor (`scripts/check-content-accuracy.mjs`)

Runs invariant checks on the extracted catalog. Each check fails loudly with the offending item IDs.

**Checks that do not need a reference corpus (mechanical):**

1. `parenthetical-annotation-has-clean-form`: every glossary `no` containing `(...)` must have an entry in `vocabularyAnswerAlternatives` that lists the clean form (without annotation) as accepted.
2. `definite-form-ending`: every `el/la` noun whose `no` is a simple single token must have a definite form in `norwegianNounDefiniteForms` OR the auto-generated form (`no + 'en'` for non-e-ending, `no + 'n'` for e-ending) must be morphologically plausible. Flag known-bad patterns like double endings (`dagenen`).
3. `alternative-map-orphan`: every key in `vocabularyAnswerAlternatives` must reference a `no` that exists in the glossary OR a known synthetic direction. Orphans indicate stale entries after glossary edits.
4. `definite-form-map-orphan`: every key in `norwegianNounDefiniteForms` must reference a `no` that exists in the glossary (or a documented synthetic case like `jula` -> `jul`).
5. `glossary-duplicate-pair`: flag exact duplicate `[no, es]` pairs (already partially covered, but generalize).
6. `glossary-prompt-collision`: flag `no` values that map to multiple *different-meaning* `es` values without an `answerConstraint` or a `vocabularyAnswerAlternatives` disambiguation entry. This is the structural version of the `juice` bug.
7. `verb-conjugation-completeness`: every verb in `verbDatabase` must have 6 presente forms and a participio. Flag empty slots.
8. `verb-translation-has-leading-aa`: flag verb translations that do not start with `å ` when the glossary convention expects it (consistency check).
9. `grammar-distractor-identity`: for each grammar exercise, flag if any distractor option equals the correct answer (case-insensitive). This is a regression guard.
10. `diagnosis-answer-id-uniqueness`: already covered by `check-diagnosis-catalog.mjs`; leave it.
11. `sentence-puzzle-word-count`: every puzzle must have at least 2 words and the `no` must be non-empty.
12. `accent-form-present`: flag Spanish answers that contain `n` but should contain `ñ` (compare against a known list of ñ-words: `año, mañana, niño,ña, español`-variants). This is a targeted regression guard, not a full spell check.
13. `sentence-puzzle-correct-order`: the `words` array is the correct sentence; verify that joining it produces a non-empty string with no leading/trailing whitespace per word.

**Checks that *would* need a reference corpus (documented, not implemented here):**

14. `synonym-coverage`: for each `no`, look up valid Spanish translations in a reference corpus and verify all are in `acceptedAnswers`. **Requires expert-curated reference data.**
15. `translation-idiomaticity`: verify that the Spanish translation is idiomatic and age-appropriate. **Requires expert review.**
16. `distractor-validity-in-context`: verify each grammar distractor is actually wrong in the shown context. **Requires semantic analysis.**

The script will report which mechanical checks ran and which corpus-dependent checks were skipped.

### 1C. Fuzz answer-acceptance test (`tests/answer-acceptance-fuzz.spec.js`)

For every vocabulary card, generate plausible correct variants and verify each is accepted:

- Strip articles from Spanish (`el libro` -> `libro`)
- Add articles to bare Spanish nouns when glossary uses articles
- Add/remove Norwegian definite forms
- Strip parenthetical annotations from Norwegian prompts
- Generate accent-stripped variants (verify they classify as `accent_or_case_variant`, not `correct`)
- Generate `ñ` -> `n` variants (verify they classify as `wrong`, not `accent_or_case_variant`)

This catches "correct answer marked wrong" systematically.

### 1D. Accent/ñ regression for every Spanish answer (`tests/spanish-accent-regression.spec.js`)

For every Spanish string in the glossary and diagnosis catalog that contains an accent or `ñ`, verify:
- Accent-stripped form classifies as `accent_or_case_variant` (near-miss)
- `ñ` -> `n` form classifies as `wrong` (full miss)
- Original form classifies as `correct`

## Part 2: Student feedback channel

### 2A. Privacy model (required by AGENTS.md before collecting free-text)

**What data is collected:**
- `itemRef`: the item identifier (glossary pair, diagnosis question id, grammar exercise id)
- `promptShown`: the prompt the student saw
- `studentAnswer`: what the student typed/selected
- `expectedAnswer`: the answer the app marked as correct
- `studentExplanation`: free-text the student writes to justify their answer
- `createdAt`: ISO timestamp
- `studentLabel`: the existing `studentName` (elevkode/fornavn) IF the student opts in; default is `"anonym"`

**Why it is needed:**
- To catch answer-acceptance bugs the audit infrastructure cannot detect mechanically (synonyms, idioms, regional variants, edge cases).
- To give students a voice when they believe an item is wrong, improving fairness and trust.

**Where it is stored:**
- Locally in `localStorage` under `spansk123_studentFeedback_v1`.
- No automatic transmission to any server.
- No third-party services.

**How it reaches the maintainer:**
- A teacher (or the student themselves) opens the new "Tilbakemeldinger" view.
- The teacher clicks "Eksporter tilbakemeldinger" to download a JSON file.
- The teacher emails the file to the maintainer out-of-band.
- The maintainer reviews, updates the catalog, and ships a fix.

**Retention:**
- Stored locally until the teacher exports and deletes.
- The export view has a "Slett alle" button for cleanup after export.
- No automatic expiry (the student may want to flag between class sessions).

**Access:**
- Only the local device can read the feedback.
- The teacher export is a manual, explicit action.

**Deletion:**
- "Slett alle" button in the feedback view.
- Individual delete per entry.
- `resetAllData()` already clears all `spansk123_*` keys and will include the feedback key.

**Risks and mitigations:**
- Risk: student writes personal data in the explanation field.
  Mitigation: the dialog shows a clear warning: *"Forklaringen lagres bare på denne enheten. Lærer kan eksportere og sende til utvikler. Skriv ikke navn på andre elever."*
- Risk: student name is attached without consent.
  Mitigation: the dialog has an explicit "Signér med elevkode" checkbox, default unchecked (anonymous).
- Risk: feedback accumulates indefinitely on a shared device.
  Mitigation: teacher can bulk-delete after export.
- Risk: free-text is used to bully or send inappropriate content.
  Mitigation: teacher reviews before forwarding; teacher can edit/delete entries before export.

**Guardrail compliance:**
- Not silent: the student actively writes and saves. ✓
- No backend: everything is local. ✓
- No third-party services. ✓
- No automatic student identifier collection: anonymous by default. ✓
- Export is a core safety feature and is not bypassed. ✓
- Documented in README and AGENTS.md. ✓

### 2B. UI implementation

**Trigger:** after a wrong answer in vocabulary practice, mixed quiz, verb conjugation, or grammar exercise, show a small "Mener du at svaret ditt er riktig?" link below the feedback.

**Dialog contents:**
- Title: "Jeg mener svaret mitt er riktig"
- Read-only summary: prompt, your answer, expected answer
- Textarea: "Forklar hvorfor (valgfritt, men hjelper oss)"
- Warning line about local storage and teacher export
- Checkbox: "Signér med elevkode (anonym som standard)"
- Buttons: "Lagre innspill", "Avbryt"

**Storage shape (`spansk123_studentFeedback_v1`):**
```json
{
  "schemaVersion": 1,
  "entries": [
    {
      "id": "fb-1234567890",
      "itemRef": "glossary:bror:el hermano:es-no",
      "source": "vocabulary",
      "prompt": "el hermano",
      "studentAnswer": "broren min",
      "expectedAnswer": "bror / broren",
      "studentExplanation": "Broren min er også riktig for el hermano",
      "studentLabel": "anonym",
      "createdAt": "2026-08-24T12:00:00.000Z"
    }
  ]
}
```

**New "Tilbakemeldinger" view (teacher/student-facing):**
- Accessible from settings or a discrete nav entry.
- Lists all entries with delete buttons.
- "Eksporter til JSON" button.
- "Slett alle" button with confirm.

### 2C. Regression tests for feedback

- Saving a feedback entry writes to the correct localStorage key with schema v1.
- Anonymous by default; student label only included when checkbox is checked.
- Export produces valid JSON matching the schema.
- Delete removes the entry.
- `resetAllData()` clears feedback.
- The "I think this is correct" link appears after a wrong answer in vocabulary, mixed quiz, verb, and grammar sessions.

## Files to change

- `scripts/lib/extract-all-items.mjs` &mdash; new extraction module
- `scripts/extract-all-items.mjs` &mdash; new CLI wrapper that writes `output/audit-items.json`
- `scripts/check-content-accuracy.mjs` &mdash; new auditor
- `package.json` &mdash; add `check:content-accuracy` and `extract:items` scripts
- `index.html` &mdash; feedback UI, storage, export, delete, nav entry
- `tests/answer-acceptance-fuzz.spec.js` &mdash; new fuzz test
- `tests/spanish-accent-regression.spec.js` &mdash; new accent/ñ regression
- `tests/student-feedback.spec.js` &mdash; new feedback lifecycle test
- `README.md` &mdash; document feedback channel and privacy model
- `AGENTS.md` &mdash; reference the privacy model and audit infrastructure
- `thoughts/shared/plans/2026-08-24_content-audit-infrastructure.md` &mdash; this plan

## Test plan

- `npm run extract:items` writes a fresh `output/audit-items.json`.
- `npm run check:content-accuracy` fails on any mechanical invariant violation.
- `npm run check:content` still passes (existing guard).
- `npm run check:diagnosis-catalog` still passes.
- `npm run check:learning-catalog` still passes.
- `npx playwright test --workers=1 --browser chromium` &mdash; all existing + new tests pass.
- `git diff --check` clean.

## Open questions for maintainer

1. Should the feedback view be student-visible or teacher-only? Current plan: visible to whoever opens the device (consistent with the no-login model).
2. Should there be a rate limit on feedback submissions to prevent abuse? Current plan: no, since storage is local and teacher curates.
3. What email address should the export instructions tell the teacher to send to? Current plan: leave a placeholder in README, maintainer fills in.
