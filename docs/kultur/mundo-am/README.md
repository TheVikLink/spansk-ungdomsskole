# Mundo AM: seks dager, seks steder

Seks lokale kulturopplegg bygget etter den reviderte julemalen, med ni UX-korrigeringer 7. oktober 2026. Åpne [kulturoversikten](../index.html) eller velg en pakke nedenfor. Elev- og lærersidene har en returlenke til oversikten.

| Elevøkt | Lærerveiledning | Spanske ord | Leseoppslag | Papirark |
|---|---|---:|---:|---|
| [Honduras: Un día en Copán Ruinas](../un-dia-en-honduras/index.html) | [Åpne](../un-dia-en-honduras/laerer.html) | 336 | 70 | [Elev](../../../output/pdf/un-dia-en-honduras-elev.pdf) · [Lærer](../../../output/pdf/un-dia-en-honduras-laererveiledning.pdf) |
| [Colombia: Un día en Cartagena](../un-dia-en-colombia/index.html) | [Åpne](../un-dia-en-colombia/laerer.html) | 326 | 69 | [Elev](../../../output/pdf/un-dia-en-colombia-elev.pdf) · [Lærer](../../../output/pdf/un-dia-en-colombia-laererveiledning.pdf) |
| [Mexico: Un día en Oaxaca](../un-dia-en-mexico/index.html) | [Åpne](../un-dia-en-mexico/laerer.html) | 348 | 74 | [Elev](../../../output/pdf/un-dia-en-mexico-elev.pdf) · [Lærer](../../../output/pdf/un-dia-en-mexico-laererveiledning.pdf) |
| [Spania: Un día en Valencia](../un-dia-en-espana/index.html) | [Åpne](../un-dia-en-espana/laerer.html) | 343 | 69 | [Elev](../../../output/pdf/un-dia-en-espana-elev.pdf) · [Lærer](../../../output/pdf/un-dia-en-espana-laererveiledning.pdf) |
| [Peru: Un día en Cusco](../un-dia-en-peru/index.html) | [Åpne](../un-dia-en-peru/laerer.html) | 344 | 69 | [Elev](../../../output/pdf/un-dia-en-peru-elev.pdf) · [Lærer](../../../output/pdf/un-dia-en-peru-laererveiledning.pdf) |
| [Ekvatorial-Guinea: Un día en Bata](../un-dia-en-guinea-ecuatorial/index.html) | [Åpne](../un-dia-en-guinea-ecuatorial/laerer.html) | 342 | 69 | [Elev](../../../output/pdf/un-dia-en-guinea-ecuatorial-elev.pdf) · [Lærer](../../../output/pdf/un-dia-en-guinea-ecuatorial-laererveiledning.pdf) |

Hver elevøkt har en sammenhengende tekst i seks avsnitt, et ekte toppfoto med relevante bildeord, et kart, muntlig lesing og oversettelse i par, fire tekstnære avkrysningsspørsmål, åpne kulturspørsmål og en kort språkoppgave. De ti nøkkelordene åpnes som et valgfritt tema i vanlig Gloser, med eksisterende repetisjon og lenke tilbake til teksten. Ord som allerede finnes, bruker eksisterende kort og fremgang. Standardordlisten er uendret.

På nett vises oversettelser ved pek, tastaturfokus eller trykk direkte i teksten. Teksten står i en sentrert kolonne på maksimalt 70ch, med støttefoto mellom hele avsnitt. Snarveiene «Les · Spørsmål · Samtale · Gloser» og lokale returlenker knytter delene sammen. Gloselenken kommer før en lukket ordtabell; på papir vises hele tabellen. Papirversjonen har full tekst, egen ordlisteside, oppgaver og ti øvingsord: fire elevsider og tre lærersider per pakke. Fasit ligger på lærersidene.

## Historisk bilderevisjon, 6. oktober 2026

De tidligere maleriske familieportrettene er erstattet etter produkteierens tilbakemelding. Bildene viser nå hverdagsdetaljer med dempede farger og vanlig fotografisk lys. Nummerpunktene er plassert på nytt. [Gjeldende prompter og filreferanser](../fotografiske-bilder.md) dokumenterer alle åtte kulturmotivene. Bildene er fortsatt merket som genererte.

## Ekte stedsbilder

Hvert av de seks oppleggene har ett ekte toppfoto og ett ekte støttefoto ved et relevant avsnitt. Motivtekst, fotograf og CC BY 2.0-lisens vises under bildet. «Om bildet» åpner originaltittel med kilde, dato og full bearbeidingstekst. Krediteringen til toppfotoet beholdes ved utskrift. Alle tolv bilder leveres lokalt; ingen eksterne bildeforespørsler sendes. [Bilde- og lisensregister](../stedsfoto.md) dokumenterer filene og vilkårene. Papirarkene beholder den korte formen uten disse nettbaserte tilleggsbildene.

## Innhold og status

Historiene er originale og har forskjellige fiktive ungdommer og familier. Faglige opplysninger er undersøkt i primærkilder. [Bilde- og kildeprotokollen](bilde-og-kildeprotokoll.md) dokumenterer kilder, bildeopphav og kontroll. Pakkene er lokale arbeidsutkast som skal prøves og vurderes av lærer før publisering. Det er ikke gjennomført en klasseromsprøve. Forslaget på 45 minutter kan utvides til to timer etter forkunnskaper.

Ingen ny lyd eller talesyntese er lagt til. Tekstsvar lagres eller sendes ikke fra kultursidene. Gloser bruker appens eksisterende lokale lagring, repetisjon og eksport/import.

## Kilde og bygg

`data/culture-packages.json` er autoritativ kilde for tekst, spørsmål, lærerplan, ord, bilder og kartmetadata. HTML og PDF bygges fra samme innhold. Kartene bygger på eksisterende Natural Earth-data i `data/maps/ne_110m_land.geojson`, med navngitte markører og omtrentlige koordinater.

Kjør fra rotmappen med prosjektets støttede Node-versjon:

```sh
npm run build:app
npm run check:culture
npm run check:vocabulary
node --test tests/culture-packages.test.mjs
npm run test:all
```

PDF-er bygges med ReportLab og fontene `NotoSans-Regular.ttf` og `NotoSans-Bold.ttf`. Basisadressen er påkrevd; lokale kontrollark merkes som lokale arbeidsutkast. `--pack` kan gjentas; uten parameter bygger skriptet julepakken. For alle seks:

```sh
culture_python="/Users/olehenrikvik/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"
culture_font_dir="/Users/olehenrikvik/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype"
"$culture_python" scripts/build-culture-pdfs.py \
  --font-dir "$culture_font_dir" --site-base-url http://127.0.0.1:8768/ \
  --output-dir output/pdf \
  --pack un-dia-en-honduras --pack un-dia-en-colombia \
  --pack un-dia-en-mexico --pack un-dia-en-espana \
  --pack un-dia-en-peru --pack un-dia-en-guinea-ecuatorial
```

## Historisk verifikasjon, før UX-korrigeringene

Etter den fotografiske bilderevisjonen bestod fersk `npm run test:all`: 68 enhetstester, 52 servertester og 505 Chromium-tester, 625 totalt. `build:app`, `check:culture`, `check:vocabulary` og `git diff --check` består også. Mobiltestene trykker nå alle 34 bildeord i alle åtte aktive bilder på både 360 og 390 pikslers bredde, viser riktig oversettelse og lukker panelet. Nummerpunktene har minst 44 pikslers avstand.

Alle 42 Mundo AM-sider i de 12 nybygde PDF-ene er kontrollert visuelt, uten avkuttet tekst eller overlapp. Tekstuttrekk bekrefter komplette avsnitt, alle fire spørsmål og svaralternativer, separate fasiter, alle 420 leseoppslag og 60 øvingsordpar. Med julepakken omfatter bilderevisjonen 14 PDF-er og 51 kontrollerte sider.

Opprinnelig oppretting er ført i Beads `spansk-ungdomsskole-8kt7`; bilderevisjonen i `spansk-ungdomsskole-w7v9`. Ingen push, deploy eller publisering er utført.

## Ekte ordbilder og tekstflyt, 7. oktober 2026

De seks oppleggene bruker nå ett ekte, annotert toppfoto og ett ekte foto i teksten. Denne revisjonen brukte tekstflyt langs venstre side av støttebildet på desktop. UX-korrigeringen nedenfor erstatter den med bilder mellom hele avsnitt. Se [bildekilder og lisenser](../stedsfoto.md). Elevark og lærerveiledninger bruker samme toppfoto med kreditering. Tidligere beskrivelser av genererte ordbilder ovenfor er historikk.

Fersk sluttkontroll etter siste innholdsrettelse: `npm run build:app` og `npm run test:all` består, med 71 enhetstester, 52 servertester og 507 Chromium-tester (630 totalt). Mobiltestene trykker alle 26 ordpunkter i de åtte bildene, inkludert julepakken. De 12 Mundo AM-PDF-ene beholder 42 sider; alle sider er visuelt kontrollert, og tekstuttrekk bekrefter komplette avsnitt, ordlister, spørsmål, svaralternativer og fotokreditering. `git diff --check` består. Ingen publisering. Beads: `spansk-ungdomsskole-f3jz`.

## UX-korrigeringer og kontroll, 7. oktober 2026

Lesekolonnen er nå maksimalt 70ch, sentrert og uten flyt rundt støttefoto. Katalogen viser forkunnskaper, arbeidsform og utkaststatus. Nytt radiovalg fjerner tidligere respons. Elevsidene har native snarveier og retur til teksten; Peru-oppgaven har også «Se bildet». Gloser-retur går til leseoverskriften. Førstegangsbruk viser valgt opplegg i den vanlige velkomsten uten tidlig lagring eller kortoppretting. Fotodetaljene åpnes ved behov og beholdes på papir.

Alle tolv Mundo-PDF-er er bygget på nytt med synlige, klikkbare adresser til riktig elevøkt og glosesett. De har fortsatt fire elevsider og tre lærersider per pakke, 42 sider totalt. Basisadressen `http://127.0.0.1:8768/` gjør dette til lokale kontrollark, ikke distribusjonsklare dokumenter. Offentlig deling krever et eget oppdrag, ny bygging med faktisk publiseringsadresse og kontroll av målressursene.

Fersk `npm run build:app` og sammenhengende `npm run test:all` bestod: 73 Node-tester, 52 servertester og 528 Chromium-tester (653 totalt). Kulturutvalget bestod 26 innholdstester og 64 nettlesertester. Fire Python-tester kontrollerte lenker, validering og innhold i begge PDF-roller. Alle 51 sider i 14 PDF-er, inkludert julepakken, er visuelt kontrollert. Begge lenkene i Peru- og jule-elevarkene er åpnet fra macOS Forhåndsvisning og viste riktig pakke og glosesett i Chrome. Se [implementeringsrapporten med etterbilder og PDF-er](../../reviews/2026-10-07_kultur-ux-implementering.md). Beads: `spansk-ungdomsskole-jx33` og `spansk-ungdomsskole-o6gw`. Ingen publisering eller klasseromsprøve er utført.
