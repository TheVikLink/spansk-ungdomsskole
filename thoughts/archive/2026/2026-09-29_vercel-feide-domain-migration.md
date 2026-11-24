# Vercel-migrering, modussubdomener og Feide-registrering

## Mål

Flytt den nåværende offentlige nettsiden og den lokalt testede lærer-/elevplattformen fra GitHub Pages og vanlig Node-oppstart til en kontrollert Vercel-leveranse, med `www.spansk123.no` bevart, ryddige adresser for lærer/elev, og Feide-registrering som bruker bekreftede opplysninger.

## Beslutningsforslag

- `www.spansk123.no` blir offentlig inngang og fortsetter å tilby gratis lokaløving uten konto.
- Én kanonisk vert (`app.spansk123.no`) håndterer Feide, konto, klasse, lekser, API og elev-/lærerøkter på samme origin.
- `laerer.spansk123.no` og `elev.spansk123.no` kan være vennlige innganger som videresender til henholdsvis `/laerer` og `/elev` på `app.spansk123.no`. Den innloggede løsningen må ikke spre sesjonscookies/API mellom ulike origins. Dette gir egne modusinganger, men én Feide callback og ett CSRF-/cookie-oppsett.
- Vercel kjører Express-backenden som funksjon; PostgreSQL og sikkerhetsjournal er fortsatt eksterne, separate, TLS-beskyttede databaser. Migreringer/provisjonering kjører som eksplisitte operatørjobber, aldri automatisk ved hver kaldstart.
- Bruk `arn1` (Stockholm) for funksjoner når kontoplanen og databasens nettverk tillater det. Dette er bare kjøretidsregion, ikke garanti for at CDN, logger, metadata, support eller alle behandlinger er EØS-begrenset.
- DNS for `www` blir ikke endret før preview, Feide-testklient, smoke-/regresjonstester, DNS-records, sertifikat og rollback er verifisert.
- Produkteieren har valgt Supabase som foretrukket PostgreSQL-leverandør. Oppgitt virksomhet for tjenesten er Oversikt AS, org.nr. 930 687 758. Dette er registrerte produkteieropplysninger; behandlingsansvarlig/databehandler-roller må fastsettes i avtalene med skoleeierne.
- Supabase-prosjekter for Spansk 1, 2, 3 må være adskilt fra eierens andre tjenester. Før syntetisk staging opprettes: bekreft konto/organisasjon, plan, tilgjengelige prosjektplasser og kostnad. Staging skal ligge i North EU (Stockholm) dersom kontoen støtter det. Produksjon skal være et eget prosjekt etter drifts-/personvernvurdering.
- Appdatabasen og den separate sikkerhetsjournalen må fortsatt ha separat tilgang og databaseidentitet som kravsatt av løsningen. Avklar om dette betyr to Supabase-prosjekter/databaser og hva det koster før opprettelse; ikke slå dem sammen bare for å passe i ett prosjekt.

Vertnavnene for modusene avventer produkteierens bekreftelse. Hvis separate hostnavn for innloggede økter ønskes, må sikkerhets-/OIDC-arkitekturen vurderes på nytt før koding: nåværende `__Host-` cookies, CSRF og `PUBLIC_ORIGIN` on purpose forutsetter én origin.

## Ikke-mål og porter

- Ingen elevdata, skolekontoer, ekte Feide-brukere eller produksjonsleksedata i preview.
- Ingen hemmeligheter i Git, chat, lokal `.env.example`, deploy logs eller nettleserkode.
- Ingen automatisk DB-migrering, schemaendring eller første skoleadministrator ved Vercel cold start.
- Ingen nameserverflytting eller endring av `www` før separat cutover-beslutning med kjent DNS-leverandør, TTL, gammel GitHub Pages-target og rollback.
- Sikt-registrering skal ikke inneholde antatt foretaks-/kontaktinformasjon, uavklart datalagringssted eller svar som fremstiller utkast som innført rutine. Selve publiseringen skjer først etter at nødvendige virksomhets-/driftsopplysninger og personverntekster er komplette.
- Ingen elevbruk før hostingens vilkår/DPA, underleverandører, databehandleravtale, skoleeierens risikovurdering og nødvendig DPIA/aktivering er gjennomgått og vedtatt.

## Akseptansekriterier

1. Appen kan bygges lokalt for Vercel uten å starte en lytteport under serverless import; lokal Docker-/CLI-server virker fortsatt.
2. Alle statiske ressurser som Vercel serverer fra CDN finnes i byggartefaktet under `public/`, mens elev-/lærer-HTML, API, auth og callback aldri blir offentlig cachet.
3. Én serverless Express-funksjon har kontrollert DB-poollevetid, fail-closed avhengighets-/journalfeil, robuste feilgrenser og ingen prosessbasert forutsetning for session-state, locking eller scheduler.
4. Vercel preview kjører med separat syntetisk Feide-provider og separate, tomme staging-databaser fra produksjon; automatisk PR-preview/branch deploy er av etter kostnads- og datariskvurdering.
5. Native PostgreSQL-testene, skole-UI-testene, login/logout, journal/restore og de eksisterende katalog-/offline-regresjonene består.
6. Valgt hostmodell, DNS-poster, kanoniske callback-/logout-adresser, scopes/claims og Sikt-verdier er skrevet inn i Feide-underlaget. Ingen OIDC-URI publiseres før Vercel-domainet er verifisert.
7. Sikt-registrering og Vercel-prosjekt eies av riktig virksomhet/produkteier; konto/CLI har bekreftet tilgang. Faktiske Feide-test-login og claims testes før produksjonskonfig.
8. Før DNS-cutover er `www` fortsatt tilgjengelig på GitHub Pages; det finnes en eksplisitt rollback til eksisterende CNAME-target og fresh test av Vercel-sertifikat, cache, service worker, audio, mobile UI, API og auth.
9. Ekte Feide-, drifts-, avtale- og skoleeierporter rapporteres separat fra lokal test.

## Filer som forventes berørt

- `package.json` – bygg- og deploytestkommandoer.
- `vercel.json` – Express entrypoint/routing, region, caching og preview/build policy.
- Ny serverless entrypoint, sannsynligvis `api/index.js` eller `index.js`, og adapter i `server/` som deler appfabrikk med `server/index.js`.
- `scripts/build-school-content.mjs`, `scripts/build-offline.mjs` eller ny Vercel-byggescript – staging av eksisterende app, katalog, service worker, CSS, lyd og skoleflate til `public/`.
- `tests/server/` og nye Vercel-konfig-/build-output-tester.
- `docs/feide/README.md`, `registrering-og-attributter.md`, `drift-og-beredskap.md`, `verifikasjon.md`, `leverandorerklæring.md` – Vercel, domener, faktiske DPA-/region-/loggporter og registreringsutkast.
- `.gitignore` – `.vercel/` og Vercel lokal miljøfil/artefakter om de ikke allerede er ignorert.
- Eventuelt `README.md` for deploy/rollback-instruks.

DNS, Vercel-prosjekt, faktiske hemmeligheter og Feide kundeportal er utenfor repoet; eksterne endringer utføres bare i tråd med produkteierens mandat.

## Trinnvis gjennomføring

1. **Avklar vertnavn og eierskap:** Vercel-teamtilgang er bekreftet og et separat `spansk123`-prosjekt er opprettet. Bekreft ønskede lærer/elev-vertsnavn, DNS-leverandør, nåværende poster og TTL, juridisk tjenesteleverandør, kontaktadresse, personvernlenke og faktisk supportopplegg. Avklar om det finnes et Sikt-utkast fra før. Velg kanonisk origin før callback registreres.
2. **Avklar Vercel-rammer:** undersøk gjeldende kontoplan, tilgjengelig funksjonsregion, Node-runtime, funksjonsgrenser, pakke-/filstøtte, Vercel DPA, logging/retensjon/lokasjon, statiske ressurser, preview-beskyttelse og databaseforbindelser/pooling. Før uavklarte forhold inn i risikodokumentasjonen.
3. **Tilpass serveroppstart test-først:** trekk ut en asynkron, validert appfabrikk og trygg levetid for databasepoolene. Behold lokal CLI-oppstart, legg til Vercel-adapter og valider origin/vertsnavn. Test gjenbruk av varm instans og at DB-/journalfeil stanser tilgang.
4. **Bygg og kontroller ressurser:** legg til deterministisk bygging av `index.html`, `dist/`, manifest, service worker, produktlyd, skoleflate og uforanderlig innholdsmedia til Vercels `public/`. Kontroller hasher/stier/manglende filer. Autentisert HTML/API skal være privat `no-store`; service worker skal også ha kontrollert cachepolicy.
5. **Kjør lokal Vercel-paritet:** lokal Vercel-build bestod og beskyttet preview er oppe på `https://spansk123-8ivcivif1-theviklinks-projects.vercel.app`. Ruten `/` sender videre til statisk no-login-startside. Preview ble kontrollert med SSO-omgåelse fra CLI: startside, skole-JS og lyd gir 200; `/school` gir fail-closed 503 fordi separat database/Feide-staging ikke er konfigurert. Kjør gjenstående OIDC callback/cookies, utlogging, lærer/elevflyt, sletting/retensjon/restore og header/cache-regresjoner når syntetisk staging finnes.
6. **Preview-miljø:** Vercel-project access er verifisert. Preview har SSO-beskyttelse; direkte uautentisert forespørsel gir 302 til Vercel SSO. Kjør først mot separate syntetiske databaser og IdP. Kontroller fravær av persondata samt bygg- og kostnadsgrenser. Ikke gjenbruk produksjonshemmeligheter eller database.
7. **Feide-testregistrering:** opprett testkonfigurasjon i Sikt/Feide under riktig leverandørorganisasjon; bruk kanonisk HTTPS-origin og eksakte callback-/logout-adresser; be bare om `openid` og begrunnet navnefelt. Test issuer, audience, sub, nonce, PKCE, signatur, ACR og logout med syntetiske/testbrukere. Lagre bevis, ikke hemmeligheter.
8. **Klargjør produksjonsopplysninger i Sikt:** fyll ut tjenestemetadata, begrunnelser for hvert felt, leverandørkontakt, personvern-/tilgjengelighetslenker, faktabasert leverandørerklæring og DPA-utkast. Organisasjonsrutiner som ikke finnes skal merkes uetablert. Skoleeier må ha risikovurdert løsningen og avtalt databehandleravtale før persondata brukes.
9. **Produksjonsport:** velg database/journal, EØS-lokasjon, nettverk, backup/restore, retensjonsjobb/overvåking, Vercel-plan/avtale, loggretensjon, hendelsesansvar, pris og rollback. Kjør PostgreSQL-/restoretester med driftslignende oppsett.
10. **Trinnvis DNS-omlegging:** legg først til og verifiser app-/modusdomener. La `www` peke til dagens GitHub Pages mens dette prøves. Bytt `www` sist, etter avklart tidspunkt, lav DNS-TTL, lagret gammel target, gyldig Vercel-sertifikat, smoke-test og innøvd tilbakeføring. Kontroller DNS og browser-cache uavhengig.
11. **Overlevering:** oppdater Beads med faktisk testbevis og verifiserte URL-er/innstillinger; list åpne produksjons- og skoleeierporter. Ingen endringer i DNS eller offentlig Sikt-publisering før nødvendige detaljer er bekreftet.

## Test-/verifikasjonskommandoer

- `npm run build:app` – existing static app/catalog generation still passes.
- `npm run build:vercel` (new) – builds static assets/Express function and fails on missing, extra private, or mismatched assets.
- `npm run test:school` – all synthetic Node/OIDC/API/security tests.
- `npm run test:school:postgres` – actual local PostgreSQL with journal replay/dump/restore.
- `npm run test:school:postgres:ui` – local PostgreSQL + Chromium learner/teacher flow.
- `npm run test:all` – existing app, content, offline and browser suite.
- `vercel dev` – kjøres når CLI-/prosjekttilgang finnes, med syntetisk lokalmodus og uten produksjonsverdier.
- `git diff --check` – clean patch.

## Faktagrunnlag

Vercel dokumenterer at Express kjøres som én funksjon, og at `express.static()` ikke leverer statiske ressurser; disse må ligge i `public/`. Vercel Functions bruker som standard `iad1` (Washington, D.C.), mens `arn1` (Stockholm) er tilgjengelig. Vercels publiserte DPA-side sier at avtalen gjelder Pro- og Enterprise-kunder; plan/kontraktsomfang, logger og øvrig behandling må gjennomgås særskilt. Feide anbefaler å begrense attributter og bruke OIDC Authorization Code + PKCE; vertsorganisasjoner aktiverer tjenester og må ha databehandleravtale/risikovurdering før bruk. Kilder:

- [Express on Vercel](https://vercel.com/docs/frameworks/backend/express)
- [Vercel Function regions](https://vercel.com/docs/functions/configuring-functions/region)
- [Vercel global network and regions](https://vercel.com/docs/regions)
- [Vercel Data Processing Addendum](https://vercel.com/legal/dpa)
- [Vercel custom domains](https://vercel.com/docs/domains/set-up-custom-domain)
- [Feide OIDC security](https://docs.feide.no/service_providers/openid_connect/security.html)
- [Feide activation requirements](https://docs.feide.no/home_organizations/how_to_activate_services_in_feide.html)

## Fremdrift 29. september 2026

Vercel-prosjekt `spansk123` er opprettet i `theviklinks-projects`; framework Express, build command `npm run build:vercel`, Node 22 og funksjonsregion `arn1` er satt. Lokal og ekstern build bestod, og runtime-funksjonen ble verifisert i Stockholm. Buildmaskinen kjørte i `iad1`. Et forsøk på å knytte `www.spansk123.no` feilet fordi prosjektet ennå ikke har vellykket produksjonsdeploy; DNS ble ikke endret. Ingen production deployment ble laget. Faktisk syntetisk IdP/database, lærer-/elev-HTTP-flyt på preview, egne modusdomener, kundedomener/callback, Sikt og drifts-/personvernporter gjenstår. Se `docs/feide/vercel-migrering.md` for HTTP-smoketest og den konkrete statusen.
- [Feide supplier declaration](https://www.feide.no/leverandorerklaering)

## Supabase og juridisk virksomhet – 29. september 2026

Produkteieren har valgt Supabase som foretrukket databasetjeneste og oppgitt Oversikt AS (org.nr. 930 687 758). Organisasjonsnavn og nummer er kontrollert mot [Enhetsregisteret](https://virksomhet.brreg.no/nb/oppslag/enheter/930687758). Opplysningen alene fastslår ikke behandlingsansvarlig/databehandler-roller, kontaktperson, supportadresse eller etablerte sikkerhetsrutiner; disse skal ikke fylles inn ved antakelse.

Supabase CLI-tilgang ble verifisert. Organisasjonen er «Oversikt AS». Produkteieren valgte det tidligere inaktive prosjektet `Spansk123`, ref `ncrxkjkgcbiugwhmyrds`, region `eu-north-1` Stockholm. Restore fra Dashboard fullførte, og etter et kort `Unhealthy`-vindu er project overview nå `Healthy`; Dashboard viser compute `t4g.nano`. Legacy `public`-tabellene `user_progress`, `classes`, `class_members`, `class_words` talte til sammen 9 rader (5,2,2,0). Etter eierens uttrykkelige slettesamtykke ble disse fire tabellene droppet uten `CASCADE`; Supabase SQL Editor viste suksess. `information_schema.tables` bekreftet ingen gjenstående base-tabeller i `public`. Re-run Security Advisor viste 0 errors, 0 warnings, 0 suggestions; Health Advisor viste 0 errors/warnings/suggestions. Ingen radverdier ble lest; ingen andre skjemaer/objekter endret. Supabase CLI krever ny autentisering. Dette prosjektet kan være appdatabasen, men Vercel er ikke koblet ennå.

Arkitekturport: lokal skoleplattform har separate `spansk_school` og `spansk_journal` databaser med ulike runtime/migrator-roller. Supabase dokumenterer at ekstra DB-er teknisk kan opprettes manuelt, men de er ikke synlige/administrert i Dashboard-integrasjonene; eget prosjekt anbefales når separat, integrert DB kreves. Se Supabase docs i `docs/feide/vercel-migrering.md`. Før eventuell opprettelse i eksisterende cluster vurder backup/restore/operasjon/isolasjon. Ingen andre DB-er, secrets, Vercel-env, DNS eller Feide-innstillinger opprettet/endret.

Prosjekteieren har et Oversikt AS Pro-organisasjonsabonnement synlig i Dashboard. Pauset prosjekt belastes ikke compute mens det er pauset; gjenopptakelse vil starte compute-bruk (standard Micro i Supabase Pro er omtrent USD 10/mnd før andre usage/avgifter, med organisasjonens månedlige compute credits tatt med i faktisk total). Sikkerhetsjournalen skal ha separat databaseidentitet/URL etter appens eksisterende krav; avklar om journalen får et annet, godkjent prosjekt eller om personvern-/sikkerhetsmodellen må endres før backend tas i bruk. Supabase oppgir at hvert prosjekt er en dedikert Postgres-instans; ingen journalprosjekt er opprettet.

Supabase oppgir at hvert prosjekt har dedikert database/compute; i betalt organisasjon er et ekstra standard Micro-prosjekt oppgitt til omtrent USD 10/mnd compute før eventuelle andre usage/add-ons og avgifter. Kontoens faktiske marginalkostnad avhenger av plan, compute credits og valgt konfigurasjon. Neste steg er å kontrollere nøyaktig plan/usage i Dashboard og avklare om eksisterende inaktive `Spanskhjelpen` kan brukes til Spansk 1, 2, 3, eller om eieren godkjenner et separat nytt prosjekt med forventet løpende kostnad. Se Supabases [billing FAQ](https://supabase.com/docs/guides/platform/billing-faq) og [compute-priser](https://supabase.com/docs/guides/platform/manage-your-usage/compute).

Supabase serverless-tilkobling skal bruke den anbefalte poolermodusen med eksplisitt vurdering av driverkompatibilitet, TLS og lave per-instans grenser; schemaendringer kjøres som operatørjobb. Produksjonsdatabase holdes adskilt fra staging og andre tjenester. Supabase-region alene er ikke dokumentasjon på full EØS-behandling eller skoleeiergodkjenning. Feide/Sikt, Vercel-preview, databaseintegrasjon, DNS og produksjon er fortsatt separate porter.

## Journaldatabaseprosjekt – oppdatering 29. september 2026

Produkteieren godkjente et eget Supabase-prosjekt for sikkerhetsjournalen. Prosjektet `Spansk123 security journal` er opprettet i Oversikt AS, ref `ulxalecuqjyezqruwtsd`, North EU (Stockholm, `eu-north-1`), standard Micro. Opprettelsesskjemaet viste USD 10/mnd ekstra compute før øvrig bruk/avgifter og eventuell compute-kreditt. Prosjektstatus er `Healthy`, databasen er `postgres`, Data API er av. Etter at eieren anvendte `003_fixed_trigger_search_path`, viser Security Advisor 0 feil, 0 advarsler og 0 forslag (kontrollert i skjermbilde 30. september 2026). Det private skjemaet `security_journal` inneholder `entitlement_revocation`, `entitlement_revocation_subject` og `journal_migration`; alle tre migrasjoner `001_revocations`, `002_account_deletion` og `003_fixed_trigger_search_path` er anvendt. `journal_runtime` er NOLOGIN og har bare schema-USAGE, SELECT/INSERT på journalhendelser, SELECT på migrasjonstabellen og USAGE på sekvensen. Rollen mangler UPDATE, DELETE, TRUNCATE, CREATE og funksjonsutførelse. Etter migreringen ble også `journal_migrator` satt tilbake til NOLOGIN, passordet ble fjernet, og eieren bekreftet at begge rollene har `rolcanlogin=false`. Ingen elev-/lærerdata eller varige testhendelser finnes. Ingen Vercel-miljøvariabler eller appforbindelse er satt. Ingen Vercel secrets, DNS eller Feide-innstillinger er endret.
