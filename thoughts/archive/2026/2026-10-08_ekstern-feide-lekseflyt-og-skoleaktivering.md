# Ekstern Feide-verifikasjon, drift og skoleaktivering

8. oktober 2026. Utførelsesplan under den kanoniske Feide-planen fra 28. september. Operativ status føres i Beads: `mbzi` (ekstern innlogging), `pial` (Vercel), `4y2p` (TLS), `brq` (drift/personvern), `zq9b` (informasjon/DBA) og `rbec.4` (ekstern lekseflyt/pilot). Dette er ingen parallell oppgaveliste eller godkjenning av elevbruk.

## Oppdrag og ramme

Produkteier har bedt om å få Feide og én komplett lekseflyt verifisert eksternt, lukke driftsavvik og ferdigstille personverninformasjon, databehandleravtale og skoleaktivering. Nødvendige rettelser og leveranser til beskyttet staging inngår. Offentlig no-login-app, produksjonspromotering, nye betalte tjenester og ekte elevdata inngår ikke uten konkret videre beslutning. Skoleeier kan bare aktiveres etter identifisert motpart, dokumentert godkjenning og nødvendige avtaler; dette kan ikke erstattes av leverandørens egen beslutning.

Arbeidskopien inneholder omfattende eksisterende, ucommittede endringer på `codex/uttaleskole-refold`. Disse skal bevares. Ikke bytt eller nullstill dem. Før eventuell stagingdeploy: bruk en avgrenset og inspiserbar leveranse med eksplisitt kilde-/byggmanifest, slik at upublisert kultur-/uttaleinnhold ikke utilsiktet leveres som del av en autentiseringsretting. Ingen push/merge eller oppdatering av `www`.

## Etablert utgangspunkt

- `app.spansk123.no` peker 8. oktober på beskyttet Ready Preview `dpl_8QffCfCLQJQ7odQkG85PWRmK3TaM` fra 5. oktober. Aktiv `index`-funksjon kjører i `iad1`, mens lokal konfigurasjon angir `arn1`.
- Skolesiden er tilgjengelig med eierens Vercel-økt. Uten denne videresendes besøkende til Vercel-innlogging.
- Siste tidligere Feide-test autentiserte syntetisk bruker og viste navnesamtykke, men returen ble GET/405. Appen krever form-POST. Hypotesen er Vercels SameSite=Lax-cookie og en innloggingsredirect som mister POST.
- Bare stagingklient 3102 og syntetiske Feide-testbrukere brukes. Ingen konto fra eierens virkelige skole skal velges selv om den foreslås i kontovelgeren.
- Stagingdatabasene er app `peglwndjqnrstwnlrdsa` og journal `quznpkwsapehdcmicgsq`. Data API holdes av. Ingen schemaendring er planlagt.

## Metode og beslutningsporter

### Innlogging

Gjenta ordinær innlogging i egen testfane. Samle bare metode, vert, sti uten query, status, tidsstempel og cookieegenskaper. Ikke skriv tokens, autorisasjonskoder, state, nonce, cookies, råsvar eller passord til logg, fil eller chat. Les nettverkshendelser hyppig; trunkert spor er ikke komplett årsaksbevis. Bruk kun offentlig dokumenterte syntetiske Feide-kontoer.

Hvis sporet bekrefter at Vercel-beskyttelsen omdirigerer callbacken, prøv den minste avgrensede testen beskrevet i `docs/feide/verifikasjon.md`: samme eksisterende signerte Vercel-cookie, samme vert/sti/utløp og Secure/HttpOnly, midlertidig SameSite=None. Dette er en endring av sikkerhetsegenskap og krever konkret godkjenning ved handlingen. Gjenopprett Lax i `finally`, også ved feil, og verifiser tilbakeføring. Ikke opprett nye nøkler, offentlige unntak eller slå av Deployment Protection. Ikke svekk appens POST-/state-/nonce-/PKCE-/signaturkrav. En bestått test lukker bare årsakshypotesen, ikke varig stagingoppsett.

Velg deretter dokumentert, beskyttet stagingtilgang som støtter cross-site POST. Foretrekk eksisterende autorisert automatiseringstilgang med vertsavgrensning og leverandørens SameSite=None-mekanisme hvis den kan brukes uten hemmeligheter i URL eller tredjepartsforespørsler. Nye credentials, utvidet tilgang eller svakere beskyttelse krever konkret godkjenning; arbeid videre med uavhengige oppgaver mens den avventes. Ikke la en testtilpasning fremstå som normal skolestøttet innlogging.

### Region og database

Les aktiv deploykonfigurasjon og dokumentert regionprioritet før retting. Sett bare Spansk123s tiltenkte runtime-region til Stockholm, uten failover utenfor valgt område. Dersom ny deploy kreves, kontroller kildepakken og kjør relevante tester først, deploy bare til Preview og flytt stagingalias først etter readiness/regionkontroll. Bevar gammel deployment som rollback. Prosjektinnstilling eller JSON alene er ikke bevis; verifiser faktisk funksjonsregion og syntetisk forespørsel etterpå. Regionvalget er ikke en påstand om EØS-eksklusiv behandling hos leverandørene.

Kontroller TLS-innstillingene for begge stagingdatabasene. Før eventuell aktivering: verifiser at runtime allerede bruker CA-/vertsnavnverifisering og at ingen testflyt pågår. Aktiver håndheving i staging og forvent kort omstart. Etterpå må ukryptert forbindelse avvises, verifisert TLS fungere og app/journal-readiness være normal. Bevar Data API av og eksisterende roller/RLS; ikke gi SQL Editor økte rettigheter for å få testene til å passe. Ved feil undersøk årsak, behold beskyttelsen og bruk konfigurert sikker forbindelse. Ikke slett eller gjenopprett eksisterende database som feilsøking.

Dokumenter øvrige driftspunkter fra faktisk kode og leverandørbevis: logger, retensjonsjobb, økt-/transaksjonsopprydding, varsling og isolert backuprestore. En lokal dump/restore er ikke leverandørbackupbevis. Restore må skje i separat godkjent testmål; ikke kjøp ekstra miljø eller overskriv staging. Uavklarte leverandørforhold forblir eksplisitte og begrenser elevklar-status.

### Én komplett ordforrådslekse

Bruk ekte Feide-testinnlogging mot ekstern staging med fire separate syntetiske identiteter: skoleadministrator, lærer, elev og uvedkommende. Eksisterende bootstrap/eierverktøy oppretter ikke en skole. Opprett derfor en liten, gjennomgått staging-fixture med følgende eksplisitte kontrakt før ekstern kjøring: kun den verifiserte appstagingdatabasen `peglwndjqnrstwnlrdsa`, eksisterende privilegert operatørtilgang (aldri `app_runtime` eller ny runtime-grant), eksplisitt syntetisk testmarkør og ny tilfeldig UUID per fixture. Read-only forkontroll bekrefter database/prosjekt, migreringer, rettigheter og at de konkrete ID-/referanseverdiene ikke finnes fra før.

I én transaksjon opprettes én `school_owner` med status `pending`, referanse `synthetic-feide-e2e:<uuid>` og tydelig testnavn; deretter én `school` med samme owner-ID, unik syntetisk `feide_org_id`, status `blocked` og testnavn. Kall så eksisterende `app_provision_school_owner()` med eksakt denne skole-ID-en, samme eierreferanse, operatør-ID og `synthetic-e2e/2026-10-08` som testautorisasjon. Funksjonen aktiverer bare disse radene og skriver livsløpshendelser. Ingen upsert, truncate, reset, oppdatering av eksisterende tenants eller schema-/RLS-/grants-endring. Avvik ruller hele transaksjonen tilbake. Test fixture-kontrakten mot lokal PostgreSQL før ekstern bruk; manglende eksisterende privilegert tilgang blir et konkret tilgangsbehov, ikke improvisert rolleutvidelse.

Den syntetiske administratoren må først ha fullført ekte Feide-testinnlogging. Bruk eksakt verifisert `iss`/`sub` fra denne testkontoen i `bootstrapFirstSchoolAdmin()`, med den nye skolen og dokumentert testreferanse. Bootstrapens revisjonsføring og økttilbakekalling beholdes. Gjeninnlogging må oppfylle uendret admin-ACR; hvis Feide-testkontoen ikke støtter dette, innhent egnet testkonto, ikke senk kravet. Administratorrollen brukes til å invitere den separate læreren via vanlig skoleinvitasjon. Læreren oppretter deretter klasse og inviterer eleven. Testlærerens navn gir aldri automatisk lærerrolle. Ingen seed-/reset-script brukes eksternt. Tidligere testdata bevares.

Verifiser: lærer logger inn, oppretter klasse og inviterer; elev ber om medlemskap; lærer godkjenner; lærer publiserer kort ordforrådslekse; elev finner og besvarer den; lærer ser korrekt gjennomføring og tall etter omlasting. Ett feil svar og senere retting skal være forståelig, uten lagret råsvar. Kontroller gjentatt innsending, uautorisert bruker/annen klasse, utlogging og gammel økt. Kontobytte må ikke vise forrige elevdata, og API/private sider må være no-store. Bruk minst desktop- og mobilbredde. Testkonti er ikke bevis for en bestemt skoles faktiske claims/ACR eller fysisk skoleutstyr.

Teknisk bootstrap gjennom eksisterende CLI kan være nødvendig, men det skal ikke gi en virkelig bruker skolemyndighet. Testprivilegier avgrenses til syntetisk tenant og tilbakekalles etter verifikasjon med eksisterende reversible tilgangsmodell; ingen permanent sletting uten godkjenning. Lag en redigert bevisprotokoll med forventet/faktisk resultat, tid, deploy-ID og kildeversjon.

### Personvern, avtale og aktivering

Sammenhold offentlig informasjon og DBA-bilag med faktisk serverlagring, råsvar under transport, leverandørlogger, lokal modus og kortvarig egenopptak. Kontroller oppdatert offentlig veiledning fra Datatilsynet/DFØ/Feide og leverandørenes DPA-er. Dokumentene skal dekke parter/roller, formål, registrerte/data, nødvendig behandling, tilgang, rettigheter, retensjon, sikkerhet/avvik, underleverandører/land/overføring, revisjon, slutt/retur/sletting og backup/journal. Skil foreslåtte frister fra implementerte og vedtatte frister. Ikke hev sertifisering, EØS-only eller skoleeiergodkjenning.

Fullfør alt kjent innhold lokalt først. Spør samlet om navngitt skoleeier, status på deres godkjenning og offentlige kontaktkanaler. Ikke finn på signatar, behandlingsgrunnlag eller godkjent retensjon. Juridisk gjennomgang/signering utføres av partene; ingen signering på deres vegne. Hvis dokumenter skal til Drive, lag agy-handoff etter repoets preferanse. Publiser først konkret gjennomgått informasjon til avtalt offentlig adresse, og les den tilbake. En skoleaktivering skal kreve godkjent teknisk port, avtale, dokumentert instruks/rolle/livssyklus og skoleeiers egen Feide-aktivering. Manglende skoleeier hindrer aktivering, men ikke teknisk stagingverifikasjon eller ferdigstilt leverandørunderlag.

## Verifikasjon og sluttstatus

Før kodeendring skrives meningsfulle nærtester for påvist feil. Kjør nærtester og nødvendige bygg, deretter `npm run test:all` før levering av appendringer. Ved dokumentendringer: kildekontroll, faktisk samsvar og `git diff --check`. Kjør Beads sync når Beads er endret. Ingen testresultater fra tidligere bygg tilskrives nye endringer.

Målet er først fullt oppnådd når ekstern flyt og driftsporter er bevist og konkret skoleaktivering/avtale er bekreftet. Delresultater rapporteres presist. Eksterne beslutninger kan ikke markeres ferdige med et dokumentutkast; bruk goal-status etter gjeldende regler og fortsett uavhengig arbeid.

## Kritisk gjennomgang

Runde 1: ett MAJOR-funn om manglende skoleopprettingsvei og skillet mellom administrator-/lærerrolle. Revidert med eksplisitt staging-fixture, isolert transaksjon, separate identiteter, vanlig invitasjon og uendret ACR. Runde 2: tidligere MAJOR markert FIXED, ingen nye vesentlige funn, `VERDICT: APPROVED`. Gjennomført av egen kritikeragent 8. oktober; dette er plangjennomgang, ikke produksjons-/skoleeiergodkjenning.
