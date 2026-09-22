# Release-audit: lytteforståelse og diktat

Dato: 15. september 2026. Beads: `spansk-ungdomsskole-paas`. Lærerkontroll før elevpilot: `spansk-ungdomsskole-4or0`.

**Gjeldende status 18. september 2026:** Nye MP3-opptak er koblet til presensmanusene for Inés og Diego; alle fem lyttehistorier er teknisk spillbare. Nedlasting/offline-avspilling er verifisert etter retting av en CORS-feil. Se [gjeldende releaseverifikasjon](../../../docs/release-verification-2026-09-18.md). Lærerkontroll av alle opptak, manus, nivå og skoleutstyr (`4or0`) er fortsatt åpen; dette er ikke en publiseringsmelding.

**Historisk endringsnotat fra 15. september:** Etter brukerens krav ble Inés og Diego omskrevet til presens i `spansk-ungdomsskole-0t1l`. Se [nye lokale manus](../../../LYTTEHISTORIER-PRESENS.md). På dette tidspunktet ventet de to historiene på ny lyd og kunne ikke startes. Rapporten nedenfor dokumenterer den enda tidligere release-auditen; dens opplysninger om fortidsmanus, lydvarigheter og samsvar med Google-dokumentet gjelder versjonen før denne endringen. Testtallene er historiske, ikke dagens releasebevis.

## Konklusjon og avgrensning

De dokumenterte tekniske feilene er rettet lokalt. Alle påkrevde kontroller består, inkludert 20 Node-tester og 409 nettlesertester. Ingen publisering eller commit inngår. Eksisterende lokale endringer er bevart. Release-ferdigheten ble brukt til å prioritere ferske bygg- og testkontroller før overlevering; Google Drive-ferdigheten ble brukt til å finne og lese originalmanusene.

Lydkoblinger, nettleserens dekoding/avspilling og offline-bruk er kontrollert. Opptakene er **ikke gjennomlyttet og sammenlignet ord for ord av agenten**. Uttale, lydkvalitet og egnethet for A0–A1 er derfor ikke godkjent. Lærerkontrollen er en betingelse før elevpilot, særlig for Inés og Diego. Ingen lydfil eller spansk manus er endret.

## Dokumenterte rettinger

- Lyttehistoriene manglet den dokumenterte nedlastingsknappen. Hver historie kan nå lastes ned separat til eksisterende lokal lydcache; en ufullført nedlasting gir feilmelding. Last inn appen og last ned på nett før offline-bruk.
- Diktatstart lot lytteoversikten stå åpen. Aktivitetene kan nå ikke åpnes oppå hverandre. Den gamle lyttefunksjonen og dens tre spørsmål basert på Ana-diktatet er fjernet. Diktatets manus, lydkoblinger og progresjonsformat er bevart.
- En `play`-hendelse kunne aktivere knappen før lyden var klar. Startknappen krever nå klar lyd og faktisk startet avspilling (`playing`). Lydfeil nullstiller sperren og viser status; nytt forsøk krever ny avspilling. Dette retter også kappløpet når eleven trykker spill av før metadata er lastet.
- Riktig alternativ sto først i alle 15 spørsmål. Alternativene blandes ved visning; vurderingen følger svar-ID.
- Sevilla manglet varighetsmetadata og ble vist som omtrent null sekunder. Verdien er nå 68,14 sekunder, målt fra eksisterende fil.
- Diegos introduksjon røpet første fasit med «ryddedag». Den er nå nøytral. Mateos introduksjon påsto at de prøvde å rekke bussen, mens manuset beskriver venting. «Ascensoren» og «Instituttet» i forklaringene er erstattet med «Heisen» og «Skolen».
- README oppgir nå riktige byer, varigheter, foreløpige nivåmerker og faktisk avspillings-/offline-flyt.

## Manus og fasit

Alle fem spanske manus og norske oversettelser ble sammenholdt med [Google-dokumentet «Lytteforståelse historier»](https://docs.google.com/document/d/1jwZv-8M9KZvpQoa9G7btCIr8Avli1xKHqhc8LgJsWHk/edit), lest 15. september 2026. Tekstene samsvarer. Tabellen er en tekstlig innholdskontroll, ikke en transkripsjon av lydfilene.

| Historie | Fasit og støtte i manuset | Distraktorer og forbehold |
| --- | --- | --- |
| Leo / Sevilla | Park, Marta, fotball og is; Marta har gul ball; sjokoladeis før hjemturen. | Alternative dagsforløp motsies av teksten. Ris/salat og tegneserie forekommer senere og skiller rekkefølge fra gjenkjente ord. Alle tre forklaringer støtter fasiten. |
| Carmen / Madrid | Klassen (`con mi clase`); en mann viser vei (`Preguntamos a un señor`); fotoutstilling (`una exposición de fotos`). | Familie/lag/naboer og andre utstillinger støttes ikke av manuset. Læreren forekommer, men gir tid til besøket, ikke veibeskrivelsen. |
| Mateo / Puebla | Gave til bestemor; delt glass appelsinjuice; buss nummer tolv. | Den første gule bussen avvises eksplisitt. De kjøper ikke de andre foreslåtte varene mens de venter. |
| Inés / Valparaíso | Heisen er stengt for reparasjon; blå katt med sykkel; hun lar ikke den tapte bussen ødelegge opplevelsen (`no me importó`). | Ingen støtte for karttap, pengemangel eller regn. Sluttspørsmålet krever tolkning av holdning. Det er tydelig at hun bestemmer seg for å gå; ankomst til havnen fortelles ikke uttrykkelig. |
| Diego / Cartagena | Skolen arrangerer strandrydding; skilpadder kan forveksle plast med mat; han kommer hjem trøtt, men stolt. | Bading, fotball og fiske er ikke formålet. Sand/glass/frukt finnes i teksten, men er ikke det mannen omtaler som matfare. |

Ingen dokumentert feil i de 15 fasit-ID-ene ble funnet. Ingen alternativ ble vurdert som en annen like godt tekststøttet fasit. Distraktorenes vanskelighetsgrad må fortsatt prøves med elever; noen kan utelukkes ut fra situasjonen alene.

## Lydfiler og foreløpig nivåvurdering

| Historie / merke | Nøyaktig fil under `audio/lyttehistorier/` | Målt tid | Manusord | Beregnet ord/min |
| --- | --- | ---: | ---: | ---: |
| Leo / A1 | `Leo-Sevilla.wav` | 68,1375 s | 151 | 133 |
| Carmen / A0 | `Hola soy Carmen .wav` | 35,6 s | 82 | 138 |
| Mateo / A0 | `Me llamo Mateo y viv.wav` | 38,85 s | 97 | 150 |
| Inés / A1 | `Hola soy Inés y vivo.wav` | 46,275 s | 125 | 162 |
| Diego / A1 | `Hola me llamo Diego .wav` | 48,2375 s | 121 | 151 |

Varighet er målt med ffprobe og kontrollert mot nettleserens metadata. Ord/min er antall mellomromsdelte manusord delt på hele filvarigheten, inklusive pauser. Dette er ikke målt taletempo fra en verifisert transkripsjon. Alle fem aktive lyttefiler har ulike SHA-256-hasher, og ingen er identisk med noen full- eller segmentfil brukt i diktat. Filstiene, inkludert mellomrom og Inés-aksenten, er testet over HTTP og offline under en undermappe som på GitHub Pages. Fire andre eksisterende WAV-filer i lyttemappen er ikke aktive katalogkilder og er bevart.

Tekstene er sammenhengende og aldersrelevante, men nivået er en reell pilotrisiko. Carmen er kortest, men har blant annet `no encuentra`, `señala` og `exposición`; Mateo har `mientras`, `para compartir` og `tiene que ser ... porque`. Inés kombinerer pretérito og imperfecto; Diego har tilsvarende fortidsformer og `orgulloso de haber ayudado`. Inés-setningen `salí de la biblioteca porque tenía que devolver un libro` har dessuten uklar årsak/retning. Den er beholdt fordi den også står i originalmanuset og kan være innlest.

[Europarådets A1-beskrivelse for lytting](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors-search) forutsetter svært langsom, tydelig tale med pauser. Min vurdering er derfor at nivåmerkene og særlig Inés/Diego ikke kan godkjennes ut fra lengde alene. Ingen ny CEFR-klassifisering er satt. Læreren må avgjøre hvilke historier som er egnet for aktuell elevgruppe, og om noen skal holdes utenfor første pilot.

## Flyt, personvern og gjenoppretting

Spansk tekst og norsk oversettelse finnes ikke i øvingsvisningen før alle tre svar er levert. Etterpå ligger de bak lukket tekststøtte. En feilbesvart oppgave gir sin egen forklaring, som tilsiktet. Appen krever startet avspilling, men måler ikke at eleven har hørt hele historien; instruksjonen sier å lytte ferdig. Ny lytting er mulig før spørsmålsrunden. Avspilleren vises ikke under spørsmålene.

Alle fem historier er spilt fra nedlastet cache etter offline-omlasting; byteområdeforespørsler får 206-svar. Manglende lyd sperrer start og har en fungerende prøve-igjen-flyt. Feilet nedlasting gir ingen klar-bekreftelse. Nettleseren kan senere slette cache; lærer må teste offline på den faktiske enheten før timen.

Regresjonene kontrollerer at alle lytteøvelsene samlet ikke endrer localStorage eller diktateksport, og at observerte sideforespørsler bare er GET uten innhold til lokal app-/lydserver. Koden bruker ingen mikrofon eller elevopptak i denne flyten. Ingen ny elevlagring, konto, ekstern tjeneste eller dataoverføring er innført. Eksisterende diktatkontroll tester fullføring over to dager, eksport og gjentatt import uten lagring av elevtekst.

## Verifikasjon

- Utgangspunkt: `tests/dictation.spec.js`: 18 bestått. Nye regresjoner før retting: 6 feilet, 1 bestått, med konkrete feil som beskrevet ovenfor.
- `npm run build:app`: bestått, bygg `fc82466826856850`.
- `npx playwright test tests/dictation.spec.js --browser chromium --workers=1`: 18 bestått (9,3 s).
- `npx playwright test tests/listening-release.spec.js tests/report-dictation.spec.js --browser chromium --workers=1`: 13 bestått (20,7 s), før to ekstra viewporttester.
- `npx playwright test tests/listening-release.spec.js --browser chromium --workers=1`: 10 bestått (8,5 s), inklusive 390 og 1280 px, tastatur, lydfeil og tekststøtte.
- Skjermbilder av forhåndsvisning, feil, svar og resultat ved begge bredder er visuelt inspisert i `output/listening-release/`. Ingen horisontal overflyt i den testede flyten. Fysisk mobil, Safari og skolelyd er ikke kontrollert.
- `npm run test:all`: exit 0. Innholds-, grammatikk-, diagnose-, læringskatalog-, Tailwind- og offline-byggkontroller bestått; 20 Node-tester bestått, 0 feil; 409 Chromium-tester med to workere bestått (59,0 s), 0 feil. De tre separate opt-in-opptakene/deploy-probene inngår ikke i kommandoen og er ikke kjørt.
- SHA-256-kontroll: alle 83 eksisterende filer under `audio/` er uendret fra sesjonsstart. Diktatkatalogens øvrige data er identiske med utgangspunktet etter at de gamle lytteoppgavene er tatt ut.
- `git diff --check`: exit 0, ingen feil.

## Lærerens godkjenning før pilot

Gjennomlytt alle fem aktive lyttefiler og fem diktater med aktuell høyttaler/hodetelefon og mobil. Kontroller ordrett samsvar med manus, begynnelse/slutt, pauser, lydstyrke, støy og uttale. Gjennomfør spørsmålene uten tekst først og vurder om distraktorene skiller forståelse fra gjetting. Vurder særskilt Carmen/Mateos A0-merke, Inés/Diegos fortidsspråk og Inés-setningen om biblioteket. Prøv en full offline-runde og eksport/import på enheten som skal brukes. Før resultat og eventuelle begrensninger i Beads `spansk-ungdomsskole-4or0` før elevbruk.
