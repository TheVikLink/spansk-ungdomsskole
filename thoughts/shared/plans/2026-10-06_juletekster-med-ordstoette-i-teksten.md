# Ordoversettelse direkte i juletekstene

Flytt tekstordlisten under hvert bilde og la eleven få norsk oversettelse ved å peke, fokusere eller trykke på ord og uttrykk i teksten. Dette følger produkteierens siste tilbakemelding og erstatter vanlig bildeordliste i nettprøven.

Beads: `spansk-ungdomsskole-5tb3`. Arbeid gjøres i eksisterende lokale prøve; ingen publisering, kontodata, nye avhengigheter eller endringer i standardfasit, Gloser-fremgang og PDF-er. Tekstinnhold og fullstendig utskriftsordliste beholdes.

## Utforming og observerbar aksept

- Ett lukket felt «Ordliste til teksten» under hvert bilde, på plassen til bildeordlisten. Ingen vanlig bildeordliste eller ekstra tekstordliste nedenfor teksten.
- Diskret understreking av ord og hele uttrykk med tilgjengelig oversettelse. Norsk vises først når eleven peker, fokuserer eller trykker. På mobil kan forklaringen lukkes med nytt trykk, utenfortrykk eller lukkeknapp; Escape virker på tastatur.
- Forklaringen ligger ved ordet, innenfor skjermen. Den kan leses mens musepekeren flyttes over den. Valgte ord forblir lesbare og teksten har samme ord, tegnsetting og avsnitt som før.
- Formene i teksten kobles eksplisitt til eksisterende ordliste, med kontekstoversettelse der en grunnform med artikkel skiller seg fra tekstformen. Lengste uttrykk velges før enkeltord; ordgrenser og aksenter respekteres.
- Bildeordpunktene virker fortsatt. Bare ved manglende bilde vises deres tekstalternativ. Uten JavaScript kan tekst og lukket fullordliste fortsatt brukes. Alt virker fra lokal fil uten nett, uten ny lagring eller forespørsler ved ordoppslag.

## Filer og gjennomføring

Endre `data/culture-packages.json` bare med kontrollerte tekstformer for leseord. Utvid `scripts/build-culture-preview.mjs` med ren annotering av avsnitt og ny ordlisteplassering. Oppdater `docs/kultur/jul-spania-chile/preview.js` og `preview.css` for ordoppslag, lukking og skjermplassering. Generer de to HTML-filene og oppdater lokal README.

Bruk korte test-først-runder i `tests/culture-packages.test.mjs` og `tests/culture-christmas-flow.spec.js`: plassering, annotering uten tekstendring/delord, deretter hover/tastatur/trykk, manglende bilde/skript, utskrift og offline. Kontroller til slutt den åpne fanen på desktop og 390 px, og lagre et skjermbilde med synlig oversettelse.

## Kontroll

Kjør med prosjektets Node 22-runtime:

```sh
node --test tests/culture-packages.test.mjs
npx playwright test tests/culture-christmas-flow.spec.js tests/culture-vocabulary.spec.js --browser chromium --workers=1
npm run build:app
npm run test:all
git diff --check
```

Testene må bestå ferskt. Oppdater og avslutt Beads-saken etter at manuell kontroll og bygg er ferdige, og kjør `bd --no-daemon sync`. Lærerfaglig gjennomgang og klasseromsprøve for hele kulturpakken følger fortsatt foreldresaken.
