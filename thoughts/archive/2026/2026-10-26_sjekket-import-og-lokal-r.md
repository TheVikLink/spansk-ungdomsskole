# Sjekket import og lokal R-grense – ya9r.11

26.10.2026. Eier ba «Kjør på» etter lokal bevaringsleveranse17bdcdf. Bare lokal syntetisk implementering/test; ingen eksterne faser/ressurser eller startmandat.

## Problem

Bevaringsprimitiven har caller-valgt pakkeSHA. Bind den nå til faktisk ReconciledPipeline.import_bytes og fersk native målobservasjon. Gamle129kodefiler/launcher/replay/reopening skal ikke endres. Full hosted R/API/principal/vakt mangler og blir fortsatt blokkert.

## Ny separat lokal adapter/coordinator

Ny LocalImportRCoordinator er import-only bibliotek, ingen CLI/nettverk. Eksakte typer ProbeScope/Container/ReconciledPipeline/TargetProfile, synthetic=True, pipeline.run/mål/deadline/replayorigin må samsvare. Pipeline.path forblir den opprinnelige private AES-pakkeroten, pinning av resolved path/inode/owner/mode ved konstruksjon og før hver gate. ProbeScope har separat rot for hashjournal og lokalt målsyntetisk tmpfs; ingen råpakke flyttes ut av AES. Harnessen registrerer/rydder begge områdene. Lokal målcontainer har eksakt original immutableID/image/scope/isolasjonskontroll fra LocalCatalogReader. Caller kan ikke levere egen importer eller successbool. Eksklusiv lokal harness er uttrykkelig forutsetning, ikke attestert operativ fence.

Målbootstrap er separat i native harness, fra sjekket app-bootstrap.sql etter existing replay/exportgate. Adapteren krever før import at appinventar er tomt og at eksplisitt bootstrapkataloghash matcher fersk faktisk observasjon. Dette er en lokal fixtureprofil, ikke en providerprofil. Ingen egen rolle-/schemaadministrasjon i adapteren. Alle SQLbytes kommer fra eksisterende ferske pipeline.import_bytes; ingen råarkiv-/callerSQLrute. Faste align_rls_sql fra verifisert capturemetadata brukes mellom sjekket functions og data som eksisterende preparedimport. Schema/capturemetadata/forventetfingeravtrykk leses via samme sjekkede pakke med expected gategrunnlag, ikke uavhengig tilfeldig JSON.

Før første importsideeffekt: holdbar enkeltbruks0600/O_EXCL/O_NOFOLLOW/fsync-kvittering binder run, profil/mål/container/image, endefrist, expected pakke-/proofdigest, eksakt navngitt payload-SHA (fra bytes) og forventetfingeravtrykkhash. Ny bevaringskontrakt bruker den beregnede payload-SHA, ikke callerlabel. Journal har eksklusiv ikke-blokkerende prosesslås, sikker boundedleser, atomiskfsync/terminalimmutabilitet. Eksisterende fil/symlink/IMPORTING/UNKNOWN/terminal kan aldri gjenbrukes eller remintes. Ingen råSQL/fingeravtrykk/rader i kvittering.

Utfør payload én gang på eksakt lokal containerID med psql single-transaction, boundedstdin/stdout, dempetdiagnostikk og faktisk vegg-/monotonicfrist. Import har maks30s inkludert I/O (egen lokalgrense); ingen forlengelse. Returnertkommando/observerteclaims/kvittering alene gir ikke importbevis: sammenlign fersk faktisk native rad/sekvenshash med pakke.expectedFingerprint og eksaktinventar; fersk pipeline.verify_after_import må bestå. Bind også metadata til reviewed imported struktur der eksisterende sammenligningskontrakt gjelder. Feil/taptrespons/krasj underIMPORTING er UNKNOWN, ingen retry/rollbackpåstand eller gjenåpning. Bevis bevares; native harness avvikler bare egne syntetiske ressurser. Ikke utfør kildecleanup fra denne adapteren.

R-bevaringssteg: fresh_before_r tar faktisksnapshot, sjekker mot verifisertimportbaseline; fresh_after_r tar ny faktisk snapshot og validerer rekkefølge/ferskhet/hardEnd og likhet mot baseline/før. Mellomtrinn kan IKKE motta en funksjon eller SQL fra caller; testharness utøver egne kontroller separat. Holdbare stater IMPORTING→IMPORTED→R_OBSERVING→LOCAL_OBSERVED eller UNKNOWN/FAILED, terminaler immutable. Offentlig rapport har bare lokalimport/contentbinding og navngitte manglende Rprincipal/watchdog/provider/APIporter; allApiPassed/integrationReady/externalExecutionPermitted false alltid. Dette erstatter ikke original Coordinator.run og får aldri kilde-/reopen-/cleanup-hooks. Gammel startavvisning beholdes. Ingen påstand om full Rprincipalrunde.

## Test og konkret aksept

Først fokuserte unitnegative for feiltype/target/sourcehost/run/root/payload/expiry/symlink/duplikatjournal/stegrekkefølge/importfailure/corruptfingerprint/forfalsketreport, ingen callbackautorisasjon. Tapt importrespons/krasj kan bare etterlate IMPORTING/UNKNOWN og aldri ny execute.

Ny native integrasjonsprøve bruker fersk full syntetisk app/journalcapture → eksisterende faktisk lokale PG17rårestore/replay/inaktivering/eksport → sjekkede bytes → ny adapterimport → baseline/før/etterR. Samme PG17.11/network-none/noports/noswap/readonly/tmpfs. Eget privat0700syntetiskområde, ingen credentials eller eksterne data; eksisterende AES-harness hvis praktisk, ingen nedgradering av produksjonskrav. Faktisk28apptabeller/3sekvenser forventes (journal6/1 i lokalreplay), journalgrunnene/kontrollskole/deltidentitet beholdes via eksisterende consequencekontroller. Nybaseline må ikke tilpasses korrupteimporterte data. Native negativ endrer målrad etter førR og krever permanentavvisning uten reimport. Minst én faktisk pendingimportjournal må åpnes på nytt og avvises uten mutation (ingen gjenopptak). Egne containere/filer/vakt ryddes og fravær kontrolleres. Gamle passingtester kjøres bare hvis berørt av ny integrasjon, ikke generell gammel leveranserepetisjon.

Sikkerhetsreview før kode og diff/evidensreview førlevering. Varig komplettGitbundle/kildearkiv medhashkontroll og Beadsoppdatering. ya9r.11in_progress for hostedprincipal/provider/U/L/transport/R-vakt/Storage/Realtime og senere operativ source-/importkobling. Ingen push/merge/deploy/eksternfixture/tilgang/rolle/Auth/key/ressurs/import/patch/mail.

Planreview APPROVED0 førkode. Privat pakkerot/ProbeScope holdes adskilt for å bevare eksisterende sikkerhetsgrenser.

## Levert lokal del

Commit `1d6c0a114dccefa05fcd953f5465d24f914bc213`.76 lokale+19 nære tester og to faktiske fullkjeder bestått; positiv LOCAL_OBSERVED og faktisk radendring FAILED med reimportavslag. Strukturforventning bindes til opprinnelig rårestore/capturemetadata før baseline. Slutt-review APPROVED0. Se `output/hosted-import-r-2026-10-26/README.md` og `verification.json` for eksakt evidens, opprydding, avbrudd og gjenopprettede lokale forutsetninger. ya9r.11 beholder hosted/Rprincipal/vakt/provider/Storage/Realtime som åpent; alle operative flagg false.
