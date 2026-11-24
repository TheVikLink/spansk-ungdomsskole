# Forretningsregler og tekniske grenser

Dette beskriver gjeldende lokale skolemodusregler og grenser som kommunen kan gjennomgå. Det er teknisk dokumentasjon, ikke en kommunal policy eller produksjonskapasitetsgaranti. Verdier må vurderes på nytt ved pilot og før produksjonssetting.

## Sammenheng og tilgang

- En skole tilhører nøyaktig én eksplisitt skoleeier. En skole med uverifisert/blokkert eier er sperret. Feide-organisasjons-ID er ikke juridisk bevis på skoleeier.
- Klasse og klassemedlemskap er bundet til samme skole; sammensatte fremmednøkler og PostgreSQL RLS håndhever skolekonteksten. Aktiv klasselærer må ha aktiv grant på den aktuelle klassen.
- Klasseinvitasjon kan bare brukes av innlogget Feide-identitet med allerede godkjent medlemskap i samme skole. Engangskoden gir en ventende forespørsel, ikke tilgang. Lærer godkjenner forespørselen.
- Lekse, mottaker og resultat må tilhøre samme skole. Publisering tar et snapshot av klassens aktive elever. Elever som kommer inn senere får ikke automatisk den publiserte leksen; lærer må publisere en ny tildeling. Fjernet elev mister tilgang til lekse og resultater.
- Elev ser egne tildelinger/resultater; lærer ser bare egne aktive klasser. Skoleadministrator får ikke automatisk tilgang til faglige resultater.

## Feltbasert lesing og skriving

API-responser er rolle- og ressursbaserte projeksjoner. Klienten får aldri tabellrader direkte fra PostgreSQL; sensitive felter som identitetsbinding, invitasjonshash, sesjonstoken, CSRF-hash, logout-token, skoleeierjournal og audit-detaljer er ikke elev-/lærerfelter.

| Ressurs/felt | Elev | Lærer/medlærer | Skoleadministrator | Skriverett og tilstandskrav |
|---|---|---|---|---|
| Egen profil (`id`, visningsnavn) | Egen konto | Egen konto | Egen konto | `id` og identitet kommer fra innlogget serverøkt; klienten kan ikke velge bruker-ID. Visningsnavn følger Feide/UserInfo. |
| Skole-/klassemedlemskap (`rolle`, `status`, visningsnavn) | Egen aktive skole-/klassetilknytning | Medlemmer i egen skole/egne aktive klasser der arbeidsflyten krever det | Aktive skolemedlemmer og skoleinvitasjoner; ikke faglige resultater | Endring krever godkjent invitasjon og lærer-/skoleadminrolle. Fjerning/sperring er journalført; ventende medlem får ikke klasse-/leksetilgang. |
| Klasse (`navn`, `skoleår`) | Kun tilknyttet klasse via leksevisning | Egne aktive klasser | Ingen generell faglig klasseoversikt | Opprett/rediger via aktiv lærergrant; skoleeier/skole-ID kommer fra økten og kan ikke sendes inn av klienten. |
| Lekse (`tittel`, `område`, `frist`, `antall`, innholdssnapshot) | Publisert lekse tildelt eleven; oppgaveprompt, alternativer og lyd, ikke fasit/forklaring | Opprett/publiser/lukk for egen klasse; se egen klasses innhold og status | Ingen elevsvar eller faglige rapporter | Bare lærer med aktiv klassegrant kan endre/publisere. Elev kan ikke endre innhold, mottakere, status eller fasit. Publisert snapshot er uforanderlig. |
| Læringsutfall (`område`, spørsmålreferanse, utfall, forsøk, hint, tid) | Egne tildelte lekser/egne dataeksporter | Oppsummerte forsøk og siste utfall for egne aktive klasseelever/lekser | Ikke tilgjengelig | Opprettes bare av serverrettet svar på gyldig, publisert snapshot for aktiv mottaker. Rå fritekstsvar og lyd lagres ikke. |
| Eksport og audit | Egen profil og egne utfall | Klasseoversikt for aktiv egen klasse; eksport auditeres | Skolemedlemskapshandling auditeres; ingen faglig resultat-eksport | Eksport er en eksplisitt CSRF-beskyttet handling; klasseeksport revaliderer fortsatt aktiv elevgrant før svar. Auditdata er ikke synlig i ordinært API. |

Dette er gjeldende feltmodell for lokale API-er, ikke en vurdering av fullstendig BOPLA-dekning. Endring i responsfelter, rolle, status eller innholdstilstand krever ny gjennomgang og API-regresjon.

## Inndata og publisering

- Klasserom: klassenavn trimmes til 1–100 tegn. Skoleår må være fire sifre eller formatet `YYYY-YYYY`.
- Invitasjonskode: genereres med 24 kryptografisk tilfeldige byte, lagres som hash, kan brukes én gang og utløper etter sju dager. Ventende medlemskap må godkjennes av aktiv klasselærer.
- Lekse: tittel trimmes til 1–120 tegn. Aktivitet må finnes i den publiserte katalogen; oppgaveantall må være minst 1, høyst 50 og ikke større enn antall oppgaver i aktiviteten. Tom klasse kan ikke få publisert lekse.
- Frist er valgfri; hvis satt, må den være i framtiden og innen 91 dager fra publisering. API-et håndhever dette, ikke bare klienten.
- Lekseinnhold, utvalgte spørsmål, fasit og lydreferanse fryses som versjonert snapshot ved publisering. Resultater rettes mot dette snapshotet. Ugyldig hash eller snapshot stenger visning og innsending.
- Innsending inneholder engangshendelse-ID, økt-ID, spørsmål-ID og svaralternativ-ID; rå fritekstsvar og lyd sendes/lagres ikke. Dublett av samme hendelse er idempotent. Bare mottaker med aktiv tilgang kan svare.
- Publisering, mottakersnapshot og audit-hendelse lagres i samme databasetransaksjon; feil ruller hele operasjonen tilbake.

## Forespørselsvern og operative grenser

- JSON-body er maksimalt 16 KiB; urlencoded body maksimalt 2 KiB. Ugyldig JSON gir generisk 400 og oversize JSON gir generisk 413. Klienten får ikke parsingsdetaljer eller body tilbake.
- Lokal server begrenser alle forespørsler til 300 per IP per minutt, innlogging til 60 per IP/rutemønster per minutt og hver mutasjonsrute til 50 per IP/rutemønster per minutt. Innloggingsgrensen gir rom for at en klasse bak samme NAT kan starte Feide-innlogging uten at applikasjonen blokkerer etter et lite antall elever. Bucket-tabellene har konfigurerbar fast maksimumsstørrelse (standard 5000) og avviser nye buckets fail-closed når minnegrensen er nådd.
- Begrensningene er per Node-prosess. De gir ingen felles kvote mellom replikater, identifiserer ikke nødvendigvis én bruker bak delt IP og er ingen tjenestegaranti. Produksjon må supplere med verifisert proxy-/gatewaybegrensning, distribuerte kvoter/overvåking og kapasitetstest. `trust proxy` må samsvare nøyaktig med valgt nettverksarkitektur.
- Det finnes ikke skole-/eierbaserte volumkvoter eller kostnadsbaserte eksterne funksjoner i prototypen. Dette er en bevisst uavklart produksjonsbeslutning; ingen global tilgjengelighet eller bestemt kapasitet loves.

## Ressurskrevende funksjoner og tilgjengelighet

- OIDC-innlogging og UserInfo gjør eksterne HTTPS-kall til fast Feide issuer; login/callback er begrenset til 60/IP/rutemønster/minutt og HTTP-request har 30 sekunders Node-grense.
- Publisering lager innholdssnapshot og mottakerliste i én transaksjon. Leksetittel er 1–120 tegn, innholdsspørsmål maks 50, body maks 16 KiB; JSON-import i no-login-appen er maks 5 MiB.
- Klassefremgang og eksport aggregerer oppgaver/resultater synkront fra PostgreSQL. Poolene har grense 10 applikasjons- og 4 journalforbindelser per prosess, 5 sekunders connection timeout; rapport-/eksportjobber har ingen egen asynkron kø eller query statement-timeout ennå.
- Restore/replay og retensjon er vedlikeholdskommandoer som skal kjøres separat, ikke fra elevforespørsler. Lokal API rate limit og Node-requestgrense reduserer enkelte toppbelastninger, men det finnes ingen klasse-/brukerkvote, kapasitetstest eller dokumentert maksimal skole-/klassevolum.

Før produksjon må leverandør teste samtidige innlogginger fra skole-NAT, store aktive klasser, rapport/eksport, retention/restore, connection-pool metning, request- og DB-timeout, og gateway-beskyttelse. Tallene over er lokale grenser, ikke kapasitet eller SLA.

## Verifikasjon

Reglene håndheves i `server/app.js`, `server/rate-limit.js` og PostgreSQL-migreringene. Syntetiske HTTP-/OIDC- og databasescenarier finnes i `tests/server/`, inklusive `rate-limit.test.mjs`, `school-flow.e2e.test.mjs` og tenant-/journaltestene. Verifiser med `npm run test:school`; kjør også `npm run test:school:postgres` for faktisk lokal PostgreSQL, RLS og backup/restore. Disse testene bruker syntetiske data og beviser ikke produksjonsproxy, kommunal kapasitet eller valgt driftsplattform.
