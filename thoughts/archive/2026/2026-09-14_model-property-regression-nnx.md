# Modell- og egenskapsbasert regresjonstesting (NNX)

## Mål

Utforme en liten, deterministisk modellbasert testpakke som finner inkonsistens i øktlivssyklus, persistens, import/export, reset og offline uten å endre appatferd.

## Ikke-mål

- Ikke implementere testene eller endre `index.html` i denne oppgaven.
- Ikke legge til testavhengigheter før en separat implementeringsbeslutning.
- Ikke bruke tilfeldig generering som er ukontrollert eller nettverksavhengig.

## Akseptansekriterier

- Planen angir en referansemodell, genererte handlinger, invariants, orakler og minste testdata for hver risikoflate.
- Hvert forslag kan gjennomføres med reproduserbar seed, krympet handlingsspor og egne nettleserkontekster.
- Planen avgrenser hva som skal testes som ren logikk og hva som krever Playwright/UI.
- Planen beskriver hvordan den supplerer, fremfor å duplisere, dagens eksemplbaserte regresjonstester.

## Nåværende grunnlag og avgrensning

- Dagens suite har gode, konkrete eksempelspec-er for import/export, avbrutte økter, læringsprogresjon og offline. Den mangler en generator som kombinerer disse overgangene i korte sekvenser.
- `fast-check` er ikke installert i dagens `package.json`, til tross for at den generelle property-testing-veiledningen antar det. En implementeringsoppgave må eksplisitt godkjenne enten å legge det til eller bruke en minimal deterministisk, hjemmelaget generator.
- Nettleserstaten i `index.html` er global og sideeffektfull. Testdriveren må derfor begrense handlingssettet til offentlige funksjoner og observerbare localStorage-/DOM-invarianter.

## Foreslått implementeringsform

Opprett én ny Playwright-spec, for eksempel `tests/state-machine-properties.spec.js`, med en liten referansemodell og seedet handlingsgenerator. Bruk separate browser contexts for eksport/import og offline. Sett seed i testnavn/feilmelding, og skriv det krympede handlingssporet til Playwright-attachment når en property feiler.

Før implementering: avgjør avhengighetsvalget. Anbefaling er `fast-check` med Playwright som driver fordi den gir krymping og replay. Hvis prosjektet ikke vil ha en ny devDependency, bruk en fast PRNG og et eksplisitt, lite handlingsrom; ikke `Math.random()`.

## Referansemodell

Modellen trenger ikke speile UI. Den skal bare holde observerbare kontrakter:

```text
ModelState
  session: none | vocabulary | verbs | grammar | mixedQuiz | diagnosis | dictation | listening
  answers: non-negative integer
  correct: integer in [0, answers]
  historyBySessionId: Map<sessionId, { words, correct, finalized, interrupted }>
  persisted: boolean
  exportedSnapshot: optional canonical JSON
  reset: boolean
  audio: online | cached | unavailable
```

Modellen oppdateres etter hver handling og sammenlignes kun med appens offentlige observerbare tilstand: `practiceHistory`, `loadLearningProgress()`, `buildProgressExportData()`, `activeSessionType`, relevante DOM-elementer og cache-status.

## Genererte handlinger og invariants

### 1. Øktlivssyklus og navigasjon

**Handlinger:** start hver støtteform (gloser, verb, grammatikk, mixed quiz), svar riktig/feil, be om hint, klikk Neste, naviger til annen fane med avbryt/bekreft, avslutt, reload.

**Invariants:**

- Antall lagrede `words` for én sessionId er lik antall unike registrerte svar, aldri større på grunn av hint, gjentatt Neste eller gjentatt avslutt.
- `0 <= correct <= words`, `sessions === 1`, minutter er endelige og ikke-negative.
- Avbrutt aktiv økt markeres én gang som `interrupted`, uten aktiv session eller duplisert varsel etter neste reload.
- Etter fullført/avbrutt økt er `activeSessionType === null`; tilhørende state kan ikke gi flere scoring- eller historikkendringer.
- Å avvise navigasjonsbekreftelsen lar modell og UI være uendret.

**Oracle:** summer per `sessionId`, og sammenlign med modellens svar-/riktig-tellere etter hvert checkpoint.

### 2. Persistens, eksport/import og reset

**Handlinger:** seed gyldig, men variert progress; utfør korte økter; eksportér; importer i ren context; importer samme fil igjen; reload; reset; importer ukjent eller for ny schema-versjon.

**Invariants:**

- Kanonisk eksport fra en ren importerer konvergerer: `canonical(export(import(x))) === canonical(export(import(export(import(x)))))`, bortsett fra tidsstempel/eksport-ID.
- Normaliserere er idempotente: `normalize(normalize(x)) === normalize(x)` for læringsprogresjon, diagnose, quiz-statistikk og diktatdata.
- Reset fjerner alle dokumenterte appnøkler og recovery-/unsupported-prefikser, men ikke uvedkommende localStorage-data.
- Import av uventet schema eller skadet JSON overskriver aldri tidligere gyldig tilstand; recovery-kopien er lokal.
- Gjentatt import kan ikke redusere gyldig styrke/statistikk eller doble øvingshistorikk uten en eksplisitt merge-kontrakt.

**Oracle:** canonicaliser JSON ved å fjerne flyktige datoer, sortere objekt-nøkler og sammenligne bare dokumenterte persistensnøkler.

### 3. Læringsprogresjon og adaptiv utvelgelse

**Handlinger:** generer sekvenser av `correct`, `accent_or_case_variant`, `near_miss`, `wrong`, `skipped` på både skill og ordretning; variér klokke og gyldige/ugyldige celler.

**Invariants:**

- Styrke ligger alltid i 0–5; forsøk, riktige og tilbakefall er ikke-negative heltall; riktige overstiger aldri forsøk.
- Bare valgt ordretning endres for et ordsvar; andre retning og andre mål er bit-lik før/etter.
- Hver oppdatering øker forsøk nøyaktig én gang; bare `correct` og `accent_or_case_variant` øker riktig-telleren.
- `dueAt` er gyldig og ikke før `nowIso` for riktige/nære svar; feil/skipped er umiddelbart due.
- Utvelgelse av grammatikkoppgaver er deterministisk for samme katalog, progresjon, klokke og limit; svarer aldri med flere enn limit, og velger unike kontekstnøkler før fallback.

**Oracle:** en 20-linjers referanseovergangstabell for progresjonscellen, uavhengig av implementasjonens normaliserer.

### 4. Katalog- og importerede kort-identiteter

**Handlinger:** generer kortsamlinger med unike og glisne numeriske ID-er, dupliserte ordpar, custom-kort og 1–5 lærer-/lekseimporter.

**Invariants:**

- Etter hver import er alle kort-ID-er unike og hver ny rating oppdaterer bare kortet som ble besvart.
- Merge på semantisk ordpar beholder eksisterende progress; importer har ingen tomme norsk-/spanskfelt og normalisert kategori.
- Eksport/import bevarer unike ID-er og koblingen fra ord-progress til riktig kort.

**Oracle:** `Set(ids).size === cards.length`, samt en referansemappe `id -> progress` før og etter operasjonen.

Dette skal først implementeres etter at `spansk-ungdomsskole-4j3` er løst; property-testen blir dens langtidsregresjon.

### 5. Offline lyd og diktat/lytting

**Handlinger:** velg historie, start avspilling, simuler online/offline, cache/ikke-cache audio, start/avslutt, svar delvis/komplett, reload og sidebytte.

**Invariants:**

- Offline uten cache gir forklarende feil og kan ikke starte spørsmål/økt; cached audio kan leses offline.
- Én avspilling-/svarsekvens kan ikke gi mer enn én completion per historie når alle segmenter er forsøkt.
- Avslutt/navigasjon pauser audio, fjerner relevant state og gjør ikke skjult lydspill mulig.
- Diktat og lytteforståelse har separat state og kan ikke gjengi hverandres resultater eller UI.

**Oracle:** DOM-kontroller (`disabled`, synlige alerts/resultat), `dictationState`/`listeningState`, localStorage for completed diktater og Cache Storage for lyd.

## Prioritert testrekkefølge

1. Ren property-test for `normalizeLearningProgress`/`updateLearningProgress` og grammatikkutvelgelse: høy signalverdi, ingen UI-flakiness.
2. Kort, seedet session state-machine for fire eksisterende øktformer: 5–12 handlinger per sekvens, 50–100 runs lokalt og lavere antall i PR-CI.
3. Eksport/import/reset round-trip med separate contexts.
4. ID-/import-property etter løsning av `4j3`.
5. Offline/diktat- og lytte-state-machine etter at pågående lyttearbeid er stabilisert.

## Filer ved eventuell implementering

- `tests/state-machine-properties.spec.js` — ny seedet modell og properties.
- `tests/learning-progress-properties.spec.js` — eventuelt isolert ren progresjonsproperty hvis én spec blir for stor.
- `package.json` og lockfile — bare dersom `fast-check` godkjennes.
- `index.html` — ingen planlagt produksjonsendring; kun hvis testene beviser en feil.

## Verifisering ved eventuell implementering

```bash
npx playwright test tests/learning-progress-properties.spec.js tests/state-machine-properties.spec.js --browser chromium --workers=1 --reporter=list
npx playwright test tests/learning-progress.spec.js tests/learning-progress-core.spec.js tests/report-session-accounting.spec.js tests/import-export-compat.spec.js tests/dictation.spec.js --browser chromium --workers=2 --reporter=list
npm run test:all
```

Grønt betyr at alle seeds passerer, en fremtidig feil rapporterer seed og minimalt handlingsspor, og den eksisterende regresjonssuiten fortsatt er grønn.

## Små implementeringssteg

1. Avklar `fast-check` kontra intern seedet generator og opprett et Bead for den valgte implementeringen.
2. Ekstraher testhjelpere som booter appen i ren context og leser kanonisk observerbar state; ikke eksporter ny produksjons-API bare for testen.
3. Implementer progresjonsreferansemodellen og dens normalisering-/overgangsproperties.
4. Implementer session-modell med kun start, svar, hint, neste, avbryt, avslutt og reload; legg til handlinger én om gangen.
5. Legg til round-trip/reset- og import-identitetsproperties med små, krympbare fixtures.
6. Legg offline/diktat/lytting til sist, etter eksplisitt test av state-separasjon.
7. Når en property finner en feil: frys krympet spor som en navngitt eksempeltest før produksjonsfeilen fikses.
