# Operative kontrollrutiner for Spansk123 – utkast, må vedtas og innføres

**Status:** Dette er en klargjort intern rutine, ikke bevis på at Oversikt AS har etablert en operativ sikkerhetsfunksjon. Ole Henrik Vik er bekreftet system-, drifts- og personvernansvarlig. Støtte: olevik91@gmail.com på hverdager, første svar innen to arbeidsdager. Privat hendelsestelefon kan kontaktes hele døgnet; ingen navngitt reserve eller garantert døgnbemannet respons er oppgitt. Kundens kontakt og håndtering ved fravær må avtales før aktivering. Forslagene til interne målfrister nedenfor krever uttrykkelig vedtak og må inn i skoleeieravtalen. Rutinen gir ikke døgnbemanning eller endrer lovpålagte frister.

## Roller som må navngis

| Funksjon | Navn/kontakt | Stedfortreder | Må være på plass før |
|---|---|---|---|
| Systemeier og beslutning om stans/gjenåpning | Ole Henrik Vik, eier og daglig leder (bekreftet9.11.2026) | **Uavklart** | Preview kobles til database |
| Sikkerhets-/personvernkontakt hos Oversikt AS | Ole Henrik Vik, eier og daglig leder; olevik91@gmail.com (bekreftet9.11.2026) | **Uavklart** | Elevdata eller reell Feide-identitet |
| Teknisk hendelsesleder | Ole Henrik Vik; faktisk prosjekt-/MFA-tilgang kontrolleres før aktivering | Ingen navngitt reserve oppgitt | Produksjonsdrift |
| Kontakt hos hver skoleeier / behandlingsansvarlig | Fylles ut per avtale | Fylles ut per avtale | Før skolens databehandling |

Én person fyller flere funksjoner. Dokumenter denne bemanningsbegrensningen og avtal faktisk eskalering ved fravær; ikke oppgi en stedfortreder som ikke finnes. Ikke bruk elevdata før kontaktfeltene i avtale og personverninformasjon samsvarer.

## Sikkerhets- og personvernhendelser

### 1. Registrer og triager

1. Motta varsel via den godkjente kontaktkanalen. Opprett hendelses-ID, registrer mottakstid i UTC, innmelder, berørte tjenester/miljøer og observerte fakta. Ikke legg tokens, elevsvar eller unødvendige personopplysninger i fritekstnotater.
2. Hendelsesleder vurderer om hendelsen kan berøre konfidensialitet, integritet eller tilgjengelighet, om skole-/klassegrenser kan være brutt, hvilke datakategorier og skoleeiere som kan være berørt, og om hendelsen fortsatt pågår.
3. Ved mulig eksponering, feil tenanttilgang, stjålet privilegert konto eller utrygg databasegjenoppretting: steng skolemodus eller berørt funksjon. Prioriter å hindre videre tilgang fremfor å bevare tilgjengelighet. Ikke gjenåpne før systemeier og teknisk hendelsesleder har dokumentert årsak, avgrensning og kontrolltest.

**Foreslått intern responsstandard – må vedtas:** Registrer henvendelsen straks den mottas, og start tidslinjen fra første troverdige varsel. Hendelsesleder gjør første triage innen fire timer i avtalt beredskapsvindu. Ved mulig brudd på personopplysningssikkerheten varsles skoleeierens kontakt uten ugrunnet opphold, med et internt mål på senest 12 timer etter Oversikts første kjennskap; del foreløpige fakta og et tidspunkt for neste oppdatering selv om årsaken ikke er kjent. Gjeldende avtale kan kreve raskere varsel og går foran målet. Hvis kontaktpunktet ikke svarer, bruk avtalt stedfortreder og eskaleringskanal; ikke vent på full undersøkelse. Skoleeier avgjør om hendelsen skal meldes videre og har sin egen fristvurdering. GDPR artikkel 33 angir 72 timer for behandlingsansvarliges melding til tilsynsmyndighet der vilkårene er oppfylt, og krever at databehandler varsler behandlingsansvarlig uten ugrunnet opphold; dette er bakgrunnen for den foreslåtte interne bufferen, ikke en frist Oversikt kan love før avtale. Kilder: [Datatilsynet om bruddmelding](https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/avvik/hvilke-brudd-skal-meldes-til-datatilsynet/) og [GDPR artikkel 33](https://eur-lex.europa.eu/eli/reg/2016/679/oj).

### 2. Begrens og bevar bevis

1. Bevar tidslinje, relevante deploy-/tilgangs-/databasehendelser, konfigurasjonsendringer og leverandørhenvendelser. Noter kilde, tidsrom, tidssone, hvem som eksporterte materialet og hvor det ble lagret. Eksporter bare nødvendige data; begrens tilgangen og sett slettedato.
2. Be om bevaring/eksport tidlig: Vercels synlige Pro-runtime-loggvindu er én dag; Supabase oppgir sju dagers Pro-loggtilgjengelighet. Supabases varslede Logs Query-håndheving er ennå ikke aktiv; når håndhevingen starter tidlig i 2027, kan gjentatt overforbruk redusere synlig loggretensjon til 24 timer og senere stenge loggtilgangen midlertidig. Dette er leverandørens synlige vinduer, ikke bekreftet intern oppbevaring. Ikke vent med forespørsel mens intern analyse pågår.
3. Tilbakekall kompromitterte økter, tokens eller credentials fra den berørte leverandørens sikre kontrollflate. Roter kun berørte hemmeligheter, oppdater secret store og runtime, og verifiser at gammel hemmelighet avvises. Ikke kopier hemmeligheter inn i chat, ticket eller dette dokumentet.
4. Ved mulig database-/journalavvik: hold kontodelen stengt. Ikke gjenopprett en snapshot til åpen trafikk før separat sikkerhetsjournal er spilt frem til et bekreftet konsistent punkt og gjenopprettede økter er ugyldiggjort.
5. Be leverandør skriftlig bevare relevante logger og oppgi omfang, tidspunkt, behandlingssteder og berørte underdatabehandlere. Leverandørens svar arkiveres med tilgangsbegrensning.

### 3. Vurder varsling og avslutning

1. Kontakt berørt skoleeier gjennom kontaktpunktet i avtalen så raskt som avtalt og uten å vente på full rotårsaksanalyse. Oppgi kjente fakta, usikkerhet, berørte systemer/data, umiddelbare tiltak og tidspunkt for neste status. Ikke konkluder på skoleeiers eller Datatilsynets vegne. Vedta som standard at neste status gis innen 24 timer mens hendelsen er aktiv, også når det ikke foreligger nye bekreftede funn; merk også denne målfristen som forslag inntil godkjent.
2. Skoleeier som behandlingsansvarlig avgjør regulatorisk og registrertvarsling. Oversikt gir nødvendig bistand og følger avtalens frister; ikke lov en bestemt frist som ikke står i gjeldende avtale.
3. Hendelsesleder dokumenterer årsak, påvirkning, beslutninger, tiltak, varslinger, gjenstående risiko og forebyggende oppgaver. Systemeier godkjenner lukking. Gjennomfør etterkontroll og oppdater risiko-/dataflytdokumentasjon.

**Øvelse før pilot:** Gjennomfør en tabletop med syntetisk scenario: feil klassevisning, lekket deploy-token eller databasegjenoppretting med tilbakekalt medlemskap. Verifiser kontaktvei, stenging, leverandørkontakt, bevislogg og hvem som gir gjenåpningsgodkjenning. Dater resultat og korriger rutinen.

## Tilgang, MFA og hemmeligheter

1. Før opp unike personlige kontoer, teamrolle, miljø-/prosjekttilgang, aktive tokens/integrasjoner og MFA-status for Vercel, Supabase, GitHub, DNSdomene.net og Sikt. Ikke registrer hemmelighetsverdier i inventaret.
2. Fjern delte personkontoer og unødvendige administratorroller. Bruk minste nødvendige rolle for daglige oppgaver; hold database-migrering og førstegangsprovisjonering adskilt fra app-runtime. Gi tidsavgrenset tilgang når plattformen støtter det.
3. Krev MFA for alle menneskelige administratoridentiteter. Vercel-teamkravet ble aktivert 2. oktober 2026 etter kontroll av at eneste medlem/eier har personlig 2FA. Bekreft at kravet fortsatt er aktivt ved neste tilgangsgjennomgang, og test deploy og kontogjenoppretting med kravet på. Inventer automatiske deploy-/gjenopprettingsmetoder og fjern menneskekontoavhengigheter der dette kan gjøres uten å svekke kontrollene.
4. Gjennomgå tilgang kvartalsvis, ved rolle-/arbeidsforholdsendring og etter hendelse. En annen person enn den som godkjente en tilgang bør så langt det er mulig bekrefte at den fortsatt er nødvendig. Når virksomheten bare har én operatør, dokumenter dette avviket og kompenser med varsler, tilgangslogger og periodisk ekstern kontroll.
5. Ved opprettelse/rotasjon: lag hemmelighet direkte i plattformens secret manager, bruk separate verdier per miljø og database, dokumenter eier, formål, opprettelses-/rotasjonsdato og tilbakekallingsprosedyre. Etter rotasjon verifiser ny tilkobling og avvisning av gammel verdi. Ikke hent hemmeligheter til terminalutskrift eller repository.

**Bevis som arkiveres:** datert tilgangsmatrise uten hemmeligheter, MFA-kontroll, liste over aktive deployintegrasjoner, gjennomgåelsesgodkjenning og eventuelle unntak med utløpsdato. Ingen slik fullstendig matrise er bekreftet per 2. oktober 2026.

## Leverandør- og underdatabehandlerendringer

1. Navngitt leverandøransvarlig kontrollerer minst kvartalsvis, og ved leverandørvarsel, gjeldende DPA, underdatabehandlerliste, region-/overføringsvilkår, sikkerhetsrapporter og support-/loggvilkår for Vercel og Supabase. Arkiver versjon/dato og dokumenter hvilke tjenester i Spansk123 som bruker leverandøren.
2. Ved ny underdatabehandler, endret region eller endrede vilkår: registrer dato og berørte dataflyter; undersøk varslings- og innsigelsesfristen i gjeldende avtale; varsle skoleeier gjennom avtalt kanal og innhent nødvendig beslutning før endringen tas i bruk for elevdata.
3. Hvis konsekvensene ikke kan fastslås, hold elevdata og nye integrasjoner av; vurder leverandør-/funksjonsbytte. Oppdater DBA-bilag, behandlingsoversikt, personverninformasjon og Sikt-erklæring når faktiske forhold endres.

## Retensjonsjobb og driftsendringer

1. Skoleeier og Oversikt fastsetter retensjonsperiode per datakategori i signert instruks. Leverandørforslaget er eierbekreftet9.november, men er ikke skoleeiers instruks før kunden har bekreftet det.
2. Før automatisering: bruk staging med syntetiske data; kjør først rapportmodus, kontroller omfang, kjør deretter `school:retention -- --apply` med separat sikkerhetsjournal, og verifiser sletting, journalføring og restore-replay.
3. Produksjonsplanlegging kan først opprettes når godkjent policy, sikre runtime-/migreringstilganger, scheduler-eier, kjøreintervall, alarmmottaker, feilprosedyre og leverandørbackupens retensjon er dokumentert. Den gamle statusen fra2.oktober er historisk: global authjobb er nå aktiv i staging; ny skoleworker er klargjort inaktiv. Se drift-og-beredskap.md for det konkrete skillet.
4. Ved schema-/runtime-endring: gjennomgå migrering og rollback, test på staging med syntetiske data, kontroller backup og tilgangsroller, og la utpekt godkjenner dokumentere produksjonsbeslutning. Ingen produksjonsdeploy er godkjent av dette dokumentet.

## Vedlegg per hendelse eller kontrollgjennomgang

Bruk én tilgangsbegrenset post per gjennomgang, med: kontroll-ID; dato/tidsrom UTC; miljø og prosjektref; utførende og godkjenner; redigert bevislenke; resultat; avvik; tiltakseier og frist; avslutningsbevis. Oppbevaring og tilgang for disse postene må fastsettes. Ikke legg elevdata eller hemmeligheter ved.
