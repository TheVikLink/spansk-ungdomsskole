# Lokal R-prinsipal og vakt

Eierbestilt 27.10.2026, ya9r.11. Bare syntetisk lokal integrasjon i eksisterende isolert checkout. Ingen eksterne endringer eller hosted tillatelse.

## Avgrenset løsning

Ny LocalRPrincipalCoordinator kobler den sjekkede LocalImportRCoordinator til eksisterende Qualification og Watchdog. Dette er én separat R-livssyklus (journalrunde1 i samme run/scope); ingen Q-closure eller full Q→restore→R-autorisasjon påstås. Første levering trenger ingen native DBrolle: R-prinsipal er faktisk lokalt utstedt/verifisert asymmetrisk JWT, ikke SET ROLE. Provider/fence/bruker/keytilstand er eksplisitt lokal AF_UNIX-fixture; native databevaring måles separat på faktisk PG17.11.

Før mint bindes opprinnelig importkvittering i IMPORTED, payload/proof/package, scope/run/mål/profil/container/image, immutable offentlig verifikatorprofil (JWKS, egen user/session, absolutt Node-sti), og fast480s R-frist innen importfristen. Budsjett valideres før sideeffekt. before_r tas før principalmutasjoner. En O_EXCL0600/fsync enkeltbrukskontekst og separat R-resultat med terminalimmutabilitet/ikke-blokkerende lås hindrer retry, kontekstbytte og konkurrerende start. Ingen ekstern bool eller caller success kan autorisere. Bundet kontekst og import-R_OBSERVING-kvittering hashes før vaktstart; både worker og ferdigstilling kontrollerer bindingene.

Eksisterende lokal transport utvides med separat eksplisitt mint-tokenrespons: bare mint, nøyaktig gamle protokollfelt pluss token; ingen råbody i kvitteringer. Vanlig protokoll forblir uendret. Ny R-workergren i eksisterende fixed watchdog-worker brukes bare ved korrekt R-kontekst. Den sjekker binding, original deadline og supervisor/guardpipe, utfører én mint, verifiserer faktisk JWT med eksisterende offentlig RS256/ES256-verifikator og egen session, og journalfører VERIFIED før vent. Ingen remint/refresh. Ukjent eller feil respons gir UNKNOWN_MINT/poison via eksisterende guard, aldri R-principal-qualified.

R-coordinator returnerer bare status mens vakt kjører. Eierfullføring på eget Popen-handle sender OWNER_COMPLETE og lukker pipen; EOF alene er feilgren og eksisterende uavhengige vakt utfører fence→stopp/reap→fersk cleanup→nullobservasjon→ekte U+L/exp+30-vent. Vaktens egen død gir CLEANUP_FAILED, ingen takeover. Fullføring krever eget guard-Popen avsluttet exit0, eksakt original guardianPID/round/frister, CLOSED, workerAbsent, VERIFIED/upoisoned journal og faktisk utløpsgrense. Først da kan after_r måle faktisk innholds-/katalogbevaring. Enhver usikkerhet gir varig R FAILED og ingen after_r-success. Gamle importkvitteringer som bare er LOCAL_OBSERVED kan ikke brukes. Guard kan rydde etter supervisordød, men ingen automatisk fullføring eller PASS av R etter den døden.

R-kontekst er kun lokal offentlig nøkkelprofil og IDer; tokens finnes bare i worker/serverminne. Ingen secrets i argv/env/notater. Filgrenser: root0700, regular0600/nofollow/size/duplicate-json-felt, faste filnavn og schema. Verifikatorprofil/worker/transport kan ikke være hosted fallback. Innhold/katalogobservasjonens lokale harness-eksklusivitet er fortsatt en antakelse, ikke operativ global fence.

## Verifikasjon og review

Før kode: uavhengig adversarial review. Test først admission (type/profile/run/state/time/tamper/symlink/duplikat/terminal), positive/failure sluttporter og ingen rawtoken i kvitteringer. Faktisk AF_UNIX-signering/JWT/verifikasjon og separat vakt bruker ekte veggklokke med kort lokal tokenlevetid+30s, ingen raskklokke. Native PG17.11 full syntetisk import→beforeR→R-mint→guardclosure→afterR; kontrollskole/deltidentitet/alle10journalgrunner verifiseres. Negativ faktisk supervisor-exit17 etter mint før receipt må gi UNKNOWN_MINT/cleanup og ingen auto-PASS; lokal feiltest for guarddød, feil session/signatur, import-/profilbytte og rowdrift. Eksisterende nærliggende tester kjøres ved endrede moduler. Nye egne barn/røtter/privatefiler/AES/containere ryddes og fravær sjekkes, offentlig sanitert evidens bevares. Ingen appendring eller gamle eksterne prøver.

Etter kode: uavhengig sikkerhets-/evidensreview, alle CRITICAL/MAJOR løst, kildehashbinding og lokal commit/varig arkiv. ya9r.11 forblir åpen for hosted provider/U/L/transport/Storage/Realtime og faktisk integrert native fence. AllApiPassed/integrationReady/externalExecutionPermitted forblir false.

## Presisering før planreview

R-fixturebrukeren finnes allerede lokalt før denne runden. Journalen registrerer eksakt egen offentlig fixture-ID/session; ingen create/key-operasjon gjøres av integrasjonen. Første ressursmutasjon er mint i vaktens eget barn. Dermed finnes ingen unguarded create-fase. Dette er bare én lokal brukerprinsipal, ikke alle15APIceller eller keylivsløpet.

Reviewfant feasibility-MAJOR: guardian forgifter alltid ved EOF. Løs med eksplisitt capability-bundet OWNER_COMPLETE-melding i eksisterende private anonyme supervisorpipe, bare på eget Popen-handle. Guardian kan behandle akkurat denne meldingen uten å sette poison bare når R-kontekstbinding og faktisk VERIFIED/upoisoned mint allerede består. PENDING/workerexit/deadline/EOF/guardfeil forblir poisoned; poison kan ALDRI fjernes. Den eksisterende fencecleanupsekvensen kjøres også ved OWNER_COMPLETE. EOF fra supervisordød kan aldri forveksles med vellykket fullføring. Negative prøver dekker tidlig complete, feilmelding, død og eksisterende poison. Håndtaket har ingen recreate/resume-gren.

## Levert lokalt27.10

111unike fokuserte/nære Pythonprøver og nativepositivce408d80/strengtnegativ8fdaf97a består, sluttreviewAPPROVED0. Negativ krever preservation:comparison, ikke generiskfeil.8sluttcontainere/193privatefiler/AES borte/cleanup0.47Node99server+4skip og alle483browserverifisert (énfixturetimeout→isolertPASS12.8s). Se output/hosted-r-integration-2026-10-27/README.md for utviklingsavvik/begrensninger. ya9r.11 fortsattin_progress, barelokalt, ingen eksterneendringer.
