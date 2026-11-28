# Gjenoppretting og databaseoppgradering – konkret grunnlag

Avstemt 9. november 2026 for Beads ya9r/ya9r.11 og oppdatert 27. november 2026 etter gjennomført staging-oppgradering til PostgreSQL 17.12.0.002. Produktets vanlige lokale eksport/import beholdes. Dette er klargjøring for staging og senere eksplisitt produksjonslevering.

## Gjennomført staging-oppgradering til PostgreSQL 17.12 (27. november 2026)

Begge stagingprosjektene i `eu-north-1` ble etter godkjent førkontroll oppgradert in-place via Supabase Dashboard fra `17.6.1.171` til `17.12.0.002` og verifisert friske (`ACTIVE_HEALTHY`) samme kveld (`spansk-ungdomsskole-ya9r` lukket):

| Kontroll | Journalstaging `quznpkwsapehdcmicgsq` | Appstaging `peglwndjqnrstwnlrdsa` |
| --- | --- | --- |
| Status og versjon | `ACTIVE_HEALTHY`, PostgreSQL `17.12` (`17.12.0.002`) | `ACTIVE_HEALTHY`, PostgreSQL `17.12` (`17.12.0.002`) |
| Førkontroll (`17.6.1.171`) | 0 slots, 0 prepared tx, 0 MD5-roller, 0 `ltree`/`float gist`/custom ops | 0 slots, 0 prepared tx, 0 MD5-roller, 0 `ltree`/`float gist`/custom ops |
| Migreringer / hasher | 6 (`001–006`), 15 journalrader bevart | 12 (`001–012`), alle 23 SHA-256-kildehasher identiske mot kandidatregisteret |
| Roller og RLS | `journal_migrator` (`NOLOGIN`), `journal_retention_operator` (`NOLOGIN`), `journal_runtime` (`LOGIN`) | `app_migrator` (`NOLOGIN`), `school_retention_operator` (`NOLOGIN`), `app_runtime` (`LOGIN`), `global_auth_job_staging` (`LOGIN`), 0 manglende RLS på kjernetabeller |
| Security Advisor | 0 ERROR, 0 WARN, 3 INFO (interne RLS-tabeller) | 0 ERROR, 0 WARN, 11 INFO (interne RLS-tabeller) |
| Apphelse (Vercel staging) | — | `GET /healthz` på `spansk123-ay0qirjy2-theviklinks-projects.vercel.app` svarte `{"status":"ok","securityJournal":"ok"}` |

## Lokal prøve av versjonsbytte og gjenoppretting 24. november 2026

Den frosne leveransekandidaten fra 12. november ble brukt mot to isolerte lokale databaser med syntetiske data. Appmigrering 001–012, journalmigrering 001–006 og 23 kildebindinger ble installert på PostgreSQL 17.6. Journalen ble byttet til 17.12 først, deretter appdatabasen. Begge brukte sine eksisterende datavolumer. Migreringstall, skole, brukere og journalens kontrollpost ble bevart.

Den eksisterende native PostgreSQL-testen besto på 17.12 med Node 22 og gjeldende testhjelper for OIDC form_post. Den bekreftet RLS, tilgangsnekt på tvers av skoler, lærer- og elevflyt i alle fire lekseområder, samt appdump og gjenoppretting med nyere journal. To tilbakekallinger av klassemedlemskap ble gjeninnført og tre gjenopprettede økter ble sperret. Kontoens sletting og fjerning av Feide-kobling ble verifisert. En separat full journaldump ble importert i en ny lokal database. Alle fem journalrader hadde samme innholdskontrollsum, seks migreringer ble bevart og runtime kunne sette inn, men ikke oppdatere eller slette journalrader. Appens helsesjekk bekreftet begge forbindelser.

Forsøket på å bruke testscriptet fra releasearkivet feilet ved OIDC form_post. Dagens eksisterende testhjelper ble brukt med uendret runtime fra arkivet. Midlertidige prosesser og containere ble fjernet. Slettevernet avviste fjerning av de to lokale datavolumene med syntetisk innhold. Ingen ny skyressurs ble opprettet. Full Supabase-gjenoppretting og leverandørens databaseoppdatering er fortsatt utestående. SU-531462 har fortsatt ikke et teknisk svar i den tilknyttede Gmail-tråden.

## Syntetisk import til Supabase 24. november 2026

Etter eierens kostnadsgodkjenning ble `spansk123-restore-synthetic-20261124` opprettet kl. 09.18 norsk tid i Stockholm. Prosjektet kjørte PostgreSQL 17.12 fra oppstart. Prøven brukte en nettverksisolert lokal 17.11-instans og tre tabeller fra appens første migrering. En eldre syntetisk dump ble gjenopprettet lokalt. Sletting og tilbakekalling fra en separat syntetisk journal ble brukt før ny eksport til det private prøveskjemaet på Supabase.

En ny spørring på Supabase bekreftet to skoler, slettet bruker fraværende, tilbakekalt medlemskap bevart og delt brukers aktive medlemskap i kontrollskolen intakt. API-rollene manglet tilgang til prøveskjemaet, og Supabase Auth hadde null brukere. Den lokale prøvecontaineren ble stoppet.

Prøven dekker logisk import mellom PostgreSQL 17.11 og 17.12 med syntetiske rader. Oppgradering på stedet, full app-/journalgjenoppretting med produksjonsrettigheter og leverandørens backup-/API-integrasjon gjenstår. Eieren slettet testprosjektet 24. november. Etterkontroll i Supabase bekreftet at testprosjektet var borte og at begge stagingprosjektene fortsatt var synlige.

## Lesende kontroll 24. november 2026

Begge dedikerte stagingprosjekter rapporterte fortsatt 17.6.1.171 i Supabase. SQL-kontrollen fant null replikeringsslots, forberedte transaksjoner, ltree-indekskolonner, float/btree_gist-indekskolonner og egendefinerte operatorer med estimator utenfor pg_catalog i begge. Ingen eksisterende isolert Spansk123-instans var tilgjengelig. Opprettingsverktøyet oppga 10 USD per måned for et nytt prosjekt. Eier godkjente deretter opprettelse av ett tidsavgrenset prøveprosjekt. Leverandørsaken SU-531462 er fortsatt åpen for den valgte restoremetoden.

## Lesende førkontroll 9. november 2026

| Kontroll | Appstaging peglwndjqnrstwnlrdsa | Journalstaging quznpkwsapehdcmicgsq |
| --- | --- | --- |
| Prosjekt/versjon | ACTIVE_HEALTHY, eu-north-1,17.6.1.171 | ACTIVE_HEALTHY, eu-north-1,17.6.1.171 |
| Sikkerhetsadvisor | 0ERROR/0WARN,11INFO | 0ERROR/0WARN,3INFO |
| Replikeringsslots / prepared transactions | 0 / 0 | 0 / 0 |
| md5 for de undersøkte egne runtime-/jobbrollene | 0 | 0 |
| ltree-indekskolonner | 0 | 0 |
| float/btree_gist-indekskolonner | 0 | 0 |
| Egendefinerte operatorer med ikke-innebygd estimator | 0 | 0 |

Begge har plpgsql, pg_stat_statements, uuid-ossp, pgcrypto og supabase_vault installert. pgcrypto-tilstedeværelse alene sier ikke om eldre PGP-kryptert innhold finnes. Den undersøkte appen bruker Node-kryptering for ID-token, men ukjent Vault-/PGP-innhold må avklares før en full backup/import; ikke les eller dekrypter innhold som del av en metadatakontroll. Advisor-INFO gjelder interne tabeller med aktiv RLS uten policy; de skal fortsatt være stengt.

[Lesende SQL-førkontroll](../../scripts/school-upgrade-preflight.sql) kan kjøres mot **hver eksplisitt valgt stagingdatabase**, med godkjent administrativ lesetilgang og verifisert TLS. Den skriver ingen data/roller, og viser bare metadata/tall; den krever tilstrekkelig tilgang til rollekatalogen. Ikke bruk den til å hente passordverdier. Førkontrollen er et kompatibilitetsutvalg, ikke en leverandørgodkjenning eller backup.

## Valgt gjenopprettingsmetode – Eierbeslutning 24. november 2026 (Valg 2B)

Produkteieren besluttet 24. november 2026 å bruke **manuell logisk gjenopprettingsrutine med lokal journalreplay (`verifyRestoredSchoolDatabase`)** i stedet for å bygge skreddersydd automatisert Supabase Management/Auth-transport (`spansk-ungdomsskole-ya9r.11` lukkes som erstattet av manuell runbook).

To-database-arkitekturen i runtime (`appPool` + `journalPool` i [`server/revocation-journal.js`](../../server/revocation-journal.js) og [`server/recovery.js`](../../server/recovery.js)) beholdes uendret: slettede kontoer, blokkerte skoler og tilbakekalte tilganger kan ikke gjenoppstå etter en gjenoppretting fordi den separate journalen alltid spoles frem før databasen åpnes for trafikk.

### Operatørsjekkliste for manuell gjenoppretting (5 steg)

1. **Steng trafikk:** Sett applikasjonen i vedlikeholdsmodus / koble fra `DATABASE_URL` slik at ingen nye økter eller svar skrives under gjenopprettingen.
2. **Last inn app-sikkerhetskopi i isolert lokal PostgreSQL 17.12-container:** Bruk `docker compose -f docker-compose.school.yml` eller en nettverksisolert lokal instans uten ekstern tilgang.
3. **Koble til autoritativ journal og kjør `verifyRestoredSchoolDatabase`:** Kjør [`server/recovery.js`](../../server/recovery.js) (`verifyRestoredSchoolDatabase({ pool, journal, snapshotCheckpoint })`). Funksjonen verifiserer at journalens sekvens og antall rader er minst på nivå med sikkerhetskopiens kontrollpunkt, spiller av alle slettinger og tilbakekallinger i én transaksjon, og revokerer samtlige sesjoner (`app_session`).
4. **Eksporter ryddet logisk kopi og importer til skymålet:** Ta `pg_dump` av den lokalt ryddede og verifiserte appdatabasen, importer til måldatabasen på PostgreSQL 17.12, og roter `SESSION_SECRET`.
5. **Etterkontroll før gjenåpning:** Kjør [`scripts/school-upgrade-preflight.sql`](../../scripts/school-upgrade-preflight.sql) og verifiser `/healthz` (`status: "ok"`, `securityJournal: "ok"`), RLS-avslag på tvers av skoler og syntetisk inn-/utlogging før trafikk åpnes.

Metoden ble praktisk verifisert 24. november 2026 både lokalt på PostgreSQL 17.12 og ved syntetisk import til Supabase PostgreSQL 17.12 (se avsnittene øverst i dette dokumentet). Eksperimentelle lokale transportpakker under `output/local-transport-*` og `output/paired-restore-*` er historisk arkiv og inngår ikke som leveransekrav.

## Rekkefølge for oppgradering

1. Bekreft faktisk tilbudt målversjon og vedlikeholdsvindu i leverandørens oppgraderingsside. 17.11 er den kontrollerte sikkerhetsutgivelsen, ikke et løfte om hvilken versjon plattformen tilbyr på kjøringstidspunktet.
2. Fersk kompatibilitetskontroll, syntetisk dataproveniens og backupreferanser for begge databaser. Dokumenter appens/journalens sammenhengende kontrollpunkt, jobbtilstand og rolle-/TLS-oppsett. Ikke legg rådata eller credentials i repoet.
3. Fullfør og gjennomfør den isolerte eksterne restoreprøven med journalreplay, bevaring av kontrollskole, målte gjenopprettingstider og faktisk opprydding. Hvis denne ikke består, utsettes patch; ikke oppgrader først og håp på backupen.
4. Oppgrader én stagingdatabase om gangen med leverandørens støttede metode. Avklar avhengigheter før rekkefølge velges; journalens tilgjengelighet er nødvendig for appens tilgangskontroll. Ingen samtidig patch av begge, ingen tilbakeføring av originaljournalen.
5. Etter hvert trinn: bekreft versjon, TLS/CA, rolle-/RLS-avslag, migreringsregister, app/journalhelse og jobbdrift. Etter begge: ekte staging-Feide, lærer/elevoppgaver, utlogging/kontobytte, eksport/sletting og negativ tilgangskontroll.
6. Ved avvik: hold skolemodus stengt, bruk den faktisk prøvde gjenopprettingsmetoden og fersk originaljournal før gjenåpning. Ikke anta at en binær nedgradering eller samme prosjekt gjenopprettet fra gammel backup er en trygg rollback. Kontroller gjenoppretting og konto-/skolegrenser før åpning.

## Kontrollerte leverandørendringer

[Supabases 17.11-melding](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes) beskriver sikkerhetsrettelser og særskilt ltree, eldre PGP-kryptering, btree_gist og egendefinerte operatorer. [Oppgraderingsveiledningen](https://supabase.com/docs/guides/platform/upgrading) krever egne applikasjonskontroller i tillegg til plattformens tester.

[TLS-endringen tidligst 10. november](https://supabase.com/changelog/cbc-tls-ciphers-deprecated) gjelder prosjektets HTTP-API-er, ikke direkte PostgreSQL, pooler eller Management API. Kjøring med moderne klienter må likevel testes på de faktisk brukte API-veiene; ikke bruk denne endringen som forklaring på en direkte PG-feil. Changelog og veiledning er kontrollert 9. november.

Pakken viser nå hvilke førkontroller som er utført og hvilket arbeid som faktisk mangler. Den er **ikke startklar for ekstern restore eller oppgradering** før den konkrete integrasjonen og tilbakeføringsprøven består. Det er en teknisk rest, ikke behov for en ny pedagogisk pilotskole.
