# Risiko- og personvernunderlag – utkast

Skoleeier bestemmer behandlingsgrunnlag, nødvendighet, informasjon til elev/foresatte og om DPIA er nødvendig. Dette dokumentet er teknisk risikoinput, ikke en gjennomført DPIA eller godkjenning.

| Risiko | Tiltak i kode/test | Restrisiko/videre tiltak |
|---|---|---|
| Elev ser en annen elevs data | Serverroller, class membership, mottaker-snapshot, tenant/RLS-tester og `npm run test:school:postgres` | Native PostgreSQL-runtime-role/RLS-smoke er testet; full fler-eier/mange-klasse API-matrise og faktisk driftskonfigurasjon mangler |
| Konto bindes til feil person/skole ved Feide-ID-gjenbruk | `iss`+`sub` adskilt fra intern UUID; ukjente kontoer får ikke automatisk lærerrolle | Feides identifikatorlivsløp må verifiseres med Sikt/skoleeier før elevdata |
| Konto-/økttoken stjeles eller CSRF | Opaque serverøkt, HttpOnly, secure prod-cookie, CSRF/Origin, rate limiting | TLS, nøkkellagring/rotasjon, reell nettleser logout/BFCache-test gjenstår |
| Restore gjenåpner fjernet medlemskap eller brukt engangskode | Separat append-only journal; restore anvender skole-/klassegrant-tilbakekallinger, kontosletting og retensjonssletting før åpning og ugyldiggjør gjenopprettede økter | Syntetisk journal-/snapshot-test er bestått; faktisk databasebackup/restore, operativ vedlikeholdsmodus og aktiv lærer med tilbakekalt klasseansvar må fortsatt testes |
| For mye elevdata lagres | Utfall lagrer ikke rå elevsvar; scopes uten e-post/fødselsnummer; lokal retensjonskommando krever separat journal ved sletting; konto kan slettes på tvers av skoler | Skoleeier må vedta policy og datofrister; driftsleverandør må sette opp og overvåke scheduler; eksport/sletting av hostinglogger må avklares. Internt UUID beholdes som tombstone på grunn av historiske fremmednøkler |
| Innhold/resultat tolkes som karakter | Visning omtaler områdeøving/utfall | Må formidle formative begrensninger til lærer/elev i ferdig UI |
| Lærer mister klasseansvar men beholder data | Klasselærer kan fjerne medlærer; skoleadministrator kan fjerne skoletilgang og alle tilhørende klassetilganger; tilgang sjekkes mot separat journal, også etter restore | Faktisk PostgreSQL-restore og full matrise av lærer-/skolebytte må testes |
| Tredjepart får elevdata | Ingen analyse-/sporingsintegrasjon tilsiktet i kontodelen | Nettverksutgangstest, DNS/loggleverandør og faktisk hosting må gjennomgås |

Før bruk av reelle personopplysninger: skoleeier dokumenterer behandlingsgrunnlag, gjennomfører nødvendighets-/proporsjonalitetsvurdering og avgjør DPIA, avtalepart, elevinformasjon og lagring. Ingen elevdata brukes i denne utviklingen.
