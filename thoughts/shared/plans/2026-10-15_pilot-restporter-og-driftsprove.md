# Gjenværende pilotporter og avgrenset driftsprøve

Beads zq9b/twkq/ya9r/rbec.4. Klargjøringsunderlag15.10.2026, ikke utførelsestillatelse. Bevar skitten hovedarbeidskopi, main og appalias. Ingen nye credentials, skoler, kopier, kostnader eller vedlikehold er aktivert her.

Oppdatering15.10 kl.10:53Oslo: Brukeren har etter klargjøringen godkjent rammen USD10, de avgrensede tilgangene og valg av totimers stagingvindu, med isolasjon først og restore før oppgradering. Utførelsesgodkjenningen er dermed gitt innen denne rammen. Første-oppstartsisolasjon er fortsatt uavklart; ingen ressurser eller tilganger er aktivert. Fersk kontroll og ferdig, usendt Supabase-spørsmål: output/restore-staging-2026-10-15/README.md. Historisk snapshot i pilotberedskapmappen endres ikke.

## Bekreftet nå

App- og journalstaging er ACTIVE_HEALTHY i eu-north-1. ManagementAPI17.6.1.171 og SQL17.6. Dashboard tilbyr17.11.0.003 på begge. Databasestørrelser omtrent12,9MB/11,2MB; ingen logiske replikeringsslots, ingen cron.job/net.http_request_queue, ingen reg*-kolonner i de gjennomgåtte brukerskjemaene og ingen md5-passord på de to navngitte runtime-rollene. Dette er avgrenset preflight, ikke Supabases fullstendige kompatibilitetskontroll. Ingen hashes/passord er hentet ut.

Begge dashboard viser fysiske kopier8.–15. oktober. Nyeste appbackup15.10 kl.04:15:57Oslo og journalbackup04:38:31Oslo. Synlig historikk er ikke bevis på maksimal intern kopioppbevaring. De faktiske snapshotene er tatt før15.10-fixturen72d03374 ble opprettet, så vi har ikke dokumentert en leverandørbackup med akkurat den nye slettede fixturetilstanden. Lokal pg_dump/restore med journalreplay er allerede prøvd; det erstatter ikke leverandørrestore.

## Restoreprøven som må gjøres før oppgradering

En ny isolert leverandørklone kan gi merkostnad og kopierer databaseinnhold, roller og sikkerhetsrelevante innstillinger. Før bestilling må nøyaktig målprosjekt, region, kostnadsramme, tilgang, opprydding og backupens konkrete innhold gjennomgås og godkjennes. Ingen in-place Restore mot nåværende app-/journalstaging og ingen erstatning av den autoritative journalen med en eldre kopi.

Kontroller på nytt kildebackupens extensions, triggere, cron/pg_net/wrappers og andre utgående mekanismer. Leverandørens fysiske klone kan starte slike mekanismer ved ferdig restore. Ikke opprett klone dersom en slik mekanisme kan kjøre før isoleringen er bekreftet. Før bestilling må det foreligge dokumentert sperring av ALLE innkommende dataveier fra første oppstart av mål, med adgang bare for avgrenset restore-/replayoperatør: direkte DB, pooler, Data API og bruk av historiske runtimecredentials, servicekeys og tokens. Sperringen må være etablert før gjenopprettede data kan nås, ikke basert på etterfølgende ALTER ROLE eller API-deaktivering. Bevis at gamle applikasjonscredentials/tokens ikke kan nå de restaurerte radene før journalreplay. Hvis leverandøren ikke kan etablere og dokumentere dette oppstartsgrenset, skal klonen ikke bestilles; isolasjonsmetoden må avklares først. Data API, nettverk, rolleLOGIN/utløp og servicekeys etterkontrolleres dessuten i mål før noen kontrollert åpning, uten antakelser om arvede innstillinger. Ingen appalias eller lærer-/elevtrafikk skal peke på klonen. Ingen support-/AI-tilgang åpnes.

Velg en faktisk leverandørbackup som dokumentert inneholder en særskilt godkjent disponibel fixture før sletting/tilbakekall. Hvis ingen egnet backup finnes, klargjøres først en ny godkjent syntetisk fixture og man venter på bekreftet fysisk snapshot; ikke slett gammel testskole eller ekte data for å produsere et bevis. Tilganger stenges mellom snapshot og neste avgrensede prøve. Dette er en ny fixture-/tilgangsbeslutning, ikke gjenbruk av utløpt90minuttersgodkjenning.

Etter nyere journalført fixture-sletting gjenopprettes valgt appbackup kun i isolert mål. Koble prøveverktøyet til en separat, frisk autoritativ journalkilde med minst mulig lesetilgang og bekreftet checkpoint/hash. Gammel restore skal nektes åpning før journalreplay; etter replay skal slettet fixture/tilganger være borte og kontrollskolen/delte identiteter være bevart. Ingen råtokens, Feide-subject, personbilder eller datadump i offentlig evidens. Mål faktisk restore-/replaytid og valgt backups alder; RPO/RTO er målte prøveresultater, ikke vedtatt SLA. Testklemmens data/credentials/prosjekter og alle avledede kopier får eksplisitt avvikling og kvittering. Ingen permanent klone uten beslutning.

## Databaseoppgradering etter bestått restoreport

Før gjennomføring må vedlikeholdsvindu, tilgjengelig sikkerhetskopi, målversjon, Supabases egne kompatibilitetsadvarsler og konsekvens ved feil godkjennes konkret. Ingen knapp trykkes i dette klargjøringssteget. Ikke anta at vellykket patch kan nedgraderes med én knapp, eller bruk en in-place gammel backup som ordinær rollback; nyere journal må alltid bevares.

Oppgrader journal først mens skoleappen holdes utilgjengelig for brukere. Kontroller frisk journalkobling/TLS, migrering001–005, append-only ACL, runtime uten SET/BYPASSRLS og journal-/restorecheckpoints. Stopp ved avvik; oppgrader ikke appen før journalporten består. Deretter appen: kontroller TLS, migrering001–011/kilderegister21, RLS/roller, uendrede policy/grants/NOLOGIN og kald oppstart mot frisk journal. Leverandørens automatiske rollback ved feil er en leverandørmekanisme, ikke dokumentert Spansk123-aksept.

Kjør relevante eksisterende sikkerhets-/databaseporter og én syntetisk Feide-/lærer-/elevreise med allerede godkjente identiteter; ingen ny provisioning uten beslutning. Lagring/reload/eksport/utlogging og nekt av svak lærerinnlogging kontrolleres; testkontoer forblir uten ekte data. Gjør ingen callback-cookieendring eller beskyttelsesreduksjon for å få godkjent produksjonsflyt. Helsesjekk, aktuelle loggfeil, versjon og faktisk nedetid dokumenteres før åpning. Ved ny feil velges egen gjennomgått gjenoppretting med journalport; ikke improviser grantutvidelse eller hemmelighetsrotasjon.

## Datapolicy og varig drift er egne porter

Stagingbevisene lukker ikke vedtatte frister, bemannet hendelsesmottak, skoleeierens fullmakt/DPIA/avtale eller produksjonslevering. Minuttcronens skoleavgrensede1dags-testpolicy skal ikke bli standard for en pilotskole. Globale OIDC-/pendingøkter, journal/restreferanser, plattformlogger og alle backupkopier må ha konkret retensjonsdekning; skoleavslutning må ikke slette andres delte kontoer. Ingen journalrydding mens en gammel kopi fortsatt kan gjenåpne data.

## Kilder og evidens

Readonly-evidens: output/pilotberedskap-2026-10-15/. Offisiell dokumentasjon kontrollert15.10: [backup](https://supabase.com/docs/guides/platform/backups), [isolert klone](https://supabase.com/docs/guides/platform/clone-project), [oppgradering](https://supabase.com/docs/guides/platform/upgrading). Fysiske kopier kan ikke behandles som en lokal SQL-dump; Storage-objekter er ikke med i DB-backup. Klone innebærer nye ressurser; beløp og endelig mål er ikke valgt. Ingen kjøp eller leverandørhenvendelse er sendt.

Reviewrunde1:0critical/1major/0minor,REVISE. Oppstartsisolasjon er nå eksplisitt før-bestilling-port med direkte DB/pooler/DataAPI/historiskecredentials og stopp hvis leverandørmetoden ikke kan garantere lukket tilgang før replay. Runde2 APPROVED:0 åpne critical/major/minor. Dette er godkjent klargjøringsplan og stoppunkter, ikke bekreftet leverandørmetode eller ekstern utførelsestillatelse.

## Leverandøravklaring 19.10.2026

Supabase SU-508992, melding `1a1527ad4e39ff14` mottatt 06:45:43 Europe/Oslo, bekrefter at fysisk restore ikke kan isoleres før oppstart. Etterfølgende deaktivering av jobber oppfyller ikke denne planens oppstartsport. Ingen restore eller oppgradering startes med denne metoden. Logisk dump er foreslått av leverandøren, men erstatter ikke prøven av historisk leverandørbackup uten en separat gjennomgått og konkret besluttet plan. Full vurdering: `output/restore-staging-2026-10-15/support-response-2026-10-19.md`. Budsjett-/tilgangsgodkjenningen består; isolasjonskravet er uendret.
