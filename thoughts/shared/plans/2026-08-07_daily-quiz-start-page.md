# Daily quiz start page plan

## Goal
Make the authenticated start screen focus on the daily mixed quiz while keeping diagnosis-first onboarding and all manual learning destinations available.

## Non-goals
- No streaks, badges, cloud accounts, analytics, or backend data.
- No removal or rewrite of vocabulary, verb, grammar, games, homework, or brainmap sessions.
- No automatic quiz completion or answer reveal.

## Acceptance criteria
- A returning pupil with completed or skipped diagnosis lands on a Start page with one primary `Start dagens quiz` action.
- A new pupil sees the diagnosis flow before the personalized quiz; quiz action is unavailable until diagnosis is complete or skipped via import.
- Imported progress with skipped diagnosis lands on the same daily quiz start page.
- Manual destinations remain reachable from navigation and from the Start page.
- Existing direct `showPage('vocab')` and classroom flow tests remain valid.
- Start page and daily quiz have no horizontal overflow on mobile.

## Files to change
- `index.html` - Start page markup, navigation, authenticated landing logic, and local-only destination actions.
- `src/styles/tailwind.css` - responsive Start page layout and primary/secondary action styling.
- `dist/tailwind.css` - regenerated CSS artifact.
- `tests/start-page.spec.js` - diagnosis-first, returning pupil, imported recovery, and navigation tests.
- `package.json` - `test:start-page` and `test:all` registration.
- `thoughts/shared/plans/2026-08-07_adaptive_quiz_brainmap_redesign.md` - record Slice 3 completion.

## Steps
1. Add failing tests for authenticated landing states and preserved manual navigation.
2. Add Start page and route handling with the smallest state-dependent render function.
3. Add responsive styling and verify mobile overflow.
4. Run start-page, adaptive-quiz, diagnosis, import/export, PWA/UI, and full regression tests.
