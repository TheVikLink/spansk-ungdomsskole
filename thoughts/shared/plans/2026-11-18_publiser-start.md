# Publiser Start på spansk123.no

Beads: `spansk-ungdomsskole-rbec.4.6`

Publiser den avtalte elevforsiden på GitHub Pages med utgangspunkt i gjeldende offentlig `main` (`b96a71f`). Ta med ukeoversikt, grammatikkart, dagsquiz, ordvalg for repetisjon, temabasert anbefaling med ordliste og valg av tema/egen liste. Fjern uttalekortet fra Start. Behold den eksisterende kulturlenken, inngangen til Uttale og veiledningen om neste repetisjonsdato.

Bruk en isolert klon og en `codex/`-gren. Flytt de avgrensede HTML-, CSS- og testendringene til den offentlige versjonen. Bygg CSS og offline-versjon. Bruk offentlig ordliste og gjeldende lokale lagringsformat. Endringer for skole, rapportering, analyse og den separate quiz-oppfølgingen hører til egne leveranser.

Kjør `npm run build:app`, nærmeste nettlesertester og `npm run test:all`. Kontroller diff og webflyter på mobil og desktop med syntetiske data. Samle kandidat i PR og kontroller GitHub Actions før sammenslåing til `main`. Følg Pages til ønsket revisjon er publisert. Verifiser apex-videresending, HTML, CSS, service worker og øvingsflytene på det kanoniske domenet. Ved produksjonsregresjon, tilbakefør den avgrensede endringen via en revert.
