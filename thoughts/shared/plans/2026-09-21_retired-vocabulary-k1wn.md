# Utgått glose og svarvarianter

Beads: `spansk-ungdomsskole-k1wn`.

## Funn

GitHub Pages ble hentet direkte 21. september 2026. Publisert bygg er `abeb444db7efc350`; lokalt bygg før endring er `9028eaf8e4ba8273`. Den publiserte HTML-filen inneholder `sjokoladedrikk / el Cola Cao` og bare `voy a hablar sobre` i fasiten for `jeg skal snakke om`. Begge canonical-filene og lokal HTML har allerede fjernet Cola Cao og godtar både `voy a hablar sobre` og `voy a hablar de`.

Review-filen er en arbeidskopi. Flyten er review → canonical → innebygd ordliste og fasit i index.html → bygg → publisering. Lokal filendring oppdaterer ikke GitHub Pages.

Brukeren bekreftet at skjermbildet kom fra første økt i inkognitomodus. Tidligere lagrede kort er derfor ikke forklaringen på denne hendelsen. Den direkte nedlastingen fra serveren bekrefter at en fersk bruker får den gamle ordlisten og fasiten.

## Avgrensning etter presisering

Ingen endring av elevlagring inngår i denne leveransen. Et påbegynt testutkast for lagrede kort ble fjernet etter brukerens presisering. Ingen produksjonskode ble endret.

Begge ønskede innholdsrettelser finnes allerede i lokal kildekode. Det som gjenstår for den rapporterte hendelsen, er publisering av rettet innhold og verifisering på GitHub Pages. Eksisterende lokale endringer fra andre oppgaver må ikke publiseres utilsiktet.

Mulig separat oppfølging: `mergeNewVocabulary()` beholder lagrede kort som ikke lenger finnes i standardordlisten, blant annet for å bevare egne gloser. Eventuell utfasing for eksisterende brukere krever en avgrenset løsning som bevarer fremgang og sikkerhetskopi. Dette er ikke årsaken til skjermbildet.

## Verifisering

Direkte katalogkontroll og kjøring av appens faktiske rene svarfunksjoner i Node bekrefter: Lokalt finnes ikke Cola Cao i standardordlisten; både `voy a hablar de` og `voy a hablar sobre` godtas av glose- og quizvurderingen; `vas a hablar de` avvises. Den publiserte HTML-filen inneholder Cola Cao og avviser `voy a hablar de`.

Playwright kunne ikke starte Chromium i denne øktens sandbox (`bootstrap_check_in ... Permission denied`). Ingen nettleser- eller full regressjonskjøring er derfor bekreftet i denne undersøkelsen. `git diff --check` kontrolleres før overlevering.

Publisering er en egen leveranse og utføres bare når brukeren ber om det. Eksisterende lokale endringer fra andre oppgaver skal bevares og skal ikke publiseres utilsiktet.
