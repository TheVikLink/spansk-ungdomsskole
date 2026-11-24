# Enklere uttaleskole etter elevflyt-prøve

Eier avviser vokalgjetting og opplever navigasjonen som forvirrende. Dagens flyt har fire skjermbilder per lydkort, separate bekreftelser før avspilling og lange videreknapper. «Jeg har prøvd – hør modellen» spiller ikke lyd; det bryter forventningen til knappen. Dette svekker samsvar mellom ord og handling, kontroll og oversikt, og øker den mentale belastningen.

Den nye økten viser ett lydkort per side: en kort regel med lyden, deretter ord og setning. Eleven får beskjed om å lese høyt, høre modellen og prøve igjen. «Hør ordet» og «Hør setningen» spiller direkte ved ett trykk. Flervalgstrinnet og alle bekreftelses-/reveal-steg fjernes. Enkle «Forrige lyd», «Neste lyd» og «Fullfør økten» gir kjent navigasjon. Avspilling alene lagrer ingen fremgang; neste/fullfør registrerer kortet etter at begge modellene er hørt. Egen tale vurderes ikke.

Midlertidig egenopptak ligger bak ett valgfritt felt på kortet. Å lukke feltet, bytte kort eller avslutte fjerner opptaket. Eksisterende mikrofon-/lagringsvern beholdes. Oversikten viser én foreslått start, mens resten av temaene kan åpnes med «Velg et annet tema». Oppslag, lekselenker, alle 93 lydfiler og offline-funksjonen beholdes.

Arbeidet følges i Beads nvf4. Kildemodulen, katalogen, tilhørende tester og gjeldende lærerbeskrivelse oppdateres; den genererte HTML-blokken bygges fra kilden. Eksisterende lagrede kort-ID-er og eksportformat beholdes. Før levering: direkte avspilling med ett trykk, ingen quiz/reveal, frem/tilbake uten dobbelttelling, skjerm-/tastaturkontroll ved 390/1280 px, opptaksopprydding ved lukking/neste, lydfeil, offline, eksport/import og påkrevd build:app/test:all.

Utført: spørsmål og quizscore er fjernet også fra den aktive katalogen, og den nye flyten krever bare direkte ordavspilling, direkte setningsavspilling og Neste/Fullfør per kort. Modellene kan repeteres fritt. Navigasjonen ligger fast nederst under øving. Mobiltesten avdekket at kortbytte beholdt gammel rulleposisjon; kort/oversikt/avslutning starter nå fra toppen. Enhets- og målrettede tester dokumenterer kompatibel fremgang, ingen dobbelttelling ved tilbakeknapp og rydding av opptak ved lukking av feltet eller kortbytte. Samlet sluttkontroll er startet på bygg 9dabd2a18ec2ced3.

Sluttkontroll: build:app og test:all bestod med Node 22.23.3 på bygg 9dabd2a18ec2ced3: 79 katalog-/enhetstester, 52 servertester og 542 Chromium-tester. Manuell prøve ved 390/1280 px bekreftet direkte modellavspilling, ett kort per side og fast navigasjon. Alle 93 originalhash er kontrollert i public-pakken. Se [gjeldende verifikasjon](../../../docs/uttale/verifikasjon-2026-10-07.md). Ingen publisering.


## Eierjustering: lydskrift, bokstavnavn og opptaksfelt

IPA fjernes fra elevkatalogen og begge visninger. De 31 separate `letter`-opptakene tas ut av apppakken; kildekartleggingen bevares som historikk uten å hevde at hvert slikt opptak er et bokstavnavn. De 62 ord-/setningsmodellene beholdes uendret. Dette unngår å presentere alfabetnavn som isolerte språklyder. Tidligere nedlastede `letter`-filer ryddes fra modellcachen; elevfremgang berøres ikke. Ved åpning av valgfritt opptaksfelt rulles hele feltet inn i visningen uten å starte mikrofonen. Kontrollene dekker desktop/mobil, offline og sletting av egenopptak.

Eier ber også om en synlig meny over alle 31 lydene nederst. Menyen åpner en ett-kortsøkt for valgt lyd, også fra pågående øving; tidligere midlertidig opptak ryddes først. Oppslaget heter nå «Finn en lyd».
