# Skoleworker: klargjort aktivering og kontrollert stopp

Gjeldende underlag 12. november 2026, Beads `spansk-ungdomsskole-twkq` / `spansk-ungdomsskole-rbec.4`. Dette er en kjørebeskrivelse for en separat bestilt stagingaktivering. Ingen roller, passord, prosjekt, monitor, skolepolicy eller cron opprettes av dokumentet. Den leverte [workerpakken fra 9. november](../../output/school-operations-and-sales-2026-11-09/worker/README.md) beholdes som datert artefakt, med `enabled:false`, `cronEnabled:false`, tom cronliste og ubundne prosjekt-/rolle-/utløpsfelt. Ikke rediger denne historiske pakken for å aktivere drift.

## Kilde og kjent tilstand

Den samordnede kandidaten er `ecd63b92e3ce287f02e4e779be469d49a5fb826d`, bevart i [kandidatpakken](../../output/integrated-school-candidate-2026-11-10/verification.json). Den aktive appstagingen er `dpl_9bN6ms4U6pN9rQ13VYFr4J3U4CEw`, appbygg `fcdf97b55d8da417`, med den dokumenterte minimale pakkefiksen. [Ekstern kontroll 12. november](../../output/external-staging-control-2026-11-12/README.md) dokumenterer appmigrering 012, journalmigrering 006 og det faktiske 23-kilderegisteret. [Forventet register](../../output/external-staging-control-2026-11-10/candidate-23-source-registry.json) er sammenligningsgrunnlag; ikke erstatt dette med gamle 21-kildekvitteringer.

Alle seks JS-modulene i den daterte workerpakkens `server/` er kontrollert byteidentiske med den samordnede kandidaten. [Daterte kildehasher og testbevis](../../output/school-operations-and-sales-2026-11-09/verification.json) og kandidatens senere fulltest/nativebevis skal følge den nye aktiveringskopien. Gjenopprett om nødvendig kandidaten fra den bevarte bundlen; en midlertidig `/private/tmp`-mappe er ikke et varig bevis.

Den eksisterende globale OIDC-/pendingjobben er en annen jobb. Fersk kontroll 12. november viste `run_count=674`, siste databasekjøring `09:40 UTC` / `10:40 Europe/Oslo`, monitor oppe og UI-subtotal `$0.00` avrundet for perioden 4. november–4. desember. Avrundet subtotal er ikke bevis på null faktisk forbruk. Ikke reinstallér, stopp eller bruk globaljobbens prosjekt, rolle, credentials eller monitor for skoleworkeren. Se [globaljobbens omfang og historiske alarmprøve](../../output/global-auth-permanent-2026-10-15/README.md).

## Opplysninger som må være bekreftet før utførelse

Operatøren fører følgende i et tilgangsbegrenset aktiveringsregister. Tomt felt stopper aktivering; ingen eksempel-ID, testfrist eller gammel kundeinstruks skal brukes som erstatning.

| Parameter | Krav |
| --- | --- |
| Godkjenningsreferanse | Separat bestilling av den konkrete stagingaktiveringen, testomfanget og etterfølgende varig kjøring. |
| `new_project_id` | Nytt, separat Vercel-prosjekt i `team_vbTSmrsQP36kI7suHkpG3xE4`, faktisk kontrollert i plattformen. Skal verken være app-prosjektet `prj_ZkpH7ePktR22CbXM0jwqALH73Fwn` eller globaljobben `prj_4LQ7snZivDli7obto0BdOcMEJyzo`. |
| `app_job_role` | Ny rolle som matcher `^school_retention_service_[a-z][a-z0-9_]{2,24}$`, kun i appstaging `peglwndjqnrstwnlrdsa`. |
| `journal_job_role` | Ny rolle som matcher `^journal_retention_service_[a-z][a-z0-9_]{2,24}$`, kun i journalstaging `quznpkwsapehdcmicgsq`. |
| `credential_expires_at`, `binding_expires_at` | Konkrete fremtidige UTC-tidspunkt; credentialutløp senest bindingutløp. Navngitt ansvarlig følger fornyelse før utløp. Ingen `infinity`. |
| Policy/instruks | Eksakt syntetisk skole, instruksjonsreferanse, policyversjon, avtale-/eksportdatoer og policyutløp. Før kunder: skoleeiers faktiske instruks. `learning_keep_until` dekker hele avtale-/eksportperioden og ligger senest ved policyutløp. |
| Kostnadsramme | Godkjent ramme og stoppgrense for det nye prosjektet; konto-/planvilkår og prosjektvis forbrukskontroll. Globaljobbens USD5-godkjenning overføres ikke automatisk. |
| Monitor | Ny dedikert monitor, eier/mottaker, UTC-plan og 15 minutters grace; dokumentert mottatt feil- og uteblitt-alarm før varig friskmelding. |
| Operatør/eksport | Ansvarlig Ole Henrik Vik, oppfølging ved fravær, sikker eksportmottaker/kanal og datert 30-dagersoppfølging ved skoleopphør. Ingen navngitt reserve er bekreftet. |

Denne pakken er bundet til de to eksisterende stagingdatabasene og `arn1`. Produksjon krever separat mål-/kildegjennomgang. Vercels `Production`-miljø nedenfor er cronmålet i det nye, isolerte **stagingprosjektet**; det er ikke en produksjonsleveranse av skoleappen.

Lesende kontroll 12. november bekreftet begge operatørgruppene som sikre `NOLOGIN`-grupper uten overordnede medlemskap. Installatøren `postgres` har allerede `CREATEROLE` og direkte ADMIN på hver gruppe fra `supabase_admin`, med `INHERIT FALSE` og `SET FALSE`. Ingen grant er endret. [Sanitert førkontroll](../../output/operations-readiness-2026-11-12/installer-capability-readonly.json). Dette beviser nødvendige installatørrettigheter, ikke at SQL-utkastene er kjørt.

## Førkontroll og rolleinstallasjon

**Commitrekkefølge verifisert 16. november.** Produkteier godkjente at én syntetisk post blir stående i den delte stagingjournalen. Appstaging hadde én avgrenset syntetisk skole, én policy med fem minutters levetid og én utløpt lekse. Etter journalcommit kunne en ny journalforbindelse lese den ene hendelsen mens en ny appforbindelse fortsatt kunne lese leksen. Deretter committet appens retensjonsfunksjon slettingen av nøyaktig én lekse, og en ny forbindelse bekreftet slettingen. Testskolen, eieren, læreren, klassen og policyen ble fjernet. Etterkontroll viste null aktive skolepolicyer, null kjørende skolejobber og ingen midlertidig migratortilgang i noen database. Prøven ble kjørt med SQL mot staging. Vercel Cron og mottatt Healthchecks-varsel står fortsatt åpne.

**Stagingprøve 16. november 2026.** Installasjonsutkastet opprettet én midlertidig `NOLOGIN`-rolle med én operatørgruppe i hver av de faktiske stagingdatabasene (PostgreSQL 17.6). Begge transaksjonene ble rullet tilbake. Separate etterkontroller bekreftet at begge rollenavnene var borte, gruppetildelingene var identiske med førtilstanden, og appstaging fortsatt hadde null aktive skolepolicyer og null kjørende skolejobber. App 001–012, journal 001–006 og alle 23 kildehasher ble bekreftet.

Tillatelseskontrollen viste at appgruppen kan velge retensjonsmål og utføre retensjon, og at journalgruppen kan journalføre lekser. Appgruppen mangler direkte lesetilgang til leksetabellen og kan ikke eksportere, stanse eller sluttpurge skoler. Journalgruppen mangler direkte tabelltilgang og kan ikke journalføre skolestans. Stagingkontoen `postgres` mangler skrivetilgang til skole og retensjonspolicy. Det ble derfor ikke kjørt en syntetisk retensjonsbatch. Bruk begrenset, autorisert stagingoperatørtilgang til å klargjøre én syntetisk skole og policy for neste prøve. Denne prøven opprettet ingen passord, varige roller, prosjekt, cron eller monitor.

**Syntetisk databaseprøve samme dag.** Den tidligere brukte stagingoperatørprosedyren ga `SET ROLE app_migrator` innenfor én transaksjon. Én syntetisk skole var eneste retensjonsmål. `prepare_retention` og `apply_retention` fjernet én utløpt auditpost og beholdt leksen under eksportfristen. Etter fristen beholdt en blokkert skole fortsatt leksen. Etter reaktivering identifiserte rapporten leksen som moden for sletting. Hele forsøket ble rullet tilbake. Separate etterkontroller bekreftet fravær av testskole, skoleeier, auditpost og policy, null aktive skolepolicyer og null kjørende skolejobber. Midlertidig SET-tilgang ble rullet tilbake. Prøven kjørte databasefunksjonene direkte. Faktisk jobbinnlogging, journalføring før appcommit, Vercel Cron og alarmmottak gjenstår.

**Journalprøve og ramme for planlagt test.** Produkteier godkjente en kostnadsgrense på 5 USD og bekreftet `olevik91@gmail.com` som mottaker av testvarsler. Vercel-teamet og eksisterende e-postintegrasjon i Healthchecks ble bekreftet. Vercels budsjettautomatikk gjelder hele teamet. Teaminnstillingen ble ikke endret. Journalstaging registrerte én syntetisk leksehendelse etter to like kall til `record_assignments`. Begge kallene ble rullet tilbake i én transaksjon. Etterkontrollen fant ingen journalpost eller midlertidig SET-tilgang. Lokalt bestod fem eksisterende workertester og to kontroller med testdobler for journal før apply/commit og rollback ved journalfeil. En full commit i den delte stagingjournalen etterlater en append-only-post. Full stagingprøve med opprydding av den posten må bruke en disponibel journal, eller få eksplisitt avklart at den ene syntetiske journalposten kan bli stående. Ingen ny worker, cron eller monitor ble aktivert, og ingen e-post ble sendt.

1. Kontroller prosjekt-ID for hver database med den etablerte TLS-verifiserte forbindelsen. Lagre bare saniterte mål-/TLS-/versjonsmetadata. Bekreft app 001–012, journal 001–006, funksjonseiere og faktisk 23-kilderegister mot det forventede registeret. Sammenlign full nøkkel/verdi-mengde, ikke bare antallet. Den tidligere migreringsinstallasjonen skal ikke kjøres på nytt.
2. Bekreft at det ikke kjører en ukjent skolejobb. Les eksisterende policy-/jobbledger og medlemskap før endringer. Bruk bare den godkjente syntetiske skolen i testen; ikke endre eksisterende andre skoler eller globaljobb. Registrer førtilstand for relevante skole-/journalantall, jobbroller og gruppemedlemskap uten elevrader eller credentials.
3. Kontroller at hver av de to nye rollene **ikke finnes**, og at valgt installatør allerede har `CREATEROLE` og direkte `ADMIN OPTION` på den aktuelle operatørgruppen. Gruppene skal finnes, være `NOLOGIN`, uten privilegerte flagg og uten medlemskap i andre grupper. Hvis installatøren mangler dette, stopp og avklar en konkret autorisert grantor. Ikke gi `postgres` bredere eller permanente migrator-/SET-/gruppeprivilegier for å komme videre.
4. Ved separat aktivering utarbeider operatøren endelig SQL for hver database etter at faktiske rollenavn, OID-er og grantor er kjent. SQL-utkastet nedenfor er prøvd med syntetiske roller på lokal PostgreSQL 17.11. Prøven dekket rollback, utløpsavslag, NOLOGIN ved installasjon, feil OID, faktisk avslutning av en jobbforbindelse og avvist ny login etter stopp, samt bevarte opprinnelige gruppetildelinger. [Nativekvittering og SQL-hasher](../../output/operations-readiness-2026-11-12/worker-install-stop-native.json). Dette er ikke en hosted installasjonspakke med faktiske nye identiteter. Den må konkretiseres og gjennomgås før ekstern `ROLLBACK`-prøve og eventuell separat bestilt `COMMIT`. Bruk bare bekreftede parameterverdier fra aktiveringsregisteret. Rolle/gruppenavn og datoer er ikke hemmeligheter; passord skal ikke inn i denne SQL-en. Psql-parametere gjengis med `:'parameter'` som SQL-litteraler; ikke bygg shellkommandoer ved tekstinterpolering. Den eksisterende `postgres`-installatøren er ikke superuser og skal ikke endre sine eksisterende grantortupler.

Lesende førkontroll som følger den etablerte forbindelsen (psql-parametrene inneholder bare rolle-/gruppenavn). Beviset skal ha databaseprosjekt-ID fra forbindelsens kontrollerte mål ved siden av resultatet; `current_database()=postgres` identifiserer ikke prosjektet alene:

```sql
-- Begge databaser:
SELECT current_database(), current_user, session_user,
       current_setting('server_version') AS server_version;
SELECT ssl,version FROM pg_stat_ssl WHERE pid=pg_backend_pid();
SELECT r.oid,r.rolname,r.rolcanlogin,r.rolsuper,r.rolbypassrls,
       r.rolcreatedb,r.rolcreaterole,r.rolreplication,r.rolconnlimit,r.rolvaliduntil
FROM pg_roles r WHERE r.rolname IN (current_user, :'job_role', :'operator_group');
SELECT m.roleid::regrole,m.member::regrole,m.grantor::regrole,
       m.admin_option,m.inherit_option,m.set_option
FROM pg_auth_members m
WHERE m.roleid=to_regrole(:'operator_group') OR m.member=to_regrole(:'job_role');
-- Bare appstaging:
SELECT version FROM public.schema_migration ORDER BY version;
SELECT source,sha256 FROM school_ops.migration_digest ORDER BY source;
SELECT count(*) AS running_jobs FROM school_ops.job_run WHERE status='running';
-- Bare journalstaging:
SELECT version FROM public.journal_migration ORDER BY version;
```

Eksporter ikke rå skolepolicyer til dette dokumentet. Kontroller policyversjon, skole, frister og målsett i operatørens tilgangsbegrensede register, og bruk eksisterende rapportfunksjon før apply. Rolleinstallasjon skal avvises ved TLS-avvik, feil prosjekt, kilde-/migreringsavvik, eksisterende jobbrolle eller ukjent kjørende jobb.

| Database | `job_role` | `operator_group` | `role_pattern` |
| --- | --- | --- | --- |
| Appstaging | Bekreftet `app_job_role` | `school_retention_operator` | `^school_retention_service_[a-z][a-z0-9_]{2,24}$` |
| Journalstaging | Bekreftet `journal_job_role` | `journal_retention_operator` | `^journal_retention_service_[a-z][a-z0-9_]{2,24}$` |

```sql
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '10s';
SET LOCAL idle_in_transaction_session_timeout = '10s';
SELECT set_config('school_activation.job_role', :'job_role', true),
       set_config('school_activation.operator_group', :'operator_group', true),
       set_config('school_activation.role_pattern', :'role_pattern', true),
       set_config('school_activation.credential_expiry', :'credential_expires_at', true),
       set_config('school_activation.binding_expiry', :'binding_expires_at', true);
CREATE TEMP TABLE original_operator_grants ON COMMIT DROP AS
 SELECT roleid, member, grantor, admin_option, inherit_option, set_option
 FROM pg_auth_members
 WHERE roleid = to_regrole(current_setting('school_activation.operator_group'));
DO $install$
DECLARE
  job_name text := current_setting('school_activation.job_role');
  group_name text := current_setting('school_activation.operator_group');
  expires timestamptz := current_setting('school_activation.credential_expiry')::timestamptz;
  bound_until timestamptz := current_setting('school_activation.binding_expiry')::timestamptz;
  group_oid oid;
BEGIN
  IF current_user <> session_user OR current_user <> 'postgres'
     OR current_database() <> 'postgres'
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname=current_user AND rolcreaterole AND NOT rolsuper)
     OR job_name !~ current_setting('school_activation.role_pattern')
     OR group_name NOT IN ('school_retention_operator','journal_retention_operator')
     OR (group_name='school_retention_operator' AND job_name !~ '^school_retention_service_[a-z][a-z0-9_]{2,24}$')
     OR (group_name='journal_retention_operator' AND job_name !~ '^journal_retention_service_[a-z][a-z0-9_]{2,24}$')
     OR to_regrole(job_name) IS NOT NULL
     OR NOT isfinite(expires) OR NOT isfinite(bound_until)
     OR expires <= clock_timestamp() OR expires > bound_until
  THEN RAISE EXCEPTION 'Installation preconditions differ'; END IF;
  SELECT oid INTO group_oid FROM pg_roles g
   WHERE rolname=group_name
     AND NOT (rolcanlogin OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication)
     AND NOT EXISTS (SELECT 1 FROM pg_auth_members WHERE member=g.oid);
  IF group_oid IS NULL OR NOT EXISTS (
    SELECT 1 FROM pg_auth_members
    WHERE roleid=group_oid AND member=current_user::regrole AND admin_option
  ) THEN RAISE EXCEPTION 'Existing direct group ADMIN capability required'; END IF;
  EXECUTE format('CREATE ROLE %I NOLOGIN INHERIT NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION CONNECTION LIMIT 1 VALID UNTIL %L', job_name, expires);
  EXECUTE format('GRANT %I TO %I WITH INHERIT TRUE, SET FALSE, ADMIN FALSE', group_name, job_name);
  IF NOT EXISTS (
    SELECT 1 FROM pg_auth_members
    WHERE roleid=group_oid AND member=job_name::regrole
      AND inherit_option AND NOT set_option AND NOT admin_option
  ) OR (SELECT count(*) FROM pg_auth_members WHERE member=job_name::regrole) <> 1
  THEN RAISE EXCEPTION 'New worker membership differs'; END IF;
  IF EXISTS (
    (SELECT roleid,member,grantor,admin_option,inherit_option,set_option
       FROM pg_auth_members WHERE roleid=group_oid AND member<>job_name::regrole
     EXCEPT SELECT * FROM original_operator_grants)
    UNION ALL
    (SELECT * FROM original_operator_grants
     EXCEPT SELECT roleid,member,grantor,admin_option,inherit_option,set_option
       FROM pg_auth_members WHERE roleid=group_oid AND member<>job_name::regrole)
  ) THEN RAISE EXCEPTION 'Existing operator grants changed'; END IF;
END $install$;
-- Første gjennomgåtte prøve: ROLLBACK. Varig separat bestilt installasjon: COMMIT.
ROLLBACK;
```

Etter varig installasjon bekreftes hver ny rolle som `NOLOGIN`, riktige flagg/utløp, nøyaktig én operatørgruppe og identiske opprinnelige grantortupler. Lagre rollens faktiske OID i det private aktiveringsregisteret for senere stoppkontroll. Ikke gi direkte tabell-, kolonne-, eksport-, skoleclosure- eller purgeprivilegier. Ingen ny rolle skal få medlemskap i migrator-, dataoperatør- eller runtimegrupper.

## Secrets, faktisk login og testdeploy

1. Generer nye separate app-/journalpassord i godkjent secret store, og sett dem på de eksakte nye `NOLOGIN`-rollene gjennom en TLS-verifisert, skjermet passordrutine, for eksempel psqls interaktive `\password` med det verifiserte rollenavnet. Ikke bruk passord i SQL-filer, shellargumenter, historikk, chat, skjermbilder eller bevis. Registrer bare at overlevering er fullført. Ingen gamle fixture-/migratorpassord gjenbrukes.
2. Opprett det nye Vercel-stagingprosjektet først etter separat bestilling og kostnadsbeslutning. Behold det uten cron og uten appalias. Bekreft faktisk team/prosjekt; aktiver nødvendige systemvariabler. Opprett en ny dedikert monitor som ikke er globaljobbens monitor.
3. Lag en ny aktiveringskopi av den frosne pakken. Før bekreftet prosjekt, roller og endelig utløp i `binding.json`; behold `enabled:false`, `cronEnabled:false`, `crons:[]` inntil prosjekt-/secret-/rolle-/policykontroll er ferdig. Installer med låst `npm ci --ignore-scripts` og kontrollér at de seks kildekopiene fortsatt matcher kandidaten. Før inn bare `SCHOOL_JOB_TEAM_ID`, de to nye jobbpassordene, kontrollert pooler-CA, egen `CRON_SECRET` og egen `SCHOOL_JOB_MONITOR_URL` som sensitive prosjektverdier der relevant. Ingen app-`.env`, brede database-URL-er, migrator-/service-role-nøkler eller private hendelseskontakter.
4. Bekreft uavhengig en godkjent, fortsatt gyldig syntetisk policy og rapportkjør den med eksisterende operatørrutine. Workerens POST er **apply**, ikke rapportmodus. Den aktive testen skal bare gjelde eksplisitte fixtures; på forhånd skal andre skoler/policyer være avgrenset slik at en samlet `retention_targets`-kjøring ikke behandler ukjent data. Ikke endre kundepolicyer for å få en grønn test.
5. Når førkontrollene er bestått, settes bare de to nye rollene til `LOGIN` i hver sin korte transaksjon, med OID/navn/utløp og allerede eksisterende installatør-ADMIN kontrollert før `ALTER ROLE`. Verifiser TLS-login med hver faktisk jobbcredential. Kjør den uendrede `roleQuery` og `verifyWorkerRole` fra workerens `school-retention-worker.js` gjennom de faktiske tilkoblingene. `session_user` skal være den eksakte nye rollen; `SET ROLE` fra en privilegert forbindelse er ikke et gyldig substitutt. Avvisning stopper videre aktivering.
6. Sett `enabled:true`, behold `cronEnabled:false` og tom cronliste i den nye testkopien. Deploy bare det nye prosjektet. Uten Bearer skal endepunktet avvise; med korrekt skjermet Bearer skal query/body-overstyringer avvises. Tom `POST /api/retention` skal rydde bare de godkjente syntetiske målene, med journal før appcommit, beholdt avtale-/eksportfloor, auditrydding for blokkert skole og bevaring av andre skoler. Helse skal ha korrekt ledgerstatus; en null-policy-kjøring skal gi 503. Ikke kopier credentials eller skole-/elev-ID-er til HTTP-bevis.
7. Den leverte workeren kontrollerer selv rolle/binding ved hvert kall, men attesterer ikke automatisk kildehashene eller plattformens teamtilhørighet. Den fulle 23-kildeavstemmingen og prosjekt-/teamkontrollen ovenfor er derfor obligatoriske operatørkontroller før aktivering og ved kilde-/migrationsendring.

## Scheduler, feilprøve og varig friskmelding

**Daglig produksjonsprøve 17. november.** Vercel registrerte `15 2 * * *` UTC for den dedikerte skoleworkeren. Første planlagte databasekjøring startet kl. 02.15.36,903 UTC og fullførte kl. 02.15.36,999 UTC. Den modne auditposten var borte og den yngre kontrollposten beholdt. Healthchecks mottok Started og OK fra workeren. Med testperioden på ett minutt og 15 minutters toleranse kom uteblitt-varselet til `olevik91@gmail.com` kl. 02.31.39 UTC. Prøven brukte den faktiske daglige Cron-planen og et forkortet testvindu i monitoren.

Etter e-postbekreftelsen ble Cron deaktivert, monitoren pauset og begge testrollene og de syntetiske radene fjernet. Prosjektvis forbruk viste avrundet 0,00 USD i infrastruktur og abonnement. Testdeployen og de seks Vercel-variablene venter på opprydding med fornyet CLI-innlogging. Databasetilgangene som variablene viste til er fjernet.

**Produksjonsprøven 16. november 2026.** Den beskyttede testworkeren `dpl_JEJzRcrVq2CmNob236jgoZxS1Fdg` brukte de faktiske produksjonsdatabasene, egne kortlivede roller og én syntetisk skole. Planlagt kjøring kl. 12.50.23 norsk tid committet sletting av 100 modne auditposter, etterlot én moden post og kontrollposten og ga HTTP 503 som kapasitetsvarsel. Healthchecks DOWN kom til `olevik91@gmail.com` kl. 12.50.24. Neste planlagte kjøring kl. 12.51.16 ga HTTP 200. Databasen bekreftet tom restkø og bevart kontrollpost. UP kom fram kl. 12.51.18.

Testrollene ble satt til NOLOGIN og fjernet, og testskole, eier, bruker, policy og auditposter ble fjernet. Vercel bekreftet slettet testprosjekt, og monitoren står pauset med varslingshistorikken. Jobbloggen beholdes som teknisk bevis. De godkjente produksjonsskjemaene og det beskyttede appprosjektet står klare. Testen brukte ett kort standardbygg og to dokumenterte Cron-kall. Den faktiske daglige planen og uteblitt-kjøring-alarmen gjenstår ved oppsett av den varige workeren.

### Produksjonsprøve med syntetisk skole

Bruk dette som kjøreplan etter at det separate produksjonsmålet er klargjort og kjøringen er bestilt. Den bevarte workerpakken har stagingreferansene hardkodet i `server/school-retention-worker.js`. Før bygging av produksjonskopien bindes begge databaseprosjektene og workeren til de bekreftede produksjonsmålene. Kontroller at stagingreferansene avvises av produksjonskopien, og at app- og journalprosjektet ikke kan byttes om. Bekreft TLS, app 001–012, journal 001–006, alle 23 kildehasher og rollegrensene med faktiske forbindelser. [Produksjonsmål og leveringsrekkefølge](produksjonsleveranse.md).

1. Opprett én syntetisk skole med egen policyversjon, kort utløp og registrerte test-ID-er. Bekreft at den er eneste aktive retensjonsmål. Bruk `audit_days=27`, 101 auditposter eldre enn 28 dager og én yngre kontrollpost. Bruk eksplisitte ID-er ved opprydding. Bruk auditposter til Cron-prøven, slik at produksjonsjournalen ikke får en permanent testpost fra oppryddingen. Journalrekkefølgen er allerede prøvd med separat stagingcommit.
2. Kjør rapport og kontroller mål og antall. La Cron starte første kjøring. Forvent delcommit på 100 poster og kapasitetsvarsel. Bekreft i en ny forbindelse at én moden post og kontrollposten står igjen. Neste planlagte kjøring skal rydde den siste modne posten og la kontrollposten stå. Registrer UTC-tid, HTTP-status, resultat i jobbloggen, alder på eldste restpost og mottatt DOWN/UP.
3. Prøv uteblitt kjøring ved å stanse bare testplanen mens monitoren fortsatt venter på signal. Bekreft mottatt DOWN og deretter UP ved neste vellykkede planlagte kjøring. Før endeprøven settes Cron og monitor til `15 2 * * *` med 15 minutters toleranse. Kontroller første faktiske kjøring på denne planen og at resultatet kan knyttes til riktig prosjekt og policy.
4. Avslutt med databaseførststopp. Fjern testpolicy, testskole, kontrollpost, testtilgang og midlertidig plan. Bekreft fravær av syntetiske rader og at ingen testkjøring eller forbindelse står igjen. Behold saniterte bevis for resultat og kostnad. Sjekk prosjektforbruk ved start, etter første kjøring og ved avslutning mot 5 USD per måned og operativ stopp ved 3 USD. Fyll inn de faktiske verdiene i driftsregisteret.

Prøvekvittering fylles ut med prosjekt-ID-er, deployment-ID, forventet og faktisk UTC-tid, HTTP- og jobbstatus, antall fjernede og gjenværende poster, tidspunkt for mottatte varsler og oppryddingskontroll. Feltene fylles fra faktiske resultater.

**Syntetisk Cron-prøve 16. november 2026.** Den separate workeren i `spansk123-twkq-cron-test` brukte Node 22, Vercel Authentication, egne kortlivede roller og én syntetisk skolepolicy. Begge jobbrollene bestod TLS- og rollekontroll. Vercel logget planlagte `GET /api/retention` kl. 12.28.43 og 12.29.43 norsk tid, først HTTP 200 og deretter HTTP 503. Første kjøring committet retensjon for én skole, og en ny databaseforbindelse bekreftet at den utløpte auditposten var borte. Etter at testpolicyen ble utløpt, mottok Healthchecks feilsignal fra neste planlagte kjøring. Meldingen «DOWN | twkq Cron staging test» ble bekreftet i innboksen til `olevik91@gmail.com` kl. 12.29.43.

Begge jobbrollene ble stengt i databasen før testprosjektet ble slettet. Etterkontrollen bekreftet fravær av rollene og prosjektet. Skole, eier, bruker, policy og auditpost ble fjernet. Healthchecks-monitoren står pauset med historikken, og Vercel-prosjektets lokale kobling og miljøfil ble fjernet. Prøven kjørte ett kort standardbygg og to dokumenterte Cron-kall uten kjøp eller planoppgradering. Eksakt etterskuddsført forbruk ble ikke avlest. Den tidligere godkjente syntetiske journalposten står igjen. Denne tekniske prøven bruker midlertidig minuttplan og avslutter testoppsettet etter verifikasjon. Varig drift for en kundeskole har egne krav.

Etter godkjent manuell syntetisk prøve brukes den særskilt bestilte testplanen for tidsstyrte kall. `GET /api/retention` blir først tillatt med `cronEnabled:true`; bare denne scheduled-banen sender monitorens start/success/failure. En vellykket manuell POST beviser derfor ikke scheduler eller mottatt alarm.

Prøv én faktisk, kontrollert jobbfeil og deretter uteblitt kjøring i det **nye** prosjektet, med mottatt DOWN-varsel hos bekreftet mottaker og mottatt gjenoppretting/UP. Bruk det godkjente syntetiske testoppsettet og en reversibel feil, eksempelvis midlertidig sperring av bare ny jobbrolle etter at testkøen er avklart. Ikke svekk journal-, TLS- eller rollekontroller og ikke stopp globaljobben. Dokumenter de eksakte testtidene, forventede kall, faktisk DB-/HTTP-resultat, varslingsmottak og tilbakeført testtilstand. Manglende-/feilalarm for den nye skoleworkeren er fortsatt **ikke eksternt bevist**; oktoberalarmene for globaljobben erstatter ikke denne prøven.

Før endelig overgang: stans bare den nye cronplanen og kontroller at ingen gammel testkjøring er kølagt eller aktiv. Unngå en sen testkjøring som konsumerer intervallvinduet etter overgang. Ikke nullstill jobbhistorikk eller gjenbruk globaljobbens gamle engangskorrigering. Sett deretter avtalt daglig plan `15 2 * * *` (02:15 UTC), samme UTC-plan i monitoren og 15 minutters grace. Kontroller første faktiske planlagte DBcommit, HTTP-resultat, monitorstatus og mottatt gjenoppretting. Helsevinduet er 24 timer og 15 minutter, ikke en oppetidsgaranti.

Varig friskmelding krever bekreftet kilde/mål, least-privilege-login, godkjent skolepolicy, faktisk scheduler, mottatt feil-/uteblitt-/gjenopprettingsvarsel, oppryddede syntetiske fixtures, første endelige plankjøring og ansvar for utløp/kostnad/frister. En mettet batch (20 lekser eller 100 tekniske rader) er et kapasitetsvarsel selv om en delbatch er committet; operatøren undersøker restkø og verifiserer neste kjøring. En vellykket sletting etterfulgt av monitorsvikt gir også 503 og skal undersøkes, ikke kjøres om blindt. Avtalestatus/30-dagers eksport og endelig skolepurge krever separat operatøroppfølging; workeren eksporterer eller sluttpurger ikke skoler.

## Stopp: database først, deretter ny cron og monitor

Stopp krever ikke at sletting eller eksport kjøres. Bruk bare de to eksakte nye roller og OID-er fra aktiveringsregisteret, mot hver sin bekreftede database. Aldri `global_auth_job_staging`, daterte oktoberroller, app-/journalruntime eller migrator. Ukjent/utløpt binding må undersøkes; et rollenavn som bare ligner er ikke tilstrekkelig identitet.

1. Per database: kontroller korrekt mål, eksakt rolle/OID og at installatøren allerede har nødvendig `CREATEROLE` og ADMIN på denne nye rollen. Kontroller eksisterende `pg_signal_backend`-rettighet for å avslutte jobbens forbindelser. Manglende rettighet utløser operatøroppfølging, ikke nye brede grants. Frys videre ny cronaktivering mens dette avklares.
2. Commit `NOLOGIN` og utløpt `VALID UNTIL` **før** eksisterende forbindelser termineres. Bekreft deretter rolletilstanden. Sett aldri `LOGIN` tilbake som automatisk feilhåndtering.
3. Terminer bare sesjoner som har den eksakte jobbrollen som `usename`, og kontroller etterpå at ingen slike sesjoner består. Ved feil behold tilgangsstansen, stopp ny cron og eskaler den uavklarte database-/poolertilstanden; ikke påstå at slettinger er stanset før eksisterende jobbsesjoner er borte. En pooler kan beholde forbindelser, så prøv også at en helt ny TLS-login med den tidligere jobbcredentialen avvises. Ikke lagre credentialen eller rå forbindelsesfeil i bevis.

Parametrisert stopputkast, én database om gangen; `expected_role_oid` kommer fra den faktiske installasjonen. Det samme SQL-utkastet er prøvd lokalt på PostgreSQL 17.11 med feil-OID-avslag, commit av NOLOGIN, avslutning av en faktisk egen jobbforbindelse og avvist ny login. Endelige identitets-/målasserts og pooleradferd må kontrolleres for de faktiske nye hosted rollene før aktivering. Selve stoppmekanismen er databaseførst: commit `NOLOGIN`, deretter terminer bare den eksakte jobbrollens forbindelser. Ingen gamle globaljobb-grantbroer er kopiert inn.

```sql
BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='10s';
SELECT set_config('school_stop.job_role', :'job_role', false),
       set_config('school_stop.role_oid', :'expected_role_oid', false);
DO $stop$
DECLARE job_name text := current_setting('school_stop.job_role');
BEGIN
  IF current_user<>session_user OR current_user<>'postgres' OR current_database()<>'postgres'
     OR job_name !~ '^(school_retention_service_|journal_retention_service_)[a-z][a-z0-9_]{2,24}$'
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname=job_name AND oid=current_setting('school_stop.role_oid')::oid)
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname=current_user AND rolcreaterole AND NOT rolsuper)
     OR NOT EXISTS (SELECT 1 FROM pg_auth_members WHERE roleid=job_name::regrole AND member=current_user::regrole AND admin_option)
     OR NOT pg_has_role(current_user,'pg_signal_backend','USAGE')
  THEN RAISE EXCEPTION 'Exact new worker role and existing stop capabilities required'; END IF;
  EXECUTE format('ALTER ROLE %I NOLOGIN VALID UNTIL %L',job_name,'1970-01-01T00:00:00Z');
END $stop$;
COMMIT;
SELECT rolname,rolcanlogin,rolvaliduntil FROM pg_roles
 WHERE oid=current_setting('school_stop.role_oid')::oid
   AND rolname=current_setting('school_stop.job_role');
SELECT pg_terminate_backend(pid,5000) FROM pg_stat_activity
 WHERE usename=current_setting('school_stop.job_role') AND pid<>pg_backend_pid();
SELECT pg_stat_clear_snapshot();
DO $verify_stop$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE oid=current_setting('school_stop.role_oid')::oid
     AND rolname=current_setting('school_stop.job_role') AND NOT rolcanlogin
     AND rolvaliduntil<=clock_timestamp())
     OR EXISTS (SELECT 1 FROM pg_stat_activity WHERE usename=current_setting('school_stop.job_role'))
  THEN RAISE EXCEPTION 'Worker access is not fully stopped'; END IF;
END $verify_stop$;
```

4. Når begge databaser er stengt og loginavvisning er bekreftet: fjern bare det nye prosjektets cron, deploy dets inaktive binding (`enabled:false`, `cronEnabled:false`, `crons:[]`) og fjern bare dets dedikerte jobbsecrets ved endelig avvikling. Kontroller at ingen kølagte kall fortsatt kan få databaseadgang. Pause bare dets monitor etter varslet stopp; bevar historikk og saniterte kvitteringer.
5. Bekreft at app-/journalhelse, appens Feideflyt og den eksisterende globaljobben fortsatt fungerer. Ingen appaliasflytting eller endring av prosjektets øvrige beskyttelse er del av workerstopp. Behold jobb-/journalhistorikk; ikke slett roller eller ledger for å skjule en feil.

Etter mislykket oppstart skal bare de nyopprettede komponentene gjøres inaktive med samme DB-first-rutine. Gjenstart etter stopp er en ny kontrollert aktivering med fersk instruks, gyldige bindinger/credentials og nye før-/etterbevis. Dokumentet er klargjøring, ikke en attest på aktiv skolevis drift eller produksjonsklar gjenoppretting.
