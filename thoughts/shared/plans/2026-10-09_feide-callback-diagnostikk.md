# Avgrenset diagnose av ekstern Feide-retur

9. oktober 2026. Operativ status: Beads mbzi/pial. Produkteier ber om ekstern Feide-innlogging og komplett lærerlekseflyt. Bare syntetiske Feide-testkontoer, beskyttet staging og eksisterende databaser inngår.

## Bevis og problem

Godkjent midlertidig SameSite=None på eksisterende Vercel-cookie lot Feides POST nå appen. Lax er gjenopprettet, med samme verdi, utløp og øvrige egenskaper. Appen svarer generisk 403. Nyeste OIDC-transaksjon er konsumert; ingen identitet, bruker eller appøkt er opprettet. SQL-funksjonen kan opprette pending-bruker uten skole. Feilen er derfor ikke bevist som manglende skole; den kan ligge i tokenutveksling, claims, UserInfo eller identitetsbinding. Ingen konto/rolle eller tenant skal seedes for å skjule denne feilen.

## Minste endring

Registrer faste, forhåndsdefinerte trinn i callbackens eksisterende feilhåndtering: callbackform, logintransaksjon, tokenutveksling, identitetsclaims, UserInfo, navnevalidering, identitetsbinding, skole-/journaltilgang og øktoppretting. OIDC-tjenesten skal ved feil gi intern fast trinnkode uten å endre feilhåndteringen eller godta data som tidligere ble avvist. Callback logger bare fast trinn og feilkategori fra en lukket tillattliste (ugyldig svar, claims, klientautentisering, nettverk, database, ukjent). Ingen feilmelding, stack, årsakstekst, bibliotek-cause-objekt, request-body, URL/query, cookie, ID, navn, token, kode, state, nonce, råsvar, tidsmåling eller studentopplysninger i applikasjonens logg. Plattformens eksisterende request-logg er uendret. Ikke legg diagnostikk i offentlige svar eller endre den generiske 403-siden i denne rettingen.

Behold alle protokollkrav, state/nonce/PKCE/signatur/issuer/sub/ACR, TLS, CSRF, app-/plattformcookies, skole-/journaltilgang og appens no-login-flyt. Bibliotekets detaljer skal ikke serialiseres. Diagnosen er operasjonell feilhåndtering ved avvist innlogging, ingen bruksmåling. Test at ondsinnede feilmeldinger/cause/ukjente koder ikke kommer i logger, og at callback fortsatt avviser uten økt. Test minst ett gyldig lokalt innloggingsløp for at valideringen er bevart.

## Isolert leveranse

Hent kildefilmanifestet fra aktiv Preview dpl_BDNLdUajeNxfm6vjv62BcQwKRAqw. Lag en isolert arbeidskopi basert på gjeldende remote main, og rekonstruer nøyaktig de 318 kildefilene i denne Preview-en. Kopier lokal fil bare når SHA1 samsvarer med manifestets referanse; hent andre fra Vercels autentiserte fil-API. Avvis unsafe stier, hemmelighetsfiler og hashavvik; ikke print kilde-/miljøinnhold. Ikke kopier ucommittet kultur-/uttaleinnhold eller elevinvitasjon 009. Originale tomme metadata-/outputmapper er ikke kjøretidskilde og skal ikke fylles med lokale artefakter. Bevar rootarbeidskopien.

Lag separat codex/feide-callback-diagnostics PR med baseline for eksisterende, allerede leverte backend og den avgrensede diagnostikkendringen som separate commits slik at faktisk ny runtime-diff er tydelig. Ingen merge eller produksjon. Den publiserte main-appen er nyere enn staging: bevar derfor main-versjonens index/CSS/manifest/service-worker i PR-en, ikke introduser reversering av allerede publiserte forbedringer. PR-en legger til eksisterende backend, nødvendige eksisterende bygg-/operatørskript, avgrenset dokumentasjon og tilhørende servertester. Ikke legg til generert public/, oppdateringscache, mediefiler eller rå testartefakter.

Kjør relevante lokale tester og nødvendige bygg/full gate i isolert PR-checkout; persistér logs/manifest uten hemmeligheter. Separat runtime-artefakt bygges fra de 318 eksakte live-kildefilene og bare diagnostikkdiffen. Bevis at backendfilene i dette artefaktet er identiske med den testede PR-koden, og at alle andre live-kildefiler er uendret. Full test:all gjelder PR-checkout; dette skal ikke omtales som full regresjonstest av stagingens eldre frontend. Ingen frontendendring leveres til staging som del av diagnosen. Kritisk gjennomgå konkret diff. Før staging: verifiser PR opprettet, nøyaktig manifest/diff, eksisterende Preview-miljø og arn1. Deploy bare dette artefaktet til Preview, readiness/region/no-login/401-kontroll først, og flytt stagingalias etter beståtte kontroller. Gammel deployment er runtime-rollback uten schemaendring. Ikke utfør migrering 009 her.

## Ekstern kontroll og fortsettelse

Gjenta den allerede godkjente, avgrensede syntetiske cookie-testen når diagnostikkversjonen er klar. Lax gjenopprettes også ved feil; ikke utvid utløp eller andre tilganger. Les bare de faste diagnostikkfeltene fra riktig deployment og tidsvindu. Rett den påviste årsaken med separat nærtest og samme PR-/stagingporter; ikke svekk validering for å få innlogging grønn. En nyttig diagnostikk er ikke full Feide-verifikasjon. Deretter fortsetter eksisterende plan for eksplisitt syntetisk tenant, eksisterende provisioning, separat lærerinvitasjon, elevtilgang og lekse-resultatkontroll. Ekte skole, signering og produksjon er utenfor denne leveransen.


## Diagnose presisert etter ekstern kjøring

Utkast-PR #12 og Preview dpl_G632MuTJ8YeiGwqVw91aLQuQw75f er opprettet. Ekstern syntetisk Feide-retur ga token_exchange/unknown, ingen identitet/økt. Eksisterende Lax-cookie ble gjenopprettet med samme verdi/utløp. Vercels fire sensitive miljøverdier kan ikke pulls til lokal probe; ingen lokal probe ble kjørt. Utvid bare kategoriens lukkede tabell med faste navn for bibliotekets kjente offentlige koder: authentication_challenge, http_status, content_type, unsupported_operation, authorization_response, signature_key, server_metadata, protocol, invalid_argument og invalid_request. Ingen råkode, rånavn, meldinger, challenge, body, statusverdi eller secret serialiseres. Validering og catch er uendret. Nærtest og full gate/kritisk kodegjennomgang før samme isolerte Preview-delivery. Etterpresisering er ikke full ekstern innloggingsverifikasjon.
