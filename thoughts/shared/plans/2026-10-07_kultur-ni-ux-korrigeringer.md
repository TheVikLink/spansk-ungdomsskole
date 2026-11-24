# Implementeringsplan: ni korrigeringer i kulturdelen

Dato: 7. oktober 2026. Status: implementeringsklar plan; produktendringene er ikke utført.

Målet er å rette de ni observerte problemene slik at læreren raskt kan velge og klargjøre et opplegg, og eleven kan lese, slå opp ord, svare og gå videre til riktig glosesett uten å miste sammenhengen.

Grunnlag: [design- og brukervennlighetsgjennomgangen](/Users/olehenrikvik/spansk-ungdomsskole/docs/reviews/2026-10-07_kultur-design-og-brukervennlighet.md). Nummereringen nedenfor følger rapportens ni funn. Rapporten inneholder førbilder og reproduksjon av svarfeilen.

## 1. Rammer og beslutninger

- Gjør endringene i felles generator og delte ressurser. Alle sju opplegg og begge sideroller skal fungere etterpå, selv om den grundigste visuelle kontrollen gjelder Peru og julepakken.
- Behold tekstene, spørsmålene, fasiten, de ti glosene per pakke, 45-minuttersplanene og eksisterende ordoppslag. Ikke forkort faginnhold for å få kortere sider.
- Behold dagens rolige farger, kontrast, fotografier, bildeutsnitt og 44 × 44 px ordpunkter. Julebildene er fortsatt KI-genererte og skal fortsatt merkes som det. Bildeutskifting er ikke del av disse ni korrigeringene.
- Bruk vanlige ankerlenker og native `details`/`summary`. Ingen ny avhengighet, router, egen gloseøvelse, scrollspy eller fastlåst mobilmeny.
- Leseteksten får én sentrert kolonne på maksimalt `70ch`. Støttefotografier plasseres mellom hele avsnitt, i den rekkefølgen data allerede angir. Ingen tekstflyt rundt flytende fotografier.
- Nettavslutningen leder først til eksisterende Gloser. Ordtabellen er lukket ved første visning. Papirark og nettleserutskrift beholder papirinstruksjon og full ordtabell.
- Førstegangsoppsettet viser kontekst fra gloselenken, men oppretter ikke ordkort eller lagrer noe ekstra før eleven starter som i dag.
- PDF-er får synlige, klikkbare adresser. QR-koder inngår ikke i denne rettingen. Nettstedets basisadresse blir et eksplisitt byggeargument; lokal verifisering krever ingen publisering.
- Ingen endring av innlogging, Feide, elevdata, eksport/import-format, repetisjonsalgoritme, lyd eller kanoniske ordreferanser. Ingen innsending av elevsvar.
- Ingen commit, push, publisering eller endring av delingsinnstillinger uten et eget oppdrag om dette.

Denne planen erstatter tidligere krav om full lesebredde og høyreflytende støttefoto i akkurat denne korrigeringen. Gamle planer og den historiske auditrapporten skal ikke omskrives. Oppdater den gjeldende kulturmalen når den nye løsningen er verifisert.

## 2. Arbeidssted, kilder og genererte filer

Arbeidskatalog: `/Users/olehenrikvik/spansk-ungdomsskole`.

Arbeidstreet inneholder mange eksisterende endringer og uregistrerte kulturfiler. Les `git status` før arbeidet. Ikke bruk `reset`, `clean`, masse-stash eller et nytt checkout fra ren `main` som mister disse filene. Ved implementering: bruk en egnet eksisterende `codex/`-gren, eller opprett `codex/kultur-ni-ux-korrigeringer` fra dagens checkout når grenstatus er kontrollert. Behold det lokale arbeidet; ikke flytt eller ta eierskap til andre endringer. Ikke opprett en ny gren hvis oppdraget allerede foregår på riktig implementeringsgren.

| Fil | Rolle og planlagt arbeid |
|---|---|
| [data/culture-packages.json](/Users/olehenrikvik/spansk-ungdomsskole/data/culture-packages.json) | Autoritative kulturdata. Bare to additive metadatafelt trengs: `catalogPrerequisites` på pakkene og `pairTask.imageCountryId` i Peru. |
| [scripts/build-culture-preview.mjs](/Users/olehenrikvik/spansk-ungdomsskole/scripts/build-culture-preview.mjs) | Validering, katalog, elevside, lærerside, kreditering og generert glosesettmetadata. De fleste HTML-endringer gjøres her. |
| [docs/kultur/jul-spania-chile/preview.js](/Users/olehenrikvik/spansk-ungdomsskole/docs/kultur/jul-spania-chile/preview.js) | **Håndskrevet, delt kilde**, til tross for plasseringen. Nullstilling av svarrespons. Bevar ordoppslagenes eksisterende hendelser. |
| [docs/kultur/jul-spania-chile/preview.css](/Users/olehenrikvik/spansk-ungdomsskole/docs/kultur/jul-spania-chile/preview.css) | **Håndskrevet, delt kilde** for alle kultursider. Lesebredde, navigasjon, kortmetadata, kreditering og utskrift. |
| [index.html](/Users/olehenrikvik/spansk-ungdomsskole/index.html) | Hovedappen: velkomstkontekst og retur fra Gloser. Ikke håndrediger blokken mellom `BEGIN GENERATED CULTURE VOCABULARY` og `END GENERATED CULTURE VOCABULARY`. |
| [src/styles/tailwind.css](/Users/olehenrikvik/spansk-ungdomsskole/src/styles/tailwind.css) | Eventuell avgrenset stil for velkomstkonteksten. Ikke skriv direkte i `dist/tailwind.css`. |
| [scripts/build-culture-pdfs.py](/Users/olehenrikvik/spansk-ungdomsskole/scripts/build-culture-pdfs.py) | Felles ReportLab-bygger for elev- og lærerark. URL-argument, lenkeblokk og valgbart utdataområde. |
| [tests/culture-packages.test.mjs](/Users/olehenrikvik/spansk-ungdomsskole/tests/culture-packages.test.mjs) | Validering, maler, bevart innhold og genererte filer. |
| [tests/culture-christmas-flow.spec.js](/Users/olehenrikvik/spansk-ungdomsskole/tests/culture-christmas-flow.spec.js) | Juleflyt, svarrespons, lesebredde, tastatur, mobil, utskrift og reservevisninger. |
| [tests/culture-mundo-flow.spec.js](/Users/olehenrikvik/spansk-ungdomsskole/tests/culture-mundo-flow.spec.js) | Katalog, seks land, foto, mobil, spørsmål, Gloser og returlenker. |
| [tests/culture-vocabulary.spec.js](/Users/olehenrikvik/spansk-ungdomsskole/tests/culture-vocabulary.spec.js) | Velkomst, dyplenker, valgfritt sett, gjentakelse og eksport/import. |
| `tests/culture-ux.spec.js` — ny fil i arbeidskatalogens `tests/` | Samlede nye tester for snarveier, merke-/kataloglenker, katalogmetadata og lukket ordtabell. Bruk eksisterende `startStaticAppServer`. |
| `tests/test_culture_pdf_links.py` — ny fil i arbeidskatalogens `tests/` | Egne PDF-tester med standardbibliotekets `unittest`, eksisterende ReportLab og `pypdf`. Kjøres eksplisitt; ikke legg Python-krav inn i vanlig npm-testløype. |
| [docs/kultur/mal-for-kulturopplegg.md](/Users/olehenrikvik/spansk-ungdomsskole/docs/kultur/mal-for-kulturopplegg.md) | Oppdater gjeldende regler om lesebredde, bildeplassering, navigasjon og nett/papir. Bevar korrekt skille mellom ekte foto og juleillustrasjoner. |
| [docs/kultur/mundo-am/README.md](/Users/olehenrikvik/spansk-ungdomsskole/docs/kultur/mundo-am/README.md) og [julepakkens README](/Users/olehenrikvik/spansk-ungdomsskole/docs/kultur/jul-spania-chile/README.md) | Oppdater aktuelle byggekommandoer og kort beskrivelse av den nye flyten. Ikke gjør en generell dokumentasjonsopprydding. |

Genererte leveranser: `docs/kultur/index.html`, `docs/kultur/<pakke-id>/index.html`, `docs/kultur/<pakke-id>/laerer.html`, kulturordblokken i hovedappen, `dist/tailwind.css`, `sw.js` og PDF-er i `output/pdf/`. HTML bygges med `npm run sync:culture`; full app med `npm run build:app`. PDF-er bygges separat. Generatoren versjonerer kulturens CSS/JS-lenker med innholdshash; ikke sett versjonsstrengen manuelt.

## 3. Beads og utførelsesrekkefølge

Planoppdraget er `spansk-ungdomsskole-awzr`. Implementeringsarbeidet bruker de eksisterende sakene:

- `spansk-ungdomsskole-jx33`: funn 1, svarfeilen.
- `spansk-ungdomsskole-o6gw`: funn 2–9, øvrige UX-korrigeringer.

Den separate publiseringsavhengigheten i funn 8 følges opp i eksisterende `spansk-ungdomsskole-tc0b.3`. Den saken skal ikke lukkes bare fordi denne lokale UX-implementeringen er ferdig.

Claim den relevante saken før kodearbeid. Før fremdrift og blokkeringer i Beads, ikke som en ny levende oppgaveliste i denne planen. Hold sakene åpne til arbeidet de dekker er verifisert.

| Rekkefølge | Funn | Hvorfor nå | Arbeidsmengde |
|---|---|---|---|
| 1 | 1 — svarrespons | Avgrenset feil med høy pedagogisk konsekvens. | Liten |
| 2 | 2 — snarveier | Etablerer ankermål som også brukes av retur og velkomst. | Middels |
| 3 | 3 — lesebredde | Den tredje hovedprioriteringen fra gjennomgangen. | Middels |
| 4 | 7 — merke og retur | Bruker de avklarte lesemålene; legger metadata til velkomst. | Liten |
| 5 | 4 — katalog | Avgrenset valgstøtte for læreren. | Liten |
| 6 | 5 — digital ordavslutning | Gjør inngangen til Gloser tydelig. | Liten |
| 7 | 6 — velkomstkontekst | Bruker glosesettmetadata fra funn 7. | Liten–middels |
| 8 | 9 — fotokreditering | Kan verifiseres sammen med ferdig lesebredde og utskrift. | Liten |
| 9 | 8 — PDF-lenker | Bygg PDF-ene når innhold og returmål er stabile. | Middels inkl. lenke- og utskriftskontroll |

Gjør én korrigering ferdig om gangen. Skriv først en test som viser den relevante feilen eller det manglende brukerforløpet. Ikke skriv tester for rent redaksjonelle småendringer uten selvstendig atferd. Kjør det nærmeste testutvalget etter hver korrigering; samlet verifisering gjøres til slutt.

## 4. Verifisert utgangspunkt og miljø

Under planleggingen, uten produktendringer, er følgende kjørt med Node `v22.23.3`:

- `npm run check:culture`: bestod.
- `node --test tests/culture-packages.test.mjs`: **24/24 bestod**.
- De tre eksisterende kulturspesifikasjonene i Chromium: **43/43 bestod** på 38,2 sekunder.

Første nettleserkjøring ble stanset av macOS/sandkassen før testene nådde sidene: `MachPortRendezvousServer ... Permission denied`. Kjøringen bestod etter godkjent kjøring med nødvendige prosessrettigheter. Dette er et miljøproblem, ikke en feil som skal «rettes» i produktet. Ikke installer en annen nettleser eller svekk tester på grunn av denne meldingen.

`package.json` krever Node `>=22.12 <23`. Standard `node` i dette miljøet ga v20.12.0; katalogen kalt `/opt/homebrew/opt/node@22/bin` ga faktisk v25.8.2. Kontroller versjonen, ikke bare katalognavnet. Denne eksisterende binæren er verifisert:

```bash
cd /Users/olehenrikvik/spansk-ungdomsskole
export PATH="/private/tmp/spansk-culture-node22/node-v22.23.3-darwin-arm64/bin:$PATH"
node --version
bd --no-daemon ready --json
bd --no-daemon list --status=in_progress --json
git log --oneline -5
git status --short
```

Temp-katalogen kan være borte i en senere økt. Finn da en tilgjengelig Node 22 som oppfyller motorfeltet før kjøring. Ikke endre motorfelt, låsefil eller avhengigheter for å passe en tilfeldig lokal runtime.

Les `AGENTS.md` og relevante kildefunksjoner før første endring. Kontroller grunnstatus på nytt hvis arbeidskopien er endret siden planen ble skrevet.

## 5. Detaljert gjennomføring per funn

### Funn 1: nullstill svarrespons ved nytt radiovalg

**Filer:** delt `preview.js`; test av svarflyt i jule- og Mundo-spesifikasjonene.

**Implementer slik:**

1. Finn løkken `document.querySelectorAll('form.question')` som registrerer `submit` og `data-show-explanation`.
2. Legg til én `change`-lytter per skjema. Reager bare på et radiofelt som tilhører dette skjemaet. Bruk `change`, slik at både pek, trykk og tastaturets piltaster omfattes.
3. Nullstill tilstanden: `feedback.textContent = ''`, fjern `correct`-klassen, og sett `hint.hidden`, `explanation.hidden` og `reveal.hidden` til `true`.
4. Behold valgt radioknapp og tastaturfokus. Ikke sjekk svaret automatisk, tøm hele skjemaet eller endre andre spørsmål.
5. Behold dagens tomt/feil/riktig-respons når eleven deretter trykker «Sjekk svaret». Behold `onsubmit="return false"` som vern mot innsending når skript mangler.

**Test før retting:** Legg til `changing a checked answer clears stale feedback` for både julepakken og Peru. Velg riktig → sjekk → velg feil → forvent tom melding, ingen grønn tilstand, skjult hint/forklaring/avsløringsknapp → sjekk igjen → forvent feilrespons. Denne skal feile på dagens kode.

**Supplerende aksept:** Feil → sjekk → «Se forklaring» → nytt valg skjuler også den avslørte forklaringen. Tomt svar → melding → første valg fjerner den gamle meldingen. Et annet besvart skjema beholder sin respons. Minst én variant bytter valg med tastaturet.

**Kjør:** `npm run sync:culture`, deretter kommando B i testdelen med `--grep 'feedback|questions|changing a checked answer'`. Ingen lagring, nettverkskall eller ny fasitlogikk skal til.

### Funn 2: knytt tekst, spørsmål, samtale, bilde og gloser sammen

**Filer:** `build-culture-preview.mjs`, `preview.css`, kulturdata og nye `culture-ux.spec.js`.

**Faste mål:** Behold eksisterende `#understanding`, `#word-recall` og landseksjonenes ID-er for gamle lenker. Gi måloverskriftene `tabindex="-1"`, slik at lenker kan flytte fokus uten ekstra tabulatorstopp.

| Formål | Mål |
|---|---|
| Første lesedel / «Start lesingen» / «Les» | Eksisterende `#<første-country.id>-title`: Peru `#peru-title`, julepakken `#espana-title`. |
| Andre juletekst | `#chile-title`. |
| Spørsmål | Ny `id="understanding-title"` på seksjonens `h2`. |
| Samtale | Ny `id="comparison-title"` på «Sammenlign og spør». |
| Gloser | Ny `id="word-recall-title"` på ordavslutningens `h2`. |
| Peru-fotografiet | Ny `id="peru-picture"`, `tabindex="-1"` på hovedfiguren med ordpunkter. Generer generelt som `<country.id>-picture`. |

**Implementer i denne rekkefølgen:**

1. Lag en liten gjenbrukbar renderer for fire snarveier: «Les», «Spørsmål», «Samtale», «Gloser». Bruk `nav` med `aria-label="I denne økten"` og klassen `lesson-contents`.
2. Plasser menyen etter elevsidens hovedoverskrift/ressurslenker, før introduksjon og kart. Render den også én gang etter hver landsseksjon, slik at eleven kan gå rett fra lesing tilbake til oppgavene. Ikke legg den på lærersiden eller etter hvert avsnitt.
3. Menyen ligger i normal dokumentflyt. Bruk `display:flex; flex-wrap:wrap`, liten avstand, minimum 44 px høye lenker og dagens kant-/aksentfarge. Ingen horisontal scrolling. Den skal ikke dekke ordoppslag eller tekst ved zoom.
4. På elevsidens `lesson-links`: erstatt «Til oppgavene» med primærlenken **«Start lesingen»** til første lesemål. Behold lærerlenke og PDF-inngang. Menylenken «Spørsmål» overtar snarveien til oppgavene.
5. For tolandspakker: legg en kort rad «Lesetekster: Spania · Chile» ved den første menyen. Gjenta disse to tekstlenkene ved sammenligningsoppgaven. Ingen nedtrekksmeny er nødvendig.
6. Legg en lokal lenke etter responsområdet i hvert spørsmål. Énlandspakke: «Tilbake til teksten». Julepakken: «Les Spania-teksten igjen» eller «Les Chile-teksten igjen». Finn land fra `question.countryId`, ikke fra spørsmålets nummer.
7. Legg `pairTask.imageCountryId: "peru"` bare i Peru-dataene. Valider at et oppgitt felt peker på et land i samme pakke. Når feltet finnes, vis **«Se bildet»** ved paroppgaven, til det landets hovedfigur. Ingen pakke-ID-spesialtilfelle i renderer.
8. Bruk vanlige fragmentlenker som virker også uten JavaScript. Kontroller faktisk fokus etter aktivering med tastatur. Dersom mål ikke får fokus i testnettleseren, legg til en liten, delegert fokusforbedring for disse egne snarveiene; behold native fragmentnavigasjon og ikke overstyr alle nettstedets lenker.
9. Skjul innholdsmenyer og lokale arbeidslenker ved utskrift. Behold den eksisterende `prefers-reduced-motion`-regelen og fokusringen.

**Aksept/test:** Ved 390 px kan eleven gå Start → spørsmål → riktig lands tekst → spørsmål → samtale → Peru-bildet → Gloser med lenker. Alle fragmentmål finnes nøyaktig én gang. Peru-lenken går til markedets hovedbilde, ikke støttefotoet. Ved tastatur er målet synlig, og neste Tab fortsetter i det aktuelle innholdet. Ingen overflyt ved 360, 390 eller 768 px. Uten JavaScript virker snarveiene fortsatt. Lærersiden beholder egen fasit og PDF-innganger.

**Testplassering:** Generatortesten validerer metadata/ankerreferanser for alle sju pakker. `culture-ux.spec.js` prøver faktisk klikk/tastatur og mobil for Peru og jul. Bruk `page.emulateMedia({ reducedMotion: 'reduce' })` i måletester for å unngå vilkårlige ventetider på jevn scrolling.

### Funn 3: stabil lesebredde og bilder mellom avsnittene

**Filer:** `preview.css`, eksisterende layouttester og kulturmalen til slutt.

**Implementer slik:**

1. Samle gjeldende `.reading`-regler, og erstatt fullbreddekravet med `width:100%; max-width:70ch; margin-inline:auto`. Behold 17 px skrift, 1,65 linjehøyde og 18 px avsnittsavstand.
2. Fjern den aktive høyreflyten: `.reading > .location-photo` skal ha `float:none`, `width:100%`, `max-width:100%` og `margin:24px auto`. Panoramaet trenger ikke en egen flyteoppførsel.
3. Behold støttebildets eksisterende `height:auto`, `max-width:100%` og `max-height:460px`, slik at portrettbilder ikke blir uforholdsmessig høye. Ikke tving et annet utsnitt med `object-fit:cover`.
4. Behold hovedbildet over teksten, eksisterende maksbreddene 660 px / 340 px for portrett og ordpunktenes koordinater. Ikke krymp alle bilder til tekstens maksbreddemål.
5. Behold `afterParagraph`-plasseringen og regelen som utelater hovedfotoet fra støttefotoene. Behold samtlige avsnitt ordrett og som hele `p`-elementer.
6. La lesekolonnen fylle tilgjengelig innvendig bredde på smal skjerm. Legg print-overstyring etter skjermregelen: leseteksten bruker utskriftsbredden uten en ny `70ch`-begrensning. Nettleserutskriftens eksisterende skjuling av støttefoto endres ikke her.
7. Erstatt berørte CSS-regler der de hører hjemme, fremfor å føye enda en motstridende regel nederst. Ikke rydd hele stilarket i samme endring.

**Testendring som er tilsiktet:** Juleprøven `both texts use the full width below their images without glossary controls` forventer i dag over 88 % av kortbredden. Bytt dette til et testnavn og en kontroll som beskriver avgrenset, sentrert lesebredde. Mundo-prøven `real location photos load locally with readable credits` forventer `float:right` på desktop; erstatt dette med kontroll av faktisk avsnittsplassering og ingen flyt.

**Aksept/test:** Ved 1280 og 1440 px er lesekolonnen maksimalt `70ch`, sentrert, og avsnittsbredden er den samme før og etter støttebildet. Mål `ch` med et midlertidig DOM-måleelement med samme font dersom en pikselgrense trengs; ikke anta at ett tegn er én fast pikselbredde. Tillat 1–2 px avrunding. Støttefotoets topp ligger etter forrige avsnitt og bunnen før neste. Ingen horisontal overflyt ved 390 og 768 px. Alle opprinnelige avsnitt finnes i samme rekkefølge. Ordoppslag og bildeord fungerer fortsatt.

`70ch` er en CSS-bredde, ikke en garanti for nøyaktig 70 bokstaver på hver linje i en proporsjonal font. Se også på faktisk tekstflyt i nettleseren. Ikke skriv en skjør test som krever nøyaktig samme linjebrudd på alle maskiner.

### Funn 4: gjør katalogen nyttig for lærerens valg

**Filer:** kulturdata, `validateCulturePackages`, `renderCultureCatalog`, `preview.css`, generatortester og `culture-ux.spec.js`.

**Ferdige tekster:**

- Introduksjon: **«Kulturopplegg med tekst, bilder, oppgaver og lærerveiledning. Velg et land eller et tema, og øv videre på ordene fra teksten.»**
- `catalogPrerequisites` for julepakken: **«Presens, familie, mat og enkle datoer»**.
- Samme felt for hver av de seks Mundo-pakkene: **«Enkle presenssetninger om personer, steder og aktiviteter»**.
- Arbeidsform på alle kort: **«Lesing og samtale i par»**.
- Utkastmerke: **«Arbeidsutkast · til lærervurdering»** når `pack.status === 'draft'`.

**Implementer slik:**

1. Legg til `catalogPrerequisites` som påkrevd, ikke-tom tekst på hver pakke. Behold de mer utfyllende `prerequisites` til læreren. Dette er additive forfattermetadata; ikke endre skjema- eller lagringsversjon.
2. Render status ved land/tid/tittel og to korte metadatalinjer under beskrivelsen: «Forkunnskaper: …» og «Arbeidsform: …». Bruk normal lesbar tekst, ikke bittesmå dekorative merker eller en ny fargekode.
3. Bruk eksisterende statusdata; ikke merk et utkast som godkjent. For en gyldig publisert testpakke utelates utkastmerket. Den eksisterende valideringen av publisert/godkjent innhold beholdes.
4. Behold dagens separate innganger til elevøkt og lærerveiledning, og rekkefølgen på pakkene.

**Aksept/test:** Alle sju kort gir læreren tid, konkrete forkunnskaper, arbeidsform og reell utkaststatus før åpning. Julepakken har sin egen forkunnskapstekst. Ingen hardkodet klassetrinnsetikett. Kortene passer 390 px og begge handlingslenkene er tydelige. Generatortest dekker manglende metadata og gyldig publisert testpakke. Ikke sett noen faktisk pakke til `published` for å teste dette.

### Funn 5: erstatt papirinstruksjonen på nett med aktiv gloseøving

**Filer:** `renderCulturePreview`, `preview.css`, `culture-ux.spec.js` og eksisterende utskriftstest.

**Skjermrekkefølge i `#word-recall`:**

1. Eksisterende overskrift, med målet `word-recall-title` fra funn 2.
2. Kort instruksjon: **«Øv på de ti ordene fra teksten. Prøv å huske svaret før du snur kortet.»**
3. Eksisterende primærlenke, for eksempel «Lær Peru-glosene» eller «Lær juleglosene», med uendret glosesettadresse.
4. Eksisterende informasjon om valgfritt sett og repetisjon.
5. Lukket `<details class="recall-words">` med `<summary>Se de ti ordene</summary>` og den eksisterende tabellen.

Den nye nettinstruksjonen kan ligge som én felles streng i generatoren; den trenger ikke et nytt felt per pakke. **Ikke endre `pack.recall.instruction`**: PDF-byggeren bruker dette som papirinstruksjon.

**Utskrift uten skjulte svar:** Lag to presentasjoner fra samme data/helper: skjerminnholdet i `.culture-screen-only`, og papirinstruksjon + full ordtabell i `.culture-print-only`. Skjul sistnevnte på skjerm, og bytt visningen i `@media print`. Skjul skjermens detaljer/knapp ved utskrift, slik at tabellen bare forekommer én gang. Ikke legg `hidden` på printinnholdet: `[hidden]{display:none!important}` vil ellers hindre printvisning. Dette skal fungere uten JavaScript og uten å åpne/lukke brukerens `details` automatisk.

**Aksept/test:** Knappen er synlig når eleven kommer til ordavslutningen; en tabell ligger ikke foran den. Tabellen er ikke synlig eller tastaturtilgjengelig før «Se de ti ordene» åpnes. Enter/Space åpner og lukker, og fokus blir på `summary`. Alle ti ord og begge kolonner vises ved åpning. Ved utskrift vises ti ord og papirinstruksjonen én gang, også med JavaScript deaktivert. Papir-PDF-ens dekk-/markeringsinstruksjoner beholdes. Ingen ny øvings- eller lagringslogikk.

### Funn 6: vis valgt opplegg i førstegangsoppsettet

**Avhengighet:** Funn 7s genererte `readingAnchor` og returbygger må finnes først.

**Filer:** `index.html`, eventuelt `src/styles/tailwind.css`, `culture-vocabulary.spec.js`.

**Plassering og tekst:** Legg en skjult kontekstseksjon `#cultureWelcomeContext` mellom den generelle velkomstteksten og navn/elevkode-feltet. Når en gyldig kulturlenke er åpnet, vis:

- **«Du skal øve på de 10 ordene fra «{pakkens tittel}».»** Antallet leses fra `set.words.length`, ikke fra en egen kopiert ordliste.
- **«Velg et kallenavn eller en elevkode. Profilen og fremgangen lagres i denne nettleseren. Du trenger ingen konto.»**
- Lenken **«Tilbake til teksten»**, til pakkens første lesemål som i funn 7.

Behold eksisterende «Start»-knapp, import av fremgang og navnevalidering. Behold også dagens generelle oppsett ved vanlig appbesøk uten kulturlenke.

**Implementer slik:**

1. Finn velkomstmarkeringen øverst, `showMainApp()`, `handleCultureVocabularyRoute()` og oppstarts-IIFE-en nederst. Les flyten før du kobler inn ny funksjon.
2. Lag `renderCultureWelcomeContext()` som bare leser `location.hash` og det allerede genererte `cultureVocabularySets`. Bruk samme ruteformat som i dag: `^#gloser/([a-z0-9-]+)$`, og verifiser med `Object.hasOwn(cultureVocabularySets, id)`.
3. Sett brukerrettet tekst med `textContent`, og sett returlenkens `href` fra validert settmetadata. Ikke legg rå hash inn i HTML. Ved ukjent eller manglende sett: tøm og skjul konteksten, og fjern gammel returlenke.
4. Kall funksjonen i oppstartens gren uten lagret navn. Utvid `hashchange` slik at synlig hovedapp fortsatt bruker dagens handler, mens synlig velkomst oppdaterer konteksten.
5. **Ikke kall** `init()`, `showMainApp()`, `startCultureVocabulary()`, `selectCultureCategory()`, `loadData()` eller `saveData()` for å vise konteksten. `selectCultureCategory()` oppretter og lagrer temakort; det skal fortsatt først skje i dagens faktiske oppstart.
6. Etter «Start» skal eksisterende `showMainApp()` → `handleCultureVocabularyRoute()` åpne settet én gang. Brukere med eksisterende lokal profil skal fortsatt hoppe over velkomsten.
7. Tilpass bare kontekstfeltets stil hvis nødvendig. Lange pakkeoverskrifter må brytes naturlig på 390 px; retur må være minst 44 px høy. Ingen generell ombygging av velkomstskjermen.

**Test først i ren nettleserkontekst:** Peru-lenke viser Peru-tittel, antall og forklaring før navn er fylt inn. Jul viser riktig tittel. Sammenlign lagringsnøkler/verdier før og etter at bare konteksten vises eller hash endres: ingen ny lagring. Ingen temakort opprettes ved denne presentasjonen.

**Øvrig aksept:** Hash Peru → jul før Start oppdaterer tekst/retur; hash fjernet eller `constructor`/ukjent ID skjuler gammel kontekst. Vanlig appbesøk viser ingen kontekst. Start med syntetisk kallenavn åpner de riktige ti ordene i begge retninger, uten duplikater. Ukjent sett beholder dagens forståelige feilmelding etter oppstart. Lagret profil, offline `file://`, avbrutt aktiv økt og eksport/import fortsetter å bestå.

### Funn 7: konsekvent produktmerke og retur til faktisk lesedel

**Filer:** `renderCultureCatalog`, `renderCulturePreview`, `preview.css`, generatorens `sets`-bygging, hovedappens `selectCultureCategory()` og berørte tester. Dagens returlenke bygges i denne funksjonens `context.innerHTML` for `#cultureVocabularyContext`; endre lenken uten å flytte eller endre kortoppretting/lagring i resten av funksjonen.

**Toppfelt:** Del dagens sammensatte merke i to søskenlenker; ikke nest lenker.

| Side | «Spansk på 1-2-3» | «Kultur» |
|---|---|---|
| Katalog | `../../index.html` | `index.html`, med `aria-current="page"`. |
| Elevside og lærerveiledning | `../../../index.html` | `../index.html`. |

Bruk en liten wrapper rundt produkt- og kulturlenken. Behold den rolige visuelle grupperingen, men gjør «Kultur» synlig som egen lenke og gi begge en tydelig fokusring og minst 44 px høy trefflate. Behold «Lærerveiledning»/«Elevøkten», utskrift og «Alle kulturopplegg»; ikke bland dette med annen menynomskriving.

**Retur fra Gloser:**

1. Utvid hvert genererte sett med `readingAnchor: "<første-country.id>-title"`. Eksempel: Peru `peru-title`, jul `espana-title`. Utled det fra kulturdataene; ikke ved å trimme pakke-ID eller lagre egne stedstabeller.
2. Lag en liten felles funksjon i hovedappen, for eksempel `getCultureReadingHref(set)`, som returnerer `docs/kultur/${set.id}/index.html#${set.readingAnchor}`. Kall den bare for et gyldig sett fra `cultureVocabularySets`. Funn 6 gjenbruker samme funksjon.
3. Bytt dagens mål `#word-recall` i «Tilbake til teksten». Behold `onclick="return leaveCultureVocabulary()"` eller tilsvarende funksjonelt vern.
4. Ikke endre hva aktiv økt betyr. Ved avbrutt bekreftelse blir URL, kø og gjeldende kort stående; ved godkjent avslutning navigeres det til lesemålet.
5. Behold relative lenker. En URL med rot `/index.html` vil ødelegge installasjon under underkatalog og lokal filbruk.

**Aksept/test:** Test merke- og kulturlenker på katalog, elevside og lærer med serverhjelperens `/classroom/`-prefiks. Alle går til riktig nivå. Klikk Gloser-retur både uten aktiv økt og med en aktiv økt: godta → riktig overskrift synlig; avbryt → samme kortkø og URL. Oppdater begge forventningene om `#word-recall` i Mundo-testen til det aktuelle landets lesemål. Behold testene for glosesett, repetisjon og import/eksport.

### Funn 8: synlige og klikkbare lenker i elev- og lærer-PDF

**Filer:** `build-culture-pdfs.py`, ny `tests/test_culture_pdf_links.py`, de to pakke-README-ene og genererte PDF-er.

**Avklart begrensning:** `CNAME` inneholder `www.spansk123.no`, mens README lenker til en GitHub Pages-adresse. Dette dokumenterer ikke at kultursidene er publisert på noen av adressene. Dagens Vercel-bygger kopierer ikke kultursider eller PDF-er; `output/` og `*.pdf` er dessuten ekskludert fra publiseringsgrunnlaget. Ikke hardkod en antatt offentlig adresse eller hev at lokale PDF-er er klare til ekstern deling.

**Byggekontrakt:**

1. Legg til påkrevd `--site-base-url`. Dette er katalogadressen hvor hovedappens `index.html` ligger. Godta absolutt HTTP/HTTPS uten brukernavn/passord, spørring eller fragment. Normaliser til én avsluttende skråstrek, og bevar eventuell underkatalog.
2. Legg til `--output-dir` med dagens `output/pdf` som standard. Testene bruker midlertidig katalog, slik at de ikke overskriver manuelle leveranser.
3. Bygg adressene med `urllib.parse` og relative stier, ikke med en innledende `/`:
   - Elevøkt: `{base}docs/kultur/{pack.id}/index.html`.
   - Gloser: `{base}index.html#gloser/{pack.id}`.
4. Avvis ugyldig basisadresse og ukjent pakke-ID med en forklarende CLI-feil **før PDF-er skrives**. Behold eksisterende `--font-dir` og gjentakbar `--pack`.
5. Når verten er `localhost`, `127.0.0.1` eller `::1`, vis **«Lokalt arbeidsutkast – nettlenkene virker bare på denne maskinen.»** i lenkeblokken. Dette gjelder de lokale kontrollarkene i denne leveransen.

**Visning i PDF:**

- På elevarkets avslutningsside: erstatt den løse beskjed om å finne settet manuelt med en kompakt blokk «Fortsett på nett», med linjene **«Elevøkt: {full URL}»** og **«Gloser: {full URL}»**. Behold oppgavetekst, ordtabell, paroppgave og repetisjonsinformasjon.
- På lærerarkets siste side: legg den samme blokken nær avslutningen, slik at første sides mål og tidsplan ikke presses sammen. Vis både elevøkt og Gloser.
- Begge URL-ene skal være fullt lesbare på papir og ha ekte PDF-lenkeannotasjoner. La lange adresser brytes over linjer; ikke bruk bare «klikk her».
- Lag en liten helper som bruker ReportLabs `Paragraph` med `<link href="…">…</link>`. Dagens `p()` XML-escaper all tekst og kan derfor ikke brukes til ferdig lenkemarkup. Escape tekst og attributter riktig, også anførselstegn i attributter. Ikke sett inn rå CLI-tekst som markup.
- Behold skriftstørrelsene for lesetekst og oppgaver. Reduser eventuelt kartets høyde eller la innhold flyte til neste side hvis lenkeblokken trenger plass; ikke krymp hele arket. Unngå ny blank side eller en enkelt foreldreløs URL-linje. Registrer faktisk sidetall etter bygg, uten å kreve dagens 6/4/3 sider hvis god flyt trenger mer plass.
- Sidefoten skal ikke fremstille en ny PDF som bygget 6. oktober. Bruk en faktisk byggedato i sidefoten, og la `review.checkedSourcesOn` være uendret.

**Tester:** Den nye Python-testen bruker `sys.executable` og `subprocess.run` til å bygge i `TemporaryDirectory`; kall ikke et tilfeldig `python` fra PATH. Fontkatalogen leses fra `CULTURE_PDF_FONT_DIR`. Manglende runtime/font skal gi en tydelig miljøfeil, ikke et grønt «skip» ved sluttkontroll.

- Først en test som kontrollerer at Peru- og jule-PDF har begge forventede `/URI`-annotasjonene; dagens generator mangler disse.
- Positivt: rotbasis, basis uten avsluttende `/` og basis med `/classroom/` gir nøyaktig riktige lenker i elev- og lærerark. Test minst én bygging med alle sju pakker og dermed 14 filer.
- Negativt: manglende basis, relativ adresse, `file:`, `javascript:`, adresse med fragment/spørring/brukerinfo og ukjent pakke avvises uten PDF-utdata.
- Bruk `pypdf` til annotasjoner og uttrekk. Sjekk også pakkeoverskrift, alle lesetekstavsnitt i elevarket, de fire spørsmålene, ti ord og lærerfasiten i riktig dokument; normaliser PDF-ens linjeskift ved sammenligning. Ingen lærerfasit legges i elevarket.

**Aksept:** Alle 14 lokale PDF-er har lesbar adresse, klikkbar elevlenke og riktig glosesettlenke. Utskriftskontrollen viser ingen klipping, manglende tekst eller urimelig liten skrift. Faktiske lokale mål kan åpnes og gir riktig pakke/settkontekst.

**Separat publiseringsavhengighet:** Når offentlig deling bestilles, må faktisk basisadresse og publisering av HTML, bilder, delte ressurser og PDF-er avklares og verifiseres. Deretter bygges PDF-ene på nytt med den adressen. Dette er ikke en grunn til å stoppe de ni lokale korrigeringene, og gir ikke denne agenten tillatelse til å endre deployoppsett eller publisere. Rapporter tydelig at de lokale kontrollarkene ikke er distribusjonsklare.

### Funn 9: kompakt fotokreditering uten informasjonstap

**Filer:** `renderPhotoCaption`, `preview.css`, generatortester og foto-/utskriftstester.

**Ny struktur under hvert ekte foto:**

1. Behold `photo.caption` synlig. Ikke fjern faktiske forbehold som «en annen plass enn Plaza de Armas» eller at et bilde viser et annet marked enn fortellingen. Året kan fortsatt stå i motivteksten.
2. Vis en kort kredittrad: **«Foto: {fotograf} · {lisens}»**, med dagens fotograf-/lisenslenke der den finnes.
3. Én lukket `<details class="photo-source">` med **«Om bildet»**. Her samles originaltittel med kilde-URL, dato og hele `changes`-teksten. Ikke ha en ekstra synlig Commons-lenke utenfor som peker til samme kilde.
4. Bevar metadata fra det objektet som faktisk vises: hovedbildets `visual` har også opplysninger om pålagte ordpunkter. Ikke erstatt dette blindt med `photos`-objektets kortere bearbeidingstekst.
5. Bruk samme helper for hovedfoto og støttefoto i alle seks land. Juleillustrasjonenes eksisterende merking skal ikke sendes gjennom fotografi-rendereren.
6. Lag en utskriftsvariant av detaljinnholdet med samme `.culture-screen-only`/`.culture-print-only`-mønster som funn 5. Render den fra samme metadata/helper, ikke en vedlikeholdt kopi av teksten. På papir skal kreditering/bearbeiding for bildet som faktisk trykkes være tilgjengelig uten å åpne en nettsideutvidelse. Støttefotoene som allerede er skjult i nettleserutskrift trenger ikke legges tilbake.
7. Behold relevante språkmarkeringer og synlig fokus. `summary` skal fortsatt ha minst 44 px høyde. Lange originaltitler/adresser må brytes innenfor mobilen.

**Aksept/test:** Ved 390 px står motiv, fotograf og lisens synlig uten den lange bearbeidingsteksten. Åpning med tastatur eller trykk viser originaltittel, dato, kilde og alle endringer. Bare én kildehenvisning er synlig per figur i skjermvisningen; printkopien er ikke tilgjengelig for skjermleser/Tab når den er skjult. Alt som var av krediteringsinformasjon før, finnes etterpå. Foto og ordpunkter er uendret.

**Tilpass eksisterende test:** Mundo-fototesten finner i dag en alltid synlig «Wikimedia Commons»-lenke. Åpne «Om bildet» i den aktuelle figuren og kontroller originaltittelens URL i stedet. Ikke fjern kontrollen av rett kilde, lokal bildefil eller at bilder lastes uten eksterne forespørsler.

## 6. Testkommandoer og bevis som skal leveres

Kjør fra arbeidskatalogen med støttet Node. Nettleserspesifikasjonene starter selv en statisk server med `/classroom/` som prefiks. Det trengs ingen `playwright.config.js`, og de er ikke avhengige av den manuelle serveren på port 8768.

### A. Generator og innhold

Etter endring i generator/data eller delt CSS/JS:

```bash
npm run sync:culture
npm run check:culture
node --test tests/culture-packages.test.mjs
```

Forventet: genererte filer stemmer med kilde, alle pakker validerer, tekst/ordreferanser og lærerfasit er bevart. For TDD: kjør den nye målrettede testen før implementering og bekreft at den feiler av riktig grunn. «Byggavvik» alene dokumenterer ikke brukerfeilen.

### B. Fokusert nettleserverifisering

Eksisterende suite, også før ny testfil er opprettet:

```bash
npx --no-install playwright test tests/culture-christmas-flow.spec.js tests/culture-mundo-flow.spec.js tests/culture-vocabulary.spec.js --browser chromium --workers=1 --max-failures=1
```

Etter at `culture-ux.spec.js` er opprettet:

```bash
npx --no-install playwright test tests/culture-christmas-flow.spec.js tests/culture-mundo-flow.spec.js tests/culture-vocabulary.spec.js tests/culture-ux.spec.js --browser chromium --workers=1 --max-failures=1
```

Legg til `--grep 'del-av-testnavn'` ved kontroll av ett trinn. Nye tester skal inngå i den eksisterende `test:browser`-oppdagelsen; ingen egen npm-pakke eller parallell testrunner.

Fire forventninger må endres bevisst, ikke bare slettes for å få grønt:

| Gammel forventning | Ny forventning |
|---|---|
| Lesing over 88 % av kortbredden | Sentrert, begrenset lesekolonne; hele teksten fortsatt til stede. |
| Foto flyter til høyre på desktop | Foto mellom hele avsnitt uten skiftende tekstbredde. |
| Gloser-retur ender på `#word-recall` | Retur ender på korrekt første leseoverskrift. |
| Commons-kilde alltid synlig uten åpning | Fotograf/lisens synlig, korrekt kilde under «Om bildet». |

### C. PDF-miljø, bygg og tester

Bruk den eksisterende Codex-runtimen. Disse stiene ble funnet i denne økten; hent nye med `load_workspace_dependencies` hvis de er flyttet. Fontene må være **NotoSans-Regular.ttf** og **NotoSans-Bold.ttf**, ikke DejaVu fra eldre instruksjoner.

```bash
culture_python="/Users/olehenrikvik/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"
culture_font_dir="/Users/olehenrikvik/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype"
"$culture_python" -c 'import reportlab, pypdf; print("PDF-avhengigheter tilgjengelige")'

CULTURE_PDF_FONT_DIR="$culture_font_dir" "$culture_python" -m unittest discover -s tests -p 'test_culture_pdf_links.py'

"$culture_python" scripts/build-culture-pdfs.py \
  --font-dir "$culture_font_dir" \
  --site-base-url http://127.0.0.1:8768/ \
  --output-dir output/pdf \
  --pack jul-spania-chile \
  --pack un-dia-en-honduras \
  --pack un-dia-en-colombia \
  --pack un-dia-en-mexico \
  --pack un-dia-en-espana \
  --pack un-dia-en-peru \
  --pack un-dia-en-guinea-ecuatorial
```

Kommandoene med de nye argumentene/testfilen gjelder **etter funn 8 er implementert**. Dagens byggeverktøy bygger bare første pakke hvis `--pack` utelates; ikke anta at en kjøring uten pakkelisten lager alle arkene.

Render de 14 PDF-ene til PNG med tilgjengelig PDF-verktøy/runtime, og inspiser sidene visuelt. Se særlig på hver lenkeblokk, overgangen mellom sider og lærerarkets siste side. Dagens grunnlag er 51 sider totalt, men sidetall etter korrigeringen skal rapporteres ut fra faktisk bygg. Kontroller faktiske elev-/gloselenker i Peru- og jule-PDF-en i PDF-viseren. Ikke likestill tekstuttrekk eller HTTP 200 med visuell kontroll.

### D. Manuell kontroll av brukerreisene

Bruk `http://127.0.0.1:8768/docs/kultur/index.html` dersom serveren fortsatt kjører. Ellers start repoets statiske innhold lokalt på denne porten, uten å stoppe en annen eksisterende prosess. Ikke bruk ekte elevnavn; bruk eksempelvis «Demo» i en isolert nettleserkontekst.

| Visning | Kontroller |
|---|---|
| 1440 × 1000 | Katalog → lærer → elev/PDF; Start → lesing → spørsmål → samtale → Gloser → tilbake. Fast lesebredde og fotoplassering. |
| 390 × 844 med berøring | Begge elevøkter, katalog og begge lærerveiledninger. Ingen sideveis scrolling. Trykkflater, ordoppslag, bildeord, lokale snarveier, tabell og kreditering. |
| 768 × 1024 | Mellombredde uten tekst som klemmes mellom bilder eller menyelementer. |
| 1920 × 1080 og 200 % nettleserzoom | Lærerens elev-/PDF-innganger, samlet lesekolonne, navigasjon som bryter naturlig og ingen overlapp. |
| Tastatur | Hopp til innhold, de to merkelinkene, snarveier, radiovalg med piltaster, Escape/lukking av støtte, begge typer `details`, retur fra Gloser. Synlig fokus hele veien. |
| Print og JavaScript av | Hele lesetekster, native lenker, nyttig PDF-inngang og én full ordtabell. Skjul flytende ordpaneler/arbeidsmenyer; behold nødvendig kreditering. |

Lagre et lite sett etterbilder i `output/playwright/` med prefikset `kultur-ux-etter-`: katalog mobil, Peru leseflyt desktop, snarveier/retur mobil, ordavslutning mobil, velkomstkontekst og endret svar etter sjekk. Unngå å overskrive auditens førbilder. Skjermbilder dokumenterer løsningen, men erstatter ikke gjennomførte interaksjoner.

### E. Sluttkontroll for implementeringen

```bash
npm run build:app
npm run test:all
git diff --check
bd --no-daemon list --json
```

`test:all` er prosjektets påkrevde sluttport ved produktendringer og inkluderer den vanlige nettleserpakken. Kjør PDF-testene fra C i tillegg; de inngår ikke automatisk i npm-suiten. Ved feil: stopp, les første reelle feil, dokumenter årsak/ny hypotese, og kjør nærmeste test etter retting. Ikke gjør urelaterte rettinger i skolebackend eller andre eksisterende lokale arbeider bare for å skjule en sluttfeil. En gjenstående feil skal rapporteres konkret, og full verifisering skal ikke omtales som grønn.

Etter grønn kontroll: oppdater de aktuelle delene i kulturmalen og pakke-README-ene; kjør `git diff --check` igjen. Malens eldre formulering om full bredde erstattes med 70ch, bilder mellom avsnitt og snarveier. Formuleringen om generell preferanse for KI-bilder skal gjenspeile dagens faktiske valg: ekte fotografier i landserien; julepakkens eksisterende illustrasjoner merkes fortsatt ærlig. Ingen nye bilder bestilles.

Oppdater/lukk Beads-sakene etter hva som faktisk er ferdig. Kjør `bd --no-daemon sync` når Beads er endret. Ingen automatisk commit eller push.

## 7. Ferdigkriterier og overlevering

Implementeringen er ferdig lokalt når alle disse ni resultatene er dokumentert:

| Funn | Observerbart resultat |
|---|---|
| 1 | Et nytt radiovalg fjerner vurderingen av forrige valg; ny sjekk kreves. |
| 2 | Elever kan gå direkte mellom tekst, spørsmål, samtale, Peru-bilde og gloser på mobil og med tastatur. |
| 3 | Stabil, kortere lesekolonne på desktop; støttefoto mellom avsnitt; full tekst bevart. |
| 4 | Katalogen viser forkunnskaper, arbeidsform og utkaststatus før læreren åpner et opplegg. |
| 5 | Gloselenken kommer før en lukket ordtabell; papirinstruksjon/ordtabell beholdes på papir. |
| 6 | Førstegangsbrukeren ser valgt opplegg og lokal profilforklaring uten tidlig lagring eller nye kontoer. |
| 7 | Produktmerket og Kultur har konsekvente mål; Gloser-retur går til leseteksten og respekterer avbrutt avslutning. |
| 8 | Alle elev-/lærerark har synlig og klikkbar adresse til riktig elevøkt og glosesett; lokale ark er merket som lokale. |
| 9 | Kort synlig fotokreditering, komplette tilgjengelige detaljer og bevart kreditering i utskrift. |

Lever en kort oppsummering med endrede kildefiler, faktiske testresultater, lenker til etterbilder og PDF-er, og eventuelle gjenværende problemer. Skill mellom lokalt ferdig implementering og offentlig publisering. Ikke påstå at publisering, pedagogisk lærerprøving eller fysisk mobil-/projektortest er utført dersom de ikke er det.

## 8. Prompt som kan gis til implementeringsagenten

> Implementer de ni korrigeringene i `/Users/olehenrikvik/spansk-ungdomsskole` etter `/Users/olehenrikvik/spansk-ungdomsskole/thoughts/shared/plans/2026-10-07_kultur-ni-ux-korrigeringer.md`. Les først prosjektets AGENTS.md, planen og de aktuelle kildefunksjonene. Bruk planens utførelsesrekkefølge, tekstforslag, avgrensninger og akseptansekriterier. Behold eksisterende lokale endringer. Claim de angitte Beads-sakene; gjør én korrigering om gangen og test den før neste. Rediger generator/data og håndskrevne fellesressurser, og bygg genererte filer. Behold hele faginnholdet, bildene, ordoppslagene, glosesettenes ID-er, fremgang og eksport/import. Kjør fokusert regresjon, PDF-kontroll, manuell desktop-/390 px-kontroll og sluttportene før overlevering. Ikke publiser, push eller endre deploy-/persondatamodell. Lokale PDF-lenker bygges med den eksplisitte lokale basisadressen i planen; oppgi offentlig deling som et separat leveringssteg. Hvis noe svikter, dokumenter konkret feil og undersøk årsaken; ikke fjern krav eller tester for å få grønt. Fullfør det autoriserte lokale arbeidet uten å be om ny godkjenning for allerede avklarte designvalg.
