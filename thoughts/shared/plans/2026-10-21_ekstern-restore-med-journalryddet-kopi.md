# Ekstern restore av en lokalt journalryddet appkopi

21. oktober 2026. Beads ya9r.1; overordnede porter ya9r/twkq. Dette er den konkrete gjennomføringsplanen eier har bestilt, ikke oppstart av en ekstern prøve. Planen erstatter den eldre eksterne rekkefølgen «skyimport før journalreplay». Ingen gammel CLOSED-kvittering eller eksisterende ressurs gjenbrukes.

## Anbefalt avgrensning

Gjennomfør ett nytt forsøk med **ett tomt Micro-appmål i eu-north-1**. Gjenopprett faktisk appbackup og journalbackup lokalt. Replay den ferske, autoritative originaljournalen i den lokale appkopien, inaktiver den, og eksporter først deretter. Importer bare den manifestbundne, ryddede apppakken til det nye målet. Journalbackupen prøves lokalt; originaljournalen flyttes eller tilbakesettes aldri. Målet åpnes ikke for appbruk og slettes etter kontrollen. Ingen patch, Feide-test, migrering til app012, appalias-endring eller produksjon inngår.

Den lokale metoden er faktisk bestått i commit `9a00c861511a2c08109f6bbeefe6a73dfb19e01a`, grunnlag `37688c4`, run `5756cba1` kl.13:59:14–13:59:50 Europe/Oslo. Beviset omfatter alle ti journalgrunner, kontrollskole/delt identitet, full pakke-/kodebinding, ferske transaksjoner, avslag ved samtidig journalendring og full opprydding. Alle råfiler og eksportfiler fra prøven er slettet: **det finnes ingen bevart ryddet pakke vi bare kan laste opp**. En ekstern prøve må lage en ny pakke fra faktisk stagingbackup under den nye fasens frister. [Lokal evidens](../../../output/preexport-replay-2026-10-21/README.md).

## Rammene beholdes

| Ramme | Bruk i denne planen |
| --- | --- |
| Høyst USD10 ekstra før avgift | Samlet for restorearbeidet, inkludert det tidligere slettede målet. Ikke USD10 på nytt |
| Høyst to isolerte restoreprosjekter totalt | `naxxlqwmeakwggpcdoeb` var prosjekt 1 og er slettet. Nytt appmål blir prosjekt 2, det siste i rammen. Ingen separat journalressurs eller automatisk erstatningsprosjekt |
| Region eu-north-1, høyst 24 timer per mål | Ny ID og egen absolutt slettefrist. Den gamle fristen gjelder bare historikken og gjenåpnes ikke |
| Operatørtilgang høyst 90 minutter | Foreslått aktiv kilde-/importfase har 70 minutter arbeid og opprydding innen 80 minutter. Hver leser får høyst 300 sekunder og aldri frist etter fasens slutt |
| To timers vedlikeholdsvindu | Fastsettes først når kode- og kostnadsportene består. Relativ kjøreplan nedenfor gir 15 minutter til sluttkontroll etter aktiv cleanup |
| Avtalt menneskelig prosjektsluttsletting | Eier utfører sletting av akkurat den nye ID-en. Operatøren leverer verifisert fremgangsmåte og kontrollerer faktisk fravær. Ingen agent-delete eller omgåelse |
| Logisk backup/restore erstatter fysisk prøve før patch | Allerede godkjent metodevalg. Fysisk leverandørrestore og samtidig tap av begge kilder blir ikke verifisert |

Én ny syntetisk skole med klasse/oppgave og nødvendige medlems-/læringsrader er nok. Gjenbruk dokumenterte syntetiske identiteter; ingen nye Feide-/Auth-brukere eller ekte personer. Den siste tillatelsen til én fixture/ett forsøk var knyttet til det nå slettede målet og ble ikke brukt. Den konkrete senere gjennomføringsbeslutningen må derfor knytte **ett** forsøk og **én** fixture til det nye målet; dette er ikke en ny generell budsjett- eller metodeforespørsel.

## Tillitsgrensen som må stå uttrykkelig i kjørebeslutningen

Supabase har bekreftet at kunden ikke kan stenge de to reserverte plattformrollene eller deres arvede lesestier. Vi forsøker ikke igjen og innfører ikke et generelt plattformrolleunntak for rådata. [Behandlet supportsvar](../../../output/logical-restore-2026-10-20/support-response-2026-10-21.md).

Den nye grensen er: rå og historiske appdata forblir i det isolerte lokale miljøet; Supabase mottar bare data etter fersk journalreplay og inaktivering. Leverandørens privilegerte administrasjon kan fremdeles ha tilgang til **den ryddede kopien**. Denne planen lover ikke null leverandørtilgang, heller ikke ingen plattformlogger eller ingen privilegert administrasjon. Eierens tidligere bestilling autoriserte den lokale implementeringen; den konkrete eksterne kjørebeslutningen må også omfatte denne avgrensede plattformtilliten.

Alle andre krav består: ingen historiske appinnlogginger, offentlige lese-/skriveveier, aktiverte kopierte jobber eller ukjente utgående mekanismer. En rolle godtas ikke bare fordi navnet begynner med `supabase_`. Leverandørroller, privilegiegraf og hooks skal klassifiseres etter dokumentert funksjon. Den lokale inaktive providerstubben er ikke bevis på den ekte plattformen. [Leverandørens rollebeskrivelse](https://supabase.com/docs/guides/database/postgres/roles).

## Det som fortsatt må på plass

Dette er inngangskriterier, ikke påstander om ferdig implementasjon eller ny tillatelse.

| Port | Nåværende grunnlag | Det konkrete arbeidet som gjenstår / bestått bevis |
| --- | --- | --- |
| G1: samlet ekstern koordinator | Lokal replay→eksport→kontrollimport bestått | Koble gjennomgått ekstern capture og minstetilgang til lokal replay, eksport og ekstern import. Fjern gamle faste ID-er, datoer og enkeltmålsbindinger. Ny fase får ny UUID, egen kvittering og egne roller. Ikke kjør gammel `run_full_restore.py` uendret |
| G2: ekte originaljournal og ferskhet | Lokal Docker-kilde og samtidighetsport bestått | Bind ekstern leser til eksakt organisasjon/prosjekt, sessionpooler/TLS verify-full/pinnet CA, databaseidentitet og faktisk readonly-profil. Ett konsistent journalopptak per lesetransaksjon; nye uavhengige transaksjoner ved neste port. Ingen selvrapportert prosjektnavnstreng som eneste proveniens |
| G3: ryddet eksportkontrakt og målport | Lokale pakker har med hensikt `cloudImportPermitted=false` | Ny separat ekstern kontrakt må binde riktig backup, journalinnhold/checkpoint, kode, post-replay-fingeravtrykk, eksportfiler og mål-ID. Ikke endre et boolsk flagg manuelt. Den gamle strenge rådataporten beholdes; en ny port tillater bare den verifisert ryddede pakken og den godkjente tillitsgrensen |
| G4: kildefrys, bevaring og avbrudd | Tidligere kildefrys-/abortkode finnes | Bevis samlet kjede med alle aktuelle skrivere, tilganger, in-flight-transaksjoner og ledige cleanup-minutter. Hold originaljournal og relevante appdata stabile fra siste opptak til sluttkontroll. Bevis gjenåpning av kilder også ved feil etter fixture eller import |
| G5a/G5b: målprofil før kjøp, faktisk admission før kilder | Eldre mål er slettet; lokale prepared-kontroller består | G5a før kjøp: gjennomgått forventet målprofil og konkret avvisningskode. G5b etter én POST: faktisk ID, region, versjon, pris, tilganger, API-er, rolle-/grantgraf og providerhooks må matche. Ukjent objekt eller sideeffekt stanser før kildehandling; ingen blind deaktivering av plattformtriggere |
| G6: penger og menneskelig sletting | USD10/tomålsrammen og slettansvaret er godkjent | G6a før kjøp: avstem samlet forbruk, tilbudt konfigurasjon/pris, navneintent, tilgjengelig menneskelig sletteansvar og regelen for absolutt 24-timersfrist. G6b etter POST: bind faktisk ID/pris og beregnet frist til samme mandat. Ingen kjøpshandling før G6a; ingen kildehandling før G6b |
| G7: konkret startbeslutning | Lokal metode valgt; planlegging bestilt | Etter ferdig kode-/feilreview: legg frem én samlet kjørebeslutning som autoriserer ett tomt mål med eksakt organisasjon/navneprofil, én fixture, uendret ramme, fast vindu, plattformtillit og opprydding. Faktisk ID finnes først etter POST og bindes deretter innen mandatet; G5b/G6b kan ikke erklæres bestått på forhånd. Dagens planbestilling starter ikke prøven |

G1–G4 kan klargjøres og feiltestes lokalt uten å kjøpe et mål, åpne kilder eller gjenta de gamle beståtte prøvene. Endringstester skal dekke den nye eksterne sammenkoblingen: feil prosjekt/TLS/rolle, gamle eller endrede journalopptak, byttet pakke/mål, leserutløp, endring under import, ukjent mutasjonsutfall og abort med siste intent. Eksisterende lokale komponentbevis gjenbrukes. Konkret kode-/sikkerhetsreview må godkjenne den samlede pakken før noe betalt mål eller kildefase starter.

## Kostnadsport før bestilling

Offentlig pris kontrollert 21.10: Micro USD0.01344/time; fakturering bruker hele påbegynte timeintervaller. For et mål som lever høyst 24 timer, reserveres konservativt 25 fakturerte timer: USD0.336. [Compute](https://supabase.com/docs/guides/platform/manage-your-usage/compute).

Velg standard gp3, høyst 8 GB, uten HA, read replica, PITR, IPv4-tillegg eller andre tillegg. Disk opptil 8 GB er oppgitt inkludert for primærdatabasen; som sikkerhetsmargin regnes likevel 8×25×USD0.000171 = USD0.0342. Reserver inntil 1 GB samlet ukachet egress til USD0.09, uten å trekke fra delt abonnementskreditt. Ny ressurs har da et konservativt beregningsanslag **USD0.4602, avrundet opp til USD0.47**. Dette er et prisanslag, ikke en leverandørhardcap. [Disk](https://supabase.com/docs/guides/platform/manage-your-usage/disk-size), [egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress).

Før prosjekt-POST må en kostnadskvittering vise `tidligere restorekostnad (eller dokumentert øvre grense) + ny verstefallskostnad + USD1 reserve ≤ USD10`. Tidligere prosjektforbruk avstemmes via organisasjonens bruks-/fakturaopplysninger, ikke nye API-kall mot det slettede prosjektet. Kan forbruket ikke avgrenses, er kostnadsporten uavklart; ikke anta USD10 ubrukt. Faktisk opprettelsesvalg, disk, tilbudt PG17-versjon og pris må stemme etter opprettelse før neste steg. Avvik betyr stopp og avtalt menneskelig avvikling, ikke nytt tillegg eller abonnement.

Supabase-restorebudsjettet er adskilt fra globaljobbens USD5/Vercel-kostnadsvakt. Den kjente Vercel-innloggingsblokkeringen er ikke en ny Supabase-innloggingsfeil eller grunn til å endre felles budsjett.

## Relativ kjøreplan – ett vindu på 120 minutter

Ingen klokke starter nå. Før T0 må G1–G4, G5a, G6a og konkret G7 bestå; G7 fastsetter dato og Europe/Oslo-klokkeslett. G5b/G6b må først bestå på det faktiske tomme målet etter opprettelse og senest T0+25, før kildeLOGIN, fixture eller capture. Mislykket admission gir avbrudd og menneskelig sletting, ikke et nytt mål. Lagre også UTC og kontroller vert-/leverandørtid før mutasjon. T0 er det avtalte vinduets start. A0 fastsettes til T0+25 minutter, og flyttes ikke ved forsinkelser.

| Tid | Handling og stoppvilkår |
| --- | --- |
| Før T0 | Alle offline porter, kostnadskvittering, eksakt kildecommit, native CLI-profil, klart slettansvar og konkret startbeslutning. Ingen betalt ressurs, fixture eller kildeLOGIN |
| T0–T0+20 | Start og bekreft uavhengig vakt. Lagre prosjektintent før én opprettelse av et tomt Micro-mål. Bekreft ID/org/eu-north-1, ACTIVE_HEALTHY, pris/konfigurasjon og planlagt slettefrist. Steng kundestyrte tilganger og kontroller ekte provider-/API-katalog uten appdata. Separat admissionoperatør lukkes og forbindelser bekreftes borte før A0; rollen gjenåpnes ikke |
| T0+20–25 | Sammenlign faktisk tommålmanifest med gjennomgått profil. Ved uavklart rolle/hook/API eller manglende bevis kl.T0+25: avbryt uten kildehandling og lever sletteinstruks. Ikke flytt A0 eller forleng frister |
| A0–A0+10 | Lagre kildeførtilstand, bekreft skrivebarriere og ingen uavklarte transaksjoner. Sett bare relevante runtime-roller NOLOGIN og terminer egne avgrensede kildeforbindelser. Opprett én autorisert syntetisk fixture med nye UUID-er og utløp innen fasen |
| A0+10–25 | Faktisk konsistent appfullbackup og baselinejournalbackup med PG17, schema-/funksjons-/TOC-/rad-/sekvensmanifest. Lukk hver kortvarige leser etter bruk. Fixture må dokumenteres i faktisk appbackup før sletting |
| A0+25–30 | Journalfør og slett akkurat fixtureskolen i kilden. Forvent nøyaktig school_blocked og school_deleted med riktige subject-bindinger. Fang fersk originaljournal; fullt eldre innhold skal være identisk |
| A0+30–45 | Rårestore lokalt i nettverksløs PG17. Verifiser backupfingeravtrykk, replay kanonisk journal, kontroller faktisk sletting og bevaring, inaktiver, ta ny uavhengig journalport og bygg ryddet eksport |
| A0+45–60 | Ny journal-/pakke-/målport umiddelbart før første målskriving. Importer bare pre→funksjoner→ryddede data→post med failfast og filhashkontroll; kontroller katalog, rader, sekvenser, migreringsdigester og API-/jobbavslag |
| A0+60–70 | Ny uavhengig originaljournaltransaksjon, samme fulle innhold/checkpoint; kontroller bevaring og gjenåpningsforutsetninger. Endret journal gjør kopien ugyldig. Ingen appåpning, ekstra fixture eller automatisk delta-replay |
| Senest A0+70 (=T0+95) | Ordinært arbeid stanser uansett fremdrift. Start/fortsett mål- og kildeopprydding. Manglende sluttbevis er en avbrutt prøve, ikke grunn til forlengelse |
| Senest A0+80 (=T0+105) | Egne operatører/autorisasjoner stengt, forbindelser borte, originalgrant og runtime-LOGIN gjenopprettet når sikre vilkår består. Lokale containere/privatefiler/AES ryddet. Kun saniterte bevis beholdes |
| T0+105–120 | Bekreft app- og journalhelse fra vanlig beskyttet appinngang, kildebevaring og tilgangsopprydding. Eier utfører helst målsletting nå; kontroller faktisk fravær. Dokumenter tydelig eventuell gjenstående menneskelig sletting innen fast 24-timersfrist |

Tilgangsfrist er et maksimum, ikke en garanti om at import rekker å fullføre. Korte leserroller får unik fase-/opptaksidentitet og `VALID UNTIL ≤ min(nå+300s,A0+80)`, bare testet readonly-profil og ingen medlemskap utover nødvendig SET til eksisterende leserrolle. Ingen gammel eller lukket rolle åpnes igjen. Admissionoperatøren har absolutt frist T0+25 og høyst 25 minutters levetid. Importfasen bruker en annen ny operatør, aldri en gjenåpnet admissionrolle, med frist høyst `min(opprettet+90min,A0+80min)`. Rolle-/fasekvitteringen viser mint, frist, stenging og null forbindelser for hver rolle. Ny måloperatør får bare nødvendig SET til NOLOGIN-migrator, uten tabellgrants, rolleadmin eller annen super-/create-/bypassrett. Fristvakten må både sperre ny innlogging og avslutte eksisterende egne forbindelser; VALID UNTIL alene er ikke nok.

## Capture, skrivebarriere og originaljournal

Kilder er bare app `peglwndjqnrstwnlrdsa` og journal `quznpkwsapehdcmicgsq`, Oversikt AS (`xgdvhggnihuzlnwlnjpq`). Native CLI-profil og organisasjon kontrolleres lesende ved senere preflight; ingen interaktiv login, nettlesertokenuthenting eller kildecredentialrotasjon inngår. Hele opptaket må ha dokumentert syntetisk proveniens; uventet ny skole/person eller uavklart datakilde stanser før fixture/fullcapture. Forventet ekstern modell er app001–011, journal001–005 og 21 registrerte kildehasher; dette må kontrolleres ferskt før kjøring. Lokal lærerdemo app012/26 digester er et separat produktspor og importeres ikke.

Inventer LOGIN-, SET-, INHERIT-, eier- og SECURITY DEFINER-skriveveier, poolersesjoner, aktive/prepared transaksjoner, DDL og operatører. En NOLOGIN-endring eller et advisory lock som andre skrivere ikke følger, er ikke alene en skrivebarriere. Andre administratorer skal ikke arbeide på kildene i vinduet. Uforklart skriver eller metadataendring stanser før fixture.

Den varige globale authjobben skal forbli urørt. Dens kjente wrapper kan rydde globale økter/OIDC og oppdatere egne kjøretellere, men ikke fixture, skole-/læringsrader eller originaljournal. Bevaring må skille disse dokumenterte endringene fra beskyttede data. En fremtidig fasefrist som generell tillatelse til enhver forsvunnet authrad er utilstrekkelig: faktisk verifisert wrapperkode, rolle og gyldig utløps-/revokasjonsgrunn må forklare endringen. Kan dette ikke bekreftes uten å stoppe jobben, avbrytes restoreprøven; ikke endre global drift fra denne planen.

Appbackupen og baselinejournalen bindes til konsistente snapshots under samme stabile domene-/journalskrivebarriere. Bruk native PG17, faktiske funksjonsdefinisjoner, komplett TOC, row hashes/counts og stabile sekvenser. Arkiver på høyst 64 MiB hver, total overføringsramme høyst 1 GB. Uventet Auth/Storage/Vault-innhold, subscriptions, store objekter eller nye datatyper stanser og krever ny dekning; de gamle nullmålingene er ikke evigvarende bevis.

Etter kontrollert fixturesletting er originaljournalens eneste tillatte tillegg de to nye fixturehendelsene. Ingen mutert prefix, subject-bytte, sen commit av en eldre ID eller uventet event aksepteres. Journalopptaket må kobles til faktisk TLS-/prosjekt-/database-/rolleproveniens. Eksportert JSON med et prosjektnavn i seg er ikke tilstrekkelig.

Replay bruker ett konsistent journalbilde. Dette lesesnapshotet avsluttes før hver neste ferskhetskontroll. Ny uavhengig transaksjon kreves etter replay/før eksport, før målimport og etter import/før sluttbevis. Sammenlign full innholdshash **og** checkpoint. Kildens relevante skrivere forblir sperret gjennom disse portene. En ny eller uavklart journalhendelse betyr avbryt og forkast målkopien; ingen automatisk forlengelse eller ekstra replayrunde.

## Tomt mål og tillatt import

Nytt navn velges fra faktisk kjøredato og fase-UUID, eksempelvis `spansk123-reconciled-app-<dato>-<fase>`. Ingen mål-ID finnes nå. Nytt tilfeldig målpassord og kortvarige klienthemmeligheter holdes bare i prosessminne eller nødvendig ny privat AES-lagring, aldri argv, logger eller kvitteringer; klientgenerert SCRAM og TLS følger den beståtte protokollen. Opprettelsesintensjon, request-/responstidsbrakett og providerstamp lagres før ID godtas. Ukjent POST-utfall håndteres bare med inventar og eksakt navn/org; aldri blind retry. Uavklart/duplisert ressurs betyr stopp og menneskelig avklaring. Kostnads- og sletteklokke regnes konservativt fra tidligste relevante intent/providerstamp, ikke fra når vi oppdaget ressursen.

Før data: bekreft anvendt DB-/pooler-allowlist for operatørens verifiserte adresse, TLS enforcement og verify-full. Nettverksregler dekker ikke HTTPS; Data API, GraphQL, Auth, Storage og Realtime må vurderes separat. Bruk deaktivert Data API hvis støttet og bekreftet; ellers bare et dedikert tomt eksponert skjema. API-/PUBLIC-grants og default ACL skal ikke gi tilgang til importert kode eller tabeller. [Nettverksbegrensningen](https://supabase.com/docs/guides/platform/network-restrictions), [API-grants/RLS](https://supabase.com/docs/guides/api/securing-your-api).

Inventer faktisk målplattform: roller med effektive SET/INHERIT-/adminveier, eventtriggere og funksjonskropper, publikasjoner/replikering, cron, webhooks, net-kø, extensions/FDW og andre oppstartsmekanismer. Bare reviewklassifisert plattformkonfigurasjon og nødvendige avgrensede kontrollobjekter er tillatt. Ingen kildeproviderhook, kilde-ACL, plattformcredential eller rå journalhistorikk importeres. Ukjent sideeffekt stopper før appdata; ingen superuseromgåelse, replikatriggermodus eller blind triggerfjerning.

Tillatt eksport er en separat pakke med hashbundne struktur-/funksjonsfiler og bare appdata etter replay/inaktivering. Ingen app_session/OIDC, aktive operatørautorisasjoner, globale testfixture-rader eller aktive drifts-/retensjonspolicyer. NOLOGIN-migratoreiere og en eksakt kontrollert funksjons-/RLS-kontrakt beholdes. Historiske kildepassord eller JWT-/API-nøkler skal ikke eksporteres. Baselinejournalens rådump forblir på den lokale krypterte disken.

Den eksterne pakken må ha en ny gjennomgått kontrakt som beviser hele kjeden: faktisk rawSHA → baselinejournal → fersk originaljournal → kanonisk replay/kodehash → post-replay-fingeravtrykk → inaktivering → ny eksportSHA → eksakt mål-ID og frist. Pakkens innebygde proof må være identisk med proofet som sammenlignes mot fersk journal. Rå/pre-replay-pakker og lokale syntetiske pakker avvises også om deres egne digester er korrekte. Ingen omdøping eller manuell flaggendring gjør dagens lokale pakker eksternt gyldige.

Før og etter import kreves effektive avslag for ikke-godkjente DB-/API-roller og faktisk kontroll av den nye målkonfigurasjonen. Bruk bare en egen ny, avgrenset kontrollnøkkel om HTTP-prober trenger den; ingen gamle kildekeys eller brede servicecredentials hentes. Skille mellom faktiske HTTP-avslag og native SET ROLE-/katalogbevis skal fremgå av rapporten; ikke påstå at en service-/authenticated-HTTP-rute er prøvd med gyldig token når bare DB-rollen er kontrollert. Målet får aldri appalias, brukertrafikk eller varig LOGIN fra denne prøven.

## Avbrudd, opprydding og menneskelig sletting

Ny koordinator må bekrefte watchdog-ready før første ressurs. Intents lagres atomisk før mutasjon; låst cleanup leser siste receipt etter prosessavslutning. Kontroller vaktens liv ved faseoverganger, og kontroller alle faktiske utfall før CLOSED. Ukjent leverandørutfall, uavklarte tilganger eller uverifisert fravær gir CLEANUP_FAILED og konkret varsling, aldri et grønt resultat. Ingen utvidet frist eller ny rettighet følger automatisk av feil.

Ved feil skal uavhengige cleanuptrinn forsøkes hver for seg: steng/terminer egne målroller og kontrollnøkler; fjern bare egne autorisasjoner/grants; håndter bare egen fixture med journalført sletting når sikker committilstand er kjent; avstem bevaringsmanifest og originaljournal; gjenopprett eksakt tidligere kilde-LOGIN og grantor/ADMIN/INHERIT/SET-tupler når gjenåpningsporten faktisk består. Ved uavklart kildemutasjon: ikke blind gjenåpning eller sletting; varsle konkret og hold sikker tilstand. Behov for inngrep etter fristen er en feil, ikke en forlengelse eller bestått cleanup.

Slett bare egne lokale containere etter label-/image-/UUID-kontroll, stopp → bekreftet stopped → ordinær remove → ferskt entydig fravær mot levende daemon. Råfiler, credentials og diagnostikk blir bare på ny AES256/0700/0600-lagring og fjernes etter at egne forbindelser/prosesser er stengt. Behold kun saniterte kvitteringer. Ved uavklart ressursfravær skal ikke filene fjernes på en måte som skjuler feilen; meld gjenværende ressurser og fristavvik.

Eier får ny prosjekt-ID, opprettelsesbevis, konservativ absolutt slettefrist og verifisert slettfremgangsmåte straks målet finnes. Planlegg sletting i samme totimersvindu; 24 timer er nødgrense, ikke ønsket ventetid. Varsle før fristen hvis målet fortsatt finnes; bekreft faktisk sletting. Pauset/NOLOGIN/inert er ikke slettet og stopper ikke nødvendigvis kostnaden. Ingen agent-delete, tredje prosjekt eller gjenskaping av gammelt mål.

## Når prøven kan sies å ha bestått

Kravene er samlet: faktisk fullbackup med fixture; historisk journalrestore lokalt; fersk originaljournal med verifisert proveniens; korrekt fixturesletting før eksport; ingen slettede data gjeninnført i skymålet; riktig målstruktur/rader/sekvenser/kildehasher; beskyttede kildedata/identiteter bevart; dokumenterte tilgangs- og jobbsperrer; frisk kildeapp/journal etter gjenåpning; alle egne midlertidige tilganger lukket; privat lagring ryddet; ny prosjektressurs faktisk slettet. Rapporten kan vise «dataprøve bestått, menneskelig prosjektsletting avventer», men **full gjennomføring** er ikke ferdig før siste punkt er bekreftet.

Patch er etterfølgende egen fase. Ferskt kompatibilitets-/versjonstilbud og tid til journal→app med helse, rollback og margin må dokumenteres. Tidligere leverandøranslag på omtrent én time per prosjekt gir ikke margin til begge i dette restorevinduet. Dagens planbestilling eller en bestått restore starter ingen oppgradering. [PG17.11-endringer](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes). HTTP-klienter må også tåle varslet TLS-endring tidligst 10. november; det løser ikke restoreisolasjon. [TLS-varsel](https://supabase.com/changelog/cbc-tls-ciphers-deprecated).

## Forslag til den senere konkrete kjørebeslutningen

Når den samlede pakken og portene er reviewbare, kan beslutningen lyde:

«Utfør ett forsøk med det andre og siste tomme appmålet i eu-north-1 innen den eksisterende samlede USD10-rammen, én ny syntetisk fixture og det oppgitte totimersvinduet. Bruk fersk originaljournalreplay lokalt før eksport; Supabase mottar bare den ryddede inaktive kopien og er fortsatt privilegert plattformoperatør for den kopien. Ingen rådataunntak, produksjonsåpning eller patch. Tilganger stenges innen den faste 80-minuttersfasen, og jeg utfører avtalt sletting av den konkrete nye mål-ID-en innen den oppgitte fristen.»

Dette er et ferdig forslag til beslutningsgrunnlag, **ikke en forespørsel om å godkjenne uferdig kode nå**. Ingen ny generell metode-, budsjett-, CLI- eller driftsgodkjenning skal etterspørres. Neste forberedende arbeid er G1–G4; deretter legges den konkrete kjørebeslutningen frem med forventet målprofil, samlet prisramme, fast vindu og cleanupbevis. Faktisk mål-ID, konfigurasjon, pris og slettefrist kvitteres først etter den ene autoriserte opprettelsen; admission må bestå før noen kildehandling.

Planreview: to runder; første 0 kritiske/1 vesentlig/1 mindre, begge rettet. Sluttverdict APPROVED, 0 åpne funn. [Reviewkvittering](../../../output/external-reconciled-restore-plan-2026-10-21/round-2-critique.md). Dette gjelder planen, ikke kjørbar kode eller ekstern start.
