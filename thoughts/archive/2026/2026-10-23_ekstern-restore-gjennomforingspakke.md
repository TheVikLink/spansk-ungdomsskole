# Ekstern restore – konkret gjennomføringspakke

23. oktober 2026. Beads ya9r.3, overordnet ya9r/twkq. Status: **klargjøring, ingen starttillatelse**. Dette dokumentet er operatørgrunnlaget for neste eksterne forsøk og erstatter kjøreinstruksjonene fra 19./21. oktober. Historiske kvitteringer og lokal evidens er uforandret. Bestillingen nå omfatter dokumentasjon og review; ingen innlogging, kildeprobe, ny fase, fixture, ressurs, import, patch eller e-post utføres.

## Leveransen og kodebindingen

Bruk kun `/private/tmp/spansk123-reconciled-coordinator-2026-10-22`, commit `e96b08e0668639b76a9bea7dd4ed1d1597cde112`, med det komplette kildegrunnlaget og låste verktøyene som kvitteres i `output/reconciled-adapter-2026-10-22/verification.json` og `source-manifest.json`. Ikke dirty hovedkopi, gammel `run_full_restore.py` eller lokal Feide-gruppedemo. Før eventuell kjøring: kontroller commit, alle manifeste hasher, avhengigheter og diff; avvik krever ny konkret deltareview, ikke gjentakelse av uendrede beståtte prøver.

Lokal fullkjede 7c80b0d0, crash 6d7e7061 og readerheng a9d48400 er bestått innen sine dokumenterte grenser. Full/crash predaterer bare siste PgSleep-observasjonsdelta i nativehjelperen; produksjonsbibliotekene matcher. Ingen brukbar eksport er beholdt. Provider-/TLS-/HTTP-profiler og managed-mint var simulert. Lokal APPROVED gir ingen ekstern tillatelse.

**Pakken er ikke en ferdig ekstern launcher.** Nåværende bibliotek har bounded `ManagedIO`, men ingen gjennomgått ekstern sammensetting av credentialhåndtering, faktisk API-responsskjema/status, SQL-/native-/HTTP-transport, ressursopprettelse, profilinnsamling og fersk watchdog-recovery. Før kjøp må denne sammensettingen være implementert/reviewet lokalt mot faste responskontrakter og feilutfall. Ikke kall lokale runnerne med skyparametere eller sett `synthetic=false`/`externalExecutionPermitted=true` manuelt. Startmanifestet i `output/external-restore-package-2026-10-23/` er et inert beslutningsgrunnlag, ikke en fil som dagens koordinator kan kjøres med.

## Eksakt omfang og mandat

| Ressurs | Tillatt bruk ved senere konkret startbeslutning |
| --- | --- |
| Organisasjon | Oversikt AS, `xgdvhggnihuzlnwlnjpq` |
| Appkilde | `peglwndjqnrstwnlrdsa`, kun staging app001–011 |
| Autoritativ journalkilde | `quznpkwsapehdcmicgsq`, journal001–005; samlet 21 kildedigester |
| Nytt mål | Ett nytt tomt Micro-appmål, eu-north-1, navn `spansk123-reconciled-app-<kjøredato>-<fasekortid>`; eksakt navn bindes før POST, ID etter POST |
| Prosjektramme | Ordinal 2 av totalt 2. Første mål `naxxlqwmeakwggpcdoeb` er slettet; det skal aldri gjenbrukes eller polles igjen |
| Data | Hele verifisert syntetiske staginginventaret, én ny fasebundet fixtureskole/klasse/oppgave med dokumenterte eksisterende syntetiske identiteter |
| Resultat | Faktisk appbackup og journalbackup gjenopprettet lokalt; fersk originaljournalreplay lokalt; bare ryddet inaktiv appkopi til nytt mål; mål aldri åpnet for appbruk |

Ingen kildeoverskriving, fysisk clone, separat journalprosjekt, tredje prosjekt, ekte skole/person, app012-migrering, alias/deploy, produksjonsåpning eller oppgradering. Kildens autoritative journal tilbakesettes aldri. Den varige globale authjobben og dens USD5/Vercel-vakt berøres ikke.

Metoden og de generelle USD10/2 mål/24t/90min/2t-rammene er allerede vedtatt. Neste beslutning må bare binde **ett konkret nytt forsøk med én fixture**, eksklusivt kildevindu, navneprofil og den avgrensede tillitsgrensen til dette siste målet. Den ubrukte fixturetillatelsen for det slettede målet flyttes ikke automatisk.

Supabase kan fortsatt privilegert lese **den allerede journalryddede kopien**. SU-508992 har bekreftet at reserverte roller ikke kan kundestenges; ingen ny slik prøve eller rådataunntak inngår. Denne avgrensede plattformtilliten må stå i kjørebeslutningen. Navn som `supabase_*`, fravær av forbindelser eller /32 alene er ikke godkjenning av en tilgangsvei.

## Tilgangskontrakt

| Principal/kanal | Myndighet, levetid og lukking |
| --- | --- |
| Eksisterende eierstyrt Supabase CLI-/Management-profil | Kun støttede kall mot eksakte kilder/nytt mål i riktig org. Native profil brukes uten å ekstrahere nettlesertokens eller skrive token i argv/logger/receipt. Ingen nye brede tokens eller credentialrotasjon. Faktisk profil og myndighet verifiseres i senere autorisert preflight; dagens nettleser-sign-in er ikke bevis på CLI-status |
| Kontrolprincipal på kilde | Må faktisk kunne utføre avgrenset runtimefrys, grantrestaurering, reader NOLOGIN/utløp og terminering. Verifiser SQL-privilegier/USAGE/signalrett og eksakt førtilstand; ADMIN/MEMBER alene er utilstrekkelig. Ingen privilegieutvidelse ved avslag |
| Egne app-/journaloperatører | Nye `rr_app_<uuid>` / `rr_journal_<uuid>`, kun eksisterende avgrensede slett-RPC-er og schema-USAGE, ingen direkte tabell-/sekvensrett, medlemskap, SUPERUSER/CREATEDB/CREATEROLE/BYPASSRLS/REPLICATION. NOLOGIN utenom nødvendig operasjon. Frist min(mint+90min,T0+105) |
| Managed capture-/journalreader | Støttet fast `cli_login_supabase_read_only_user`, ny credential og unik run/capture/lease ved hvert opptak. Faktisk read-only/BYPASS-profil som tidligere gjennomgått, ikke egne grants til reserverte roller. Før hver mint: NOLOGIN/utløpt/0 forbindelser og ingen aktiv lease. Faktisk 300s-serverlease; hele lease+margin må passe innen hardfristen. Etter hvert opptak NOLOGIN/utløpt/0 forbindelser før neste mint. Ukjent mint/lukking forgifter fasen |
| Målets admissionrolle | Ny `rr_admission_<uuid>`, SET-only til NOLOGIN app_migrator, ADMIN/INHERIT false, ingen direkte datarett. Senest T0+25 stengt, PASSWORD NULL, utløpt, 0 forbindelser og medlemskap fjernet; aldri gjenåpnet |
| Målets importrolle | Annen ny `rr_import_<uuid>`, samme minimumsprofil, først etter A0, bare verifisert pakke til bundet mål. Frist min(mint+90min,T0+105), stenges straks import/probe er ferdig |
| Kopierte historiske roller | NOLOGIN/PASSWORD NULL; ingen kildepassord/API-/JWT-nøkler kopieres. Ingen appserver eller gamle jobber aktiveres |
| Menneskelig sletteansvarlig | Produkteier utfører sluttsletting av eksakt ny ID, helst i samme vindu. Må være tilgjengelig før kjøp og ha støttet slettevei; agenten sletter ikke prosjektet |

Secrets/verifiers/pgpass og nødvendig rå feildiagnostikk finnes bare i prosessminne eller ny fasebundet AES256-lagring med root0700/filer0600; ikke i delbare noter eller shellhistorikk. Watchdog må kunne rekonstruere nye kontrollerte I/O-håndtak fra samme private fasekontrakt etter workerexit, uten arvede DB-sesjoner. At eiertoken fortsatt gir slik cleanupmyndighet må avklares før mutasjon. Auth-feil stopper; ingen interaktiv login under fase.

Native PG17.11, CA-/image-/binærhash og sessionpoolerprofil bindes til kildegrunnlaget. Faktisk verify-full med sertifikatvertsnavn og CA er obligatorisk; ingen sslmode=require-fallback. Lokal rårestore/journalrestore har network-none, ingen porter, tmpfs, ingen ekstra swap, pinned image/pullnever, ikke-root/capdrop/read-onlyroot og ingen containerlogging. Nettleser-/SQL-editor/MCP/AI/ETL-bruk mot kilder og mål opphører i vinduet utenom den avgrensede operatørkjeden.

## Porter og hvilke bevis som kreves

Dette er akseptansekriterier; liveportene er **ikke målt nå**. Beads sporer gjenstående arbeid; tabellen er kjøreavhengigheter, ikke en parallell oppgaveliste.

| Port | Før hvilken handling | Bevis som må foreligge |
| --- | --- | --- |
| G1–G4 lokal integrasjon | Før kjøp | Lokal e96b08e og review gjenbrukes. I tillegg reviewet konkret ekstern launcher/transport/recovery og eksakt scopefilter. Faktisk HTTP-status/responsskjema/timeout/redirect og ukjent-commit må være støttet, ikke antatt fra native stub |
| G2 ekstern kildeproveniens | Før fixture/capture | Native TLS/current_user/DB/readonlyprofil bundet til faktisk source-ref/org og støttet factoryrespons; alle 21 digester/funksjonskropper, snapshots, metadata og syntetisk inventar stemmer. Kontroll-/readertermineringsmyndighet må faktisk bestå før frys |
| G5a forventet målprofil | Før POST | Reviewet versjonsbundet tillatt katalog/rolle-/hook-/APIprofil og kontrollkode. Tidligere tommålmetadata kan være referanse, ikke blankofullmakt. Ingen setter forventet digest lik ny observert digest uten uavhengig klassifisering/review |
| G6a kostnad og avvikling | Før POST | Samlet tidligere restorekostnad eller dokumentert øvre grense, nytt tilbud, USD1 reserve og total ≤USD10; nøyaktig navneintent, ordinal2, tilgjengelig menneskelig sletting og støttet fremgangsmåte |
| G7 mandat | Før T0/POST | Eksakt pakke-/launcherhash, ett forsøk/én fixture/navn/org, fast dato/T0/sluttfrister, eksklusivt kildevindu, cleaned-copy-plattformtillit og menneskelig sletting vedtatt. Ingen godkjenning etterspørres før pakken er konkret |
| G5b/G6b faktisk tommål | Før A0/kildehandling | Én POST; responstidsbrakett/providerstamp/ID/org/region/PG17/pris/disk; anvendt TLS/nett/APIprofil, tomhet og klassifisert katalog. Separat admissionrolle faktisk prøvd/stengt før A0. Ingen videreføring ved ukjent objekt/sideeffekt |
| Skrivebarriere | Før fixture og gjennom sluttkontroll | Eksakte runtime LOGIN/granttupler lagret; alle effektive skrivere/eiere/SET/INHERIT/SECDEF/DDL-veier, poolersesjoner, idle-in-transaction og prepared xacts avstemt. Andre administratorer ute av vinduet. NOLOGIN+terminering av bare bundne runtimebrukere, fersk katalogkontroll. Ukjent writer gir stopp |
| Eksport/import/slutt | Ved hvert grensepunkt | Raw SHA→baselinejournal→fersk originaljournalinnhold/checkpoint→kanonisk replay/kode→post-replay/inaktivering→eksportSHA→mål/frist. Ny uavhengig journaltransaksjon etter replay/før eksport, før import og etter import. Ingen gjenbruk av pinned snapshot |

For tommålet kreves Micro ≤USD0.01344/time, standard gp3 ≤8GiB/3000IOPS/125MiBps, ingen HA/replica/PITR/IPv4-/andre tillegg. Prosjektet er tomt ved første oppstart. TLS enforcement og allowlist må være faktisk anvendt: operatørens verifiserte offentlige IPv4/32, ingen øvrige IPv4/IPv6-CIDR-er. Ikke endre kildekildenes nett/TLS-konfig; slike endringer kan gi reboot og er utenfor pakken.

Nettregler dekker DB/pooler, ikke HTTPS. Den konkrete kodeprofilen krever bare `restore_api_empty` eksponert og ingen ekstra search_path, signup deaktivert, ingen nye Auth-brukere/sesjoner, Storage/Vault-data, subscriptions/slots/FDW/store objekter, publiserte apptabeller, cron/net-kø eller ukjente webhooks. DataAPI-disable er ikke en automatisk fallback hvis kodeprofilen ikke støtter den. Klassifiser komplette providertrigger-/funksjonskropper, extensions, default ACL, eiere og rollegraph; blind triggerfjerning eller replikatriggermodus er forbudt.

Før første datarad og etter import: effektive tabell-/sekvens-/funksjons-/DDL-avslag for anon/authenticated/service_role/authenticator og alle øvrige ikke-klassifiserte innloggings-/SET-/INHERIT-veier; RLS/FORCE RLS og funksjonshasher matcher. HTTP-bevis skal prøve relevante REST-/GraphQL-/Auth-/Storage-/Realtime-veier med eksakt avgrenset testprincipal på tom kontrollflate. Manglende gyldig token kan bare kalles uautentisert avslag, aldri bevis for service-/authenticated-isolasjon. Ingen historiske credentials hentes for negative prøver. Hvis en nødvendig HTTP-/historisk tilgangsvei ikke kan bevises med støttet metode og katalogbinding, er admission uavklart og kilder forblir urørt. Ingen ny probe-fixture fra gamle engangstester.

Globaljobb kjører uendret. Gjeldende `verify_auth_removals` avviser enhver kildeauthendring; den har ingen ferdig live wrapper-eligibility-adapter. Velg vindu mellom xx:40-kjøringer for å redusere kollisjon, men påstå ikke at det eliminerer den i en 70minfase. Hvis authdata endres, avbryt konservativt; ingen generell cutoff, stopp av cron eller automatisk retry. Ønskes toleranse, må eksakt wrapper-/radvurdering implementeres og reviewes separat før kildehandling.

## Kostnadskontrakt

Rammen USD10 er samlet, ikke fornyet. Nytt mål er det siste. Offentlige priser kontrollert23.10, men faktisk tilbud og samlet historisk belastning er ikke hentet nå. Konservativ beregning: 25 påbegynte timer×0.01344=0.336; diskreserve8×25×0.000171=0.0342; samlet egress ≤1GB×0.09=0.09; sum0.4602 avrundes til USD0.47. Eksisterende kreditter trekkes ikke fra. Krev `tidligere dokumentert øvre grense + nytt verste fall + 1.00 reserve ≤10.00`. Avstem gammel kostnad via organisasjonsfaktura/bruk, aldri det slettede prosjektets API. Uavklart historikk/pris betyr ingen POST. Inkluder alle øvrige fakturerbare poster i avstemmingen; prisanslaget er ingen hardcap.

Opprettelsesintensjon skrives før eneste POST. Ved tapt/ukjent svar: bare inventer etter eksakt navn/org/tidsbrakett, aldri retryPOST. Uavklart/duplisert ressurs stanser og varsles; ingen tredje ressurs. Konservativ slettefrist er tidligste intent/provideropprettelse+24timer. Eier får ID, dokumentert frist i Oslo+UTC, aktuell pris og støttet slettefremgangsmåte straks IDen er bundet. Fristoverskridelsen fra forrige mål begrunner sletting samme vindu; inert/pauset betyr ikke slettet.

## Fast tidsvindu – ingen klokke starter nå

Foreslått klokkeprofil er **10:00–12:00 Europe/Oslo på en senere eksplisitt vedtatt dato**; dette er ikke en booking eller startbeslutning. Date/T0 og alle UTC-frister skal fylles og hashes før G7. T0 flyttes aldri etter start. Koden har A0=T0+25, arbeidsslutt=T0+95, hard cleanup=T0+105; samlet aktiv kilde-/importtilgang ≤80min og hver operatør ≤90min. Vert/providerklokke må stemme innen reviewet toleranse før mutasjon, ellers stopp.

| Tid fra T0 (eksempel ved10:00) | Operasjon og siste sikre overgang |
| --- | --- |
| 0–20 (10:00–10:20) | Bekreftet uavhengig vakt før ressurs; én tommålbestilling, ID/kostnad/slettebinding, støttet config og faktisk katalog/TLS/API-admission |
| 20–25 | G5b/G6b og admissionstenging ferdig før10:25. Manglende bevis: abort uten kildehandling, menneskelig målsletting |
| A0–A0+10 (10:25–10:35) | Faktisk kontrollprincipal/leserprofil og begge cleanupoperatører klare; writerkontroll, runtimefrys, ny fixture atomisk med nødvendige avgrensede autorisasjoner |
| +10–25 | Appbackup og baselinejournal med konsistente snapshots; hver reader stenges etter bruk. Fixture dokumentert i faktisk appdump før sletting |
| +25–30 | Akkurat fixture journalført slettet; forvent school_blocked+school_deleted og eksakte subject-bindinger; fang fersk originaljournal, gammelt innhold uendret |
| +30–45 | Lokal råapp-/journalrestore, fingeravtrykk; kanonisk fersk journalreplay, bevaring/inaktivering; ny journalport og ryddet eksport |
| +45–60 | Ny journal-/mål-/pakkebinding, import bare verifiserte bytes i korrekt rekkefølge; faktisk målstruktur/rader/sekvenser/isolasjon |
| +60–70 | Ny originaljournaltransaksjon, bevaring og sikker kildegjenåpning; mål forblir stengt |
| T0+95 (11:35) | Ordinært arbeid stanser uansett. Ingen ny capture/import; cleanup fortsetter |
| T0+105 (11:45) | Alle egne roller/forbindelser/autorisasjoner stengt; sikkert restaurert kilde-LOGIN/grants; egne prosesser/container/privatefiler ryddet ved sikre sluttvilkår |
| +105–120 (11:45–12:00) | Fersk vanlig beskyttet app-/journalhelse; menneskelig målsletting og entydig faktisk fravær. Ved uavklart sluttsletting: ikke rapporter fullført |

Hver reader har egen uavhengig frist: vakt stopper arbeid ved tidligste mintBefore+300s/faktisk expiry minus60s eller arbeidsslutt. Hele workergruppen med PID/starttid/fase må være bekreftet borte før fersk cleanup-adapter får aktivitetlåsen. SQL-/capture-/Nodeklienter har total gjenværende timeout. Ingen receiptlås holdes under DB-venting. Admission/A0 eller tilgangsfrister kan ikke forskyves for sen oppstart eller treg leverandør.

## Avbrudd og cleanup som operatørkontrakt

Resourceintent og fase-/SHA-bundet recoverymateriale persisteres før mutasjon. Fresh recovery leser siste receipt etter verifisert workerstopp. Ingen gjenåpning av gamle CLOSED/CLEANUP_FAILED receipts. Uavhengige lukkinger forsøkes selv om én feiler.

| Tilstand | Pålagt respons |
| --- | --- |
| Admission feiler/tiden ute | Ingen kildehandling. Steng egne admissiontilganger/nøkler, behold målsperrer; lever ID til avtalt menneskelig sletting |
| Readerhenger/ukjent mint | NOLOGIN/expiry committes separat før terminering. Prioriter faktisk readerstengsel og0conn. Poisoned/ukjent lease: ingen ny mint, import eller automatisk gjenåpning |
| Kjent committed fixture, avbrudd | Journalfør sletting av akkurat registrert fixture gjennom opprinnelig minsterolle før den stenges. Ingen ny fixture og ingen blind gjentakelse hvis commit er ukjent |
| Ukjent kildeutfall eller delvis gjenåpning | Hold/refrys begge kilder med fasebundet SQL-fence; forsinket reopen avvises. Varsle konkret med siste intent og manglende bevis. Ingen manuell «suksess»-markering |
| Endret journal/pakke/mål/metadata | Forkast videre bruk av kopien, steng egne tilganger, gjennomfør sikker kildecleanup; intet automatisk delta-replay/nytt forsøk |
| Cleanupfeil eller tapt kontrolltilgang | CLEANUP_FAILED, presis ressurs-/friststatus og menneskelig eskalering. Frist er brutt hvis den overskrides; dette gir ingen ny tilgang eller fristforlengelse |

Normal cleanup: hold ved usikkerhet → readerstengsel → målroller/nøkler stenges → kjent fixture avstemmes/slettes journalført → egne kildeoperatører/autorisasjoner stenges → kildebevaring/journal og eksakte originale grantor/ADMIN/INHERIT/SET-tupler verifiseres → kun da runtime-LOGIN tilbake → egne lokale prosesser/containerfravær → privat lagring fjernes. Gjenåpning av kilder er aldri åpning av restoremålet. Støttet administrativ kontrollkanal må være tilgjengelig gjennom cleanup; tap av den er en driftsfeil, ikke et grunnlag for brede nødgrants.

Ved uavklart utfall beholdes bare nødvendig fasebundet recoverybevis kryptert; ikke destruer AES eller krev ubetinget sletting ved hardfristen. Registrer konkret fil-/ressursinventar uten hemmeligheter, hvorfor oppbevaring trengs og neste menneskelige recovery-/slettebeslutning. Ingen ny fase eller automatisk fristforlengelse. Syntetisk harness sin ytre opprydding fra22.10 er ikke en ekstern feilcleanup som kan kopieres.

Lokal ressursfjerning er eksakt UUID/label/image/path-avgrenset: stopp → inspiser stopped → ordinær remove → frisk daemon og entydig fravær. Ikke force/prune eller gammel fase. Privat materiale fjernes først når egne prosesser/forbindelser er bekreftet stengt. Bevar saniterte hasher/tidspunkter/principalprofiler/SQLSTATE/resultat, aldri rådump/radinnhold/tokens/passord/verifiers.

Menneskelig prosjektsletting er et separat slutttrinn, innen24t fra konservativ opprettelsestid. Eier varsles ved ny ID og før ny fristrisiko; faktisk fravær bekreftes etter sletting uten å tolke APIfeil som fravær. Ingen agent-delete eller tilgang til gammelt slettet mål.

## Sluttkvittering og senere beslutning

Skill `dataProofPassed`, `sourceRecovered`, `temporaryAccessClosed`, `privateCleanupVerified`, `targetDeletionVerified` og `overallPassed`. Overall er bare true når alle fem har ferske konkrete bevis og ingen ukjent mutasjon/cleanupfeil gjenstår. Historisk journalrestore lokalt skal ha full rad-/sekvens-/strukturmatch og append-only-bevis fra den faktiske backupen; ingen påstand om skyjournalrestore. Kontrollskoler/delt identitet/læring skal matche beskyttelsesmanifest, slettet fixture skal være borte fra kilde/ryddet eksport/mål med varig tombstone. Baseline/fersk originaljournal må ha eksakt tillatt forskjell.

Neste kjørebeslutning presenteres først når launcher/profiler/kostnad er konkret reviewbare: «Utfør ett forsøk med prosjekt2, navnet [eksakt], i Oversikt AS/eu-north-1 [dato/T0–slutt]. Én syntetisk fixture. Eksisterende samlet USD10-ramme; Supabase får bare lokalt journalryddet inaktiv kopi og har privilegert plattformtilgang til denne. Ingen rådataunntak/produksjonsåpning/patch. Jeg holder kildevinduet eksklusivt og utfører avtalt sluttsletting av den nye ID-en innen oppgitt frist.» Dette er tekstutkast, ingen forespørsel eller beslutning nå.

## Kilder og aktualitetskontroll

Lokalt grunnlag: [lokal leveranse](../../../output/reconciled-adapter-2026-10-22/README.md), [sikkerhetsreview](../../../output/reconciled-adapter-2026-10-22/security-final.md), [forrige overordnede plan](2026-10-21_ekstern-restore-med-journalryddet-kopi.md), [SU-508992](../../../output/logical-restore-2026-10-20/support-response-2026-10-21.md). Sistnevntes ventende lokale metodevalg er overstyrt av faktisk valgt/bestått metode21.10.

Offentlig dokumentasjon lest23.10, ingen konto-/prosjektkall: [nettverk](https://supabase.com/docs/guides/platform/network-restrictions), [TLS enforcement](https://supabase.com/docs/guides/platform/ssl-enforcement), [compute](https://supabase.com/docs/guides/platform/manage-your-usage/compute), [disk](https://supabase.com/docs/guides/platform/manage-your-usage/disk-size), [egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress). Nett/TLS er ikke HTTPS-autorisasjon. TLS enforcement-endring kan reboote DB; bare tommålkonfig inngår i senere mandat.

[Changelog](https://supabase.com/changelog) kontrollert: varslet [CBC TLS-endring](https://supabase.com/changelog/cbc-tls-ciphers-deprecated) gjelder prosjekt-HTTP fra tidligst10.11, ikke direkteDB/pooler/Management API. Bruk faktisk moderne TLS-klientprofil. Dette løser ikke providerisolasjon. Ingen ny relevant leverandørgaranti utledes av changelog. Faktisk tilbud/versjon/APIkontrakt må kontrolleres på gjennomføringsdatoen. Ingen abonnement-/bibliotekoppgradering inngår i denne leveransen.

## Oppdatert lesende preflight23.10

Tidligere omtale av uferdig lokal launcher er overstyrt av ferdig lokal8c31278/ya9r.4, output/external-restore-launcher-2026-10-23. Ny lesende preflight og INERT startgrunnlag: output/external-restore-preflight-2026-10-23/README.md og STARTMANDAT.md. Foreløpig eiervalg26.10kl10:16–12:16Europe/Oslo(CET), ikke starttillatelse.20/21kildedigestmatch oppdaget: recovery.js lokalreplaydelta må avstemmes i ya9r.6. Kostnadshistorikk/nativekildefase/authenticatedAPI/nyttmål/eksklusivtkildevindu er fortsatt åpne porter. Ingen ressurs, rolleåpning eller ekstern fase er startet av preflighten. Eldre CLOSEDreceipts er urørt.

23.10nylokalavstemmingya9r.6: commit81015d7 skiller fast21historiskkilderegister fra separatgodkjentnyrecoveryexecutionhash. Nyexactmanifestgate+SELECT-onlyledgerbarrier; replay/reopeningfileruendret.46Python/15Node+nativePG17.11ledger4negativePASS,cleanup0,reviewAPPROVED0. Autoritativt oppdatert startgrunnlag er output/recovery-provenance-2026-10-23/STARTMANDAT.md og start-mandate.INERT.json; historisk preflight20/21måling beholdes. Digestblokkeringen er lokaltavstemt; kostnad/nativeauthenticatedAPI/provider/eksklusivitet/konkretstartbeslutningfortsattåpne. Ingeneksternfase/endring.
