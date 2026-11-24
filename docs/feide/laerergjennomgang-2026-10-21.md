# Lærergjennomgang med syntetiske data — 30 minutter

**Overstyrende status 9. november:** den gamle demomappen og porten nedenfor er ikke tilgjengelige. Se [gjeldende pilotstatus](pilotskole/pilotstatus.md) for ny midlertidig forhåndsvisning og den åpne utloggingsfeilen zcnf. Ikke bruk dette historiske driftsoppsettet som bekreftelse på at en kundedemo er klar. Samtalemanuset kan gjenbrukes når hele rollebyttet er verifisert.

Klargjort 21. oktober 2026, Beads 58y7. **Ingen lærergjennomgang er gjennomført eller faglig godkjenning gitt ennå.** Målgruppe: spansklærere i ungdomsskolen og videregående nivå I. Én lærer og én fasilitator er nok til første samtale; flere lærere kan følge senere. Ingen invitasjoner eller meldinger er sendt.

## Formål og ramme

Læreren skal selv finne ut hvordan en lekse gis, oppleves av eleven og følges opp. Vi undersøker forståelse, forberedelsestid og faglig nytte. Dette er en produktgjennomgang uten elever, ikke en teknisk akseptansetest, Feide-test, effektstudie eller tillatelse til å bruke reelle elevdata.

Bruk den separate lokale demokopien i `/private/tmp/spansk123-teacher-demo-2026-10-21`. [Oppstart, stopp og kontrollstatus](../../output/arkitektur-og-laerergjennomgang-2026-10-21/demo-drift.md). Appadresse: `http://127.0.0.1:31400/school`. Den virker på eierens maskin; den er ikke en delbar internettlenke. Fjern lærer kan følge en manuelt avtalt skjermdeling, uten opptak eller automatisk transkripsjon. Ikke publiser, tunnelér eller åpne maskinens porter for å gjøre demoen tilgjengelig.

Innloggingen viser «Kun lokal OIDC-test». Første lærerinnlogging kan gi meldingen om sterkere nivå: velg «Logg inn med sterkere Feide-nivå» og deretter samme syntetiske lærer. Dette er kontrollert i demokopien. Velg bare «Syntetisk lærer», «Syntetisk elev A» eller «Syntetisk elev B». Ingen Feide-passord brukes. Dette beviser ikke MFA: den lokale tilbyderen simulerer autentiseringsnivå. Rolle- og sikkerhetskontroller er ikke slått av. Bruk separate nettleserprofiler for lærer/elev, ikke to private vinduer som kan dele cookies. Ved ett profilvindu: logg helt ut og velg ny syntetisk identitet før rollebytte.

Ikke bruk lærerens ekte navn, skole, elevnavn, e-post, Feide-identitet eller elevarbeid i appen. Fasilitatoren bruker følgende eksakte navn:

| Objekt | Syntetisk verdi |
|---|---|
| Skole og skoleeier | Syntetisk demoskole / Syntetisk skoleeier |
| Lærer | Syntetisk lærer (`demo-teacher`) |
| Elever | Syntetisk elev A og Syntetisk elev B |
| Ny klasse | DEMO – spanskgruppe 1 |
| Skoleår | 2026-2027 |
| Lekse | DEMO – bestemte artikler |
| Område | Grammatikk · Grammatikk · Artikler (15 oppgaver), aktivitet grammar.articles.v1 |
| Omfang og frist | To oppgaver; ingen frist nødvendig i demoen |

Kataloginnholdet må leses i appen; ikke finn på oppgavenavn eller hev at hele pensum dekkes. Hvis artikkeltemaet mangler, bruk et tilgjengelig grammatikktema og noter faktisk tittel i observasjonen. Fasilitator kontrollerer de to valgte spørsmålene før samtalen; feil fasit betyr velg et annet kontrollert tema eller reserveopplegget.

## De to oppgavene — fasilitatorens fasit

Den klargjorte katalogen bruker de første to spørsmålene i `grammar.articles.v1`:

| Oppgave-ID | Vist oppgave | Riktig svar |
|---|---|---|
| grammar:articles:9 | ___ casa es grande / Huset er stort. | La |
| grammar:articles:10 | ___ libro es interesante / Boka er interessant. | El |

Begge er bestemt artikkel i entall. Velg «El» først på casa-oppgaven for å undersøke feilrespons, og rett deretter til «La». Ikke fortell læreren svaret før eget forsøk. Dette er en liten arbeidsflytprøve, ikke dekning av hele artikkeltemaet. Første spørsmål har også ubestemte alternativer; den norske oversettelsen avgrenser fasiten.

## Fasilitator før møtet — omtrent ti minutter

Start bare lokal demo etter driftsarket. Kontroller «status: ok» og «securityJournal: ok» på healthz. Lukk privat e-post, skyløsninger og andre elevdata før eventuell skjermdeling. Hold operatørterminal og .env ute av delt skjerm. Forbered lærer- og elevprofil, begge på samme loopbackadresse. Konto A/B finnes, men er ikke på forhånd med i klassen. Klargjør observasjonsskjemaet nedenfor. Ikke fyll inn resultater på forhånd.

Lag ikke klassen på forhånd: første oppgave er å la læreren finne den. Ved gjenbruk etter en tidligere samtale: behold historikken, bruk «DEMO – spanskgruppe 2» og en ny leksetittel. Ikke kjør global reset eller slett andres lokale data for å få en tom start. Invitasjonskoder er engangskoder og skal bare kopieres mellom de lokale profilene, ikke inn i referatet. Begge elever må være godkjent i klassen **før** leksen publiseres; mottakerlisten fryses ved publisering.

## Samtalemanus

| Tid | Oppdrag til læreren | Hva fasilitatoren ser etter |
|---|---|---|
| 0–3 min | «Tenk på en liten spansklekse du kunne gitt neste uke. Hva må du kunne velge, og hva trenger du å se etterpå?» | Lærerens behov før funksjonene forklares. Noter uten navn/skole. |
| 3–7 min | Logg inn som syntetisk lærer. «Lag en klasse for denne demonstrasjonen.» Bruk navnene i tabellen. | Finner læreren «Klassenavn», «Skoleår» og «Opprett klasse» uten forklaring? |
| 7–12 min | «Få to demonstrasjonselever inn i klassen.» Læreren velger «Inviter elev». Fasilitator logger elev A inn i egen profil, skriver koden i «Klasseinvitasjon» og velger «Bli med i klassen». Læreren åpner «Forespørsler» og godkjenner. Gjenta med **ny kode** for elev B. | Skjønner læreren at kode gir forespørsel, og at lærer må godkjenne? Kan venting forklares uten tekniske ord? |
| 12–17 min | «Gi begge elevene en lekse på to oppgaver i det valgte grammatikktemaet.» Bruk «Gi en digital lekse», velg klasse/tema, tittel, antall 2 og «Publiser lekse». Les spørsmål/alternativer sammen etter publisering ved behov. | Skjønner læreren tema, mengde og hvem som får leksen? Er oppgavene faglig egnet? |
| 17–23 min | Læreren prøver elev A: åpne «Mine lekser», svar feil én gang med vilje, les responsen og gjennomfør begge oppgavene. Elev B åpner ikke leksen. | Er neste handling tydelig? Er forklaring, retting og tempo nyttig? Ingen hint fra fasilitator før læreren har forsøkt. |
| 23–27 min | Tilbake som lærer: velg «Se fremgang». «Hva forteller dette om elev A og B? Hvem ville du fulgt opp, og hvordan?» | Skiller læreren gjennomføring fra riktige svar? B har ingen besvarelse; dette beviser ikke manglende innsats. Teller/nevner må vurderes mot faktiske svar, ikke forhåndspåstått score. |
| 27–30 min | «Hva måtte du gjøre som appen burde gjort? Hvor ville dette stoppet i en vanlig time? Ville du brukt det neste uke, og hva må da endres?» | Én konkret forbedring og ett tydelig bruksområde, eller konkret grunn til å avstå. Ingen ledende spørsmål om kjøp/effekt. |

Vent opptil omtrent 60 sekunder før hjelp. Si først «Hva ville du prøvd nå?» og noter deretter hjelpen som ble nødvendig. Ikke la en fastlåst registreringsflyt spise resten av samtalen: fasilitator kan fullføre det lokale steget, tydelig merket som hjelp, og gå videre til oppgave og oversikt.

Lytting og verb finnes som egne områder, men er valgfrie etter hovedløpet. Ikke generer lyd eller bruk TTS. Lytting krever at eksisterende opptak virker og er faglig kontrollert. Denne første gjennomgangen trenger ikke lyd eller mikrofon.

## Reserve dersom skoleappen ikke starter

Bruk [20-minuttersopplegget i eksisterende innloggingsfri modus](../../PILOT.md) på en separat syntetisk lokal profil. Avgrens til «Grammatikk» → «Leksjoner» → «Velg el, la, los eller las» og to elevforsøk. Vis lokal oppsummering. Forklar at reserveappen **ikke** demonstrerer digital tildeling eller læreroversikt. Merk disse delene «ikke vurdert» i referatet. Ingen forhåndslaget skjerm eller oppdiktede tall skal presenteres som virkelig kjøring.

## Observasjonsskjema — fylles først under faktisk samtale

Dato/tid Europe/Oslo: ikke gjennomført. Demoversjon/kildemanifest: ikke registrert for møtet. Skoletrinnstype og forkunnskapsnivå: frivillig grov kategori, ingen skole-/personnavn. Valgt aktivitet og to oppgave-ID-er: ikke valgt. Deltakeridentifikasjon: ingen navn, e-post eller opptak.

| Observasjon | Resultat |
|---|---|
| Opprettet klasse | Ikke vurdert — noter uten hjelp / med hjelp / stopp og faktisk tidsbruk |
| Forstod invitasjon og godkjenning | Ikke vurdert |
| Publiserte med riktig mottakerliste | Ikke vurdert |
| Forstod respons og kom videre som elev | Ikke vurdert |
| Tolket A gjennomført / B uten besvarelse riktig | Ikke vurdert |
| Faglig korrekthet og egnet mengde på de to oppgavene | Ikke vurdert |
| Største stoppunkt og konkret lærerhjelp | Ikke vurdert |
| Ville brukt neste uke, og nødvendig endring | Ikke vurdert |

Skriv bare anonymiserte arbeidsflytobservasjoner, ikke lærerens eller elevers personopplysninger/fritekstarbeid. Lokalt referat deles ikke automatisk og ingen ny analytikk legges til. Produktfunn legges i Beads med oppgavereferanse og anonymisert reproduksjon; dette skjemaet er evidens, ikke en parallell oppgaveliste. Slett rå kladden etter at nødvendige anonymiserte funn er overført, senest etter sju dager; beholder du et referat, skal det bare inneholde anonymiserte produktfunn. Dette er en praksis for denne samtalen, ikke vedtatt retensjon for elevdata.

## Etter møtet

Logg ut av begge demoøktene, stopp app/OIDC og begge demodatabaser etter driftsarket. Behold kun syntetiske lokale demodata for neste avtalte samtale; ikke gjenbruk miljøet til ekte data. Full fjerning av bare denne demoen er beskrevet separat i driftsarket. Registrer faktisk gjennomført/ikke gjennomført, hjelp og prioriterte produktfunn. Et godt resultat gir grunnlag for neste produktforbedring, ikke automatisk Feide-/skoleaktivering eller elevpilotgodkjenning.
