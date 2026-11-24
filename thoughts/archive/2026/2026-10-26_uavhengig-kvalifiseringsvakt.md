# Uavhengig lokal kvalifiseringsvakt – ya9r.11

Eier ba om videreføring av ya9r.11. Dette steget bygger på58b42de i /private/tmp/spansk123-hosted-probe-2026-10-26. Implementer og bevis en egen lokal vakt som overlever supervisorens exit, før videre hosted integrasjon. Ingen eksterne forbindelser/ressurser/roller/Auth/keys/schema eller kildehandlinger. AllApiPassed/integrationReady/externalExecutionPermitted forblirfalse. Gammel restorelauncher og historiske129filer endres ikke.

## Prosessmyndighet og oppstart

Supervisor åpner en anonym kontrollpipe og starter en fast vaktmodul med start_new_session/pass_fds og bare root/run/round/fd i argv. Ingen hemmeligheter. En separat pipe mellom vakten og dens direkte arbeiderbarn gir arbeideren kooperativ selvstopp hvis vakten dør; arbeideren har fast kode og kan bare gjøre én lokal mint mot eksisterende scopebundet AF_UNIX-socket. Ingen PID fra en fil brukes som signalmyndighet: bare vaktens eget levende Popen-barn. Barnet får egen prosessgruppe.

Vaktscope og journal valideres før effekt. Eksklusiv nofollow/0600-vaktlås holdes hele levetiden. Egen eksakt0600/fsync-vaktkvittering opprettes O_EXCL før barnet; eksisterende vaktkvittering avvises også etter krasj. Ingen automatisk takeover eller ny mint. Kvitteringen binder run/round/opprinnelige absolutte frister og egne PIDer, men inneholder ingen token eller råbody. Readiness gis først etter lås/journal/bundet barn. Lukket supervisorpipe før barnestart avviser oppstart. Parentlukking mellom kontroll og barnestart gir konservativ UNKNOWN_MINT/recovery; ingen ny mint.

## Arbeid, stopp og sluttbevis

Vakten overvåker supervisorpipe, eget barn og en fast seneste arbeidsstopp=min(latestIssue,roundEnd med oppryddingsreserve). EOF/barnexit/fristslutt starter recovery. Fersk journal poisones før videre arbeid kan godtas. Alle operasjoner og venting har gjenværende wallclock/monotonic totalbudsjett, ingen flytting av roundEnd/hardEnd. Ved bakoverhopp/nonfinite klokke feiler porten.

Fersk lokal fence må være bekreftet committed før signalering av eget barn. Etter bekreftet fence stoppes/reapes bare eget barn/prosessgruppe og fersk adapter håndterer egen cleanup/observasjon. Ved fencesvikt sendes ingen signal som erstatning: kontrollpipe til barnet lukkes, slik at det kan avbryte seg selv; kvitteringen forblir CLEANUP_FAILED og bevares. Barnets klientkall er begrenset til maks10s og egen opprinnelig deadline. Ingen vilkårlig kill/drop eller rettighetsutvidelse.

Ved UNKNOWN_MINT kreves faktiske wallclock>=max(U+L,validert exp)+30 før CLOSED; nullAuth/keys alene er ikke nok. Bare ventefasen kan gjøre nye lesende observasjoner, ikke ny mint/create eller gjentatt cleanupmutasjon. Fresh proof må tas etter hver eventuell sen-effektgrense; uavklart grense/fremmed ressurs/timeout over fastfrist gir CLEANUP_FAILED. Feilkvitteringer og råintensjoner slettes ikke av vakten. Arbeiderens fortsatte tilstedeværelse etter kooperativt stopp gir failure, ikke antatt fravær. En vaktfeil friskmelder aldri token/ressurs eller åpner restoreporten.

## Faktisk lokal beviskjede

Test først med en faktisk lokal AF_UNIX HTTP-provider. Egen supervisorprosess starter vakten, venter til servermint og barn er observert og dør med os._exit(17). Testens overlevende provider er ikke supervisoren; vakten må selv fence/stoppe/rydde, forbli WAITING_EXPIRY til minimum30s faktisk veggklokke og deretter registrere CLOSED/UNKNOWN_MINT/false-PASS. Det syntetiske tokenets exp/iat må ligge innen den lokale attesterte korte levetiden. Dette er lokal leverandørsimulering, ikke Supabasebevis.

Andre tester: duplikatvakt starter ikke ekstra barn/mint, kontrollpipe lukket før start, vaktkrasj gir kooperativ barnestopp uten friskmelding/takeover, fencesvikt gir bevart CLEANUP_FAILED, ødelagt kvittering/symlink avvises, fristkryssing/nonfinite klokke, ingen token-/sentinellekkasje. Faktisk supervisor-død og vaktens uavhengige prosess må observeres separat; bare arbeidermint/exit17 er utilstrekkelig. Testharness skal kontrollere og vente inn egne supervisor/vakt/arbeider/servertråder og slette bare egne syntetiske røtter. Ingen gamle fullrestore-/UItester gjentas uten ny relevans.

## Leveransegrense

Denne vakten er kun lokal qualification, med semantisk lokal DBfence og simulerte providergrenser. Hosted provider-/katalog-/coordinator-/transportintegrasjon er fortsatt egen uferdig del av ya9r.11; ingen operativ startmandat skapes. Nye tester og uavhengig slutt-review kreves. Oppdater Beads, varig Gitbundle/kildearkiv og heartbeatstatus etter faktisk evidens, uten å lukke heleya9r.11.

## Målt leveranse

Lokal commit3407c156d29ff9edce63c85e32e2cc19f2faffc7. PlanreviewAPPROVED0; kodereviewMINOR1(psmålefeil)rettet/negativtestet, sluttAPPROVED0.38lokale testerPASS,inkl7nye. Faktisk supervisor-død run6f03d067 10:11:58.962–10:12:32.015Europe/Oslo: levende syntetisk token ved førsteWAITING,33.052s faktisk veggklokke, uavhengig vakt overlevde/stoppet eget barn/ryddet, én mint/cleanup, UNKNOWN_MINT/falsePASS. Seks røtter borte/servertråder ventet inn; ingen eksterne ressurser. SandboxEPERMpåps håndtert med godkjent avgrenset kjøring utenfor; ingen approvalavvisning. Opprinnelig symlinkadmissionfeil rettet med eksplisitt eierskap førcleanup. Varig279filers verifisert arkiv og komplett Gitbundle i output/hosted-probe-watchdog-2026-10-26/. ya9r.11fortsattin_progress; hostedcoordinator/katalog/transport/provider/APIporter er ikke ferdige. Ingen eksternstart.
