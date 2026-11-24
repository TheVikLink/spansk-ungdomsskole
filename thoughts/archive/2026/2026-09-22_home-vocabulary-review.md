# Gloserepetisjon på startsiden

Beads: `spansk-ungdomsskole-902`.

Brukeren vil beholde Dagens quiz øverst, erstatte «Neste anbefalte øving» med antall gloser klare for repetisjon og direkte start, og fjerne den gamle lærerintroduksjonen fra både velkomst og Start.

Antallet skal bruke samme `getDueCards` som eksisterende gloseøkter, telle unike kort én gang på tvers av øvingsretningene og ikke ta med uøvde eller fremtidige kort. Eksisterende regel for ord som trenger ekstra repetisjon beholdes. Startkortet er tilgjengelig også før nivåtesten. Tom kø vises som null med forklaring og deaktivert startknapp. Start oppretter en vanlig repetisjonsøkt med opptil 50 oppgaver fra alle kategorier; et tidligere kategorivalg eller null i avanserte grenser skal ikke gjøre knappen misvisende. Antallet beregnes på nytt når Start åpnes og når knappen trykkes. Ingen lagringsformat eller fremgangsregler endres.

Fjern lærerintroduksjonens markering, rendering og foreldreløse snarvei. Grammatikkforklaringen er fortsatt tilgjengelig via Grammatikk. Oppdater tester som brukte den gamle snarveien til å åpne grammatikk via vanlig navigasjon, og behold kontrollen av øving, oppsummering og eksport/import.

Kontroller først tellingen med ekte appfunksjoner i Node: begge retninger, én retning, nye ord, fremtidige ord og ekstra repetisjon. Nettleserregresjoner skal dekke telling, tom kø, direkte start, gamle filtre/grense og retur til Start på mobil og desktop. Bygg appen, kjør `test:all` og dokumenter eventuell sandbox-blokkering separat fra appfeil. Arbeidstreet har mange allerede staged endringer; de skal bevares. Denne UI-endringen publiseres ikke som en utilsiktet del av tidligere arbeid.

## Lokal gjennomføring og verifikasjon

Start viser nå «Repeter gloser» og antall ord klare for repetisjon, med entalls-/flertallstekst og deaktivert knapp ved null. Knappen bruker vanlig gloseøkt med 50 oppgaver i startkøen; feilforsøk kan gi flere repetisjoner i samme økt som før. Valgte kategorier og den avanserte repetisjonsgrensen endres ikke. Lærerintroduksjonen og dens ubrukte startfunksjon er fjernet. Testene for artikkeløving bruker vanlig Grammatikk-navigasjon, og gjenopprettingstesten kontrollerer nå Start på mobil.

Bygget og alle statiske kontrollkommandoer fra `test:all` består. Node-suiten består med 34 tester, inkludert den nye tellingstesten som først feilet uten funksjonen. Testoppsettet ble deretter komplettert med appens eksisterende terskel for ekstra repetisjon. Alle kjørbare inline-skript og endrede testfiler er syntakskontrollert. Playwright kan liste de 36 testene i de fem berørte nettleserfilene.

Agentens avgrensede nettleserkjøring ble blokkert før appen lastet: macOS nektet Chromium å opprette `MachPortRendezvousServer` (`Permission denied (1100)`). Computer Use hadde heller ingen tilgjengelig nettleser. De statiske delene av `test:all` ble derfor først kjørt separat.

Brukeren kjørte deretter full `npm run test:all` 22. september: alle kontrollkommandoer, 34 Node-tester og 453 nettlesertester bestod (nettlesersuiten tok 1,1 minutt). Alle fem nye nettlesertester består, inkludert mobil/desktop, tom kø, grense og retur etter fullføring. `test-results/.last-run.json` bekrefter `passed` uten feilede tester. Agenten har sett skjermbildene `home-review-390.png` og `home-review-1440.png`; begge viser det nye repetisjonsfeltet. Offline-kontrollen bekrefter bygget `4830ee6af0e99367`, og staged/ustaged diff-kontroll er grønn. Implementasjon og verifikasjon er ferdig; commit, push og eventuell publisering gjenstår. `.git` er skrivebeskyttet for agenten i denne økten.
