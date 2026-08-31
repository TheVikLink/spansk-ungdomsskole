# Offline curriculum-audit for svarvarianter

## Goal

Bygg en utviklerstyrt, offline audit-pipeline som samler kandidatvarianter fra Norsk ordbank, Norsk ordvev, OMWN/Cygnet og kontrollert Wiktionary, uten at eksterne kilder blir elevfasit.

## Non-goals

- Ingen runtime-API-kall, backend, analytics eller elevdata.
- Ingen automatisk semantisk godkjenning.
- Ingen omskriving av `index.html` utover manuelt godkjente katalogdata.
- Ingen blanding med studentfeedback-kanalen.

## Acceptance criteria

- Kildedata er versjonerte eller lisensmessig tillatte snapshots med provenance, hash og lisensmetadata.
- Audit-output er deterministisk og skiller rå kandidater, review-status og godkjente appvarianter.
- Kun manuelt godkjente kandidater kan legges til i `vocabularyAnswerAlternatives`.
- Canonical answers bevares, og godkjente svar fungerer i begge retninger uten å lekke til andre glossary-par.
- `tradere`/`vandle`, tvetydighet, kildefeil, aksenter, artikler og bestemte former har negative/regressive tester.

## Implementation

1. Definer snapshot-/manifestformat og kildepolicy før adaptere. Rådata som ikke kan committes erstattes av tillatte avledede utdrag.
2. Definer stabile glossary-par-ID-er og et kandidatskjema med retning, original/normalisert tekst, provenance, entry-/synset-ID, evidens, confidence og review-status.
3. Implementer isolerte kildeadaptere og en offline audit-runner. Nettverksrefresh er separat fra vanlig audit/CI og rapporterer `source_unavailable` eksplisitt.
4. Skill dagens sirkulære `reference-corpus` fra eksterne evidence-/review-artefakter. Lag godkjenningsmanifest og deterministisk generator som alltid inkluderer canonical answer.
5. Legg til rene tester først for normalisering, matching, provenance, determinisme og godkjenningsimport; legg deretter til negative og begge-retninger Playwright-regresjoner.
6. Dokumenter oppdatering, review, lisens og offline CI i `README.md`. Oppdater Beads underveis og synkroniser ved avslutning.

## Verification

```bash
npm run extract:items
npm run check:content-accuracy
npm run build:corpus
npm run test:content-accuracy
npx playwright test tests/answer-acceptance-fuzz.spec.js --browser chromium
git diff --check
npm run test:all
```
