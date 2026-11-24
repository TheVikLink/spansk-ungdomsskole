# Arkitekturavklaring og lærergjennomgang — 21. oktober 2026

Beads 58y7. Eier bestilte avklaring og klargjøring, ikke ekstern utførelse. **Eier har senere valgt metoden og autorisert lokal implementering/test. Lokal metode er nå bestått; ekstern utførelse er ikke godkjent av denne lokale bestillingen.** ya9r/twkq forblir åpne. Ingen ny skyfase, providerunntak, kildeendring, oppgradering eller ressursbestilling følger av dokumentet.

Ny konkret ekstern kjøreplan: [Ekstern restore med journalryddet kopi](2026-10-21_ekstern-restore-med-journalryddet-kopi.md). Den presiserer førkjøpsporter, faktisk mål-admission, samlet budsjett og gjenværende kodearbeid; gjennomføring er ikke startet.

## Anbefaling

Behold Supabase/Vercel og eksisterende applikasjon. Flytt anvendelsen av den ferske, autoritative slette-/tilbakekallingsjournalen til det isolerte lokale restoremiljøet, før en inaktiv, ryddet appkopi bygges for import. Ikke innfør en ny backend eller gi reserverte leverandørroller et generelt unntak. Lærergjennomgangen går parallelt på eksisterende lokal skoleapp med syntetisk OIDC, uten å vente på ekstern restore.

Dette er den enkleste anbefalte veien **som bevarer målet om at data som journalen krever slettet, ikke blir tilgjengelige i skymålet under gjenopprettingen**. Et rent unntak for leverandørroller krever mindre kode, men endrer selve tillitsgrensen. Det anbefales ikke mens tilgangsveiene og håndteringen av de reserverte rollene er uavklart. Flyttingen er nå implementert og bestått med syntetiske data i faktisk lokal PG17.11-kjede; den er ennå ikke eksternt bevist. Se output/preexport-replay-2026-10-21/README.md og Beads m45j.

## Hva vi vet, og hva vi ikke vet

- Ekstern syntetisk Feide-/lekseflyt og skoleeksport/-avvikling er bestått. Sikt-feilen med Basic URL-decoding er behandlet; ikke gjenta den.
- Lokal full dump→bygg→rårestore→inaktivering→prepared-import bestod 20. oktober, run a2e86a2c. Fingeravtrykk for 34 tabeller, fire sekvenser og 62 egne funksjoner, negative byggeprøver og opprydding er dokumentert. Dette er ikke bevis for den nye replay-før-eksport-rekkefølgen.
- Dagens eksterne koordinator gjør lokal restore/inaktivering, så skyimport, så replay mot fersk originaljournal. Å endre rekkefølgen krever en avgrenset kodeendring og nytt bevis for akkurat den nye forbindelsen mellom replay og eksport.
- Det tomme målet hadde supabase_read_only_user og supabase_etl_admin med brede lesestier og uten en støttet kundestyrt stengemetode. Det er ikke i seg selv bevis på offentlig tilgjengelige data. Bare 0 aktive forbindelser beviser heller ikke isolasjon.
- Supportspørsmålet ble sendt 20. oktober kl.09:40:54 Europe/Oslo, SU-508992, melding 1a1584191ab8878c. Den allerede behandlede fysiske restoremetoden møter ikke før-oppstart-kravet.
- Testmålet er slettet. Gamle CLOSED-kvitteringer er uforanderlige. Ingen nye mål/fixture/tilganger er startet her. De tidligere ressursrammene er ikke en tillatelse til å gjenskape målet.

## Alternativene

| Metode | Enkelhet og sikkerhet | Konklusjon |
|---|---|---|
| Fortsette samme skyrestore med alle leverandørroller stengt | Minst endring hvis Supabase faktisk kan tilby kontrollen; ingen støttet metode bekreftet | Behold som mulig alternativ ved konkret supportsvar; ikke vent med produktarbeid |
| Godta leverandørrollene før replay | Minst kode, men krever ny eksplisitt tillitsbeslutning og dokumenterte tilgangsveier; en navnebasert unntaksliste er utilstrekkelig | Ikke anbefalt som snarvei |
| Lokal restore og fersk journalreplay, deretter eksport av inaktiv ryddet appkopi | Gjenbruker eksisterende bygg, lokal PG17 og replay; avgrenset ny sammenkobling og bevis trengs | Valgt og bestått lokalt; ekstern fase separat |
| Bytte leverandør eller drive egen produksjonsdatabase | Ny migrering, drift, avtaler, backup og sikkerhetsansvar | Uforholdsmessig nå |

## Foreslått rekkefølge og beviskrav

Dette er designkrav til en senere gjennomføringspakke, ikke kjørekommandoer.

1. Bruk gjennomgått kilde og et nytt, eksplisitt godkjent forsøk. Bind appbackupen til dens journalcheckpoint, schema, funksjonshasher, TOC og SHA. Journalbackup prøves lokalt som historikkbevis; den får aldri erstatte originaljournalen.
2. Gjenopprett rå appbackup og journalprøve lokalt i PG17 uten nettverk eller publiserte porter, på kryptert midlertidig lagring, med fast frist og uavhengig oppryddingsvakt. Ingen appserver, gamle innlogginger, jobber, utgående hooks eller gamle credentials aktiveres. Bare den avgrensede operatøren får bruke kopien.
3. Hent fersk originaljournal under en dokumentert skrivebarriere. Leverandørforbindelsen ligger i en separat begrenset leseprosess; den lokale restorecontaineren får fortsatt ikke nett. Kontroller komplett hendelsesinnhold og checkpoint/proveniens mot originalen; bare et sekvensnummer eller en gammel journalbackup er utilstrekkelig. Originaljournalen skrives eller tilbakesettes aldri.
4. Replay alle støttede slettinger, sperringer, medlemskaps- og invitasjonstilbakekallinger transaksjonelt mot den lokale appkopien. Ukjent hendelsestype, ufullstendig journal, avvik i checkpoint eller feil gir stopp, ikke hopp over. Kontroller at slettet fixture er borte og at kontrollskole/delte identiteter/urelaterte læringsrader er bevart. Gamle økter/OIDC, autorisasjoner og jobber skal være inaktive. Kontroller faktisk SQL-virkning for hver hendelsestype; en liste over navn er ikke bevis på replay.
5. Eksporter **bare kopien etter replay og inaktivering**. Ny SHA og manifest binder kildebackup, originaljournalens ferske kontrollpunkt og innholdshash, transformasjonens kode og eksportens rad-/struktur-/sekvenskontroller. Den gamle råpakken kan aldri brukes som eksportfallback. Rå appbackup/journalhistorikk og credentials må ikke følge med til skymålet.
6. I en separat senere godkjent skyprøve: forbered et tomt mål med stengt app/runtime, gamle credentials og alle uautoriserte DB-/pooler-/API-veier. Supabase-plattformtilgang til **allerede ryddede data** er fortsatt en eksplisitt tillitsgrense, ikke null tilgang. Providerhooks/replication/logging må klassifiseres og støttet kontroll dokumenteres før import; denne planen beviser ikke at Supabase er uten utgående sideeffekter. Ingen ny ressurs eller import før gjennomførbar opprydding, kostnad og konkret review foreligger.
7. Importer bare manifestbundet ryddet pakke og verifiser målmatch/API-avslag. Hold kildens relevante skrivere og journalbarriere stabile fra siste ferske opptak til målverifikasjon. Før eventuell åpning: kontroller originaljournalen på nytt; endret journal betyr **ingen åpning**. For første avgrensede prøve: avbryt og rydd i stedet for å utvide med en ny parallell delta-replaymekanisme. Kildens gjenåpning må følge eksisterende verifiserte abort-/helserutine.
8. Prøven gjenåpner ikke appbruk mot restoremålet; lever bare eksport-/restore-/replay-/bevaringsbevis og full cleanup. Produksjonsgjenoppretting og databasepatch har separate beslutninger og tidsvinduer. Journal→app-patch kommer først etter bestått ekstern prøve; to timer uten kontrollmargin er ikke automatisk nok.

## Smaleste implementeringsomfang etter metodebeslutning

Gjenbruk eksisterende fullkoordinator/pakkebygger og server/recovery.js fra den isolerte, reviewed kilden; ikke den eldre dirty hovedkopiens recoveryvariant. Flytt replay til lokal app før den endelige eksporten, bind manifestet til journalbevis og legg inn en hard nekt på pre-replay-pakker. Ikke bygg en ny generell backupplattform.

Bevis bare ny delta: reell lokal gammel backup + nyere originaljournalrepresentasjon → replay → ryddet eksport → ny lokal import; slettet objekt forblir borte, kontrollrader bevares. Negative prøver: gammel/ufullstendig/endret journal, ukjent hendelse, feilet replay, mutert pakke, feil checkpoint og journalendring før åpning. Behold eksisterende beståtte tester; ikke gjenta gamle skyprober/fixtures. Ekstern fullprøve og skoleeiers drifts-/personvernaksept gjenstår.

## Konkret beslutning som mangler

Forslag til eierbeslutning: «Jeg velger lokal gjenoppretting med fersk autoritativ journalreplay før eksport av den ryddede, inaktive appkopien. Rå data før replay forblir i det isolerte lokale operatørmiljøet. Supabase forblir databehandler for den ryddede kopien. Dette tillater lokal implementering av metodedeltaen, men ingen nye skyressurser, kildecredentials, ekstern fixture, import eller patch uten en egen konkret gjennomføringspakke.»

Denne beslutningen er **ikke gitt** av bestillingen om arkitekturavklaring. Dagens strenge skyport beholdes i kode. Eksisterende generelle metode-/budsjettgodkjenninger skal ikke etterspørres på nytt; et senere eksternt forsøk må angi faktisk mål, gjenstående ramme, frister og menneskelig sluttsletting. Dersom eier ikke velger endret metode, forblir ekstern restore sperret mens produktgjennomgangen fortsetter.

## Lærergjennomgang nå

[Det konkrete 30-minuttersopplegget](../../../docs/feide/laerergjennomgang-2026-10-21.md) bruker en separat lokal demokopi, lokal syntetisk OIDC og bare syntetiske personer. Ingen ekte Feide-konto kreves. Hensikten er lærerens forståelse og nytte, ikke gjentatt sikkerhetstest eller bevis på læringseffekt. Rekruttering, invitasjoner og gjennomføring med lærer er ikke gjort av denne leveransen.

## Kilder og avgrensning

- [Lokalt fullkjedebevis](../../../output/logical-restore-2026-10-20/local-full-chain/README.md), [stanset skyforsøk og overstyrende status](../../../output/logical-restore-2026-10-20/README.md).
- Kodegrunnlag: /private/tmp/spansk123-logical-restore-2026-10-19/scripts/pilot-ops/run_full_restore.py og server/recovery.js. Lokal kodegjennomgang 21. oktober; ingen kjøring av restorepakken.
- [Supabase roller](https://supabase.com/docs/guides/database/postgres/roles): etl-rollen har read-all/replication og bypass RLS. [Tilgangskontroll](https://supabase.com/docs/guides/platform/access-control): supabase_read_only_user brukes til SELECT og har pg_read_all_data. Dokumentasjon lest 21. oktober; den beviser ikke prosjektets faktiske credentialholdere eller isolasjon.
- [Leverandørens logiske backup/restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) beskriver overføring, ikke vår journalbarriere eller før-oppstart-isolasjon. Ikke bruk generiske grant/trigger-forslag derfra til å omgå egne porter.
- Supabase changelog-indeks kontrollert 21. oktober: varslet TLS-cipherendring 10. november er relevant for senere klientkontroll, men løser ikke reserverte roller. Ingen nye tokens/tilganger opprettet.

Review og faktisk lokal demoverifikasjon dokumenteres i output/arkitektur-og-laerergjennomgang-2026-10-21/. Arkitekturreview er ikke utførelsestillatelse.

## Ny evidens 21. oktober kl.12:06 Europe/Oslo

Supabase bekrefter i SU-508992/melding1a15ded710f4b662 at kundestyrt deaktivering/rettighetsrevoke/credentialstopp for de to reserverte rollene ikke støttes, og gir ingen etterspurt formell garanti. Alternativet «alle leverandørroller stengt» er derfor ikke en støttet videreføring på dagens grunnlag. Support foreslår plattformoperatørunntak; dette er ikke vedtatt av eier og endrer ikke vår gate. Anbefalingen om lokal fersk journalreplay før ryddet eksport står. Det konkrete metodevalget i dette dokumentet er fortsatt ikke mottatt. Se output/logical-restore-2026-10-20/support-response-2026-10-21.md. Ingen kode, ny fase eller ekstern handling følger av svaret.
