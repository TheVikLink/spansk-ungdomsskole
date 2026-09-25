# Lokal releaseverifikasjon — 18. september 2026

Historisk verifikasjon av bygget nedenfor. Se [kandidaten 23. september](release-verification-2026-09-23.md) for nyere endringer og dagens åpne verifikasjonspunkter. Resultatene fra 18. september er bevart uendret.

Status: lokal teknisk releaseport bestått på bygg `9028eaf8e4ba8273`. Dette er ikke lærergodkjenning, elevpilot eller publisering. Neste steg er lærerens faglige og fysiske enhetskontroll før en liten, moderert elevprøve; ingen generell helklassegodkjenning gis.

## Verifisert versjon

- Arbeidskopi på `fix/brukertest-2026-09-08`, over HEAD `c602199`.
- Endelig app-/service-worker-bygg: `9028eaf8e4ba8273`.
- Miljø: Node 20.12.0, Playwright 1.60.0, Chromium på macOS.
- Leveransen omfatter `gdco`, `x7ou`, `do6v`, `w7a` og deretter dokumentasjonssaken `9l5u`. Ingen ny lyd, tjenester, avhengigheter eller progresjonsskjemaer er lagt til.

## Rettelser og bevis

| Område | Endring | Fersk verifikasjon |
|---|---|---|
| Lyd (`gdco`) | All nettleser-/OS-talesyntese er fjernet. Manglende glose-/quizopptak vises som utilgjengelig. Eksisterende opptak beholdes. | 12 no-TTS-tester: tilgjengelig tale-API brukes ikke; manglende kobling, 404, dekodingsfeil, avbrutt avspilling og offline-feil. 32 separate diktat-/lytte-/offline-/oppdateringstester besto. |
| Brainmap (`x7ou`) | Manglende A0-ruter bruker faktiske ferdighetsmerkede oppgaver. Unos/unas åpner publisert leksjon, også fra neste-steg-lenken. -e-adjektiver er klare; generell adjektivøving bruker de to relevante delferdighetene. | 62 Brainmap-/grammatikk-/mønster-/verbtester besto. Inkluderer kataloginvariant for alle ferdige ruter og 22 tastatur-/øvings-/progresjonsforløp ved 1280 og 390 px. |
| Ærlig ferdighetsstatus | Modalverb med infinitiv og grunnleggende preposisjoner er planlagt i Brainmap fordi de mangler målrettet ferdighetsprogresjon. Eksisterende verbøving og Prepo Invaders er ikke fjernet. | 64 ferdigheter: 37 klare, 27 planlagte. Ingen klar ferdighet har «kommer snart»-rute. |
| Innholdskontroll (`do6v`) | ñ-kontrollen bruker en avgrenset ordliste med norsk betydningskontekst. Korpuskonsistens skilles fra faglig kontroll. | Fem nye Node-tester besto, inkludert faktisk CLI-mutasjon med el nino/espanol, korrekte NFC/NFD-former, 16 mutasjonseksempler og gyldige n-ord. Ingen elevfasit er endret. |
| Offline-lyd (`85ni`, funnet under `w7a`) | Anonym CORS på alle tre HTTP-lydkontroller; direkte file://-avspilling beholdes. | Attributtregresjon rød før retting. 60/60 gjentatte kontroller etter retting, inkludert 40 nedlasting/omlasting/avspillingsforløp for alle fem historier med stengt server, med og uten nettleserens offline-emulering. |

Testene ble først kjørt røde for de bekreftede feilene, deretter grønne etter retting. En ny test fant også at neste-steg-lenken ikke kunne åpne leksjonsbasert øving; dette ble rettet og verifisert.

## Samlet kontroll

| Kontroll | Resultat |
|---|---|
| `npm run build:app` | Bestått, bygg `9028eaf8e4ba8273` |
| Full lokal nettlesermatrise, én worker | 446/446 bestått, 1,7 minutter, endelig bygg |
| `npm run test:all`, to workere, endelig bygg | 446/446 nettlesertester bestått, 58,8 sekunder |
| Node-tester i siste `test:all` | 25/25 bestått |
| Innhold/katalog | 16 beskyttede rettelser; 13 mekaniske og 3 korpuskontroller; 8 publiserte leksjoner; 12 diagnoseoppgaver |
| Innholdstall | 522 gloser, 135 grammatikkoppgaver fordelt på 10 temaer, 34 verb, 28 setningspuslespill |

Den komplette matrisen bruker samme lokale spesifikasjoner som `scripts/test-browser.mjs`. De tre bevisopptakene/offentlige deploy-probene `model-student-video-audit.spec.js`, `qa-full-journey-audit.spec.js` og `qa-live-deploy-probe.spec.js` er bevisst utelatt, som i ordinær `test:all`. Ingen av de lokale regresjonene er utelatt.

Reproduksjon av én-worker-kjøringen (runneren har ellers to workere hardkodet):

```sh
node --input-type=module -e '
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
const excluded = new Set(["model-student-video-audit.spec.js", "qa-full-journey-audit.spec.js", "qa-live-deploy-probe.spec.js"]);
const specs = readdirSync("tests").filter(name => name.endsWith(".spec.js") && !excluded.has(name)).sort().map(name => "tests/" + name);
const result = spawnSync(process.execPath, ["node_modules/@playwright/test/cli.js", "test", ...specs, "--browser", "chromium", "--workers=1", "--reporter=line"], { stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
'
```

Matrisen omfatter blant annet:

- Ny nettleserprofil, diagnose, faktisk nedlastet fremgangsfil og gjenoppretting gjennom filimport.
- Bakoverkompatibilitet, gjentatt import, skadet lagring, reset og lokale tilbakemeldinger.
- Mobilbredder, tastatur, dialoger, synlig fokus og redusert bevegelse.
- Manglende lyd, gjentatt avspilling, eksplisitt nedlasting av alle fem lyttehistorier, omlasting uten nett og avspilling med byteområder.
- Oppgradering av brukt profil/service worker uten å miste svar eller nedlastet lyd.

Agenten inspiserte også de genererte skjermbildene `output/audio-policy/missing-recording-390.png`, `missing-recording-1280.png`, `output/listening-release/error-390.png` og `preview-1280.png`. Meldinger og kontroller er lesbare; feiltilstanden sperrer lydavhengig start. Dette er visuell nettleserkontroll, ikke fysisk mobil- eller høyttalertest.

## Forbehold og gjenstående menneskelig kontroll

En tidlig kombinert bygg-/testkommando traff Chromium-feilen `bootstrap_check_in ... Permission denied (1100)`; et forsøk med miljøvariabel for JSON-rapport traff `listen EPERM`. Direkte fokuserte kjøringer og de komplette kjøringene ovenfor startet normalt. Miljøfeilene ble ikke behandlet som appfeil.

Historikk: mellombygget `d80e131cf44ccc54` besto 444 nettlesertester og 25 Node-tester. Bygget `4b077c84880e5a27` besto 444/444 med én worker, men feilet med 443/444 i to-worker-kjøringen. Denne reelle offline-feilen ble ikke bortforklart med en grønn separat test: den feilet 6/20 og 4/10 repetisjoner med nettleser offline, samt 2/20 med bare serveren frakoblet. Instrumentering viste komplette cachede filer og `FFmpegDemuxer: data source error` ved gjenopptatte byteområder. HTTP-lyden manglet CORS-innstillingen som [Chromes veiledning for cachet media](https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video/) krever også for same-origin-filer. Rettelsen bruker dette på lytte-, diktat- og segmentavspilling uten nye biblioteker. 60/60 gjentatte kontroller besto etterpå; fullmatrisens sluttresultater står ovenfor. Ingen vilkårlige ventinger eller automatiske test-retries er innført.

`4or0` forblir åpen: spansklærer/produkteier må kontrollere alle fem lyttehistorier og fem diktater mot manus, tempo, uttale og elevnivå på skolens faktiske utstyr. `ee0` forblir åpen: faglig sluttkontroll, moderert elevprøve og oppfølging over tid. Tidligere godkjenning av ordliste eller positiv lytting til to opptak er ikke en full godkjenning av disse punktene.

Ingen Firefox-/WebKit-matrise, fysisk enhetstest, aktuell ekstern CI-kjøring eller offentlig deploy er bekreftet i denne leveransen. Den lokale tekniske porten må ikke omtales som bevis for universell enhetsstøtte, læringseffekt eller full A0–A1-dekning.

## Git og levering

Ingen commit, push eller publisering er utført. Eksisterende arbeid er bevart. De to selskaps-PDF-ene og tre uvedkommende Amex-filene er fortsatt utenfor indeksen. Indeksen inneholder eldre staged versjoner enn arbeidskopien; en senere commit må bruke de verifiserte arbeidsfilene og fortsatt utelate disse private filene. To tidligere staged planfiler har allerede rettet sluttblanklinje i arbeidskopien, men må stages på nytt før staged whitespace-kontroll blir grønn.
