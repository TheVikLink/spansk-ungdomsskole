# Skolestart Pilot Audit

## Goal

Verify the complete no-login classroom flow before inviting external teachers or students.

## Scope

- Fresh student start and diagnosis-first flow.
- Recovery after browser data loss through a previously exported local backup.
- Desktop/mobile layout for Start, quiz/vocabulary, Brainmap, and homework.
- Local homework summary with no external submission configured.
- Existing focused suites remain the detailed evidence for teacher import, assignment packages, PWA metadata, and progress compatibility.

## Non-goals

- No production deployment or external teacher contact.
- No Feide, login, cloud sync, analytics, or school account work.
- No new student data collection.

## Acceptance criteria

- Fresh pupil sees diagnosis before personalized quiz.
- Imported learning progress skips diagnosis and opens the daily quiz path.
- Core views have no horizontal overflow at 390px and render at desktop width.
- Default homework delivery opens no external URL and clearly says data was not sent.
- Findings are recorded as Beads or explicitly marked as no finding.

## Verification

```bash
npm run test:pilot-audit
npm run test:all
npm run build:css
git diff --check
```

## Resultat 2026-08-10

- Pilot-audit: 4 passed.
- Full `test:all`: passed, including content, catalog, progress, diagnosis, adaptive quiz, streaks, import/export, teacher packages, PWA/UI, grammar, verb, games, and pilot audit.
- CSS build and `git diff --check`: passed.
- No external URL opened by default homework delivery.
- No new follow-up bug Beads created from this audit.

## Targeted fixes 2026-08-10

- Teacher assignment builder is collapsed by default and remains explicitly openable from its summary.
- Mobile navigation is a compact, horizontally scrollable row; navigation and settings controls keep usable touch targets.
- Welcome name input has a visible focus ring.
- Vocabulary flashcards expose button semantics, focus, and Enter/Space activation.
- Brainmap nodes expose status text in their accessible names.
- Primary home CTA contrast and mixed-quiz feedback spacing were improved.
- Frontend audit regression coverage: 5 passed.
