# Implementeringsplan: Egne lyttehistorier for lytteforståelse (spansk-ungdomsskole-zme)

## Mål

Erstatt pilotens gjenbruk av diktat med en egen lyttehistoriekatalog og en første, sammenhengende A0-historie på omtrent ett minutt, med forståelsesspørsmål og tekststøtte etter elevens forsøk.

## Ikke-mål

- Dagens fortellingsbaserte diktat, `DICTATION_STORIES`, diktatlagring, eksport/import og diktat-lydfiler skal ikke endres eller brukes av lytteforståelse.
- Ingen automatisk talegjenkjenning, fritekstvurdering, stjerner, elevtekstlagring, kontoer, analyse eller nettverkskall fra elevappen.
- Første leveranse er én ferdig pilotfortelling; flere historier og nivåfiltre bygges på samme kontrakt senere.
- Lydproduksjon skjer i forfatter-/byggeflyten. Elevbundlen refererer kun til lokale, statiske lydfiler.

## Akseptansekriterier

1. «Lytteøvelser» viser en egen seksjon for lyttehistorier og en separat diktatseksjon. Lyttehistorien har ingen segment- eller skrivefeltflyt.
2. Piloten har en egen historie- og lyd-ID, manus/transkripsjon, norsk oversettelse og lokalt lydspor på 45–75 sekunder (mål cirka 60 sekunder), kvalitetssikret for A0/A1.
3. Eleven må starte lydavspillingen før spørsmålene aktiveres. Tre flervalgsoppgaver dekker hovedinnhold, detalj og relevant handling/slutning, med plausible distraktorer, entydig korrekt svar og kort norsk forklaring.
4. Fasit, transkripsjon og oversettelse er skjult frem til eleven har svart på alle tre spørsmålene. Tekststøtten er valgfri og lukket som standard.
5. Lytteøkten bruker en egen minnetilstand og skriver ikke til `DICTATION_KEY`, `practiceHistory`, læringsprogresjon eller eksport. Diktatflyten og eksisterende diktattester er uendret.
6. Lydfeil, retry, nedlasting/offline, tastatur og 390 px vises og fungerer for den nye lydmappen. Service worker har eksplisitt lokal håndtering for lyttehistorier uten å endre diktat-cachekontrakten.
7. Lydfilen og manus er manuelt gjennomgått av spansklærer for idiomatikk, nivå, tempo, uttale, spørsmål og distraktorer før Beads-oppgaven lukkes.

## Første historie (arbeidsutkast som må faglig godkjennes)

Arbeidstittel: **«En lørdag i Sevilla»**, nivå A0/A1, hverdagsliv og fritid. Manus skal være cirka 100–120 enkle ord og leses i naturlig, rolig tempo:

> Hola, soy Leo y vivo en Sevilla. Hoy es sábado. Por la mañana, desayuno pan, fruta y yogur con mi madre. Después, voy en bicicleta al parque. En el parque hay muchos árboles y un pequeño lago. Veo a mi amiga Marta. Ella tiene una pelota amarilla. Jugamos al fútbol durante un rato. Luego, nos sentamos en un banco y bebemos agua. Antes de volver a casa, compramos un helado de chocolate. Al mediodía, mi padre prepara arroz y ensalada. Por la tarde, leo un cómic, escucho música y ordeno mi habitación. Estoy cansado, pero contento. Me gusta mucho el sábado.

Spørsmålene skal ligge i historieobjektet med stabile ID-er:

- Hovedinnhold: Hva gjør Leo på lørdagen? Korrekt svar oppsummerer sykkeltur til parken, lek med Marta og hjemlig lørdag.
- Detalj: Hva har Marta med seg? Korrekt svar: en gul ball.
- Relevant handling/slutning: Hva skjer før Leo og Marta går hjem? Korrekt svar: de kjøper en sjokoladeis.

Læreren må godkjenne manus, uttale og tre sett med fire norske svaralternativer før lydfilen regnes som ferdig innhold.

## Filer som skal endres

- `index.html` — ny `LISTENING_STORIES`-katalog, egen oversikt/knapp, egen `listeningState` og spørsmål-/tekststøtteflyt; fjern pilotkoblingen fra diktatkortene.
- `src/styles/tailwind.css` — layout for to innholdstyper, lyttehistoriekort, lydstatus og svaralternativer.
- `sw.js` — allowlist/cache-first for `audio/lyttehistorier/` (eller valgt endelig mappe), uten å blande katalogene.
- `audio/lyttehistorier/leo-sevilla-full.mp3` — lokalt, generert lydspor etter godkjent manus; ingen elevruntime-generering.
- `scripts/generate-listening-audio.mjs` — deterministisk, lokal forfatterkommando med valgt spansk stemme og ffmpeg; feiler tydelig hvis verktøy eller stemme mangler.
- `scripts/check-listening-audio.mjs` — validerer at lydfilen finnes, kan dekodes og ligger i 45–75-sekundersintervallet.
- `tests/dictation.spec.js` — oppdater forventningene slik at diktat ikke viser lytteknappen; behold diktatdekningen.
- `tests/listening-comprehension.spec.js` — nye tester for katalog, lydport, spørsmål, fasitport, manglende lagring, tastatur, mobil og tekststøtte.
- `tests/report-dictation.spec.js` — behold eksisterende diktat-/lydfeiltester; legg kun til en regresjon som bekrefter separat tilstand dersom nødvendig.
- `tests/report-offline-update.spec.js` — separat offline-scenario for den nye lyttehistoriefilen.
- `README.md` — dokumenter forskjellen mellom diktat og lyttehistorier, lokal lydproduksjon, varighet og ingen lagring av lytte-svar.
- `dist/tailwind.css` og `sw.js` — genererte artefakter fra bygg; ikke rediger stylesheet/service-worker-versjon manuelt.

## Gjennomføringssteg

1. Oppdater historie- og Beads-kontrakten. Flytt lytteinnholdet ut av `DICTATION_STORIES`, legg inn `LISTENING_STORIES` med manus, oversettelse og validerbare spørsmål, og oppdater zme-beskrivelsen til egen katalog/lyd.
2. Skriv den nye katalogtesten først. Den skal sikre egen historie-ID, minst tre spørsmål, fire unike alternativer, korrekt svar-ID, forklaring og 45–75 sekunders lydmetadata. Bekreft at diktatkortene ikke får lytteknapp.
3. Implementer egen lytteoversikt og egen `listeningState`. Lyttehistorier skal ha egen startknapp, egen lyd-URL og egen avslutning; ingen funksjon skal kalle diktatsegment-/completion-funksjoner.
4. Implementer lokal lydproduksjon og validering. Generer MP3 fra manus etter lærerens tekstgodkjenning, mål faktisk varighet og kontroller dekoding. Legg bare den ferdige filen i lyttehistoriekatalogen.
5. Implementer spørsmål, feedback og tekststøtte i en eksplisitt tilstandsmaskin. Krev `play`, ett svar per spørsmål og fokusflytting; vis resultat/fasit etter siste innsending og hold transkripsjon/oversettelse i lukket `details`.
6. Utvid service worker og offline-nedlasting med den nye relative lydmappen. Test manglende fil, retry, cache-hit og offline uten å endre eksisterende diktatfiler eller cache-migrering.
7. Oppdater README, CSS og genererte artefakter. Kjør fokustester mellom hvert steg, deretter full bygg- og testgate.
8. Gjennomfør spansklærerens innholds- og lydgjennomgang. Først etter godkjenning kan zme lukkes; eventuelle endringer i manus eller distraktorer skal oppdatere katalogtesten.

## Testplan

Fokustester:

```bash
node scripts/check-listening-audio.mjs
npx playwright test tests/listening-comprehension.spec.js tests/dictation.spec.js tests/report-dictation.spec.js tests/report-offline-update.spec.js --browser chromium
```

Leveringsgate:

```bash
npm run build:app
npm run check:offline-build
npm run test:all
git diff --check
```

Manuell kontroll: lytt gjennom historien på mobil og desktop, bekreft cirka ett minutts tempo, prøv uten tekst først, åpne tekststøtten etter alle svar, bruk tastatur, simuler lydfeil og test offline etter nedlasting.
