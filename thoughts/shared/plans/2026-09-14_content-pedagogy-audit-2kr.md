# Faginnholds- og pedagogikkaudit (2KR)

## Mål

Verifisere at dagens læringsinnhold, svaraksept, støtte og mestringstekster er idiomatiske, A0–A1-relevante for norske 9.-klassinger og krever et reelt elevforsøk.

## Ikke-mål

- Ikke endre gloser, grammatikk, lyd eller fasit i selve auditen.
- Ikke erklære eksternt faktasjekket språklig korrekthet uten dokumenterbar kilde eller menneskelig spansklærer-vurdering.
- Ikke revidere arkitektur, lagring eller visuell design uten at et konkret pedagogisk avvik krever et separat Bead.

## Akseptansekriterier

- Mekaniske katalog- og svarakseptkontroller kjøres på nåværende arbeidskopi.
- Nye eller endrede læringsflater undersøkes for fasit, alternativer, hint, forklaring, nivå og aktiv gjenkalling.
- Hvert funn har konkret elevhandling, fil-/linjereferanse, alvorlighet og foreslått korrigering.
- Uverifiserte stilpreferanser holdes utenfor feilrapporten.

## Filer som oppdateres av auditen

- `thoughts/shared/plans/2026-09-14_content-pedagogy-audit-2kr.md` — denne avgrensningen.
- `.beads/issues.jsonl` — status/notat for 2KR og eventuelle dokumenterte avvik.

## Auditsteg

1. Kartlegg dagens kataloger og øvingsformer: gloser, verb, grammatikk, diagnose, mixed quiz, spill, diktat og lyttehistorier.
2. Kjør `extract:items`, `check:content-accuracy`, katalogkontroller og answer-acceptance-fuzz for mekaniske kontrakter.
3. Les fasit-/alternativlogikk og målrettede spec-er for å kontrollere at korrekte svar er mulig, plausible alternativer ikke er identiske, aksent/ñ-regler er pedagogisk konsistente og norske former ikke gir urimelig feil.
4. Gjennomgå ny/nylig berørt lytte- og diktattekst, grammatikkforklaringer, hint og mestringstekster med A0–A1/aktiv-gjenkalling-linse.
5. Kjør representative nettleserflyter: én ny elev, én feil med støtte, én korrekt respons og én avsluttet økt per relevant endret læringsmodus.
6. Registrer bare reproduserbare avvik; oppdater og lukk 2KR, synkroniser Beads og kjør `git diff --check`.

## Testplan

```bash
npm run extract:items
npm run check:content-accuracy
npx playwright test tests/content-accuracy-audit.spec.js tests/answer-acceptance-fuzz.spec.js tests/grammar-explanations.spec.js tests/dictation.spec.js tests/report-dictation.spec.js tests/productive-patterns.spec.js --browser chromium --workers=2 --reporter=list
```

Grønt betyr at alle mekaniske kontrakter og representative læringsflyter passerer. Det erstatter ikke spansklærerens stikkprøve av idiomatikk; den menneskelige usikkerheten rapporteres eksplisitt.
