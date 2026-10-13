# Prøveprotokoll: lærer, elev og én komplett lekseflyt

Klargjort 13. oktober 2026. Bare syntetiske brukere og eksisterende stagingdatabaser. Dette er en gjennomføringsprotokoll, ikke bevis på ekstern verifikasjon. Ingen virkelig skole er aktivert.

## Før den eksterne prøven

Feide må først opprette en gyldig appøkt. Tokenutvekslingen gir foreløpig `invalid_client`; oppfølging er sendt i Sikt-sak #553065. Administratorens nødvendige sterke autentiseringsnivå må bekreftes separat. Lærerinnlogging alene gir ikke administratoradgang.

Den gjennomgåtte elevinvitasjonen må leveres via en separat reviewbar PR og beskyttet Preview, sammen med migrering 009. Lokalt kildegrunnlag og migreringsopplegg finnes i `output/skoleflyt-klargjoring-2026-10-13/`. Før ekstern migrering skal riktig database, migreringer 001–008, syntetisk/tilstrekkelig tomt datagrunnlag, snapshot og rollback kontrolleres. Ingen av disse eksterne stegene er utført i denne klargjøringen.

Bruk en allerede godkjent syntetisk skoleeier/skole og separate syntetiske kontoer for administrator, lærer, elev A og elev B. Kontoer og godkjent provisioning må kobles til samme skole; ikke gi medlemskap bare fordi en konto kan logge inn. Ikke hent eller roter hemmeligheter. Del engangskoder direkte i testøkten; ikke ta dem med i rapport eller skjermbilder.

Bruk separate nettleserprofiler for rollene. Kjør hovedflyten ved desktopbredde og gjenta relevante skjermbilder/handlinger ved 390 px. Noter norsk dato/tid, deployment-ID og migreringsversjon før start. Stagingadressen er `https://app.spansk123.no/school`; bekreft aktuell Preview før prøven.

## Administrator: første tilgang

1. Logg inn som syntetisk skoleadministrator med nødvendig sterkt autentiseringsnivå. Forvent «Skoleadministrasjon». En økt uten riktig nivå skal kreve sterkere innlogging.
2. Velg «Lag lærerinvitasjon». La den nye lærerkontoen bruke koden under «Engangskode fra skolens administrator» → «Godta skoleinvitasjon». Forvent «Læreroversikt».
3. Velg «Lag elevinvitasjon» og gi en egen kode til hver ny elev. Eleven skal få elevrolle etter «Godta skoleinvitasjon», aldri lærerrolle. Skolekoden gir ingen klasse- eller leksetilgang alene.
4. Prøv en allerede brukt kode igjen og en separat tilbakekalt kode. Begge skal avvises. Lærer/elev skal ikke kunne utstede skoleinvitasjoner.

Invitasjoner kan brukes én gang og utløper etter sju dager. En skolekode og en klassekode er forskjellige fullmakter.

## Lærer: klasse og lekser

1. Opprett «Syntetisk spanskgruppe – 13.10.2026», skoleår `2026-2027`, med «Opprett klasse».
2. Velg «Inviter elev» for hver elev og del hver sin engangskode. Eleven bruker «Engangskode fra spansklæreren» → «Bli med i klassen».
3. Før godkjenning skal eleven se at forespørselen er sendt, men ingen lekser. Læreren åpner «Forespørsler» og velger «Godkjenn elev». Oppdater elevens side og kontroller tilgang.
4. Godkjenn begge elevene **før** publisering. Mottakerlisten fryses når leksen publiseres; senere klassemedlemskap gir ikke automatisk gamle lekser.
5. Under «Gi en digital lekse»: velg riktig klasse, område/tema og én oppgave per lekse. Publiser følgende fire titler uten frist:

| Tittel | Aktivitet i katalogen |
|---|---|
| Syntetisk lekse – ordforråd | `vocabulary.all.v1` |
| Syntetisk lekse – grammatikk | `grammar.a0Foundation.v1` |
| Syntetisk lekse – verb | `verbs.present.v1` |
| Syntetisk lekse – lytting | `listening.leo-sevilla.v1` |

Grensesnittet viser aktivitetens norske område og tema. ID-ene ovenfor identifiserer testgrunnlaget. Forvent publiseringskvittering med to mottakere og fire publiserte lekser.

## Elev: gjennomføring og lagring

1. Elev A åpner «Mine lekser». Kontroller de fire titlene; elev B har samme lekser, men ingen gjennomførte svar.
2. Åpne ordforrådsleksen med «Fortsett». Velg ett feil svar og «Sjekk svaret». Forvent forklaring og «Svar lagret». Velg «Prøv et nytt svar», svar riktig og kontroller ny lagringskvittering.
3. Fullfør grammatikk, verb og lytting. I lytteoppgaven brukes eksisterende lydopptak. Manglende lyd skal gi klar melding, uten syntetisk tale som erstatning.
4. Last siden på nytt etter kvitteringen. Gjennomført arbeid skal være bevart. Kontroller også etter utlogging og ny innlogging med **samme** konto.
5. Prøv ett svar under midlertidig avbrutt nettforbindelse i den syntetiske testøkten. Appen skal ikke påstå at svaret er lagret. Gjenopprett forbindelsen og bruk «Prøv å lagre igjen». Samme innsending skal ikke telle dobbelt. Ikke last siden på nytt før gjenforsøket: et ubekreftet svar er ikke dokumentert varig lagret.

## Lærer: resultat og avslutning

1. Velg «Se fremgang» for klassen. Elev A skal ha gjennomføring i alle fire områder; elev B skal fortsatt stå uten gjennomførte oppgaver. Kontroller «Gjennomført» og «Riktige svar sist» mot elevens siste lagrede svar.
2. Bruk «Eksporter klasseoversikt» og elevens «Last ned egne øvingsdata». Kontroller at elevens eksport bare gjelder egen konto. Behandle også syntetiske eksporter som testartefakter og fjern dem etter kontroll.
3. Prøv at elev B ikke får læreroversikt/resultatoversikt, og at en syntetisk konto uten godkjent klasse ikke kan åpne eller sende svar på leksen. Forvent nekt, uten opplysninger om andre elever.
4. Velg «Avslutt lekse» på én syntetisk lekse. Eleven skal ikke lenger kunne åpne eller sende svar på den.
5. Kontroller «Logg ut», tilbakeknapp og ny åpning av beskyttet side for alle roller. Lokal økt og Feide-utlogging må observeres separat. Den tidligere IAB-blokkeringen før serverrespons er fortsatt uavklart; ikke registrer den som bestått logout.
6. Bekreft at «Fri øving uten konto» fungerer og ikke deler lokal øving med læreren. Kontroller eksisterende lokal eksport/import i en egen syntetisk økt.

## Evidens og godkjenning

Registrer faktisk resultat, tidspunkt, rolle og teststeg uten rå tokens, cookies, engangskoder eller innloggingsparametere. Ta bare skjermbilder med eksplisitte syntetiske data. Skille mellom lokal API-test, nettlesertest og ekstern Feide-test.

Den eksterne flyten er først godkjent når gyldig appøkt, adminnivå, første elevtilgang, klassegodkjenning, publisering, lagret elevsvar, lærerresultat, uvedkommende nektet og logout er observert på riktig stagingversjon. Avtale, personverninformasjon og faktisk skoleaktivering har fortsatt egne porter før virkelige skoler/elevdata.
