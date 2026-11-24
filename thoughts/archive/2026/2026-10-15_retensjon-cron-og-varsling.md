# Tidsstyrt retensjon og e-postalarm i syntetisk staging

Beads: spansk-ungdomsskole-twkq. Eier ber om ferdig test av tidsstyring og varsling, og velger olevik91@gmail.com som mottaker. Tidligere testkontoer er stengt. Ingen aktivering eller ny leverandørregistrering før ferdig pakke er gjennomgått og konkret godkjent.

## Løsning og personvern

Bruk eksisterende isolerte Vercel-prosjekt prj_4LQ7snZivDli7obto0BdOcMEJyzo i theviklinks-projects. Native cron må bruke Production-target i dette stagingprosjektet, aldri appens produksjonsdatabase eller appalias. Funksjoner i arn1, Node22, Vercel Authentication beholdes. Cron autentiseres av CRON_SECRET. Plattformens faktiske cron-adgang med SSO må kontrolleres; ingen svekkelse eller URL-bypass improviseres.

Uavhengig monitor foreslås hos Healthchecks.io. Den mottar bare tomme tekniske start/success/failure-signaler med tilfeldige run-ID-er, ikke skole-/bruker-IDer, antall, SQL-feil eller rådata. Konto og e-postintegrasjon bruker bare valgt mottakeradresse. Ping-URL er en begrenset signaleringshemmelighet; ingen management-API-nøkkel eller Gmail-/SMTP-credential legges hos Vercel. Leverandørens privatlivsvilkår, konto-/e-postdeling og eventuell avtale må godkjennes før registrering. Gratisplan er foreslått; ikke aksepter kjøp eller vilkår på vegne av eier. Eier fullfører eventuell kontoregistrering og avtaleaksept selv. Ingen eksisterende nøkler hentes.

Monitor gir umiddelbar alarm ved /fail og alarm ved uteblitt success etter periode/grace, også om Vercel er nede. Bruk navnet 'Spansk123 STAGING TEST – retensjon', cron hvert minutt, grace120sekunder, emailonly til valgtadresse, ingen gjentatte påminnelser. Dette er én tidsavgrenset prøve, ikke avtale om permanent bemannet overvåkning. Høyst5testvarsler (feil, gjenoppretting og uteblitt kjøring). Bekreft faktisk mottak i Gmail, ikke bare at leverandøren hevder å ha sendt.

## Kodeendring

Ny monitor-modul godtar bare HTTPS hc-ping.com og eksakt UUID-sti uten query/userinfo/port/hash. Worker får bare denne ene private ping-URLen. Ingen frie mål fra request. POST uten body, redirects:error, timeout3s. Krev HTTP200 og eksakt OK-body; Healthchecks kan gi200 ved notfound/ratelimit, så status alene er ikke bevis. Begrens response-lesing til32bytes. Ikke logg URL eller råfeil.

Bare scheduled-lane sender pinger. Start og slutt knyttes til én ny tilfeldig run-ID. Success sendes først etter ferdig journal/appcommit og finish_run. Feilet jobb sender /fail og forblir503. Feil i successlevering gir503 uten å feilklassifisere committet DBjobb som tilbakeført; fravær av ping utløser monitor. Manglende startping stopper ikke retensjonen; sluttsuksess kan fortsatt dokumentere fullføring. Konfigurasjons-/oppstartsfeil før jobb gir ingen falsk success og oppdages gjennom manglende ping. Manuell POST kan ikke gjøre monitor eller scheduled-helse frisk. Cronaktivert konfigurasjon krever gyldig monitor-URL; Preview/manual fungerer som før uten monitor.

## Avgrenset database- og testvindu

Samme syntetiske skole72d03374-1ee1-4c60-935f-cb2e4550f627 og eksisterende aktive kontrolloppgave beholdes. To nye syntetiske oppgaver får ferske UUIDer, én for faktisk planlagt sletting og én for kontrollert journalfeil/recovery. Gamle slettede UUIDer gjenbrukes ikke. Journalallowlist erstattes bare for dette avtalte testsettet, ingen andre skoler. Nye oppgaver har ingen elevsvar/lyd/profiler. Detaljert operatorpakke må oppgi disse UUIDene før godkjenning.

Samme to dedikerte NOINHERIT-kontoer åpnes i maksimalt90minutter med nye testpassord, uendrede funksjoner/ACL/grupper. App/journal wrapperkonfigurasjon scheduledtrue, fast skole og absolutt utløp. Policy1/frister1dag beholdes; bare vinduet fornyes. Alle endringer atomiske med original migratorgrant-snapshot og restaurering, samme preflight som tidligere. Ingen global policy eller kontosletting. Bare de nye avtalte oppgavene eldes. Migrator-SET utenfor transaksjon forblirfalse. Stopp ved avvik og steng allerede åpnet part ved feil.

## Ekstern beviskjede

Først full lokal test/review og konkret aktiveringsgodkjenning. Konto/monitor/e-postkanal må være klar før credentials aktiveres. Test negative konfigurasjoner, timeout, redirect, falsk200 og at manual aldri pinger. Før levering kjøres full test:all på Node22.

Etter aktivering kreves minst to faktisk tidsstyrte Vercel-kjøringer ved ulike planlagte tidspunkt, bekreftet i Vercel cronlogg, egen scheduled-ledger og monitorens run-historikk. Første sletter ny oppgave1, andre sletter0; aktiv kontrolloppgave og gammel skole uendret. Ingen manuell 'Run now' eller etterlignet GET teller som cronbevis.

Deretter eldes ny oppgave2. En ny deploy med bare syntetisk feil journalpassord utløser faktisk cronfeil; oppgaven må bevares, failedledger og ned-alarm må komme til Gmail. Korrekt credential gjenopprettes, neste ekte cron skal sletteoppgave2, journalføre og gi recovery. Ingen DBpassordrotasjon som feilinjeksjon.

Til slutt fjernes cron i deploy (ikke direkte /fail-simulering), men monitoren beholdes aktiv til grace er passert. Manglende kjøring skal gi ekte e-postalarm. Verifiser også lokalt missing/failed/running/stale-status; ikke bruk manual som friskhetsbevis. Negative jobber må ikke belønnes med healthy.

## Stenging og leveringsgrense

Pause den ene testmonitoren etter kvittering, verifiser ingen videre varsler er planlagt. Cron fjernes og Production-target gjenopprettes til eksisterende inerte503-bootstrap uten env/DB. Begge testkontoerNOLOGIN/utløpt, wrapper/policyutløpt/scheduledfalse, forbindelser0,migratorSETfalse. Fjern testvariabler, credentialbærende deployer og nye CLIbypasser; slett private filer. Behold minimal journal og kvitteringer uten secrets. Appalias/Feide/no-login uendret og healthz kontrolleres. Ved tidsnød steng, ikke forleng uten ny beslutning.

Tidsstyring og e-postkjede kan først markeres eksternt verifisert etter reelle provider-kjøringer og mottatte alarmmeldinger. Et ferdig kodeutkast, lokal fake-ping eller manuelt sendt testbrev er ikke nok. Ved manglende ny leverandør-/konto-/kanaltilgang ferdigstilles lokal pakke, og det konkrete manglende steget etterspørres. Twkq inkluderer dessuten vedtatte frister/backup og skal ikke lukkes uten å kontrollere disse øvrige kravene.

Planreview1: APPROVED,0CRITICAL/0MAJOR/1MINOR. Før monitor-/credentialvinduet åpnes skal faktisk Vercel-abonnement og cron-minuttfrekvens bekreftes, ikke bare antas. Hvis eksisterende plan ikke tillater minuttfrekvens, stopp uten oppgradering/kjøp og lag nytt testopplegg. Ingen credentialtid brukes på å vente på ukjent abonnementsstøtte.


## Tidsstyrt retensjon og e-postalarm eksternt verifisert15.10.2026

Etter konkret Healthchecks.io-/90minuttersgodkjenning og egen eierinnlogging er faktisk minuttcron prøvd i separat stagingprosjekt prj_4LQ7snZivDli7obto0BdOcMEJyzo,Authenticationall/arn1. Syv scheduledruns10:01–10:07Oslo ga1/0/0/failed0/failed0/recovery1/0. Journalfeil bevarte oppgave; begge nye UUIDer journalført, aktiv kontroll og gammel skole5oppgaver/11events bevart. Mottatt Gmail: feil10:04:43,recovery10:06:43,manglende kjøring10:10:44 etter fjernetcron. Ingen RunNow/manualGET/testbrev. Alt stengt: NOLOGIN/utløp/SETfalse/0connections,policy-wrapperutløpt/scheduledfalse,6env+3workerdeployer+5privatefilerfjernet,0cron/0bypass,monitorpauset. Inert separat stagingdeployment4qsW7qhytftA4kPHRka3VmHPsE7Sbeholdt. AppaliasuendretJDFre/healthzstatusok/securityJournalok. Se output/retention-cron-2026-10-15/README.md og external-scheduled-receipt.json. Lokal fullgate47+111/5skip+483grønn. Ingen permanentdrift/produksjon;twkqåpen foravtaltefrister/backup/avtaler.
