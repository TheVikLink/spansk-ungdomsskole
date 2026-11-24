# Brainmap: komplett A0–A1-mikroskillkatalog

## Mål

Gjøre Brainmap til en nivå- og kategoribasert oversikt over alle relevante A0- og A1-mikroskills som allerede har eller får aktiv øving i appen.

## Ikke mål

- Ikke kopiere KwiziQs innhold eller tekster.
- Ikke legge til innlogging, skydata, analyse eller elevidentifikatorer.
- Ikke gjøre en stor arkitekturomskriving av `index.html`.
- Ikke late som om en grammatikkoppgave dekker en mikroskill før koblingen er eksplisitt definert.

## Akseptansekriterier

- Det finnes én kanonisk katalog med stabile ID-er, nivå (`A0`/`A1`), kategori, norsk elevvennlig navn og kilde/øvingstype.
- Alle eksisterende grammatikktemaer, verbfokus, preposisjoner, setningspuslespill og nivåmerkede ordforrådsområder er enten koblet til en mikroskill eller dokumentert som utenfor A0/A1.
- Brainmap viser alle katalogførte mikroskills, også de som ikke er startet; ustartet betyr grå, ikke skjult.
- Hver mikroskill har en konkret øvingsrute eller en tydelig «innhold mangler»-tilstand.
- Eksisterende `skillProgress`-ID-er mappes uten å miste lokal progresjon.
- Eksisterende ordforrådskategorier og praksisknapper beholdes.
- Testene dekker katalogintegritet, ID-migrering, statusberegning og at alle viste noder har en gyldig øvingsrute.

## Filer som sannsynligvis endres

- `index.html` — katalog, koblinger, migrering, Brainmap-visning og ruter.
- `tests/brainmap-progress.spec.js` — Brainmap- og katalogregresjoner.
- `tests/learning-catalog.spec.js` — stabile nivåer, grupper og koblinger.
- `tests/brainmap-catalog.spec.js` — nye katalogegenskaper dersom separat testfil gir bedre avgrensning.
- `README.md` — oppdatert beskrivelse av Brainmap-omfanget.
- `thoughts/shared/plans/2026-08-28_brainmap-a0-a1-microskills.md` — denne planen.

## Fremgangsmåte

1. Inventer eksisterende innhold fra `grammarTopics`, `verbDatabase`, `prepositions`, setningspuslespill og glossary-kategorier. Lag en tabell med foreslått A0/A1-nivå og identifiser manglende øvingskoblinger.
2. Skriv første røde test for en kanonisk katalog: forventede grupper/nivåer, unike ID-er, og at hver katalogoppføring peker på kjent innhold eller eksplisitt manglerute.
3. Implementer katalogen i minste mulige form og få katalogtesten grønn.
4. Skriv røde tester for migrering fra dagens åtte Brainmap-ID-er og for ustartede mikroskills.
5. Implementer progresjonslesing/migrering slik at gammel lokal progresjon beholdes og nye noder starter grått.
6. Skriv røde tester for øvingsruter og implementer ruter for eksisterende grammatikk, verb, preposisjon, setningspuslespill og ordforråd.
7. Oppdater Brainmap-renderingen til å gruppere etter nivå og kategori, med tydelig status og «øv»-handling.
8. Verifiser innholdet med `npm run extract:items`, `npm run check:content-accuracy`, relevante Playwright-tester og `git diff --check`.
9. Oppdater README, lukk Beads-oppgaven først når katalog, ruter og tester er verifisert.

## Testplan

```bash
npm run extract:items
npm run check:content-accuracy
npm run test:learning-catalog
npm run test:brainmap
npx playwright test tests/brainmap-catalog.spec.js --browser chromium
git diff --check
```

Ved nettleserbegrensning skal kildekode-/katalogtestene fortsatt kjøres, og nettleserfeilen rapporteres separat.
