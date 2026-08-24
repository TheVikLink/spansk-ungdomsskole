# Plan: Norske bestemte former i glosevurdering

## Goal

Godta korrekt ubestemt og bestemt norsk form for alle rene substantivkort der den spanske glosen står med `el` eller `la`, uten å endre ordlyd, setningsbruk eller rekkefølge i innholdet.

## Non-goals

- Ikke endre norsk/spansk tekst i ordlisten.
- Ikke endre hvordan gloser brukes i setninger eller grammatikkoppgaver.
- Ikke godta generiske eller språklig tvilsomme suffiksvarianter automatisk.
- Ikke endre svarreglene for verb, fraser eller hele setninger.

## Acceptance criteria

- Alle rene artikkelord (`el`/`la`) har eksplisitt dokumenterte norske svarvarianter.
- Ubestemt og bestemt form godtas når begge er korrekt norsk for ordet.
- Frasene og setningene beholder nøyaktig eksisterende innhold og bruk.
- Regresjonstestene dekker hele katalogen og stopper ved manglende variant eller ugyldig innholdsendring.
- Eksisterende vocab- og import-/eksporttester består.

## Files to change

- `index.html` — eksplisitt variantkatalog og svarvurdering.
- `tests/vocab-learning-mechanics.spec.js` — katalogdekkende regresjonstester.

## Test plan

- `git diff --check`
- `npx playwright test tests/vocab-learning-mechanics.spec.js --workers=1 --browser chromium`
- `npx playwright test tests/import-export-compat.spec.js tests/vocab-learning-mechanics.spec.js --workers=1 --browser chromium`
- `npm run check:content`

## Steps

1. Identifiser alle rene substantivkort med spansk `el`/`la`, og skill dem fra fraser/setninger.
2. Skriv én regresjonstest som viser at katalogen har eksplisitte, korrekte variantlister.
3. Legg inn variantene i den eksisterende svarvariantmodellen uten å endre glossary-innholdet.
4. Kjør katalogtesten, rett kun dokumenterte variantfeil, og kjør full relevant testpakke.
5. Inspiser diffen for å bekrefte at ingen ord eller setninger er endret, og commit endringen etter grønn verifisering.
