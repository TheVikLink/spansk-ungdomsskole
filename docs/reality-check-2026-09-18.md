# Project reality check — 18 September 2026

Historical assessment of build `7cdca7c4bfee2b48`, made before the follow-up implementation on the same date. Its findings and test limitations below describe that snapshot, not the repaired app. See the [current release verification](release-verification-2026-09-18.md) for build `9028eaf8e4ba8273`, completed local gates, corrected Brainmap coverage and the still-open teacher/device/pupil checks. No deployment is claimed.

Product decision after this assessment: the owner requires only owner-supplied recordings, with an error when audio is unavailable. All TTS, including local voices, is forbidden. This supersedes the local-voice proposal below; `gdco` implements complete TTS removal instead.

## Verdict

The project has a substantial, real implementation of a no-login Spanish practice tool. It is not just a prototype screen or a collection of stubs. However, **the current evidence does not justify an unconditional “ready for classroom use” sign-off**.

The sensible next milestone is a bounded, teacher-supervised pilot after targeted fixes and verification. It is not a complete A0–A1 course, a validated assessment of CEFR proficiency, or a school platform with accounts and teacher dashboards. Those are different promises.

The main gap is now reliability and evidence at the boundaries: practice routing, local speech synthesis, the meaning of green content checks, and actual use on school devices. Adding more activities before closing those gaps would make readiness harder to establish.

## Scope and evidence boundary

This is a periodic project assessment using the `reality-check-for-project` workflow: documentation defines the intended product; current code, tests, and reproductions establish its actual state. It is not an exhaustive expert review of every Spanish item or every archived plan.

Sources reviewed include README, AGENTS, PILOT, PILOT-READINESS, foundational pilot/adaptive-learning plans, relevant Brainmap/scaffolding/content/privacy/listening plans, existing audit reports, and Beads. The wider plan inventory was checked for goals and scope. Targeted code and test inspection followed those promises.

Snapshot:

- Branch: `fix/brukertest-2026-09-08`; HEAD: `c602199`.
- Assessed working-copy app build: `7cdca7c4bfee2b48`, not just HEAD.
- There are 83 previously staged files. The assessment did not change app code or tests.
- Before this assessment: 178 Beads issues — 168 closed, 9 open, 1 deferred, none in progress. Four follow-ups were added; closed-issue counts are not a completion percentage for the product.
- The public GitHub Pages build could not be verified in this session. Local implementation must not be described as already shipped.

Status terminology below: **PARTIAL** means a concrete gap was found. **UNPROVEN** means implementation exists, but current end-to-end/classroom proof is incomplete. It does not mean the feature is necessarily broken. No browser-dependent feature is labelled freshly verified end to end.

## Vision versus implementation

| # | Testable product goal and source | Current reality | Status / remaining proof |
|---|---|---|---|
| 1 | Pupils practise without accounts; progress stays local (README, AGENTS) | Local storage, manual export/import, reset, and explicit local feedback collection are implemented. Speech synthesis does not enforce a local voice. | PARTIAL: fix the speech boundary; verify on target devices. |
| 2 | Pupils can recover progress and import teacher vocabulary safely (README, pilot plan) | Import/export, validation/migration paths, and focused regression specs exist, including compatibility tests. | UNPROVEN for this release: fresh browser recovery round trip still required. |
| 3 | Pupils actively practise vocabulary, verbs, grammar and retrieval (README) | Extracted catalog has 522 glossary entries, 135 grammar exercises, 34 verbs and 28 sentence puzzles. Games are connected to language practice. | Implemented; mechanical checks pass. Classroom usefulness and full semantic accuracy remain UNPROVEN. |
| 4 | Diagnosis leads to adaptive daily practice and useful progress feedback (adaptive quiz/Brainmap plan) | Twelve diagnosis questions, adaptive selection, scaffolding and progress logic exist with regression tests. | UNPROVEN at release level: run the complete pupil journey and teacher review. Stars/bands are not a validated CEFR assessment. |
| 5 | Brainmap offers honest coverage and usable routes to practice (Brainmap plan) | Catalog has 64 skills: 38 marked ready, 26 planned. Ten ready skills resolve to a planned/coming-soon action. | PARTIAL: confirmed catalog/routing mismatch, not merely missing future content. |
| 6 | Short explanations and lessons support practice at A0–A1 (README, grammar plans) | Ten grammar topics and eight published lessons exist. Lesson checks pass. One published adjective lesson has inconsistent skill status. | PARTIAL integration; expert validation remains open. |
| 7 | Listening and dictation work with clear controls, including offline preparation (listening plans, README) | Five listening stories and five dictations are implemented. Inés/Diego now reference the supplied MP3s. Listening results are intentionally session-only. | UNPROVEN for pupil release: full audio/manuscript/pace/device approval and fresh offline proof remain open. |
| 8 | Teachers can assign local work without creating a cloud classroom (README, pilot plan) | Local homework packages and pupil summaries exist. A bounded lesson is documented in PILOT.md. | Core workflow implemented; richer activity templates and “Jeg kan” goals remain planned (`v0n`, `egb`). |
| 9 | A teacher can use the app confidently on school devices (PILOT.md, audit follow-ups) | Browser regression infrastructure and CI exist; prior audits have led to many fixes. | UNPROVEN: current full browser gate, physical-device checks and moderated pupil trial are not complete (`w7a`, `ee0`, `4or0`). |
| 10 | Future reading/account/dashboard/cloud features have a privacy-first foundation (AGENTS, future-product plans) | Reading-source review and account/privacy planning are tracked. These are not delivered school-platform capabilities. | Future scope, not a prerequisite for the no-login pilot. Privacy-plan issues do not implement the product. |

The 26 planned skills do not mean 26 concepts are entirely absent from the app: some appear in vocabulary, verb practice or productive patterns. Equally, a catalog row does not prove there is a complete, skill-specific learning sequence behind it.

## Confirmed gaps

### 1. The local speech guarantee is not enforced — P1

`getSpanishSpeechVoice()` in `index.html:12765` selects an `es-ES` voice, then any Spanish voice, without checking `localService`. `speakSpanish()` can also continue with an unspecified default voice when no Spanish voice is found.

A read-only execution of the unchanged selection function with a remote `es-ES` voice and a local `es-MX` voice selected the remote voice. In the Web Speech API, `localService: false` denotes a remote synthesis service. This makes the current selection logic inconsistent with a guaranteed local-only speech feature. See the [Web Speech API specification](https://webaudio.github.io/web-speech-api/).

This is **not evidence that a pupil's data was actually transmitted**. The reproduction used synthetic voice metadata and did not make a remote synthesis request. The risk is that pronunciation text, potentially including imported vocabulary, can take an unapproved service path.

Existing TTS tests mock voices without testing this boundary. New issue: `spansk-ungdomsskole-gdco`, following the closed `1id` implementation issue. Resolution must choose only explicitly local Spanish voices, avoid uncontrolled default fallback, explain unavailability, and test mixed, remote-only and empty voice lists.

### 2. Brainmap advertises readiness without usable practice routes — P2

Evaluating the current catalog and `getBrainmapSkillActionDescriptors()` (`index.html:20214`) produced:

- 64 skills, 38 ready, 26 planned.
- 29 descriptors with an action other than `planned`; this is a metadata count, not 29 browser-verified journeys.
- Ten ready skills with a `planned` action:

```text
a0.articles.indefinite_plural
a0.identity.age
a0.existential.hay
a0.possession.tener
a0.greetings.como_estas
a0.work.trabajar
a0.location.vivo_en
a0.professions.zero_article
a0.questions.que_es_eso
a1.prepositions.basic
```

`activateBrainmapSkill()` displays the no-practice/coming-soon state for those descriptors. Conversely, `a1.adjectives.common_gender` is marked planned despite having a published lesson and route. Planned metadata is also filtered by the grammar candidate builder.

The existing catalog test checks that ready skills have a truthy route; the string `planned` passes that assertion (`tests/brainmap-catalog.spec.js:24`). This explains how structural tests can stay green while the pupil-facing promise is inconsistent.

New issue: `spansk-ungdomsskole-x7ou`, following `u8l`. Reconcile status and routes, then test both the full catalog invariant and actual relevant practice/progress after clicking affected nodes. This does not require building all future skills or rewriting the app.

### 3. A green content audit overstates one safeguard — P2

Check 12 in `scripts/check-content-accuracy.mjs:247` tries to detect missing ñ. Its set contains forms with ñ, but the condition requires set membership and the absence of ñ at the same time. A calculated `ninVersion` is unused.

Running the unchanged check block against synthetic `el nino` and `espanol` entries reported no errors. These are deliberately corrupted test inputs, **not a claim that those errors currently exist in the pupil glossary**.

In addition, the reference corpus is largely generated from the same vocabulary and accepted alternatives, plus curated synonyms. Its passing checks establish useful consistency, not independent expert confirmation of every translation, idiom and distractor.

New issue: `spansk-ungdomsskole-do6v`. Add mutation tests for known error contexts, preserve legitimate words containing n, and make audit output/documentation distinguish automated coverage from remaining expert review.

### 4. Readiness documents describe different snapshots — P2

README lists nine grammar topics and seven lessons; the current implementation has ten/eight. PILOT-READINESS contains older readiness/test evidence. The opening status in the 15 September listening report still says Inés/Diego await replacement audio, although the working copy now uses the MP3s. PILOT.md and open human-review issues still require teacher/pupil validation.

New issue: `spansk-ungdomsskole-9l5u`. Preserve historical reports as historical, correct current counts, and give readiness claims a date and build/commit. Documentation must distinguish implementation, automated verification, teacher approval, and actual classroom use.

## Would completing the existing Beads finish the project?

**No.** Before this assessment, the open issues covered release verification (`w7a`), human review/pilot (`ee0`), audio approval (`4or0`), learning-goal language (`egb`), teacher activity templates (`v0n`), future reading-source review (`1bb`), account/privacy planning (`brq`, `nsx`), and an older follow-up epic (`t0b`). They did not explicitly cover the four gaps above. Those gaps now have actionable issues with verification criteria.

Even after those issues are resolved, the broader ambitions are not automatically delivered:

- Planned catalog coverage is not the same as a complete A0–A1 curriculum. There is no complete active implementation backlog for all 26 planned skills. Decide the intended curriculum breadth before commissioning it.
- The closed `nnx` issue delivered a model/property-testing design; the plan explicitly deferred implementation. It is not evidence that the proposed harness is running. Adopt it only through a separate implementation decision.
- Two similar Feide/privacy issues are planning gates, not implementations of login, subscriptions, dashboards or cloud progress. Those require a separate, privacy-reviewed product phase.
- No documented moderated classroom trial or learning-outcome evidence was found. `ee0` covers the next human evaluation, not a guarantee of effectiveness in advance.

These future gaps should not all be turned into blockers for a small no-login practice pilot. The pilot's promise must be narrower and explicit.

## Fresh verification on 18 September

The following command completed successfully:

```sh
npm run check:content &&
npm run check:content-accuracy &&
npm run check:grammar-lessons &&
npm run check:diagnosis-catalog &&
node --test tests/*.test.mjs &&
npm run check:learning-catalog &&
npm run check:tailwind &&
npm run check:offline-build &&
git diff --check
```

Results: 16 protected content corrections checked; 16 content-accuracy checks passed, subject to the limitations above; eight published lessons; 12 diagnosis questions; **20/20 Node tests passed**; learning catalog, generated Tailwind and offline build consistency passed. The learning-catalog command's four seed words are diagnostic seed data, not the total vocabulary.

A fresh browser probe was attempted:

```sh
npx playwright test tests/pilot-audit.spec.js --browser chromium \
  --workers=1 --max-failures=1 \
  --output=/private/tmp/spansk-reality-check-2026-09-18 --reporter=line
```

Chromium could not launch: `bootstrap_check_in ... Permission denied (1100)`. Result: one failed setup, three tests not run. Log: `/private/tmp/spansk-reality-check-browser.log`. This is an environment failure, not a reproduced application failure, and it supplies no fresh UI acceptance evidence. The full browser suite was not repeated after this confirmed restriction.

The earlier claim of 412 passing browser tests is not supported by a retained successful full-run result. The recorded full attempt included an offline-listening failure; a later isolated pass does not settle the full-suite result. `w7a` already records the correction. A fresh full run remains necessary.

CI is configured to run `test:all` in Chromium, but no current CI result was verified. Actual school-browser/mobile/audio behavior, a clean-profile recovery journey, and the current public deployment remain unverified here.

## Shortest credible route to a pilot

This is sequencing guidance; Beads remains the live task list.

1. **Close the concrete trust gaps.** Implement `gdco`, `x7ou` and `do6v` with focused failing-then-passing tests. Keep scope to voice selection, catalog/routing consistency and audit correctness. No new service, storage format or architectural rewrite is needed to address these findings.
2. **Establish a reproducible release candidate.** Complete `w7a` in an environment that can launch browsers and local servers: build, full suite with the required worker configurations, fresh-profile recovery and export/import, downloaded audio after an offline reload, and relevant mobile/keyboard checks. Investigate any recurring offline failure rather than treating an isolated pass as closure. Complete `9l5u` with the resulting evidence and known limitations.
3. **Approve the actual teaching material.** Complete `4or0`: a Spanish teacher checks all five listening stories and five dictations against scripts, questions, level, pronunciation and pace on school equipment. The user's positive listening assessment of Inés/Diego is useful evidence, but not the entire sign-off.
4. **Run a bounded, observed classroom trial.** Use the existing short lesson in PILOT.md and `ee0` rather than exposing the whole roadmap as a finished course. Record whether pupils can start independently, understand mistakes, recover progress and use the chosen activities. Resolve consequential findings before broader use; retain the longer follow-up in `ee0`.
5. **Expand only after that evidence.** Prioritize `egb` and `v0n` if teachers need clearer learning goals and lesson structure. Decide curriculum expansion and any account/cloud phase separately. A verified release candidate may be committed when Git access permits; publishing is a separate, user-authorized step, followed by checking the actual public build.

## Working-copy handoff

Only this report and Beads follow-up metadata were added by this assessment. No implementation fix, commit, push or deployment was performed.

Beads was exported with `bd --no-daemon sync`: 182 issues. The three new bug issues block the existing release-verification issue `w7a`; the dependency-cycle check passed. The report's whitespace check passed, and app/service-worker/generated-CSS hashes remained unchanged during the assessment.

The pending commit remains separate work. Working-tree whitespace checks pass, but the previously staged versions of the two 14 September listening plans still contain trailing-blank-line errors; their already-corrected working copies need to be staged when Git writes are available. This session environment previously denied creation of `.git/index.lock`.

The two company PDFs remain untracked and outside the staged changes, as requested. The three unrelated Amex files also remain unstaged. They are not protected by ignore rules, so any later blanket `git add` must not accidentally include them.
