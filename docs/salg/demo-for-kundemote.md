# Operatørmanus for kundedemo

Gjeldende 12. november 2026. Dette er intern gjennomføringsveiledning; tilbudsteksten ligger i [kundens tilbudsutkast](tilbud-forste-skole.md). Ingen nye funksjoner eller pedagogisk pilot er forutsetninger for demo.

## Kjøregrunnlag

Bruk [stagingens skoleområde](https://app.spansk123.no/school). Det er syntetisk staging, ikke kundens skole. Adressen har et avgrenset Vercel-unntak slik at ordinær Feide-retur fungerer. Skoledata krever fortsatt riktig Feide-konto, rolle og medlemskap. Ingen cookieendringer, delingsnøkler eller egne Bergen-kontoer skal brukes.

Bruk to separate nettleserøkter: privat Safari til lærer og en annen separat økt til elev. Feides offentlige syntetiske MFA-bruker `frank_foreleser_2f` har allerede lærerrolle i «Syntetisk retensjonstest»; `andreas123elev` er eksisterende elev i klassen «Syntetisk retensjon». Velg den skolen for begge. Frank har også en annen administratorrolle; denne skal ikke brukes som lærerrolle. Hent offentlige testinnloggingsopplysninger direkte fra [Feides testbrukerdokumentasjon](https://docs.feide.no/reference/testusers.html); ikke kopier passord eller engangskoder til manus, rapport eller skjermopptak.

Den [eksterne prøven 12. november](../../output/external-staging-control-2026-11-12/ordinary-feide-school-flow.json) beviser ordinær innlogging, lærerens tildeling, elevens lagring/retting, komplett eksisterende lyd, reload, lærerresultater og begge utlogginger. Fire navngitte «Syntetisk staging 12.11»-lekser beholdes som testspor. Det er ikke en ny bekreftelse på at en vilkårlig senere nettleserøkt er innlogget.

## Før kunden ser skjermen

Logg begge inn på vanlig måte; læreren bruker påkrevd sterkt Feide-nivå. Kontroller riktig syntetisk skole/klasse og at eleven fortsatt er aktiv. Ved avvik bruker du ikke annen skole eller gir nye roller for å få demoen gjennom. Stopp og undersøk.

Velg et kort sett eksisterende oppgaver som er lest faglig gjennom. En ny demonstrasjon kan få en tydelig syntetisk dato/tittel, ett spørsmål og ingen frist. Kontroller elevmottakere før publisering. Ikke slett eller endre gamle oppgaver for å nullstille demoen. Lytting bruker bare de eksisterende opptakene; ingen ny lyd eller talesyntese.

Hold passord-/MFA-skjermer, kontovelger, innloggingsparametere, terminal og private faner utenfor kundens skjermdeling. Vis bare syntetiske navn og oppgaver. Før et senere møte kjøres en kort kontroll av den faktisk valgte oppgaven og de to øktene; det er ikke nødvendig å gjenta hele regresjonspakken.

## Fem minutters levende demonstrasjon

| Tid | Handling | Forklaring til kunden |
| --- | --- | --- |
| 0–1 min | Vis læreroversikt, riktig klasse og områdevalg. | «Her velger jeg hvem som skal få leksen, og hva de skal øve på.» |
| 1–2 min | Publiser én kort, tydelig syntetisk oppgave til eksisterende testklasse. | «Jeg bruker eksisterende faginnhold og bestemmer mengden.» |
| 2–3 min | Bytt til elevøkten, last Mine lekser på nytt, åpne oppgaven og svar. Vent på «Svar lagret». | «Eleven prøver selv og får respons. Kvitteringen bekrefter lagringen.» |
| 3–4 min | Last elevsiden på nytt, deretter læreroversikten og Se fremgang. | «Arbeidet består etter omlasting. Her ser jeg gjennomføring og siste svar, som hjelp til oppfølging.» |
| 4–5 min | Vis at samme arbeidsløp gjelder de fire områdene; bruk tidligere syntetiske resultater tydelig som tidligere testarbeid. | «Dette er øvingsresultater, ikke en karakter. Læreren velger innhold etter gruppens forkunnskaper.» |

Ved lyddemo må filen faktisk spilles; avspillingsfeil skal vises som feil, ikke erstattes med talesyntese eller et gammelt skjermbilde. Ved appfeil stoppes det levende løpet, og kunden får en ærlig forklaring. Et stillbilde omtales som stillbilde.

## Avslutning og kjøpsvei

Logg begge ut i appen og fullfør den tydelige «Logg ut av Feide»-lenken. Bekreft at skolesiden igjen viser innloggingsknappen. Lukk de private testøktene. Ingen rå eksport eller innloggingsdata lagres i kundematerialet.

Avklar kundens behov, antall klasser og hvem som har fullmakt til kjøp og godkjenning av tjenesten. Tilby to måneders gratis utprøving for én skole med inntil seks klasser. Skolen kan bestille videre bruk for 4 995 kr per år. Prøveperioden starter ved bekreftet aktivering.

Kundens godkjenning, faktiske produksjonsmål, driftsaktivering og avtale-/personvernfelt er ikke oppfylt av demoen. Ingen møteinvitasjon, e-post, tilbud eller publisering sendes automatisk fra dette manuset.
