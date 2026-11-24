# Dokumentpakken ved salg og skoleoppstart

Gjennomgått 12. november 2026. For Ole Henrik Vik og kundens avtalepart ved første betalte skoleleveranse. Ingen ny pilotskole er påkrevd. Dette er inngangen til eksisterende avtaledokumenter; operative mangler følges i Beads zq9b/twkq/ya9r.11/rbec.4. Utkastene er ikke signert eller publisert.

## Hva som finnes, og hva som må fylles

| Dokument | Dekning | Må bekreftes før det brukes |
| --- | --- | --- |
| [Skoleavtale](skoleavtale.md) | Parter, omfang, førsteårspris, periode, oppstart, støtte, fornyelse og opphør | Kundens avtalepart/fullmakt, avgift/totalpris, datoer, faktura/EHF, betalingsvilkår, faktisk eskalering ved fravær og gjennomgang av foreslåtte misligholds-/bortfallsvilkår. |
| [Databehandleravtale](databehandleravtale.md) | Instruks, fortrolighet, sikkerhet, underdatabehandlere/overføring, bistand, hendelser/revisjon og retur/sletting. Bilag A–D finnes. | Kundens behandlingsansvarlige, grunnlag, konkrete frister, faktisk godkjente leverandør-/driftsvilkår og signaturer. |
| [Behandlingsoversikt](behandlingsoversikt-og-dba.md) og DBA A | Navn/Feide-ID, medlemskap, oppgaver, minimerte læringsutfall og sikkerhetsdata | Bekreft det avtalte produktomfanget. Ikke beskriv data som anonyme eller stemmeopptak som lagret skytjeneste. |
| DBA B, [risiko/personvern](risiko-og-personvern.md), [drift](drift-og-beredskap.md) og [logging](logging-og-overvaking.md) | Tiltak, leverandørroller, kjente begrensninger og tekniske kontroller | Konto-/avtaleversjonene, underleverandørkjede, behandlingsland for drift/support/logger/kopier og aktuelle overføringsvurderinger. Stockholm alene dokumenterer ikke EØS-only. |
| DBA C og [policy-/kontaktark](pilotskole/pilotpolicy-og-kontakter.md) | Forslag til retensjon, eksport, sletting og backup/journal | Skoleeiers instruks, faktisk støttede frister og prøvd automatisering. Gamle testfrister er ikke kundevedtak. |
| DBA D og [operative rutiner](operativ-kontrollrutiner.md) | Ansvar, kontakt, hendelser og signering | Ole Henrik Vik er bekreftet ansvarlig/signaturkontakt. Støtte hverdager/første svar innen to arbeidsdager og privat hendelsestelefon hele døgnet er bekreftet. Ingen navngitt reserve eller garantert døgnbemannet respons er oppgitt. |
| [Personverninformasjon](personverninformasjon.md) | Forståelig informasjon for elever og skole | Skoleeier, PVO, grunnlag, frister, obligatorisk/frivillig bruk og alternativ. Skolen bestemmer informasjonskanal og tidspunkt. |
| [DPIA-underlag](pilotskole/dpia-underlag.md) og [tilgjengelighet](tilgjengelighet.md) | Teknisk bistand, risikoer og begrensninger | Skoleeiers vurdering/vedtak og nødvendig oppdatert tilgjengelighetsvurdering. Underlag er ikke godkjenning. |
| [Skoleaktivering](skoleaktivering.md) | Feide-organisasjon, myndighet, første administrator, tekniske porter og åpning/stans | Faktisk godkjenning, riktig produksjonsmiljø og testbevis. Ingen testkonto skal få tilgang til ekte skoledata. |

## Leverandørkjeden

Supabase og Vercel er valgte leverandører. Offentlige DPAer er kontrollert 9. november: [Supabase DPA v1, 1. august 2026](https://supabase.com/legal/customer-resources/data-processing-addendum) og [Vercel DPA, oppdatert 17. mars 2026 / effektiv 31. mars](https://vercel.com/legal/dpa). De offentlige DPA-ene, Supabases liste12.10 og avskrift av28rader fra Vercels rendrerte liste er nå [arkivert med dato og SHA256](leverandorvedlegg/README.md). Supabase-organisasjonen er bekreftet som Oversikt AS/Pro. Dokumenter fortsatt at avtaleversjonene gjelder den konkrete kontoen, og ferdigstill faktisk produktbruk, land, support/logger og overføringsvurdering; arkivert offentlig tekst er ikke bevis på kontoaksept.

Feide/Sikts rolle følger skoleeiers føderasjonsavtale og skal ikke automatisk føres som Oversikts underdatabehandler. Healthchecks er brukt som teknisk monitor for global stagingjobb. Leverandøren oppgir eget behandlingsansvar for konto-/driftskontakt og signerer ikke DBA med kunder for denne bruken. Den eksisterende signaleringen skal fortsatt utelukke skole-/elevdata. Faktisk produksjonsbruk, kontakt/vilkår og signalinnhold dokumenteres; ikke opprett et salgsstoppunkt for en Healthchecks-DBA som ikke tilbys. Se [rolle og oppbevaringsgrenser](leverandorvedlegg/README.md).

## Ett utfyllingsgrunnlag for leverandør og kunde

[Leverandør- og fristbilaget](leverandor-og-fristbilag.md) følger DBA B–D. Det skiller faktiske tekniske bevis, leverandørfelter som Oversikt må ferdigstille og kundens instrukser/part/signatur. Åpne leverandørfelter er ikke kundens ansvar å gjette. Daglige synlige backups er ikke en maksimal kopi-/journalfrist. Appens 30-dagersramme må omsettes til en kjøreplan med sikkerhetsmargin og oppfølging; en daglig jobb med audit_days=30 beviser ikke fristen.

Dagens kildeversjoner for Supabase/Vercel DPA og Healthchecks rolle/frister er kontrollert 12. november; de daterte kildearkivene fra 9. november bevares uendret. Den faktiske skolekjeden er eksternt prøvd 12. november. Global stagingdrift er aktiv og skoleworkerens installasjon/stopp lokalt prøvd; kundepolicy og ny skoleworker er ikke aktivert. Eieren har bekreftet at kontoens gjenopprettingskoder er opprettet og lagret sikkert. Organisasjonens kvotevarsel er ført som egen før-oppstartskontroll. Ingen reserve, EØS-only, eksakt kopiutløp eller produksjonsgodkjenning er oppdiktet.

## Fra bestilling til aktivering

Kundens bestiller og leverandøren ferdigstiller skoleavtale/pris. Skoleeier og Oversikt avklarer DBA, bilag og godkjenning. Kundespesifikke felter får bekreftede verdier, ingen elevlister samles for å selge. Leverandøren bekrefter de tekniske forutsetningene før elevdata åpnes. Ved signering beholdes én datert versjon av alle avtalte vedlegg og en referanse til faktisk godkjent leveranse.

Pakken har dermed de sentrale dokumenttypene, men er **ikke signeringsklar** før konto-/leverandørvilkår, dokumenterbare kopi-/journalfrister og kundespesifikke beslutninger er ferdige. Avtalen kan knytte oppstart til dokumenterte tekniske forutsetninger; signering og faktisk aktivering er ulike trinn. Retensjons- og kontaktforslaget er nå eierbekreftet; fravær av reserve beskrives som faktisk begrensning. Ingen dokumentgjennomgang erstatter faktisk drift eller eksternt restorebevis.

## Kildegrunnlag for innholdskontrollen

DBAens hovedtemaer er avstemt mot [EDPBs veiledning om behandlingsansvarlig/databehandler](https://www.edpb.europa.eu/sme/learn-the-basics/data-controller-or-data-processor_nb) og eksisterende artikkel-28-struktur i DBA. Den tidligere Datatilsynet-lenken lot seg ikke hente ved denne kontrollen; den føres ikke som ferskt lest. Gjennomgangen er en innholds-/samsvarskontroll av dokumentpakken, ikke en påstand om at kundens juridiske eller sikkerhetsmessige godkjenning er gitt.

## Leverandørens registreringsstatus

Offisiell registerkontroll9.november viste Oversikt AS930687758,ikke mva-registrert. Skoleavtalens prisforslag er derfor rettet til en foreslått samlet pris uten oppgitt mva-beløp. Omfanget er inntil seks klasser. 4995 kroner/år er det konkrete tilbudsforslaget til siste eiergjennomgang; konto-/fakturastatus kontrolleres på nytt før bindende tilbud/faktura. Dette avklarer ikke tjenestens fremtidige avgiftsplikt.
