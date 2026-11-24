# Enklere Gloser, mobilnavigasjon og Fremgang

Date: 5 October 2026. Requested by the product owner in this chat.

Planning issue: `spansk-ungdomsskole-hvc1.1`. Implementation epic: `spansk-ungdomsskole-hvc1`.
Beads owns work status and dependencies; this document specifies the intended product and implementation.
This is a prepared implementation plan. The app has not been changed or published by this planning task.

## Goal

Make it easy for a Norwegian learner to find an activity, start a short vocabulary session, understand feedback and find their progress on a phone, using the same learning core for independent practice and school use.

## Product decisions

- Start with Gloser, then change navigation, then apply the visual language across the learner app.
- Rename every current learner-facing “Brainmap” label to **Fremgang**.
- Mobile navigation has four visible destinations: **Start · Gloser · Fremgang · Mer**.
- Gloser has one primary start action and a short default round of **ten questions**.
- Choosing a topic or changing a setting prepares a session. Only the explicit start button starts it.
- Use one indigo accent for actions and selection, neutral page surfaces, and meaningful feedback colours.
- Remove decorative emoji from navigation, main headings and action labels. Keep graphics that explain an activity or earned reward.
- Independent learners can continue practising without a school account. School homework remains an easy-to-find purpose of the same learning product.

The B2C opportunity is a product hypothesis supplied by the owner, alongside the existing school direction. This plan does not claim market demand, full curriculum coverage or equivalence with Duolingo. A relevant initial promise is short Spanish practice with clear Norwegian explanations and visible progress. Pricing, consumer accounts and market validation are separate decisions.

The owner's cultural-learning proposal is developed in the companion [culture-pack plan](2026-10-05_kulturpakker-som-laererinngang.md). Begin with a complete Christmas lesson for Spain and Chile as a teacher entry point and reuse its language in practice. This does not block the Gloser delivery. Add Kultur under Mer only when an actual reviewed pack and a tested local route exist; do not add another permanent mobile tab or an empty promised area.

## Scope and boundaries

The first implementation changes the existing local learner app, its styles and its regression tests. It preserves the reviewed vocabulary source, accepted answers, adaptive response modes, progress rules, rewards and local recovery.

The school platform has a separate interface in `server/public/school.html`, `school.js` and `school.css`. This plan defines vocabulary that can later be shared with it; it does not redesign the teacher dashboard or change authentication, school membership, server grading or assignment snapshots. Follow the existing Feide plan for that work.

Out of scope: purchases, subscriptions, cloud sync, analytics, new identifiers, notifications, new audio, a replacement learning algorithm, a framework migration, automatic upload of local progress, deployment and DNS changes. Do not add dependencies for this UI work.

## Evidence and existing behaviour

Research used the current working copy and the public site on desktop and at 390 × 844. The working copy has substantial pre-existing changes, including school-platform work. Preserve those changes.

| Finding | Source and implication |
|---|---|
| Mobile header occupies several rows before content starts. | `src/styles/tailwind.css`: `.nav-bar`, `.nav-links` and the current 640 px media query. Replace the stacked mobile navigation with one row at the bottom. |
| Gloser leads with another mixed-quiz launcher, statistics, three mode cards and limits. | `index.html`: `vocabSettings`. Make the vocabulary start form the first content; mixed quiz remains available on Start. |
| Mode cards currently have different behaviours. | `selectVocabMode()` can start new practice immediately; the review card calls `startVocabSession()` directly. Give every selector the same prepare-then-start behaviour. |
| “Ten new words” can produce twenty directional questions. | `getNewCards()` creates separate Norwegian→Spanish and Spanish→Norwegian items; `startVocabSession()` slices at `newLimit * 2`. Describe the new short round in questions, not inferred word counts. |
| Review includes due items across categories. | `getDueCards(cards)` and `startVocabularyReviewFromHome()`. Keep this explicit; choosing a topic for new material must not silently exclude due review. |
| Existing navigation protects unfinished sessions. | `showPage()`, `getActiveSessionPage()` and `abandonActiveSession()`. Route every destination through that guard. |
| Answers come from an authoritative JSON source and generated tables. | `data/vocabulary-canonical-review.json`, `scripts/sync-vocabulary.mjs`. UI changes must not edit the vocabulary source or generated answer tables. |
| The public site and school staging are different deployments. | On 5 October, `www.spansk123.no` returned GitHub headers and CNAME `TheVikLink.github.io`; `app.spansk123.no/school` returned a Vercel access-protection redirect. Local completion does not update either site. |

Prior plans from 24 September already added explained activity cards, vocabulary recommendations and a collapsible mobile menu. Keep their useful explanations. Their diagnosis-gated quiz assumptions are superseded by the current direct quiz start. Existing tests asserting a quiz above vocabulary practice or immediate launch from a mode card encode behaviour deliberately changed here; update those expectations while preserving their functional coverage.

## 1. Gloser: the first complete delivery

### New or returning learner with no due review

The first screen shows this structure, using dynamic topic names from the existing category catalog:

```text
Gloser
Lær og repeter spanske ord.

Tema
[Velg tema …                           v]

10 oppgaver · norsk og spansk
[Start økten]

Tilpass økten                         v
Egne gloser og import                 v
```

Use a native labelled select for the initial topic choice. It includes available standard and teacher/custom categories. Do not select all thirty categories for a fresh learner, infer a grade or silently choose a difficulty. In the same page visit, a valid previously chosen single topic can stay selected. Do not add a new persistence key solely to remember this choice.

“Start økten” is unavailable until the required topic is chosen. Explain immediately beside the control: “Velg et tema for å starte.” After selection, show the actual available question count, capped at the default ten. A small topic may produce fewer questions; say so before starting. If no new items remain, offer “Velg et annet tema” and the existing optional extra-practice flow with its explanation. Do not automatically reset scheduling or show future review as due.

### Returning learner with due review

Use the same compact form, initially in review mode:

```text
Gloser
12 oppgaver klare for repetisjon
Denne økten: 10 oppgaver fra temaene du har øvd på.
[Start repetisjon]

Lær nye ord
Tilpass økten                         v
Egne gloser og import                 v
```

“Lær nye ord” changes the prepared form to new mode and exposes its topic selector. It does not start a session. Review does not require a topic. If only three review items exist, describe a three-question round. Keep the existing Start-page review shortcut and its existing limit until separately requested; do not silently change its tested maximum of fifty.

### Customisation and existing advanced tools

“Tilpass økten” contains the modes **Repeter gloser**, **Lær nye ord**, and **Repeter og lær nye ord**, a short-round question limit, the existing time limit and optional multiple-topic selection. Preserve the existing new/review caps as advanced controls initially; give them clear descriptions and show the resulting total in questions. Mixed mode retains the existing queue composition policy. Do not change its scheduling or priority as part of presentation work.

“Egne gloser og import” retains manual vocabulary, teacher JSON import, pasted chapter text, chapter focus, statistics and export/import access. These tools stay reachable, labelled and keyboard usable. Keep backup and recovery access in Settings too; consolidation must not remove recovery.

Remove the mixed-quiz launcher from Gloser. Keep “Dagens quiz” and its direct start on Start, including existing quiz streaks. Audit null references in `renderMixedQuizLauncher()` and `showPage('vocab')` when its former container disappears.

### Queue and session contract

- Add an optional total-question cap to `startVocabSession()` for the new launcher. Apply it to the existing composed queue before practice starts; default the launcher to ten.
- Calls that omit this option keep their current limits. This includes existing home review, chapter focus, targeted practice and homework entry points.
- The preview counts the same eligible directional items as the actual queue. Ten questions may cover fewer than ten distinct words; never call this “ten new words”.
- Both translation directions and the current flip→select→typed progression remain available. Answers are revealed only after the current meaningful-effort interaction.
- Avoid a second competing category state: the simple select and advanced category chips update the existing `selectedCategories` state. Changing selection does not write progress.
- If progress/import changes while the launcher is open, revalidate the queue on Start. An empty queue produces an inline Norwegian explanation, with no empty session or history entry.
- Undo, next question, accent feedback, saved answers, interruption and the result screen retain their current learning/accounting contracts.
- During a session, show its question, concise instruction, progress and required action first. At completion, “Øv mer” is primary and “Velg tema” secondary. Reuse the existing result logic.

### Observable acceptance

At 390 × 844, a fresh synthetic learner can see the topic control and start action without scrolling or expanding settings. From Gloser, starting a default new round requires only choosing a topic and pressing Start. With due review, one press starts it. The default new launcher starts at most ten questions; counts stay accurate with one-direction-only progress and small custom topics. No selection control starts an exercise unexpectedly. Correct and wrong answers, undo and a completed round work through the real UI.

## 2. Mobile navigation and Fremgang

For widths below 768 px, use a compact top row with the product name and a labelled Settings control. The nickname must not create another navigation row; keep its full value available in Settings. Use a single bottom navigation row:

```text
Start       Gloser       Fremgang       Mer
```

Labels remain visible; icons are optional small inline SVGs with `aria-hidden="true"`, without a new icon package. Use full **Fremgang**, not an abbreviation. At normal text size, target a top row of at most 64 px and bottom row of at most 72 px excluding device safe-area inset. These are layout targets, not fixed heights that clip enlarged text.

“Mer” opens a labelled, non-modal navigation panel immediately above the bar with **Verb, Grammatikk, Lytting, Spill, Lekser** and **Innstillinger**. Include a brief explanatory line for each activity. Use disclosure semantics, not an ARIA menu requiring a new arrow-key interaction model. Keep the existing navigation button IDs unique and preserve all eight page routes.

- “Mer” has `aria-expanded` and `aria-controls`. Enter/Space opens it. Escape closes it and returns focus to the trigger.
- Selecting a destination closes the panel, calls `showPage()` and focuses the destination heading/main area after a successful change. Do not move focus if the session guard cancels navigation.
- If a secondary area is active, give Mer an active visual indication and an accessible description such as “Gjeldende område: Verb”. Keep `aria-current="page"` on the actual destination, not on the disclosure trigger.
- Resize between phone and desktop without losing the current page or leaving destinations hidden. Desktop retains named top navigation with the same vocabulary.
- Add bottom clearance and `env(safe-area-inset-bottom)` so the bar never covers content, focused controls or result actions. Bound the open panel to the available height and allow scrolling within it.
- In vocabulary, quiz, verb, grammar, listening and dictation practice, suppress the global mobile bar while active. Keep an explicit “Avslutt økten” control in the compact session header, using the existing exit/accounting behaviour. Restore navigation on results or exit. Derive this from actual session state, not merely the page ID; inspect games separately so their existing exit remains reachable.
- A local homework package gets a visible shortcut on Start when present. Selecting it opens the existing local package; it is not a claim that an authenticated assignment has loaded. Without a package, the local Lekser area stays reachable in Mer.

For renaming, replace visible text in navigation, Start activity cards, page heading, help, feedback, result links, accessibility labels and current teacher-facing documentation. Keep technical identifiers such as `brainmapPage`, `navBrainmap`, `renderBrainmap`, skill IDs, storage keys and export schema unchanged. This is a name change, not a progress migration. Do not rewrite historical plans or test filenames for cosmetic consistency.

Acceptance: each of the eight destinations is reachable within two presses from normal mobile navigation, all can be used by keyboard, and Fremgang contains the same progress as before. Check 320, 360, 390, 640, 768, 1024 and 1440 px, plus enlarged text and portrait/landscape. No horizontal overflow, duplicate IDs, hidden focused controls or automatic session abandonment. Physical keyboard/viewport behaviour on iOS Safari and Android Chrome requires an actual-device check, not a desktop-emulation claim.

## 3. Consistent labels and visual language

### Vocabulary for the interface

| Purpose | Preferred Norwegian label |
|---|---|
| Home | Start |
| Vocabulary practice | Gloser |
| Progress overview | Fremgang |
| Verb practice | Verb; explanatory text uses “verbbøying” |
| Grammar | Grammatikk |
| Audio area | Lytting; retain the distinct activities Lyttehistorier and Diktat |
| Games | Spill |
| Local homework entry | Lekser; its content identifies a local leksepakke |
| Authenticated school assignments, in their existing interface | Mine lekser |
| Prepare a session | Tilpass økten |
| Start / evaluate / advance | Start økten / Sjekk svar / Neste oppgave |
| Deliberate card recall | Vis svaret, with the existing recall instruction |
| Leave active practice / dismiss a dialog | Avslutt økten / Avbryt |
| Repeat / change content | Øv mer / Velg tema |

Use these labels where the actions have those meanings. Do not mechanically relabel unrelated buttons, games or flashcard self-rating “Bra”/“Igjen”. Keep helpful distinctions between words, directional questions, answered items and correct answers. Preserve honest progress wording; “Fremgang” does not imply validated proficiency.

### Shared style rules

- Neutral page background, white content surfaces and subtle borders replace the full-page purple gradient and coloured activity panels.
- Start from the existing indigo action colour (`#4f46e5`), dark text (`#0f172a`), secondary text (`#475569`), neutral background (`#f8fafc`) and border (`#e2e8f0`). Verify rendered contrast before treating values as final.
- One filled primary button per local decision. Secondary actions use a neutral outline/text style. A selection highlight uses the same accent, not a separate colour for every mode.
- Green/red/amber describe outcomes or attention; they do not decorate ordinary navigation. Keep progress legends, text and reward tiers so colour is never the only explanation.
- Use shared spacing steps of 4, 8, 12, 16, 24 and 32 px, consistent 12 px surface corners and 8 px button corners. Limit shadow to modest elevation where separation helps.
- Use the existing system font. Mobile body/input text starts at 16 px; concise helper text may be smaller if readable. Avoid forcing headings into a clipped height.
- Remove rocket/book/brain/running-person emoji from navigation, principal CTAs and repeated headings. The product logo may retain its Spanish identity. Keep meaningful game illustrations and earned reward graphics; this work does not strip activity content of personality.
- Carry the same title, instruction, action, feedback and result hierarchy through Gloser, quiz, verbs, grammar and listening. Change presentation first, retaining each learning interaction and audio error message.
- Keep visible keyboard focus and reduced-motion support. Verify disabled controls remain understandable.
- Align HTML/PWA theme colours with the selected action colour when applying the shared style. Keep app name, scope, offline behaviour and install identity intact.

Accessibility checks use W3C guidance on [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) and [disclosures](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/). Our touch-control target is at least 44 × 44 CSS px; this is a chosen stronger product target, not the 24 × 24 minimum of WCAG 2.5.8. Verify at least 4.5:1 contrast for normal text, 3:1 for large text and relevant controls, with keyboard focus visible and unobscured. These checks do not establish whole-product accessibility compliance.

## Files and implementation sequence

Before coding, inspect `git status`, current branch and attached worktrees. Preserve the existing working-copy changes and use a `codex/` feature branch based on main under the repository branch policy. Do not reset the checkout or assume a fresh main worktree contains the latest uncommitted app/server work. Establish a reviewable baseline for the UI files before editing.

| Delivery / Bead | Explicit source paths and changes | Dependency |
|---|---|---|
| Plan / `hvc1.1` | `/Users/olehenrikvik/spansk-ungdomsskole/thoughts/shared/plans/2026-10-05_enklere-gloser-mobilnavigasjon-og-fremgang.md` | None |
| Gloser / `hvc1.2` | `/Users/olehenrikvik/spansk-ungdomsskole/index.html`: launcher, selectors, optional queue cap, empty states and result entry. `/Users/olehenrikvik/spansk-ungdomsskole/src/styles/tailwind.css`: compact vocabulary form and shared base styles needed for it. | `hvc1.1` |
| Navigation / `hvc1.3` | Same HTML/CSS: responsive navigation, disclosure/focus, session visibility, active-package shortcut and visible Fremgang text. `/Users/olehenrikvik/spansk-ungdomsskole/README.md` and `/Users/olehenrikvik/spansk-ungdomsskole/PILOT.md`: current labels and classroom entry instructions. | `hvc1.2` |
| Shared styling / `hvc1.4` | Same HTML/CSS: remaining learner headings, controls, feedback/result presentation, theme meta/favicon colour if applicable. `/Users/olehenrikvik/spansk-ungdomsskole/manifest.webmanifest`: theme consistency. | `hvc1.3` |
| Verification / `hvc1.5` | Relevant tests below and a concise local verification record in `/Users/olehenrikvik/spansk-ungdomsskole/docs/`; record actual checks and remaining external checks. | `hvc1.4` |

Generated outputs: `/Users/olehenrikvik/spansk-ungdomsskole/dist/tailwind.css`, build metadata in HTML, `/Users/olehenrikvik/spansk-ungdomsskole/sw.js`, and school-content outputs from `npm run build:app`. Generate them through the build; inspect generated diffs for unintended changes. Never hand-edit answer data as part of this work.

Within each delivery, write one meaningful failing test for the next behaviour, implement the smallest change, rebuild CSS/app as needed and rerun the closest test. Complete one delivery before the next. Do not extract large portions of the single-file app; any small logic extraction needs direct behavioural tests before it moves.

## Verification plan

### Focused regression coverage

Use the existing Playwright harness and file-based/local-server helpers. Add `/Users/olehenrikvik/spansk-ungdomsskole/tests/gloser-launcher.spec.js` for the new entry contract. Adapt current tests that operate old mode cards to the new explicit start interaction. Preserve their acceptance, queue, response-mode, undo and persistence assertions.

For delivery 1:

```bash
npm run build:app
npx playwright test tests/gloser-launcher.spec.js tests/vocab-learning-mechanics.spec.js tests/home-vocabulary-review.spec.js tests/chapter-focus.spec.js tests/teacher-glossary-import.spec.js tests/session-result-feedback.spec.js --browser chromium --workers=2
node --test tests/vocabulary-authority.test.mjs tests/home-vocabulary-review.test.mjs
```

Test a new profile, due review, new mode, mixed mode, fewer than ten eligible questions, partly learned directions, no topic, exhausted topic, custom/teacher topic, invalid import, selection without launch, repeat, undo and exit. Verify old home-review and local homework start calls retain their previous scope/limits. If an implementation changes a shared helper, include the callers' nearest regressions before proceeding.

For delivery 2:

```bash
npm run build:app
npx playwright test tests/report-mobile-navigation.spec.js tests/mobile-polish.spec.js tests/report-practice-navigation.spec.js tests/report-session-accounting.spec.js tests/start-page.spec.js tests/brainmap-progress.spec.js tests/brainmap-catalog.spec.js tests/assignment-package.spec.js tests/import-export-compat.spec.js --browser chromium --workers=2
```

Replace assertions for the old expanding top menu with the new disclosure contract. Test long nicknames, enlarged text, all routes, Mer close/focus, active-page indication, resizing, session-exit cancel/confirm, navigation restoration after results and the local-package shortcut. Assert visible “Fremgang” and unchanged progress/export content.

For delivery 3:

```bash
npm run build:app
npx playwright test tests/frontend-visual-audit.spec.js tests/dialog-accessibility.spec.js tests/pwa-and-ui-smoke.spec.js tests/listening-present.spec.js tests/tts.spec.js tests/session-result-feedback.spec.js --browser chromium --workers=2
```

Check contrast using rendered styles and direct colour calculation; inspect the real desktop/mobile screens. Automated screenshots alone are not visual approval. Keep missing/unplayable audio messages accessible and preserve the prohibition on substitute TTS.

Before implementation delivery:

```bash
npm run build:app
npm run test:all
git diff --check
bd --no-daemon sync
```

Passing means fresh zero exit codes and no unresolved relevant failures. On a failure, stop that slice, record the failing case and test a new hypothesis before continuing. Do not remove coverage simply because a selector or layout changed.

### Manual walkthrough and product checks

With clean synthetic profiles, inspect 390 × 844 and 1440 × 900, then narrow/landscape and enlarged-text cases. Walk Start → Gloser → topic → practice → correct/wrong feedback → result → Fremgang. Repeat with due review, a teacher vocabulary file and a local homework package. Interrupt a partly answered round, reload, export and import into a clean browser and check recovery. Test cached app-shell practice offline after the UI build.

Check typed answers with a real phone keyboard where available: the prompt, field, feedback and Next control must remain reachable. Verify safe-area clearance on iOS and Android separately. Mark physical-device checks unperformed if only emulation is available.

After local verification, run a small observed usability session with independent learners and teachers using fictional profiles. Ask learners to start a topic, locate progress and resume practice; ask teachers to locate vocabulary import and local homework. Proposed validation target: four of five learners start their first vocabulary round without instructions within thirty seconds after entering the app, and can find Fremgang without help. This is an evaluation target, not a measured result or release claim. Record only aggregate completion/time and UI problems; add no in-app tracking or recordings. Recruiting participants and school/student participation require their normal consent and arrangements and are not performed by writing this plan.

## Completion and next delivery

The planning task is complete when this document and the dependent Beads exist and text checks pass. The implementation epic stays open until its UI deliveries and local verification are complete. Actual learner observation and unavailable device checks must be reported honestly rather than inferred from regression tests.

The next ready implementation is `spansk-ungdomsskole-hvc1.2`: simplify Gloser. A public release remains a separate requested delivery step, with current migration and pilot gates respected. A later B2C experiment can test the same learner flow and positioning; it does not require introducing another learning engine or changing the school data model now.
