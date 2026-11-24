# Drift og beredskap – utkast, må innføres

## Klargjøring for første kundeskole — 16. november 2026

Skoleworkeren fjernet én utløpt auditpost ved planlagt kjøring i staging. Utløpt testpolicy ga HTTP 503 og bekreftet DOWN-varsel til driftskontakten. En separat stagingprøve bekreftet journalcommit før appcommit. Testprosjekt, roller og skoledata er ryddet. Monitoren er pauset og den godkjente syntetiske journalposten er beholdt. [Prøve- og oppryddingslogg](skoleworker-aktivering.md#scheduler-feilprøve-og-varig-friskmelding).

For én kundeskole foreslår Oversikt daglig kjøring kl. 02.15 UTC, 15 minutters varslingstoleranse og `audit_days=27` innenfor den foreslåtte 30-dagersfristen. Ved vellykket daglig kjøring og tom restkø velges poster innen de er 28 dager gamle. Det gir om lag to døgn til å håndtere forsinkelse og restkø. Jobben tar høyst 100 auditposter per skole per kjøring. I produksjonsprøven kontrollerer operatøren faktisk alder på eldste gjenværende post. Bevaring ved en konkret hendelse følger særskilt dokumentert instruks.

Ved DOWN eller uteblitt kjøring kontrollerer ansvarlig eller stedfortreder siste commit og om en full batch etterlot restkø. De retter årsaken, kontrollerer neste kjøring og følger opp eldste post før 30-dagersfristen. Ved opphør registrerer operatøren tidspunkt for stans, autorisert eksportmottaker og kanal, samt dato for aktiv sluttsletting. Slettebekreftelsen oppgir faktisk status og frister for aktive data, kopier og journal hver for seg.

| Hvem | Beslutning før oppstart |
| --- | --- |
| Ole Henrik Vik | Utpek den som mottar alarm og har myndighet til å handle ved fravær. |
| Skoleeier | Bekreft skole og avtaleperiode, instruks om tilgangsstans og sletting, den foreslåtte auditterskelen, autorisert eksportmottaker og sikker leveringskanal. Oppgi kontakt og stedfortreder for hendelser og rettighetskrav. |
| Begge parter | Fyll inn datoer og ansvar i aktiveringsprotokoll og DBA C/D. Avstem journal- og kopifrist mot dokumentert leverandørgrunnlag. |

Produkteier har godkjent **5 USD per måned** for den varige skoleworkeren og **operativ stopp ved 3 USD**. Registrer prosjektvis forbruk ved oppstart, etter første kjøring og som del av den daglige driftskontrollen. Stans den dedikerte skoleworkeren etter databaseførstprosedyren ved 3 USD eller ved fare for å overskride rammen før neste kontroll. Før eventuell gjenstart avklarer operatøren årsak, forbruk og restkø. [Stoppanvisning](skoleworker-aktivering.md#stopp-database-først-deretter-ny-cron-og-monitor).

## Fersk driftskontroll — 12. november 2026

Den globale stagingjobben kjører fortsatt automatisk. To lesninger viste `run_count=673`, siste kjøring 08:40:06 UTC og deretter 674, siste kjøring 09:40:06 UTC (10:40:06 Europe/Oslo). Ingen manuell jobbkjøring ble brukt. Rollen global_auth_job_staging har LOGIN, forbindelsesgrense 2, ingen SUPERUSER/BYPASSRLS; første lesning viste 0 forbindelser. Vercel-prosjekt prj_4LQ7snZivDli7obto0BdOcMEJyzo er fortsatt på READY-deploy dpl_5kf9Nkcg4u15uGj2unzVqkGaE7Z4 med full Vercel-beskyttelse.

Healthchecks viste up, ny ping etter 09:40-kjøringen, intervall én time og toleranse 15 minutter og aktiv e-post til olevik91@gmail.com. Novemberoversikten viste All good. Ingen ny feil eller uteblitt kjøring ble fremprovosert, og ingen ny alarm er hevdet mottatt. De faktiske feil-/uteblitt-/gjenopprettingsalarmene fra 15. oktober er fortsatt historisk testbevis. Ikke stopp en frisk jobb bare for å gjenta dem.

Prosjektets egen Vercel Usage-side, alle produktkategorier i perioden 4. november–4. desember, viste avrundet infrastruktursum USD 0,00 og abonnementssum USD 0,00. Dette er prosjektvis forbruk, ikke tidligere begrenset teamsample. Tallene kan være inntil én time forsinket og er avrundet; de beviser ikke eksakt nullkostnad eller framtidig hardcap. Eksisterende globaljobbstopp ved USD 3 eller risiko for å overstige USD 5 beholdes. Ny skoleworker får egen kostnadsbeslutning før aktivering.

Samordnet appmigrering 012, journalmigrering 006 og 23 kildebindinger er nå faktisk installert/prøvd. Ordinær Feide/MFA/lærer–elevkjede uten cookieinngrep er bestått; bare stagingappdomenet har eierbestilt unntak fra Vercel-innlogging. Skoleworkeren er fortsatt bevisst inaktiv, med 0 aktive skolepolicyer. Seks medfølgende serverkilder er byteidentiske med dagens samordnede kandidat; ingen ny implementasjon er nødvendig. Den daterte pakken fra 9. november beholdes som historikk; bruk [gjeldende aktiveringsanvisning](skoleworker-aktivering.md) for eventuell ny separat bestilling. [Ferskt bevis og kostnadsskjermbilde](../../output/operations-readiness-2026-11-12/verification.json).

Etter eiergodkjent cacheopprydding er installasjons-/stopputkastene også prøvd på lokal PostgreSQL 17.11 med 11 beståtte kontroller og bekreftet fjerning av egen disponibel testcontainer. Dette lukker lokal verifikasjon av utkastene; hosted skoleworker, nye roller/monitor/policy og mottatte alarmer ved faktisk aktivering står fortsatt separat.

Eldre daterte tilstandsopplysninger nedenfor er historikk. Ingen kundeskole, produksjonsjobb, ny rolle, ny monitor eller ny scheduler er aktivert 12. november.

## Gjeldende kontroll 9. november 2026

**Ansvarlig:** Ole Henrik Vik, eier og daglig leder, eierbekreftet9.november. Kontakt: olevik91@gmail.com. Støtte på hverdager med første svar innen to arbeidsdager er eierbekreftet. Privat hendelsestelefon kan kontaktes hele døgnet og utleveres direkte til kundens kontakt. Ingen navngitt reserve eller garantert døgnbemannet responstid er oppgitt. Ny pilotskole/gratispilot er ikke krav for salg; teknisk beredskap og kundeavtale før aktivering består.

### Det som faktisk kjører

Den globale OIDC-/pendingjobben er **aktiv i separat staging**, ikke bare et utkast. Lesende kontroll av appstaging viste mode=permanent,605kjøringer og siste kjøring9.november12:40:06UTC (=13:40:06Europe/Oslo). Siste rapport hadde0utløpte OIDC og0pendingøkter å slette. En ny lesning ved avslutning viste neste planlagte kjøring13:40:06UTC (=14:40:06Oslo),run_count606. Det bekrefter videre kjøring mellom de to kontrollene. Dedikert rolle er LOGIN,ikkeSUPERUSER,ikkeBYPASSRLS,connectionlimit2. Vercel-prosjekt spansk123-retention-staging har forventet READY-deploy dpl_5kf9Nkcg4u15uGj2unzVqkGaE7Z4/Node22. Dette er samlet bevis for faktisk kjøring, ikke bare at prosjektet finnes.

[Driftspakken fra15.oktober](../../output/global-auth-permanent-2026-10-15/README.md) har kilde, timeplan, minsteprivilegium, faktisk feil-/manglende-kjøring-alarm, kostnadsramme og DB-first-stopp. Den tidligere teksten om at ingen varig global jobb var aktiv, var foreldet. Ikke installer eller aktiver denne jobben på nytt. Historisk monitorbevis er ikke ny bekreftelse på mottatt alarm9.november.

Fersk kontroll under dette arbeidet viste fortsatt permanent global jobb,run_count607,last_run14:40:06UTC/15:40:06Oslo9.november. Samme lesende kontroll viste0aktive skolepolicyer og0uferdige skolejobber. Dette er metadata fra gjeldende staging, ikke en ny aktivering eller bekreftelse på fersk mottatt alarm.

### Det som ikke er aktivert for kundeskoler

Lesende kontroll:0aktive skolepolicyer,0aktive globale policyer i det separate school_ops-løpet,0uferdige skolejobber. Siste skolejobb startet15.oktober08:07:42UTC. Eksisterende globale authjobb er uavhengig av disse utløpte testpolicyene og dekker ikke læringsdata, skoleinvitasjoner, skoleopphør eller journal/kopiutløp.

Skolevis retensjon skal aktiveres fra avtalte skolefrister med den eksisterende journalførte løsningen. Gjenbruk ikke rollene med datert20261014-navn, utløpte policyer, gamle engangs-SQL-pakker eller testens1-dagsfrister. For hver faktisk kundeskole knyttes policyversjon til signert instruks, rapportmodus og prøve med bevaring av andre skoler. Ingen kunde er aktivert her.

### Daglig operativ kontroll og avvik

Operatøren kontrollerer siste global-jobbkøring og monitorstatus mot én-timesplanen og15minutters toleranse fra den eksisterende driftspakken. Ved manglende kjøring/503 eller utilgjengelig journal: undersøk innloggings-/nettverks-/leverandørfeil; ikke omgå sperren ved å kjøre jobben med migrator. Nye feilsignaler må bare inneholde minimale tekniske opplysninger. Undersøk/tøm aldri skoledata for å få grønn helsesjekk.

Kontroller prosjektforbruk mot den eksisterende USD5/månedsgodkjenningen og stoppgrensen USD3 eller konkret risiko for overskridelse. Den ferske Vercel-billing-lesningen returnerte komplett **teamsammendrag**, men bare et begrenset utvalg prosjektposter. Den beviser ikke komplett forbruk for akkurat workerprosjektet. [Eksisterende prosjektvise CLI-oppskrift](../../output/global-auth-permanent-2026-10-15/README.md) må brukes med kontrollert prosjektbinding, eller komplett eksport må innhentes; ikke bruk teamsummen som prosjektkvittering. CLI-forsøket9.november startet uventet en innloggingsflyt selv med --non-interactive og ble avbrutt uten autentisering. Ikke gjenåpne device-login eller hent kontotokens som en automatisk driftsjobb.

Ved nødvendig stopp brukes kun gjennomgått DB-first-stopp for denne jobben: NOLOGIN/EXECUTE-revoke før avslutning av egne jobbforbindelser, deretter stans av cron og varslet pause av monitor. Se [stopp-SQL](../../output/global-auth-permanent-2026-10-15/activation/stop.sql). Kontroller aktuell tilstand før utførelse. Ingen global teampause, ingen stans av appalias og ingen ny oppstart med gamle testcredentials.

### Gjenoppretting og oppgradering

Begge stagingdatabaser er ferskt bekreftet17.6.1.171/SQL17.6. Sikkerhetsadvisor viste0ERROR/0WARN og forventede INFO om RLS uten policies på interne tabeller (11app/3journal). Ikke opprett åpne policies for å fjerne INFO. [Konkret oppgraderingsgrunnlag](gjenoppretting-og-oppgradering.md) samler fersk kompatibilitet, eksisterende restoremetode, faktisk manglende integrasjon og rekkefølgen før patch. Databaser er ikke oppgradert i denne kontrollen.

### Gjenstående før produksjonsdrift

Global stagingjobb er bekreftet aktiv. Skolevis avtalepolicy, tilhørende varig scheduler/varsling, full dekning av journal/kopier, fersk prosjektvis kostnadskontroll, avtalt håndtering ved fravær og ekstern restore/patch er fortsatt egne krav. Drift for ekte elever kan ikke beskrives som ferdig innført på grunnlag av den globale jobben. Avtaler skal gjengi denne faktiske avgrensningen.

## Historisk status15.oktober2026

Sterk lærerinnlogging, skoleeksport/skolevis sletting og faktisk tidsstyrt skoleopprydding med tre mottatte e-postalarmer er eksternt verifisert med syntetiske data. Testjobben er stengt og monitoren pauset. Appalias peker på dpl_JDFreRwe8D3SZCiqGRd3S62ui3qw, appkilde37220f1, Preview/arn1; app/journal er friske. Se [pilotstatus](pilotskole/pilotstatus.md) og [kvitteringer](../../output/retention-cron-2026-10-15/README.md).

Begge databaser rapporterer fortsatt17.6.1.171; dashboard tilbyr17.11.0.003. Fysiske daglige backups er faktisk listet, men isolert leverandørrestore, målte RPO/RTO og kopi-/journalutløp er ikke verifisert. [Forberedt driftsprøve](../../thoughts/shared/plans/2026-10-15_pilot-restporter-og-driftsprove.md) beskriver resterende handlinger og beslutninger. Global OIDC-/pending-opprydding (fuoa) er installert privat hos migreringseieren og har [bestått avgrenset ekstern engangstest](../../output/global-auth-staging-2026-10-15/README.md). Midlertidig migratortilgang er stengt og opprinnelige grants gjenopprettet. Ingen varig global jobb er aktivert; avtalt policy, jobbtilgang og varig drift er fortsatt åpne porter. Tidligere formuleringer om at ingen ekstern scheduler finnes gjelder historikken og det gamle loopback-skriptet; de skal ikke brukes som dagens status.

## Historisk underlag – les med statusavgrensningen ovenfor

## Ekstern stagingstatus 8. oktober 2026

Vercel og Supabase er valgt for staging og som planlagte produksjonsleverandører, men skoleeiers godkjenning og full driftsaksept gjenstår. Begge Supabase-prosjektene i Stockholm har nå TLS-håndheving aktivert og verifisert avvisning av ukryptert forbindelse. Aktiv Vercel-staging er 8. oktober flyttet til en verifisert Preview med funksjonskjøring i Stockholm (`arn1`). Helsesjekken på `app.spansk123.no` bekrefter begge databaser og ferskt `arn1::arn1`-svar; anonym tilgang er fortsatt beskyttet av Vercel SSO. Regionen for logger, bygg, support og øvrige plattformtjenester er en separat avklaring. Se `vercel-migrering.md` for bevis og tilbakeføring.

Retensjonsskriptet nedenfor avviser eksplisitt eksterne databaser og produksjonsmodus. Det kan derfor ikke legges direkte i en ekstern scheduler. Det må først få en separat, gjennomgått driftsvei med godkjent policy, minste privilegium, syntetisk test og alarm. Kontoutløp er ikke det samme som fysisk sletting. Gjeldende kode rydder bare lukkede lekser med frist som er gamle nok; den realiserer ikke automatisk skoleårsslutt for alle opplysninger.

Supabase rapporterer PostgreSQL 17.6.1.171 på begge prosjekter. Leverandørens oppgraderingsvarsel til 17.11 krever kompatibilitetskontroll og gjenopprettingsplan; ingen oppgradering er utført i denne kontrollen.

## Tidligere lokal modell og rutineutkast


Det finnes lokal Compose-konfigurasjon for to PostgreSQL-databaser, én for skoledata og én for tilgangstilbakekall. Dette er ikke produksjonsdrift eller valgt hosting. Ingen datalokasjon, underleverandør, supporttilgang, kostnad, SLA, backupmål eller driftsansvarlig er bekreftet.

## Kommunikasjon og utgående tilganger

| Fra → til | Formål og protokoll | Lokal tillatelse / identitet | Produksjonskontroll som må verifiseres |
|---|---|---|---|
| Nettleser → app | Skoleflate og same-origin API over HTTPS | Fast `PUBLIC_ORIGIN`; ingen CORS-allowlist åpner API-et på tvers av origin | DNS, TLS-terminering, edge-headeroverskriving, WAF og kommunale nettverk |
| App → Feide | OIDC Discovery, token/UserInfo/JWKS og RP-logout over HTTPS | Én fast issuer `https://auth.dataporten.no`; annonserte OIDC-endepunkt må bruke samme origin. Sluttbruker kan ikke gi appen en URL å hente fra | Registrert client ID, faktisk discovery/redirect, utgående firewall-DNS og Feide-endepunkt |
| App → skole-PostgreSQL | Skolekontoer, medlemskap, lekser og resultater via PostgreSQL TLS | Egen `app_runtime`-rolle med minste databaseprivilegium; migrator/provisioner er egne roller | Leverandørens TLS/CA, nettverksregel, secret manager og eventuell kortlivet DB-identitet |
| App → journal-PostgreSQL | Append-only tilgangs-/slettingsjournal via PostgreSQL TLS | Separat journal-database/runtime-konto uten UPDATE/DELETE; forbindelse er obligatorisk for tilgangskontroller | Separat database/credential, TLS/CA, isolert nettverksregel og restore-/overvåkingsløp |
| Produksjon → øvrige eksterne adresser | Ingen brukerdefinert URL-fetch, e-post, analytics, filopplasting eller tredjeparts API er implementert | OIDC issuer-origin er eneste eksterne applikasjonsintegrasjon. Byggverktøy/installasjon hører ikke til runtime-trafikk | Egress-policy bør blokkere øvrige mål og drift må liste overvåking, backup, admin, DNS og loggtransport før godkjenning |

`/healthz` og `/api/runtime-mode` er bevisst offentlige, minimale appstatusruter. Helsekontrollen oppgir bare tilgjengelig/ikke tilgjengelig for app og sikkerhetsjournal; runtime-ruten oppgir bare om lokal syntetisk OIDC-testmodus er aktiv. Det finnes ingen admin-, debug- eller metrics-API. Produksjonsplattform kan begrense statusrutene til interne health probes dersom arkitekturen krever det.

DB-forbindelsene bruker separate permanente databasekontoer i nåværende kode. Hemmelighetene er konfigurasjonsverdier, ikke short-lived workload identity. Produksjonsoppsett må avklare vault, minst mulig secret-read policy, og om plattformen støtter kortlivede databased credentials.

## Lokale kommandoer

- `npm run setup:school-demo` – lager lokale tilfeldige demohemmeligheter i ignorert `.env`.
- `npm run school:db:up` – starter lokale Postgres-containere i det dedikerte Compose-prosjektet `spansk123-school-local` (krever Docker).
- `npm run school:db:stop` – stopper de lokale databasecontainerne og bevarer syntetisk testdata/volumer.
- `npm run school:migrate` – kjører migreringer når lokal konfigurasjon er tilgjengelig.
- `npm run school:seed` – syntetisk demoskole; kun eksplisitt lokal modus.
- `npm run school:oidc` og `npm run school:start` – separate syntetisk identitetstilbyder/skoleapp-prosesser.
- `npm run school:retention` – krever eksplisitt `MIGRATION_DATABASE_URL`, `SCHOOL_LEARNING_RETENTION_DAYS` og `SCHOOL_AUDIT_RETENTION_DAYS`; viser antall i en transaksjon som rulles tilbake. `npm run school:retention -- --apply` krever i tillegg separat `SECURITY_JOURNAL_DATABASE_URL` og journalfører hver lekse før sletting. Skriptet avviser produksjonsmiljø og ikke-loopback-databaser. Kun lukkede, utløpte lekser eldre enn policyen samt utløpte tekniske poster slettes.
- Elev eller lærer kan slette sin egen Feide-konto fra skoleområdet. Bekreftelsen sletter Feide-identitetsbindinger, læringshendelser, mottakerkoblinger og tilganger ved alle skoler, ugyldiggjør økter og erstatter visningsnavnet med «Slettet konto». Kontoens interne UUID beholdes som et minimalt tombstone fordi skolelekser og sikkerhetslogger har fremmednøkler til brukeren. Separat `user_deleted`-journal lar restore utføre slettingen mot eldre snapshots før åpning. Gjeninnlogging med samme `sub` oppretter en tom konto uten gamle skolemedlemskap/resultater.
- `npm run school:owner -- activate|block` – registrerer/aktiverer skoleeier for valgte, blokkerte skoler eller sperrer eierens aktive skoler. Krever `NODE_ENV=production`, `SCHOOL_OWNER_BOOTSTRAP_ENABLED=true`, en separat TLS-kontrollert `SCHOOL_OWNER_PROVISIONING_DATABASE_URL` og godkjenningsreferanse. Sperring krever også separat `SECURITY_JOURNAL_DATABASE_URL`; alle skole-tilgangsgenerasjoner journalføres før skoleeierdatabasen endres. Kommandoen verifiserer ikke eierinstruksen; operatøren må dokumentere den uavhengig. Gjenaktivering roterer tilgangsgenerasjonen, og tidligere medlemskap blir ikke gjenopprettet automatisk. Den er PGlite-testet, ikke kjørt mot en ekte skole.
- `npm run school:bootstrap-admin` – særskilt førstegangsoppretting etter uavhengig verifisert skoleeierinstruks. Krever `NODE_ENV=production`, `SCHOOL_ADMIN_BOOTSTRAP_ENABLED=true`, en separat TLS-kontrollert `SCHOOL_PROVISIONING_DATABASE_URL`, eksakt Feide `subject`, operatør-ID, godkjenningsreferanse og skole-ID-spesifikk bekreftelsesfrase. Kommandoen låser skoleregisteret, avviser en skole som allerede har aktiv administrator, blokkerte/gjenkalte identiteter, elevkontoer og gjenoppliving av tilbakekalt medlemskap. Den skriver en append-only provisionshendelse. Kommandoen er syntetisk testet, aldri kjørt mot en ekte skole; den erstatter ikke uavhengig eierverifisering.

`npm run test:school:postgres` er en lokal, destruksjonsavgrenset gjenopprettingsøvelse for syntetiske data. Den lager en ny `pg_dump -Fc`, gjenoppretter til et tilfeldig lokalt database-navn med `pg_restore`, journalfører en syntetisk kontosletting etter dumpens journal-kontrollpunkt og kjører `verifyRestoredSchoolDatabase` før gjenopprettet database åpnes. Testen kontrollerer at identitetsbinding og medlemskap slettes, kontoen blir et slettet tombstone, og øktene tilbakekalles. Testdatabasen og dumpfilen fjernes etterpå. Den faktiske 2026-09-28-kontrollen brukte `postgres:17-alpine`, image-digest `sha256:b0f9560a2de083e2cc7382e75f808c7381a32852a7ec49117deedb300e552b24`, PostgreSQL 17.11 og syntetiske data. Den brukte samme lokale Docker-instans for kilde og restore, ikke et eksternt eller isolert gjenopprettingsmiljø.

Ingen produksjonskommando eller deploy er kjørt. Retensjonskommandoen, kontosletting og journal-replay er lokalt testet; faktisk lokal PostgreSQL dump/restore med nyere journal-replay består nå også. Ingen scheduler er satt opp: driftsleverandøren må planlegge `school:retention -- --apply` med vedtatt policy og separat journaltilkobling, overvåke resultat/feil og dokumentere operatør. Leverandørbackup, backupkryptering, isolert katastrofeøvelse, operativ vedlikeholdsmodus, overvåking, hendelsesvarsling og nøkkelrotasjonsprosedyre mangler fortsatt.

Før drift må leverandør og skoleeier navngi ansvarlige, vedta rotasjon/tilgang/patching, databehandler- og underdatabehandleravtaler, region/land, backupkryptering, isolert restoreøvelse, hendelsesvarsel, avvikling og kostnad. Sikkerhets-/beredskapsrutiner i dette dokumentet er **utkast – må innføres**.

15.10: Varig global OIDC/pending-worker er [klargjort og lokalt verifisert](../../output/global-auth-permanent-2026-10-15/README.md), men ikke aktivert. Eier godkjenner drift/test, men bare innen eksisterende abonnementer. Vercel har ingen virksom null-ekstrakostnadssperre (team200USD/PauseOff); konkret kostnadsbeslutning gjenstår før nye rolle-/credential-/cronendringer.

## Skoleopphør og ny inaktiv jobbpakke — 9. november

Eier har bekreftet leverandørforslaget i [policyarket](pilotskole/pilotpolicy-og-kontakter.md): data i avtaleperioden, tilgangsstans ved opphør, 30 dager til eksport og aktiv sletting, appaudit 30 dager. Skoleeier må bekrefte instruksen. Kopi-/journalfrister skal bare avtales når de kan dokumenteres.

Operatøransvarlig er Ole Henrik Vik. Ved opphør registrerer han eksakt skole, instruksjonsreferanse, opphørsdato og eksport-/slettefrist i det tilgangsbegrensede driftsregisteret og setter en datert oppfølgingspåminnelse. Kunde-/slettefrister hører ikke hjemme som elevdata i et offentlig issue. Skoleeierens eksport leveres sikkert til bekreftet mottaker; lokal eksportfil får tilgangsbegrensning og slettedato.

Kandidaten bruker eksisterende eksplisitt, tidsavgrenset `delete`-autorisasjon for stans/sluttsletting og egen `export`-autorisasjon for eksport. `suspendSchoolForClosure` krever journalføring før appcommit, sperrer bare denne skolen, tilbakekaller økter/tilganger og beholder eksportgrunnlaget. `exportSchool` er operatørfunksjonen i 30-dagersvinduet; eleven skal ikke logges inn igjen for å eksportere. `deleteSchool` er separat siste trinn med journalføring før purge. Preview er standard; `apply:true` krever faktisk instruks og riktig operatørrolle. Etter hvert trinn kontrolleres skoleavgrensning, journal og restdata. Andre skoler og delte brukerkontoer skal bestå.

`learning_keep_until` skal dekke hele avtale-/eksportperioden for nye policyer. Den må ligge senest ved policyens utløp; planlegg fornyelse av avtale/policy før utløp. Blokkerte skoler får audit-/teknisk rydding, men ingen bakgrunnssletting av læringsdata, også etter denne datoen. Bakgrunnsjobben kan verken eksportere eller sluttpurge. Derfor er den navngitte operatørens fristoppfølging nødvendig. Alarm ved jobbfeil/uteblitt kjøring erstatter ikke denne oppfølgingen.

Den [lokale leveransepakken](/Users/olehenrikvik/spansk-ungdomsskole/output/school-operations-and-sales-2026-11-09/README.md) inneholder ny, separat og inaktiv skoleworker. Forslag: daglig 02:15 UTC i `arn1`, egen monitor med samme UTC-plan og 15 minutters grace. Pakken har tom cronliste, `enabled:false`, ingen passord og ingen ny skyressurs. Aktivering krever nytt separat prosjekt, nye begrensede loginroller, framtidig avtale-/credentialutløp, konto-/kostnadsavklaring, godkjent skolepolicy, kildebundet migrerings-/stagingbevis og feil-/uteblitt-alarmprøve. Ikke gjenbruk oktoberfixtures eller stopp global authjobb.

Ved feil eller mettet batch (20 lekser/100 tekniske rader) signaliseres feil selv om en delbatch er journalført/slettet. Neste kjøring kan rydde resten; operatør undersøker og måler restkø før friskmelding. Et eksakt grenseantall kan gi konservativt varsel uten kjent restkø. Ved stans sperres først bare de nye dedikerte jobbrollene i databasen og eksisterende tilkoblinger avsluttes kontrollert; bekreft avvist login. Deretter fjernes den nye cronplanen og monitoren pauses. Appens alias og den eksisterende globale jobben skal ikke endres. Ingen slik aktivering eller stans er gjort her.
