# Fra reality-check til verifisert levering og elevpilot

Dato: 23. september 2026. Planoppgave: `spansk-ungdomsskole-sv5d`.
Beads er kilde for løpende status; dokumentet beskriver rekkefølge, begrunnelser og ferdigkriterier.

## Mål og avgrensning

Levere en identifiserbar, teknisk verifisert utgave av dagens app og dokumentere om en liten, lærerledet elevgruppe kan bruke den valgte øvingen på skolens utstyr.

Første prøve bruker bestemte artikler og dagens lokale oppsummering. Lyd kan prøves separat etter faglig godkjenning. Planen omfatter også en beslutning om videre ferdighetsdekning, men utbygging av et komplett A0–A1-kurs er en senere leveranse.

Feide, kontoer, betaling, lærerpanel, skylagring, analyseinnsamling, lydgenerering og større arkitekturendringer er utenfor omfanget. Ingen endring av lagringsformat er planlagt. Lokale fremgangsfiler og lærerimport skal fortsatt virke. Push, merge og publisering utføres når leveransesteget er bestilt, i samsvar med AGENTS.md; denne forespørselen gjelder planen.

## Korrigert utgangspunkt

- Arbeidsgren ved planlegging: `fix/vocabulary-review-favicon`, HEAD `1aba3dd`, arbeidskopiens appbygg `7072d6e4a34f6771`. Bygg-ID-en beskriver appressursene og identifiserer ikke alene test- og dokumentversjonene.
- `906` og `907` registrerer 47 Node-tester og 466 nettlesertester bestått 22. september for dette bygget. Reality-check 23. september ga grønne statiske kontroller og Node-tester, men beholdt ingen fullført, vellykket sluttrapport fra nettlesermatrisen. Delvise logger er ikke en ny full godkjenning; oppstartsfeil må dokumenteres konkret før de klassifiseres som miljøfeil.
- [Release-rapporten 18. september](../../../docs/release-verification-2026-09-18.md) gjelder bygg `9028eaf8e4ba8273`. Historiske resultater skal beholdes og dateres.
- Full Beads-opptelling før denne planoppgaven: 193 saker, hvorav 181 lukket, 8 åpne, 3 blokkerte og 1 utsatt. Den forrige oppsummeringens 50 lukkede var CLI-ens standardgrense, ikke totalen.
- Blokkerte `903` og `k1wn` dekker allerede Linux-CI/lydfilbane og deler av offentlig glosekontroll. Det var derfor for sterkt å si at publiseringskontrollen helt manglet Beads-dekning. Derimot manglet en samlet oppgave for dagens kandidat og hele leveransen.
- [PILOT.md](../../../PILOT.md) peker til en fjernet lærerintroduksjon/startknapp. README beskriver nye hurtigtaster øverst, men viser fortsatt motsatt mapping i hurtigtasttabellen. Veiledningene må følge faktisk appflyt.
- Innholdsgrunnlaget er 522 gloser, 34 verb, 135 grammatikkoppgaver i 10 temaer og 8 leksjoner. Brainmap viser 64 ferdigheter: 37 med øvingsrute, 27 planlagte. Katalogtall og maskinelle kontroller dokumenterer ikke full språklig kvalitet eller læringseffekt.

## Leveranser og rekkefølge

| Leveranse | Beads | Ansvar | Ferdig når |
|---|---|---|---|
| A. Verifisert kandidat og brukbar veiledning | `y8nr` | Utvikler/agent | Eksakte filer, beholdt testbevis, riktig veiledning og datert rapport |
| B. Kontrollert levering til offentlig app | `s2qg`, med `903` og `k1wn` | Produkteier og utvikler | Riktig commit har grønn CI; offentlig bygg og oppgradering er verifisert |
| C. Faglig og fysisk kontroll | `ee0`; lyd i `4or0` | Spansklærer/produkteier | Valgte oppgaver og skoleutstyr godkjent; lyd godkjent før lydbruk |
| D. Moderert prøve og oppfølging | `ee0` | To lærere og seks elever | Observasjon, gjenoppretting og 2–3 ukers oppfølging dokumentert |
| E. Avklart videre kursomfang | `t1du` | Produkteier, lærer og utvikler | Alle planlagte ferdigheter kartlagt og neste avgrensede utvidelse valgt |

Alle forkortede ID-er har prefikset `spansk-ungdomsskole-`.

A må være ferdig før B. Faglig gjennomgang og kartlegging i E kan starte parallelt med teknisk forberedelse. Den faktiske elevprøven i D begynner etter A, B og godkjenning av valgt innhold i C. Full lydgodkjenning sperrer bare lydbruk; den lydfrie artikkelprøven trenger ikke vente på alle ti opptak. E sperrer ingen av pilotleveransene.

### A. Klargjør én leveransekandidat — `y8nr`

1. Les gjeldende git-diff og avgrens endringene fra `906`/`907`, nødvendige genererte filer, tester og dokumenter. Bruk en eksplisitt filliste ved senere staging. De to private selskaps-PDF-ene, Amex-filene og uvedkommende video-/Drive-materiale inngår ikke. Bevar alt eksisterende arbeid.
2. Rett README-tabellen til **Bra = 1 eller mellomrom etter vist fasit**, **Igjen = 2**. Kontroller PILOT-oppleggets vei fra ren profil via dagens Grammatikk-visning og skriv inn de faktiske knappene for artikkelleksjonen. Ikke gjeninnfør den fjernede lærerintroduksjonen for å få gammel dokumentasjon til å passe.
3. Avklar om det finnes et komplett, beholdt resultat som dekker nøyaktig kandidatens app- og testfiler. Ellers bygg og kjør `test:all` én gang sekvensielt. Hent slutten fra samme kjøring; ikke start en overlappende suite for å gjenfinne resultatet. Ved feil: behold første feil, undersøk årsaken og velg en ny, begrunnet kontroll. Ikke senk forventninger, legg inn retries eller hopp over tester for å få grønt.
4. Se gjennom beviset for ny profil → øving → dagens oppsummering → faktisk nedlastet fremgangsfil → import i separat profil. Kontroller også eldre sikkerhetskopi, gammel standardglose, feil/skadet import, avbrutt økt, 390 px og desktop/tastatur. Bruk syntetiske testdata. En eksisterende bestått relevant test kan dekke et scenario; ikke gjenta hele matrisen uten grunn.
5. Kontroller lydfeil og nedlasting → omlasting uten nett → avspilling, samt oppdatering med beholdt fremgang. Ved nye feil brukes nærmeste eksisterende regresjon først. En ekstra én-worker-matrise trengs bare hvis samtidighet/offline viser et uavklart avvik.
6. Skriv en ny datert release-rapport med kandidatens HEAD/arbeidsdiff, appbygg, testmiljø, eksakte kommandoer, exit-status, faktiske antall og bevisst utelatte opt-in-prober. Oppdater gjeldende pekere i README, PILOT og PILOT-READINESS. Offentlig kontroll og lærer-/elevvurdering får egne, ærlige statusfelt.

**Filer:** `README.md`, `PILOT.md`, `PILOT-READINESS.md`, ny `docs/release-verification-YYYY-MM-DD.md`. Kandidaten inkluderer eksisterende endringer i `index.html`, `data/vocabulary-canonical-review.json`, generert `data/vocabulary-canonical.json`, `dist/tailwind.css`, `sw.js` og tilhørende tester. Bare bekreftede feil gir nye kodeendringer. Standardfasit redigeres utelukkende i review-filen; stabile ID-er bevares.

**Ferdigkriterium:** Entydig kandidat, fullt bestått og beholdt testbevis, ingen uforklarte feil, kontrollerbar lærerveiledning og eksplisitt oversikt over hva som fortsatt venter på mennesker/publisering. Komplette tester må dekke eventuelle siste rettinger før levering.

### B. Lever og kontroller det elevene faktisk får — `s2qg`

1. Når leveransen er bestilt, undersøk gjeldende branch, PR og fjernstatus. Ikke anta at PR #7 fortsatt er åpen. Commit kandidatens eksplisitte filer og opprett/oppdater egnet PR mot `main`. Ingen bred `git add .` med de lokale private vedleggene.
2. Krev grønn Ubuntu-CI for riktig commit. `.github/workflows/ci.yml` kjører `test:all`. Kontroller at den tidligere Unicode-feilen på Inés-lyden er dekket av `tests/audio-paths.test.mjs` og Linux-resultatet; oppdater/lukk `903` når beviset foreligger.
3. Lever via faktisk konfigurert GitHub Pages-oppsett. App, service worker, CSS, manifest, PILOT og tilknyttede produktlydfiler må følge samme versjon. Kontroller deploy-resultatet; en push til arbeidsgren er ikke bevis på publisering.
4. Sammenlign offentlig `meta[name="app-build"]` og `sw.js` sin `APP_BUILD` med kandidaten. Kontroller at CSS og alle lydreferanser kan lastes med korrekt filnavn. Kjør den eksisterende live-proben som tillegg.
5. Kontroller en ren profil og en brukt testprofil med tidligere service worker: aktivt svar tømmes ikke automatisk, elevstyrt oppdatering viser ny versjon, fremgang kan eksporteres/importeres, og allerede nedlastet lyd fungerer. Live-proben blokkerer service workers og dekker derfor ikke dette alene.
6. Avslutt `k1wn` med offentlig bevis: fjernet «el Cola Cao» dukker ikke opp igjen fra gammel testprofil/import; arkivert fremgang beholdes; godkjente svar for «jeg skal snakke om» fungerer. Ved avvik opprettes konkret feil med reproduksjon og relevant test før ny levering.
7. Tilføy faktisk URL, commit, bygg, CI-/deploy-lenker og kontrolltid i release-rapporten. Ved alvorlig feil stanses berørt pilotflyt; avtal reverserbar retting eller tilbakeføring av produktfiler uten å slette elevdata. Publisert rapportoppdatering må ikke beskrives som levert før den faktisk er med.

**Filer:** Kandidatens produktfiler og gjeldende release-rapport. `tests/qa-live-deploy-probe.spec.js` endres bare hvis konkrete kontrollbehov krever det. CI-oppsettet er allerede til stede.

**Ferdigkriterium:** Grønn CI og vellykket deploy for riktig commit, samsvarende offentlig bygg, kontrollert ny/brukt profil og ingen uløste pilotkritiske feil. Kjent-godt utgangspunkt for eventuell tilbakeføring er identifisert.

### C–D. Lærerkontroll, kort prøve og oppfølging — `4or0` og `ee0`

Spansklæreren gjennomgår først den avgrensede artikkelleksjonen: regel, eksempler, gyldige svar, distraktorer, tilbakemelding og neste steg. Læreren følger den oppdaterte veiledningen på faktisk skoleutstyr og godkjenner den konkrete versjonen og innholdsavgrensningen. Skoleenhet, nettleser og tastatur/mobil noteres uten elevidentifikatorer.

Lydkontrollen i `4or0` beholder omfanget fem lyttehistorier og fem diktater. For hvert opptak registreres samsvar med manus, uttale, pauser, tempo, nivå, spørsmål/distraktorer og offline-avspilling. Inés/Diego vurderes spesielt for tempo. Et opptak som krever retting settes utenfor elevopplegget til produkteieren leverer korrigert opptak og læreren har kontrollert det. Delvis godkjenning lukker ikke hele `4or0`.

Deretter gjennomføres `ee0` med to lærere og seks elever: 20-minutters artikkelopplegg i PILOT, pluss omtrent fem minutter til sikkerhetskopi og spørsmål. Elevene skal finne oppgaven, svare, forstå responsen, åpne dagens oppsummering og forklare ett forbedringspunkt. Prøv eksport/import med syntetisk profil uten å slette ekte elevfremgang. En sterk elev skal finne en meningsfull videre oppgave.

Læreren noterer samlet hvor mange som kommer i gang/fullfører, antall nødvendige inngrep, konkrete stoppunkt og feil. Bruk eksisterende opplegg for anonyme observasjoner; ingen skjerm-/lydopptak, nye analyseverktøy eller elevsvar i git. Ved urimelig fasit eller fastlåst øving brukes papir/muntlig reserve og en avgrenset feilrapport uten elevnavn.

**Foreslåtte lokale godkjenningskriterier:** Alle seks kommer til avtalt øving og lokal oppsummering, ingen opplever fastlåst flyt eller avvisning av et lærergodkjent riktig svar i prøven, gjenoppretting demonstreres på testprofil, og hver elev kan forklare ett relevant forbedringspunkt med eventuell lærerhjelp. Noter hjelpen; kriteriene er ikke en validert måling av mestring. Konsekvensfulle feil rettes og den berørte flyten prøves igjen før utvidelse.

Følg deretter samme avgrensede opplegg i 2–3 uker med ny leksepakke og kontrollert appoppdatering. `ee0` lukkes først når både kort prøve, faglig gjennomgang og oppfølging er dokumentert. Læreren/produkteieren vurderer deretter bredere klassebruk.

**Filer:** `PILOT.md`, ny `docs/pilot-observasjoner-YYYY-MM-DD.md` med kun aggregert/anonym oppsummering, eventuell lokal lydgodkjenningsrapport og referanser i gjeldende release-rapport. Appen endres bare for påviste feil, med egne Beads og relevante regresjoner.

### E. Avklar videre kursomfang — `t1du`

1. Kartlegg alle 64 stabile ferdighets-ID-er fra `learningCatalog` og `getBrainmapSkillActionDescriptors()` i `index.html`. For de 27 planlagte beskrives faktisk eksisterende innhold og manglende forklaring, øving, lyd eller ferdighetsprogresjon. Planlagt status betyr ikke nødvendigvis at emnet er helt fraværende.
2. Bruk lærerens behov og pilotobservasjonene til å foreslå én liten, sammenhengende utvidelse med nødvendige forkunnskaper. Produkteier og lærer velger omfang før implementasjon. Resten markeres eksplisitt som utsatt med begrunnelse.
3. Opprett testbare Beads for den valgte delen: læringsmål, oppgavetyper, fasit/svarvarianter, distraktorer, norsk støtte, rute fra Brainmap og bevaring av fremgang. Hver implementeringssak inneholder sin verifikasjon; unngå separate testsaker som kan glemmes.
4. Koble eksisterende `egb` (Jeg kan-mål), `v0n` (aktivitetsforløp) og `1bb` (leseinnhold) til valgte behov. `brq`/`nsx` gjelder framtidige kontoer/personvern og utvider ikke denne piloten. Full A0–A1-dekning eller effektpåstander krever et eget avklart mål og dokumentasjon.

**Filer:** Datert omfangsplan under `thoughts/shared/plans/`, `.beads/issues.jsonl` via `bd`, eventuelt README ved besluttet produktløfte. Denne leveransen kartlegger og prioriterer; den endrer ikke elevfasit eller ferdighetsstatus.

**Ferdigkriterium:** Alle planlagte ferdigheter har gap og prioritering; valgt første utvidelse har gjennomførbare saker med tester. Å fullføre denne planen lukker gapet til en avgrenset pilot. Det leverer ikke automatisk alle 27 ferdigheter, et komplett kurs eller en skoleplattform.

## Verifikasjonskommandoer

Kjøres ved gjennomføring av A, fra repo-roten. Bygg og test skal fullføres sekvensielt, og komplett utdata og exit-status beholdes i releasegrunnlaget:

```sh
npm run build:app
npm run test:all
git diff --check
```

Bestått betyr exit 0 og samsvarende bygg. Dagens referanse er 47 Node- og 466 nettlesertester; bruk faktisk oppdaget antall ved kjøring, ikke et hardkodet måltall. `test:all` omfatter kildefasit, kataloger, innhold, Tailwind og offline-bygg. `scripts/test-browser.mjs` bruker to workere og utelater tre uttrykkelige opt-in-auditer.

Ved relevante rettinger eller udekket bekymring brukes nærmeste test før full port, eksempelvis:

```sh
npx playwright test tests/vocabulary-card-authority.spec.js tests/vocabulary-shortcuts.spec.js --browser chromium --workers=1 --reporter=line --max-failures=1
npx playwright test tests/grammar-lessons.spec.js tests/session-result-feedback.spec.js --browser chromium --workers=1 --reporter=line --max-failures=1
npx playwright test tests/import-export-compat.spec.js tests/storage-recovery.spec.js tests/backup-privacy.spec.js --browser chromium --workers=1 --reporter=line --max-failures=1
npx playwright test tests/listening-release.spec.js tests/report-offline-update.spec.js --browser chromium --workers=1 --reporter=line --max-failures=1
node --test tests/audio-paths.test.mjs
```

Etter publisering i B:

```sh
npx playwright test tests/qa-live-deploy-probe.spec.js --browser chromium --workers=1 --reporter=line --max-failures=1
```

Byggidentitet, oppgradering fra gammel cache og fysisk skoleutstyr kontrolleres i tillegg som beskrevet over; grønn live-probe alene er utilstrekkelig.

Plan- og dokumentarbeid verifiseres lett:

```sh
bd --no-daemon list --all --limit 0 --json
bd --no-daemon dep cycles
git diff --check
bd --no-daemon sync
```

Planen forutsetter ingen ny testramme eller avhengighet. Behold eksisterende dekning og legg bare til tester som beviser en reell ny retting eller et konkret manglende scenario.
