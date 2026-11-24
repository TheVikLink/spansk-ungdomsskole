# Tailwind Component System Migration

## Goal
Adopt Hulltetteren's Tailwind component reference locally and make the Spanish learning app load a local Tailwind-generated stylesheet instead of inline page CSS.

## Non-goals
- Do not migrate the app from static HTML/JavaScript to React in this pass.
- Do not remove chapter/category choice from vocabulary sessions; students still need it until teacher-pushed queues exist.
- Do not use the Tailwind CDN or any third-party runtime stylesheet.

## Acceptance Criteria
- Hulltetteren's `src/components/ui` and `docs/ui-tailwind-reference` are copied into this repo for reuse/reference.
- `index.html` links to a local generated Tailwind CSS file and no longer contains the large inline `<style>` block.
- Shared UI primitives such as buttons, panels, cards, inputs, progress bars, topic cards, and mode cards are defined in a Tailwind component layer.
- Existing flashcard, verb, grammar, and game flows still render and remain usable in Playwright.

## Files To Change
- `package.json`
- `src/styles/tailwind.css`
- `dist/tailwind.css`
- `index.html`
- `src/components/ui/**`
- `docs/ui-tailwind-reference/**`
- `thoughts/shared/plans/2026-05-14_tailwind-component-system.md`

## Test Plan
- `npm run build:css` builds `dist/tailwind.css` without errors.
- `npx --yes --package playwright node output/playwright/audit-fixes-check.cjs` passes existing smoke coverage.
- Add and run a focused Playwright check that confirms the Tailwind stylesheet is loaded and critical screens have computed component styling.
- `git diff --check` passes.
- `bd --no-daemon sync` succeeds.

## Steps
1. Copy Hulltetteren's Tailwind component source and reference examples into matching local folders.
2. Add a local Tailwind CLI setup with an input stylesheet and generated output.
3. Extract existing inline CSS into `src/styles/tailwind.css`, wrap it in Tailwind layers, and replace the HTML style block with a link to `dist/tailwind.css`.
4. Convert shared primitive classes to Tailwind `@apply` component definitions while keeping game animation CSS local.
5. Build CSS and verify the core app flows with Playwright.
