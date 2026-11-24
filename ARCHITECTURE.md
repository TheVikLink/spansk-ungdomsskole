# ARCHITECTURE.md – Spansk på 1-2-3

Énsides teknisk arkitektur- og modulkart for utviklere og AI-kodeagenter.  
For operativ prosjektstatus, se [`docs/STATUS.md`](docs/STATUS.md). For ufravikelige regler og personvern, se [`AGENTS.md`](AGENTS.md).

---

## 1. Produktflater og Katalogstruktur

| Flate / Mappe | Formål | Kilde / Bygg |
| --- | --- | --- |
| **`/` (`index.html` + `sw.js`)** | Lokal-først klasseromsapp uten innlogging (Læringsfeed på Start, Gloser med SM-2, Verb, Grammatikk, Brainmap, Lytting, Diktat, Uttale, Spill). | `npm run build:app` synkroniserer `data/*`, `src/data/*`, `src/pronunciation-*.js`, bygger `dist/tailwind.css` og stempler `APP_BUILD`-hash i `index.html` og `sw.js`. |
| **`/school` (`server/`)** | Feide/OIDC-skolemodus: klasseinvitasjon, lærergodkjenning, leksetildeling, «Fra læreren»-prioritet i feeden og minimert læreroversikt. | Express 5 + PostgreSQL (RLS + separat `journalPool` for revokering/sletting). Frontend i `server/public/school.{html,js,css}`. Øvelseskatalog bygges av `scripts/build-school-content.mjs`. |
| **`/undervisning/`** | 46 ferdige 45-minutters undervisningstimer (3 gratis prøvetimer + 43 lisensierte i **Undervisningspakken**) med gloseøkt, skriveoppgaver, lyttemanus, direkte leksekobling og utskrivbare A/B-partnerkort. | Genereres av `scripts/build-lesson-plans.mjs` fra `data/lesson-themes.json`, `data/lesson-culture.json` og `data/vocabulary-canonical-review.json`. Tilgang styres uten database av `server/undervisning-access.js`. |
| **`docs/kultur/`** | 7 kulturopplegg (Jul i Spania og Chile + 6 Mundo AM-land) med glosekobling til hovedappen. | Genereres av `scripts/build-culture-preview.mjs` fra `data/culture-packages.json`. |

---

## 2. Kildeautoritet (`data/` og `src/data/`) og Domenelogikk (`src/domain/`)

### Redigerbare datakilder
- [`data/vocabulary-canonical-review.json`](data/vocabulary-canonical-review.json) — **Eneste redigerbare kilde for standardgloser og godkjente svar (`es-no` / `no-es`).** Behold stabile `id`-er. `npm run sync:vocabulary` genererer `data/vocabulary-canonical.json` og oppdaterer `index.html`.
- [`data/vocabulary-recognition-theme.json`](data/vocabulary-recognition-theme.json) — «Spansk du kjenner igjen» (87 ord, startutvalg på 18, setningsbygging og ordfamilier).
- [`data/pronunciation-refold.json`](data/pronunciation-refold.json) + `src/pronunciation-*.js` — Uttaleskolen (31 lydkort, 62 Refold-opptak). Synkroniseres med `npm run sync:pronunciation`.
- [`data/culture-packages.json`](data/culture-packages.json), [`data/lesson-themes.json`](data/lesson-themes.json), [`data/lesson-culture.json`](data/lesson-culture.json) — Kulturpakker og 45-minutters undervisningstimer.
- **`src/data/*.json`** — Strukturerte JSON-uttrekk for [`listening-stories.json`](src/data/listening-stories.json), [`dictation-stories.json`](src/data/dictation-stories.json), [`diagnosis-catalog.json`](src/data/diagnosis-catalog.json), [`grammar-lessons.json`](src/data/grammar-lessons.json), [`learning-catalog.json`](src/data/learning-catalog.json) og [`verbs.json`](src/data/verbs.json). Kontrolleres/synkroniseres med `npm run check:catalogs` / `npm run sync:catalogs`.

### Delte, DOM-frie domenemoduler (`src/domain/`)
- [`src/domain/answer-grading.js`](src/domain/answer-grading.js) — `normalizeAnswerText`, `normalizeAccentVariant`, `evaluateTypedAnswer`, `evaluateAcceptedTextAnswer`, `compareDictationAnswer`. Deles mellom lokal enhetstesting og serverens in-memory svarvurdering i `server/activity-catalog.js`.
- [`src/domain/sm2.js`](src/domain/sm2.js) — Ren SM-2-repetisjonsalgoritme (`calculateNextReview`, `getIntervalText`).
- [`src/domain/audio-paths.js`](src/domain/audio-paths.js) — URL-byggere for lyttehistorier og diktat (`listeningAudioUrl`, `dictationAudioUrl`, `getDictationAudioUrls`).
- [`src/domain/school-license.js`](src/domain/school-license.js) — Tilstandsløs HMAC-SHA256 skolekode (`SP123.*`) for **Undervisningspakken** (null personopplysninger, null databaseavhengighet). Genereres med `npm run license:create -- --school="..." --expires=YYYY-MM-DD`.

---

## 3. Lokal Lagringskontrakt (`localStorage`) og Skole-Dataminimering

- **Lokal modus (`/`):** Ingen skyoverføring. Nøkler i `localStorage`:
  - `spanskSRData` / `spansk123_export_v1` (kortfremgang og eksportert JSON-sikkerhetskopi)
  - `spansk123_practiceHistory` (30 dagers rullerende økthistorikk med `sessionId`, `assignmentId`, `xp`)
  - `spansk123_learningProgress_v1` (ferdighetsprogresjon, `starResults` maks 20 boolske verdier, `verbForms`)
  - `spansk123_quizStats_v1`, `spansk123_diagnosis_v2`, `spansk123_dictation_v1`, `spansk123_pronunciation_v1`, `spansk123_studentFeedback_v1`
- **Skolemodus (`/school`):** Lagrer **aldri** elevens rå fritekstsvar eller lydopptak i PostgreSQL eller logger. Kun minimert utfall (`outcome: 'correct' | 'incorrect'`, `attempt`, `hints_used`, `practice_session`) lagres i tabellen `learning_event` under RLS.

---

## 4. Verifikasjonsstige for Utviklere og AI-Agenter

1. **Rask helse- og enhetssjekk (< 3 sekunder):**
   - `npm run doctor` (eller `npm run doctor -- --json`)
   - `npm run check:fast` (kjører alle katalog-/innholdssjekker + `node --test tests/*.test.mjs`)
2. **Skolebackend (< 35 sekunder):**
   - `npm run test:school` (58 PGlite/OIDC/RLS/recovery-tester i `tests/server/*.test.mjs`)
3. **Målrettet nettlesertest (< 15 sekunder):**
   - `npx playwright test tests/<spec>.spec.js --browser chromium`
4. **Full leveranseport før commit/release:**
   - `npm run build:app && npm run test:all`
