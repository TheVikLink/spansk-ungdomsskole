# OWASP ASVS 5.0.0 – avgrenset egenvurdering

Dette er en avgrenset egenvurdering av skolemodusprototypen mot [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0). Krav-ID-er er versjonert (`v5.0.0-…`) og kontrollert mot den stabile engelske kravlisten. I ASVS 5.0.0 er kravene merket med verifikasjonsnivå; denne gjennomgangen er ikke en full Level 2-vurdering. «Lokalt testet» betyr bare at den beskrevne koden og testen ble kjørt i det angitte lokale miljøet. Det er ikke sertifisering, produksjonsverifikasjon eller kommunal godkjenning.

Oppdatert 2026-09-28 etter lokal verifikasjon med PostgreSQL 17.11 og Chromium. Se [`verifikasjon.md`](verifikasjon.md) for kommandoer, resultater og avgrensninger. OWASP anbefaler versjonerte krav-ID-er; se [ASVS 5.0.0 om krav-ID-er](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x03-What-is-the-ASVS.md).

Den stabile engelske CSV-kravlisten inneholder 183 Level 2-kontroller. Alle 183 unike krav-ID-er fra V1–V17 er vurdert enkeltvis nedenfor. Antallet og ID-ene er verifisert mot OWASPs [v5.0.0 releasefil](https://github.com/OWASP/ASVS/releases/tag/v5.0.0). Vurderingene er konservative: «gjennomgått» alene betyr ikke at kontrollen er oppfylt, og dette er ikke ASVS-verifikasjon eller sertifisering.

| Krav-ID | Status | Evidens og avgrensning |
|---|---|---|
| v5.0.0-V2.2.1, v5.0.0-V2.2.2 | Lokalt testet, avgrenset | `zod`-validering i `server/app.js`; happy-/feilflyt i syntetisk E2E og native PostgreSQL-flyt. Ikke full schema-/fuzz-dekning av alle endepunkter. |
| v5.0.0-V2.3.1, v5.0.0-V2.3.3 | Lokalt testet, avgrenset | Invitasjonsflyt krever forhåndsgodkjent skolemedlemskap og engangsbruk; mutasjoner bruker transaksjoner. `identity-enrollment.test.mjs`, `school-flow.e2e.test.mjs`. Race-/parallelitetstester mangler. |
| v5.0.0-V2.4.1 | Delvis implementert | Global lokal IP-grense 300/min; login 60 og mutasjoner 50 per IP/rutemønster/min. Ingen last-/omgåelsestest eller produksjonsgrensemåling. |
| v5.0.0-V3.2.2 | Lokalt gjennomgått, avgrenset | Skolegrensesnittet bygger brukerinnhold med DOM `textContent`/noder i `server/public/school.js`; ingen `innerHTML`. Automatisk XSS-regresjon for alle dynamiske felt mangler. |
| v5.0.0-V3.3.1–V3.3.4 | Delvis implementert | Produksjonscookie bruker `__Host-`, Secure, HttpOnly, SameSite; CSRF-cookie er JavaScript-lesbar, Secure og SameSite=Strict. Lokal HTTP-testmodus er uttrykkelig unntak. Produksjonshode/atferd ikke testet mot ekte reverse proxy. |
| v5.0.0-V3.4.1, v5.0.0-V3.4.2 | Delvis implementert | HSTS ved sikker konfigurasjon; ingen CORS-allowlist fordi app og API har samme origin. Reverse proxy, alle feilsvar og offentlig hosting må verifiseres. |
| v5.0.0-V3.4.3–v5.0.0-V3.4.6 | Lokalt testet, avgrenset | Sikkerhetsmiddleware setter nå CSP globalt på HTTP-svar, inkludert helse, API, auth-redirect, skoleflate, JS/CSS, lydsti og 404; testen sjekker også `nosniff`, `no-referrer`, `frame-ancestors 'none'` og X-Frame-Options. Syntetisk E2E dekker disse representantene, men ikke proxy/TLS, samtlige varianter av feilsvar eller produksjonsrespons fra valgt hosting. `postMessage` og separate vertsnavn er ikke i bruk; automatisk redirect til Feide bruker den konfigurerte faste issuer/endepunktet. |
| v5.0.0-V4.1.1 | Delvis implementert | JSON-API og eksplisitte statiske content types i app/server. Full endepunktsinventar-/proxytest gjenstår. |
| v5.0.0-V6.2.* | Ikke relevant med begrunnelse | Produktet oppretter ikke lokale passord; identitet er delegert til Feide OIDC. Dette avhenger av at ingen alternativ passordinnlogging innføres. |
| v5.0.0-V6.3.1 | Delvis implementert | Lokal global- og login-rate-limit; Feide håndterer autentiseringsfaktorer. Feide-test, MFA/`acr` og IdP-beskyttelse er ikke verifisert. |
| v5.0.0-V6.3.3 | Delvis implementert; ekte IdP uavklart | Produksjonsstart krever `FEIDE_ADMIN_REQUIRED_ACR`; stegvis nyinnlogging sender `acr_values`, og ID-tokenets `acr` må eksakt samsvare før lærer-/administratorøkter får API-tilgang. Syntetisk høy/lav ACR og administrator-step-up testes. Skoleeier må vedta nivå; reell Feide-test og claims-bevis mangler. |
| v5.0.0-V6.5.1–v5.0.0-V6.5.5 | Lokalt testet for invitasjonstoken, avgrenset | Invitasjoner er ikke autentiseringsfaktorer: bruker må allerede være autentisert med Feide, og lærer/skoleadmin må godkjenne medlemskapet. Koder genereres med 24 CSPRNG-byte, lagres som SHA-256, er engangsbruk og utløper etter sju dager; syntetiske tester dekker utløp/gjenbruk. 10-minutters grense for out-of-band autentiseringskoder brukes ikke på disse tilgangsinvitasjonene; skoleeier må godkjenne sju dagers policy. |
| v5.0.0-V7.2.1–v5.0.0-V7.2.4 | Lokalt testet, avgrenset | Servervaliderte opaque referansetoken, 256-bit tilfeldighet, hash i database, rotasjon ved klasse-/skoleovergang, revokering ved logout og utløp. `session-service.test.mjs`, syntetisk E2E. |
| v5.0.0-V7.3.1, v5.0.0-V7.3.2 | Lokalt testet, avgrenset | Lærer/admin 30 min inaktivitet og alle sessioner 8 timer absolutt. Nettleseren sjekker session minst hvert 60. sekund og ved retur til synlig fane; kontobytte tømmer gammel DOM og laster siden på nytt. Native PostgreSQL/Chromium-test bytter konto i samme nettleser og tester tilbakeknapp. Varsling, fysisk delt enhet, ekte Feide og BFCache på tvers av nettlesere er ikke dekket. |
| v5.0.0-V7.4.1, v5.0.0-V7.6.1 | Delvis implementert | Lokal session lukkes før OIDC RP-logout; provider-returstate kontrolleres. Lokal test dekker samme nettleser og tilbakeknapp, men ikke ekte Feide, IdP-feil eller global SLO. |
| v5.0.0-V8.2.1, v5.0.0-V8.2.2 | Lokalt testet, avgrenset | Rollekontroller, klassegrant-journal, RLS med `app_runtime`, CSRF og skole-/elevtilgang. Native PostgreSQL 17.11 tester to eiere, tre skoler (to hos samme eier), to lærere og to elever per skole; skole, klasser, roster, oppgaver, mottakere og læringshendelser holdes innen valgt skole. `tenant-isolation.test.mjs` og syntetisk Chromium/OIDC utfyller. Full API-IDOR/rolle/status-matrise og produksjonsdatabasekonfigurasjon mangler. |
| v5.0.0-V9.1.*, v5.0.0-V9.2.* | Lokalt testet mot syntetisk issuer; ekte IdP uavklart | `openid-client` Discovery mot fast issuer med eksplisitt `enableNonRepudiationChecks`. `oidc-validation.test.mjs` bruker ephemeral RS256-nøkler og avviser feil issuer, audience, signatur, nonce og utløp; JWKS-nøkkelrotasjon godtas etter oppfriskning. Ekte Feide-nøkler, audience-/azp-claims og rotasjon mangler. |
| v5.0.0-V10.2.1 | Lokalt testet, avgrenset | Authorization Code med PKCE S256, state, nonce og engangs transaksjon; test mot lokal `oidc-provider`. Dette beviser ikke Feide-kompatibilitet. |
| v5.0.0-V13.1.1 | Delvis implementert | Dataflyt og nettverksmål beskrives i `README.md`. Faktisk DNS-/hosting-/loggnettverk er ukjent. |
| v5.0.0-V13.2.2 | Lokalt testet, avgrenset | Separate migrator-, app-runtime- og journal-runtime-kontoer; native PostgreSQL 17.11 verifiserer database-/RLS-flyt under runtime-rollen. Produksjonsrettigheter og hemmelighetsvault er ikke testet. |
| v5.0.0-V15.2.2 | Delvis implementert, lokalt testet for filinnlesing | Legacy no-login-appens tre lokale JSON-importveier avviser nå filer over 5 MiB før `FileReader`/JSON-parsing og gir synlig melding. Playwright tester grensetilfellet, at store filer avvises, og at gyldige assignment-/progress-/glossary-filer fortsatt importeres. Dette begrenser filbasert minnebruk, men er ikke generell CPU-/database-/nettverksbelastningstest eller server-side filopplasting. |
| v5.0.0-V13.3.1, v5.0.0-V13.3.3 | Uavklart | Lokale demohemmeligheter i ignorert fil; ikke produksjonsløsning. Nøkkelvault/HSM, tilgang, rotasjon og sletting må velges og testes hos drift. |
| v5.0.0-V14.2.1, v5.0.0-V14.2.2 | Delvis implementert | Sessionnøkler/CSRF i headers/cookies, Feide state i transaksjon; `no-store` på auth/API. ID-token sendes kun som standardisert RP-logout-hint. Full proxy-/cachetest mangler. |
| v5.0.0-V14.2.4, v5.0.0-V14.2.7 | Delvis implementert | Rå elevsvar lagres ikke; `school:retention` har rollback-preview og apply med separat append-only journal; elev/lærer kan slette konto og identitetsbinding; restore reanvender nyere medlemskap, konto- og retensjonsslettinger fra journal. Lokal PostgreSQL `pg_dump`/`pg_restore` med replay er testet. Avtalt lagringstid/schedule, faktisk scheduler, leverandørbackup og isolert katastrofeøvelse mangler. |
| v5.0.0-V14.3.1 | Lokalt testet, avgrenset | API/auth bruker `no-store`; service worker omgår kontostier. Native Chromium-test bytter elevkonto i samme nettleser, kontrollerer at gammel lekse ikke vises og trykker tilbake. Dette dekker ikke alle BFCache-/cacheimplementasjoner, skjermleser, fysisk delt enhet eller produksjonsproxy. |

## Individuell vurdering: V1 – Encoding and Sanitization

Kravtekstene er kontrollert mot den engelske OWASP ASVS 5.0.0-kravlisten. Vurderingen gjelder skolemodusserveren og skoleklienten, ikke Feide eller driftsleverandørens komponenter.

| Krav-ID | Status | Konkret grunnlag og gjenværende begrensning |
|---|---|---|
| v5.0.0-V1.1.1 | Delvis lokalt gjennomgått | Express dekoder rute-/spørringsdata, `express.json` parser JSON én gang, og cookie-parseren dekoder cookieverdien én gang i `server/app.js`. Skjemaene validerer parsede verdier. Ingen egen kanonikaliserings-/fuzztest for doble encodinger eller ugyldig UTF-8; ikke fullgodkjent. |
| v5.0.0-V1.1.2 | Delvis lokalt gjennomgått | `server/public/school.js` setter dynamisk tekst med `textContent` og bygger DOM-noder; det finnes ikke `innerHTML`, `document.write` eller eval i skoleklienten. Nedlastingslenker bruker Blob-URL eller statisk sti. Ingen systematisk browser-XSS-test for alle dynamiske felt ennå. |
| v5.0.0-V1.2.6 | Ikke relevant i produktkoden | Ingen LDAP/JNDI-tilkobling eller LDAP-søk; skoledata hentes parameterisert fra PostgreSQL. Revurderes hvis katalogintegrasjon innføres. |
| v5.0.0-V1.2.7 | Ikke relevant i produktkoden | Ingen XPath/XML-parser eller XML-spørringer. API-data er JSON. |
| v5.0.0-V1.2.8 | Ikke relevant i produktkoden | Ingen LaTeX-prosessor eller dokumentgenerering som tolker LaTeX. |
| v5.0.0-V1.2.9 | Ikke relevant for brukerinput i regex | Regex-mønstre i serveren er faste (UUID, skoleår, lydfilnavn); ingen regex bygges fra brukerinput. Ingen separat ReDoS-ytelsestest av samtlige mønstre. |
| v5.0.0-V1.3.3 | Delvis implementert og lokalt testet | Zod-skjemaer setter grenser på navn, leksetittel, innhold-ID, svar-ID og oppgaveantall; JSON-body er begrenset til 16 KiB og legacy lokale JSON-filer til 5 MiB. `school-flow.e2e.test.mjs` verifiserer syntetisk ugyldig JSON → 400 og for stor body → 413. Full felt-for-felt kontekstuell sanitiserings- og grensetestmatrise mangler. |
| v5.0.0-V1.3.4 | Ikke relevant i produktkoden | Ingen elev-/læreropplasting eller visning av SVG. Ressurser og lyd er produktstyrte. |
| v5.0.0-V1.3.5 | Ikke relevant i produktkoden | Brukerinnhold tolkes ikke som Markdown, CSS, XSL, BBCode eller et annet uttrykksspråk. Visning skjer som ren tekst. |
| v5.0.0-V1.3.6 | Delvis implementert; konfigurasjonsport gjenstår | Ingen request-/elevstyrt URL sendes server-side. OIDC-klientens discovery starter fra fast konfigurert issuer; produksjonskonfig krever HTTPS og lokal issuer er loopback-begrenset. Verifiser fortsatt issuer/discovery-endepunkter og utgående nettverk i valgt miljø; miljøkonfig er en betrodd driftsgrense, ikke bevis på produksjonsnettverk. |
| v5.0.0-V1.3.7 | Ikke relevant i produktkoden | Ingen server-side template engine; brukerstrenger inngår ikke i kjørbar kode eller templates. Skoleklienten lager noder direkte. |
| v5.0.0-V1.3.8 | Ikke relevant i produktkoden | Ingen JNDI/Java-komponent. |
| v5.0.0-V1.3.9 | Ikke relevant i produktkoden | Ingen memcached-klient eller cache med brukerinput. |
| v5.0.0-V1.3.10 | Ikke relevant i produktkoden | Ingen dynamisk format-string-/printf-mekanisme. Loggmeldinger bruker faste tekstmaler og begrensede metode-/sti-/feilkodefelt; rå URL, header og SQL logges ikke. |
| v5.0.0-V1.3.11 | Ikke relevant i produktkoden | Ingen e-post-/SMTP-/IMAP-integrasjon eller meldingsutsending. |
| v5.0.0-V1.4.1 | Ikke relevant for egen applikasjonskode | Skolemodus er JavaScript/Node og bruker ikke manuelle pekeroperasjoner eller bufferkopiering. Native tredjepartsavhengigheter må vurderes separat i leverandør-/supply-chain-kontrollen. |
| v5.0.0-V1.4.2 | Delvis implementert og lokalt testet | Tall mottas med Zod heltalls- og intervallgrenser; lekseantall er 1–50 før databaseoperasjon. 16 KiB JSON-grense og lokal filgrense avskjærer store input. Ingen generell property-/fuzz-test av alle tallfelt og DB-typer. |
| v5.0.0-V1.4.3 | Ikke relevant for egen applikasjonskode | JavaScript/Node bruker garbage collection og skolemodus holder ingen manuelle pekere. Ressurslukking for DB-klienter er eksplisitt i `finally`; dependency-native ressurslivsløp er ikke vurdert av denne raden. |
| v5.0.0-V1.5.2 | Delvis implementert og lokalt testet | Ubetrodde HTTP-data parseres kun som JSON med `strict: true`, body-grense 16 KiB og eksplisitte Zod-skjemaer; klientdefinerte objekter brukes ikke som kode/klasser. Lekse-snapshot valideres mot forventet form og hash før bruk. Syntetisk flyt og korrupsjonsavvisning testes, men det finnes ingen generell deserialiseringsfuzzer. |

Dette fullfører en individuell vurdering av V1s 19 Level 2-kontroller. Status «ikke relevant» gjelder bare funksjonaliteten som finnes nå og må revurderes ved nye integrasjoner.

## Individuell vurdering: V2 – Validation and Business Logic

| Krav-ID | Status | Konkret grunnlag og gjenværende begrensning |
|---|---|---|
| v5.0.0-V2.1.2 | Lokalt dokumentert, avgrenset | Regler for skole→klasse→medlemskap, lekse→mottaker/resultat, frist og versjonert innhold er beskrevet i [`forretningsregler-og-grenser.md`](forretningsregler-og-grenser.md); sammensatte FK-er og RLS ligger i SQL-migreringene. Feide-org-identifikator er uttrykkelig ikke behandlings-/eierbevis. Full virksomhetsgodkjenning av reglene mangler. |
| v5.0.0-V2.1.3 | Lokalt dokumentert, delvis verifisert | Dokumentet angir feltgrenser, elev-/lærergrenser, body-størrelse, rate limits og at det ikke finnes eierkvoter. Testene dekker sentrale input- og rate-limitregler; kapasitet og skolekvoter er ikke besluttet eller testet i produksjonsmiljø. |
| v5.0.0-V2.2.3 | Delvis implementert og lokalt testet | API validerer UUID/skjema, at valgt aktivitet finnes, oppgaveantall ikke overskrider aktiviteten, frist er framtidig og høyst 91 dager, lærer har grant til klassen, klassen har aktive elever og skole-/klasse-/lekse-/mottakerrelasjoner samsvarer. PostgreSQL RLS og native test dekker valgte kombinasjoner, ikke alle status-/rollepar. |
| v5.0.0-V2.3.2 | Delvis implementert og lokalt testet | Dokumenterte grenser håndheves av Zod, databasebegrensninger og rate-limit middleware. Regresjonene i `rate-limit.test.mjs`, `school-flow.e2e.test.mjs`, `tenant-isolation.test.mjs` og native PostgreSQL-verifieren dekker representanter; ingen full parallell-, volum- eller omgåelsesmatrise. |
| v5.0.0-V2.3.3 | Delvis implementert og lokalt testet | `withUserContext` transaksjonerer API-operasjoner; publisering skriver oppgave, mottaker-snapshot og audit-hendelse atomisk. Invitasjonsgodkjenning, sletting og tilbakekalling har transaksjon/journalrekkefølge. Vanlige suksess- og avvisningsbaner er testet; injisert DB-feil for hver mellomliggende operasjon og full atomicitetsmatrise mangler. |
| v5.0.0-V2.3.4 | Delvis implementert | Engangsinvitasjoner og tilganger behandles med `FOR UPDATE`, unike begrensninger og låsing av klasse-/skolerader før godkjenning/tilbakekalling. Sekvensiell gjenbruk av invitasjon testes; parallelle konkurrerende transaksjoner mot native PostgreSQL er ikke verifisert. Ingen booking-/lagerfunksjon finnes. |
| v5.0.0-V2.4.1 | Delvis implementert og lokalt testet | Ny global lokal grense teller 300 forespørsler/IP/minutt før body parsing; auth har 60 og mutasjonsruter 50/IP/rutemønster/minutt. Rutemønster unngår ID-basert kvoteomgåelse; bucket-tabellen har hard maksimumsstørrelse og avviser fail-closed. Unit tester dekker mønsternøkler, global bucket, utløp og minnegrense. Dette er per prosess; distribuert gateway/WAF, delt IP, last/DoS-test og produksjonskvoter gjenstår. |

V1 og V2 dekker til sammen 26 av 183 Level 2-kontroller individuelt. Dette er ikke full ASVS-verifikasjon; den individuelle V3-vurderingen følger nedenfor.

## Individuell vurdering: V3 – Web Frontend Security

| Krav-ID | Status | Konkret grunnlag og gjenværende begrensning |
|---|---|---|
| v5.0.0-V3.3.2 | Lokalt testet, avgrenset | Lokal OIDC E2E kontrollerer transaksjonscookie `SameSite=Lax`, sesjonscookie `Lax` og JavaScript-lesbar CSRF double-submit-cookie `Strict`. Lax passer top-level GET-retur i Authorization Code-flyten som brukes; Feide med alternativ response mode er ikke testet. |
| v5.0.0-V3.3.3 | Delvis implementert og lokalt kontrollert | Produksjonskonfig bruker `__Host-spansk_session`; hjelpefunksjonene gir `__Host-` for transaksjon, CSRF og logout-cookie, `Path=/`, `Secure` og ingen `Domain`. Lokal HTTP E2E verifiserer Path/no-Domain; nettleserens faktiske HTTPS-produksjonscookie-aksept er ikke testet. |
| v5.0.0-V3.3.4 | Lokalt testet, avgrenset | E2E bekrefter session-cookie og OIDC transaksjonscookie er HttpOnly; bare CSRF double-submit-cookie leses av klienten. ID-token beholdes server-side. Produksjonsrespons må verifiseres mot valgt proxy/HTTPS-host. |
| v5.0.0-V3.4.3 | Lokalt testet, avgrenset | Global CSP bruker allowlist (`script-src 'self'`, `style-src 'self'`), `object-src 'none'` og `base-uri 'none'`; ingen `unsafe-eval`. E2E dekker health, skole, API-runtime, statiske assets, lydsti, OIDC redirect, 404 og 400/413 parsefeil. Ikke et bevis fra produksjonsproxy eller alle kombinasjoner av serverfeil. |
| v5.0.0-V3.4.4 | Lokalt testet, avgrenset | `nosniff` settes i global middleware; HTTP E2E kontrollerer representative statiske svar og JSON-feil. Fullt responsinventar og produksjonsfeilside må testes i valgt miljø. |
| v5.0.0-V3.4.5 | Lokalt testet, avgrenset | Global `Referrer-Policy: no-referrer`; E2E kontrollerer ordinære svar og JSON-parserfeil. Hosting/proxy kan endre respons og må verifiseres. |
| v5.0.0-V3.4.6 | Lokalt testet, avgrenset | Global CSP har `frame-ancestors 'none'`; E2E kontrollerer representative ruter og parserfeil. Innebygging er ikke en produktfunksjon. Ingen ekstern proxy-/hosttest ennå. |
| v5.0.0-V3.5.4 | Uavklart deployeringsbeslutning | Innlogget HTML, API og cookies er laget for samme origin; ingen CORS-allowlist åpner dem for andre origin. Om den eksisterende no-login-flaten og skolemodusen skal ligge på ulike vertsnavn må fastsettes med valgt hosting; ingen produksjonsvertsnavn er valgt. |
| v5.0.0-V3.5.5 | Ikke relevant i nåværende klient | Skoleklienten bruker ikke `postMessage`; popup-gjeninnlogging oppdages via serverens `/api/session`, ikke meldinger mellom vinduer. Revurderes hvis slik kommunikasjon innføres. |
| v5.0.0-V3.7.1 | Delvis lokalt gjennomgått | Skoleflaten bruker HTML, CSS og standard JavaScript/nettleser-API-er; ingen Flash, Java-applet, ActiveX, Silverlight, NSAPI eller plugin. Formell støtteliste for kommunale nettlesere, versjonsstøtte og skjermlesere er ikke fastsatt/testet. |
| v5.0.0-V3.7.2 | Implementert og lokalt testet mot syntetisk issuer | OIDC-discovery-endepunktene (`authorization`, token, JWKS, userinfo, logout) avvises før bruk dersom de ikke har samme origin som fast konfigurert issuer. Nettleserredirect tester at destinasjonen er issuer og `redirect_uri` fast app-origin. Feides dokumentasjon oppgir discovery og sentrale OIDC-endepunkt på `https://auth.dataporten.no` ([OIDC-endepunkter](https://docs.feide.no/service_providers/openid_connect/feide_obtaining_tokens.html), [OIDC-detaljer](https://docs.feide.no/reference/oauth_oidc/openid_connect_details.html)). Lokal test beviser ikke metadata fra ekte Feide. |

V1–V3-dekningen var 37 kontroller før V4-gjennomgangen nedenfor. Samme-origin design og cookieatferd må fortsatt kontrolleres mot det valgte produksjonsoppsettet.

## Individuell vurdering: V4 – API and Web Service

| Krav-ID | Status | Konkret grunnlag og gjenværende begrensning |
|---|---|---|
| v5.0.0-V4.1.2 | Delvis lokalt testet | Produksjonsserveren videresender bare browser-facing GET/HEAD-ruter til den konfigurerte `PUBLIC_ORIGIN` over HTTPS. API-forespørsler over HTTP får 400 uten redirect. Loopback-test forfalsker Host/X-Forwarded-Host og bekrefter fast redirect-origin; valgt proxy, TLS-terminering og direkte nettverkstilgang er ikke testet. |
| v5.0.0-V4.1.3 | Delvis lokalt testet; produksjonsproxy uavklart | HTTPS-målet og OIDC callback bruker konfigurert origin, ikke innsendt Host/X-Forwarded-Host. Produksjon stoler på ett konfigurert proxy-hopp; nettverksisolasjon og at edge overskriver/sletter klientstyrte `Forwarded`/`X-Forwarded-*`-headere må verifiseres før drift. |
| v5.0.0-V4.2.1 | Lokalt testet, avgrenset | Node HTTP-serveren setter 16 KiB maks header, 10 s header-timeout, 30 s request-timeout og 5 s keep-alive. Rå TCP-regresjon sender samtidig Transfer-Encoding og Content-Length samt en pipelinert request; Node svarer 400, og ingen request når appen. Uavhengig proxy-/HTTP2-kjede og produksjonslast er ikke testet. |
| v5.0.0-V4.3.1, v5.0.0-V4.3.2 | Ikke relevant med begrunnelse | API-et er REST/JSON; ingen GraphQL-parser, GraphQL-query-uttrykk eller introspeksjonsgrensesnitt finnes. Revurderes ved GraphQL-innføring. |
| v5.0.0-V4.4.2, v5.0.0-V4.4.3, v5.0.0-V4.4.4 | Ikke relevant med begrunnelse | Ingen WebSocket-rute eller HTTP Upgrade-flyt finnes; skoleklienten bruker HTTP(S) og serverøkt. Revurderes dersom WebSocket innføres. |

V1–V4 dekker til sammen 45 av 183 Level 2-kontroller individuelt. Dette er fortsatt en avgrenset egenvurdering, ikke ASVS-verifikasjon.

## Individuell vurdering: V5 – File Handling

| Krav-ID | Status | Konkret grunnlag og gjenværende begrensning |
|---|---|---|
| v5.0.0-V5.1.1 | Delvis dokumentert; ikke relevant som serveropplasting | `README.md` definerer tre lokale importtyper, JSON-format/`.json`, grense på 5 MiB, avvisning før lesing/parsing, ingen arkivutpakking og lokale eksportfiler. Det finnes ingen serveropplasting. Lokal importvalidering beskytter ikke mot alle mulig skadelige JSON-verdier eller nettleserressurser. |
| v5.0.0-V5.2.3 | Ikke relevant med begrunnelse | Appen godtar ikke ZIP, gzip, DOCX, ODT eller andre komprimerte arkiver og pakker ikke ut filer. JSON-importen har 5 MiB råfilgrense før parsing. Revurderes hvis arkivimport innføres. |
| v5.0.0-V5.4.1 | Delvis lokalt gjennomgått | Skole-API-et tar ikke imot filnavn eller filopplasting og sender ikke vedlegg med `Content-Disposition`. Eksporter lages som lokale Blob-filer; klasseoversiktens filnavn erstatter tegn utenfor bokstaver/tall/bindestrek, elevens eksport har fast filnavn. Nettleserens forslag er ikke en server-sikkerhetsgrense. |
| v5.0.0-V5.4.2 | Ikke relevant med begrunnelse | Ingen bruker-/eksternt levert fil sendes i HTTP `Content-Disposition` eller e-postvedlegg. API-eksport returnerer JSON og klienten lager lokal Blob; serveren server ikke brukerens filer. |
| v5.0.0-V5.4.3 | Ikke relevant med begrunnelse | Ingen opplasting eller henting av ubetrodde filer finnes, så det finnes heller ingen antivirus-skanningsbane. Produktinnhold og skolelyd leveres av produkteieren i byggeartefaktet. |

V5 har fem Level 2-kontroller; disse er vurdert individuelt ut fra at appen ikke har serverbasert filopplasting.

## Individuell vurdering: V6 – Authentication

| Krav-ID | Status | Konkret grunnlag og gjenværende begrensning |
|---|---|---|
| v5.0.0-V6.1.2 | Ikke relevant med begrunnelse | Tjenesten har ingen lokal passordoppretting; kontekstspesifikke passordord kan ikke brukes. Feides egne passordregler er eksternt ansvar. |
| v5.0.0-V6.1.3 | Lokalt kontrollert, avgrenset | Produksjonskonfig har én autentiseringsvei via fast OIDC-issuer/Feide. Lokal OIDC-testissuer kan bare aktiveres eksplisitt i egen testmodus og kan ikke arve produksjonshemmeligheter eller fjern-DB. Ingen alternativ passord- eller identitetsheader-vei. |
| v5.0.0-V6.2.9 | Ikke relevant med begrunnelse | Ingen tjenestestyrte passordfelt eller passorddatabase. |
| v5.0.0-V6.2.10 | Ikke relevant med begrunnelse | Tjenesten setter ingen gyldighetstid eller rotasjon for brukerpassord; dette forvaltes av Feide. |
| v5.0.0-V6.2.11 | Ikke relevant med begrunnelse | Ingen passordregistrering å kontrollere mot produkt-/organisasjonsord. |
| v5.0.0-V6.2.12 | Ikke relevant med begrunnelse | Ingen lokale passordendringer eller passordoppretting; Feides kompromitterte-passordkontroll er ikke lokalt verifisert. |
| v5.0.0-V6.3.3 | Eksternt uavklart; delvis step-up for skoleadministrator | Skoleadministrator krever konfigurert `FEIDE_ADMIN_REQUIRED_ACR`; OIDC ber om `acr_values`, og API avviser lavere/ukjent `acr`. Lærer- og elevnivåets faktiske MFA/assurance fra Feide er ikke fastslått eller testet. Dette er en eksplisitt produksjonsport, ikke et bestått MFA-krav. |
| v5.0.0-V6.3.4 | Lokalt testet, avgrenset | Kun Feide OIDC er tillatt i produksjonskonfig; lokale testidentiteter finnes bare i eksplisitt isolert testmodus. Manglende ekte Feide-claims og skolepolicy hindrer samlet assurance-vurdering. |
| v5.0.0-V6.4.3 | Ikke relevant i appen; ekstern konto-gjenoppretting må avklares | Ingen lokal passord-reset. Konto-/faktor-gjenoppretting delegeres til Feide; prosess og at den ikke omgår eventuell MFA må bekreftes av Sikt/skoleeier. |
| v5.0.0-V6.4.4 | Ikke relevant i appen; ekstern faktor-gjenoppretting må avklares | Appen registrerer eller gjenoppretter ikke egne MFA-faktorer. Identitetskontroll ved tapt Feide-faktor må bekreftes eksternt. |
| v5.0.0-V6.5.1 | Ikke relevant for autentiseringsfaktorer | Tjenesten sender ikke OOB-/SMS-koder, TOTP eller lookup secrets. Klasse-/skoleinvitasjoner styrer medlemskap etter innlogging og er ikke autentiseringsfaktorer; de er engangsbruk og tidsbegrenset. |
| v5.0.0-V6.5.2 | Ikke relevant for autentiseringsfaktorer | Ingen lagrede passord-/MFA-lookup secrets. Tilgangsinvitasjon er et separat 192-bit medlemskapstoken, hash-lagret med SHA-256; dette er ikke en auth-factor eller erstatning for Feide. |
| v5.0.0-V6.5.3 | Ikke relevant for autentiseringsfaktorer | Ingen egen OOB/TOTP-generator. Invitasjonstokener genereres med CSPRNG, men gir kun en ventende medlemskapsforespørsel. |
| v5.0.0-V6.5.4 | Ikke relevant for autentiseringsfaktorer | Ingen egne autentiserings-/OOB-koder. Medlemskapsinvitasjonens høyere entropi dokumenteres separat og gir ikke innlogging. |
| v5.0.0-V6.5.5 | Ikke relevant for autentiseringsfaktorer | Ingen OOB-/TOTP-levetid i tjenesten. Invitasjoner har sju dagers levetid, men er medlemskapstoken og må ikke forveksles med ASVS sin maksimale levetid for OOB-auth. |
| v5.0.0-V6.6.1 | Ikke relevant i appen; Feide uavklart | Skoleappen sender ikke autentiseringskode over PSTN/SMS. Feides tilgjengelige faktorer og eventuelle alternativer må bekreftes i leverandørregistreringen. |
| v5.0.0-V6.6.2 | Ikke relevant i appen | Ingen OOB-autentiseringsforespørsler eller -koder implementeres lokalt. |
| v5.0.0-V6.6.3 | Ikke relevant i appen | Ingen code-based OOB-auth endpoint eller tilhørende brute-force-overflate finnes; Feides interne vern er eksternt. |
| v5.0.0-V6.8.1 | Lokalt testet, avgrenset | Produksjon konfigurerer én issuer; intern identitet er bundet til eksakt issuer + subject, og ukjent/motstridende binding feiler lukket. Dette beskytter ikke mot feil i faktisk Feide-skoleidentitet eller flere framtidige issuere. |
| v5.0.0-V6.8.2 | Lokalt testet mot syntetisk issuer | `openid-client` validerer signatur, issuer, audience, nonce og tid; negative signatur-/claimtester og JWKS-rotasjon består. Feides faktiske nøkler og claims er ikke testet. |
| v5.0.0-V6.8.3 | Ikke relevant med begrunnelse | Tjenesten bruker OIDC, ikke SAML. OIDC state/nonce/callback-replay vurderes i OIDC-kontrollene; ingen SAML-assertions mottas. |
| v5.0.0-V6.8.4 | Delvis implementert; ekstern claim-verifikasjon utestår | Administrator-API kontrollerer eksakt konfigurert `acr` og step-up starter ny OIDC-flyt. `auth_time`/nylig autentisering håndheves ikke; lærerpolicy og faktiske Feide `acr`/`amr`-claims er ikke vedtatt/verifisert. Vurder ny autentisering etter eksplisitt risiko-/skoleeierbeslutning. |

V6 har 22 Level 2-kontroller. Tjenestestyrte passord- og ekstrafaktorer finnes ikke; Feides assurance, MFA og gjenoppretting er fortsatt produksjonsporter.

## Individuell vurdering: V7 – Session Management

| Krav-ID | Status | Konkret grunnlag og gjenværende begrensning |
|---|---|---|
| v5.0.0-V7.1.1 | Delvis implementert og dokumentert | `sikkerhet-og-utlogging.md` dokumenterer åtte timers absolutt grense og 30 minutters inaktivitet for lærer/skoleadmin. Begrunnelsen er kort skoleøkt og rask tilbakekalling; dette er ikke formell NIST-risikoanalyse eller full varslings-/reautentiseringsverifikasjon. |
| v5.0.0-V7.1.2 | Uavklart designvalg | Flere samtidige økter er mulige; antallsgrense og hva som skjer når en bruker når den er full, er ikke definert/håndhevet. Før produksjon må skoleeier fastsette en grense eller eksplisitt akseptere ubegrensede aktive enheter og tilhørende tiltak. |
| v5.0.0-V7.1.3 | Delvis dokumentert | Appen beskriver egen 8h/30m session og Feide OIDC/RP-logout; lokal logout tilbakekaller appøkten før provider-navigasjon. Feide SSO-varighet, faktisk logout-terminering og kommunens øvrige sesjonslag er ikke koordinert/verifisert. |
| v5.0.0-V7.3.1 | Lokalt testet, avgrenset | Session-service avviser lærer/admin etter 30 min inaktivitet; syntetiske tester bekrefter timeout. UI varsler fem minutter før, men varseltiming er ikke klokketestet i nettleser. |
| v5.0.0-V7.3.2 | Lokalt testet, avgrenset | Alle appøkter har åtte timers absolutt utløp uavhengig av aktivitet; session-service tester grensen. Produksjons-Feide og driftens øvrige økter inngår ikke i lokal test. |
| v5.0.0-V7.4.3 | Ikke relevant i appen; eksternt ansvar | Appen lar ikke brukeren endre passord eller MFA-faktorer; konto-/faktorendringer skjer hos Feide. Lokal funksjon for å avslutte andre økter etter slike endringer finnes ikke og Feides praksis er uavklart. |
| v5.0.0-V7.4.4 | Lokalt gjennomgått, avgrenset | Innloggede lærer- og elevvisninger har synlig «Logg ut»-handling. Lokal OIDC E2E tester utlogging og lokal øktstenging; ingen systematisk kontrast-/skjermlesergrense-til-gjenge gjennomgang av logout er utført. |
| v5.0.0-V7.4.5 | Delvis implementert | Skoleadministrator kan fjerne skolemedlemskap, som tilbakekaller økter ved den skolen; konto kan slettes og alle brukerøkter tilbakekalles. Det finnes ingen driftsadminflate for å terminere vilkårlig enkeltøkt eller alle brukeres økter. |
| v5.0.0-V7.5.1 | Ikke relevant i appen | Brukeren kan ikke endre e-post, telefon, autentiseringsidentifikator eller MFA-konfigurasjon i appen; visningsnavn hentes fra Feide. Endringer i identitets-/recovery-attributter tilhører Feide. |
| v5.0.0-V7.5.2 | Ikke implementert | Brukeren kan logge ut gjeldende økt, men kan ikke se liste over egne aktive økter eller velge å avslutte andre/alle økter. Dette er et konkret forbedringspunkt før bred produksjonsbruk. |
| v5.0.0-V7.6.1 | Delvis implementert; Feide uavklart | RP-økten har lokale absolutte/inaktivitetsgrenser, og appen støtter RP-Initiated Logout etter lokal tilbakekalling. Feide-øktens levetid, reautentiseringskrav og om IdP-økten faktisk avsluttes må testes med registrert Feide-klient; global SLO loves ikke. |
| v5.0.0-V7.6.2 | Lokalt testet, avgrenset | Ny appøkt opprettes etter eksplisitt brukerinitiert OIDC-login/callback; produksjon godtar ikke lokal testissuer eller identitetsheader. Syntetisk OIDC tester authorization code, state/nonce og callback replay. Ekte Feide-samtykke-/interaksjonsflyt er ikke verifisert. |

V7 dekker 12 Level 2-kontroller. Øktliste/avslutning av andre økter og fastsatt grense for samtidige økter er fortsatt åpne design-/produksjonspunkter.

## Individuell vurdering: V8 – Authorization

| Krav-ID | Status | Konkret grunnlag og gjenværende begrensning |
|---|---|---|
| v5.0.0-V8.1.2 | Implementert som feltpolicy; testdekning delvis | `forretningsregler-og-grenser.md` definerer les-/skriverettigheter for profil, medlemskap, klasse, lekse/snapshot, læringsutfall og eksport/audit på tvers av elev, lærer/medlærer og skoleadministrator, inkludert rolle- og statusvilkår. Full gjennomgang av hvert API-felt mot dette skjemaet mangler. |
| v5.0.0-V8.2.3 | Delvis lokalt testet | Serveren bygger eksplisitte JSON-projeksjoner; studentens publiserte oppgave viser prompt/valg, men ikke fasit/forklaring, og felttilgang/ID-bytte prøves i OIDC E2E. Ingen automatisert exhaustiv matrise av alle request/response-egenskaper og rolle-/statuskombinasjoner er ferdig. |
| v5.0.0-V8.4.1 | Lokalt testet, avgrenset | Tenanttest mot PostgreSQL 17.11 dekker to skoleeiere, tre skoler og to lærere/elever per skole; RLS og API-/OIDC-scenarier avviser tilgang på tvers av skole, også to skoler under samme eier. Dette er ikke full endpoint × rolle × status × tenant-matrise eller bevis fra produksjonsdatabasen. |

V8 har tre Level 2-kontroller. Feltpolicy er nå dokumentert; uttømmende BOPLA-regresjon og full tilgangsmatrise gjenstår.

## Individuell vurdering: V9 – Self-contained Tokens

| Krav-ID | Status | Konkret grunnlag og gjenværende begrensning |
|---|---|---|
| v5.0.0-V9.2.2 | Lokalt testet mot syntetisk issuer | Appen utsteder ikke JWT-er. OIDC ID-token brukes bare som autentiseringsbevis/standard logout-hint på serversiden; access token brukes bare til UserInfo. Server-API-et autentiserer med opaque session-cookie og avviser ikke-innloggede forespørsler. Library-/E2E-test mot syntetisk issuer dekker korrekt tokenflyt; ekte Feide-tokenformat er utestet. |
| v5.0.0-V9.2.3 | Lokalt testet mot syntetisk issuer | `openid-client` validerer ID-tokenets audience/azp mot konfigurert klient, og OIDC negative-test avviser feil audience. Ekte Feide-client audience og produksjonsnøkler må bekreftes ved Sikt-test. |
| v5.0.0-V9.2.4 | Ikke relevant i applikasjonen; issuerforutsetning ekstern | Applikasjonen er OIDC relying party og utsteder ikke egne tokens for flere målgrupper. Feides signeringsnøkkel, audience-avgrensning og tokenutstedelse er IdP-kontroller som må bekreftes i ekte Feide-integrasjon. |

V9 har tre Level 2-kontroller; lokal evidens gjelder RP-bruk av syntetiske OIDC-tokens, ikke Feides tokenutstedelse.

## Individuell vurdering: V10 – OAuth and OIDC

| Krav-ID | Status | Konkret grunnlag og gjenværende begrensning |
|---|---|---|
| v5.0.0-V10.1.1 | Lokalt testet, avgrenset | ID-/access-token holdes i serverflyten; nettleseren får kun opaque session-cookie og CSRF-verdi. Syntetisk E2E verifiserer ikke at Feide- eller produksjonsproxylogger aldri eksponerer token. |
| v5.0.0-V10.1.2 | Lokalt testet mot syntetisk issuer | State, nonce, PKCE verifier og engangs transaksjon opprettes per login, bindes til HttpOnly transaksjonscookie og slettes ved callback; state-mismatch, nonce-mismatch, callback replay og OIDC token-claimfeil dekkes av tester. Ekte nettleser/Feide-transaksjon utestet. |
| v5.0.0-V10.2.1 | Lokalt testet mot syntetisk issuer | Authorization Code bruker PKCE S256 og state; syntetisk end-to-end avviser endret state og transaksjonsreplay. Providerens håndheving av PKCE er ekstern. |
| v5.0.0-V10.2.2 | Ikke relevant med begrunnelse | Produksjonskonfig har én fast issuer; dynamisk valg av flere authorization servers er ikke støttet. Issuer og metadata-origin kontrolleres lokalt. Revurderes hvis flere IdP-er innføres. |
| v5.0.0-V10.3.1 | Ikke relevant som OAuth resource server | `/api` godtar ikke OAuth bearer/access tokens. Den er appens same-origin session API, autentisert med opaque serverøktcookie. |
| v5.0.0-V10.3.2 | Ikke relevant som OAuth resource server | API-autorisasjon bruker lokal økt, rolle, skoletilknytning, medlemskap og RLS; ikke OAuth access-token claims/scopes. |
| v5.0.0-V10.3.3 | Ikke relevant som OAuth resource server | API identifiserer bruker fra verifisert serverøkt med intern UUID. Feide issuer+subject binder ekstern identitet ved innlogging; ingen bearer-tokenbruker identifiseres av ressursserveren. |
| v5.0.0-V10.3.4 | Ikke relevant som OAuth resource server | Ressurs-API-et mottar ikke bearer token med `acr`/`amr`/`auth_time`. Privilegert apphandling kontrollerer OIDC `acr` i serverøkten; nylig `auth_time` håndheves ikke (se V6.8.4). |
| v5.0.0-V10.4.6 | Uavklart hos IdP | Applikasjonen sender PKCE S256; Feides authorization server må bekrefte at den krever challenge, avviser `plain` og kontrollerer verifier i registrert klientflyt. |
| v5.0.0-V10.4.7 | Ikke relevant for app; providerens klientregistrering ekstern | Brukerrettet tjeneste bruker forhåndsregistrert klient, ikke dynamisk client registration. Sikt/Feide administrerer registrering og samtykkeflate. |
| v5.0.0-V10.4.8 | Ikke relevant for app; providerpolicy ekstern | Appen ber ikke om `offline_access` og lagrer eller bruker ikke refresh token; den utsteder ikke tokens. Feides refresh-token levetid er IdP-kontroll. |
| v5.0.0-V10.4.9 | Ikke relevant for app; providerpolicy ekstern | Appen bruker ikke refresh token eller egne reference access tokens. Tilbakekalling av Feide-grants ligger hos Feide og må kontrolleres i klientregistreringen. |
| v5.0.0-V10.4.10 | Delvis implementert; ekte registrering uavklart | OIDC-klienten er konfidensiell og henter client secret fra serverkonfigurasjon; tokenutveksling går server-til-server via `openid-client`. Token endpoint auth method, Sikt-registrering og secret-rotasjon må bekreftes med Feide. |
| v5.0.0-V10.4.11 | Delvis implementert; faktisk provider allowlist uavklart | Lokal klient ber bare om `openid userinfo-name`; ekte Sikt/Feide-registrering må bekrefte at ingen unødvendige scopes er gitt. |
| v5.0.0-V10.5.1 | Lokalt testet mot syntetisk issuer | ID-tokenets nonce valideres mot engangs OIDC-transaksjon; negativ nonce, replay, signatur, issuer, audience og tidskrav testes. Ekte Feide-token/claimprofil må bekreftes. |
| v5.0.0-V10.5.2 | Lokalt testet, identitetslivsløp avgrenset | Konto knyttes til eksakt issuer+subject, ikke navn/e-post; avvist gjenbruk etter tilbakekalling testes. Ikke-gjenbrukbar `sub` eller uavhengig skoleeierverifisert gjenoppretting kreves fortsatt før produksjonstilgang. |
| v5.0.0-V10.5.3 | Lokalt testet mot syntetisk issuer | OIDC issuer er fastkonfigurert; discovery valideres mot issuer, og authorization/token/JWKS/userinfo/logout URL-er må være på samme origin. Fem malicious-metadata negative tester består; ekte Feide discovery er ekstern. |
| v5.0.0-V10.5.4 | Lokalt testet mot syntetisk issuer | `openid-client` validerer ID-token audience/azp mot konfigurert client ID; feil audience avvises i signerte syntetiske token-tester. Ekte Feide claims utestet. |
| v5.0.0-V10.5.5 | Ikke relevant med begrunnelse | RP-Initiated Logout brukes front-channel. Tjenesten implementerer ikke OIDC back-channel logout-token mottak. Ikke påstått støtte. |
| v5.0.0-V10.6.1 | Uavklart hos provider | Klienten bruker bare Authorization Code, men hvilke response modes Feide tillater for den registrerte klienten og at implicit `token` ikke er mulig må kontrolleres i Sikt. |
| v5.0.0-V10.6.2 | Uavklart hos provider | Appen sender `id_token_hint` i standard RP-Initiated Logout og stenger lokal økt først. Feides faktiske bekreftelse/retur ved logout må testes. |
| v5.0.0-V10.7.1 | Uavklart hos provider | Appen ber om begrensede scopes; Feides faktiske samtykkekrav og hvordan skole-/brukersamtykke håndteres må bekreftes. |
| v5.0.0-V10.7.2 | Uavklart hos provider | Feides samtykkeskjerm og presentasjon av tjeneste/scopes er ikke sett i ekte test. |
| v5.0.0-V10.7.3 | Uavklart hos provider | Brukerens mulighet til å se/endre/tilbakekalle Feide-consent er ikke verifisert lokalt. |

V10 har 24 Level 2-kontroller. Klientens OIDC-flyt er syntetisk testet; providerens klientkonfigurasjon, samtykke, tokenmetode og ekte claims må avklares i Sikt.

## Individuell vurdering: V11 – Cryptography

| Krav-ID | Status | Konkret grunnlag og gjenværende begrensning |
|---|---|---|
| v5.0.0-V11.1.1 | Ikke oppfylt for produksjon; lokal inventar lagt til | `sikkerhet-og-utlogging.md` lister bruk, algoritmer, data og tiltenkt håndtering. Eier, rotasjon, vault, nøkkeltilgang, backup og NIST-tilpasset organisasjonspolicy er ikke vedtatt/verifisert. |
| v5.0.0-V11.1.2 | Delvis dokumentert | Lokalt inventar dekker session secret, hash/MAC, AES-GCM/HKDF, CSPRNG, OIDC-nøkler og SHA-256-content digest med formål. Feide-/TLS-sertifikater, produksjonsnøkkelplacering, forvaltere, rotasjon og regelmessig oppdatering er uavklart. |
| v5.0.0-V11.2.1 | Lokalt implementert, avgrenset | Node `crypto` og vedlikeholdt `openid-client` står for primitives/protokollvalidering; ingen egen cipher/signature implementasjon. Uavhengig kryptografisk design-/dependency-audit og drifts-HSM er ikke utført. |
| v5.0.0-V11.2.2 | Ikke implementert | AES-GCM/HKDF/SHA-256 og KDF-context er hardkodet; ciphertext-format er versjonert, men ingen migrerings-/dual-key-funksjon eller algorithm-agility-løp finnes. Endring krever kode-/data-migrering. |
| v5.0.0-V11.2.3 | Delvis lokalt vurdert | AES-256-GCM, SHA-256/HMAC, HKDF-SHA-256 og 192-/256-bit CSPRNG-token har minst 128-bit sikkerhetsmål ved riktig nøkkelopprettelse. `SESSION_SECRET` valideres bare på lengde, så faktisk entropi, secret manager og IdP/TLS-nøkler er ikke bevist. |
| v5.0.0-V11.3.3 | Lokalt testet, avgrenset | Korttidslagrede ID-token/PKCE-data bruker AES-256-GCM med auth-tag; `session-service.test.mjs` avviser endret ciphertext/tag. Backup-/vault- og key-accesskontroller er ikke testet. |
| v5.0.0-V11.4.2 | Ikke relevant med begrunnelse | Ingen lokale brukerpassord eller passorddatabaser. Feide håndterer passord-KDF. |
| v5.0.0-V11.4.3 | Lokalt testet, avgrenset | Hashing/HMAC for integrity og token-digests bruker SHA-256 med 256-bit digest; OIDC-signatur valideres av standardbibliotek mot issuerens nøkkel. Fullt signaturalgoritme-/sertifikatinventar og nøkkelbevis fra Feide mangler. |
| v5.0.0-V11.4.4 | Ikke relevant med begrunnelse | Ingen nøkkel utledes fra brukerpassord; HKDF bruker tilfeldig generert serverhemmelighet, ikke passord. |
| v5.0.0-V11.5.1 | Lokalt implementert, avgrenset | Session/CSRF-token er 32 tilfeldige byte og invitasjonskode 24 tilfeldige byte fra Node CSPRNG. Tilfeldige UUID-er brukes som identifikatorer/hendelses-ID-er, ikke som eneste autentiseringshemmelighet. Genereringsprosessen for produksjonshemmeligheter må bekreftes hos drift. |
| v5.0.0-V11.6.1 | Delvis lokalt gjennomgått | Lokal bruk begrenser seg til AES-256-GCM, HKDF-SHA-256, SHA-256/HMAC og vedlikeholdt OIDC-signaturverifikasjon. Feide-algoritmer/JWKS, TLS cipher suite, sertifikater, FIPS-/driftskrav og full avhengighetsinventar må kontrolleres før produksjon. |

V11 har 11 Level 2-kontroller. Lokal kodebruk er inventert, men produksjonsnøkkelforvaltning, entropi, versjonert nøkkelrotasjon og kryptografisk agility er ikke godkjent eller ferdig.

## Individuell vurdering: V12 – Secure Communication

| Krav-ID | Status | Konkret grunnlag og gjenværende begrensning |
|---|---|---|
| v5.0.0-V12.1.2 | Eksternt uavklart | Applikasjonen terminerer ikke TLS selv. Proxy-/load balancer-valg, støttede TLS-versjoner/cipher suites, rekkefølge og forward secrecy må dokumenteres og testes i valgt produksjonsplattform. |
| v5.0.0-V12.1.3 | Ikke relevant med begrunnelse | Appen bruker ikke klientsertifikat (mTLS) som identitet eller autorisasjonsgrunnlag. Vanlig TLS-serversertifikatvalidering er fortsatt påkrevd. |
| v5.0.0-V12.3.1 | Delvis lokalt kontrollert; driftsflate ekstern | Produksjon nekter HTTP-origin, krever HTTPS Feide-issuer og `DATABASE_SSL=true` for begge PostgreSQL-forbindelser; ingen e-post/ekstern upload/integrasjon finnes. DNS, edge, monitoring, management/SSH, backup og øvrige hostingforbindelser kan ikke verifiseres før leverandør er valgt. |
| v5.0.0-V12.3.2 | Delvis lokalt gjennomgått | PostgreSQL-driver bruker `rejectUnauthorized: true` når produksjons-TLS er konfigurert; Node/OIDC-klientens standard TLS-validering brukes. Ingen negativsertifikat-/CA-rotasjons-/produksjonsnettverkstest er kjørt. |
| v5.0.0-V12.3.3 | Ikke relevant for interne HTTP-tjenester; DB-kryptering vurderes separat | Appen består av én HTTP-applikasjon og har ingen interne HTTP-baserte mikrotjenester. PostgreSQL-trafikk krever TLS i produksjon etter V12.3.1. Revurderes ved tjenestesplitting. |
| v5.0.0-V12.3.4 | Delvis implementert, driftsbevis mangler | `pg` settes opp med sertifikatvalidering når `DATABASE_SSL=true`; deployment må tilby sertifikat fra betrodd CA og dokumentere intern CA-/sertifikatrotasjon. Dette er ikke testet mot valgt DB-leverandør. |

V12 har seks Level 2-kontroller. TLS-reglene i produksjonskonfig er lokale; faktisk edge, sertifikater, nettverk og driftsadministrasjon er ikke verifisert.

## Individuell vurdering: V13 – Configuration

| Krav-ID | Status | Konkret grunnlag og gjenværende begrensning |
|---|---|---|
| v5.0.0-V13.1.1 | Implementert som lokal kommunikasjonsoversikt; drift uavklart | `drift-og-beredskap.md` lister nettleser→app, app→Feide, app→skole-DB/journal og øvrige runtime-mål, tillatt mål og ansvar. Valgt hosting, DNS, backup, logging, overvåking, admin og eksterne driftsflater må fylles inn før produksjon. |
| v5.0.0-V13.2.1 | Delvis implementert; produksjonscredential-modell uavklart | Skole-DB og journal bruker separate roller; OIDC-klient har server-side secret. Databasepassord er permanente konfigurasjonsverdier i nåværende løsning, ikke kortlivede credentials/workload identity. Rotasjon/credential policy er ekstern port. |
| v5.0.0-V13.2.2 | Lokalt testet, avgrenset | Separate migrator, `app_runtime`, journal runtime og provisioner-roller; native PostgreSQL 17.11 verifiserer runtime/RLS minsteprivilegium og at journal runtime mangler UPDATE/DELETE. Produksjonstilgang/hosting er ikke testet. |
| v5.0.0-V13.2.3 | Delvis lokalt gjennomgått | `.env.example` har blanke verdier, lokal setup genererer demohemmeligheter og produksjonsconfig avviser placeholder client secret. Database-/vault-credential-entropi og alle operatør-/hostingkontoers default-passord må kontrolleres ved anskaffelse. |
| v5.0.0-V13.2.4 | Delvis implementert og lokalt testet | Appen tillater bare én fast issuer; OIDC discovery-endepunkter må dele issuer-origin. Ingen klientstyrt URL-fetch finnes. Egress firewall/DNS-allowlist for Feide, PostgreSQL, drift og backup er ikke satt opp. |
| v5.0.0-V13.2.5 | Delvis lokalt gjennomgått | Express serverer bare valgte app-/audio-/dist-filer fra faste kataloger; ingen user-controlled file load eller admin endpoint. Ekstern server-egress/asset policy må bekreftes på host. |
| v5.0.0-V13.3.1 | Ikke oppfylt for produksjon | Secrets er ikke i source/build, men appen leser dem fra miljøkonfigurasjon. Secret manager/vault for sikker opprettelse, lagring, lesetilgang, backup, rotasjon og sletting er ikke valgt eller testet. |
| v5.0.0-V13.3.2 | Delvis implementert; produksjonstilgang uavklart | Separate DB-kontoer og begrenset app-runtime er testet. Hvem som kan lese prod-env/vault, deploy-secret scopes og driftsleverandørens secret audit må dokumenteres. |
| v5.0.0-V13.4.2 | Lokalt gjennomgått, avgrenset | Produksjonsstart krever `NODE_ENV=production`; Express stack traces/debug-visning er ikke aktivert, JSON-feil holdes generiske. Valgt Node-host, reverse proxy og administrative/debugflagg må gjennomgås i prod. |
| v5.0.0-V13.4.3 | Lokalt gjennomgått | Statisk middleware har ikke directory-listing, fallthrough for dist/audio er slått av, og skolelyd leveres via hashvaliderte appstier. Valgt proxy/webserver sin default listing må testes. |
| v5.0.0-V13.4.4 | Lokalt implementert og testet | Global Express middleware avviser HTTP TRACE med 405 før rutehandling; `http-server.test.mjs` sender ekte TRACE over syntetisk trusted HTTPS-proxy request og kontrollerer fast svar. Hosting-proxy må også avvise metoden. |
| v5.0.0-V13.4.5 | Delvis dokumentert | Ingen offentlige API-dokumentasjons-/metrics-ruter. `/healthz` og `/api/runtime-mode` er tilsiktede minimale statusendepunkter og beskrevet i driftsdokumentet; offentlig health exposure må passe valgt hosting-/kommunepolicy. |

V13 har 12 Level 2-kontroller. Runtime-kommunikasjonsbehov og lokal konfigurasjon er dokumentert; secret manager, faste credential-rotasjoner, egress og edge-/adminflater er uavklart.

## Individuell vurdering: V14 – Data Protection

| Krav-ID | Status | Konkret grunnlag og gjenværende begrensning |
|---|---|---|
| v5.0.0-V14.1.1 | Delvis dokumentert | `behandlingsoversikt-og-dba.md` identifiserer data, formål, tilgang, retensjon og foreløpig teknisk nivå (Begrenset/Konfidensielt/Internt/Offentlig produktinnhold). Dette er utkast, må mappes til skoleeierens formelle policy og rettslige vurdering. |
| v5.0.0-V14.1.2 | Delvis dokumentert | Hvert foreløpig nivå har tilgangs-, TLS-, logging-, cache-, retensjon- og slettetiltak. DB-/backup-at-rest-kryptering, hostinglogger, vault/HSM, driftsroller og vedtatte retensjonstider/ansvar er uavklart. |
| v5.0.0-V14.2.2 | Lokalt implementert, reverse proxy uavklart | `/api` og `/auth` svar settes `Cache-Control: no-store, private`; innlogget skole HTML er `no-store`. Ingen server-side applikasjonscache for elevdata. Load balancer, proxy/CDN og leverandørlogger er ikke testet. |
| v5.0.0-V14.2.3 | Delvis lokalt kontrollert | Ingen analytics, tracker, ekstern svarinnsending eller untrusted URL-API finnes. CSP begrenser `connect-src` til same-origin; innlogging og nødvendige identitetsdata går til konfigurert Feide issuer. DNS-/logg-/supportunderleverandører og produksjonsnettverk er uavklart. |
| v5.0.0-V14.2.4 | Delvis implementert og lokalt testet | Ingen rå elevsvar/lydopptak lagres; tilgang er skole-/klasseavgrenset, export/sletting finnes, retensjonsjobben journalfører før sletting, app/API bruker no-store og gjenoppretting reanvender nyere slettinger. Native PostgreSQL restore testet. Fastsatte frister, scheduler, backupkryptering og leverandørlogger mangler. |
| v5.0.0-V14.3.2 | Lokalt testet, avgrenset | Syntetisk E2E kontrollerer `no-store` på API/auth og personlige svar; browser-back/kontobytte i samme nettleser kontrolleres mot lokal PostgreSQL/Chromium. Proxy/CDN og alle sider/failure variants trenger produksjonskontroll. |
| v5.0.0-V14.3.3 | Lokalt testet, avgrenset | Skoleklienten holder aktiv identitet/lekse/svar i minnet, bruker ikke `localStorage`/`sessionStorage`/IndexedDB for skoledata; bare opaque session-cookie og CSRF-token-cookie brukes. Syntetiske tests dekker ingen pupil data in localStorage og account switch. Fysisk nettleserprofil/cache/extension og alle kommunale klienter er ikke testet. |

V14 har sju Level 2-kontroller. Lokal dataminimering og cache-atferd er dekket i kode/test; formell klassifisering, driftens lagringskryptering/loggkjede og vedtatt retensjon må vedtas av partene.

## Individuell vurdering: V15 – Secure Coding and Architecture

| Krav-ID | Status | Konkret grunnlag og gjenværende begrensning |
|---|---|---|
| v5.0.0-V15.1.2 | Delvis implementert | `package-lock.json` låser tredjepartsversjoner; `package.json` skiller serverruntime fra dev/testverktøy. Det finnes ingen generert SBOM, automatisert SCA/Dependabot-policy, package-provenance attest eller regelmessig leverandør-/repoinventar i denne leveransen. |
| v5.0.0-V15.1.3 | Delvis dokumentert | `forretningsregler-og-grenser.md` beskriver OIDC-kall, synkron rapport/eksport, snapshot-publisering, retention/restore, request/body-/poolgrenser og hva som mangler. Ingen skolevolum-/konkurranse-/query-timeouttest eller maksimal klassestørrelse er fastsatt. |
| v5.0.0-V15.2.2 | Delvis implementert og lokalt testet | Request-/bodygrense, per-prosess/global og rutebasert rate limit, databasepoolgrenser, Node request timeouts, maksimalt 50 oppgaver per lekse og lokal JSON-filgrense 5 MiB begrenser kjente flater. Ingen distribuert WAF/kvote, statement-timeout, volumtest eller tjenestegaranti er etablert. |
| v5.0.0-V15.2.3 | Lokalt kontrollert, avgrenset | `NODE_ENV=production` avviser lokal OIDC-modus/loopback-issuer; lokal syntetisk provider er bare startbar med eksplisitt testflagg og avviser production; `oidc-provider` og PGlite ligger som devDependencies, server-static assets eksponerer ikke kildekatalogen. Faktisk produksjonsbyggeartefakt/deployliste er ikke laget. |
| v5.0.0-V15.3.2 | Lokalt testet mot syntetisk issuer, avgrenset | Ingen brukerinnsendt URL brukes som backend-fetch; issuer er fast og annonserte OIDC-ruter valideres mot issuer-origin før bruk. Negativ HTTP-test sender 302 fra discovery, JWKS, token og UserInfo; `openid-client` feiler lukket uten å kontakte redirect-målet. Ekte Feide-/produksjonsproxytrafikk må fortsatt verifiseres. |
| v5.0.0-V15.3.3 | Lokalt testet, avgrenset | `zod`-skjemaer tillater eksplisitte bodyfelter og rutehandlere skriver bare navngitte DB-felter; elev kan ikke sende rolle/skole/user ID for å utvide tilgang. OIDC-/rolle-/ID-bytte-E2E dekker utvalgte tilfeller, ikke uttømmende mass-assignment-testing av alle schemas. |
| v5.0.0-V15.3.4 | Delvis implementert; edge-uavklart | Express `trust proxy` er nøyaktig én hop i produksjonskonfig og rate limiting/loggfritt sikkerhetsvern bruker `req.ip`. Testen viser at Host/XFH ikke endrer HTTPS-origin. Public edge må overskrive X-Forwarded-For/Proto/Host, blokkere direkte origin-adgang og være kontrollert før IP-kvoter kan stoles på. |
| v5.0.0-V15.3.5 | Delvis lokalt kontrollert | `zod`-skjemaer kontrollerer typer, UUID, enum, heltall og lengder; serverlogikken bruker eksplisitte `===`/`!==` i sentrale rolle-/tilstandsbeslutninger og SQL er parameterisert. Ingen statisk typeanalyse/fuzz- eller full sammenligningsgjennomgang av alle kodeveier. |
| v5.0.0-V15.3.6 | Lokalt testet, avgrenset | Skole-API-et slår ikke sammen klientkontrollerte objekter direkte inn i bruker-, klasse-, lekse- eller session-objekter; schemas og eksplisitte projeksjoner brukes. E2E sender et eget JSON `__proto__`-felt og bekrefter at teacher-rollen ikke oppgraderes. Ingen generisk prototype-pollution-fuzztest er implementert; revurder hvis dynamisk nøkkel-/deep-merge-kode innføres. |
| v5.0.0-V15.3.7 | Delvis lokalt testet | Appen bruker ikke gjentatte query-parametre som autorisasjonskilde; callback state er typekontrollert og engangs. E2E med to `state`-verdier feiler lukket uten appøkt. Body-validering dekker utvalgte ruter; full HPP-kombinasjon på query/body/header/cookie mangler. |

V15 har ti Level 2-kontroller. Rate/body-/poolgrenser og testmodusisolasjon finnes lokalt, men supply-chain-overvåking, kapasitet, egress-redirectkontroll, proxy-konfig og bred input-/HPP-matrise er uavklart.

## Individuell vurdering: V16 – Security Logging and Error Handling

| Krav-ID | Status | Konkret grunnlag og gjenværende begrensning |
|---|---|---|
| v5.0.0-V16.1.1 | Delvis dokumentert | `logging-og-overvaking.md` inventerer lokal stdout/stderr, `audit_event`, separat journal og eksterne Feide/host-/gatewaylogger, med felt, format, tilgang og retensjonsgap. Produksjonsdestinasjon, sentral sink, eier, retention og vakt/varsling må fastsettes av drift/skoleeier. |
| v5.0.0-V16.2.1 | Delvis implementert | `audit_event` har actor, skole, action, mål-ID og timestamptz; journal har sekvens/kategori/ref. Applikasjonsfeillogg har ikke bruker-/korrelasjons-ID, alle events eller distribuert tidslinje. |
| v5.0.0-V16.2.2 | Delvis lokalt gjennomgått | DB-hendelser er `timestamptz` fra PostgreSQL `now()`. stdout timestamp/synkronisering bestemmes av runtime/host; ekstern Feide, proxy og journalens driftstid er ikke kontrollert. |
| v5.0.0-V16.2.3 | Delvis dokumentert | Koden skriver sine driftsmeldinger til stdout/stderr, forretningsaudit til skole-DB og tilbakekallingsjournal til separat DB. Valgt hosting kan automatisk sende data til logger, traces eller crash reporter utenfor denne modellen; ikke verifisert. |
| v5.0.0-V16.2.4 | Delvis implementert | Forretnings-/sikkerhetshendelser er strukturerte SQL-felter; appfeil er plain text. Ingen felles JSON-format, correlation ID, loggparser eller SIEM-integrasjon finnes. |
| v5.0.0-V16.2.5 | Lokalt implementert, driftskontroll uavklart | Uventet request logger kun metode, `req.path` og feilkode; aldri query, headers, body, token, claims, SQL eller stack. Audit-rader inneholder actor-/skole-ID som er konfidensielle og trenger least-privilege/retention hos drift. |
| v5.0.0-V16.3.1 | Ikke implementert | Lokal login-success/feil, OIDC state-/claim-avslag og logout-resultat føres ikke systematisk til en app-auth-logg. Feide egne loggdata og tilgang fra leverandør er eksternt uavklart. |
| v5.0.0-V16.3.2 | Delvis implementert | Tillatte sensitive administrative mutasjoner og eksport auditeres. Alle mislykkede autorisasjons-, IDOR-, rolle-/CSRF-avslag og sensitive lesetilgangsbeslutninger logges ikke. |
| v5.0.0-V16.3.3 | Delvis implementert | Godkjente medlemskap, invitasjoner, lekseendringer og eksport logges i audit/journal. Feilinput, rate-limit, OIDC-bypassforsøk og andre sikkerhetskontrollavslag blir ikke systematisk varslet/lagret. |
| v5.0.0-V16.3.4 | Delvis implementert | Uventet route-/DB-feil logges med kort, filtrert metadata og API svarer generisk 503; OIDC/DB/TLS-oppstartsfeil kan stoppe tjenesten. Postgres poolens idle error-event droppes bevisst, og TLS-failures/varsling er ikke komplette. |
| v5.0.0-V16.4.1 | Delvis lokalt gjennomgått | Feilloggen bruker metode, path og driverkode fremfor request-felt; audit action-/targettype er databasedefinert. Ingen generisk escape-/log-injection test av alle bruker-/plattformdata. |
| v5.0.0-V16.4.2 | Delvis lokalt implementert | Separat journal-runtime har ikke UPDATE/DELETE og loggrespons er skoleavgrenset. `audit_event` er i skole-DB og appens normale DB-administrator/host kan påvirke den; stdout-loggens immutable tilgang og lagring er ukjent. |
| v5.0.0-V16.4.3 | Ikke implementert | Appen sender ikke sikkerhetslogger til separat SIEM/loggtjeneste for korrelasjon, deteksjon, eskalering eller alarm. Dette krever valgt leverandør og personvern-/retensjonsavtale. |
| v5.0.0-V16.5.1 | Lokalt testet, avgrenset | Parser-/DB-/OIDC-feil får faste generiske svar; E2E sjekker 400/413, status-/rolleavslag og fravær av stack/SQL/token. Uavhengig proxy-/hostingfeilsvar er ikke testet. |
| v5.0.0-V16.5.2 | Lokalt testet, avgrenset | Feide Discovery/token/UserInfo-feil avbryter innlogging; manglende/skadet journal eller database gir ikke tillatelse og aktuelle operasjoner feiler lukket; SQL-transaksjoner rulles tilbake. Alerting/circuit-breaker og produksjonens eksterne feilforløp mangler. |
| v5.0.0-V16.5.3 | Delvis lokalt testet | Schema/rolle/CSRF-avslag stopper ruteflyt; publisering/mottaker/audit er transaksjonell; skole-/konto-/retensjonssletting har journal og restore replay. Syntetiske scenarier dekker representanter, men feilinjeksjon ved hvert write-/commit-steg og full exception-matrise mangler. |

V16 har 16 Level 2-kontroller. Appen har begrenset redigert feillogg og audit-/tilgangsjournal, men mangler login/authorization-failures logging, sentral immutable loggkjede, SIEM/alerting, vedtatt retensjon og operativ vakt.

## Ikke relevant i denne prototypen

Følgende Level 2-kontroller er vurdert mot implementert scope og regnes som ikke relevante for selve tjenesteleverandørens app. Fravær av funksjonen er kontrollert i repoet; dette er ikke en vurdering av Feides eller en driftsleverandørs egne systemer.

| Versjonert krav-ID | Begrunnelse for ikke relevant |
|---|---|
| v5.0.0-V1.2.6, v5.0.0-V1.2.7, v5.0.0-V1.2.8 | Ingen LDAP/JNDI-katalog, XPath/XML-querymotor eller LaTeX-prosessor i server- eller klientflyten. |
| v5.0.0-V1.3.4 | Ingen brukerstyrt bilde/SVG-opplasting eller SVG-rendering; lyd og appressurser leveres av produktet. |
| v5.0.0-V1.3.8, v5.0.0-V1.3.9, v5.0.0-V1.3.11 | Ingen JNDI, memcached eller e-post-/SMTP-/IMAP-integrasjon. |
| v5.0.0-V1.4.1, v5.0.0-V1.4.3 | Skoleappen er JavaScript/Node med automatisk minnehåndtering; den inneholder ikke manuell peker-/bufferallokering. Native tredjepartsavhengigheter faller fortsatt under leverandør-/supply-chain-vurdering. |
| v5.0.0-V4.3.1, v5.0.0-V4.3.2 | API-et er REST/JSON; ingen GraphQL-parser, introspeksjon eller GraphQL data-layer expressions. |
| v5.0.0-V4.4.2, v5.0.0-V4.4.3, v5.0.0-V4.4.4 | Ingen WebSocket-endepunkt eller oppgradering fra HTTP til WebSocket. Nettleseren bruker vanlig HTTP(S) med serverøkt. |
| v5.0.0-V6.8.3 | Ingen SAML-assertion; føderert innlogging implementeres med OIDC. OIDC callback replay og ID-tokenpåstander testes separat. |

Kontroller som gjelder Feides egen authorization server, nettleserleverandør eller valgt hosting merkes her som eksternt ansvar/ikke lokalt verifiserbart, ikke som bestått. Tabellen for ikke-relevans fritar ikke fra Feides krav til tjenesteleverandører eller kommunens egne kontroller.

## Eksterne kontroller som ikke kan bekreftes lokalt

Disse kontrollene er relevante for integrasjonen, men den avgjørende evidensen finnes hos Feide eller valgt driftsleverandør. Lokal test er bare klientens forventede oppførsel mot syntetisk provider.

| Versjonert krav-ID | Ekstern bekreftelse som mangler |
|---|---|
| v5.0.0-V6.3.3, v5.0.0-V6.6.1, v5.0.0-V6.8.4, v5.0.0-V9.1.*, v5.0.0-V9.2.*, v5.0.0-V10.5.1–v5.0.0-V10.5.4 | Feide må levere og faktisk sende forventede issuer/audience/azp/sub/nonce/signatur/JWKS/ACR-claims. Det må også avklares om SMS/PSTN tilbys som Feide-faktor, og hvordan identitetsbevis ved tapt MFA-faktor håndteres. Den lokale OIDC-provider-testen er ikke proof av Feide-claims, faktorrecovery eller Feides autentiseringsnivå. |

## V17 – WebRTC

| Krav-ID | Status | Evidens og avgrensning |
|---|---|---|
| v5.0.0-V17.1.1 | Ikke relevant med begrunnelse | Ingen WebRTC-bruk eller WebRTC-tilkobling fra klienten. Lytteinnhold er forhåndsinnspilte statiske lydfiler over HTTP(S). |
| v5.0.0-V17.2.1 | Ikke relevant med begrunnelse | Ingen WebRTC/TURN-tjeneste eller medie-relé i produktet. |
| v5.0.0-V17.2.2 | Ikke relevant med begrunnelse | Ingen DTLS-SRTP eller WebRTC-nøkkelutveksling. |
| v5.0.0-V17.2.3 | Ikke relevant med begrunnelse | Ingen WebRTC-mediestrømmer eller dynamisk media-server. |
| v5.0.0-V17.2.4 | Ikke relevant med begrunnelse | Ingen WebRTC-/TURN-konfigurasjon eller media-endepunkt. |
| v5.0.0-V17.3.1 | Ikke relevant med begrunnelse | Ingen WebRTC signalingkanal eller signalingserver. |
| v5.0.0-V17.3.2 | Ikke relevant med begrunnelse | Ingen mikrofon-/kameraopptak eller WebRTC-signaling i klienten; lyden leveres som produktstyrte statiske opptak. Dette er kontrollert ved søk i skole- og elevklienten. |

Alle 183 av 183 Level 2-krav-ID-er er dermed individuelt kartlagt, men mange er delvis implementert, ikke implementert eller avhengige av ekstern drift/Feide/skoleeier. Denne dokumentasjonen er en avgrenset egenvurdering, ikke ASVS Level 2-verifikasjon eller sertifisering. Produksjonsforhold, reell Feide, valgt drift, komplett sikkerhetstesting og kommunale beslutninger gjenstår.
