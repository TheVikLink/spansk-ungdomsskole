# Visual Frontend Audit Fixes

## Goal

Improve the visual hierarchy and state communication identified in the GML 5.2 frontend audit, while preserving the existing start-to-diagnosis-to-quiz spine and local-first behavior.

## Scope assumption

The supplied audit text ends during finding 6. This plan covers findings 1–6 only. Findings after the truncated section must be added as a separate review before implementation scope is expanded.

## Non-goals

- No changes to diagnosis, adaptive quiz selection, learning progress, streak logic, import/export, or privacy behavior.
- No new color system, component framework, route, or architecture rewrite.
- No removal of the Brainmap data or practice-category actions.
- No change to the teacher-builder's already-fixed collapsed default.

## Findings covered

1. Establish heading weight hierarchy: H1 700, page H2 600, H3 600 where currently regular.
2. Normalize primary/secondary action styling and make home practice cards visibly tappable. Ensure enabled homework submission is a primary action.
3. Simplify welcome supporting text sizes without shrinking core controls.
4. Distinguish today's homework cell from ordinary days.
5. Separate Brainmap skills and vocabulary sections, reduce visual weight for unstarted nodes, and make the legend easier to scan.
6. Contain mixed-quiz feedback as a distinct result block with spacing from the next action: incorrect feedback uses red-50 (`#fef2f2`), a 4px left accent using the existing danger/red-500 token (`#ef4444`), and comfortable internal padding. Correct feedback should use the corresponding existing success palette rather than a new color.

## Acceptance criteria

- Headings have a measurable weight hierarchy: H1 700, page H2/H3 600, body text remains 400 unless already intentionally emphasized.
- Primary actions use one indigo token consistently; secondary actions use one gray token consistently.
- Home manual actions have a visible 1px border, a clear hover/focus state, and remain usable at mobile widths.
- Welcome helper/privacy notes use a small, consistent supporting-text scale; input and buttons remain at least 16px.
- Only `.homework-day.today` receives the indigo fill/border emphasis; ordinary unpracticed days remain neutral. Practiced/class-day states keep their meaning and precedence.
- Brainmap has explicit visible section labels for skills and vocabulary, a compact legend treatment, and quiet gray styling for unstarted nodes while red/yellow/green/gold states remain prominent.
- Mixed-quiz feedback has a bounded background/border/padding treatment and a visible gap before `Neste`/`Se resultat`; incorrect feedback uses red-50 plus the existing red-500 accent.
- Existing Brainmap accessible names, keyboard behavior, teacher builder behavior, and local progress behavior remain intact.

## Files to change

- `src/styles/tailwind.css`: heading weights, action tokens, welcome text rhythm, homework day states, Brainmap sections/cards/legend, quiz feedback container.
- `dist/tailwind.css`: regenerated via `npm run build:css`.
- `index.html`: add explicit Brainmap section headings/legend markup if CSS-only separation is insufficient; adjust enabled homework submit class only if current state logic requires it.
- `tests/frontend-visual-audit.spec.js`: computed-style and DOM regression coverage for the six findings.
- `package.json`: focused test script and `test:all` registration if a new test file is added.

## Implementation steps

1. Add failing tests for heading weights, button color consistency, home-card borders, welcome supporting text sizes, today's homework cell, Brainmap section labels/quiet unstarted state, and feedback containment.
2. Implement the typography and action-token changes using the existing `--primary`, `--primary-dark`, gray, and Tailwind tokens.
3. Implement homework today-state styles with explicit precedence rules for practiced and class-day cells; verify both current-day and non-current-day fixtures.
4. Add Brainmap section labels and legend markup, then style unstarted nodes as low-emphasis placeholders while retaining status text and accessible names.
5. Add the feedback result-block treatment and verify correct, incorrect, and final-question states.
6. Verify desktop and mobile widths, inspect overflow, run the focused suite, then run the full suite and CSS build.

## Test plan

Focused:

```bash
npm run test:frontend-visual-audit
```

Required full gates:

```bash
npm run test:all
npm run build:css
git diff --check
```

The focused tests should use `getComputedStyle`, bounding boxes, DOM semantics, and explicit state fixtures. They should not assert brittle browser-specific pixel snapshots unless a genuine visual regression cannot be expressed through stable computed-style assertions.

## Risks and mitigations

- Existing legacy CSS and Tailwind output can override one another. Always regenerate `dist/tailwind.css` before judging computed styles.
- Homework classes combine `practiced`, `today`, and `class-day`. Test all combinations so the new today treatment does not hide completion or class-day meaning.
- Brainmap currently uses dynamic HTML. Preserve `role="group"`, accessible names, status text, and category practice buttons while adding visual grouping.
- A truncated audit may contain additional findings. Do not silently broaden this work until the complete audit is available.

## Resultat 2026-08-10

- Findings 1–6 implemented.
- Focused visual audit: 6 passed.
- Full `test:all`: passed.
- CSS build and `git diff --check`: passed.
