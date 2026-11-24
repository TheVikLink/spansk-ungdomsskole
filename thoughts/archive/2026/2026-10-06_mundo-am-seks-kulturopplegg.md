# Seks komplette Mundo AM-opplegg

Mål: Lag polerte lokale opplegg for Honduras, Cartagena/Colombia, Mexico, Spania, Peru og Ekvatorial-Guinea, med den reviderte julepakken som undervisnings- og kvalitetsmal.

Beads: `spansk-ungdomsskole-8kt7`. Aktivt Codex-mål opprettet etter produkteierens uttrykkelige ønske. Arbeidsgren: `codex/mundo-am-seis-paises`, fra samme HEAD som `main`, med eksisterende lokale endringer bevart.

## Leveranse og avgrensning

Hvert opplegg får én original sammenhengende tekst på omtrent 330–350 spanske ord i seks avsnitt (levert 326–348), en tydelig fiktiv ungdom og et konkret sted: Copán Ruinas, Cartagena, Oaxaca, Valencia, Cusco og Bata. Faglige kulturopplysninger kildeføres separat fra ungdommens oppdiktede dag. Ungdommene/familiene og illustrasjonene skal være ulike, og moderne hverdagsliv skal ha plass sammen med kultur og historie.

Egne genererte illustrasjoner med 4–5 gjennomgåtte ordpunkter; geografisk locator fra eksisterende Natural Earth-grunnlag. Hele teksten under bildet, omfattende direkte ordoppslag, muntlig oversettelse i par, fire avkrysningsspørsmål, åpne sammenligninger, språkoppgave og ti valgfrie gloser. Separate 45-minutters lærerplaner/fasiter og elev-/lærer-PDF-er. En lokal oversikt gjør alle pakkene lette å åpne.

Eksisterende julepakke, standardfasit, eksisterende fremgang og eksportformat skal fortsatt fungere. Ingen ny backend, persondata, lyd/TTS, innlogging, rammeverk eller eksternt publiseringssteg. Nye land behandles som faglig gjennomarbeidede lokale utkast; det påstås ikke at en klasseromsprøve er gjennomført.

## Arkitektur og filer

- `data/culture-packages.json`: seks nye pakker; nødvendige generiske metadata for kart og øvingsetiketter. Samme schema v1 og stabile ID-er.
- `scripts/build-culture-preview.mjs`: støtte for ett eller to land, individuelt kart/PDF/ordsett og alle pakkeutganger. Trygge lokale filbaner, unike ID-er og komplett fasit.
- `docs/kultur/jul-spania-chile/preview.css`, `preview.js`: gjenbrukes som felles tilgjengelige ressurser; bare avgrenset stiltillegg for katalog/landpakker ved behov.
- `docs/kultur/index.html`, `docs/kultur/<pakke-id>/index.html`, `laerer.html`: generert lokal katalog og to visninger per pakke.
- `images/kultur/mundo-am/`: seks versjonerte image_gen-illustrasjoner og kontrollerte SVG-locatorkart.
- `docs/kultur/mundo-am/README.md` og `bilde-og-kildeprotokoll.md`: kilder, originale bildeprompter, hash/koordinater, innholdsgjennomgang og eksakt verifikasjon.
- `index.html`: genererte glosedata med riktig returlenke per pakke. Ingen ny øvingsmotor.
- `scripts/build-culture-pdfs.py`: gjenbruk eksisterende elev-/læreroppsett, velg pakke og egne filnavn/kart/etiketter. Jule-PDF-er bevares.
- `tests/culture-packages.test.mjs`, ny `tests/culture-mundo-flow.spec.js` og relevant eksisterende Gloser-test: generisk pakke, katalog, lesetekster, spørsmål, tilgjengelige oppslag, Gloser-retur og regresjon av jul.

## Gjennomføring

Først kildeundersøkelse og bilde-/tekstspesifikasjoner. Test én avgrenset generalisering av validering/rendering før implementasjon; behold jule-regresjonene. Bygg første land ferdig fra kilde til elev/lærer/Gloser, og bruk det gjennomgåtte oppsettet til de øvrige. Lag ulike illustrasjoner med innebygd image_gen; inspeksjon og plassering i repo skjer før de kobles til siden. Bygg to PDF-er per land med samme kilde og kontroller alle sider visuelt og med tekstuttrekk. Oppdater Beads med faktisk fremdrift/evidens, ikke parallelle markdown-oppgavelister.

## Kontroll og aksept

Med Node 22.23.3 fra `/private/tmp/spansk-culture-node22/node-v22.23.3-darwin-arm64/bin`:

```sh
node --test tests/culture-packages.test.mjs
npx playwright test tests/culture-christmas-flow.spec.js tests/culture-vocabulary.spec.js tests/culture-mundo-flow.spec.js --browser chromium --workers=1
npm run build:app
npm run check:culture
npm run check:vocabulary
npm run test:all
git diff --check
```

Alle seks tekster og fire spørsmål per pakke skal kunne leses og besvares med riktig fasit. Ingen lesestøtte-liste/pil eller sidekolonne på nett. Bildeord og direkte oversettelse fungerer med tastatur, pek og trykk; lukking/feilbilder/skriptfeil gir en brukbar side. Kontroller full tekstbredde, 390 px mobil, katalog, lærerfasit og hvert glosesett/returlenke. Eksport/import og jule-settets kortgjenbruk skal være kompatible. Kontroll av PDF-er omfatter full tekst, papirordlister, alle alternativer, separate fasiter, kart/bilder og alle sider uten avklipping. Samlet gate rapporteres nøyaktig også om miljøfeil må undersøkes separat. Ingen publisering som del av målet.
