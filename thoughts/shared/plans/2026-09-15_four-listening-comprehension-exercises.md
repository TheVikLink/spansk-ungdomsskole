# Plan: Fire nye lytteforståelsesøvelser

## Mål

Utvid den lokale lytteforståelseskatalogen med fire selvstendige øvelser som bruker lokale lydfiler, inkludert én kort A0-øvelse på omtrent 30 sekunder.

## Ikke-mål

- Ikke endre diktatflyt, diktatlagring eller elevdata.
- Ikke innføre Google Drive, opplasting, kontoer eller nettverkstjenester.
- Ikke godkjenne faglig/uttalemessig innhold som en lærerpilot; dette må fortsatt gjøres av menneske.

## Akseptansekriterier

- Katalogen har fire nye historier med stabile ID-er, manus, norsk oversettelse og minst tre validerte spørsmål hver.
- A0-historien har faktisk lydvarighet omtrent 25–35 sekunder; de øvrige har dokumentert varighet og passende A0/A1-nivå.
- Lydfilene ligger lokalt under `audio/lyttehistorier/`, og appen viser nivå, region, sted og varighet.
- Lytteforståelse krever avspilling før spørsmål, skjuler tekststøtte til alle svar er forsøkt og lagrer ikke elevsvar.
- Katalog-, lyd- og UI-regresjonstester er grønne.

## Filer

- `index.html` — fire katalogoppføringer og varighetsvisning.
- `audio/lyttehistorier/*.wav` — nye lokale lydspor.
- `scripts/generate-listening-audio.mjs` — eksplisitt generering/validering av nye spor.
- `tests/dictation.spec.js` eller ny lytteforståelsesspec — katalog, spørsmål, varighet og lydport.
- `README.md` — oppdater antall og innholdstype når lyd og manus er verifisert.

## Steg

1. Velg manus og nivå fra eksisterende lokale diktattekster, med én kort A0-tekst.
2. Skriv katalogtestene først og bekreft at de feiler på manglende historier/lyd.
3. Legg inn katalogoppføringene og generer WAV-filer med den tilgjengelige lokale spanske stemmen.
4. Mål varighet og dekoding med `ffprobe`; korriger bare manus/lyd som ikke møter kontrakten.
5. Kjør målrettede lytte-/diktattester, bygg og full `npm run test:all`.
6. Dokumenter at lærer må lytte gjennom og godkjenne manus, tempo, uttale og distraktorer før pilot.
