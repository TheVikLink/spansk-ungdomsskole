# Behandlingsoversikt og DBA-underlag – teknisk vedlegg

Oppdatert 8. oktober 2026: konkret avtaleutkast med bilag finnes i [databehandleravtale.md](databehandleravtale.md), elev-/lærertekst i [personverninformasjon.md](personverninformasjon.md) og gjennomføringsprotokoll i [skoleaktivering.md](skoleaktivering.md). Ingen av dem er signert/publisert eller skoleeiergodkjent. Eldre forslag til frister nedenfor er ikke vedtatte eller automatisk gjennomførte frister.

**Roller må bekreftes:** skolen/skoleeier forventes å være behandlingsansvarlig for elevers lekse- og framgangsdata; leverandøren forventes å være databehandler. Dette er en arbeidsantakelse, ikke juridisk konklusjon eller signert avtale.

Foreløpige tekniske beskyttelsesnivåer (må mappes til skoleeierens klassifiseringspolicy): **Begrenset** for autentiseringshemmeligheter/tokens og sikkerhetsjournal; **Konfidensielt** for identitet, medlemskap, elev-/klasseoversikt og læringsutfall; **Internt** for ikke-personlige leksemetadata; **Offentlig produktinnhold** for ferdige oppgaver og lyd. Disse etikettene er ikke en formell personvern- eller informasjonssikkerhetsklassifisering.

| Kategori | Data | Foreløpig nivå | Formål | Tilgang | Oppbevaring |
|---|---|---|---|---|
| Identitet | Feide `iss`/`sub`, navn, intern UUID, status | Konfidensielt | Innlogging og riktig elev-/læreridentitet | Kontoens person, lærer for aktive egne klasser; appen har systemtilgang | Aktivt forhold; endelig regel uavklart |
| Organisering | Skoleeierens eksterne referanse, skole, klasse, skoleår, medlemskap/rolle | Konfidensielt | Avgrense skoleeierskap, lekser og tilgang | Skoleeierrelasjonen er operativt avgrenset; skolens adminfunksjon administrerer bare egen skole | Skoleår + avtalt avslutning; eierreferansens livsløp må fastsettes |
| Lekser | Tittel, område, innholdsreferanse og SHA-256-basert innholdsversjon, snapshot av valgte oppgaver/spørsmål og hash-versjonert lydreferanse, frist, mottaker-snapshot | Internt metadata; mottaker-snapshot konfidensielt | Tildele og vise samme tekst/lyd som ble publisert, også etter katalogoppdatering | Medlemmer i aktuell klasse; korrektalternativer ligger bare på serveren og sendes ikke i elevvisningen. Lydfilen er et statisk produktasset uten elevdata | Forslag: skoleår + 90 dager; gammel oppgave uten verifiserbart snapshot må publiseres på nytt |
| Læringsutfall | Oppgave-ID, område, versjon, forsøk, korrekt/feil/fullført, hinttall, økt-ID, tidspunkt | Konfidensielt | Vise gjennomføring og områdeframgang | Eleven selv; lærere med aktivt klasseansvar | Forslag: skoleår + 90 dager |
| Økt-/sikkerhetsdata | Hash av opaque token, CSRF-hash, rolle, skole, utløp, kryptert ID-token ved kortvarig økt | Begrenset | Autentisering, CSRF, Feide RP-logout | Serverens databasekonto; læringsresultater eksponeres ikke | Øktgrense 8 timer i kode; sletting ved logout/utløp må automatiseres |
| Sikkerhetsjournal | Tilgangsgenerasjon for skole, tilbakekalt grant-ID, kategori og sekvens | Begrenset | Hindrer at restore gjeninnfører medlemskap, skoleeiertilgang eller slettet data | Driftssikkerhetskomponent | Langvarig minimalt; konkret sletting/ansvar uavklart |

Skoleflyten sender valgt svaralternativ (`answerId`) til serveren for kortvarig retting. Råsvaret inngår ikke i den lagrede læringshendelsen. Modellen innhenter ikke fri elevtekst, lydopptak, fødselsnummer eller elev-e-post og bruker ikke egen bruksanalyse. Lokal tilbakemeldingsfritekst i fri øving er en separat, manuelt eksportert funksjon. Hosting/DNS/IP-logger og underleverandører kan behandle ytterligere personopplysninger; konkrete felt og frister må avklares.

## Beskyttelseskrav til nivåene

- **Begrenset:** bare autoriserte server-/driftsroller; aldri nettleserlagring eller logger; TLS under overføring; kryptering ved lagring for token som må beholdes; kortest mulig levetid og journalført tilbakekalling. HSM/vault, DB-diskkryptering og driftsnøkkeltilgang må bekreftes.
- **Konfidensielt:** formålsbegrenset tilgang etter skole/klasse/elev; same-origin TLS; `no-store` for API/auth og ingen analytics/trackere; eksplisitt eksport/sletting og minste retensjon. Skoleeier må vedta retention og eventuell database-/backupkryptering hos leverandør.
- **Internt:** tilgjengelig for aktive medlemmer etter ressursrolle; ikke bruk det til å gi tilgang på tvers av skole; hold service logs fri for personopplysninger.
- **Offentlig produktinnhold:** kan leveres som statiske ressurser; publisering gir ikke rett til å endre eller laste opp elevdata.

Lokale HTTP/API-headere, tilgangsregler og retention-jobber dekker deler av disse kravene. Kryptering på database-/backup-volum, hostinglogger, scheduler og operatørtilgang kan ikke bekreftes før drift er valgt.

## DBA-/bilagsarbeid som må gjøres

Bruk gjeldende Feide-/DFØ-mal når partene er kjent. Fyll vedlegg for instruks/formål, datatyper/registrerte, tekniske tiltak, underdatabehandlere og land, bistand til rettigheter/hendelser/DPIA, revisjon, sletting/retur, backup/restore, avvikling og kontaktpunkter. Fastsett korteste nødvendige retensjon. Innholdet her er teknisk faktaunderlag; det er ikke en ferdig DBA og må gjennomgås av partene.
