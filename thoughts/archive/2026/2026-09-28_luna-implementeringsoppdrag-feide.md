# Implementeringsoppdrag til GPT-6 Luna: skoleplattform og verifiserbart kommuneunderlag

Datert 28. september 2026. Forberedelsesoppgave: `spansk-ungdomsskole-eyj5`. Dette er et ferdig oppdrag som kan gis til Luna; det starter ingen implementasjon eller ny Codex-task av seg selv.

## Målet som skal gis til modellen

**Implementer en lokalt kjørbar og sikker førsteversjon av Spansk på 1-2-3 med Feide-integrasjon, digitale lekser og læreroversikt i ordforråd, grammatikk, verbbøying og lytting. Lever samtidig etterprøvbart underlag til Feides leverandørerklæring, databehandleravtale og kommunenes tekniske vurdering. Ferdig betyr at programvaren og sikkerhetskontrollene er testet lokalt, og at hvert utsagn om databehandling og drift er koblet til bevis eller merket som en konkret ekstern avklaring.**

Målet gjelder hele ungdomsskolen og spansk nivå I i videregående. Leveransen er en implementert testversjon klar for videre integrasjons- og produksjonsverifikasjon. Registrering, avtaler, faktisk skydrift, ekte Feide-test og pilot med elever er separate bekreftelser. En lokal test eller et skrevet dokument er ikke kommunal godkjenning.

## 1. Arbeidsmandat og autonomi

Arbeid i dette prosjektet. Les `AGENTS.md`, `README.md` og hele [Feide-planen](2026-09-28_feide-lekser-og-laereroversikt.md) før kode. Denne oppdragsbeskrivelsen presiserer den planen om utlogging, dokumentasjon og hva som kan bygges før alle eksterne forhold er avklart.

Fortsett gjennom alle leveransene nedenfor. Ikke avslutt etter en arkitekturskisse, innloggingsknapp, tomme API-er eller én fungerende skjerm. Implementer og verifiser én sammenhengende del om gangen, og fortsett til neste. Bruk Beads som eneste operative oppgavesporing. Send korte statusoppdateringer uten å vente på godkjenning mellom vanlige, reversible utviklingssteg.

Ta selv vanlige implementasjonsvalg innenfor mandatet og dokumenter vesentlige beslutninger. Bruk vedlikeholdte biblioteker fremfor egen kryptografi, OIDC- eller SAML-parser. Nye avhengigheter må løse et faktisk problem. Ikke gjennomfør en generell omskriving av dagens enkeltfil eller bytt teknologistakk uten behov.

Manglende Feide-hemmeligheter, skoleavtaler, DNS eller driftskonto skal ikke stoppe lokal implementasjon. Lag en uttrykkelig avgrenset lokal testkonfigurasjon og fortsett med alt uavhengig arbeid. Før manglende forhold i Beads med ansvarlig, nødvendig handling og produksjonsport. Ikke kryss dem av som oppfylt. Stans bare det konkrete steget som krever opplysninger/autorisasjon; be om avklaring hvis et sikkerhetskritisk forhold ikke kan isoleres trygt. Ressurs-/verktøygrenser skal rapporteres ærlig, ikke omgås eller omtales som fullført arbeid.

Ikke kjøp tjenester, send meldinger, registrer/endre noe i Sikt, signer avtaler, push, deploy eller bruk ekte elevdata. Ikke be om client secret i chatten. Hemmeligheter til en eventuell senere autorisert Feide-test leses fra sikker lokal konfigurasjon og skal aldri vises i verktøyutdata.

## 2. Arbeidsgrunnlag, branch og miljø

Start med Beads- og Git-status. Det finnes allerede lokale endringer fra målgruppe-/planarbeidet; bevar dem. Arbeid på en `codex/`-gren. Ved isolert worktree må også gjeldende, ukommitterte planer/instrukser bringes med eksplisitt, uten å tilskrive dem Luna eller miste dem. Ikke bruk bare gammel HEAD som produktspesifikasjon.

Før kontokode: dokumenter utvikling → staging med syntetiske data → eksplisitt godkjent produksjon. Skill konfigurasjon, hemmeligheter, databaser og tilganger. Lokal staging-policy er ikke tillatelse til publisering. Ingen ekte elevdata i preview, CI eller test.

Standardvalg for å kunne arbeide uten skyleverandør: TypeScript/Node-server, PostgreSQL, database-migreringer og et lite innlogget webgrensesnitt med samme origin som API-et. Velg støttede versjoner fra offisiell dokumentasjon ved oppstart; lås avhengigheter og forklar valgene kort. Gjenbruk innhold og øvingsmotor med et avgrenset lag for kontolagring. Bevar den statiske appen og lokal eksport/import. Ingen automatisk overføring av lokale elevdata til konto.

Lever repeterbar lokal oppstart, fortrinnsvis containere for database og testidentitetstilbyder. Ikke gjør tilgangen til Docker til eneste mulighet: dokumenter også kjøring mot lokal PostgreSQL hvis verktøyet mangler. Ikke erstatt databasen i integrasjonstestene med et minneobjekt.

Bruk en separat lokal OIDC-testtilbyder som faktisk kjører kodeflyt, signerte ID-tokens, discovery/JWKS, utløp og utlogging. Den er en protokolltest, ikke bevis for Feide-kompatibilitet. Testbrukere og enkel rollevelger finnes bare i denne lokale testtilbyderen. Produksjonsbygg og -oppstart skal avvise testissuer, demohemmeligheter og testinnlogging. Ingen tillit til identitetsheadere eller klientvalgt skole/rolle.

## 3. Sikker identitet, innlogging og utlogging

### Innlogging og identitet

Implementer serverbasert OpenID Connect Authorization Code med PKCE S256, state og nonce. Bruk Feides discovery med fast tillatt issuer. Valider signatur, audience/azp der relevant, issuer, tid og nøkkelrotasjon gjennom et vedlikeholdt bibliotek. Callback og returlenker har eksakte allowlister. Ingen implicit flow, lokal passorddatabase eller `longterm` i første versjon. [S1]

Hent bare nødvendig bruker-, skole- og rolleinformasjon. Lever en tabell med faktisk scope, faktisk claim/API-felt, formål, nødvendighet, lagringstid og kilde. Offisielt dokumentert mapping og lokalt testet mapping skal kunne angis før ekte Feide-test; faktisk mottak fra en skole skal ikke oppdiktes. Avvis ukjente/manglende skoledata og tvetydige roller. Lag ingen fallback som gir elev eller lærer tilgang basert på navn eller e-postdomene alene.

Bruk intern UUID og adskilte identitetsbindinger. Feide dokumenterer mulig gjenbruk av `sub`; følg konto-/skolelivsløpet i hovedplanen. En dokumentert ikke-gjenbrukbar identifikator eller verifisert skoleeierrutine må foreligge før den skolens produksjonstilgang åpnes. Test sperring, avsluttet konto, endret skole og forsøk på gjenbruk. Ikke bestill fødselsnummer for å løse problemet. [S4]

Bruk tilbakekallbare serverøkter, Secure/HttpOnly-cookie uten Domain-attributt, SameSite som passer den dokumenterte callback-flyten og CSRF-beskyttelse for mutasjoner. Begrens proxy-tillit. Standard: åtte timers absolutt varighet, lærer/admin 30 minutters inaktivitet, med tilgjengelig varsling før utløp. En sperring eller rolleendring skal gjelde ved neste API-kall. Hemmeligheter og sesjonsnøkler har dokumentert rotasjon.

Implementer sterk autentisering for privilegerte administratorhandlinger, og en konfigurerbar skolepolicy for lærerdata. Bruk Feides dokumenterte `acr_values` og kontroller faktisk `acr`; ikke anta at en forespørsel om MFA betyr at den er gjennomført. Ukjent/lavere nivå skal nekte den beskyttede handlingen og forklare hva som mangler. Skoleeiers støtte og faktisk MFA-test er eksterne verifikasjonspunkter; ingen egen SMS-/passordløsning. Skill skoleadministrator fra leverandørens driftsadministrator. [S5]

### Utlogging – et eksplisitt ferdigkriterium

Feides OIDC-dokumentasjon beskriver lokal utlogging etterfulgt av RP-Initiated Logout. Dette er ikke automatisk global utlogging fra alle andre Feide-applikasjoner. SAML beskriver en annen SLO-mekanisme; ikke lov SAML-funksjonalitet i en OIDC-integrasjon. Dersom en kommune krever global/IdP-initiert utlogging, registrer et presist kompatibilitetsspørsmål til Sikt og kommunen. Ikke legg til en uverifisert SAML-/front-channel-/back-channel-løsning eller påstå støtte bare fordi biblioteket har funksjonen. [S2, S3, S6]

Implementer og test:

1. Brukerutløst, CSRF-beskyttet utlogging tilbakekaller appøkten på serveren før ekstern navigasjon. Gamle cookies skal ikke gi tilgang selv om Feide er utilgjengelig. Andre åpne faner skjuler personlige data og gamle forespørsler avvises.
2. Send brukeren til verifisert `end_session_endpoint` med registrert `post_logout_redirect_uri`, nødvendig `id_token_hint` og engangs logout-state. Callback kontrollerer state; callback oppretter aldri en ny innlogging. [S3]
3. ID-token som trengs til utlogging oppbevares bare server-side med øktens korte levetid og krypteres hvis det lagres i database. Det slettes etter bruk/utløp. Overføring til Feide gjennom den standardiserte utloggingsforespørselen er det nødvendige protokollunntaket; token skal ikke være tilgjengelig i appens JavaScript eller nettleserlagring. Rediger bort querystrenger/Location-headere med tokens fra logger, tracing, skjermopptak og testartefakter. Bruk referrer-policy som hindrer videre lekkasje.
4. Lokal suksess og bekreftet retur fra Feide vises som forskjellige tilstander. Ved avbrudd/nettfeil skal appen si at den lokale økten er avsluttet, men Feide-utlogging ikke er bekreftet. Ingen automatisk innlogging tilbake til samme konto.
5. Bakoverknapp, BFCache, service worker, nettlesercache, to faner, ny bruker på samme maskin og sent ankomne API-svar skal ikke vise forrige brukers data. `no-store` alene er ikke bevis; test faktisk nettleseratferd.
6. Utløpt økt med ventende elevsvar følger hovedplanens separate gjeninnloggingsvindu og minnekø. Hold det atskilt fra uttrykkelig utlogging: forklar og få et uttrykkelig valg før ukvitterte svar forkastes; aldri send dem under en annen bruker.

## 4. En komplett skole- og lekseflyt

Implementer skoleeier → skole → klasse, skoleår, godkjent lærer/medlærer og elevmedlemskap. Første skoleadministrator opprettes gjennom en eksplisitt, logget administrasjonsrutine etter verifisert skoleeierinstruks. Ingen blir administrator fordi vedkommende er første innloggede ved skolen. Lokal seed kan opprette syntetiske administratorer, men kan ikke brukes i produksjon.

Alle tilgangskontroller ligger på serveren og omfatter enkeltrader, summer, søk, eksport og slettejobber. Databasen håndhever riktig skoleeier/skole i relasjonene. Eleven ser bare eget arbeid; læreren bare arbeid i egne autoriserte klasser. Skoleadministrator har ikke automatisk rett til alle elevresultater. Ingen offentlig resultatlenke.

Feides aktivering på skole-/skoleeiernivå og produktets egne tilgangsgrenser skal dokumenteres hver for seg. Bruk enkel verifisert klasseinvitasjon og lærergodkjenning fra hovedplanen. Automatisk gruppeimport er ikke nødvendig for dette oppdragets ferdigstillelse; undersøk muligheten og dokumenter den som mulig videre forbedring.

Lærer velger fagområde og eksisterende innhold, klasse, frist og antall oppgaver; forhåndsviser og publiserer. Eleven finner flere samtidige lekser i «Mine lekser», gjør dem og får lagringskvittering. Læreren ser status per elev og utvikling per område. Alle fire fagområder skal bruke ekte øvingslogikk og faktisk database, ikke demografikker eller tilfeldig generert fremgang. Lytting bruker kun produktets eksisterende lydfiler og klare feilmeldinger ved manglende lyd.

Publiserte lekser og innhold versjoneres; mottakerlisten tas ved publisering. Håndter sent arbeid, endret frist, nye/fjernede elever, lærerbytte og avsluttet skoleår. Første versjon tildeler til hele klassen. Ikke utvid til karakterbok, foreldrekonto, meldinger, elevfritekst, opptak eller AI-vurdering.

Bruk hovedplanens minimale resultatmodell: oppgave-/ferdighetsreferanse, versjon, forsøk, utfall, hint, tildeling og økt. Ikke lagre rå elevsvar, lyd eller hele lokalhistorikken. Første forsøk, flere økter, dubletter og forsinkede hendelser har entydig definisjon og tester. Vis teller og nevner; manglende data er ikke null mestring. Skill gjennomføring, riktighet og selvvurdering. Formative øvingsdata skal ikke fremstilles som jukssikre prøver eller karaktergrunnlag.

Innlogget leksearbeid må ikke passere gjennom dagens lokalprofil og skrive navn, oppgaver eller kontoresultater i appens gamle localStorage. Innfør et eksplisitt lagringsskille og test begge moduser. Fri lokal øving bevares og deles ikke automatisk med læreren. Nettbrudd håndteres med idempotent innsending, tydelig «ikke lagret» og hovedplanens begrensede minnekø; lov ikke offline kontolekser.

## 5. Drift, sikkerhet og datalivsløp som kjørbar funksjon

Implementer validerte API-skjemaer, parameteriserte databasespørringer, output-escaping, størrelsesgrenser, tidsgrenser og rate limiting for utsatte endepunkter. Bruk CSP uten `unsafe-eval` i kontodelen, beskyttelse mot innramming, sikker transportkonfigurasjon og låst CORS. Hvis gammel inline-kode hindrer en stram policy, gjør nødvendige avgrensede uttrekk; ikke svekk policyn uten konkret risiko- og tiltaksvurdering.

Ingen tredjepartssporing, session replay eller eksterne analyseverktøy i elev-/lærerdelen. Inventer også fonter, CDN, bilder, feillogging og DNS-/hostlogger; dokumenter alle nettverksmål og dataflyter. Kontodelens ressurser leveres selv der det er mulig. CI-test med syntetiske data skal avdekke uventet utgående trafikk og persondata i logger.

Lever migreringer, minst privilegert databasebruker, helsesjekk uten persondata, begrenset auditlogg, avtalbar retensjon, eksport og sletting. Slettejobber skal faktisk kjøres med scheduler/kommando og være idempotente. Dekk identitet, resultater, avledede oversikter, filer, økter og tilganger. Bruk hovedplanens retensjon som konfigurerbare forslag, ikke som allerede inngåtte avtaler.

Lag backup- og restore-prosedyre og kjør en faktisk gjenoppretting med syntetiske data i separat database. Bevar en minimal gjenopprettingsjournal separat fra databasesnapshotet for sletting, kontosperring og tilbakekalling av roller, klasse-/skolemedlemskap og skole-/skoleeiertilgang. Også en fortsatt aktiv lærer som har mistet klasseansvar skal nektes tilgang etter restore. Journalen må være varig før en sikkerhetsendring kvitteres; dokumenter idempotent gjennomføring, sekvens/kontrollpunkt og hvordan fullstendigheten av journalen bekreftes. Gjennomfør journalen frem til et bekreftet konsistent punkt før kontodelen åpnes; manglende eller ufullstendig journal holder den stengt. Ugyldiggjør samtlige gjenopprettede appøkter uavhengig av journalen. Test gammel backup med nyere sletting, fortsatt aktiv lærer med fjernet klasseansvar, tilbakekalt administratorrolle og gammel cookie. Ikke hevde kryptert skybackup eller bestemt RPO/RTO på grunnlag av en lokal SQL-dump.

Lever container-/deploykonfigurasjon, secrets-eksempel uten verdier, miljøkontroll og CI med database + lokal OIDC. Produksjonskonfigurasjon skal feile lukket ved testidentitet, manglende sikkerhetsverdier eller ugyldig transportoppsett. Dokumenter utestående leverandørvalg, region, underleverandører, tilgang fra tredjeland, backup, driftsansvar og kostnad. Velg gjerne et begrunnet driftsforslag, men ikke fremstill forslaget som etablert drift.

Dokumenter hendelseshåndtering, varsling til skoleeier, nøkkelrotasjon, sikkerhetsoppdateringer, gjenoppretting og avvikling med tydelig eier/rolle og praktiske kommandoer. Skriftlige rutiner som ikke er innført i virksomheten skal merkes «utkast – må innføres». Ingen påstand om døgnbemanning, ISO-sertifisering, ekstern penetrasjonstest eller navngitt sikkerhetsorganisasjon som ikke finnes.

Bruk relevante krav fra OWASP ASVS 5.0.0 nivå 2 som teknisk kontrollgrunnlag, med versjonerte krav-ID-er hentet fra standarden. Oppgi anvendelige, ikke relevante og uverifiserte krav med begrunnelse. Dette er egenverifikasjon, ikke sertifisering. Avhengigheter kontrolleres for sårbarheter og lisens; konkrete alvorlige funn i leveransen må håndteres, ikke skjules med blanket-unntak. [S10]

## 6. Dokumentasjon som kan brukes overfor Sikt og kommunene

Lever følgende under `docs/feide/`, med en kort indeks. Dokumentasjonen beskriver det ferdige resultatet, ikke bare intensjonene:

| Fil | Konkret leveranse |
|---|---|
| `README.md` | Kort systemoversikt, dataflytdiagram, status og lenker til bevis. |
| `registrering-og-attributter.md` | Registreringsverdier som kan utledes av konfigurasjonen, separat test/prod, scopes/claims med nødvendighetsbegrunnelse, login/logout-adresser, kontaktfelter som mangler. |
| `leverandorerklaering.md` | Begrunnede svarutkast organisert etter Feides 15 temaer, med faktagrunnlag og uavklarte forhold. |
| `behandlingsoversikt-og-dba.md` | Datakategorier, registrerte, formål, tilgang, lagring, sletting, mottakere/underleverandører og utkast til relevante DBA-bilag. Bruk Feides/DFØs malgrunnlag uten å hevde signert avtale. |
| `risiko-og-personvern.md` | Konkret risiko-/trusselmodell, tiltak og restrisiko; underlag for skoleeiers DPIA-vurdering og behandlingsgrunnlag, ikke en oppdiktet godkjenning. |
| `sikkerhet-og-utlogging.md` | Implementerte auth-/tilgangsgrenser, MFA, lokal logout/RP-Initiated Logout, sesjonsutløp, delte maskiner og nøyaktig avgrensning av global SLO. |
| `drift-og-beredskap.md` | Miljøer, overvåking/logging, backup/restore, retensjon, sikkerhetsoppdatering, hendelser, underleverandører og produksjonsforutsetninger. |
| `personverninformasjon.md` | Kort, forståelig bokmål til elev/lærer om lagring, hvem som ser hva, lagringstid og rettigheter. Uavklart behandlingsansvarlig/kontakt er synlig merket. |
| `tilgjengelighet.md` | Underlag for Feides tilgjengelighetsskjema, testede flyter, testmetode og kjente mangler. For privat leverandør brukes dette underlaget; ikke lov direkte tilgang til uustatus.no. |
| `verifikasjon.md` | Krav → kode/konfigurasjon → test/kommando → faktisk resultat/dato/revisjon → miljø → gjenværende avklaring. Lenker til egne sanitiserte artefakter. |

Feides offentlige veiledning beskriver 15 temaer: styringssystem, kommunikasjon, personell, informasjonsforvaltning, tilgang, kryptografi, fysisk sikkerhet, drift, utvikling/vedlikehold, leverandører, hendelser, kontinuitet, samsvar, personvern og behandlinger. Bruk dette som struktur. Vi har ikke inspisert det innloggede skjemaet; ikke oppfinn de eksakte spørsmålene eller felt-ID-ene. Hvis et faktisk skjema senere gis, mapp svarene til det. [S7]

Hvert svarutkast får status **implementert og lokalt testet**, **eksternt verifisert**, **utkast/må besluttes** eller **ikke relevant med begrunnelse**. Manglende evidens er ikke «ja». Virksomhetstiltak, avtalepart, drift og fysisk sikkerhet kan ikke bekreftes av kode alene. Skoleeier beslutter behandlingsgrunnlag og vurderer risiko/DPIA; leverandøren leverer nødvendige fakta. [S8, S9, S11, S12]

## 7. Verifikasjon og ferdigkriterier

Automatiser meningsfulle negative tester samtidig med implementasjonen. Ferdig lokal leveranse krever:

- Ren oppstart med faktisk PostgreSQL og lokal OIDC, migrering + syntetisk seed, og én dokumentert kommando for den samlede nye verifikasjonen.
- To skoleeiere, hvor én har to skoler, med minst to elever og to lærere per relevant tilgangstest. Bevis isolasjon mellom elever, klasser, skoler under samme eier og forskjellige eiere. Test ID-bytting i alle API-/rapport-/eksportveier og direkte databasebegrensninger.
- Full lærer → elev → lærer-flyt i alle fire fagområder, med flere samtidige lekser, faktiske lagrede resultater og korrekt tellere/nevner. Verifiser 390 px og skrivebord, tastatur og relevante skjermleser-/fokusflyter. Automatiske tilgjengelighetstester er supplement, ikke full WCAG-bekreftelse.
- Auth-negative tester: feil issuer/audience/signatur/state/nonce, gjenbrukt kode, ugyldig redirect, roterte nøkler, utløp, manglende MFA, sperret medlem og produksjonsforsøk med testauth.
- Logout-testene i kapittel 3, reautentisering uten kontoblanding, idempotente svar, omvendt leveringsrekkefølge, to enheter og nettbrudd før/etter kvittering.
- Gamle lokale eksportfiler kan fortsatt importeres. Kontomodus skriver ingen nye persondata til gamle lokale nøkler; nettverks- og loggkontroller består.
- Retensjon, eksport og sletting er kjørbare og tilgangstestet. Restore av eldre backup bevarer nyere sletting/sperring og tilbakekalte roller/klasse-/skoletilganger, også for aktive brukere. Gamle appøkter er ugyldige. Manglende/ufullstendig gjenopprettingsjournal hindrer åpning av kontodelen. Dokumentasjonens bevis stemmer med testresultatene.
- `npm run build:app`, `npm run test:all`, nye server-/database-/OIDC-tester og `git diff --check` kjøres på det endelige resultatet. Ikke fjern/deaktiver tester for å få grønt.

Det var seks bekreftede testfeil på HEAD `d45fbfd` før kontoutvikling, registrert i `spansk-ungdomsskole-8eak`: gamle nivåtestforventninger og mobilmenybruk. Undersøk og rett de utdaterte testene/ekte feilene med bevart testintensjon før endelig fullkjøring. Dette er inkludert i implementeringsmandatet. Ikke bruk gammel rapport som bevis for at en ny feil er kjent.

Lever en egen integrasjonskommando/prosedyre for ekte Feide-testkontoer. Uten credentials/aktivering står denne «ikke kjørt – ekstern forutsetning», mens lokal protokoll- og applikasjonstest kan ferdigstilles. Ikke bruk skip av lokal auth-/sikkerhetstest som erstatning for implementasjon.

Ferdigrapporten viser separat: hva som virker og er testet lokalt; hva som faktisk er verifisert mot Feide/drift; hva produkteier/skoleeier må gjøre før produksjon. Vis også utestående feil. Ingen formulering «produksjonsklar», «GDPR-godkjent» eller «Sikt-godkjent» uten at den konkrete betydningen og eksterne beviset foreligger.

## 8. Rekkefølge og forholdet til eksisterende Beads

Gjennomfør: datakontrakt/arkitektur og miljø → auth/utlogging/tilgang → én ordforrådslekse ende til ende → øvrige tre områder → datalivsløp/drift → samlet hardening, dokumentasjon og demonstrasjon. Legg bevis inn løpende så sluttfasen ikke består av påstander som må rekonstrueres.

Bruk epic `spansk-ungdomsskole-rbec` og eksisterende `brq`, `rbec.1`–`rbec.4`. Før implementasjonsstart deles eksterne produksjonsforutsetninger i `brq` fra kontrakt- og designarbeid som kan lukkes lokalt. Opprett bare nødvendige undersaker og juster avhengighetene åpent: lokal B–D kan bygges med dokumentert kontrakt og syntetiske data, selv om skoleavtale/skydrift i A gjenstår. Behold produksjons-/ekte Feide-testporter som blokkerte, og lukk ikke hele `brq` eller `rbec.4` på grunnlag av lokal gjennomføring alene. Ingen parallelle markdown-oppgavelister for faktisk arbeidsstatus.

Før ferdigmelding gjennomføres kritisk gjennomgang av auth, datatilgang og slette-/restoreflyt med nye tester for bekreftede funn. Ikke be brukeren vurdere hver intern teknisk løsning. Samle til slutt bare avklaringer som faktisk krever brukerens opplysninger, avtale eller tilgang.

## 9. Primærkilder kontrollert 28. september 2026

- **S1:** [Feide: OIDC security considerations](https://docs.feide.no/service_providers/openid_connect/security.html).
- **S2:** [Feide: Logout](https://docs.feide.no/reference/oauth_oidc/logout.html).
- **S3:** [Feide: Redirection after logout](https://docs.feide.no/service_providers/manage/openid_connect/redir_etter_logout.html).
- **S4:** [Feide: Person and account identifiers](https://docs.feide.no/reference/schema/identifiers/index.html).
- **S5:** [Feide: Service-initiated MFA using OIDC](https://docs.feide.no/service_providers/mfa/openid_connect.html).
- **S6:** [Feide: SAML technical guide, logout](https://docs.feide.no/reference/saml/saml2_technical_guide.html).
- **S7:** [Feide: Fyll ut og bruk leverandørerklæringen](https://www.feide.no/leverandorerklaering).
- **S8:** [Feide: Mal for databehandleravtale](https://www.feide.no/informasjon-tjeneste/mal-databehandleravtale).
- **S9:** [Feide: Underlag for tilgjengelighetserklæring](https://www.feide.no/underlag-tilgjengelighetserklaering).
- **S10:** [OWASP ASVS, stabil versjon og versjonerte krav](https://owasp.org/projects/asvs).
- **S11:** [Feide: Vertsorganisasjoners plikter](https://www.feide.no/vertsorganisasjoners-plikter).
- **S12:** [Datatilsynet: Veiledning om DPIA](https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/vurdering-av-personvernkonsekvenser/).

Kildene angir rammer og anbefalinger; konkrete løsningsvalg og testkrav ovenfor er prosjektets implementeringskrav. Kontroller relevante kilder ved implementasjonsstart hvis de er endret. Faktiske skjema-, avtale- og driftsforhold må verifiseres særskilt.

## 10. Kritisk gjennomgang av oppdraget

Gjennomført med `adversarial-plan-review`, to runder 28. september 2026. Runde 1 ga ett vesentlig funn: en gammel backup kunne gjeninnføre tilbakekalte klasse-/administratorrettigheter eller appøkter for fortsatt aktive brukere. Kapittel 5 og ferdigkriteriene er rettet med separat varig journal, konsistenskontroll før åpning, ugyldiggjøring av økter og konkrete negative restore-tester. Hovedplanen er samordnet.

Runde 2 bekreftet funnet `FIXED` og ga `VERDICT: APPROVED`, uten nye uløste funn. Råkritikk ligger lokalt i `/private/tmp/adversarial-plan-review/luna-round-1-critique.md` og `/private/tmp/adversarial-plan-review/luna-round-2-critique.md`. Dette bekrefter gjennomgått implementeringsoppdrag; kode, Feide-integrasjon, drift og organisasjonstiltak er ennå ikke verifisert gjennom dette oppdraget.
