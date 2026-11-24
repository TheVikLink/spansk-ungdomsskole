# Lokal integrasjon av Spansk du kjenner igjen

Beads: spansk-ungdomsskole-7rvg. Gren: codex/madrigal-local.

## Beslutning og avgrensning

Porter den eksisterende skyimplementasjonen til lokal utviklingsapp. Testpakken er en eldre appvariant: hele index.html, CSS, service worker og lyd skal derfor ikke kopieres over. Hent originale kildeendringer fra skychatten og behold lokal kultur, uttaleskole, skoleflyt og eksport/import. Ingen publisering.

## Integrasjon

Temaet får separat medlemskapskilde med stabile kanoniske ord-ID-er. Nye ord og svar redigeres gjennom det opprinnelige kildeendringsskriptet mot vocabulary-canonical-review.json, aldri ved å rekonstruere autoritativ fasit fra ferdigbygget HTML. Sync validerer referanser og bygger en offline-kopi. Porter temavisning, avgrenset oppdagelsesrunde, lærerveiledning og ordinær temaøving. Bevar kulturkontekst i eksisterende øving, men tøm den når temakort velges eksplisitt.

Oppdagelsesrunden skal kreve forsøk før fasit, telle hint separat og aldri lagre råsvar eller fremgang. Ordinær øving bruker samme kort og fremgang som kategoriene. Ingen ny persondata, lyd eller ekstern tjeneste.

## Verifikasjon

Kjør de overførte tema- og byggtestene rødt før implementasjon. Kontroller deretter temaflyt, avbrudd, riktige/gale svar, kortidentitet, import/eksport og offline. Kjør build:app, check:vocabulary og test:all. Åpne lokal app og kontroller desktop/mobil. Håndter eventuelle faktiske regresjoner før levering; dokumenter uavhengige miljøfeil ærlig.
