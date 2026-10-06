# Verifikasjon før fletting: sju forbedringer i Spansk123

Dato: 6. oktober 2026. Arbeidsgren: `codex/small-learning-improvements`, basert på publisert `f57ca19d`. Bygg etter review-retting: `fc18a0795a6faaa3`. Beads-mål: `spansk-ungdomsskole-lfn5`. Rapporten dokumenterer verifikasjonen før PR-fletting. Brukeren har autorisert commit, push og fletting etter retting av review-funnene. Pågående Feide- og kulturarbeid i den opprinnelige arbeidsmappen er bevart.

| Sak | Ferdig forbedring | Kontroll |
| --- | --- | --- |
| 865n | Leksebygger uten forhåndsvalgt innhold, null tidsmål som utgangspunkt, beholdte valg og feil ved riktig område | Gloser, verb, grammatikk og blandede pakker lastet ned og importert; null tidsmål med valgt innhold er fortsatt gyldig |
| 9vh4 | Lydspiller under lytteoppgaver, med egen feil- og prøve-igjen-melding | Faktisk avspilling før/etter svar; svar beholdes; avspilling stoppes ved neste spørsmål/avslutning; fem eksisterende opptak spilles uten nett |
| ez53 | Øvingsknapp ved grammatikkintroduksjonen og nederst | Begge starter samme ferdigheter; tastatur, tilbakeknapp, Brainmap og eksisterende klasseregnskap fungerer |
| 9o5z | Norsk betydning av pronomen i verbøving | Alle seks pronomen i presens, fremtid og presens perfektum har korrekt støtte, forventet bøyning og tastaturbasert vurdering |
| dj3r | Neste faktiske repetisjonsdato på Start | Eksisterende kø blir klar på vist dato, også ved lokal midnatt og begge sommertidsovergangene; importert fremgang endres ikke |
| x7uo | Kopierbar elevinstruks etter eksport, med mobilmeny og inkluderte aktiviteter | Separat elevprofil ved 390 px åpner faktiske filer og finner startknappene; avvist utklippstavletilgang gir manuell kopiering |
| 73o4 | Import viser tilgjengelige ord og skiller nye fra eksisterende | Alle standardkategorier gjenbruker komplette eksisterende kort; nye alternativer virker etter backup/reimport og null tilgjengelige gloser varsles |

## Verifikasjon

Nye tester ble først kjørt mot den manglende funksjonaliteten og feilet på forventet problem før implementering. `tests/small-learning-improvements.spec.js` tilfører 21 nettlesertester. Fire eldre testfiler velger nå uttrykkelig den øvre grammatikkknappen; egne tester kontrollerer både øvre og nedre knapp. Første samlede kjøring fant sju slike antakelser om én knapp. Etter retting bestod 88 målrettede tester, deretter hele suiten.

Endelig kjøring, med Node 22:

```sh
npm run build:app
npm run test:all
git diff --check
```

Bygg og full suite avsluttet med kode 0: **47 Node-tester og 482 Chromium-tester bestod**. Katalog-, ordforråds-, grammatikk-, innholds-, Tailwind- og offline-kontroller bestod. Ordforrådskontrollen verifiserte 522 kanoniske oppføringer. Ingen nye avhengigheter eller endringer i ordkilden, backupformatet eller assignment-v1-formatet.

Nettleserne brukte syntetiske lokale data ved 390 px og desktopbredde. Skjermbilder av lytteoppgave, grammatikkintroduksjon og elevinstruks ble gjennomgått. Leksefiler ble overlevert mellom separate nettleserprofiler; ingen melding ble sendt gjennom en ekstern skoleplattform. Kopiering skjer bare ved et aktivt knappetrykk, og rapportdeling er fortsatt manuell. Lyttesvar lagres fortsatt bare i minnet. Lyd er eksisterende eierleverte opptak.

## Rettet etter uavhengig gjennomgang

Review-funnene `ojzi` og `bd4o` er rettet med seks nye regresjonstester. Lekseimport foretrekker komplette eksisterende ordpar før alternative oversettelser deles. Import og pakkeoppslag deler samme regel, slik at nye alternativer blir tilgjengelige etter eksport/import og gjentatt filimport. Standardpakken Bindeord gjenbruker alle 22 kort uten de fem ekstra kortene som review fant. Eksisterende kortfremgang bevares; eldre ekstra kort slettes ikke automatisk. Null tilgjengelige gloser gir en tydelig norsk advarsel, mens en pakke med bare verb fortsatt importeres som normalt.

De tre feltfeilene og leksebyggerens samlede status bruker en mørkere eksisterende farge. Automatisk måling ved 390 px og 1280 px gir **6,784:1** for alle fire meldinger. Skjermbilder ble gjennomgått.

`tests/assignment-import-alternatives.spec.js` dekker alle standardkategorier, faktisk nedlasting/import mellom separate lærer-/elevprofiler, nye alternativer, backup/reimport og nullmelding. `tests/assignment-builder-contrast.spec.js` dekker kontrast på mobil og desktop. Begge feil ble observert i røde regresjoner før retting. En entallsforventning og en forventning om at en nyordøkt skulle inkludere alle pakkekort samtidig ble korrigert i kontrolltestene; appens eksisterende øktgrenser er beholdt.

I tillegg bestod **26 relevante WebKit-tester**. Utklippstavletesten med Chromium-tillatelser inngår i Chromium-suiten, og ble utelatt i WebKit. Lokal WebKit er ikke en fysisk iPhone-test. Ferske terminalbevis fra den faktiske arbeidsmappen ligger lokalt i `/private/tmp/spansk123-delivery-build.log`, `/private/tmp/spansk123-delivery-all.log` og `/private/tmp/spansk123-delivery-webkit.log`.

## Avgrensninger og integrasjon

Fysiske iOS-/Android-enheter, skjermleserens tale og målbar læringseffekt eller tidsbesparelse er ikke verifisert. Feide og den separate skoleprototypen inngår ikke i denne leveransen. `getNextVocabularyReviewDate(cardList)` kan brukes av den planlagte kulturintegrasjonen i tc0b.4; Beads har en integrasjonsmerknad. Funksjonen runder opp til første lokale midnatt som oppfyller den eksisterende køens grense, og endrer ikke selve repetisjonsplanen.

Regresjonstester og denne rapporten er den varige dokumentasjonen. Den opprinnelige kontrollen før review hadde 47 Node- og 476 Chromium-tester; den nye fullkjøringen inkluderer de seks rettingsregresjonene.
