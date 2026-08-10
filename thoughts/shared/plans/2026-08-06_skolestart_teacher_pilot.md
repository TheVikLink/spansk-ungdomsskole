# Skolestart teacher pilot plan

## Goal
Make Spansk på 1-2-3 safe and credible to pitch to Spanish teachers for a low-friction school-start pilot while keeping the current no-login classroom flow intact.

## Non-goals
- Do not implement Feide login in the pilot slice.
- Do not add backend persistence, analytics, cloud sync, teacher dashboards, or student accounts.
- Do not collect student identifiers beyond the existing local-only fornavn/elevkode field.
- Do not replace export/import without a compatibility and migration plan.

## Current findings
- Standard setup does not send pupils into Ole Henrik's class. The current app stores `studentName` and progress in localStorage, and README says external homework submission is off unless a teacher explicitly configures their own approved Google Forms setup.
- The bigger pilot gap is that other teachers do not yet have a productized no-login way to assign specific vocabulary/homework. Today they can import glossary JSON or paste OCR text, but this is an individual student action, not a clear teacher assignment workflow.
- The current homework model is generic weekly practice: at least two days of practice, with gloser, verbs and grammar counting. It does not yet support "this teacher assigned these exact words/tasks this week" in a portable way.
- There are existing Beads that line up with this work:
  - `spansk-ungdomsskole-ff9`: classroom pilot follow-up audit.
  - `spansk-ungdomsskole-nsx`: Feide/subscription privacy model.

## Product decision
Pitch the first version as a no-login pilot tool, not as a complete school platform.

The practical near-term win is:
- Teacher sends a ready-made assignment package or link.
- Students open/import it without logging in.
- Students practice locally.
- Students can show or export a local summary.
- No student data leaves the device unless the teacher/school separately chooses and documents an external submission channel.

## Pricing stance
Start below NOK 5,000 per school per year.

Suggested first offer:
- Free pilot: 2-4 weeks for selected teachers/schools.
- Early school license: NOK 3,000-4,000 per school per year.
- Keep it school-priced, not pupil-priced, until there is clear demand for administration and Feide.

Reasoning:
- Lower price reduces procurement friction for a solo/early-stage project.
- The immediate goal is feedback, classroom references, and proof that teachers want it.
- A cheap first cohort can later become reference schools for a stronger Feide/school-owner product.

## Acceptance criteria
- A teacher can understand the pilot offer in under two minutes from README or a dedicated teacher note.
- No code path or documentation implies pupils submit to Ole Henrik's private class.
- A planned no-login assignment workflow exists with explicit privacy boundaries.
- Feide work is scoped as a later phase with required privacy/data model before implementation.
- Pilot audit tasks are small enough to run and verify before contacting teachers.

## Files to change
- `thoughts/shared/plans/2026-08-06_skolestart_teacher_pilot.md` for this plan.
- `README.md` for teacher-facing pilot, privacy, pricing/trial positioning, and "no shared class" clarification.
- `index.html` for any necessary copy changes and later no-login assignment package flow.
- `eksempel-gloser-laerer.json` or a new example assignment JSON if we introduce assignment packages.
- `.beads/` via `bd` for task tracking.

## Proposed implementation phases

### Phase 1: Remove pilot confusion
1. Update teacher docs to state clearly:
   - Standard version has no shared class and no central teacher inbox.
   - Pupils do not join Ole Henrik's class.
   - External submission requires the teacher/school to configure its own approved endpoint.
2. Rename or soften UI copy where "Lever ukeslekse" could imply cloud submission. Suggested copy:
   - "Lag lekseoppsummering"
   - "Vis ukeslekse"
   - "Last ned oppsummering"
3. Verify that no hardcoded production Google Forms URL or personal teacher endpoint exists.

### Phase 2: No-login teacher assignment packages
1. Define `assignment-v1` JSON:
   - `schemaVersion`
   - `teacherDisplayName` optional
   - `schoolDisplayName` optional
   - `assignmentTitle`
   - `dueDate` optional
   - `instructions`
   - `vocabulary` rows
   - `requiredPracticeDays`
   - optional `verbFocuses`
   - optional `grammarTopics`
2. Add student import support:
   - Import assignment JSON.
   - Add vocabulary as custom words.
   - Save active assignment metadata locally.
   - Show assignment title and requirements on the homework page.
3. Add teacher helper:
   - Minimal static "lag leksefil" flow inside the app, or a documented JSON template first.
   - Keep it local: file generation in browser only, no server.
4. Preserve existing teacher glossary import compatibility.

### Phase 3: Pilot audit
1. Desktop flow:
   - Start app.
   - Import teacher assignment/glossary.
   - Practice gloser.
   - Practice verb.
   - Practice grammar.
   - View homework summary.
   - Export progress.
2. Mobile flow:
   - Repeat the same smoke path at narrow width.
3. Privacy/storage flow:
   - Clear site data and confirm clean start.
   - Import old/new progress JSON.
   - Confirm external submission is off by default.

### Phase 4: Teacher outreach package
1. Create a short teacher pitch:
   - Built by a Spanish teacher, tested in own classroom.
   - No login for pilot.
   - Local-first privacy.
   - Works on student devices.
   - Looking for 10-20 teachers to test around school start.
2. Create 2-3 ready-made pilot assignments:
   - "Første spansktime / repetisjon"
   - "Kapittelgloser"
   - "Verb i presens"
3. Create feedback questions:
   - Did pupils understand how to start?
   - Did the task fit your lesson?
   - What blocked you from using it again?
   - Would the school pay NOK 3,000-4,000 per year?

### Phase 5: Feide readiness
1. Keep Feide as phase 2 commercial work.
2. Before implementation, write:
   - Data model.
   - GDPR/privacy model.
   - Roles: pupil, teacher, school owner, service provider.
   - Retention/deletion/export rules.
   - No-login fallback decision.
3. Prefer OpenID Connect/OAuth2 if implementing Feide.
4. Remember Feide is opt-in per host organization; technical integration alone does not activate the service for schools.

## Test plan
- `bd --no-daemon list --json`
  - Passes if Beads can be read and the pilot work is trackable.
- `git diff --check`
  - Passes with no whitespace errors.
- For docs-only changes:
  - Read changed README sections and confirm they do not imply central collection or Ole Henrik's class.
- For later app behavior changes:
  - Serve `index.html` locally.
  - Verify assignment import, practice, homework summary, progress export/import, clean localStorage start, and mobile layout.

## Immediate next actions
1. Update README with pilot/pricing/no-shared-class clarification.
2. Create Beads for:
   - no-login assignment package workflow,
   - teacher pitch/readiness page,
   - pilot audit,
   - Feide privacy model.
3. Then implement the smallest no-login assignment package slice.
