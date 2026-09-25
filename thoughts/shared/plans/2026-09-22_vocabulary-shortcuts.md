# Hurtigtaster og lydmelding i gloser

Beads: spansk-ungdomsskole-906.

Et skjult glosekort snus fortsatt med mellomrom eller Enter. Når fasiten er synlig, gir mellomrom og 1 vurderingen Bra, mens 2 gir Igjen. Knappehint oppdateres. Holdte taster, tekstinntasting, fokus på vanlige knapper og andre øvelser skal ikke gi utilsiktede vurderinger.

Brukeren ba også om å fjerne den faste meldingen «Lydopptak er ikke tilgjengelig for denne oppgaven» overalt den vises: forsiden og baksiden av glosekort samt blandet quiz. Oppdater tilsvarende tester og README. Ingen lydgenerering eller endring av lytte-/diktatøvelser inngår.

Verifiser tastemapping før og etter fasit med en liten test av beslutningsfunksjonen, og de faktiske tastetrykkene, enkeltregistrering og felt-/knappefokus med nettlesertester. Kjør byggekommandoen og eksisterende kontrollsuite; dokumenter eventuell blokkering av Chromium separat.

Brukerens fulle kjøring av bygg `7072d6e4a34f6771` ga 47 beståtte Node-tester og 464 av 466 beståtte nettlesertester. De to feilene skyldtes testoppsettet: læringsflyttesten forventet fortsatt `(1)` på Igjen, og hurtigtasttesten startet tilfeldig med en skriveoppgave fra repetisjonskøens 25 % skrivekort. Feilrapportens skjermbilde viste «Skriv svaret». Hurtigtastoppsettet velger nå eksplisitt snukort og verifiserer at snukortet er synlig; testen av skrivefelt beholdes separat. Læringsflyttesten kontrollerer begge oppdaterte hurtigtastetikettene. Appens blanding av oppgavetyper endres ikke.

Sluttkontroll 2026-09-22: begge opprinnelig feilende tester bestod, deretter alle 19 tester i de to berørte filene. Etter retting av en separat Lingo Links-testforutsetning (beskrevet i planen for 907) bestod hele `npm run test:all`: 47 Node-tester, 466 nettlesertester og alle katalog-/innholds-/offlinekontroller. Bygg fortsatt `7072d6e4a34f6771`. Endringene er lokale; ingen commit eller publisering utført.
