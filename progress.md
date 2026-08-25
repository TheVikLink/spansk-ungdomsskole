# progress.md

## 2026-08-21 (sesjon 2) - Leksjonsopptak-audit og rotarsaksanalyse

**Status: Research ferdig, venter paa avgjorelser foer implementering.**

Utfort:
- Full ffmpeg-audit av `Skjermopptak 2026-08-21 kl. 11.09.58.mov` (707.9s, 47+9 rammer).
- Full kodegjennomgang (subagent) av index.html paa branch `adaptive-response-modes`.
- Plan oppdatert: `thoughts/shared/plans/2026-08-21_lesson-recording-audit.md` (addendum sesjon 2).

Verifiserte rotarsaker:
1. Grammatikk-tvetydighet: gustar/possessives/demonstratives har distraktorer som er grammatisk riktige; mening ligger bare i skjult `hint`. Pluss scaffold-nokkelbug (`demonstrative` vs `demonstratives`).
2. "Sendt til gloser etter 1 quiz": deployet main (5360d24) + service worker cache-first med ubumpet `CACHE_NAME=spansk123-v3` => elevene kjorer gammel build uten resultatskjerm. PR #2 (adaptive-response-modes -> main) er AAPEN, ikke merget.
3. Nedtrekksmenyer finnes bare paa umerget branch; i glosemodus er select-modus i tillegg doed kode (`getVocabularyResponseMode` leser `strength` som SM-2-data ikke har).
4. To parallelle fremgangssystemer (SM-2 `spansk123Data_v4` vs `learningProgress` styrke 0-5) skriver ikke til hverandre.

Neste steg (avhengig av eieravgjorelser):
- P0: `no`-felt + omskriving av tvetydige grammar-items + scaffold-fix + tvetydighetstest.
- P0: Merge PR #2 + bump SW-cache (krever OK for git-mutasjon/deploy).
- P1: Glosemodus response-mode fra SM-2; delt fremgang quiz<->kort.
- P2: Ny glosemodus-inngang (elegant loesning).

Aapne Beads: e39 (in_progress, denne jobben), qet (dropdowns), 6tk (delt state), 7kq (content invariants), kj2, rvs (diagnose, in_progress).

## 2026-08-24 - Full laereplan-audit og svarakseptanserettelser

**Status: Implementert og verifisert. Beads: spansk-ungdomsskole-zl6.**

### Omfang
Gjennomauditert hele curriculumet: ~300 gloser, 12 diagnoseoppgaver, ~85 grammatikkovelser, ~30 verb, 14 setningspuslespill, 8 preposisjoner, larerimport-flow.

### Funn og rettelser (alle rettet)

**Hoyst alvorlighetsgrad - korrekt svar markert feil:**
1. 9 gloser med parentes-annotasjoner aksepterte bare den annoterte formen, ikke det rene ordet:
   `lilla (v)`, `lat (v)`, `begravelse (f)`, `begravelse (ord pa e)`, `rom (annet ord, C)`, `stue (c)`, `kjoleskap (n)`, `genser (j)`, `larar (p)`.
   Fiks: lagt til i `vocabularyAnswerAlternatives` med ren form som godkjent variant.
2. `mor` aksepterte ikke `mamma` i glosemodus (men i diagnosekatalogen). Fiks: lagt til alternativ.
3. `god kveld` aksepterte bare `buenas noches`, ikke `buenas tardes`. Fiks: lagt til alternativ.
4. `kjaereste` aksepterte bare `el novio`, ikke `la novia`. Fiks: lagt til alternativ.
5. 34 substantiver som slutter pa `e` fekk feil auto-generert bestemt form (`kusineen` i stedet for `kusinen`). Fiks: endret fallback i `getNorwegianNounDefiniteForms` til a legge til `n` for e-endende ord.
6. 3 nøytrum-ord som slutter pa `e` (`teppe`, `smykke`, `lommetorkle`) trengte `-t` bestemt form, ikke `-n`. Fiks: eksplisitte oppforinger i `norwegianNounDefiniteForms`.
7. 4 allerede bestemte ord (`Valentinsdagen`, `nasjonaldagen`, `allehelgensdagen`, `ungdomsskolen`) fekk dobbel bøying (`Valentinsdagenen`). Fiks: eksplisitte oppforinger med ubestemt form som godkjent variant.

**Middels alvorlighetsgrad:**
8. `juice`-disambiguering feilet: bade `el zumo` og `el jugo` fekk hint `(e)` fordi artikkelen `el` ble tatt med. Fiks: `getVocabPromptText` striper na spanske artikler (`el/la/los/las`) forran forstebokstaven.
9. Larerimport splittet bare spanske alternativer pa `/`, ikke norske. Fiks: `splitAlternativeTranslations` splitter na begge sider og genererer kryssprodukt.

### Tester lagt til (8 nye)
- 6 i `tests/vocab-learning-mechanics.spec.js`: parentes-annotasjoner, mamma, buenas tardes, la novia + kjaeresten, e-endende bestemte former, juice-disambiguering.
- 2 i `tests/teacher-glossary-import.spec.js`: norske alternativer, kryssprodukt.

### Verifikasjon
- `npm run check:content` - OK (18 corrections protected)
- `npm run check:diagnosis-catalog` - OK (12 questions)
- `npm run check:learning-catalog` - OK (8 skills, 4 words, 12 diagnosis questions)
- 161 Playwright-tester passert (inkludert 8 nye), 0 feilet, 1 hoppet over
- `git diff --check` - ren

### Gjenstaende funn (lav alvorlighetsgrad, dokumentert)
- `god dag` -> `buenos dias` kunne ogsa akseptert `buenas tardes` (minor).
- `bikini` -> `el biquini` kunne akseptert standardformen `el bikini` (minor).
- `smykke` -> `la cadena` er semantisk upresist (`la joya` = smykke, `la cadena` = kjede) (minor).
- `hver uke` har inkonsistent kategori `Kapittel 8: Tareas de casa` i stedet for `tidsuttrykk` (datakvalitet).
- Manglende aksent returnerer `correct: false` (naer-feil) - bevisst pedagogisk valg, ikke en feil.

## 2026-08-24 (sesjon 2) - Audit-infrastruktur og tilbakemeldingskanal

**Status: Implementert og verifisert. Beads: spansk-ungdomsskole-j5m, spansk-ungdomsskole-d55.**

### Del 1: Audit-infrastruktur
- `scripts/lib/extract-all-items.mjs` - trekker ut alle curriculum-items til strukturert JSON.
- `scripts/extract-all-items.mjs` - CLI som skriver `output/audit-items.json`.
- `scripts/check-content-accuracy.mjs` - 13 mekaniske invariant-sjekker:
  1. Parentes-annotasjoner har ren form godkjent
  2. Bestemte former har korrekt ending
  3. Alternative-map har ingen orphans
  4. Definite-form-map har ingen orphans
  5. Ingen duplikate glossary-par
  6. Prompt-collisions har disambiguering
  7. Verb har 6 presensformer + participio
  8. Verb-oversettelser starter med "å "
  9. Grammatikk-distraktorer er ikke identisk med fasit
  10. Setningspuslespill har >= 2 ord
  11. Setningspuslespill-ord har ikke whitespace
  12. Spanske ord har ñ der de skal
  13. Grammatikkøvelser har norsk kontekst
- `tests/answer-acceptance-fuzz.spec.js` - 9 fuzz/aksent/ñ-regresjonstester som dekker alle glossary-par, diagnose-svar, og verb-bøying.

### Del 2: Tilbakemeldingskanal
- "Jeg mener svaret mitt er riktig"-knapp etter feil svar i gloser, quiz, verb, grammatikk.
- Dialog med forklaringfelt, anonym som standard, advarsel mot personopplysninger.
- `localStorage` key `spansk123_studentFeedback_v1`, schema v1.
- Lærer kan eksportere som JSON fra Innstillinger → Tilbakemeldinger.
- `resetAllData()` sletter også feedback.
- `tests/student-feedback.spec.js` - 7 regresjonstester.

### Andre rettelser i denne sesjonen
- Norsk kontekst lagt til for 91 grammatikkøvelser (articles, adjectives, serEstar, reflexive).
- Disambiguering for "hver dag" (todos los días / cada día) og "juice" (el zumo / el jugo).

### Verifikasjon
- `npm run check:content` - OK
- `npm run check:content-accuracy` - OK (13 sjekker, 537 gloser, 91 grammatikk, 34 verb, 14 puslespill)
- `npm run check:diagnosis-catalog` - OK
- `npm run check:learning-catalog` - OK
- 177 Playwright-tester passert, 1 hoppet over, 0 feilet
- `git diff --check` - ren

### Gjenstaande for full dekning (~99%)
- Ekspert-curated referansekorpus for synonym-dekning og idiom-korrekshet (trinn 2-6 i planen).
- Korpus-avhengige sjekker er dokumentert i `scripts/check-content-accuracy.mjs` men hoppes over automatisk.
