# Principalmetode og plan for hosted prøveintegrasjon

Dato: 24.10.2026, Europe/Oslo. Beads: `spansk-ungdomsskole-ya9r.11`.
Leveranse: metodeavklaring og implementeringsplan med sikkerhetsreview. Ingen implementering eller ekstern utføring i denne leveransen.

## Beslutning og myndighet

Valgt **planmetode** er en kortlivet, mål-eksklusiv Supabase Auth-kontrollbruker via støttet adminopprettelse og ett passordgrant per runde. Publishable key uten brukerJWT representerer anon; samme key med ekte brukerJWT representerer authenticated; en egen secret key representerer service_role og brukes til egen brukeradministrasjon. Secret er prosjektbred BYPASSRLS-tilgang, aldri en minsterettighetsnøkkel. Minimeringen ligger i eget tomt/inaktivt mål, kort operativ levetid, avgrenset transport og eksakte egne operasjoner.

Dette avklarer hvilket forslag adapteren skal bygges for; det godkjenner ikke opprettelse av bruker/nøkler, schemaforberedelse, tilgang eller ressurs. `targetAuthControlApproved=false`, `schemaOnlyPreparationApproved=false`, `integrationReady=false`, `allApiPassed=false`, `externalExecutionPermitted=false` og alle operative IDer/tider null beholdes. Dagens null-Auth-, replay-, poison- og startporter endres ikke. Ingen «best effort»-start hvis én obligatorisk celle mangler.

Forkastede alternativer: Feide-testkonto er ikke Supabase Auth-principal; SET ROLE er native bevis, ikke HTTP-identitet; selvsignert JWT eller hentet signeringshemmelighet er ikke tillatt; eksisterende kildebruker/default-/legacykey og providerrolle-unntak brukes ikke. Ingen ny tredjepartsidentitetsleverandør, e-post, SMS eller OTP. Ingen Storagebucket eller Realtimejoin opprettes for å skaffe positivt kontrollbevis.

## Grunnlag og dokumentasjon

Bevart lokalt grunnlag: `output/probe-adapter-2026-10-23/{README.md,STARTMANDAT.md,source-hashes.json,security-final.md}` samt `output/native-api-probe-package-2026-10-23/{API.md,CLEANUP.md,request-matrix.json}`. Lokal leveranse cf0fb89e rapporterer 129 kodefiler/138 avhengigheter og 26 nye prøver; dette gjentas ikke og er ikke hosted bevis.

Fersk lesekontroll 24.10: `/private/tmp/spansk123-external-launcher-2026-10-23` finnes ikke; `git cat-file -t cf0fb89e47a15cac50b854fa1d5b79bdf14c3cb8` i hovedrepo finner ikke objektet. Kode er derfor ikke inspisert eller gjenverifisert i denne leveransen. Før implementering må eksakt commit gjenfinnes fra godkjent lokal checkout/arkiv, sammenlignes med alle 129/138 hasher og provenance, og plasseres på egen codex-gren. Ikke hent ny, ubundet kode eller skriv over hovedkopien som løsning. Manglende kilde stopper implementering, ikke denne planleveransen.

Offisielle kilder lest 24.10 (dokumentasjon, ingen prosjekt-API):

| Kilde | Relevant avklaring |
| --- | --- |
| [API keys](https://supabase.com/docs/guides/getting-started/api-keys) | Publishable/secret er ikke JWT; bruk apikey-header. Secret er privilegert. Nye nøkler opphever ikke gamle nøkler. |
| [createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser) | Serveradministrert bruker med passord og email_confirm=true er dokumentert. |
| [deleteUser](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser), [user management](https://supabase.com/docs/guides/auth/managing-user-data) | Eksakt bruker-ID og hard delete; ikke anta at sletting betyr umiddelbart tokenavslag. |
| [Sessions](https://supabase.com/docs/guides/auth/sessions), [signOut](https://supabase.com/docs/reference/javascript/auth-signout) | session_id binder sesjon; accessJWT kan bestå til exp etter signout. |
| [JWT](https://supabase.com/docs/guides/auth/jwts) | Verifiser signatur/issuer/audience/rolle/tid med offentlig metode; decode er ikke attest. |
| [Realtime protocol](https://supabase.com/docs/guides/realtime/protocol) | Dokumentert websocketoppsett bruker apikey i URL og deretter phx_join. Dette er ikke vår tillatte header-only/no-join-metode. |
| [GraphQL security](https://supabase.com/docs/guides/graphql/security) | Reflektert schema styres av PostgreSQL-rettigheter; introspeksjon alene er ikke objektisolasjon. |
| [Storage access control](https://supabase.com/docs/guides/storage/security/access-control) | Storagepolicyer gjelder egne objekter; 404 på manglende bucket er ikke grantbevis. |

Changelogindeksen ble hentet som Markdown; relevant 12.10-varsel om [CBC/TLS-endring](https://supabase.com/changelog/cbc-tls-ciphers-deprecated) er lest. Planen krever TLS1.3 med CA/vertsnavn, ingen TLSnedgradering. Dokumentasjon beskriver støttet modell, ikke at vårt fremtidige mål eller alle headers allerede er verifisert. Ingen nettleser- eller konto-/prosjektkonfigurasjon er lest eller endret her.

## Principalens livsløp

1. Før mutasjon: tommålbaseline, reviewet Authprofil, ingen uklassifiserte DBtriggere/eventtriggere/Authhooks/webhooks/SMTP-/SMS-sideeffekter. Signup/anonymous/invite-flow av; støttet administrativ create og passordgrant må kunne virke uten å skru på offentlig signup. Hvis det ikke kan dokumenteres: blokkert, ingen fallback. Ingen kildeAuth endres.
2. Én syntetisk tilfeldig adresse under `.invalid`, tilfeldig passord, ingen navn/skole/Feidekobling. Høyst én bruker samtidig, to totalt (Q-runde før kildestart og R-runde etter ryddet import). Høyst én publishable og én secret per runde, fire totalt. Ingen nye nøkler etter ukjent createutfall.
3. Før create: fsync intent med runUUID/prosjekt/runde/egen markør, faste frister, forventet eksakt UUID hvis providerstøttet. CreateUser-APIets aksepterte felter må fastlegges fra låst offisiell klient-/Authversjon før kode. Ikke anta klientvalgt UUID er støttet. Ved tapt respons løses egen UUID via SELECT-only oppslag på nøyaktig faseadresse/markør innen egen target, returner bare ID/telling; ingen listusers eller rå Authdump. Hvis sikker gjenfinning ikke finnes: ingen create tillates. Samme krav gjelder key-ID/markør via dataminimert adapter, uten logging av nøkkelverdier.
4. Passordgrant én gang; autoRefresh/persistSession av. Ingen refresh. Bare målets JWTexpiry300s; verifiser faktisk exp/iat og serverklokke. Nytt eget mål må støtte offentlig JWKS-signaturverifisering med algoritmeallowlist; ingen HS-signingsecret/fallback. Bind issuer til eksakt mål, aud authenticated, role authenticated, sub/UUID/session_id til egen bruker og fersk SELECT-sesjon. JWTfeil stopper før videre APIprøver.

   Før passordgrant fsynces en egen mintintensjon med egen bruker, request-deadline, attestert maksimal tokenlevetid og klokkeavviksgrense. Et klienttimeout beviser ikke at serveren stoppet behandlingen. Dersom respons/validering/receipt mangler, er utfallet UNKNOWN_MINT: ingen remint, ingen Q/R-PASS, ingen tidlig CLOSED selv om Authtelling blir null. Fersk cleanup søker bare egne sesjoner fra den eksakte brukeren/markøren, uten å hente tokens. Hvis en supported providerprofil kan attestere senest mulig serverutstedelse U og maksimal levetid L, må cleanup dekke minst U+L+30s og aldri kortere enn et senere observert validert exp+30. Disse grensene må være fastlagt før grant; ikke utled U fra klienttimeout alene. Uavklart U/L eller frist utenfor hardEnd gir CLEANUP_FAILED og menneskelig avvikling, ingen tokenfriskmelding eller fristforlengelse. Denne planen hevder ikke at slik servergrense er dokumentert støttet; det er en egen før-mint-port som lokal feiltest og senere providerprofil må løse.
5. Positive kontroller går mot nøyaktig targethost: settings for key-gateway; user for egen JWT; admin/users/{ownUUID} for egen secret. Settings alene beviser ikke DBrollen anon, og adminsuccess alene beviser ikke service_role på alle ruter. Eksakt støttet header-/rolleoverføring per tjeneste må bindes i profilen; ellers cellen INCOMPLETE. Ingen UIvisning av secret eller full Authbody.
6. Stans nye forespørsler/refresh og lukk sockets. Global signout av egen sesjon, hard delete av egen bruker, fersk nullkontroll for users/sessions/identities/refresh_tokens og øvrige egenrelaterte Authrader i det konkrete leverandørschemaet. Klassifiser cascade før bruk. Providerhistorikk/audit skal ikke slettes. Ingen direkte Auth-DML som fallback.
7. Tilbakekall begge egne keys via støttet providerkontroll; etterprøv én avgrenset avvisning og IDstatus. Eksisterende adminsecret beholdes bare til egen Authcleanup er bevist; recoverymyndighet må ikke være avhengig av samme key som skal oppheves. JWTutløp+30s må passere på faktisk veggklokke før null-Auth/finalgate; UNKNOWN_MINT følger den strengere feil-/utstedelsesgrensen i punkt4 og kan aldri gi Q/R-PASS. Test aldri refresh i cleanup: det kan lage nytt token. Ingen antatt key-serverTTL eller tokeninvalidering ved brukersletting.

## Bevismodell per tjeneste

Tre principaler ganger REST/GraphQL/Storage/Realtime samt positive kontroller er arvet fra requestmatrisen. Alle 15 fingerprints er fortsatt null. Resultater lagres separat som principal/route/configuration/existence/nativeAcl/grantRls; de kan ikke oppgraderes mellom lag.

| Tjeneste | Konkret planlagt bevis | Gjenstående stoppvilkår |
| --- | --- | --- |
| Auth | Eksakt egen user/session og admin-ID; signupoff via tillatt profil | Ukjent header, sideeffekt, cascade eller signaturmetode stopper |
| REST | Faktisk kanonisk public.school, select=id&limit=0, Accept-Profile public; restore_api_empty-only beholdes | Konfigurasjonsavslag beviser ikke grant/RLS; native alleobjekt-/rolleattest kreves separat |
| GraphQL | Ren introspeksjonsquery fra gammel matrise; route/principal/configbinding, ingen mutation | Manglende appfelter/tomt200 alene gir ikke grantPASS; kanonisk rolle/ACL/refleksjonsprofil må stemme |
| Storage | Null buckets/objects og separat effektiv ACL/RLS-attest; eventuell kjent404 kun existence | HTTPgrantisolasjon fortsatt INCOMPLETE; ingen bucket/fil for å løse den |
| Realtime | Lesende attest av disabled-profil, publikasjoner/slots/kanaler og rettighetsflate | Header-only autentisert handshake uten join er ikke dokumentert støttet; ikke kjør URLkey/noauth som erstatning. HTTPprincipalbevis fortsatt INCOMPLETE |

Realtime og Storage er altså **avklart som uavsluttede beviskrav**, ikke skjult fjernet fra matrise. AllApiPassed kan ikke bli true med disse hullene. Før hosted aktivering kreves enten en dokumentert metode innen samme sikkerhetskrav eller en separat eierbeslutning om nøyaktig endret beviskrav; ingen slik endring gjøres av denne planen. Ingen HTTP-endepunkter aktiveres for å produsere et sterkere testresultat.

Nativeallprincipalattesten må omfatte alle app-/journalobjekter som relevant, schema/table/column/sequence/function/PUBLIC/defaultACL, SET/INHERIT-stier og SECURITY DEFINER, også service_role med BYPASSRLS. RLS alene erstatter ikke grantavslag. Ukjent objekt, ekstra trigger/default eller ukjent providerkonfig ugyldiggjør attest.

## Planlagt kode og integrasjonsgrenser

Dette er fremtidige moduler, ikke filer opprettet nå. Gjenbruk bekreftet cf0fb89e-livssyklus og eksisterende launcher81015d7, uten å fjerne local-onlyavvisningen i dagens probeadapter.

| Modul | Ansvar og konkret kontrakt |
| --- | --- |
| hosted_probe_profile.py | Eksakt prosjekt-ID/org/region/host, dataminimerte profilefelter, CA/TLS, schema/rolle/functionhash, capabilities og per-rute fingerprintversjon. Ukjente felt/tilstander feiler. |
| hosted_probe_transport.py | HTTPS bare eksakt target.supabase.co:443; ingen source-APIhost; separat native target/sourceallowlist fra mandat. Ingen redirect/proxy/netrc/cookies/SDKtelemetri. Ett monotonic totalbudsjett, 10s maks per request, 32KiB maks body, eksplisitt Content-Type, faste path/method/body/queryallowlister. Ingen URLsecrets/argv/envsecrets. |
| hosted_probe_principals.py | Own-user/key intent, én mint, claim/signaturkontroll, secure IPC/cleanup-handle; adminoperasjoner begrenset til egen UUID, recovery lookup bare egen markør. |
| hosted_probe_catalog.py | SELECT-only profiler/baseline og eksakt schema-only install-/teardownmanifest; nativeoperatørrettigheter fra egen senere reviewet pakke. Ingen rolleutvidelse ved feil. |
| hosted_probe_guard.py | Uavhengig prosess/vakt med durable resourceIDs, PID/start/gruppe, hardEnd og egnet cleanupkontroll; stanser worker før fersk adapter, fencecommit før signal. |
| hosted_probe_evidence.py | Typet bevis pr celle; positive bindinger før negativesvar; ukjent status, body eller missingfelt er INCOMPLETE/FAIL. Ingen slutt-PASS uten alle krav. |
| launchergrense | Ny navngitt kvalifiseringslivssyklus adskilt fra restore; godkjent Qbevis forsegles med target/config/schemahash og frister. Restore får bare lukket kvalifiseringskvittering; ingen token/privatrot eller transientAuth unntak ved eksport/import/finalgrenser. |

HTTPklienten leser respons bare i beskyttet minne, projiserer eksplisitte nødvendige felt før receipt og logger aldri råbody/header. Secret/refresh/passord er sensitive selv på syntetisk mål. Persistens bare0600 i egen0700AES-rot der crashcleanup krever det; no-core, no-symlink, ingen logger med ubegrenset exceptionbody. Privat oppryddingsgrunnlag bevares til closure er avklart. Providerkontroll må ha separate godkjente eksakte operasjoner for keyrevoke og gjenfinning; ingen brede ManagementAuth-/PostgREST-GET som lekker signingsecret. Hvis supported API ikke kan projiseres sikkert, kreves egen avklart UI/transportprofil, ikke blanketconfigdump.

## Rekkefølge, frister og uforanderlige porter

Før senere kjøp/åpning: faktisk kildegjenfinning, offline implementering/feiltester/review, alle APIbevismetoder, ny provider-/cleanuprettighetsprofil og konkret kostnads-/vindu-/startbeslutning. Ingen hosted «utforsk og se» med privilegert key.

Q0: Nytt mål nr2av2totalt, bare etter separat startmandat, baseline tom og egne nett-/TLS/APIprofiler verifisert før data. Reserverte providerlesere aksepteres ikke automatisk; tillit til bare ryddet kopi krever eksplisitt beslutning. Rawrestore forblir lokal/nettverksløs/AES.

Q1–Q5 før A0/kildehandling: egen schema-onlyforberedelse uten data; eksakt kanonisk fullschema/rollemanifest; principalrundeQ; tilbakekalling/nullAuth/exp+30; eksakt own-object-teardown uten CASCADE til opprinnelig tomkatalog. Fersk nativebevis må tas på gjenbygget identisk schema **før første importerte datarad**. Avvik gir ingen gjenbruk av Qbevis, ingen ny mint.

Deretter egen native kildekapabilitet (300s minsteleser/240s arbeidsstopp/egen backend, fencecommit før signal/0conn) i særskilt godkjent lease, eksklusivt kildevindu, og den eksisterende forseglete restorekjeden: kildefrys → full capture → lokal rårestore → fersk originaljournalreplay → inaktivering → eksport av ryddet kopi → import. Ingen tilbakeføring av autoritativ journal eller svekkelse av poison/reopeningfence.

R etter ryddet import: ny principal/keyrunde mot inaktiv kopi; ingen schema-teardown. Revider fullschema-/config-/rettighetsbinding og innholdsbevaring; nullAuth og alle egenmidler stengt/exp+30 før endelig gate. Ingen brukbar kopi eller gjenåpning utledes av lokale eller delvise APIresultater.

Hver APIrunde har fast480s total inklcleanup og faktisk JWTvent; tidligst lukk ved seneste signerte exp+30. Budsjettet må regnes før mint: 300s token +30sskew + dokumentert restarbeid/cleanup innen480s. Actualexp overramme stopper straks og bevares i cleanup, ingen remint. Før import kreves minst600s rest til workEnd for R; kald oppstart/provider/config/schema Q og nativekildefase må ha egen realistisk buffer i samlet vindu. Kildelease maksimalt90min; faste workEnd/hardEnd og menneskelig24tslettefrist er absolutte, aldri forlengelse. 26.10 kl10:16–12:16CET er kun preferanse, schedulingReady=false.

Cleanup: stans eksakt egen prosessgruppe før ny adapter; DBfence committes separat før terminering. Own-user/keyutfall avklares via reviewet uavhengig kontroll; manglende closure gir CLEANUP_FAILED/poison og stengt port, ikke retry, ekstra grant, ny fase eller bevisdestruksjon. Rundefrist og hardEnd gir ikke garanti mot en leverandørutilgjengelighet; senere konkret mandat må inkludere menneskelig kontroll/avvikling uten å kalle dette leverandørhardcap. Ingen bred kill/drop eller direkte provider/Authrolleendring.

Kostnad: USD10restore står uendret, historiskUSD0.35 og betingetUSD1.82inklreserve er ikke ny fersk faktura/hardcap. Før ressurs: konkret maksimum levetid/compute/disk/data/egress, ny samlet beregning og gjennomførbar menneskelig sluttsletting. GlobaljobbUSD5 og kjent Vercelauthblokkering holdes adskilt. Ingen ny generell budsjettgodkjenning etterspørres.

## Lokal implementerings- og feiltestplan

Før produksjonsadapter skrives: sikre gjenfunnet hashbundet kode, deretter lokale testdobler med nettverkssperret auth. Nære eksisterende prøver kjøres bare ved relevante endringer; ingen gjentakelse av gamle fullrestore/browserleveranser for denne planen.

Testkriterier for ny implementering: feil target/sourceAPIhost/redirect/proxy; feil JWTsignatur/alg/issuer/aud/role/sub/session/iat/exp og stor clockskew; settings200 uten keykontroll; feil serviceheader; ingen signup/hook/egressassert; tapt user/keycreate-respons med fersk eksakt recovery uten remint; maksimalt1samtidig/2totalt/4keys; refresh/resume nektes; actual480s-overbudsjett før sideeffekt; workerexit17/heng/vaktfeil; fencecommit består ved signalfeil; revokedkey fortsattsuccess; authcascade-rest; secret-/bodylogging/lekkasjesentinel; uklassifisert schema/defaultACL/trigger, fremmedobjekt og ulik gjenbyggingshash; R bevarer alle importfingeravtrykk; storage404/realtimeunsupported/introspeksjontomt/5xx gir aldri blanketPASS. Egen faktisk lokal testserver må utstede token og miste grantresponsen, og en egen crashprøve må dø etter mint før receipt: bevis UNKNOWN_MINT, ingen remint/Q/R-PASS/tidlig CLOSED, fersk egen sessioncleanup og failclosed ved ukjent U/L eller fristoverskridelse. LangJWTutløp må senere måles faktisk hos provider; lokal klokkesimulering er ikke hosted bevis.

Implementeringsleveranse krever diff-/evidensreview APPROVED uten åpne CRITICAL/MAJOR, alle nye feiltester bestått, privatcleanup/fravær og full kilde-/avhengighetsbinding. Selv da er externalExecutionPermitted=false til egen konkret ressurs-/startbeslutning og alle faktiske admissionporter er bestått.

## Leveransestatus

Uavhengig adversarial planreview fullført i to runder: første REVISE/ett MAJOR om tapt passordgrant-respons; andre APPROVED/0åpne funn etter eksplisitt UNKNOWN_MINT-port. Se `output/hosted-principal-plan-2026-10-24/review-round-1.md` og `security-final.md`. Godkjenningen gjelder planen, ikke at supported U/L, principaler eller cleanup er eksternt bevist.

ya9r.11 beholdes in_progress siden hosted adapter/integrasjon og bevis fortsatt mangler. Denne planens ferdigstilling er ikke lukking av hele saken. Ingen kode, kontrollbruker, key, rolle, schema, providerinnstilling, fixture, ressurs, import, patch eller e-post er opprettet/endret.

## Lokal implementeringsavgrensning 26.10.2026

Eier ba om kodegjenfinning og lokal implementering av ya9r.11. Alle129kode/138dependencyfiler er nå gjenfunnet og SHAverifisert; original cf0fb89e-commitobjekt ble ikke gjenfunnet. Eget baselinecommit c27e5ef på codex/hosted-probe-integration i /private/tmp/spansk123-hosted-probe-2026-10-26 bygger på eksakt PR14head84446a2. Varig manifestbundet kilde-/dependencyarkiv er output/hosted-probe-implementation-2026-10-26/verified-source-and-dependencies.tar.gz;21proveniensbindinger består. Hovedappkopi urørt.

Dette implementeringssteget lager den separate kvalifiseringskjernen med profil-/requestpolicy, offentlig asymmetrisk JWTverifisering, holdbar mint-/ressursjournal, typet evidens, katalog-/baselinekontrakt og fersk vaktcleanup. En faktisk AF_UNIX HTTP-testprovider gir tapte responser og eget prosesskrasj etter servermint. Krypteringsnøkler genereres bare syntetisk lokalt; ingen kilde-/providerhemmeligheter eller ny avhengighet. Global expiry/langelevetid er eksplisitt klokkesimulert i lokal test, ikke hosted bevis.

Den nåværende lokale kjernen skal ikke inkludere et aktiverbart hosted CLI-/Management-/DB-/schema-installløp. Ekte providerprofiler/U/L, Storage/Realtime og hosted transport-/schemaadmission er fortsatt egne uavklarte grenser, ikke en vellykket integrasjon. Forespørselsplanlegging er ren og må avvise feil host/metode/path/query/headers/body; lokal transport godtar bare et scopebundet privat Unixsocket. Ekstern modus avvises før I/O. Produktkode bruker ingen simulator som hosted fallback. Utførte lokale operasjoner kan kun gi LOCAL_QUALIFICATION/INCOMPLETE og operativefalse, aldri allApiPassed eller en kvittering som gammel restorelauncher godtar.

Ny journal må ha eksklusiv prosesslås, O_NOFOLLOW/0600/0700/sizebound/atomisk fsync og terminalimmutabilitet. Faste Q/Rfrister ved opprettelse, ingen remint, ingen gjenbruk av ukjent createutfall; egne markører og friske oppslag, maksimal1samtidig/2brukere/4nøkler. Mintintent før sending binder egen bruker og tidligere attestert U/L, ikke et klienttimeout. Mintkvittering er offentlig projeksjon av verifiserte claims, aldri token. Manglende kvittering tolkes også etter ekte workerexit17 som UNKNOWN_MINT. Fersk cleanup skal stoppe egen arbeidergruppe før ny adapter; egen semantisk DBfencecommit før signal. Cleanup må kreve friske zeroAuth-/revokebevis og faktisk clock>=max(U+L,validert exp)+30. UNKNOWN_MINT kan aldri bli Q/R-PASS; ukjent U/L eller overhardEnd blir CLEANUP_FAILED og bevis bevares. Ingen cleanup-retry/remint/evidenssletting skjult som recovery.

Alle nye feiltester må kjøre, med uavhengig slutt-review før levering. Gamle originalfiler/historiskledger/replay/reopening/launcher endres ikke. ya9r.11 forblir in_progress for gjenværende hosted integrasjon og bevis; dette er starten på lokal implementering, ikke en erstatning for hele24Octplanen eller en ekstern startbeslutning.

26Oct reviewrunde1 REVISE/MAJOR1: Nulloppslag etter tapt create-respons utelukker ikke sen servercommit. Rettet kontrakt: hver createintensjon må før sending binde attestert latestEffect-grense eller senere dokumentert ferdigutfall/fence. Fersk recovery/nullkontroll må skje etter denne grensen og bindes til eksakt intent/egen markør; manglende grense gir CLEANUP_FAILED, bevart intent og ingen ny create. Faktisk lokal HTTP-provider skal returnere null før forsinket createcommit etter tapt svar; kjernen avviser tidlig closure, uten retry. Ingen påstand om at Supabase tilbyr slike grenser.

26Oct implementeringsreviewrunde1 REVISE: MAJOR1 løses med fersk eksplisitt klokke før hvert recoverykall og etter observasjon, gjenstående totalbudsjett og fast roundEnd/hardEnd; arbeideren leser faktisk veggklokke før mint. MAJOR2 løses ved terminal journalføring på transport/protokoll/signalfeil uten råfeillogging eller automatisk retry. MAJOR3 avgrenses uttrykkelig: denne første kjernen leverer fersk recovery under levende supervisor med originalt Popen-eierskap, IKKE en uavhengig vakt. Supervisor-død, separat watchdog, operativ coordinator-/katalog-/hostedtransportintegrasjon er gjenstående ya9r.11 og sperrer hosted start. Ingen uavhengig-vaktpåstand eller gjenbruk av denne prøven som slikt bevis. Ny testdekning omfatter faktisk utilgjengelig socket, ødelagt respons, signalfeil og faktisk lokal utveksling som krysser simulert fastfrist.

26Oct lokal del levert i commit58b42de35b8af1d8ccb01fe95b782285808495a8:31nye+9nære regresjonstester PASS, alle ni slutt-reviewhasher matcher, APPROVED0. Komplett Gitbundle og276filers kilde/dependencyarkiv er varig bevart/gjenåpnet/SHAverifisert i output/hosted-probe-implementation-2026-10-26/. ya9r.11 er fortsatt in_progress. Neste lokale arbeid er uavhengig watchdog/supervisor-død og operativ integrasjon; ingen hosted start er tillatt eller hevdet. Se README/verification.json/security-final.md for eksakt avgrensning. Den gamle kildegjenfinningsblokkeringen er løst.
