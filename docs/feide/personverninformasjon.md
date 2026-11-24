# Personvern i Spansk på 1-2-3

Versjon 12. november 2026. **Klargjort for skoleeiers gjennomgang, ikke publisert eller godkjent for elevbruk.** Feltene i hakeparentes må fylles ut. Fristene må samsvare med avtalen og faktisk drift før publisering. Dette er malen for innlogget skolebruk, ikke en ferdig offentlig erklæring for en ukjent skole. Utfyllingsgrunnlag og eierbekreftet leverandørforslag: [pilotunderlaget](pilotskole/README.md).

## Kort forklart for elever

Når du bruker skoleområdet, logger du inn med Feide. Spansk på 1-2-3 får navnet ditt og en teknisk bruker-ID, slik at du kan få riktige lekser. Vi får ikke Feide-passordet ditt.

Når du svarer på en lekse, sendes svaret til appens server for å sjekkes. Deretter lagres resultatet og antall forsøk. Dagens lekseflyt måler ikke bruk av hint. Selve svaret lagres ikke i lekseresultatet. Du ser egne resultater. Læreren din ser arbeidet i klasser læreren har ansvar for. Resultatene er hjelp til øving, ikke automatisk karaktersetting.

Fri øving uten innlogging er en egen del av appen. Framgangen der ligger i nettleseren på enheten din og blir ikke automatisk sendt til læreren. Du kan eksportere en sikkerhetskopi og importere den igjen. På en delt enhet må du passe på hvem som kan åpne nettleseren eller filen.

Har du spørsmål om opplysningene dine, kontakt **[skolens kontaktpunkt]**. Du kan også kontakte **[skoleeiers personvernombud]**.

## Hvem har ansvar?

**Behandlingsansvarlig:** [skoleeiers juridiske navn, organisasjonsnummer, adresse og kontakt]. Skoleeier bestemmer hvorfor skoleområdet brukes, hvem som får tilgang, og hvor lenge opplysninger trengs.

**Databehandler:** Oversikt AS, organisasjonsnummer 930 687 758, leverer Spansk på 1-2-3 etter skoleeiers dokumenterte instruks. Kontakt for personvern, støtte og hendelser: Ole Henrik Vik, eier og daglig leder, [olevik91@gmail.com](mailto:olevik91@gmail.com). Oversikt bruker ikke skoleopplysninger til reklame eller trening av KI-modeller som del av tjenesten.

**Personvernombud:** [navn/funksjon, e-post og eventuell telefon hos skoleeier].

## Hvorfor behandles opplysningene?

Formålene er sikker innlogging, tilgang til riktig skole og klasse, tildeling av spansklekser og oversikt over gjennomføring og faglig øving. Opplysninger brukes også til nødvendig drift, feilretting og vern mot uautorisert tilgang.

Skoleeiers behandlingsgrunnlag er **[GDPR artikkel 6 nr. 1, relevant bokstav og konkret supplerende lovgrunnlag]**. Skoleeier fyller dette ut etter sin vurdering. Feides skjerm for utlevering av navn er ikke i seg selv skolens behandlingsgrunnlag. **[Beskriv om bruken er obligatorisk, hvilke opplysninger eleven må gi, og skolens tilbud dersom eleven ikke kan bruke tjenesten.]** Uten Feide-identitet og godkjent medlemskap kan du ikke få digitale lekser eller læreroversikt. Skolen må beskrive et alternativ; fri øving alene gir ikke tilsvarende leksetilgang.

## Hvilke opplysninger brukes?

| Opplysninger | Kilde og bruk |
|---|---|
| Navn og teknisk Feide-ID (`iss` og `sub`) | Fra Feide for å kjenne igjen kontoen. En intern tilfeldig ID kobler konto og resultater. ID-ene er pseudonyme, ikke anonyme. |
| Skole, rolle, klasse og medlemskap | Fra godkjent skoleadministrasjon og invitasjoner. Navn/Feide-ID alene gir ikke lærer- eller administratortilgang. |
| Lekse, oppgaver, frist og mottakere | Fra læreren. Appen beholder hvilken innholdsversjon som ble tildelt. |
| Riktig/feil/fullført, forsøk, økt og tidspunkt | Fra elevens arbeid med tildelte oppgaver. Valgt svaralternativ behandles kortvarig for retting, men inngår ikke i den lagrede læringshendelsen. Datamodellen har et hintfelt som i dagens lekseflyt alltid er 0; det er ikke en måling av hintbruk. |
| Økter og sikkerhetshendelser | For innlogging, utlogging, tilgangskontroll og gjenoppretting. En separat journal hindrer at en sikkerhetskopi åpner tilbakekalte tilganger igjen. |
| Tekniske forbindelsesopplysninger | Hosting- og identitetsleverandører kan behandle blant annet IP-adresse, forespørselsmetadata og driftslogger. Avgrensning og frister skal fremgå av skoleeiers avtalebilag. |

Skoleflyten ber ikke om fødselsnummer, elevens e-post, lydopptak eller fritekstbesvarelser. Den inneholder ikke en funksjon for automatiske avgjørelser med rettslig eller tilsvarende vesentlig virkning. Læreren må tolke resultater i pedagogisk sammenheng.

I fri øving finnes en separat tilbakemeldingsfunksjon hvor eleven aktivt kan lagre et svar og en forklaring lokalt. Den sendes ikke automatisk; eventuell manuell eksport til lærer må følge skolens rutiner. Valgfri egeninnspilling i uttaleøving brukes bare til kortvarig lokal avspilling og lastes ikke opp.

## Hvem kan se opplysningene, og hvor behandles de?

Eleven ser eget arbeid. Aktive lærere ser resultater i egne klasser. Skoleadministrator administrerer tilganger ved egen skole; administratorrollen er ikke det samme som lærerrollen. Autorisert driftspersonell får bare tilgang ved tjenstlig behov og etter avtalt instruks.

Vercel brukes til apphosting, og Supabase brukes til skoledata og en separat sikkerhetsjournal. Verifisert syntetisk staging kjører appfunksjonen og de to databasene i Stockholm. Skolens separate produksjonsmiljø må bekreftes før bruk. **Dette er ikke en garanti for at all behandling, support eller leverandørmetadata skjer i EØS.** Endelig produksjonsoppsett, juridiske leverandørenheter, øvrige behandlingsland og eventuelle overføringsgrunnlag skal oppgis i [lenke til ferdig avtalebilag]. Dette må være avklart før elevbruk. Feide/Sikt behandler også innloggingsopplysninger gjennom skolens Feide-oppsett. Vercels offentlige vilkår skiller mellom kundedata behandlet på instruks og tjenestegenererte data som leverandøren kan behandle under eget ansvar. Hvilke elevrelaterte forbindelsesfelt dette gjelder og deres formål/frister må avklares og oppgis før offentlig elevinformasjon ferdigstilles. Opplysningene er ikke EØS-only bare fordi serverne er i Stockholm.

## Hvor lenge beholdes opplysningene?

Skoleeier skal oppgi konkrete frister her før publisering: **[konto/medlemskap]**, **[lekser og læringsresultater, med startpunkt for fristen]**, **[sikkerhets- og driftslogger]**, **[sikkerhetsjournal]**, **[sikkerhetskopier]** og **[opphør av avtalen]**. Fristene må være innført og testet, ikke bare stå i avtalen. Leverandørforslaget er å beholde skolens læringsdata i avtaleperioden, stenge tilgangen ved opphør og tilby 30 dager til eksport; skolens læringsdata og medlemskap slettes fra aktiv drift senest da. Appens sikkerhetslogger foreslås beholdt i 30 dager. Skoleeier må bekrefte dette og fylle inn faktiske kopi-/journalfrister før informasjonen publiseres. Dette er ikke en lovnad om at alle sikkerhetskopier er fysisk slettet etter 30 dager.

En appøkt varer maksimalt åtte timer; innloggingstransaksjonen varer maksimalt fem minutter. Teknisk utløp betyr at tilgangen opphører. Fysisk sletting av utløpte databaseposter er et eget driftsløp. En separat global OIDC-/pendingjobb kjører fast i staging og er kontrollert 12. november. Den rydder ikke skoledata. Skolejobben er lokalt prøvd og klargjort, men ikke aktivert permanent; den tidligere skolecron-/alarmprøven er avsluttet. Journal, restdata og kopier har egne oppstartskrav.

Du kan slette skolekontoen fra skoleområdet. Handlingen gjelder **hele kontoen ved alle skoler**, og kan ikke angres. Feide-koblingen, leksemottakerkoblinger og lagrede læringshendelser slettes fysisk. Skole- og klassemedlemskap tilbakekalles, men radene med koblinger og roller beholdes. Økter tilbakekalles, og tokenet som brukes til utlogging fjernes. Kontoens interne referanse beholdes med teksten «Slettet konto»; historiske lekser, audit-hendelser og sikkerhetsjournal kan fortsatt ha nødvendige koblinger til referansen. Dette er restdata, ikke garantert anonyme opplysninger. Behov og frist for hver kategori må være fastsatt i skoleeiers avtale. En ny innlogging gir ikke tilbake tidligere skoletilgang eller resultater. Selvbetjent kontosletting erstatter ikke skoleeiers behandling av en rettighetsforespørsel. Avtalens sletterutine må også omfatte sikkerhetskopier og journal.

## Dine rettigheter

Du kan kontakte skoleeier for å be om innsyn, retting, sletting eller begrensning. Retten til å protestere og retten til dataportabilitet avhenger av behandlingsgrunnlaget og vilkårene i personvernregelverket. Skoleeier vurderer forespørselen og forklarer eventuelle begrensninger. Oversikt bistår skoleeier. Skoleeier besvarer normalt rettighetskrav innen én måned; eventuell lovlig forlengelse forklares innen samme frist. En lokal eksport erstatter ikke innsyn i skoledata. En separat, tilgangsbegrenset skoleeksport er prøvd med syntetiske data14.oktober; globale identitets- og sikkerhetsjournaldata krever egen avgrenset rettighetsbehandling. Elevens «Last ned egne øvingsdata» omfatter profil og læringshendelser ved valgt skole, og lærerens eksport er en klasseoversikt; disse er ikke fullstendige registeruttrekk. Skoleeier må også kunne gi innsyn i medlemskap, sikkerhets- og restdata etter relevant avgrensning. Du kan klage til [Datatilsynet](https://www.datatilsynet.no/).

## Nødvendig nettleserlagring

Skoleområdet bruker nødvendige innloggings-, transaksjons- og sikkerhetscookies. Fri øving lagrer framgang lokalt og kan lagre appressurser for bruk uten nett. Skole-API, autentisering og personlige svar skal ikke legges i appens offlinebuffer. Kanonisk Preview har Vercels ekstra adgangscookie. Stagingadressen app.spansk123.no har et avgrenset domeneunntak, slik at Feide-returen fungerer uten denne cookien; appens egne tilgangskrav består. Produksjonsoppsettet beskrives særskilt. Appen har ikke egen reklamesporing eller bruksanalyse i denne flyten.

Endringer i formål, leverandører eller datatyper skal vurderes og dokumenteres før de innføres. Gjeldende offentlig versjon skal ha dato, kontaktpunkter og en stabil nettadresse.

## Før teksten publiseres

Skoleeier og Oversikt skal kontrollere at kontaktpunkter, grunnlag, obligatorisk/valgfri bruk, frister, mottakere/land, overføringsgrunnlag og hvordan man får kopi av overføringsgarantier er utfylt. Oppgi lenke eller kontakt for slike garantier: **[fyll ut]**. Dersom samtykke faktisk brukes for en separat behandling, oppgi hvordan det trekkes tilbake og hva dette påvirker; ikke legg samtykke til som standard for skolelekser.

Skoleeier skal informere elever/foresatte og ansatte før første innlogging og dokumentere kanal/dato. Kontakt- og fristfeltene skal hentes fra signert DBA bilag C/D. Personverninformasjon er informasjon, ikke et avtaleforhold som eleven må godta for å gi skolen behandlingsgrunnlag.

[Datatilsynet: rett til informasjon](https://www.datatilsynet.no/rettigheter-og-plikter/den-registrertes-rettigheter/rett-til-informasjon/) er kontrollert 13. oktober 2026. Databeskrivelsen er avstemt15.oktober mot appkilde37220f1, appmigrering001–011 og de dokumenterte eksport-/sletteprøvene. Ingen skoleeiers grunnlag eller frister er fylt inn uten beslutning. Skoleeier skal ha en DPIA som dekker denne læreroversikten før elevdata; [teknisk DPIA-underlag](pilotskole/dpia-underlag.md) er bistand, ikke skoleeiers vedtak.

Gjeldende skoleinformasjon fylles fra [leverandør- og fristbilaget](leverandor-og-fristbilag.md), med avtalte leverandør-/logg-/kopi-/journalfrister. Stagingens domeneunntak gjelder innloggingsskallet; skoledata er fortsatt tilgangskontrollert i appen.
