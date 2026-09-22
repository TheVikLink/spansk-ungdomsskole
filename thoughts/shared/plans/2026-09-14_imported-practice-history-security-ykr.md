# Importert øvingshistorikk: validering og sikker visning (YKR)

## Mål

Hindre at en fremgangsfil kan lagre eller rendre aktiv HTML/JavaScript gjennom `practiceHistory`, uten å bryte kompatible historikkeksporter.

## Ikke-mål

- Ikke endre eksportformatversjon eller fjerne gyldig historikk.
- Ikke normalisere eller omskrive andre importerte domener uten en dokumentert kontrakt.
- Ikke persistere rå diktatsvar eller nye elevdata.

## Akseptansekriterier

- Full format-import normaliserer `practiceHistory` til en begrenset, kjent postform før lagring.
- Historikk- og rapportvisning rømmer fortsatt alt dynamisk tekstinnhold som siste forsvarslinje.
- En importert `<img onerror=...>`-payload gir ikke element, event handler eller utført kode.
- Den eksisterende gyldige import/export-fixturen bevares.

## Filer

- `tests/import-export-compat.spec.js` — RED/GREEN-regresjon gjennom offentlig import- og renderflyt.
- `index.html` — liten normaliserer og sikre render-sinker.
- `.beads/issues.jsonl` — status/notat for YKR.

## Arbeidsrekkefølge

1. Legg til én test som importerer den dokumenterte payloaden, viser historikk og rapport, og forventer kun en trygg/normalisert tekstrepresentasjon uten ekstra DOM-node eller kodeutførelse.
2. Kjør testen og bekreft RED mot nåværende implementasjon.
3. Innfør en privat normaliserer som aksepterer bare gyldige datoer, endelige ikke-negative tall, forventede tekst-ID-er og boolske øktflagg.
4. Bruk normalisereren både ved import og ved last av lokal historikk; escape dynamiske felt ved render.
5. Kjør den nye testen, import/export-kompatibilitet og storage recovery på nytt.

## Verifisering

```bash
npx playwright test tests/import-export-compat.spec.js --browser chromium --workers=1 --reporter=list
npx playwright test tests/storage-recovery.spec.js tests/backup-privacy.spec.js --browser chromium --workers=1 --reporter=list
npm run check:content-accuracy
```
