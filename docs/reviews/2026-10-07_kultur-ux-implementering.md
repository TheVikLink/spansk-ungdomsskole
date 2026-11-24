# Ni UX-korrigeringer i kulturdelen – ferdig lokalt

7. oktober 2026. Implementert etter [godkjent plan](../../thoughts/shared/plans/2026-10-07_kultur-ni-ux-korrigeringer.md) på eksisterende gren `codex/mundo-am-seis-paises`. Tidligere lokale endringer er bevart. Ingen commit, push eller publisering er utført.

## Resultat

| Funn | Levert og verifisert |
|---|---|
| 1. Gammel svarrespons | Endret radiovalg tømmer respons og skjuler hint, forklaring og avsløringsknapp i det aktuelle spørsmålet. Ny sjekk kreves; valg og fokus beholdes. |
| 2. Navigasjon | Native snarveier mellom lesing, spørsmål, samtale og gloser. Retur fra hvert spørsmål til riktig land; egne tekstlenker for jul og «Se bildet» til Perus hovedfoto. Fokusmål fungerer med tastatur og uten JavaScript. |
| 3. Lesebredde | Én sentrert kolonne på maksimalt 70ch. Støttefoto ligger mellom hele avsnitt uten tekstflyt rundt. Alle avsnitt og bildeutsnitt er bevart. |
| 4. Katalog | Forkunnskaper, arbeidsform og faktisk utkaststatus på alle sju kort. Metadata valideres av generatoren. |
| 5. Ordavslutning | Gloser-knappen og aktiv gjenhenting kommer før en lukket «Se de ti ordene»-utvidelse. Utskrift og PDF har papirinstruksjon og full ordtabell. |
| 6. Velkomst | Valgt opplegg og forklaring på lokal profil i vanlig førstegangsoppsett. Visningen skriver ikke til lagring, oppretter ikke kort og starter ikke øving. |
| 7. Merke og retur | Produktmerket går til hovedappen, Kultur til katalogen. Gloser-retur går til første leseoverskrift; avbrutt bekreftelse beholder aktiv økt. |
| 8. PDF-lenker | Alle 14 ark har synlige og reelle lenkeannotasjoner til riktig elevøkt og glosesett. Eksplisitt basisadresse, validering før utdata og tydelig merking av lokale kontrollark. |
| 9. Fotokreditering | Motiv, fotograf og lisens er synlige; originalkilde, dato og full bearbeidingstekst ligger under «Om bildet». Samme informasjon følger med på papir. Juleillustrasjonenes merking er bevart. |

Autoritative endringer ligger i `data/culture-packages.json`, `scripts/build-culture-preview.mjs`, delt `docs/kultur/jul-spania-chile/preview.js` og `preview.css`, `index.html`, `src/styles/tailwind.css` og `scripts/build-culture-pdfs.py`. HTML, innebygde glosedata, CSS, service worker og PDF-er er generert på nytt. Kulturmalen og begge pakke-README-ene er oppdatert. Det er ikke lagt til avhengigheter, lyd, innlogging eller elevinnsending. Standardord, progresjonsformat, eksport/import og repetisjonsalgoritme er bevart.

## Fersk verifisering

Node 22.23.3, Chromium og eksisterende Python-runtime med ReportLab, pypdf og Noto Sans.

| Kontroll | Resultat |
|---|---:|
| `npm run build:app` | Bestod |
| `npm run test:all` – én sammenhengende sluttkjøring | 73 Node + 52 server + 528 nettleser = **653 bestod**, ingen feil |
| `node --test tests/culture-packages.test.mjs` | **26/26** bestod |
| Fire kulturspesifikasjoner, fokusert kjøring med etterbilder | **64/64** bestod, 44,0 sekunder |
| `test_culture_pdf_links.py` med `CULTURE_PDF_FONT_DIR` | **4/4** bestod, 8,128 sekunder; ingen hoppet over |
| PDF-bygg med alle sju pakker | **14 PDF-er / 51 sider**, alle sider visuelt kontrollert |
| `git diff --check` | Bestod |

Kulturutvalget inngår også i den store suiten; tallene skal ikke summeres på nytt. PDF-testene er separate og dekker fullstendige avsnitt, fire spørsmål, ti gloser, adskilt lærerfasit, faktiske URL-annotasjoner, rot-/underkatalogadresse, manglende avsluttende skråstrek, lange adresser og ugyldige argumenter uten PDF-utdata. Vanlig eksport/import og fremgang bestod i regresjonene.

Testene ble først kjørt rødt for de nye atferdskravene. En mellomliggende fullkjøring fant at fotodetaljenes nye avsnitt ble telt som lesetekst. Detaljene ble endret til egne span-elementer, og nærtester samt hele sluttkjøringen bestod deretter. Nettleserstart krever prosessrettigheter utenfor macOS-sandkassen i dette miljøet; ingen produktkode eller testfrister ble endret for å omgå miljøet.

## Visuell og manuell kontroll

Katalog → lærer → elev, ordoppslag, bildeord, endret svar, lokale tekst-/bilde-/gloseankre, native utvidelser og Gloser-velkomst/start er prøvd i nettleser. Peru og jul er visuelt kontrollert i smal og bred visning. Begge lærerveiledningers elev-/PDF-innganger og juleelevsidens navigasjon er kontrollert i Chrome ved 200 prosent zoom, og zoom er tilbakestilt etterpå.

Eksakte bredder 360, 390, 768, 1280, 1440 og 1920 px er kontrollert av nettlesertestene. De dekker bevart lesetekst, sentrert bredde, bildeplassering og fravær av horisontal overflyt. Tastaturfokus, native ankerlenker uten JavaScript, utskrift, lukket ordtabell og komplette fotodetaljer er automatisert kontrollert. Den manuelle innebygde nettleserens viewport-overstyring rapporterte ikke ønsket bredde; den brukes derfor ikke som bevis på eksakte manuelle pikselmål.

Alle PDF-sider er rendret og inspisert. Elev- og gloselenkene i **både Peru- og jule-elev-PDF** er faktisk klikket i macOS Forhåndsvisning og åpnet riktig elevøkt og glosesett i Chrome. Returbekreftelsen fra Gloser hang i det manuelle nettleserverktøyet; både avbryt og bekreft er verifisert i nettlesertestene. Ingen påstand om fysisk telefon-/projektortest eller klasseromsprøve.

## Etterbilder

- [Katalog på mobil](../../output/playwright/kultur-ux-etter-katalog-mobil.png)
- [Peru: leseflyt og bilde mellom avsnitt](../../output/playwright/kultur-ux-etter-peru-leseflyt-desktop.png)
- [Snarvei til spørsmål og retur på mobil](../../output/playwright/kultur-ux-etter-snarveier-retur-mobil.png)
- [Digital ordavslutning på mobil](../../output/playwright/kultur-ux-etter-ordavslutning-mobil.png)
- [Velkomst med oppleggskontekst](../../output/playwright/kultur-ux-etter-velkomstkontekst.png)
- [Nytt radiovalg uten gammel vurdering](../../output/playwright/kultur-ux-etter-endret-svar.png)

## Gjeldende PDF-er

Alle ark er bygget med `--site-base-url http://127.0.0.1:8768/` og merket **«Lokalt arbeidsutkast – nettlenkene virker bare på denne maskinen.»** De er lokale kontrollark og er ikke distribusjonsklare. De eldre julearkene med «med-stotte» og «mindre-stotte» i filnavnet er historiske.

| Opplegg | Elevark | Lærerveiledning |
|---|---|---|
| Jul i Spania og Chile | [6 sider](../../output/pdf/jul-spania-chile-elev.pdf) | [3 sider](../../output/pdf/jul-spania-chile-laererveiledning.pdf) |
| Honduras | [4 sider](../../output/pdf/un-dia-en-honduras-elev.pdf) | [3 sider](../../output/pdf/un-dia-en-honduras-laererveiledning.pdf) |
| Colombia | [4 sider](../../output/pdf/un-dia-en-colombia-elev.pdf) | [3 sider](../../output/pdf/un-dia-en-colombia-laererveiledning.pdf) |
| Mexico | [4 sider](../../output/pdf/un-dia-en-mexico-elev.pdf) | [3 sider](../../output/pdf/un-dia-en-mexico-laererveiledning.pdf) |
| Spania | [4 sider](../../output/pdf/un-dia-en-espana-elev.pdf) | [3 sider](../../output/pdf/un-dia-en-espana-laererveiledning.pdf) |
| Peru | [4 sider](../../output/pdf/un-dia-en-peru-elev.pdf) | [3 sider](../../output/pdf/un-dia-en-peru-laererveiledning.pdf) |
| Ekvatorial-Guinea | [4 sider](../../output/pdf/un-dia-en-guinea-ecuatorial-elev.pdf) | [3 sider](../../output/pdf/un-dia-en-guinea-ecuatorial-laererveiledning.pdf) |

## Avgrensning og overlevering

De ni lokale rettingene er ferdige. Beads `spansk-ungdomsskole-jx33` og `spansk-ungdomsskole-o6gw` er lukket med denne verifikasjonen; Beads er synkronisert til JSONL. Publiseringsarbeidet i `spansk-ungdomsskole-tc0b.3` står åpent: et eget bestilt steg må avklare faktisk offentlig basisadresse, publisere nødvendige ressurser, bygge arkene med adressen og kontrollere lenkemålene. Faglig lærerprøving og klasseromsutprøving ligger fortsatt i eksisterende oppfølgingssaker. Det er ingen kjent gjenstående feil i de ni implementerte korrigeringene.
