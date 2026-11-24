# Aktivering av første kundeskole

Versjon 16. november 2026. **Klargjort protokoll, ingen reell skole er aktivert.** Oppfølging føres i Beads zq9b/rbec.4/brq/ya9r/twkq. Dokumentpakken begynner i [pilotunderlaget](pilotskole/README.md).

## Dagens bevis og begrensninger

Feide-tjeneste 2198569 og klient 3102 gjelder staging. App.spansk123.no peker på dpl_9bN6ms4U6pN9rQ13VYFr4J3U4CEw, appbygg fcdf97b55d8da417, i arn1. App 001–012, journal 001–006 og 23 kildebindinger er eksternt kontrollert. Bare appaliaset har eierbestilt unntak fra Vercel-innlogging; kanonisk Preview beholder beskyttelsen. Skoledata krever Feide og godkjent medlemskap/rolle. Lærere og administratorer må ha påkrevd sterkt innloggingsnivå; dette er ikke et generelt MFA-krav for elever. Ingen reell skole er aktivert.

Den [ordinære eksterne prøven 12. november](../../output/external-staging-control-2026-11-12/ordinary-feide-school-flow.json) bestod uten cookieinngrep: ny privat Safari-MFA-lærer, fire nye lekser, separat elevinnlogging, feil→retting og lagringskvitteringer, komplett lyd, reload, lærerfremgang i alle fire områder og begge app-/Feideutlogginger. Eksisterende syntetisk klasse/roller ble brukt; dagens prøve opprettet ikke nye medlemskap. Oktoberbeviset for invitasjoner, skoleeksport og skolevis sletting beholdes som historikk i [samlet status](pilotskole/pilotstatus.md).

[Fersk driftskontroll og klargjøring](../../output/operations-readiness-2026-11-12/README.md) bekrefter aktiv globaljobb, monitor og lokalt prøvd installasjon/stopp for den nye skoleworkeren. Ny skoleworker, kundepolicy, faktisk hosted restore/patch og produksjonsgodkjenning er fortsatt separate krav. Teknisk stagingbevis er ikke kundens godkjenning, full sikkerhetssertifisering eller gjennomført DPIA.

Stagingprøven 16. november bekreftet journalcommit før appcommit, planlagt kjøring og mottatt DOWN-varsel. Før kundestart fylles instruks, retensjonsfrister, sikker eksportkanal og beredskapsdekning inn sammen med skoleeier. Verifiser faktisk planlagt kjøring, alarmer og restkø på det valgte produksjonsmålet med syntetiske data før elevtilgang. [Driftsforslag og beslutninger](drift-og-beredskap.md#klargjøring-for-første-kundeskole--16-november-2026).

Bruk [bekreftelsesskjemaet for skoleeier](skoleeier-bekreftelse.md) til å samle driftsinstruksen som føres inn i DBA C/D og denne protokollen.

## 1. Første kontakt og identitetskontroll

Be bare om juridisk skoleeier, navngitt skole, avtaleomfang, avtaleansvarlig, Feide-administrator og personvernombud. Ikke be om elevlister, fødselsnummer, Feide-passord eller personlige identifikatorer på e-post.

| Felt | Opplysninger og bevis |
|---|---|
| Skoleeier | [juridisk navn, org.nr., adresse; kontrollert kilde] |
| Skole og Feide-organisasjon | [navn/enhetsnr./organisasjon; bekreftet av eier] |
| Avtaleansvarlig og fullmakt | [navn/rolle; uavhengig bekreftelse] |
| Feide-administrator | [bekreftet funksjonskontakt] |
| Instruksjons-/hendelseskontakt og reserve | [samsvar med DBA D] |
| Personvernombud | [bekreftet kontakt og råd til DPIA] |
| Avtaleperiode og omfang | [start/slutt, elevantall, klasser, ansvarlig spansklærer] |
| Første appadministrator | [godkjent person; identitetsreferanse i lukket operatørregister] |

Bekreft myndighet via en etablert skoleeierkontakt. En lærer, e-postadresse eller vellykket Feide-innlogging beviser ikke fullmakt til å inngå avtale eller gi administratorrolle.

## 2. Porter før elevdata

| Port | Hva skal faktisk foreligge | Ansvar og protokollfelt |
|---|---|---|
| Avtale | Signert hovedavtale og DBA A–D, konkrete parter, omfang, data, kontakter og frister. Frosne vedlegg med dato/hash. | Begge parter: [ref./dato/godkjenner] |
| Grunnlag og DPIA | Skoleeiers grunnlag med supplerende lovgrunnlag, nødvendighetsvurdering og DPIA som dekker denne læreroversikten. Eksisterende DPIA må ha konkret dokumentert dekning/oppdatering. Personvernombudets råd og restrisiko behandles; ved vedvarende høy risiko nødvendig forhåndsdrøftelse før start. | Skoleeier: [vedtak/ref./dato]. En generell «DPIA ikke nødvendig»-avkrysning er ikke oppstartsgrunnlag for denne flyten. |
| Leverandører og overføring | Faktiske avtaler, fulle underleverandører/land, support, logger, backup, datafelt/sekundærbruk og overføringsvurdering. Stockholm er ikke EØS-only-bevis. | Oversikt leverer; skoleeier godkjenner: [bilag/ref.] |
| Informasjon | Utfylt og offentlig stabil personvernadresse, kontakter, frister, rettigheter og skolealternativ. Skolen har informert elever/foresatte/ansatte før innlogging. | Skoleeier/Oversikt: [URL/dato/kanal] |
| Retensjon og rettigheter | Prøvd ekstern jobb/alarm og sletting av åpne/lukkede/fristløse lekser, invitasjoner, restreferanser/journal/kopier. Full skolevis innsyn/eksport, sikker leveringskanal og avslutning uten skade på andre skoler. | Oversikt: [policy/test/ansvar]. Skoleeksport og skolevis sletting er prøvd; resterende kategorier, vedtatt policy og sikker leveringskanal må fortsatt dekkes. |
| Restore og hendelser | Faktisk isolert leverandørbackup-restore med journal-replay før åpning; RPO/RTO målt. Bekreftet ansvar og faktisk dekning ved fravær, varsling og prøvd stans; ikke lov en reserve eller døgnbemanning som ikke finnes. | Oversikt: [øvelse/mål/kontakt] |
| Produksjon | Separat domene/app- og journaldatabase, klientkonfigurasjon/secrets, region/TLS/loggtest, rolle-/tilgangskontroll, patch/overvåking. Offentlige Feide-testkontoer kan ikke få tilgang til ekte data. | Oversikt: [konfigurasjonsbevis/deploy/test]. Ingen main-merge eller promo fra dette dokumentet. |
| Sterk ansattinnlogging | Påkrevd signert lærer- og admin-ACR eller annen dokumentert sterk mekanisme i faktiske driftsmiljøet. Positiv innlogging og nekt ved manglende/lavt nivå, også API. | Oversikt/skoleeier: [nivå/test]. Admin-MFA og sterk lærerinnlogging med positiv/negativ kontroll er prøvd syntetisk. Kravet må bekreftes i skolens faktiske produksjonsmiljø. |
| Vanlig brukerflyt og isolering | Feide-retur uten manuelle cookieinngrep; feil skole/rolle/klasse nektes; utlogging sperrer gammel økt. Ren nettleserprofil, valgt mobil/skoleutstyr, ingen personlige data i offline-cache. | Oversikt/skoleeier: [positive/negative testreferanser] |
| Tilgjengelighet og fag | Dokumentert vurdering/tiltak og relevant erklæring, kjente begrensninger formidlet. Læreren vurderer innhold/lyd og alternativ undervisning. | Begge parter: [vurdering/alternativ]. Mobiltest er ikke WCAG-godkjenning. |

Uutfylte eller ikke beståtte porter betyr **ikke klar for elevdata**. Ikke før signerte løfter som bestått drift. Aktuelle driftsavvik finnes i [drift og beredskap](drift-og-beredskap.md), [logging](logging-og-overvaking.md) og [avklaringsregister](avklaringsregister.md); historiske Feide-feil er ikke dagens funksjonsstatus.

## 3. Avtalt aktivering når portene er godkjent

1. Oversikt kontrollerer godkjent omfang og ny, uttrykkelig leveringsinstruks for produksjon. Arkiver prosjekt-/miljø-/klientreferanser uten hemmeligheter. Gjenbruk ikke stagingtenant eller offentlig testadministrator.
2. Leverandøren gir bare avtalt organisasjon/navngitte skoler adgang til Feide-tjenesten. Skoleeiers egen Feide-administrator aktiverer. Arkiver begge statusene «gitt tilgang» og «aktivert», omfang og dato; de er forskjellige. Kontroller tjenestens øvrige konfigurasjoner og testleverandører før reell aktivering.
3. Opprett eier og blokkert skole gjennom en gjennomgått, avgrenset operatørprosess med verifisert instruks. Aktiver bare angitte skoler. Ingen varig migrator/SET-tilgang, RLS-omgåelse eller direkte runtime-oppretting. Den gjennomførte syntetiske operasjonen er bare et mønster, ikke autorisasjon eller uendret SQL for en virkelig skole.
4. Første administrator logger inn; bind eksakt verifisert issuer/subject via lukket kanal til riktig skole. Skoleeier skal uavhengig bekrefte at nettopp denne personen har administratormyndighet, også hvis kontoen ennå ikke har medlemskap. Feide-identitet/MFA bekrefter identitet og innloggingsnivå, ikke skolemyndighet. Eksisterende bootstrap avviser studentmedlemskap ved målskolen, tilbakekalt identitet/medlemskap og skole med aktiv administrator; en pending-konto uten medlemskap kan opprettes som administrator. Den kontrollerer ikke faktisk elev-/ansattstatus i Feide. Operatørens dokumenterte myndighetskontroll er derfor påkrevd. Journalfør, tilbakekall gammel økt og krev ny sterk innlogging. Arkiver referanser, ikke rå subject/token i offentlig materiale.
5. Administrator inviterer godkjent lærer gjennom personlig engangskode, valgt rolle og verifisert kanal. Lærer logger inn med avtalte sterke nivå, oppretter klasse og godkjenner medlemmer. Elev får egen skoleinvitasjon, deretter klasseinvitasjon og lærerens godkjenning. Ingen seedet medlemskap, delte Feide-kontoer eller lærerinvitasjon til elev.
6. Ansatte prøver de avtalte kontrollene før klassen starter. Første virkelige lekse kjøres bare innen signert omfang og innført informasjon. Kontroller kvittering, reload, lærerresultat, tilgangsnekt, støttekanal og dataminimering. Ikke lagre skjermbilder eller testrapport med identifiserbare elevdata i offentlig repo.
7. Ved feil: stans berørt tilgang med eier-/medlemskapssperring og separat journal; kontroller at gammel økt/backup ikke gjenåpner. Ingen reset/truncate, tilfeldig grantutvidelse eller midlertidig svekking for å få en pilot gjennom. Hendelser følger DBA D.

[Feides aktiveringsveiledning](https://docs.feide.no/service_providers/manage/access_to_services/activation.html), kontrollert 13. oktober 2026, beskriver skoleeiers eget opt-in. Portene for DPIA og sterk ansattinnlogging bygger på [DPIA-listen](https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/vurdering-av-personvernkonsekvenser/nar-ma-man-gjennomfore-en-vurdering-av-personvernkonsekvenser/) og [skoleveiledningen](https://www.datatilsynet.no/personvern-pa-ulike-omrader/skole-barn-unge/krav-til-skoleeier-ved-bruk-av-laringsplattformer/). Det konkrete DPIA-kravet er vurdert ut fra identifiserbar læreroversikt i denne tjenesten.

## 4. Oppstartsbeslutning og avslutning

**Beslutning:** [godkjent/utsatt/avslått]. **Dato:** [ ]. **Skoleeier med fullmakt:** [ ]. **Oversikt:** [ ]. **Godkjent periode/klasser/funksjoner:** [ ]. **Alle portreferanser:** [ ]. **Avtalte tiltak ved kjente begrensninger:** [ansvar/frister]. Dokumentet gir ingen automatisk tillatelse når feltene er tomme.

Ved avtaleslutt sperres skolen etter avtalt instruks, skolevis eksport leveres sikkert, aktive data/restreferanser/kopier avvikles etter DBA C og slettebekreftelse gis. Videreføring krever ny avtale før slutt. Global kontosletting gjelder alle skoler og skal ikke brukes til én skoles opphør. Feide-aktivering avsluttes i samråd med skoleeierens administrator.
