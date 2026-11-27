# Produksjonsleveranse: kandidat, oppstart og tilbakeføring

Klargjort 12. november 2026, Beads y8nr/s2qg/rbec.4. Dette er et reviewbart leveranseunderlag, ikke en bestilling av publisering, migrering, kundeaktivering eller produksjonsendring. Faktisk levering må bestilles separat etter at de åpne portene er dokumentert bestått.

## Eksakt kandidat

[Kandidatpakken](../../output/release-candidate-2026-11-12/candidate.json) binder basecommit `ecd63b92e3ce287f02e4e779be469d49a5fb826d` og den gjennomgåtte pakkefiksen i `.vercelignore`, `scripts/build-vercel-public.mjs` og `tests/server/vercel-runtime.test.mjs`. Ingen ny produktfunksjon er lagt til. Runtimearkivet har nøyaktig de 589 inngangsfilene som ble kontrollert mot stagingdeployment `dpl_9bN6ms4U6pN9rQ13VYFr4J3U4CEw`, inkludert 215 forhåndsbygde offentlige filer. SHA-1 per fil og SHA-256 for arkiv/lockfil finnes i pakken. Servert appbygg etter bygging er `fcdf97b55d8da417`; de arkiverte opplastingsinngangene har før bygging `0d2238687fc24550`. Disse er ulike stadier av samme byggeprosess.

Bruk [runtime-source.tar.gz](../../output/release-candidate-2026-11-12/runtime-source.tar.gz) som portabel runtimeinngang. Det inneholder ikke node_modules, lokale absolutte avhengighetslenker, secrets eller private operatørdokumenter. Installér fra låst package-lock med `npm ci`; Node 22.x, testet med 22.23.4. Historikk/testkilder finnes i den bevarte [kandidatbundlen](../../output/integrated-school-candidate-2026-11-10/candidate.bundle) og ny packaging.patch. En fersk utpakking med `npm ci` og `npm run build:vercel` bestod. Byggingen oppdaterer seks genererte filer (CSS, HTML og service worker, samt public-kopiene); de tre resulterende ressursene er sammenlignet byte for byte med faktisk servert staging og matcher alle. Se [portabilitetskontrollen](../../output/release-candidate-2026-11-12/portable-build-verification.json). Sammenlign opplastingsinnganger med inngangsmanifestet og ferdig bygg med outputbeviset; ikke krev at genererte filer skal beholde inngangshashen etter bygging. Hovedarbeidsmappen er ikke en ren releasekandidat og skal ikke lastes opp med et uavgrenset `vercel`-kall.

Full lokal kandidatgate bestod tidligere 12. november: 112 generelle Node-, 112 server-/skoletester og 613 Chromium-tester, exit0, 7 eksplisitte optinskips. Faktisk staging har app 012/journal 006 og 23 kildebindinger; ordinær Feide/MFA, fire nye lekser, elevkvitteringer/retting/reload/lærerresultat og begge utlogginger er prøvd. [Kilde-/stagingbevis](../../output/external-staging-control-2026-11-12/README.md). Lokale PostgreSQL 17.11-bevis og dagens 11 installasjons-/stoppkontroller har eget avgrenset omfang. Ingen av disse er en faktisk hosted restore eller produksjonspatch.

## Produksjonsmål og inngang for første skole

Skoleappen ligger på `skole.spansk123.no` i det separate Vercel-prosjektet **spansk123-school-production** med runtime i `arn1`. Den 19. november ble domenet knyttet til produksjonskandidaten `dpl_TyPPfmzVFPd8NxFpUjyvSBnXrfKf` med appbygg `07fc803bd32aa9c1`. Ved kontroll 24. november fikk en anonym HTTPS GET til både roten og `/api/session` HTTP 302 til Vercels innlogging.

Før utprøving med en skole må bare skolens produksjonsdomene åpnes for ordinær Feide-innlogging. Verifiser fra en ren nettleser at lærer og elev kommer inn uten Vercel-konto, at skoledata krever riktig medlemskap og at øvrige deployer beholder tilgangsvernet. Ved feil under denne prøven gjeninnføres vernet på skoledomenet før videre feilsøking.

Eksisterende tiltenkte produksjonsdatabaser er kontrollert lesende:

| Bruk | Prosjekt | Region | Observert grunnlag 12. november |
| --- | --- | --- | --- |
| App | `ncrxkjkgcbiugwhmyrds` / Spansk123 | eu-north-1 | ACTIVE_HEALTHY, plattform17.6.1.063 / SQL17.6. Ingen public-tabeller eller aktuelle skole-/journalskjemaer. |
| Separat journal | `ulxalecuqjyezqruwtsd` / Spansk123 security journal | eu-north-1 | ACTIVE_HEALTHY, plattform17.6.1.171 / SQL17.6. Ingen public-tabeller eller aktuelle skole-/journalskjemaer. |

Førstegangsinstallasjonen 16. november brukte de frosne migreringene fra den verifiserte kandidaten. En rollbackprøve bestod i hvert mål før journal 001–006 og app 001–012 ble committet. Etterkontroll bekreftet alle 23 kildehasher, verifisert TLS og begrensede roller for den syntetiske workeren. Migratorenes midlertidige SET- og CREATE-tilgang ble fjernet. Appens produksjonspooler er `aws-1-eu-north-1.pooler.supabase.com`, og journalens er `aws-0-eu-north-1.pooler.supabase.com`. [Prøve og opprydding](skoleworker-aktivering.md#scheduler-feilprøve-og-varig-friskmelding).

**Oppdatering 27. november 2026 (eierbeslutning):** Begge de tomme produksjonsprosjektene (`ncrxkjkgcbiugwhmyrds` / `Spansk123` og `ulxalecuqjyezqruwtsd` / `Spansk123 security journal`, begge med 0 skoler og 0 ekte elevdata) er slettet i Supabase for å unngå løpende kostnader frem til første Feide-skole signerer. Stagingprosjektene (`peglwndjqnrstwnlrdsa` og `quznpkwsapehdcmicgsq`) er beholdt. Før første kundeskole aktiveres må et nytt produksjonspar opprettes i `eu-north-1` (direkte på PostgreSQL 17.12), migrering `001–012` (app) og `001–006` (journal) installeres på nytt, og `DATABASE_URL` / `SECURITY_JOURNAL_DATABASE_URL` oppdateres i Vercel-prosjektet `spansk123-school-production`.

Produksjonsklient 3204 er opprettet separat fra stagingklient 3102. Ved den [beskyttede produksjonsprøven 19. november](../../thoughts/shared/plans/2026-11-19_feide-produksjon-og-restoreproeve.md) mottok `https://feide-retur.spansk123.no/api/feide-return` Feides innloggingsretur og sendte den videre til `https://skole.spansk123.no/auth/callback`. Utloggingsreturen gikk til `https://skole.spansk123.no/auth/logout/callback`. En syntetisk konto fikk en økt uten skoletilgang. Den 20. november var begge midlertidige testvalg slått av. Kontroller registrert returadresse, appkonfigurasjon og mottakerens loggfelter ved skoleåpning. En eventuell overgang til direkte retur krever en ny sammenhengende inn- og utloggingsprøve.

## Miljøkontrakt uten hemmelighetsverdier

| Felt | Krav ved produksjonsoppsett |
| --- | --- |
| `NODE_ENV`, Node | production og 22.x; `LOCAL_OIDC_TEST_ENABLED` må være helt fraværende (også false avvises), ingen testissuer. |
| `PUBLIC_ORIGIN` | Nøyaktig godkjent HTTPS-skoledomene, uten Preview-/stagingadresse. |
| `DATABASE_URL` | Bare avgrenset app_runtime i produksjonsappdatabasen, aldri postgres/migrator. |
| `SECURITY_JOURNAL_DATABASE_URL` | Bare journal_runtime i separat produksjonsjournal. |
| `DATABASE_SSL`, `DATABASE_SSL_CA`, `SECURITY_JOURNAL_DATABASE_SSL_CA` | Bare `DATABASE_SSL=true`. CA-feltene inneholder kontrollerte PEM-sertifikater ved behov, aldri boolske verdier. Faktisk verifisert sertifikat/vertsnavn på begge forbindelser; ingen TLS-omgåelse. |
| `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` | https://auth.dataporten.no, egen bekreftet produksjonsklient og ny skjermet klienthemmelighet. |
| `SESSION_SECRET` | Ny, sterk produksjonsverdi; ingen gjenbruk av staging eller plassholder. |
| `FEIDE_ADMIN_REQUIRED_ACR`, `FEIDE_TEACHER_REQUIRED_ACR` | Påkrevd signert Feide-nivå for ansatte, med positiv/negativ prøve. Elevrollen får ikke automatisk MFA-krav. |
| Credentials/tilganger | Separat secret store og rolle-/tilgangsgjennomgang. Ingen operatør-, provisionerings- eller migratorcredentials i appfunksjonen. |

Verdier legges direkte i riktig secret store av autorisert operatør. Kopiering av stagingprosjektets miljø er ikke en akseptabel installasjonsmetode. Ny skoleworker må ha sin egen, produksjonstilpassede mål-/kildegjennomgang; den leverte inaktive workerpakken er hardbundet til staging og kan ikke kopieres direkte til produksjon.

## Oppstartskrav før elevdata

| Port | Bevis som må foreligge |
| --- | --- |
| Avtalepakke | Endelig skoleavtale/DBA A–D, leverandør-/fristbilag, kontoavtaletilknytning, land/overføringsvurdering, dokumentert kopi-/journalhorisont og kundens instruks/signatur. Åpne leverandørfelt er ikke kundens ansvar å gjette. |
| Skoleeier | Godkjent løsning, grunnlag/DPIA/PVO, informasjon og alternativ, navngitt myndighet/førsteadmin og konkret omfang. Ingen ny pedagogisk pilot kreves. |
| Gjenoppretting/patch | Leverandøravhengig hosted restore med fersk journal før åpning og støttet sekvensiell databaseoppgradering. Disse er fortsatt ikke utført. Følg eksisterende ya9r.11-prosedyre; ikke bestill nye Auth-/Management-nøkler eller rårestore som snarvei. |
| Databaseinstallasjon | Separat gjennomgått bootstrap av riktige minsteprivilegier, app001–012/journal001–006 og full 23-nøkkel/verdiavstemming. Først lesende metadata, deretter kontrollert rollbackprøve og eksplisitt bestilt varig trinn; ikke bruk gamle fixture-/grantpakker. |
| Drift | Faktiske produksjonspolicyer, avtale-/eksportdatoer, loggsletteterskel med margin, scheduler/monitor og mottatte feil-/uteblitt-/gjenopprettingsvarsler, kostnad/kvote og håndtering ved fravær. Global stagingjobb er ikke produksjonsdrift. |
| Brukerflyt og data | Ren profil, riktig produksjonsklient, rolle-/skole-/klasseavslag, sterk ansattinnlogging, fireområderskjede, kvittering/reload/resultat og begge utlogginger. Ingen manuelle cookieinngrep. Eksport/import og ingen personlige API-svar i offlinebuffer. |
| Innhold/utstyr | Lærerens kontroll av valgt innhold/lyd, relevant tilgjengelighet og faktisk skoleutstyr/mobil. Tidligere teknisk prøve er ikke full læreplangodkjenning eller dokumentert læringseffekt. |
| Tilbakeføring | Kjent produksjonsfallback eller førsteleveransens dokumenterte stans, fersk originaljournal, kompatibel kilde-/digestbinding og navngitt operatør. Aldri tilbakeføring til en stagingdeployment med stagingdatabaser. |

Portene dokumenteres i [skoleaktiveringen](skoleaktivering.md); [leverandør-/fristbilaget](leverandor-og-fristbilag.md) og [skoleworkerens oppstart/stopp](skoleworker-aktivering.md) gir respektive avgrensninger. Ingen port er bestått bare fordi denne tabellen finnes.

## Utførelsesrekkefølge ved separat bestilt levering

1. Bekreft mål, tidspunkt, ansvar, kundeinstruks, kostnadsramme og alle portbevis. Lag en lokal `staging -> main`-promoteringsgren mot da gjeldende main etter repoets policy. Ikke ta med den skitne hovedarbeidsmappen samlet. Dersom integrasjon endrer kilder, kjør relevante tester og fullgate på den nye eksakte kandidaten før levering; dagens bevis godkjenner ikke ukjente senere endringer.
2. Sammenlign installerte migreringer, roller og kildebindinger i de godkjente målene med leveransekandidaten. Bruk gjennomgåtte migreringer for eventuelle gjenstående endringer. Behold originaljournal separat. Hold skolen blokkert og kontroller app/journalhelse og negative tilganger. Ingen kopiering av syntetiske skoler, elever, økter eller testrettigheter til produksjon.
3. Gjenopprett runtime fra den fryste inngangspakken, `npm ci`, deretter `npm run build:vercel` **før opplasting**. Sammenlign utvalg/hashes. Express velger public-filer før fjernbygg; et bare fjernbygd public var årsaken til den tidligere 404-feilen. Ingen outputDirectory-overstyring, private docs eller school.html i offentlig CDN.
4. Lag en separat, først ubundet produksjonsdeployment med riktig produksjonsmiljø. Preview må ikke promoteres blindt med andre credentials. Verifiser faktiske inngangsfiler, region, HTML/JS/CSS/lyd, helse, no-store og fravær av data til uvedkommende. Bekreft at domene-/beskyttelsesoppsettet lar Feide form_post passere uten å redusere appens tilgangskrav.
5. Bekreft at det eksisterende skoledomenet peker på godkjent produksjonskandidat. Omkobling til en nyere kandidat skjer etter beståtte kontroller og egen leveringsbestilling. Ikke flytt www eller stagingaliaset. Behold konkret tidligere produksjonsdeployment som fallback når en finnes. Første levering skal ha en stansplan; det finnes foreløpig ingen tidligere godkjent skoleproduksjon å påstå som rollbackmål.
6. Aktiver bare skoler/personer som den separate skoleinstruksen omfatter. Kontroller normal kundekjede og varsling. Arkiver saniterte versjons-/tilgangs-/frist-/slettebevis; elevdata og credentials hører ikke hjemme i repo eller salgsrapport.

## Tilbakeføring og stans

Før første elevaktivering kan en mislykket førstegangslevering holdes utilgjengelig uten å slette skjema eller journal: behold skolen blokkert, tilbakekall egne test-/oppstartsøkter etter gjennomgått rutine, og la bare godkjent driftskontakt arbeide videre. Ingen bred database-reset eller automatisk skjemanedgradering.

Etter faktisk skolebruk: stans berørt tilgang gjennom gjennomgått skoleavgrenset operasjon og journalfør tilbakekall før appendring. Bevar eksportgrunnlaget og andre skoler. Identifiser det tidligere **produksjons**bygget og dets kildekontrakt. Bruk fersk originaljournal og prøv gjenåpningsporten mot de relevante slettingene/tilbakekallene før domene eller runtime flyttes. Et gammelt bilde av både app og journal er ikke en trygg tilbakeføring. Kilde-/digestregister kan bare endres etter gjennomgått kompatibilitetskontroll; ikke slett historie for å få helse grønn.

Stagingens eldre deployment `dpl_JDFreRwe8D3SZCiqGRd3S62ui3qw` og gamle 21-register er dokumentert **stagingfallback**, ikke produksjonsfallback. Behold additive 012/006 og originaljournal ved den allerede prøvde stagingtilbakeføringen. Produksjonsjobber stoppes databaseførst med eksakte egne rolle-ID-er, deretter bare deres cron/monitor; aldri global teamstans eller ukjente jobber.

Kundens endelige startbeslutning og en separat bestilling av faktisk publisering er fortsatt nødvendig. Denne pakken endrer ingen produksjonsressurs eller Feide-organisasjonstilgang.
