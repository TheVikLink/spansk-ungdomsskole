# Lesson recording audit: mixed Spanish practice

## Evidence

- Recording: `Skjermopptak 2026-08-21 kl. 11.09.58.mov`
- Duration: 707.9 seconds (11:48)
- Route shown: live GitHub Pages vocabulary/mixed quiz flow.
- Directly observed: recognition cards show Spanish-only prompts with no Norwegian translation; the recording shows `Madrid ___ en España` with `es`, `está`, and `soy`, and `Hvordan sier du «Jeg er fra Norge»?` with only Spanish alternatives.
- Directly observed: the recording's quiz uses visible choice buttons and typed inputs; no native dropdown is visible in the sampled quiz items.
- Directly observed: quiz feedback exists after submission and requires a separate `Neste`/`Se resultat` action.
- Owner-reported and to reproduce: `te`/`le` for gustar, `gusta`/`gustan` contexts, `sus`/`tus`, `esta`/`esa`, and other prompts can accept multiple grammatical readings while marking one answer wrong.

## Critical findings

1. **Ambiguous assessment items (P0).** The exercise evaluates an answer that the displayed context does not uniquely determine. This is invalid formative assessment: a learner can reason correctly and still be marked wrong.
2. **Missing meaning/context scaffolding (P0).** Spanish prompts do not consistently include the Norwegian translation or a context sentence that fixes person, number, distance, definiteness, or discourse reference.
3. **Content quality debt (P0/P1).** The catalog needs a human-reviewed pass for gustar, pronouns, demonstratives, ser/estar, possessives, agreement, and idiomatic Norwegian instructions.
4. **Response-mode mismatch (P1).** The local code contains select-mode rendering and tests, but the supplied live recording shows no dropdown. This must be verified against the deployed commit and covered by a live-like browser test.
5. **Continuation design (P1).** The result screen has “Ta en ny quiz”, but the reported learner flow routes to gloser after one quiz. The next action should explicitly favor another mixed quiz and make the mixed-practice loop obvious.
6. **Legacy vocabulary launcher (P1).** The category grid and chapter controls expose implementation history instead of a learner-first choice. New/review selection, automatic category choice, and teacher-owned content need a simpler split.
7. **Shared progress contract (P0/P1).** Quiz answers write `spansk123_learningProgress_v1`, while vocabulary practice also updates local card/SR state. The relationship is not yet demonstrated end-to-end; tests must prove both systems update the intended shared learning signal without double-counting.

## Required product rules

- Never mark an answer wrong when the visible prompt supports more than one grammatical answer.
- Every multiple-choice item must have one correct option under the exact visible context; otherwise convert it to typed production or add enough context.
- For demonstratives and possessives, show the Norwegian meaning/context explicitly, e.g. “den der borte” versus “denne her”, and “søstrene hennes” versus “søstrene dine”.
- Show a short explanation and the correct interpretation immediately after every answer; retain the learner's answer.
- Keep the student in the mixed quiz loop after completion; gloser is secondary navigation.
- Keep content migration local-first and preserve export/import compatibility.

## Implementation order

1. Freeze and audit the question catalog; rewrite or remove ambiguous items.
2. Add content invariants and browser regressions for unique-answer behavior.
3. Verify/select response modes against the exact deployed build.
4. Fix post-quiz continuation and shared progress tests.
5. Redesign vocabulary entry only after the content and progress contracts are stable.

---

## Addendum 2026-08-21 (session 2): verified root causes

Frame-by-frame ffmpeg audit (47 frames @ 15s + detail frames @ 2s) plus code review on branch `adaptive-response-modes` (HEAD 295748b). All owner complaints reproduced and root-caused.

### A. Grammar ambiguity - exact items (`index.html` `grammarTopics`)

All exercises are hardcoded `{ sentence, answer, options, hint }`. The disambiguating meaning lives only in `hint`, hidden behind the "Vis hint" button (or shown after a wrong answer). Verified ambiguous items:

- **gustar** (7136-7189): `___ gusta el chocolate` (Me/Te/Le/Nos all valid), `___ gusta bailar?` (Te intended, Le = usted valid), `___ gustan las peliculas de terror` (Nos intended, ALL four valid), `___ gusta mucho esta cancion` (Me intended, "Le gusta..." valid).
- **possessives** (7293-7349): `Como se llaman ___ hermanas?` (tus intended, sus valid), `Donde esta ___ libro?`, `___ amigos vienen manana`, `Me gusta ___ casa`, `Donde estan ___ llaves?` - all ambiguous without person context.
- **demonstratives** (7241-7290): `___ casa es grande`, `Me gusta ___ cancion`, `Quien es ___ chica?` lack any distance cue; five other items embed the Norwegian hack `(der borte)` inside the Spanish sentence.

Contrast: reflexive exercises anchor via verb form (`___ levanto` -> only "Me") and are fine. `A mi hermano ___ gusta el futbol` is fine (anchor phrase). Pattern: items are valid only when the visible sentence itself fixes the answer.

Extra bug: `getGrammarScaffold()` (7419-7462) keys scaffolds as `demonstrative`/`possessive` (singular) but topic ids are `demonstratives`/`possessives` - the tailored scaffolds for exactly these two topics never render (generic fallback instead). `getGrammarMistakeExplanation()` uses plural keys and works.

Owner decision (given): show the Norwegian translation sentence visibly per question; drop `(der borte)`.

Fix design: add `no` field (full Norwegian sentence) to every exercise in gustar/possessives/demonstratives (audit articles/adjectives/serEstar/reflexive too); render it as a visible subtitle above the Spanish sentence in `showGrammarExercise()`; rewrite items so exactly one option is correct under the visible context; remove `(der borte)` from sentence text; fix scaffold keys.

### B. "Sent to gloser after 1 quiz" - deployment + cache, not local code

- Deployed `main` = 5360d24 (Aug 20). Local branch `adaptive-response-modes` (295748b) has the new results screen with "Ta en ny quiz" primary buttons top and bottom (`finishMixedQuiz()`, 4783-4833) - PR #2 is OPEN, unmerged (visible in recording: `gh pr create` done, merge suggested but not executed).
- `sw.js` is cache-first with hardcoded `CACHE_NAME = 'spansk123-v3'`, unchanged since Aug 10 (0768983). In 0768983, `finishMixedQuiz()` had ONE button: "Tilbake til oeving" -> `showPage('vocab')`. Students who visited before a cache bump keep running the old build indefinitely. Video confirms: quiz ended -> straight back to Gloser page, no results screen.

Fix: merge PR #2 to main AND bump `CACHE_NAME` so the new build actually reaches clients. Strengthen the results screen to prompt repeated quizzes (mixed practice loop).

### C. Missing dropdowns - three stacked causes

1. Select-mode code (`mixedQuizSelect`, `vocabSelect`, adaptive response modes) exists only on `adaptive-response-modes`; `git show main:index.html` has 0 matches.
2. Service worker cache-first serves the old build (see B).
3. In glosemodus, select mode is dead code even on the branch: `getVocabularyResponseMode(srData)` (5221-5226) reads `srData.strength`, but SM-2 direction data `{ easeFactor, interval, repetitions, nextReview, lapses }` never has `strength` - so mode is always 'flip' (except the ~25% typed-forced reviews). Test `vocab-learning-mechanics.spec.js` passes only because it injects synthetic `{ strength }` objects.

Fix: deploy (B) + derive glosemodus response mode from SM-2 fields (map repetitions/interval to flip/select/typed).

### D. Two parallel progress systems (shared state question)

- Glosemodus: SM-2 per card per direction on `cards`, persisted to `spansk123Data_v4` via `rateCard()`.
- Quiz/diagnosis: strength 0-5 cells in `spansk123_learningProgress_v1` via `answerMixedQuizItem()`/`answerDiagnosisQuestion()`.
- Neither writes the other. Brainmap reads BOTH (skills from learningProgress, word-area mastery from SM-2 repetitions >= 3), so the same word can show "Svaert sterk" and "never reviewed" simultaneously.

Fix options: (1) two-way bridge: quiz vocab answers also schedule the SM-2 card (map outcome to quality), card ratings also update the learningProgress cell; (2) longer term, unify on one model. Keep export/import compatible either way.

### E. Glosemodus entry (legacy from last year)

- Category picker is a collapsed `<details>` with chips (165-175); legacy chapter focus cards ("Kapittel 7/8") still render on deployed main; on branch `chapterFocusOptions = []` (dead UI code remains, markup 139-145).
- Owner wants a more elegant solution than the temporary one. Proposal direction: make the mixed quiz + Brainmap the primary entry (Brainmap already has "Velg en kategori aa oeve paa"), keep glosemodus as simple Repeter/Nye-valg, auto-select categories by due/new state instead of manual chip picking.

### Work order (session 2)

1. Grammar `no` field + item rewrites + scaffold key fix + ambiguity invariant test (P0).
2. Deploy unblock: merge PR #2, bump SW cache (P0, requires owner approval for git mutation).
3. Glosemodus response-mode fix (strength from SM-2) (P1).
4. Shared progress bridge (quiz <-> SM-2) with tests (P1).
5. Glosemodus entry redesign after 1-4 stabilize (P2).
