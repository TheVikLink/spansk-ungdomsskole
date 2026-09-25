# Pilotkandidat — 23. september 2026

Arbeidsgrunnlag: `fix/vocabulary-review-favicon`, HEAD `1aba3dd`, appbygg `7072d6e4a34f6771`. Beads: `y8nr` (lokal kandidat), `s2qg` (levering), `903` (Linux-lydfilbane), `k1wn` (offentlig gloseretting), `4or0`/`ee0` (menneskelig kontroll).

Status: dokumentrettelser og lokal teknisk verifikasjon er ferdige. Ingen fersk offentlig verifikasjon, lærer-/enhetsgodkjenning eller elevpilot er bekreftet. Appens eksisterende oppførsel og fasit er bevart.

## Kandidat og dokumentrettelser

Kandidaten inneholder de eksisterende endringene fra `906`/`907`: gjennomgått glosefasit, kortvisning og migrering, hint/distraktorer, hurtigtaster, invertert tegnsetting og fjerning av fast lydmelding fra gloser/quiz. Denne oppfølgingen retter dokumentasjonen: README-tabellen følger Bra = 1/mellomrom og Igjen = 2 etter fasit; PILOT beskriver eksisterende vei via Grammatikk → Leksjoner → «Velg el, la, los eller las» → «Øv på el, la, los og las».

Plan og avgrensning: [Fra reality-check til pilot](../thoughts/shared/plans/2026-09-23_reality-check-til-pilot.md). Historiske resultater står i [rapporten 18. september](release-verification-2026-09-18.md).

Bygg-ID alene beviser ikke hvilken test-/dokumentversjon som ble kontrollert. Ferske resultater og filidentitet står nedenfor.

## Menneskelig kontroll

Første artikkelpilot krever lærerens faglige kontroll og fysisk skoleutstyr. Lyd inngår først etter kontroll av de valgte opptakene; full `4or0` omfatter alle fem lyttehistorier og fem diktater. `ee0` omfatter kort moderert prøve med to lærere og seks elever, deretter 2–3 ukers oppfølging. Ingen av disse punktene er gjennomført av agenten.

## Ferske resultater 23. september

Miljø: Node 20.12.0, Playwright 1.60.0, macOS. `npm run build:app` fullførte med exit 0; generert appbygg er fortsatt `7072d6e4a34f6771`.

| Kontroll | Resultat |
|---|---|
| Kildeordliste og genererte filer | 522 oppføringer kontrollert |
| Innhold/kataloger | 16 beskyttede rettelser; 13 mekaniske + 3 korpuskontroller; 8 leksjoner; 12 diagnoseoppgaver |
| Node-tester | 47/47 bestått |
| Læringskatalog, Tailwind og offline-bygg | Bestått |
| Full `test:all` | Exit 0; 466 Chromium-tester bestått (1,3 min) |
| Visuell kontroll via Computer Use | Chrome-tilgang fortsatt avvist: `Computer Use was not approved to use Google Chrome` |
| GitHub PR-/CI-status | `gh` fikk ikke kontakt med `api.github.com` |
| Offentlig nettsted | Nettverktøyet kunne heller ikke hente appen eller PR-listen; offentlig versjon er uavklart |

Maskinelle innholdskontroller utfører ikke faglig vurdering av idiomatikk og distraktorer. Katalogens 37 aktive ruter er kontrollert ved kjøring av rutefunksjonen på de faktiske katalogene i Node; ingen fersk nettlesergodkjenning utledes av det.

Et nytt, sekvensielt `npm run test:all` i dette miljøet 23. september fullførte med exit 0. Kjøringen kontrollerte 522 gloseoppføringer, innholds- og leksjonskatalogene, 47 Node-tester, læringskatalog, Tailwind og offline-bygg før den kjørte 466 Chromium-tester på 1,3 minutter. Den tidligere oppstartsfeilen er derfor ikke en gjeldende lokal testblokkering.

Den tidligere, avgrensede diagnostiske testen dokumenterte miljøfeilen som da forelå:

```sh
npx --no-install playwright test tests/pilot-audit.spec.js --grep 'fresh pupil' --browser chromium --workers=1 --max-failures=1 --reporter=line
```

Apppåstandene i den tidligere kjøringen kom ikke til kjøring. Den ferske komplette kjøringen over viser at feilen ikke hindrer nettleserporten nå. Den erstatter ikke den nødvendige visuelle kontrollen i Chrome eller kontroll av offentlig versjon.

Beholdte, lokale logger (midlertidige filer):
- `/private/tmp/spansk-pilot-y8nr-test-all-20260923.log`
- `/private/tmp/spansk-pilot-y8nr-browser-start-20260923.log`

Den registrerte 47/466-kjøringen fra 22. september i `906`/`907` er historisk bevis. Den omtales ikke som en ny bestått kjøring her.

## Identitet for app og tester

Basecommit: `1aba3dd1d93676146503c53773e61e248564439a`. SHA-256 for kandidatens sentrale filer:

| Fil | SHA-256 |
|---|---|
| `index.html` | `549d9b2b031ca3e187f701e0e30b5be51f2b410ab0e27d57f8053740f2745787` |
| `sw.js` | `1edb7004ddb04b7fca5ecc30261691aab3e7ed455c81eac0ce28abcd24437386` |
| `dist/tailwind.css` | `bba5362241fd6f1654043a45ea2c50d48c2cdebdfd547502e8495258b0e7d636` |
| `manifest.webmanifest` | `38f64d161f68223ce87dba3c32b0d392d2a78bc696faf6f449a357166e4180aa` |
| `data/vocabulary-canonical-review.json` | `f4158e6258ea339cb71948b20c91af3ba0411f174edb0e3836b9253ea85d8081` |
| `data/vocabulary-canonical.json` | `a0397615cd43b599eb3c0343a62ed0c639e51d6036456a3cc640d757a59b320e` |
| `package.json` | `056d94dab056f8c1cfc16e8abd797bf2cb6c63971307535793d71fff90f96aa7` |
| `package-lock.json` | `0c2e67e8b7ced4f8106dd5360a98b9460112571857dc5c493a4e0bcf5f5a29c4` |

Alle 69 filer i `tests/` som ender på `.spec.js` eller `.test.mjs`, inkludert opt-in-prober, gir samlet fingeravtrykk `063709eeeb3544bdf80ab9176d4da7c8013360ddfa42874e08b9f702c33fb72c`. Beregning: sorter filnavn, beregn hver fils SHA-256, sett sammen `filbane + NUL + hash + LF`, og SHA-256-hash dette. Denne identiteten beskriver filene; den er ikke et grønt testresultat.

## Avgrenset filliste for senere levering

Følgende nye/endrede filer er relevante for denne kandidaten over basecommitten. Listen er en konkret avgrensning for gjennomgang/staging; ingen staging eller commit er utført:

```text
.beads/issues.jsonl
README.md
PILOT.md
PILOT-READINESS.md
index.html
sw.js
dist/tailwind.css
data/vocabulary-canonical-review.json
data/vocabulary-canonical.json
tests/adaptive-scaffolding.spec.js
tests/report-game-support.spec.js
tests/student-learning-flow-audit.spec.js
tests/tts.spec.js
tests/vocab-learning-mechanics.spec.js
tests/vocabulary-authority.test.mjs
tests/accent-input.test.mjs
tests/vocabulary-card-authority.spec.js
tests/vocabulary-shortcuts.spec.js
tests/vocabulary-shortcuts.test.mjs
docs/reality-check-2026-09-18.md
docs/release-verification-2026-09-18.md
docs/release-verification-2026-09-23.md
docs/pilot-kontrollskjema.md
thoughts/shared/plans/2026-09-22_vocabulary-card-authority.md
thoughts/shared/plans/2026-09-22_vocabulary-shortcuts.md
thoughts/shared/plans/2026-09-23_reality-check-til-pilot.md
thoughts/shared/plans/2026-09-23_a0-kursomfang-og-dekning.md
```

Manifest, øvrige kilde-/testfiler og produktlyd finnes allerede i basecommitten og skal følge den komplette deployen. Uvedkommende PDF-er, Amex-filer og video-/Drive-materiale inngår ikke. Kontrollskjemaet er en tom mal, ikke innsamlede elevdata.

## Det som gjenstår for y8nr og s2qg

Kjør fra repo-roten ved senere endringer, eller når kandidatfilene endres:

```sh
npm run build:app
npm run test:all
git diff --check
```

Følg deretter den dokumenterte veien fra ren profil i PILOT ved mobil- og desktopbredde. Kontroller faktisk fremgangseksport/import, eldre testprofil, gjenopptak etter avbrudd og nedlastet lyd etter offline-omlasting. Bruk eksisterende regresjonsbevis der det dekker scenariet. Denne visuelle kontrollen kan ikke gjennomføres her mens Chrome-tilgang fortsatt avvises.

Den lokale automatiserte porten er grønn. Etter den gjenværende visuelle kontrollen oppdateres rapporten med faktisk sluttrapport og eventuelle nye hasher; først da kan `y8nr` lukkes. `s2qg` krever deretter faktisk commit/PR/CI/deploy og samsvarende offentlig app-/service-worker-bygg, samt oppgradering av brukt testprofil. `903` og `k1wn` beholdes åpne til henholdsvis riktig Linux-CI og offentlig retting er bekreftet. Ingen av disse eksterne resultatene er bekreftet her.

## Innholdsbeslutning og lærerens neste steg

[Alle 64 ferdigheter er kartlagt](../thoughts/shared/plans/2026-09-23_a0-kursomfang-og-dekning.md). Produkteieren valgte mer variert øving i eksisterende A0-grunnlag etter piloten; oppfølging ligger i `rl3y` og `o13t`. Ingen ny elevoppgave er lagt inn i denne leveransen.

[Lærerens kontrollskjema](pilot-kontrollskjema.md) er klart for faglig/utstyrskontroll, de ti opptakene, kort prøve og 2–3 ukers oppfølging. Feltene står uttrykkelig som ikke utført.
