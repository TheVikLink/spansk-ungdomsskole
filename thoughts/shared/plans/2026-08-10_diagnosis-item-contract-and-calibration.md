# Plan: Robust diagnosekatalog og pilotkalibrering

## Mål

Gjøre A0-A1-diagnosen til en transparent, testbar lokal rutingsprofil der hvert item tester én avgjørbar ting, alle faglig gyldige svar krediteres, og senere pilotdata kan brukes til å forbedre rutingen uten å samle persondata i skyen.

## Ikke-mål

- Ikke presentere resultatet som CEFR-sertifisering eller full språknivåtest.
- Ikke legge til login, backend, analyseverktøy, tredjepartstelemetri eller skybasert elevprofil.
- Ikke bygge om hele `index.html` til et nytt rammeverk.
- Ikke innføre IRT/Rasch eller nye nivågrenser før det finnes et tilstrekkelig lokalt pilotdatasett.
- Ikke gjøre muntlig og lyttende diagnose til del av første implementasjonsslice; dette planlegges separat.

## Beads

- Hovedarbeid: `spansk-ungdomsskole-rvs`.
- Delarbeid bør opprettes før implementering:
  1. Itemkontrakt og validator.
  2. Svarklassifisering og diagnose-schema v2.
  3. Katalogrevisjon av 12 items.
  4. Pilotrapport og lokal eksport av diagnoseevidens.

## Prinsipper

1. A0, A0+, A1-start og A1 er lokale rutingsbånd med usikkerhet.
2. Ett item må ha én eksplisitt primærkonstrukt.
3. `correct`, `accent_or_case_variant`, `near_miss`, `wrong` og `skipped` lagres separat.
4. Alternative korrekte formuleringer gir ikke ekstra poeng; de peker til samme `canonicalMeaningId`.
5. Aksenter fjernes aldri globalt før sammenligning.
6. Råsvaret beholdes lokalt slik at en forbedret fasit senere kan reklassifisere responsen.
7. Diagnosen skal kunne oppdateres av senere adaptive observasjoner.

## Teknisk kontrakt

### DiagnosisItem

Hvert aktivt item skal ha:

- stabil `questionId` og `contentVersion`
- `instructionNb`, `prompt` og `responseMode`
- stabile `optionId`-er for flervalg
- `acceptedAnswers` med `answerId` og `canonicalMeaningId`
- itemspesifikke `variantRules` og `nearMissRules`
- `primaryConstruct`, `secondaryConstructs` og informative lokale bånd
- `maxEvidence` og eksplisitt normaliseringspolicy
- `ambiguityReview` med gjennomgåer, dato/notat, alternative svar og regional variasjon
- `sourceNote`/provenance for nytt innhold
- For `choice` skal `options` alltid være objekter `{ optionId, label }`, og accepted answer
  skal referere til `optionId`; for `typed` skal accepted answer ha strengverdi. UI-et kan vise
  label, men lagrer optionId i `rawResponse`/responsen, slik at en senere tekstendring ikke
  endrer hvilken distraktor eleven valgte.

### DiagnosisResponse

Hvert svar skal lagre:

- `responseId`, `questionId` og `contentVersion`
- `rawResponse` og `normalizedResponse`
- For typed svar er `rawResponse`/`normalizedResponse` tekst; for choice svar lagres både
  `rawResponse` som vist label og et separat `selectedOptionId`, slik at felttypene ikke
  blandes eller blir tvetydige.
- nøyaktig én `responseClass`
- `matchedAnswerId` eller `matchedRuleId` når relevant
- evidensvekt, tidspunkt og eventuelt svartid
- samme ene progress-celle som dagens diagnosekontrakt
- `itemSnapshot` eller en referanse som kan slås opp i en lokal, bevart itemhistorikk
- `responseId` skal være idempotensnøkkel og aldri gjenbrukes for et annet svar
- Generer `responseId` som en tilfeldig lokal `sessionId` kombinert med
  `questionId` og attempt-nummer; sessionId skal ikke eksporteres i full backup eller brukes
  som elevidentifikator. Lagre prosesserte ID-er sammen med diagnose state.

### Migrering

- Bruk ny lagringsnøkkel `spansk123_diagnosis_v2`; les først v2 og fall tilbake til eksisterende
  `spansk123_diagnosis_v1`. Skriv aldri v1-format tilbake etter at v2 er opprettet.
- Bump diagnose state til schema v2 med eksplisitte felter: `schemaVersion`, `status`,
  `startedAt`, `completedAt`, `questionIds`, `answers`, `resultBand`, `confidence`,
  `evidenceCount`, `productiveAnchorCount`, `insufficientEvidence`, `observationsVersion` og
  `itemVersions`.
- Migrer eksisterende v1-svar uten å late som gamle svar har `rawResponse` eller `contentVersion`; marker manglende felter eksplisitt.
- V1-migreringen skal ha en eksplisitt matrise: kopier `questionId`, mål, `resultKind` og
  `answeredAt`; map eksisterende `resultKind` til de fem klassene når det er entydig, ellers
  bruk `legacy_unknown`; sett `rawResponse: null`, `contentVersion: null`,
  `itemSnapshot: null` og `reclassifiable: false`. V1-svar skal derfor ikke brukes til
  reklassifisering eller late som de har ny fasit.
- Ikke slett eksisterende diagnose eller annen progresjon ved restart.
- Nyere ukjent schema skal sikkerhetskopieres til `spansk123_diagnosis_unsupported_<timestamp>`,
  sperre diagnose-writes og vise en gjenopprettingsmelding. Det skal ikke initialiseres en tom
  v2 som senere overskriver nyere data.
- Eksport/import skal ta med diagnoseevidens, itemversjoner og råsvar uten å endre eksisterende
  `spansk123_export_v1`-kontrakt. Import skal validere v2 før den skriver noe.
- For reklassifisering skal hver respons enten lagre et lite `itemSnapshot` med prompt,
  accepted answers og regler, eller ha en komplett lokal `diagnosisItemHistory` keyed by
  `questionId:contentVersion`. Gamle svar skal kunne klassifiseres på nytt uten å miste
  originalt råsvar eller bruke en ny fasit på et gammelt item ved en feil.
- Bruk `itemSnapshot` per respons i v2 for å unngå en ekstra historikk-key. Snapshotet skal
  inneholde bare validatorens faglige felter, ikke elevnavn eller annen profilinformasjon.

## Implementeringssteg

### 1. Etabler ren validator og test-fixtures

Filer:

- `index.html`
- `scripts/check-diagnosis-catalog.mjs` (ny)
- `tests/diagnosis-catalog.spec.js` (ny)
- `package.json`

Oppgaver:

- Behold katalogen som literal data i `index.html` for offline-drift, men trekk ut en felles
  `scripts/lib/extract-inline-catalog.mjs` som finner og validerer den avgrensede array-/
  objektblokken før den leses. Både `check:diagnosis-catalog` og eksisterende
  læringskatalog-check skal bruke samme parser; parseren skal avvise funksjoner, referanser,
  template expressions og kode utenfor data-blokken og skal aldri evaluere hele `index.html`.
- Definer en literal-only itemkontrakt: ingen funksjoner, DOM-referanser eller runtime-verdier
  i itemdata. Nettleseren bruker samme felter som validatoren leser.
- Valider unike ID-er, stabile option-ID-er, kjent target, akseptert svar i options, gyldig response mode, provenance, maxEvidence, nærfeilregler og ambiguity review.
- Avvis items med ubestemt fasit, manglende kontekst eller flere korrekte alternativer som ikke er eksplisitt representert.
- Validatoren skal ikke påstå at den kan avgjøre grammatisk tvetydighet automatisk. Den skal
  kreve `ambiguityReview.passed === true`, `checkedForAlternativeCorrectAnswers === true`,
  reviewer/dato/notat og en manuell provenance-note; selve språkfaglige godkjenningen er en
  review-gate, ikke et regex-resultat.
- Legg til `npm run check:diagnosis-catalog`.
- Valider også at `contentVersion` er positivt heltall, at alle `acceptedAnswers` har unike
  `answerId`/`canonicalMeaningId`, at rule-match ikke overlapper med korrekt svar, og at alle
  `informativeBands`/konstrukt-ID-er er kjente.

### 2. Implementer strukturert svarvurdering

Filer:

- `index.html`
- `tests/diagnosis-flow.spec.js`
- `tests/answer-acceptance.spec.js` eller eksisterende svaraksepttest

Oppgaver:

- Samle diagnose/quiz-normalisering i én ren funksjon med NFC, ytre trim, interne mellomrom og valgfri sluttpunktum-policy.
- Match i fast rekkefølge: accepted answers, eksplisitte variantregler, itemspesifikke near-miss-regler, ellers wrong.
- Behold dagens gode aksent-/case-feedback.
- Ikke bruk global `removeDiacritics()`.
- Bruk én idempotent submit-path for knapp, Enter og valgkontroller.
- Sørg for at ett svar gir nøyaktig én progress-oppdatering og én response record.

### 3. Migrer diagnose state til v2

Filer:

- `index.html`
- `tests/diagnosis-flow.spec.js`
- `tests/import-export-compat.spec.js`
- `tests/storage-recovery.spec.js`

Oppgaver:

- Implementer `normalizeDiagnosisState` for v1, v2, korrupt data og nyere ukjent schema.
- Lagre råsvar og klassifisering uten å bryte eksisterende lokal fremgang.
- Test restart, importert fremgang, gammel diagnose state og repeated submit.
- Test at reklassifisering kan bruke ny itemversjon uten å endre elevens opprinnelige råsvar.
- Test v1-key -> v2-key, korrupt v1/v2, unsupported newer v2, write blocking og at annen
  lokal fremgang ikke endres ved diagnosemigrering.

### 4. Revider og berik de 12 diagnoseitems

Filer:

- `index.html`
- `tests/learning-catalog.spec.js`
- `tests/diagnosis-catalog.spec.js`

Oppgaver:

- Behold stabile question IDs der læringsmålene er de samme; øk `contentVersion` når ordlyd/fasit endres.
- Bruk den forskningsreviderte blueprinten:
  - konkret ordforråd
  - bestemt/ubestemt artikkel med eksplisitt mål
  - `me llamo`
  - regelrett presens
  - `tener` for alder
  - `ser` for opprinnelse
  - `estar` for lokasjon
  - `hay` for eksistens
  - `gustar` med tydelig grammatisk subjekt
  - preposisjon
  - produktiv `vivir`
  - `qué` i eksplisitt konstruksjon
- Legg inn alle likeverdige svar og eksplisitte near-miss-regler.
- Dokumenter at hvert item er gjennomgått for tvetydighet og regional variasjon.
- Lås den endelige 12-radersmatrisen i en fixture før implementering. Hver rad skal oppgi
  questionId, prompt, responseMode, options/acceptedAnswers, primaryConstruct, targetId,
  productiveAnchor (ja/nei) og hvorfor itemet er entydig. Matrisen skal eksplisitt vise om
  eksisterende IDs beholdes med ny `contentVersion`, eller deaktiveres og erstattes av nye
  IDs; det skal ikke være et åpent valg under koding. Hvis rapportens blueprint brukes fullt
  ut, må `ser`, `estar`, `hay`, preposisjon, `vivir`, `qué`, `gustar`, verb, identitet,
  artikler og ordforråd hver være sporbare til en konkret rad.

### 5. Gjør ruting og feedback evidensbasert

Filer:

- `index.html`
- `tests/diagnosis-flow.spec.js`
- `tests/adaptive-quiz.spec.js`

Oppgaver:

- Bruk foreløpige vekter: correct 1.00, accent/case 0.90, near miss 0.50, wrong/skipped 0.
- Implementer den provisoriske, deterministiske regelen fra forskningsrapporten: `answeredItems`
  teller alle ikke-skipped svar; `productiveAnchorCount` er correct eller accent/case på de
  produktive item-ID-ene som er merket `productiveAnchor: true` i den låste 12-radersmatrisen.
  Test-fixture skal derfor avvise uoverensstemmelse mellom anchor-feltene og blueprinten;
  implementasjonen skal ikke hardkode gamle IDs. Ved lik grense brukes laveste rutingsbånd.
- Fastsett og test tersklene eksplisitt: under 8 besvarte = `A0+` med `confidence: low` og
  `insufficient_evidence: true`, ellers
  score >= 8.5 + minst 2 produktive ankere = `A1`, score >= 5.5 + minst 1 = `A1-start`,
  score >= 2.5 = `A0+`, ellers `A0`. Confidence mappes deterministisk til low/medium/high
  og skal ikke omtales som statistisk sikkerhet.
- Lagre `confidence` og `evidenceCount` sammen med result band.
- Lagre `confidence` og `evidenceCount` sammen med result band. Bruk følgende eksplisitte
  confidence-policy: første diagnose har alltid `low`; etter minst 20 ikke-skipped observasjoner
  kan den være `medium`; `high` brukes ikke før en senere pilotkalibrering har definert en
  empirisk regel.
- La senere adaptive svar flytte rutingen opp eller ned gjennom samme response-class-vekt og
  en separat `observationsVersion`; hver `responseId` kan påvirke rutingen maksimalt én gang.
- Definer progresskoblingen: word-items oppdaterer kun `wordProgress[targetId][direction]`,
  skill-items oppdaterer kun `skillProgress[targetId]`. Diagnosesvar får `source: diagnosis`
  og registreres i et lokalt `processedResponseIds`-sett, slik at re-render, import eller
  reklassifisering ikke teller samme observasjon to ganger. Item-snapshot brukes ved ny
  klassifisering, men endrer ikke historisk råsvar.
- Vis kort, nøytral feedback under diagnosen; full forklaring kommer etter resultatet eller i øving.

### 6. Lag lokal pilot- og analyseflyt

Filer:

- `index.html`
- `README.md`
- `tests/import-export-compat.spec.js`
- eventuelt `scripts/analyze-diagnosis-export.mjs` (kun lokal filanalyse)

Oppgaver:

- Lag en separat `buildDiagnosisPilotExportData()` med fast allowlist: item-ID/version,
  responsklasse, evidens, target/construct, option-ID, distraktorvalg, relative
  response-time buckets og en tilfeldig eksport-ID. Den skal aldri inkludere `studentName`,
  elevkode, `activeAssignment`, fritekst utenfor diagnosefelt, rå localStorage-dump eller
  eksporttidspunkt med høyere presisjon enn nødvendig. Rå diagnoseresponser skal ikke tas med
  i pilotfilen dersom de kan inneholde identifiserende fritekst; hvis de beholdes, skal det
  dokumenteres at de 12 svarfeltene er lukket/forhåndsdefinert og valideres mot allowlist.
- Gi pilotfilen et eget format, for eksempel `spansk123_diagnosis_pilot_v1`, og gjør den
  analyse-only: den skal ikke kunne importeres som full elevbackup. Dokumenter eksakt schema,
  feltallowlist, response-time buckets (for eksempel 0–5 s, 5–15 s, 15–60 s, 60+ s) og at
  eksporten ikke kan rekonstruere navn/elevkode fra innholdet.
- Bruk et generisk filnavn uten navn/elevkode, men ikke kall filen anonymisert før innholdet
  også følger allowlisten. En tilfeldig eksport-ID er pseudonymisering, ikke anonymisering;
  dokumenter dette og ikke bruk ID-en til å koble mot elevregister.
- Krev et eksplisitt, lokalt samtykke/valg før pilotfilen bygges, vis nøyaktig hvilke felt som
  eksporteres, og dokumenter at eleven/læreren deler filen manuelt; ingen automatisk innsending.
- Dokumenter før pilot hvem som kan eksportere og motta filen, formålet, maksimal lokal
  oppbevaringstid, sletting etter analyse, og at random export ID ikke skal kobles til
  elevnavn/elevkode. Pilotanalysen skal bruke aggregert output og ikke beholde råfiler lenger
  enn nødvendig.
- Lag lokal analyse av itemvanskelighet, distraktorvalg, near-miss-rate, manglende svar og flytting av ruting.
- Ikke bruk resultatene til karaktersetting.

### 7. Pilotgate før nye nivåpåstander

- Test med minst tre tydelige profiler: nybegynner, litt forkunnskap og elev rundt A1-start.
- Gjennomfør think-aloud på tvetydighet og instruksjonsforståelse.
- Sammenlign med lærerens helhetsvurdering og en kort produktiv oppgave, uten å behandle én kilde som fasit.
- Fjern eller omskriv items med uventet negativ diskriminering eller distraktorer som viser seg å være korrekte.
- Ikke endre terskler basert på ett enkelt elevsvar.

## Akseptansekriterier

- `check:diagnosis-catalog` stopper tvetydige eller ufullstendige items.
- Alle 12 items har stabil ID, versjon, konstrukt, provenance, review-status og eksplisitt fasitmodell.
- Validatoren og nettleseren bruker samme literal-katalog uten vilkårlig kodeevaluering.
- `la casa` kan ikke lenger markeres som feil i en oppgave som bare tester artikkeltype/kjønn.
- Flere korrekte svar gir én evidensenhet, ikke flere poeng.
- Alle fem responsklasser lagres og testes.
- Enter og knapp bruker samme idempotente submit-path.
- Diagnose v1-data, eksport/import og nyere-schema recovery fungerer uten tap av eksisterende progresjon.
- Gamle svar kan reklassifiseres med bevart itemversjon uten å endre råsvar eller progresshistorikk.
- Resultatet viser lokalt rutingsbånd og confidence, ikke CEFR-sertifisering.
- Senere adaptive svar kan revidere første ruting.
- Ingen elevdata sendes ut av nettleseren automatisk.
- Pilotdataeksport har en testet allowlist og omtales som pseudonymisert/anonymisert bare med
  presis definisjon; full backup-eksporten forblir separat og kan fortsatt inneholde elevnavn.

## Testplan

Kjør stegvis:

```bash
npm run check:diagnosis-catalog
npm run check:learning-catalog
npm run test:diagnosis
npm run test:learning-catalog
npm run test:adaptive-quiz
npm run test:import-export
npm run test:storage-recovery
git diff --check
npm run test:all
```

For pilot før publisering:

```bash
npm run test:all
```

Forventet resultat: alle relevante tester passerer; eventuell offline-test som krever HTTP-server kan fortsatt være eksplisitt skippet i fil-URL-miljøet.

## Rekkefølge og avhengigheter

1. Katalogvalidator og fixtures.
2. Svarklassifisering og idempotent innsending.
3. Schema v2 og migrering.
4. Katalogrevisjon av 12 items.
5. Evidensbasert ruting og feedback.
6. Lokal eksport/analyse og pilotdokumentasjon.
7. Pilotreview før terskler eller produktpåstander endres.

Punkt 3 må være grønt før punkt 6, fordi pilotdata ellers ikke har en stabil og versjonert kontrakt.
