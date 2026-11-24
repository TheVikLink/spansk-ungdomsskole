# Lokal innholdsbevaring for R – ya9r.11

26.10.2026. Fortsettelse fra 6d02165, bare lokal kode og syntetiske prøver.

## Problem og avgrensning

Dagens katalogsnapshot attesterer ikke tabellinnhold eller sekvensverdier. Lag en separat lokal bevaringsleser og ren R-bevaringsinspeksjon. Dette er ikke hosted transport, full R-coordinator eller bevis for leverandørisolasjon. Ingen tidligere kvittering åpnes og ingen eksisterende launcher/replay/frys/gjenåpning endres. Alle operative flagg forblir false.

## Kontrakt

Ny immutable kontrakt binder eksakt sortert inventar (schema/navn/kind r eller S), mål/profildigest, run og import-/pakke-SHA256. Tillatte appskjemaer fra eksisterende fast SOURCES-kontrakt; kun ASCIIidentifikatorer, ingen SQL fra kalleren. Inventar er eksplisitt reviewet input, ikke automatisk godkjent discovery. Ukjent/ekstra/manglende relasjon eller andre relkind i disse skjemaene avviser før radlesing. Minimal native fixture gir bare bevis for sitt eksplisitte inventar; ikke full appdekning.

Lesing bruker samme immutable container-ID/image/scope/isolasjonskontroller og fem sekunders totalbudsjett som katalogleseren. Refaktorer den interne bundne transporten uten å endre offentlig capture-kontrakt. SQL er generert fra validert inventar, en READ ONLY REPEATABLE READ-transaksjon med faste UTC/DateStyle/float/bytea-parametere og statement/lock/transaction-timeout. Alle rader hashes i DB med eksisterende lengdeprefiksert kanonisk UTF8 og C-sortering. Bare antall/hash og sekvens last_value/is_called leses tilbake; ingen rådata eller funksjonskall fra innspill. Returner bare samlet hash/antall objekter og bindinger, ikke sekvensverdier eller råfingeravtrykk i offentlig snapshot.

Inventar + metadata/katalog skal leses i samme transaksjon som radene og bindes i snapshot. Sekvenser er ikke MVCC: ingen påstand om atomisk sekvenssnapshot eller samtidighetsisolasjon. Denne lokale kontrollen krever eksplisitt lokal harness-eksklusivitet og utfører ingen produksjonsfrys. Det er ikke et bevis for kildefrys; hosted gate står stengt.

Tre tidsordnede snapshots: importbaseline, før R, etter R. Hvert binder samme kontraktdigest/profil/run/container; baseline/pre/post hash for innhold, katalog og metadata må matche. Bevaringsinspeksjon validerer nøyaktige typer, kontrakt, tidsrekkefølge (baseline <= pre < post), postferskhet maks30s og hardEnd. Endret rad uten countendring, duplikatmultiplikitet, sekvensverdi/is_called, katalog eller inventar avviser. Resultat er LOCAL_PRESERVATION_INSPECTION med localContentPreserved bool; allApiPassed/integrationReady/externalExecutionPermitted false alltid. Ingen offentlig true kan godkjenne coordinatoren; den eksisterende admissionavvisningen beholdes.

## Verifikasjon og levering

Test først: feil binding/import/inventar/typer/tid/forfalskede flagg; SQLinjeksjonsidentifikator/ukjent schema/duplikat/relkind; manglende eksklusivitetskontrakt og external avvises før I/O. Native ny PG17.11 network-none fixture med rader inkludert duplikat/Unicode/null og en sekvens. Faktiske row-update/insert/delete/duplikat/sekvens/is_called samt ekstra objekt skal detekteres; rad-/DDLrollback gir eksakt hash. Sekvensendringer rollbackes ikke: native harness gjenoppretter last_value/is_called eksplisitt og tar fersk likhetskontroll. READ ONLY skal avvise writes. Egne ressurser og private filer skal ryddes og fravær kontrolleres. Bare relevante nye/nære tester; ingen gjentatt gammel fullrestore eller browserleveranse.

Plan og diff/evidens sikkerhetsreview før levering. Beads ya9r.11 forblir in_progress for hosted principal/provider/transport, R-operativ integrasjon, Storage/Realtime og faktisk native fence. Varig Gitbundle og kildearkiv etter verifisert lokal commit. Ingen eksterne tilganger/ressurser/faser/import/patch/mail.

Planreview APPROVED:0CRITICAL/0MAJOR/1MINOR om ikke-transaksjonelle sekvenser; presiseringen over er innarbeidet.

Levert i lokal commit 17bdcdf794bb6fed46aed408ee6745b3f5762499.60lokale+13coordinator+1ny native bevaringsprøve+1relevant native katalogregresjon består. Sluttreview APPROVED0. To egne containere/røtter/37private filer ryddet. Varig286filers SHAverifisertarkiv og komplettGitbundle i output/hosted-probe-preservation-2026-10-26/. PakkeSHA er en valgt kontraktbinding, ikke uavhengig bevis for faktisk import eller baselineopphav; dette krever senere operativ integrasjon. Primitive er ikke koblet inn i full R-coordinator. AllApiPassed/integrationReady/externalExecutionPermittedfalse; ya9r.11fortsattin_progress. Ingen ekstern endring.
