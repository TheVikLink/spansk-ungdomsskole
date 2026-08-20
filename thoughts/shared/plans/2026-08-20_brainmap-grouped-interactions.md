# Brainmap: grouped clusters and local learning actions

## Goal

Make the existing local Brainmap easier to understand and act on by rendering the already-computed skill groups as collapsible clusters, adding strength-aware visual status, and ensuring every interactive learning node leads to a meaningful local practice or theory action.

## Non-goals

- Do not build a canvas, SVG, D3, force-directed graph, zoom/pan surface, or hidden gesture system.
- Do not add accounts, cloud sync, analytics, forums, free-text teacher Q&A, or microphone/audio storage.
- Do not change the learning catalog, progress schema, SM-2 calculations, export/import format, or existing vocabulary practice behavior.
- Do not add targeted quiz routes for skills that do not have a reliable skill-specific question/lesson mapping; those nodes must use a safe existing practice or explanation fallback.
- Do not remove the existing vocabulary/category practice fallback.

## Acceptance criteria

1. The Brainmap renders every catalog skill exactly once inside the correct `model.groups` group; no skill remains in a separate flat microskill list.
2. Each group exposes its aggregate status, number of skills, and an accessible expand/collapse control. The default state is usable on mobile and does not require hidden gestures.
3. Each skill node is a real keyboard- and pointer-accessible control with a clear Norwegian action label. Clicking/activating it always opens either a mapped local practice flow or a short local theory/explanation fallback; no dead-end control is rendered.
4. Vocabulary area cards retain their existing direction split and practice behavior, and also show word count plus mastered count and a visible “Trykk for å øve” affordance. Counts include imported-only runtime categories and are not limited to the seed catalog.
5. Status colors remain semantically unchanged (`gray`, `red`, `yellow`, `green`, `gold`), while strength may add a restrained intensity/opacity variation only within the existing status semantics. Unstarted nodes must not imply a numeric strength.
6. Existing progress calculations, group downgrade behavior, local storage, export/import, and legacy category practice remain unchanged.
7. The Brainmap remains understandable with keyboard navigation, focus styles, reduced motion, and narrow mobile widths.
8. Tests cover group membership/rendering, accessibility/action contracts, vocabulary counts, status intensity boundaries, and preservation of existing practice actions.

## Files to change

- `index.html`
  - Add pure display/action helpers for group summaries, strength intensity, runtime vocabulary counts, and safe skill-action resolution.
  - Update `renderBrainmap()` to render grouped collapsible clusters and actionable skill controls.
  - Add a local skill-detail/practice fallback that reuses existing practice/theory surfaces without changing progress storage.
  - Preserve `buildBrainmapModel()` calculations and `selectCategoryAndStudy()` behavior unless a narrowly scoped display field is needed.
- `src/styles/tailwind.css`
  - Style grouped cluster disclosures, selected/hover/focus states, strength intensity, action affordances, mobile layout, and reduced-motion behavior.
- `dist/tailwind.css`
  - Regenerated committed stylesheet consumed by `index.html`; update through the repository CSS build command and verify the generated selectors are present.
- `tests/brainmap-progress.spec.js`
  - Extend model/display contract coverage for group membership, aggregate metadata, and vocabulary counts.
- `tests/frontend-visual-audit.spec.js` and/or `tests/student-learning-flow-audit.spec.js`
  - Add browser-level checks for collapsed groups, keyboard activation, skill action routing, vocabulary practice affordances, and mobile-safe rendering.
- `thoughts/shared/plans/2026-08-20_brainmap-grouped-interactions.md`
  - Keep implementation notes and verification evidence if the plan needs refinement during coding.

## Step-by-step implementation

1. **Freeze the current contract.** Confirm `package.json` contains `build:css` and `test:all`, run the existing Brainmap tests, and inspect the current DOM selectors used by tests. Record any selectors that must remain stable, especially status classes, vocabulary category buttons, and the color legend. If either script is absent, stop and document the repository-supported replacement before implementation.
2. **Define pure display contracts first.** Add/test helpers that group skills by the existing `group` field, calculate group summaries, calculate Brainmap vocabulary counts from canonical runtime `cards` (not `getCategories().mastered`, whose legacy semantics must remain unchanged), and map strength to bounded visual intensity. Add a named pure helper, `buildBrainmapVocabularyAreas(cards)`, using the repository’s existing `normalizeCategorySlug()` as the merge key, `getVocabPairKey()` plus normalized category as the canonical card identity, and stable first-seen/category-name ordering. Imported-only categories render; duplicate canonical identities count once; seed/runtime areas merge by slug; and empty areas render `0 av 0` only when an area is explicitly present. The helper’s area IDs and practice category keys must be the same keys passed to `selectCategoryAndStudy()`.
3. **Define safe skill actions.** Create a total, explicit route table for every current catalog skill ID. The identity routes open a local skill-detail panel containing the skill explanation and a button that calls `startBrainmapSkillPractice(skillId)`. That helper filters the existing `diagnosisQuestionCatalog` by the skill’s `targetId`/skill mapping, resets any active session, and opens up to 3 matching local questions: use all available questions when fewer than 3 exist, and open the theory/explanation fallback without creating an empty session when zero exist. The identity routes must visibly show the first matching prompt and never submit/reveal it on activation. Both article skills open `startGrammarTopic('articles')`; `a1.gustar.basic` opens `startGrammarTopic('gustar')`; `a1.ser_estar.identity_or_location` opens `startGrammarTopic('serEstar')`; `a1.verbs.regular_ar.present` opens the verb page with `selectedVerbFocuses = new Set(['ar'])`; and `a1.verbs.regular_er.present` opens it with `selectedVerbFocuses = new Set(['erir'])`. Both verb routes reset `verbExercise`/active-session state, show the settings surface, and visibly show the selected focus before the student starts; they never auto-start or submit an answer. Each route must state theory behavior, reset behavior, and observable result. Test bidirectional equality between route keys and `learningCatalog.skills.map(skill => skill.id)` so new or obsolete IDs fail loudly. Do not render an actionable skill node without a mapped route, and do not omit the action silently. Test every route from a clean state and assert no answer/submission state changes, including fewer-than-three and zero-match fallbacks.
4. **Render grouped clusters.** Replace the flat microskill grid with native `details/summary` disclosures or an equivalent explicitly tested disclosure widget. All groups start closed except the first group; no disclosure state is persisted to storage; rerendering restores that deterministic default while preserving focus on the activated control where practical. Show group label, level/status summary, skill count, and a clear open/closed state. Keep stable IDs for `#brainmapMicroskills` and status classes, and introduce distinct selectors for group containers, skill controls, and vocabulary cards; update affected tests deliberately rather than relying on old `role="group"` selectors. Keep vocabulary areas in their own section and retain category practice buttons.
5. **Make skill nodes actionable.** Use real buttons/links rather than click-only articles. Include Norwegian accessible names, visible focus states, and an action label. Route to the explicit mapping/fallback without auto-starting an answer or revealing a solution.
6. **Improve status and vocabulary presentation.** Add bounded strength intensity within each status bucket, preserve the five semantic classes, and add total/mastered counts plus “Trykk for å øve” to the learning-map vocabulary-area cards. Use the existing runtime `cards` array and `getCategories()` data as the canonical vocabulary pool; the current mastery predicate is `card.noEs.repetitions >= 3 && card.esNo.repetitions >= 3`, with each canonical card counted once. Imported cards use their normalized canonical card identity, duplicates are not double-counted, empty categories show `0 av 0`, and direction imbalance remains a separate diagnostic. Verify imported/expanded categories whose pool size differs from the seed catalog, and verify unstarted cards remain non-numeric.
7. **Harden responsive/accessibility behavior.** Test narrow widths, keyboard-only open/close and activation, focus visibility, reduced motion, and no reliance on double-click/drag/pinch/ESC gestures. Keep opacity/intensity changes on decorative status backgrounds only; do not reduce text or border contrast. Add assertions for disclosure semantics (`summary`/expanded state or equivalent), group naming, focus order/retention, exactly one accessible control per skill, a visible focus outline, `prefers-reduced-motion` disabling transitions/animations, and stable readable status text.
8. **Build and run targeted verification.** Run `npm run build:css` before browser tests so `dist/tailwind.css` matches `src/styles/tailwind.css`; verify the generated stylesheet contains the new Brainmap selectors and run the repository-supported generated CSS consistency check (`npm run check:tailwind`). Then run the Brainmap tests, relevant frontend/student-flow tests, `git diff --check`, and the repository’s full `npm run test:all` command. Review generated CSS diff separately so unrelated pre-existing working-tree changes are preserved.

## Test plan

Run from the repository root:

```bash
npm run build:css
npm run check:tailwind
npx playwright test tests/brainmap-progress.spec.js
npx playwright test tests/frontend-visual-audit.spec.js tests/student-learning-flow-audit.spec.js
git diff --check
npm run test:all
```

Passing means:

- Existing Brainmap model tests remain green.
- Every rendered skill has exactly one group owner and one explicit, tested accessible action route; the action mapping keys equal the catalog skill IDs in both directions.
- Group disclosure and skill activation work by keyboard and pointer.
- Vocabulary counts and direction split remain correct.
- Status semantics and unstarted-node behavior remain unchanged.
- Existing practice, local progress, and export/import tests remain green.
- No whitespace errors are reported.

## Explicit action and vocabulary contracts

The implementation must add test-visible contracts rather than relying only on click handlers:

- A skill-action resolver returns a non-empty action descriptor for every current `learningCatalog.skills` ID, with either a practice target or a theory-plus-practice fallback.
- Activating a skill action never submits an answer or reveals a solution; it only navigates/opens the selected learning surface.
- Vocabulary-area totals and mastered counts come from the same runtime cards/categories used by vocabulary practice. A word counts as mastered only according to the existing mastered criterion in both directions; direction imbalance remains visible separately.
- Status intensity is bounded to the five existing status keys and never changes their meaning; gray/unstarted nodes do not expose a numeric strength. Strength is normalized to `[0, 5]`; for attempted nodes use deterministic intensity tokens `low` for `<2`, `medium` for `2–<4`, `high` for `4–<5`, and `max` for `5`, while gray/unstarted uses `none`. Clamp invalid values to `[0, 5]` and use `none` when attempts are zero.
- Brainmap vocabulary counts use a dedicated pure helper with the explicit AND mastery predicate (`noEs.repetitions >= 3 && esNo.repetitions >= 3`) and do not change legacy `getCategories()` counts or practice behavior. Tests cover seed categories, imported-only categories, duplicate normalized identities, empty areas, and directionally imbalanced cards.
- The eight skill routes are an explicit table with destination and expected observable result; tests fail if the table and catalog IDs diverge.

## Risks and safeguards

- **Wrong skill destination:** require an explicit mapping test per skill; use a non-destructive informational fallback instead of guessing.
- **Accidental auto-reveal:** skill actions may open practice/theory but must not submit or reveal an answer automatically.
- **Mobile overload:** use compact disclosures and test at narrow viewport widths before adding visual decoration.
- **Progress regression:** do not modify progress model/storage functions; exercise existing export/import tests after UI changes.
- **Status misinterpretation:** keep status classes and legend wording stable; intensity is secondary decoration, not a new mastery state.
- **Generated CSS drift:** treat `dist/tailwind.css` as a required generated artifact and run `npm run build:css` before UI verification.
