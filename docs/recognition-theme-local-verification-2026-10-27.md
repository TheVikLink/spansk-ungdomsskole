# Madrigal-tema integrert i lokal utviklingsapp

27. oktober 2026. Beads: spansk-ungdomsskole-7rvg. Gren: codex/madrigal-local.

## Leveranse og kildegrunnlag

Temaet «Spansk du kjenner igjen» er flettet inn i den eksisterende lokale appen. 87 medlemmer, 18 startord, ti oppdagelsesoppgaver, lærerveiledning og ordinær øving med felles kortidentitet/fremgang. 69 nye kanoniske ord; totalt 591 standardord. Lokal kultur, uttaleskole, skoleflyt og eksport/import er beholdt.

Kildeendringene ble lest fra skychatten «Utforsk Key To Spanish for Spansk123» (01a167dc-80d5-708d-abde-216755fc007b). Det opprinnelige innholdsskriptet ble brukt mot den eksisterende review-kilden, med de senere kanoniske rettingene for fjernsyn og doktor. Fasitkilden ble ikke rekonstruert fra ferdigbygget HTML. Temadata og startrekkefølge samsvarer med den nedlastede testpakken. Den ferdige temakoden er overført avgrenset, uten å erstatte hele appen eller eldre lydfiler.

En ny integrasjonstest viste at kulturkonteksten fortsatt var synlig etter overgang til temaet. Inngangen tømmer nå denne konteksten før visning. Den overførte restart-testen ble tilpasset knappens faktiske tilgjengelige navn, «▶️ Start ny økt».

## Fersk verifikasjon

Alle kommandoer brukte Node 22 fra /opt/homebrew/opt/node@22/bin. Chromium-testene fikk lokal tilgang utenfor sandkassen; ingen nye avhengigheter ble installert.

- npm run build:app: bestått. Bygg-ID bd54406f2ffd7a16.
- node --test tests/recognition-theme.test.mjs tests/vocabulary-authority.test.mjs: 25 bestått.
- Fokuserte temaflyter i Chromium: 9 bestått, inklusive kulturavbrudd, forsøk før fasit, hint, feil/riktig svar, navigasjon, kortidentitet, eldre sikkerhetskopi, eksport/import og offline.
- npm run test:all: avsluttet med kode 0; 89 enhetstester, 52 servertester og 554 nettlesertester bestått. Innholds-, ordliste-, uttale-, kultur-, katalog-, CSS- og offline-byggkontrollene besto også.
- Mobil og desktop ved 390 og 1280 piksler: lærerhjelp, ordliste, tastatur, feiltilbakemelding og fravær av horisontal overflyt kontrollert. Mobilforsiden visuelt gjennomgått.
- npm run check:vocabulary og git diff --check: bestått etter integrasjon.

Lokal utviklingsapp åpnet på http://127.0.0.1:8767/. Ingen commit, push eller publisering. Oppdagelsesrunden lagrer ikke råsvar eller fremgang; ordinær øving bruker eksisterende lagring. Uavhengig spansklærervurdering gjenstår i spansk-ungdomsskole-efn8.
