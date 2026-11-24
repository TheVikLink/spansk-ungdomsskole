# Four-Move Modernization & Product Unification Plan

Dato: 24. november 2026  
Eierbeslutning: Funksjonsfrysen fra 9. november 2026 løftes for denne firetrinnssekvensen.  
Koblede Beads-saker: `spansk-ungdomsskole-rbec.4`, `spansk-ungdomsskole-ya9r.11`, `spansk-ungdomsskole-hvc1`, `spansk-ungdomsskole-s70p`.

## Låste eierbeslutninger (24. november 2026)

1. **Prioriteringsfrys løftet for disse fire stegene:** Vi samordner skolesporet og den nye læringsfeeden/modulariseringen i én ren, testet kodebase i stedet for å holde tusenvis av linjer ucommittet på toppen av en formell frys.
2. **Gjenopprettingsstrategi (Valg 2B):** Vi beholder eksisterende to-database-runtime (`appPool` + `journalPool` i `server/revocation-journal.js` og `server/recovery.js`), men avslutter utviklingen av skreddersydd automatisert sky-restore-transport (`spansk-ungdomsskole-ya9r.11`) til fordel for den dokumenterte manuelle logiske gjenopprettingsrutinen (`pg_dump` -> lokal `verifyRestoredSchoolDatabase` -> import til målinstans på PostgreSQL 17.12, verifisert 24. november 2026).
3. **Opprydding i repo-rot og døde filer:** Selskaps-PDF-er i repo-rot (`Certificate of incorporation .pdf`, `Extract from commercial register.pdf`), 27 foreldreløse React/TypeScript-komponenter fra en matteapp i `src/components/ui/` og tilfeldig rot (`q`) fjernes fra arbeidstreet/git-indeksen (`git rm`).

---

## Move 1 — Stabiliser Git, Repo-hygiene og Én Sannhetskilde

### Mål
Null ucommittet taprisiko, null villedende dødkode, ryddig `.gitignore`, én kortfattet `docs/STATUS.md` (<= 100 linjer), oppdatert `AGENTS.md` og stram Beads-triage (<= 3 aktive `in_progress`-saker om gangen).

### Konkrete steg
1. **Sikkerhetskopi og opprydding i arbeidstreet:**
   - Fjern (`git rm`) `Certificate of incorporation .pdf`, `Extract from commercial register.pdf` og alle 27 `.tsx`/`.ts`-filer under `src/components/ui/`.
   - Slett tom fil `q` i repo-rot.
   - Oppdater `.gitignore` med `.worktrees/`, `.playwright-mcp/`, `tmp/` og `scripts/audit-sources/ordvev-index.json`.
2. **Arkiver historiske planer og samle status:**
   - Flytt eldre gjennomførte/erstattede planer fra `thoughts/shared/plans/` (før 18. november 2026, unntatt de kanoniske arkitekturplanene referert fra `AGENTS.md` og `README.md`) til `thoughts/archive/2026/`.
   - Opprett `docs/STATUS.md` (<= 100 linjer) som kanonisk, oppdatert teknisk og operativ statusoversikt.
   - Oppdater `AGENTS.md` slik at det løftede mandatet for firetrinnssekvensen og `docs/STATUS.md` reflekteres tydelig.
3. **Beads-triage:**
   - Sett aktive `in_progress`-saker som ikke lenger arbeides på aktivt tilbake til `open` (eller `closed` for `ya9r.11` i Move 2), slik at kun de reelt pågående oppgavene står som `in_progress`.
4. **Verifikasjonsport for Move 1:**
   - `npm run build:app`
   - `npm run check:offline-build && npm run check:vocabulary && npm run check:pronunciation && npm run test:school`
   - `git diff --check`

---

## Move 2 — Forenkle Skolelanseringens Driftshinder (Valg 2B)

### Mål
Avslutt det fem uker lange sporet med skreddersydd automatisert Supabase Management/Auth-transport (`ya9r.11`) og formaliser den allerede verifiserte manuelle logiske gjenopprettingsrutinen (`verifyRestoredSchoolDatabase`).

### Konkrete steg
1. **Oppdater `docs/feide/gjenoppretting-og-oppgradering.md` og `docs/feide/pilotskole/pilotstatus.md`:**
   - Dokumenter eierbeslutning 2B (24. november 2026): Manuell logisk dump + lokal journalreplay (`server/recovery.js` / `verifyRestoredSchoolDatabase`) + import i målinstans er valgt og verifisert driftsmetode for første skoleleveranse.
   - Fjern kravet om at `integrationReady=false` i lokale transporteksperimenter blokkerer første skoleleveranse.
2. **Lag et rent, kjørbar-ved-behov verifikasjons-/runbook-skript og sjekkliste:**
   - Sørg for at `docs/feide/gjenoppretting-og-oppgradering.md` har en tydelig 5-punkts operatørsjekkliste for manuell gjenoppretting og versjonsoppgradering med `verifyRestoredSchoolDatabase`.
3. **Lukk `spansk-ungdomsskole-ya9r.11` i Beads** med begrunnelse og pek `ya9r` til konkret utførelse av PG 17.12-oppgradering i Supabase-panelet.
4. **Verifikasjonsport for Move 2:**
   - `npm run test:school` (inkl. `tests/server/recovery.test.mjs` og `tests/server/school-flow.e2e.test.mjs`).

---

## Move 3 — Modulariser `index.html` og Oppgrader AI-Agent-Ergonomi

### Mål
Bryt ned `index.html` (31 497 linjer) inkrementelt uten atferdsendring til rene datafiler (`src/data/`), DOM-frie domenemoduler (`src/domain/`) og UI-moduler (`src/ui/`), bundlet til `dist/app.js` (IIFE, fungerer både over HTTPS, offline Service Worker og `file://`), samt legg til `ARCHITECTURE.md`, `npm run check:fast` og `npm run doctor`.

### Konkrete steg
1. **Stage 3.1 — Felles datakataloger (`src/data/`):**
   - Ekstraher innebygde kataloger (`diagnosis`, `recognition-theme`, `grammar-lessons`, `listening`, `dictation`, `verbs`, `grammar`, `prepositions`, `vocabulary`) til `src/data/`.
   - Oppdater `scripts/lib/extract-all-items.mjs` og `scripts/build-school-content.mjs` slik at skolebygg og innholdssjekker leser strukturerte data uten skjøre `node:vm`-uttrekk når mulig, samtidig som bakoverkompatibilitet med alle 20 skript og 11 `tests/*.test.mjs` ivaretas.
2. **Stage 3.2 — DOM-frie domenemoduler (`src/domain/`):**
   - Ekstraher og eksporter ren domenekode for svarvurdering/normalisering (`src/domain/answer-grading.js`), SM-2-repetisjon (`src/domain/sm2.js`) og lagringsskjema/eksport (`src/domain/storage-schema.js`) med enhetstester som kjører på < 1 sekund via `node --test`.
3. **Stage 3.3 — App-bundling (`src/app/` -> `dist/app.js`) og tynnere `index.html`:**
   - Flytt applikasjons-JS og genererte blokker (`pronunciation`, `culture`, app-logikk) ut av inline `<script>` i `index.html` til `dist/app.js` generert under `npm run build:app`, mens alle globale funksjonsbindinger (`window.*`) beholdes for 100 % bakoverkompatibilitet med eksisterende HTML og Playwright-tester.
   - Oppdater `sw.js` (`APP_SHELL`), `scripts/build-offline.mjs` og `scripts/build-vercel-public.mjs` til å inkludere `./dist/app.js`.
4. **Stage 3.4 — Agent-ergonomi (`ARCHITECTURE.md`, `check:fast`, `doctor`):**
   - Opprett `ARCHITECTURE.md` (1 side) med modulkart, `spansk123_*`-lagringskontrakt og byggflyt.
   - Legg til `npm run check:fast` (< 5 s) og `npm run doctor` (`scripts/doctor.mjs` med `--json`-støtte) i `package.json`.
5. **Verifikasjonsport for Move 3:**
   - `npm run check:fast`
   - `npm run doctor -- --json`
   - `npm run build:app && npm run test:all`

---

## Move 4 — Foren Læringsfeed, 45-Minutters Undervisningstimer og Ekte Skolelekser

### Mål
Koble sammen de fire øyene (`/`, `/school`, `/undervisning/`, `docs/kultur/`) til én sammenhengende og intuitiv opplevelse for elever og lærere, og løft Feide-leksene fra kun 4-valgs radioknapper til ekte svarvurdering med full personvernminimering.

### Konkrete steg
1. **Elevflyt og navigasjon i hovedappen (`index.html` / `src/`):**
   - Forenkle velkomstskjermen slik at eleven kan starte direkte med ett trykk uten en tekstvegg om `localStorage`-sikkerhetskopi før første oppgave (behold tilgang til import og tydelig, kort lokal lagringsinfo).
   - Rydd opp i Gloser-kortene slik at kun det faktisk anbefalte valget merkes «Anbefalt i dag» (ikke alle tre moduskort samtidig), og lukk `<details class="nav-more">` som standard så toppmenyen er rolig og oversiktlig.
2. **Ekte øvingsmekanikk og bredere innhold i Feide-skolelekser (`server/`):**
   - Utvid `scripts/build-school-content.mjs` og `server/activity-catalog.js` med:
     - Kategori-spesifikke ordforrådspakker (knyttet til undervisningstemaene i tillegg til totalpakken).
     - Skrivesvar (`textInput` med aksepterte svar vurdert i minnet på serveren via felles normaliseringslogikk fra `src/domain/answer-grading.js`) i tillegg til flervalg, **uten** at elevens råtekst lagres i databasen eller logger (kun `outcome: 'correct' | 'incorrect'`, `attempt`, `hints_used` lagres i `learning_event`, dokumentert i `docs/feide/elevdataflyt.md`).
   - Oppdater `server/public/school.js` med støtte for tekstsvar + spanske aksentknapper (`á, é, í, ó, ú, ñ, ¿, ¡`) ved siden av flervalg, samt **batch-godkjenning** («Godkjenn alle ventende») og kopierbar invitasjonslenke for klassen.
3. **Koble 45-minutters undervisningstimer (`undervisning/`) direkte til leksetildeling:**
   - Legg til direkte handling i `scripts/build-lesson-plans.mjs` / `undervisning/` («Gi temaet som skolelekse» -> `/school?assignCategory=<tema>` og «Øv på glosene i appen») slik at læreren kan gå rett fra 45-minutters opplegg til leksetildeling med ett klikk.
4. **Verifikasjonsport for Move 4:**
   - `npm run build:app`
   - `npm run check:fast`
   - `npm run test:school` og relevante Playwright-spesifikasjoner for startside, gloser, undervisningstimer og skoleflyt.
