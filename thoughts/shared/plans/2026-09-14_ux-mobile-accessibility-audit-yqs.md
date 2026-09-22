# UX-, mobil- og tilgjengelighetsaudit (`yqs`)

## Mål

Gjennomfør en skeptisk, evidensbasert audit av dagens lokale app uten å endre produktkode. Skill feil i committed `HEAD` fra pågående arbeid i arbeidskopien, og registrer bare reproduserbare avvik som egne Beads-saker.

## Omfang

1. Kartlegg navigasjon, semantikk, skjemaer, modaler, fokus, kontrast, bevegelse, touchmål og responsive grenser i `index.html` og relevante tester.
2. Kjør faktiske flyter for ny elev, tilbakevendende elev, lærer/import, lokal recovery/export, elevtilbakemelding, diktat/lytting og offlinebruk.
3. Verifiser minst mobil 390×844 og desktop 1440×900, samt tastaturflyt med Tab, Enter og Escape.
4. Vurder Nielsen-heuristikkene, kognitiv belastning, tydelig bokmål, aktiv læring og local-first/personvern.
5. Reproduser kandidater isolert. Registrer bekreftede avvik med alvorlighet, fil/linje, konkret konsekvens og akseptansekriterier; koble dem til `yqs` og releaseporten `w7a`.

## Ferdigkriterier

- Auditmatrisen er gjennomført med fersk nettleserevidens og relevante automatiske kontroller.
- Funn er prioriterte og duplikatsjekket i Beads.
- Pågående, urelaterte endringer er bevart.
- `yqs` er oppdatert, synkronisert og lukket først når evidensen er dokumentert.

## Resultat 2026-09-14

- Chromium-pass på 390×844 og 1440×900: ingen horisontal overflow, ingen konsollfeil og ingen sidefeil i hovedsidene. Navigasjonen målte minst 44 px høyde på mobil.
- Ny elev, tilbakevendende elev, nivåtest/start, mobilnavigasjon, lærerimport, lokal backup/recovery, elevtilbakemelding, lokal tale/lyd, diktat/lyttehistorier og offline app-shell ble dekket av nærmeste regresjonstester.
- Regresjonsresultat: 69/70 passerte. `tests/report-delivery-smoke.spec.js` har én forventningsmismatch etter sikkerhetsnormaliseringen i `ykr`: valgfrie standardfelt med `null`/`false` utelates. Dette er notert på `ykr` før releaseporten.
- Bekreftede funn er registrert som `xm3` (skjemafeltetiketter, P1), `v2p` (dialog/fokus, P1), `tv8` (synlig tastaturfokus, P1) og `qhu` (Invaders-semantikk/bevegelse, P2). Alle er koblet som `discovered-from:yqs` og blokkere for `w7a`.
- Positive observasjoner: tydelig bokmål og personvernkopi, local-first flyter uten automatisk innsending, skip-lenke/landemerker, aktiv elevrespons før fasit, og robuste mobile hovedoppsett.
