# Adaptive quiz and brainmap redesign plan

## Goal
Redesign Spansk på 1-2-3 around a local first-use diagnosis, daily mixed 10-question quizzes, and a visual brainmap that tracks vocabulary and grammar/verb microskills across lower-secondary Spanish levels.

## Non-goals
- Do not add login, cloud sync, analytics, teacher dashboards, backend persistence, or third-party data collection.
- Do not require a real pupil name. Diagnosis must work with pseudonym/elevkode and store only local learning state.
- Do not remove or break local progress export/import.
- Do not copy proprietary KwizIQ content or lesson text; use the general microskill idea and write our own content.
- Do not frame the product as specifically 9th grade. It must support 8th, 9th, and 10th grade pupils with different prior knowledge.
- Do not implement the full redesign in one slice.

## Privacy and first-use contract
- The welcome screen continues to accept `fornavn eller elevkode`.
- Copy must explicitly say pupils can use a nickname/elevkode and do not need a real name.
- Diagnosis can run after any non-empty local display name/elevkode.
- Stored identity remains the existing local-only `spansk123_studentName`.
- Diagnosis must not add new personal identifiers.
- No diagnosis answer, score, streak, or brainmap data leaves the device.
- Export/import remains the only data movement mechanism unless a later privacy model explicitly changes this.
- If browser storage/cache is cleared, the pupil must identify themselves locally again with the same nickname/elevkode; this is not an account login and does not recover data by itself.
- The welcome screen must offer import of a previous progress export. A successful import that has no diagnosis state marks diagnosis as skipped at `A0`, restores the imported progress, and lets the pupil continue without taking the diagnosis again.
- Imported progress must show an explicit "Diagnose hoppet over" state and explain that the pupil can run diagnosis later; importing must never claim that a diagnosis was completed.

## Narrow first implementation slice
First slice must stop before the adaptive daily quiz and start-page rewrite.

Deliver only:
1. Stable A0/A1 `skillsCatalog` seed.
2. Versioned local learning progress schema.
3. Migration/export/import compatibility.
4. First-use diagnosis quiz and result screen.
5. Initial brainmap status derived from diagnosis.

Explicitly defer:
- adaptive 10-question daily quiz selection
- start page simplification
- focus quiz from brainmap nodes
- streaks and badges
- teacher assignment targeting microskills
- A2/B1/B2 expansion

## Beads breakdown
Create separate Beads with dependencies instead of one large implementation task:
1. `Define adaptive progress schema and migrations`
2. `Add A0/A1 skills catalog and content quality checks`
3. `Implement diagnosis quiz v1`
4. `Render diagnosis brainmap v1`
5. `Implement mixed adaptive quiz v1`
6. `Simplify start page around daily quiz`
7. `Add local quiz streaks`

Dependencies:
- 2 depends on 1 for stable IDs and schema references.
- 3 depends on 1 and 2.
- 4 depends on 1 and 3.
- 5 depends on 1, 2, and 4.
- 6 depends on 5.
- 7 depends on 5 and must include date/import edge cases.

## Storage contract

### LocalStorage keys
- Existing keys remain unchanged:
  - `spansk123_studentName`
  - `spansk123Data_v4`
  - `spansk123_practiceHistory`
  - `spansk123_activeAssignment`
  - `spansk123_lastExportDate`
- New keys:
  - `spansk123_learningProgress_v1`
  - `spansk123_diagnosis_v1`
  - later only: `spansk123_quizStats_v1`

### `spansk123_learningProgress_v1`
```js
{
  schemaVersion: 1,
  createdAt: "2026-08-07T10:00:00.000Z",
  updatedAt: "2026-08-07T10:05:00.000Z",
  wordProgress: {
    [wordId]: {
      noToEs: ProgressCell,
      esToNo: ProgressCell
    }
  },
  skillProgress: {
    [skillId]: ProgressCell
  }
}
```

### `ProgressCell`
```js
{
  strength: 0,       // integer 0-5
  attempts: 0,
  correct: 0,
  lapses: 0,
  dueAt: null,       // ISO string or null
  lastSeenAt: null   // ISO string or null
}
```

Defaults:
- Missing `ProgressCell` means unknown and normalizes to strength `0`.
- Missing `attempts`, `correct`, or `lapses` normalizes to `0`.
- Missing or invalid dates normalize to `null`.
- Unknown skill IDs are preserved on import but ignored by current brainmap rendering.
- Unknown word IDs are preserved on import but ignored if no matching card/content item exists.

### `spansk123_diagnosis_v1`
```js
{
  schemaVersion: 1,
  status: "not_started" | "in_progress" | "complete",
  startedAt: null,
  completedAt: null,
  questionIds: [],
  answers: [
    {
      questionId: "diag.a0.articles.definite_singular.1",
      targetType: "skill" | "word",
      targetId: "a0.articles.definite_singular",
      direction: null | "noToEs" | "esToNo",
      correct: true,
      responseMode: "choice" | "typed",
      answeredAt: "2026-08-07T10:04:00.000Z"
    }
  ],
  resultBand: null | "A0" | "A0+" | "A1-start" | "A1",
  recommendedSkillIds: []
}
```

## Migration and import/export contract

### Runtime migration
1. Read existing keys as today.
2. Read `spansk123_learningProgress_v1`.
3. If missing, initialize empty schema v1.
4. If corrupt JSON, preserve corrupt value using existing corrupt-storage backup pattern and initialize empty schema v1.
5. If schemaVersion is unknown/newer, preserve raw data and ignore for rendering. Do not crash.
   - Copy the raw value to `spansk123_learningProgress_unsupported_<timestamp>`.
   - Set an in-memory `learningProgressWriteBlocked = true`.
   - Do not write empty v1 data back to `spansk123_learningProgress_v1`.
   - Export should include the unsupported raw value only as `unsupportedLearningProgressBackup` metadata, not as active v1 progress.
   - Writes may resume only after a compatible migration/import path explicitly normalizes the data to current schema.
6. If schemaVersion is lower than current, migrate in pure function before saving.

### Export
`buildProgressExportData()` must include:
```js
learningProgress: { ...schemaV1 },
diagnosis: { ...diagnosisV1 }
```

Existing export fields must remain compatible:
- cards
- practiceHistory
- activeAssignment
- grammarProgress
- verb progress/settings if currently exported

### Import
`importProgressData()` must:
1. Accept old exports with no `learningProgress` or `diagnosis`.
2. Normalize v1 learning progress when present.
3. Preserve unknown valid future fields in the imported object only if current export already has an extension mechanism; otherwise ignore safely.
4. Never delete existing cards/history unless the existing import flow already does so intentionally.
5. Preserve corrupt local values before recovery using the existing corrupt-storage pattern.

### Migration test matrix
- No new keys: initializes empty progress and diagnosis.
- Cleared browser storage followed by a full export import: restores local identity/progress and skips diagnosis when the export has no diagnosis state.
- Corrupt `spansk123_learningProgress_v1`: app loads, corrupt backup key created, empty progress used.
- Old export without new fields: imports successfully, new progress defaults empty.
- New export with new fields: imports and restores progress/diagnosis.
- Unknown skill ID in import: preserved in storage, not rendered as a current node.
- Unknown schemaVersion: app loads without crashing, creates unsupported backup, blocks writes to the active progress key, and does not overwrite newer data with empty v1.

## Progress update contract

### Answer evaluation categories
`resultKind` must be one of:
- `correct`
- `accent_or_case_variant`
- `near_miss`
- `wrong`
- `skipped`

Policy:
- `correct`: fully correct.
- `accent_or_case_variant`: accepted as correct for A0/A1 unless the specific skill is accent-sensitive.
- `near_miss`: not correct, but gives lighter penalty and explanation. Examples: missing article, one-letter typo where answer is still identifiable.
- `wrong`: incorrect.
- `skipped`: no answer.

### Strength transition
Use deterministic integer transitions:

| Current | correct | accent/case | near_miss | wrong | skipped |
| --- | --- | --- | --- | --- | --- |
| 0 | 2 | 2 | 1 | 0 | 0 |
| 1 | 2 | 2 | 1 | 0 | 0 |
| 2 | 3 | 3 | 2 | 1 | 1 |
| 3 | 4 | 4 | 2 | 1 | 1 |
| 4 | 5 | 5 | 3 | 2 | 2 |
| 5 | 5 | 5 | 4 | 3 | 3 |

Counters:
- `attempts += 1` for every answered/skipped item.
- `correct += 1` only for `correct` and accepted `accent_or_case_variant`.
- `lapses += 1` when current strength is `3+` and result is `wrong` or `skipped`.
- Clamp strength to integer `0..5`.

### Due date rules
Use local date math but store ISO timestamps.
- strength `0`: due now
- strength `1`: due tomorrow
- strength `2`: due in 2 days
- strength `3`: due in 4 days
- strength `4`: due in 7 days
- strength `5`: due in 14 days
- wrong/skipped: due now
- near_miss: due tomorrow

Tests should inject `now` into pure functions for determinism.

## Diagnosis contract

### Required question set
Diagnosis v1 has exactly these 12 question IDs in stable order:

| # | questionId | prompt | targetType | targetId | direction | responseMode | accepted answers | resultKind mapping |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `diag.vocab.greeting.hola.es_no` | `hola` | `word` | `core.hola` | `esToNo` | `typed` | `hei`, `hallo` | exact/accepted = `correct`; case variant = `accent_or_case_variant`; blank = `skipped`; otherwise `wrong` |
| 2 | `diag.vocab.greeting.takk.no_es` | `takk` | `word` | `core.gracias` | `noToEs` | `typed` | `gracias` | exact = `correct`; missing accent not relevant; one-letter typo = `near_miss`; blank = `skipped`; otherwise `wrong` |
| 3 | `diag.vocab.family.madre.es_no` | `la madre` | `word` | `core.madre` | `esToNo` | `typed` | `mor`, `moren`, `mamma` | accepted = `correct`; blank = `skipped`; otherwise `wrong` |
| 4 | `diag.vocab.number.fem.no_es` | `fem` | `word` | `core.cinco` | `noToEs` | `typed` | `cinco` | exact = `correct`; one-letter typo = `near_miss`; blank = `skipped`; otherwise `wrong` |
| 5 | `diag.a0.identity.me_llamo.typed` | `Skriv: Jeg heter Ana` | `skill` | `a0.identity.me_llamo` | null | `typed` | `me llamo ana` | exact/case variant = `correct`; missing `me` or `llamo` = `near_miss`; blank = `skipped`; otherwise `wrong` |
| 6 | `diag.a0.identity.soy_de.choice` | `Hvordan sier du "Jeg er fra Norge"?` | `skill` | `a0.identity.soy_de` | null | `choice` | `Soy de Noruega` | selected correct = `correct`; no selection = `skipped`; otherwise `wrong` |
| 7 | `diag.a0.articles.indefinite_singular.choice` | `___ casa` | `skill` | `a0.articles.indefinite_singular` | null | `choice` | `una` | selected correct = `correct`; no selection = `skipped`; otherwise `wrong` |
| 8 | `diag.a0.articles.definite_singular.choice` | `___ libro` | `skill` | `a0.articles.definite_singular` | null | `choice` | `el` | selected correct = `correct`; no selection = `skipped`; otherwise `wrong` |
| 9 | `diag.a1.verbs.regular_ar.present.hablar` | `yo + hablar` | `skill` | `a1.verbs.regular_ar.present` | null | `typed` | `hablo` | exact = `correct`; missing h tolerated as `near_miss`; blank = `skipped`; otherwise `wrong` |
| 10 | `diag.a1.verbs.regular_er.present.comer` | `tú + comer` | `skill` | `a1.verbs.regular_er.present` | null | `typed` | `comes` | exact = `correct`; one-letter typo = `near_miss`; blank = `skipped`; otherwise `wrong` |
| 11 | `diag.a1.gustar.basic.choice` | `Me ___ el fútbol` | `skill` | `a1.gustar.basic` | null | `choice` | `gusta` | selected correct = `correct`; no selection = `skipped`; otherwise `wrong` |
| 12 | `diag.a1.ser_estar.identity_or_location.choice` | `Madrid ___ en España` | `skill` | `a1.ser_estar.identity_or_location` | null | `choice` | `está` | selected correct = `correct`; no selection = `skipped`; otherwise `wrong` |

The catalog slice must define these `word` and `skill` targets before diagnosis UI work starts. Changing any question ID after release requires a diagnosis schema migration.

### Diagnosis progress writes
- Each completed diagnosis answer updates exactly one progress cell:
  - `targetType === "word"` updates `wordProgress[targetId][direction]`.
  - `targetType === "skill"` updates `skillProgress[targetId]`.
- The same strength transition table and due-date rules apply to diagnosis answers.
- Progress writes happen after each answer, not only at diagnosis completion, so resume is deterministic.
- Re-answering the same diagnosis question during the same in-progress diagnosis must first remove/reverse the previous answer effect or, simpler for v1, disallow back-navigation after answer submission.
- Restarting diagnosis replaces `spansk123_diagnosis_v1.answers`, `questionIds`, `startedAt`, `completedAt`, `resultBand`, and `recommendedSkillIds`.
- Restarting diagnosis does not delete existing `wordProgress` or `skillProgress` unless the pupil explicitly confirms `Nullstill læringskart`.
- If first slice does not implement restart UI, the data contract still must be written this way for later compatibility.

### Result band
Use simple deterministic thresholds from answered questions:
- `A0`: 0-4 correct
- `A0+`: 5-7 correct
- `A1-start`: 8-10 correct
- `A1`: 11-12 correct

The band is initial guidance only. Later quizzes can move individual nodes independently.

### Incomplete diagnosis
- If `status === "in_progress"`, app resumes diagnosis at first unanswered question.
- If question IDs are missing or unknown, restart diagnosis after user confirmation.
- Returning pupils with existing progress can skip/restart diagnosis from settings, but first slice can leave this as an explicit follow-up if not implemented.

## Adaptive quiz contract (deferred until after first slice)
This section defines the later quiz engine before coding starts.

### Input
```js
buildMixedQuiz({
  cards,
  skillsCatalog,
  learningProgress,
  diagnosis,
  now,
  seed,
  size: 10
})
```

### Buckets
Target mix:
- 4 vocabulary due/weak
- 3 skill due/weak
- 2 recently introduced or diagnosed weak
- 1 confidence item with strength `4+`

### Candidate sorting
Each candidate gets:
1. due status: due before not due
2. lower strength before higher strength
3. higher lapse count before lower lapse count
4. older `lastSeenAt` before newer
5. stable `id` alphabetical as final tie-break

Seed is used only for shuffling within equal score groups. Tests can pass a fixed seed.

### Fallback rules
- If a bucket has too few items, fill from the next weakest available candidates across all types.
- No duplicate `questionId` in one quiz.
- No same `wordId + direction` twice in one quiz.
- Same word may appear in both directions only if quiz lacks enough candidates and directions test different recall paths.
- Before diagnosis is complete, build a diagnosis/probe quiz only; do not show adaptive daily quiz as personalized.

## Brainmap contract

### Node types
- `skill`: one microskill ID from `skillsCatalog`.
- `vocabularyArea`: category/area derived from word cards or catalog vocabulary.
- `group`: aggregate display node containing child skill/vocabulary nodes.

### Node status thresholds
For single skill:
- gray: no attempts
- red: average strength `< 2`
- yellow: `>= 2` and `< 4`
- green: `>= 4` and `< 5`
- blue/gold: `5`

For vocabulary area:
- compute average of both directions for words in area:
  - `wordStrength = min(noToEs.strength, esToNo.strength)` for conservative display
  - area average from all known words
- detail panel must show direction split if they differ by `2+`.

For group:
- average child numeric values, but group color cannot be higher than yellow if any child is red and attempted.

### Rendering rules
- Do not display unknown imported future skill IDs as visible nodes.
- Do display current catalog nodes with no attempts as gray.
- Detail panel lists 2-4 representative examples and last practiced date if present.

## Content quality gate
Extend `npm run check:content` or add `npm run check:learning-catalog` before the catalog slice is complete.

Gate must validate:
- unique skill IDs
- valid level band (`A0`, `A0+`, `A1`, `A1+`)
- valid group
- no duplicate question IDs
- all diagnosis question IDs exist
- bokmål UI/explanation text present for each skill
- Spanish examples keep accents/diacritics where correct
- examples are age-appropriate for lower-secondary pupils
- catalog entries include a short `sourceNote`/provenance field such as `written-original`, `teacher-authored`, or `public-curriculum-inspired`

The script cannot prove copyright provenance. Every catalog/content PR or Bead completion must also include manual evidence:
- statement that lesson text and explanations are original
- statement that external products were used only for structural inspiration, not copied wording
- list of any public/open references used for factual checks

New test scripts must be added to `package.json`:
- `test:learning-progress`
- `test:diagnosis`
- `test:brainmap`
- `test:adaptive-quiz`
- `test:assignment-package`
- `test:grammar-explanations`

`test:all` must include them once the corresponding files exist.

## Regression checklist for every implementation slice
Automated or manual evidence must cover:
- returning pupil still auto-enters local app
- clean first-use flow works
- vocabulary session starts and records practice
- verb session starts and records practice
- grammar session starts, wrong explanation persists until advance
- games page still opens
- homework/lekse page still opens
- assignment package import still works
- progress export includes old and new data
- old export import still works
- app loads after corrupt new progress storage
- no external network submission is introduced
- mobile width has no horizontal overflow for changed screens

## Streak contract (deferred)
- Use local date string `YYYY-MM-DD` from the user's browser timezone.
- Completing the first quiz for a local day increments daily streak idempotently.
- Completing additional quizzes on the same day does not increment daily streak.
- `fiveQuizDays` increments only once when completed quiz count reaches 5 for that local day.
- Import merge policy:
  - union completed local dates
  - recompute current streak from merged date set
  - for same day quiz count, keep max count, not sum, to avoid double-counting device imports

## Files to change

First slice:
- `index.html`
  - schema constants
  - pure progress normalization/update helpers
  - diagnosis state helpers
  - diagnosis UI/result
  - brainmap v1 rendering from diagnosis
  - export/import additions
- `tests/learning-progress.spec.js`
  - schema normalization, strength transitions, due date rules
- `tests/diagnosis-flow.spec.js`
  - first-use diagnosis and result screen
- `tests/brainmap-progress.spec.js`
  - initial brainmap status after diagnosis
- `tests/import-export-compat.spec.js`
  - new schema export/import and old export compatibility
- `scripts/check-learning-catalog.mjs` if catalog validation cannot fit cleanly in existing content check
- `package.json`
  - add relevant test scripts when files exist
- `README.md`
  - update positioning and local-first diagnosis note

Later slices may extract pure logic to:
- `src/learning/catalog.js`
- `src/learning/progress.js`
- `src/learning/quiz-engine.js`

Extraction is allowed only after tests cover the moved functions.

## Acceptance criteria

First slice:
- Pupil can use pseudonym/elevkode and take diagnosis locally.
- Diagnosis stores `spansk123_diagnosis_v1`.
- Progress stores `spansk123_learningProgress_v1`.
- Diagnosis result shows initial band and at least three brainmap statuses.
- Old exports still import.
- New exports restore learning progress and diagnosis.
- Corrupt new progress key does not crash the app.
- Existing manual flows in the regression checklist still work.

Mixed quiz slice:
- `buildMixedQuiz` is deterministic with fixed `now` and `seed`.
- Bucket fallback rules are tested.
- No duplicates violate the quiz contract.
- Answers update the correct word direction or skill cell.
- Implemented in `spansk-ungdomsskole-cl6`: v1 uses the stable diagnosis/catalog question set plus existing vocabulary cards, and exposes the quiz from the existing vocabulary page. Daily streaks and start-page prioritization remain deferred.

Start page slice:
- Implemented in `spansk-ungdomsskole-6zt`: returning or imported pupils land on a dedicated Start page with Dagens quiz as the primary action; new pupils see diagnosis first; manual destinations remain available.

Brainmap slice:
- Node colors follow threshold contract.
- Vocabulary areas show direction split when relevant.
- Group aggregation follows the red-child cap rule.

Streak slice:
- Local date edge cases and import merge policy are tested.

## Step-by-step implementation

### Slice 1: Schema, catalog, diagnosis, initial brainmap
1. Create Beads for the first four dependency tasks.
2. Add schema constants and pure normalization/update helpers.
3. Add tests for `ProgressCell` defaults, corrupt storage recovery, strength transitions, and due dates.
4. Add minimal `skillsCatalog` with the 12 diagnosis question targets.
5. Add catalog/content validation.
6. Add diagnosis UI and local state.
7. Add result band calculation and brainmap v1.
8. Add export/import support.
9. Run the regression checklist.

### Slice 2: Mixed adaptive quiz
1. Add deterministic `buildMixedQuiz`.
2. Add fixed-seed tests for bucket selection, fallback, and duplicates.
3. Reuse existing answer components where possible.
4. Update progress after each answer.
5. Keep manual tabs available.

### Slice 3: Start page simplification
1. Make daily quiz the primary first screen after diagnosis.
2. Move manual activities to secondary navigation without removing them.
3. Verify desktop and mobile layouts.

### Slice 4: Brainmap depth
1. Add details panel per node.
2. Add `Øv dette` focus quiz.
3. Add vocabulary direction split display.

### Slice 5: Streaks
1. Add local `quizStats`.
2. Implement idempotent daily streaks and five-quiz day tracking.
3. Add export/import merge tests.

## Test plan

Planning/docs:
- `bd --no-daemon list --json`
- `git diff --check`

First implementation slice:
- `npm run test:learning-progress`
- `npm run test:diagnosis`
- `npm run test:brainmap`
- `npm run test:import-export`
- `npm run test:assignment-package`
- `npm run test:grammar-explanations`
- `npm run check:content`
- `npm run check:tailwind`
- `git diff --check`

Manual/browser checks before completion:
- clean first-use diagnosis desktop
- clean first-use diagnosis mobile
- returning pupil flow
- vocabulary, verb, grammar, games, lekse
- export/import recovery
- corrupt new localStorage key recovery
- no unexpected network requests

## Risks and mitigations

- Risk: schema churn breaks export/import.
  - Mitigation: versioned keys, migration matrix, and import/export tests before UI work.
- Risk: diagnosis feels like a school test.
  - Mitigation: soft copy, pseudonym support, short length, and useful feedback.
- Risk: adaptive quiz becomes untestable.
  - Mitigation: fixed `now`, fixed `seed`, stable tie-breaks, pure selection function.
- Risk: brainmap overstates mastery.
  - Mitigation: conservative vocabulary direction minimum and red-child cap for groups.
- Risk: gamification distracts from learning.
  - Mitigation: streaks reward completed retrieval quizzes only and remain visually secondary.

## Open decisions

- Should diagnosis be skippable with `Start på A0`, or mandatory before personalized quiz?
- Should all typed A0/A1 diagnosis answers accept accent variants, except specifically accent-sensitive skills?
- Should teacher leksepakker target exact microskills in the same slice as adaptive quiz, or wait until brainmap focus quizzes exist?
