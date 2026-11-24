# Skolevis drift og salgspakke før supportsvar

Mål: klargjøre eksisterende skoleavgrenset opprydding/avvikling for varig drift og ferdigstille en ærlig, kundeutfyllbar salgspakke. Live status/ansvar er Beads twkq/zq9b, under rbec.4; denne filen beskriver gjennomføringen, ikke en parallell oppgaveliste.

## Utgangspunkt og avgrensning

Eksisterende hovedarbeidsmappe er omfattende endret. Ny isolert codex/school-operations-and-sales i /private/tmp/spansk123-school-operations-2026-11-09 er hentet fra varig lokaltransportbundle e6dfc01. Tidligere /tmp-arbeidsmapper er borte; tidligere bevis består uendret i output. Lifecycle-koden har policyavgrenset retensjon, separat skoleeksport/-sletting og egne bakgrunns-/operatørroller. Oktoberpakken er utløpt og bundet til fixture/rolenavn; den skal ikke gjenaktiveres. Global authjobb berøres ikke.

Skolepolicy, kundeaktivering, nye credentials/skyressurser/kostnader, produksjonspublisering og ekstern restore/patch inngår ikke i lokal klargjøring. Ingen nye persondatakategorier eller leverandører. Ingen ny skolepilot eller generelt bevisrammeverk. Kodeendringer krever konkret avdekket mangel, test først og sikkerhetsreview før implementering.

## Avklaringer sendt før avhengige endringer

Eier er spurt om4995total/én skole/to klasser/12måneder/30dagers betaling/ingen automatisk fornyelse; om forslag til skoledata gjennom avtaleperioden og eksport/sletting innen30dager etter opphør, audit30dager uten udokumenterte backup-/journalløfter; om faktisk støttevindu/reserve/privat hendelseskontakt. Svar er ikke mottatt ennå. Disse verdiene skal ikke innføres som vedtatt instruks. Kunde-/skoleeierinstruks bekreftes særskilt før faktisk aktivering.

## Gjennomføring etter avklaringer

Avstem vedtatte frister mot eksisterende school_ops.retention_policy og skillet mellom løpende aldersretensjon og full skoleavvikling. Bakgrunnsrollen skal fortsatt ikke kunne eksportere/purge skoler. Avvikling bruker allerede autorisert operatør, journal før appcommit og eksakt skoleavgrensning. Klargjør nytt, inaktivt og konkret konfigurerbart driftsunderlag med minst privilegium, avtaledato/policyreferanse, feil-/uteblitt-kjøring-varsling, kapasitet, kostnad og DB-first-stopp. Bare nødvendig kode etter konkrete gapfunn; ikke kopier gamle fixture-IDer, passord, utløp eller SQLbootstrap. Eksakt filliste og eventuelle interfaceendringer fastsettes etter eierens policyvalg, deretter adversarial review.

Ferdigstill skoleavtale, DBA C/D, kontakt-/policyark, leverandørvedlegg og salgsavslutning med samme verdier. Prisens avgiftsbehandling skal samsvare med faktisk registreringsstatus. Offentlig DPA/liste er skilt fra kontoaksept og faktisk bruk/land/support/logg/kopier. Kundeopplysninger/signaturer beholdes som felt; ingen elevlister. Begrens service-/RPO/RTO-løfter til prøvd drift og faktisk bemanning.

## Filer

Eksisterende kodegrunnlag: server/school-retention-operations.js, server/retention-job.js, server/school-lifecycle.js, migrations010/011 og tests/server/*retention*/school-lifecycle*. Kandidatendringer isoleres i kodegrenen og arkiveres med sourcehash/patch/bundle. Hovedrepoets docs/feide/skoleavtale.md, databehandleravtale.md, pilotskole/pilotpolicy-og-kontakter.md, drift-og-beredskap.md, salgsavslutning.md og nytt leverandorvedlegg/ oppdateres.

## Verifikasjon og ferdigkrav

Bruk Node22.23.4 fra offisiell SHA256-kontrollert release, uten systeminstallasjon. De tidligere22.23.2-bevisene er historiske, ikke oppgradert ved omskriving. Nærtest: node --test tests/server/retention-job.test.mjs tests/server/school-lifecycle.test.mjs tests/server/retention-access.test.mjs. Før levering av kode: relevante nye negative tester, nativeprøve ved SQL/rolleendring og npm run test:all med komplette eksisterende testavhengigheter. Dokumentendringer: bd list --json, git diff --check, samsvar av vedtatte verdier og kildehash. Ingen ekstra skoledataforespørsler eller eksterne mutasjoner.

Ferdig klargjøring betyr en gjennomgått, prøvd/inaktiv driftskandidat og sammenhengende salgspakke med avgrensede kunde-/akseptfelter. Faktisk aktivering beskrives bare som utført dersom særskilt bestilt og observert. Ukjente leverandørvilkår eller manglende bemanning skal synliggjøres konkret, ikke fylles med ønsket tekst.

## Konkret uavhengig feilretting: synlig kapasitetsgrense

Funn: runRetentionCycle markerer fullført selv om SQLens maksimale batch20lekser eller100tekniske/auditrader treffes. Da kan en kø bli liggende uten feil-/kapasitetssignal i varig drift. Dette kan rettes uavhengig av eierens fristvalg.

Endre bare server/retention-job.js og tests/server/retention-job.test.mjs i isolert gren. Etter vellykket cleanupSchool-commit oppdages treff på eksisterende SQLgrenser(assignmentIds.length>=20; deletedAuditEvents/deletedSchoolInvitations/deletedClassInvitations/deletedSessions>=100). Andre skoler skal fortsatt behandles, men avsluttende job_run.status skal bli failed og kallet skal kaste eksisterende generiske RETENTION_PARTIAL. Allerede journalført/slettet delbatch skal ikke rulles tilbake eller beskrives som ugjort. Neste kjøring fortsetter med resterende data og kan bli frisk når en ikke-mettet batch faktisk er fullført. Globalpolicy optionaltekniske counts100 behandles tilsvarende uten å endre global_auth_stage-jobben. Ingen ny SQL/rolle/schema/endepunkt eller frist. Normal20-grense kan gi et konservativt alarmflagg selv når nøyaktig20gjenstod; dokumenter dette som bevisst valg, ikke påstand om kjent restkø.

Test først med eksisterende PGlite-lifecyclefixture:21gyldige gamle lekser, aktiv syntetisk policy; første kjøring journalfører/sletter20men må avvises/ledgerfailed, én står igjen. Andre kjøring journalfører siste, blir completed, gjentakelse endrer ikke data. Bevar originaltests for andre skoler/journalfeil. Egen100OIDC-raders grense kontrolleres uten å blande global_auth_stage med school_ops.cleanup_global_expiry. Kommando node --test tests/server/retention-job.test.mjs; deretter samme ni relevante lifecycle-/accessprøver og fulltest før kodelevering. Stage-worker-copy som faktisk brukes av SupabaseEdge holdes synkron kun gjennom eksisterende stage-worker.mjs; dette er ikke deploy. Lag source/patch/bundle i ny outputpakke.

Kapasitetsreview runde1: APPROVED,0critical/0major/1minor. Rapportmodus(apply=false) må fortsatt kunne vise fulle batcher. Rettelsen begrenses derfor til faktisk apply; rapportmodus inngår i testen. Første bevis:9eksisterende lifecycle/retention/access-tester består i gjenopprettet arbeidskopi med Node22.23.4; ingen produktkode endret på dette tidspunktet.

Kapasitetsretting ferdig lokalt: isolert commit76bfde0,3filer.2nye tester observert røde før hver minimalretting,5nærtesterOK. Fulltestexit0:47generelleNode+101skoleNode+483Chromium;4nativeoptinskips,ingen nySQL/rolleendring. Generert Supabase-kopi identisk. SluttreviewAPPROVED0uavklarte. Bundle/patch/kilder/hasher/logg i output/school-operations-and-sales-2026-11-09. Ingen ekstern aktivering.

Kildeavklaringer som nå er innarbeidet: Healthchecks tilbyr ikke kundesignertDBA for egen operatørbehandling; payloadgrensen er absolutt ingen skole-/elevdata. Roterende100/1000pinglogger er ikke en fastdagsfrist, egnekopierinntil2mnd. Brreg mva=false underbygger prisforslag uten oppgitt mva-beløp. Eierens3svar er fortsatt nødvendige før frist/pris/bemanning fastsettes.

Avdekket mulig neste nødvendige kodegap dersom eksportgrace velges: én skole må kunne stanses uten purge, mens skoleeierens øvrige skoler forblir aktive. Eksisterende blockSchoolOwner sperrer hele eieren; eksisterende skolepurge er permanent. Ikke bruk noen av disse som en udokumentert erstatning for en skoleavgrenset stansfase. Ingen slik ny funksjon/rolle er innført før policyvalget er avklart.

## Eieravklaringer mottatt9.november — skoleopphør

Eier har valgt inntil6klasser per skole, bekreftet leverandørforslaget om data i avtaleperioden/umiddelbar tilgangsstans/eksport og aktiv sletting senest30dager etter opphør/audit30dager. Backup-/journalfrister begrenses til dokumenterbar drift og skoleeiers instruks. E-post og første svar innen2arbeidsdager er bekreftet. Privat sikkerhetstelefon kan kontaktes hele døgnet; nummeret lagres kun i ignorert0600kontaktfil .env.school-operations-contacts. Ingen navngitt reserve eller døgnbemannet svartidsgaranti er oppgitt. Pris4995ogbetalings-/fornyelsesvilkår behandles som konkret tilbudsforslag til siste eiergjennomgang, ikke som allerede sendt bindende tilbud.

## Konkret stansfase og bevaring i avtaleperioden

Implementer den manglende skoleavgrensede stansfasen uten ny jobbrolle/ny generell autorisasjonstype. Den eksisterende eksplisitte autorisasjonen operation=delete for eksakt skole/ref/utløp omfatter skoleavvikling; samme autorisasjon brukes for det mindre irreversible trinnet suspendSchoolForClosure. Det er ikke en generell skoleadministrasjonsfunksjon.

Ny appmigrering012_school_closure_window.sql: prepare_closure/apply_closure i privat school_ops. Sjekk eksisterende delete-autorisasjon, eksakt skole og ikke-deleted status, bruk samme skolelås som øvrige endringer og lås skolens økter før journal. apply gjentar autorisasjonskontrollen, setter bare denne skolen blocked, sperrer egne skole-/klasseinvitasjoner og tilbakekaller/skrubber egne økters idtoken/acr slik eksisterende recovery gjør. Medlemskap/lekser/resultater beholdes for autorisert eksport; andre skoler og delte kontoer beholdes. GRANT bare school_data_operator; ikke PUBLIC/app_runtime/school_retention_operator. Gjenåpning/reaktivering er ikke del av operasjonen.

Ny journalmigrering006_school_closure_window.sql: record_closure krever eksisterende journal_school.authorization for eksakt skole/grant/ref/utløp, tar samme advisorylock, skriver bare idempotent school_blocked og avviser konfliktende grantreason. Den skriver ikke school_deleted. GRANT kun journal_school_operator; aldri journal_runtime eller bakgrunnsretensjon. Eksisterende deleteSchool/record_deletion er fortsatt separat siste trinn.

server/school-lifecycle.js får suspendSchoolForClosure med preview som default. Eksakt skole/ref valideres, BEGIN→prepare→påkrevd journal.suspendSchoolForClosure→apply→COMMIT; journalfeil gir rollback, uklart appcommit etter bekreftet journal kan ikke gjenåpne skolen. Ingen global konto-/eiersperring. Native concurrencybevis må dekke en allerede autorisert skriver og at opptatt skole avvises før journalkall.

012 legger også nullable learning_keep_until til eksisterende retention_policy med stabil CHECK finite og<=expires_at. Gjeldende prepare_retention fra011 gjenbrukes ordrett bortsett fra at læringsdata ikke velges når keep_until ligger i fremtiden. Teknisk utløpsrydding og audit følger fortsatt avtalt policy. Nye skoleforslag binder keep_until til slutt på avtalt eksportperiode; gamle NULL-policyer virker uendret. Dette er ikke automatisk full skolepurge: stans/eksport/sluttsletting er egne autoriserte operatørtrinn med datert frist og hendelsesvarsling; vanlig bakgrunnsrolle skal fortsatt ikke kunne eksportere/purge en skole.

Oppdater migrationDigests med bokstavelige nye SQL-stier, slik at gamle deployment-/restorekvitteringer ikke kan godkjenne ny kode. Nye lokale plan-/nativeprøver er ikke hostedmigrering. Kjør ikke gamle migrator-/bootstrap-/testrollepakker. Nye migreringsfiler følger prosjektets eksisterende nummererte app-/journalhistorikk.

Testførst: PGlite stans preview, journalfeil, eksakt/grenseutløpt/fremmed autorisasjon, bevart skoleeksport/øvrig skole/delt konto, nektet elevskriving og begrensede roller. Separat faktisk journal-PGlite fra eksisterende migreringer: kun blokkering, ikke sletting, idempotens/konflikt og feil skole/ref. Læringsdatafloor fremtid→bevart mens gammel audit ryddes; NULL/passertfloor→gammeladferd. NativePG17på disponibel lokal database: skrivebarriere før/etter stans og ekte journalfør appfase, med cleanup av egen container/database. Nærtester først, deretter fulltest. Ingen nye avhengigheter, ingen ekstern rolle/grant/policy/skyressurs/deploy.

Presisering etter avstemming: blokkert skole må fortsatt få avtalt audit-/teknisk opprydding under eksportperioden. Dagens retention_targets/prepare_retention avviser blocked helt.012 må derfor inkludere godkjente active/blocked-policyer i den samme begrensede køen, men aldri velge læringsdata fra blocked skole, heller ikke med passert/NULLkeepfloor. Sluttpurge er fortsatt egen autorisert operasjon. Ingen nye bakgrunnsrettigheter utover eksisterende policybaserte funksjoner; slettet skole forblir utelukket. En ny regresjon skal først vise at blocked skole forsvinner fra jobben, deretter bevise auditrydding og bevarte lekser både før/etter floor. Native stansprøve får samme kontroll.

## Varig jobbpakke uten aktivering

Etter stans-/retensjonskoden klargjøres én selvstendig worker for den eksisterende Vercel-modellen. Gjenbruk endpoint.mjs og monitor.mjs fra den gjennomgåtte oktoberpakken som server/retention-endpoint.js og server/retention-monitor.js. Ny server/school-retention-worker.js validerer fast binding og dedikerte miljøvariabler, lager TLS-verifiserte pg-pooler til de kjente stagingdatabasene og bruker runRetentionCycle(apply=true,globalPolicyVersion=null). Worker får ingen eksport-/purgerettigheter og berører ikke global authjobb.

Bindingen er inaktiv som standard. Krev konkret prosjekt/team, arn1, fremtidig sluttdato og nye begrensede jobrollenavn. Avvis app-prosjektet og eksisterende globalworker-prosjekt, utløpte oktoberroller, brede database-URL-er og service-/migratorhemmeligheter. Avvis miljøet ut fra variabelnavn før verdier leses. TLS rejectUnauthorized=true, fast pooler5432, max1forbindelse per database. Kontroller faktisk sesjonsrolle med en fast metadataquery: eksakt loginrolle, ingen superuser/BYPASSRLS/createdb/createrole/replication,connlimit1–2,fremtidig credentialutløp og bare forventet gruppe med inherit=true,set=false,admin=false.

Gjenbruk det begrensede endepunktet med tom POST og, ved eksplisitt cronvalg, GET. Ingen query-/bodyoverstyring av policy. Run/status skal være usunt ved0godkjente active/blocked-policyer. Helsesvar viser bare aggregert jobbstatus. Monitoren mottar bare tomme start/success/failure-signal og tilfeldig runID, aldri elevdata, skole-ID-er, antall, telefon eller råfeil. Hendelsestelefonen skal ikke lastes opp til monitoren.

Lever en inaktiv standalonepakke med api/retention.mjs,status,pg/zod i eksisterende låste versjoner,kildekopier og crons=[] i output/school-operations-and-sales-2026-11-09/worker. Kildeadapteren i server/bruker validerte bindinger. Nytt separat prosjekt og nye DBroller opprettes først i særskilt bestilt aktivering. Daglig02:15UTC er driftsforslaget, ikke aktivert cron eller nullkostnadsgaranti. Monitorens plan/grace må matche samme UTCplan. Konto-/plan- og konkret prosjektkostnad må dokumenteres før aktivering. DB-first-stopp gjelder bare nye navngitte jobbroller, deretter eget prosjekt/monitor; aldri globalworker/appalias.

Test først konfigurasjonsavslag, miljøavslag før hemmelighetslesing, ingen grønnstatus ved0policyer, TLS/endepunktgrenser, minimal monitorpayload og rollemetadata. Bruk eksisterende nativeSQLfixture for faktisk rollequery når mulig. Lokale stubs er ikke hostedbevis. Ingen ekstern skyressurs, monitor, e-post eller rolleendring. Slutt-review og fulltest etter kildefrys, med kilde-/pakkehasher og entydig inaktiv status.


## Sluttavstemming av kandidaten

Workerkode-review fant1major(manglende POSTGRES_URL/DB_URL/PG*-avslag) og1minor(48timers helsevindu). Getter-regresjon observert rød før majorretting; nå avvisning før verdilesing og1455minutters helsegrense. Sluttreview av kilde+inaktivpakke APPROVED0uavklart. Vercels faktiske dokumentasjon har PROJECT_ID/REGION, ikke TEAM_ID; teamtilhørighet kontrolleres på plattformen, og SCHOOL_JOB_TEAM_ID er eksplisitt operatørbekreftelse.

Native PostgreSQL17.11 sluttprøve5/5bestått, inkludert faktisk restricted LOGINmetadata og stans→eksport→blocked auditrydding→purge, andre skoler bevart. Egen syntetisk container fjernet og fravær kontrollert. Standalonepakke npmci15eksakte eksisterende pakker og faktisk inaktivHTTP503består. Ingen elevdata/skyendringer. Første fulltest traff macOSsandboxens MachPortPermissionDenied ved Chromiumstart; egen runner avbrutt og nærdiagnose dokumentert. Fulltest kjøres på nytt med nødvendig lokal nettlesertilgang; sluttkvittering følger leveransepakken. Dette er samme kandidat, ingen ny kodeendring etter review.

Eierens svar er innarbeidet i skoleavtale/DBACD/policy/kontakt/drift/personvern/salg. Seks klasser,4995prisforslag,30dager eksports-/aktivedatafrist,30dager appaudit,hverdagsstøtte/to arbeidsdager og privat hendelsestelefon. Ingen navngitt reserve eller døgnbemannet responsgaranti. Kontoaksept, dokumenterbare kopi-/journalfrister, kundespesifikke felter og faktisk skole-/produksjonsaktivering forblir separate, synlige porter. GoogleDrive-overføring er bare klargjort som Gemini-prompt; ingen Driveendring er utført.

Sluttgate9.november: test:all exit0 på uendret gjennomgått kandidat,47generelleNode+111skoleNode+483Chromium,6optinskips. Separat native5/5pass,cleanupConfirmedtrue. Isolert commit e52e046 følger76bfde0; hovedarbeidsmappen er ikke endret til denne grenen eller publisert. Varig bundle/patch/kilder, ny inaktiv standalonepakke, dokumentfrys og bevis arkiveres i output/school-operations-and-sales-2026-11-09.

Frosset sluttcommit er også nativeprøvd på nytt: en første engangsrunner traff midlertidig bootstrapserver gjennom socketreadiness og57P03 på nettverksstart. Kun engangsrunneren er endret til TCP-readiness; ny disponibel container gir5/5pass, cleanuptrue. Ingen produktkodeendring/retest av gammelrestore. Begge kvitteringer/feillogg er bevart.
