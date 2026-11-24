# Samordnet skolekandidat — 10. november2026

Mål: samle den eksisterende innloggingsrettingen, skolelivsløp/retensjon og pairedgjenopprettingskoden til én kildefrosset, lokalt verifisert kandidat; deretter kontrollere faktisk mulig staging uten å omgå eksterne porter. Beads y8nr under rbec.4 er levende ansvar/status. Ingen nye produktfunksjoner, skoledata, produksjonsaktivering, databasepatch eller ny generell restoreprøve.

## Kildevalg og avgrensning

Hovedarbeidsmappen på codex/school-launch-readiness er omfattende endret. Den skal ikke stashes, resettes, committes samlet eller overskrives. Isolert nygren codex/integrated-school-candidate-20261110 bygges fra reviewet e52e046 etter e6dfc01, med seks pairedrestorefiler fra b29782c/source-hashes. Rootens nyeste eksisterende grunnapp/innhold/byggeverktøy/nye frontendtester kopieres med eksplisitt filutvalg og hashmanifest, uten .env/hemmeligheter, .git/.beads/.worktrees/output/node_modules/cache. Eksisterende statiske assets kan reflinkes/kopieres; ikke bruk mutable hardlinks. node_modules kan bare lenkes til eksisterende låste lokale testavhengigheter.

Backendens e52e046 er nyere enn root: elevskoleinvitasjon009, livsløp010/011/012, journal005/006, writebarrierer, MFAkrav, retention-/restore-/reopeningvern skal bevares. Ikke kopier eldre rootserver over dem. Nyest rootcontent-catalog genereres fra gjeldende grunnapp. Konkrete authdeltaer porteres separat: lokal app/issuer sammevertsnavnkrav og tilhørende negativ configtest, native logoutHTML/CSRFoppfriskning hvis disse ikke allerede finnes i base. Test-first for faktiske gap; ingen svakere MFA eller tilbakeføring av invitasjons-/slettevern.

## Nødvendige integrasjonskontroller

Felles browserfixture tests/helpers/school-server.js og HTTPflyt tests/server/school-flow.e2e.test.mjs må bruke ALLE kandidatens app-/journalmigreringer, ikke bare001–006/001–002. Bruk eksisterende filenumerasjon/syntetiske roller og hold migrationprivileges-testens særskilte roller intakte. Bevar eksisterende elevinvitasjon/tilgangsnegative prøver. Samme browserfixture skal kunne bruke lokal nativePGfixture for nødvendig reell PGkontroll dersom eksisterende harness kan gjenbrukes uten ny generell bevismotor. Ingen ekte Feideutstedelse simuleres som hostedbevis.

Kontroller runtimekrevd migrering012/journal006 og oppdatert migrationDigests/reopening_state. Gamle kvitteringer må avvises, ikke oppdateres blindt for å åpne deploy. Gjenbruk lifecycle-native- og reopening-/restoretester som berøres av samordningen. Ingen ny råbackup/fullrestorerunde med uendret lokal TLSkode.

## Verifikasjon og levering

Eksakte kommandoer med Node22.23.4: npm run build:app; node --test tests/server/config.test.mjs tests/server/school-flow.e2e.test.mjs tests/server/retention-job.test.mjs tests/server/school-lifecycle.test.mjs tests/server/school-agreement-retention.test.mjs; Playwright tests/school-login-logout.spec.js tests/school-offline-answer.spec.js tests/school-ui-regressions.spec.js (dersom sistnevnte finnes i kandidaten). Utvid bare ved konkret feil; sluttgate npm run test:all. Separat eksisterende nativePG17fixture prøver de nye migreringene, stans/eksport/purge og begrensede roller. Browser4områder skal faktisk lærer→elev→lærer, desktop+mobil, kontobytte og ett nektet svar/tilgangstilfelle. Gjenbruk eksisterende HTTP/browserscenarioer og legg bare manglende dekning til.

Read-only hosted metadata10.november: appstaging er17.6 og migrert001–011,4skoler,0aktive policyer. Ikke hev at ny012/006 er installert. Før hostedendring må stagingproveniens, kildefrys, journaltilstand, riktige credentials/reopeningdigester og rollbackkrav være oppfylt. Brukerens punkt1 autoriserer syntetisk stagingkontroll; det overstyrer ikke separat databasepatch/restore-/elevport. Hvis disse hindrer hostedkjøring, lever én faktisk prøvd lokal stagingkandidat og dokumenter eksakt hostedrest. Ikke publiser til main eller flytt appalias som erstatning.

Ferdig lokalt: ren isolert commit, kildehash/samordnet filvalg, grønn fullgate, faktisk fireområders brukerflyt og avgrenset nativeSQLkontroll, review0critical/major, varig bundle/patch/kildepakke og Beadsoppdatering. Hostedprøve rapporteres bare for den kandidaten som faktisk kjører; lokal OIDC er ikke ekstern Feide. Disk er ca1GiB; ikke slett andres filer/jobber for å få plass, eller bygg store nye bevisrammeverk.


## Avdekkede integrasjonsgap og endelig sammenslåing

Vertsnavnkravet ble først observert rødt og deretter portert uten å svekke lærerMFA. Nettleserfixture brukte bare001–006/001–002; faktisk migrering012/006 er nå kontrollert i delt schemahelper for tre eksisterende lokale fixtures. Native oppstartstest viste Missing expected rejection når012manglet: runtime krevde kun11/5; nå12/6 og6nativeprøver består med egencontainer fjernet. De bevarte backendfilene for app/sesjon/OIDC/recovery/reopening og012/006 er ellers uendret fra e52.

Selektiv overskriving av hele index fra root mistet allerede implementerte baserettelser i lokal leksebygger/import/lydavspilling. Dette ble avdekket av eksisterende regresjoner; ikke bortforklart ved å fjerne tester. Endelig index bruker ekte treveisgitmerge: e52ours,d45fellesbase,rootens kildeøyeblikkstheirs. Bare2konflikter: generertbuildID(regenerert) og importfeedback vs nyere5MBhelper(beggebeholdt). Basens valgbevaring, feltfeil/elevinstruks, importalias, lydreplay og øvrige eksisterende rettinger beholdes. En gammel nedlastingstest er gjort eksplisitt ved å krysse av ønsket ar-verbgruppe, fremfor å stole på et uønsket forhåndsvalg.55målrettede regresjoner er grønne. Byggverktøyets eksisterende docs/kultur-assets måtte tas med i kildeutvalget; ingen nytt innhold er laget.

Paired6filer er cherry-picked uendret som425197e, sammehashersomb297.70utvalgte eksisterende Q-/pair-/guardianprøver består. Historisk22.23.2runtime var borte; offisieltarkiv/SHA256kontrollert og brukt med sin ekte versjon for uendrede protokolltester, deretter fjernet for diskplass. Kandidatapp/build/fulltest kjører22.23.4. Første forsøk på disse protokolltestene feilet på manglendehistoriskruntime og et feil modulnavn; logger beholdes. Ingen nyfullrawrestore, nyproviderimplementering eller produksjonsforbindelse.

Hostedmetadata er lest10.november, app001–011 og journal001–005,begge17.6. Ingen012/006 eller nye kildebundne reopeningdigester er installert eksternt. Lokale fullschema-/OIDC-/browserprøver bruker PGlite;6separatenativePG17.11prøver beviser SQL/barrierer/runtimeavslag. Dette er ikke hostedFeide eller en nativePGbrowserflyt. Hostedrestore-/reopeningporten omgås ikke. Beads y8nr/rbec.4 beholder eksternstagingkontroll som faktisk gjenstående leveranse. Sluttgate/kildecommit/hash/bundle dokumenteres i leveransepakken; ingen publisering.

Testene måtte også treveissammenslås:9felles specfiler,6rene og3med små konflikter. Faktiske UIklikk og gamle assertions beholdt; .first()bevartfra basen for2tilsiktede top/bottom-grammatikkknapper.83målrettede tester består. Ingen ny produktendring eller sletting/skip av tester fra denne samordningen.
