# Leverandør- og fristbilag til DBA B–D

**Internt arbeidsutkast 20. november 2026. Skolehenvendelsen holdes tilbake.** Kontrollen datert 20. november nederst erstatter eldre statusopplysninger for samme forhold.

Historisk utfyllingsgrunnlag fra 12. november 2026. Utfyllbart underlag til skoleavtalen, ikke signert eller godkjent produksjonsdrift. Ved signering fryses dokumentet med de øvrige avtalte bilagene. Bruk kundens avtalereferanse **[referanse]** og skoleeiers instruks **[versjon/dato]**. Ikke legg elevlister, rå identifikatorer, hemmeligheter eller privat hendelsestelefon i dette bilaget.

## Dokumentert grunnlag

| Forhold | Bekreftet | Avgrensning før signering/aktivering |
| --- | --- | --- |
| App og journal | Staging: Vercel arn1 og to Supabase-databaser eu-north-1; app 012/journal 006 og 23 kildebindinger. Ordinær Feide/MFA/fireområderskjede bestod 12. november. | Faktisk produksjonsmål og klient føres særskilt. Stockholm for runtime/databaser dokumenterer ikke alle leverandørers behandlingsland. |
| Global opprydding | Eksisterende separat stagingjobb og monitor er aktive; automatisk kjøring 674 og ny monitorping observert. | Dekker OIDC-/pendingomfanget, ikke skolens samlede data eller backup/journal. |
| Skolevis drift | Kilder, inaktiv pakke og lokal PostgreSQL 17.11-installasjon/stopp er prøvd. | Nye faktiske roller, prosjekt, kundepolicy, kostnadsramme, scheduler og mottatt skoleworker-alarm bekreftes ved separat aktivering. |
| Synlige databasebackups | Begge stagingprosjekter viste fysiske daglige backups datert 5.–12. november. Appens siste viste backup var 12. november 02:24:58 UTC, journalens 02:36:50 UTC. | En synlig liste er ikke maksimal lagringsfrist, alle kopityper eller bestått restore. Storage-objekter omfattes ikke av databasebackupen. Ingen restore er bestilt/kjørt her. |

Kildebevis: [staging](../../output/external-staging-control-2026-11-12/README.md), [drift](../../output/operations-readiness-2026-11-12/README.md) og [datert leverandørarkiv](leverandorvedlegg/README.md). Skoleeier får et frosset, lesbart utdrag; lokale stier er ikke offentlige dokumentadresser.

## Leverandørens avklaringer – skal ikke skyves over på kunden

| Felt | Faktagrunnlag og utfylling som Oversikt leverer |
| --- | --- |
| Supabase-avtale | Offentlig DPA versjon 1 av 1. august 2026 er kontrollert på nytt 12. november. Den innloggede Legal Documents-siden for Oversikt AS / Pro bekreftet 12. november at standard-DPA inngår automatisk for organisasjonen, uten separat signering. Automatisk svar fra personvernadressen 2. oktober beskriver samme ordning. Eier bekreftet 12. november at Oversikt AS bare bruker vanlige nettvilkår og ikke har en særskilt forhandlet avtale/DPA. Dette er ikke et krav om å innhente en separat signert standard-DPA. |
| Vercel-avtale | Offentlig DPA sist oppdatert 17. mars, effektiv 31. mars 2026, kontrollert på nytt 12. november. Eier bekreftet 12. november vanlige nettvilkår uten særskilt forhandlet avtale/DPA. **[Kontorelasjon/juridisk kunde, gjeldende avtale og referanse]**. Skill kundedata på instruks fra tjenestegenererte opplysninger som Vercel behandler under eget ansvar. |
| Faktisk underleverandørkjede | **[Valgte produkter, juridiske enheter, datafelt, underleverandører og formål]**. Arkiverte globale lister er kildegrunnlag, ikke bevis for at alle produktene eller KI-leverandørene brukes. |
| Steder og overføring | **[Runtime, primærdata, backup, logger, support/fjerntilgang og øvrige metadata per leverandør; overføringsgrunnlag, konkret vurdering og tiltak]**. Ingen udokumentert EØS-only-påstand. |
| Endringer hos underleverandører | [Faktisk abonnement på endringsvarsler, mottaker, viderevarsling til skoleeier, kundens godkjenning og leverandørens innsigelsesfrist]. Ikke lov en lengre reaksjonsfrist enn den faktiske leverandørkjeden tillater. |
| Logger og leverandørmetadata | **[Felt, formål, roller, faktisk oppbevaring, tilgang og sletting]**. Appens 30-dagersforslag gjelder ikke automatisk leverandørlogger. |
| Kopier og journal | **[Maksimal oppbevaring for hver kopitype, operatørkopier, kontrollert utløp, land og dokumentasjon]**. Journalens minimale tilbakekall må dekke den dokumenterte kopihorisonten før gjenåpning kan skje sikkert. **[Journalens endelige slettefrist og gjennomføringsbevis]**. Ingen gjettet 30-/90-dagersfrist. |
| Driftskapasitet og kontosikkerhet | [Bekreftet kapasitet/kvote for det faktiske produksjonsmålet og dokumentert kontogjenoppretting]. Ingen forbruksgrense endres automatisk av denne avtalen. |

[Supabase DPA](https://supabase.com/legal/customer-resources/data-processing-addendum) og [Vercel DPA](https://vercel.com/legal/dpa) er primærkilder for avtalerollene. Den konkrete konto-/land-/kopiavstemmingen må være ferdig før elevdata; teksten over er ikke attest på at de åpne leverandørfeltene er avklart.

Supabase-DPAens punkt 11.2 gjelder retur/sletting ved opphør av avtalen med Supabase. Det er ikke dokumentasjon på maksimal restlevetid i felles databasekopier når bare én kundeskoles avtale opphører mens leverandørkontoen består. Derfor må kopihorisonten ovenfor dokumenteres særskilt.

Healthchecks brukes bare til tomme tekniske signaler og operatørkontakt. Leverandørens [FAQ](https://healthchecks.io/docs/faq/#dpa) beskriver eget behandlingsansvar og ingen kundesignert DBA for denne bruken. [Personvernvilkårene](https://healthchecks.io/privacy/) angir antallsstyrt pinghistorikk og egne databasekopier inntil to måneder. Dette er ikke appens loggfrist og skal ikke overføres til elevdata. Bruk utenfor denne dataminimeringen krever ny vurdering.

## Nytt konto- og TIA-grunnlag 12. november

[Kontroll og sendte oppfølginger](../../output/supplier-followup-2026-11-12/verification.json) dokumenterer den lesende kontokontrollen. TIA-en som organisasjonssiden lenket til, er datert 14. mars 2025, nevner Supabase Inc og SCC Module Two. Den er et generelt leverandørgrunnlag, og er eldre enn DPA-en av august 2026. Den kan ikke alene bekrefte Oversikts konkrete underdatabehandlerkjede eller behandlingssteder. Relevansen for dagens Pte. Ltd.-avtale og processor-to-subprocessor-forhold må avstemmes; ikke erstatt Module Three med Module Two bare fordi den eldre TIA-en bruker dette.

SOC2-/ISO-dokumentene viste Team-krav i grensesnittet. Det er ikke en bestilling av dyrere plan eller en konklusjon om at DPA9.2 ikke gir annet sikkerhetsgrunnlag. Faktiske land, loggfelter, kopifrist og journalhorisont står fortsatt åpne. Den tekniske supportsaken SU-531462 hadde ved kontrollen bare automatisk mottak 30. oktober; ingen hosted restore er frigitt av denne avklaringen.

## Kundens instruksjonsfelt

| Felt | Utfylling som bekreftes av skoleeier og Oversikt |
| --- | --- |
| Part, myndighet og skole | [Juridisk skoleeier/org.nr., bestiller/fullmakt, skole/Feide-organisasjon og første godkjente administrator] |
| Omfang og grunnlag | [Inntil seks klasser, faktisk antall/aldre, behandlingsgrunnlag, DPIA/ROS/PVO-referanse og informasjon/alternativ til elever] |
| Avtaleperiode | [Startdato] til [sluttdato]. Data beholdes gjennom den avtalte perioden. |
| Opphør og tilgangsstans | [Dato/tid og ansvarlig]. Bare berørt skole stenges; andre skoler/delte kontoer bevares. |
| Eksport | [Frist, autorisert mottaker, identitetskontroll og sikker kanal]. Leverandørforslag: inntil 30 dager etter opphør. |
| Aktiv sluttsletting | [Dato senest 30 dager etter opphør, instruksjonsreferanse og ansvarlig Ole Henrik Vik]. Slettebekreftelsen skiller aktive data fra resterende kopier/journal. |
| Appens sikkerhetslogger | [Bekreftet 30-dagersramme, operativ terskel, kjøreplan, toleranse og oppfølging før fristen ved feil]. Daglig audit_days=30 er ikke alene bevis på sletting innen fristen; marginen må dokumenteres. |
| Restreferanser og kopier | [Henvisning til ferdig dokumenterte leverandørfrister ovenfor og skoleeiers instruks]. Feltet kan ikke fylles med et vilkårlig kundetall uten teknisk støtte. |
| Hendelser og rettigheter | [Kundens primærkontakt/PVO/stedfortreder og sikker kanal]. Oversikt: Ole Henrik Vik, olevik91@gmail.com. Vanlig støtte: hverdager, mål om første svar innen to arbeidsdager. Privat hendelsestelefon utleveres separat. Ingen navngitt reserve eller garantert døgnbemanning. |
| Signatur og vedlegg | [Parter/fullmakt/dato/signatur, avtalt versjon/hash av DBA A–D, dette bilaget, personverninformasjon og aktiveringsprotokoll] |

Signering og aktivering er ulike trinn. En betinget avtale må si hvilke oppstartskrav som gjenstår; den åpner ikke skoledata automatisk. Skoleeiers egen mal kan brukes når de konkrete instruksene og begrensningene over bevares.

## Hva skoleeier kan legge til grunn 20. november 2026

**Intern status før skolehenvendelsen.** Oversikt holder e-post og vedlegg tilbake til land og maksimal oppbevaring for gjenværende behandlinger er avklart. Kundens navn, fullmakt og instruks fylles sammen med kommunen senere.

### Vercel Pro

Oversikt AS bruker Vercel Pro. Lesekontrollen av produksjonsteamet 20. november bekreftet Pro, null konfigurerte loggviderekoblinger (Drains) og at Observability Plus er deaktivert. For dette oppsettet er kjøretidsloggene tilgjengelige i ett døgn. Detaljene kan omfatte blant annet sti, søkeparametere, tidspunkt, nettlesertype og forespørsels-ID. Innloggingsreturen bruker skjema-POST. Denne tekniske avgrensningen og vinduet i kontrollpanelet fastsetter ingen frist for Vercels øvrige interne logger eller eventuelle supportkopier. [Vercels kjøretidslogger](https://vercel.com/docs/logs/runtime)

Vercel Inc. er amerikansk avtalepart. Registerkontroll 20. november viste aktiv deltakelse i EU–US Data Privacy Framework, oppføring 6847, med dekning for data utenfor arbeidsforhold (Non-HR), herunder kunders sluttbrukere. For overføringer som omfattes til denne enheten er grunnlaget artikkel 45. Vercels DPA gjelder Pro. Tillegg 3 regulerer standard personvernbestemmelser ved overføringer som trenger dem, med modul 3 når Oversikt opptrer som databehandler og Vercel som underdatabehandler. Tjenestegenererte personopplysninger under Vercels eget ansvar må vurderes særskilt. [DPF-registeret](https://www.dataprivacyframework.gov/participant/6847) · [Vercels databehandlervilkår](https://vercel.com/legal/dpa) · [Datatilsynet om overføringer til USA](https://www.datatilsynet.no/aktuelt/aktuelle-nyheter-2025/informasjon-om-overforinger-til-usa/)

Stockholm er skolefunksjonens konfigurerte region og den observerte regionen for Feide-returmottaket. Vercels DPA punkt 13 oppgir USA som hovedplassering for plattformens behandling og åpner for behandling også i andre land. Tillegg 2 beskriver global replikering av Vercels kopier av kundedata og godkjent tilgang etter arbeidsoppgave. Full landliste, omfang og maksimal levetid for skolens eventuelle data i plattforminterne logger, støtteverktøy og slike kopier er ubekreftet. App- og journaldatabasene driftes av Supabase. [Vercels databehandlervilkår](https://vercel.com/legal/dpa)

### Supabase Pro

De to produksjonsprosjektene ligger i Stockholm (eu-north-1). Supabase oppgir at database og ordinære databasekopier ligger i valgt region. Pro har daglig kopiering med sju dagers historikk. Begge prosjektoversiktene viste fullførte fysiske kopier fra 13. til 20. november, med punktgjenoppretting deaktivert. Leverandørens 30-dagersfrist gjelder ved sletting av hele prosjektet. Når bare én skole slutter, fortsetter begge prosjektene. Lengste tid skolens rader kan bestå i en restkopi etter aktiv sletting er ubekreftet. [Supabases dokumentasjon om datalagring](https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq) · [Databasebackuper](https://supabase.com/docs/guides/platform/backups)

Supabase oppgir EU-datasentre for inntak og lagring av driftslogger og sju dagers logghistorikk på Pro. Leverandøren oppgir global, behovsbegrenset og loggført tilgang for support og sikkerhetshendelser. Supabase Pte. Ltd. i Singapore er vår avtalepart. Supabase, Inc. i USA kan bistå ved support og drift. Leverandøren viser til standard personvernbestemmelser for overføringer til disse landene. En uttømmende liste over tilgangsland, medlemsstater for logglagring og maksimal oppbevaring av supportutdrag og interne restkopier foreligger ikke i dette underlaget. [Datalagring og tilgang](https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq) · [Pro-vilkår for logghistorikk](https://supabase.com/pricing) · [Supabases DPA](https://supabase.com/legal/customer-resources/data-processing-addendum)

### Sikkerhetsjournal, støtte og avvikling

Oversikt har ansvar for journalen i det separate Stockholm-prosjektet. Der lagres referanser som hindrer at en eldre kopi gjenåpner slettede data eller tilganger. Et datert bevis for utløp av siste gjenopprettbare kopi, inkludert eventuelle operatørkopier, må danne grunnlag for journalens maksimalfrist og en kontrollert sletterutine. Nåværende dokumentasjon gir ingen slik sluttdato. Forslaget om 30 dager til eksport og sletting av aktive skoledata gjelder en annen behandling.

Feide og skolens identitetsleverandør håndterer innlogging. Overvåking gjennom Healthchecks.io gjelder tekniske signaler og operatørkontakt. Ingen elevdata skal følge signalet. Pinghistorikken er antallsstyrt, og egne databasebackuper for monitoren kan bestå i inntil to måneder. [Healthchecks’ personvernvilkår](https://healthchecks.io/privacy/)

### Hva som holder igjen utsendingen

Oversikt innhenter land og frister fra Vercel for plattformlogger, support og kopier av de data som faktisk inngår i skoletrafikken. Fra Supabase trengs konkrete land for driftslogger og fjerninnsyn samt maksimal restlevetid etter sletting av én skoles rader i et fortsatt aktivt prosjekt. Oversikt avstemmer egne kopier og dokumenterer håndhevbar maksimalfrist for journalreferansene. Oversikt ferdigstiller denne dokumentasjonen før første e-post til en skole om piloten.
