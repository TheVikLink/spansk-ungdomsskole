# Lokal journalreplay før ryddet eksport

Beads m45j. Eier valgte 21.10 uttrykkelig metoden og bestilte lokal implementering og test, uten nye skyressurser eller eksterne endringer. Dette vedtar lokal delta i arkitekturavklaringen, ikke providerunntak, nye kildecredentials, ekstern fixture/import/patch. Hovedapp, lærerdemo, originaljournalstaging, alle gamle CLOSED-kvitteringer og bevis holdes urørt.

## Kilde og avgrensning

Egen codex/local-replay-before-export fra 84446a2 i /private/tmp/spansk123-local-replay-2026-10-21. Gjenbruk eksisterende pakkebygger/LocalFull/kanonisk server/recovery.js. Alle åtte aktuelle Pythonhjelpere matcher prepared-manifest fra lokal fullkjede20.10; final-readiness-SHA matcher også. Kopier bare kildekode fra isolert checkout, aldri gamle private filer/volumer eller credentials. Native klient PG17.11 og allerede lokalt pinnet image brukes uten pull. Kildemodellen er app001–011/journal001–005; ny lokal Feide-gruppedemo012 er separat og endres ikke.

Ny lokal kontrakt har bare local-synthetic-app/journal-IDer og cloudImportPermitted=false. Ikke endre gammel ekstern koordinator eller gjøre gamle skymål gjenbrukbare. Ny CLI må ikke akseptere URLs, tokens, eksterne prosjekt-IDer eller målparametere. Imports av moduler må ikke ha sideeffekter.

## Ny kobling

Gammel lokal rårestore/strukturfingeravtrykk beholdes. Legg et eksplisitt replay-steg etter verifisert rårestore og før inaktivering/eksport. I replaykontrakten er callback/bevis obligatorisk; manglende eller feilet replay må stoppe før pg_dump av ryddet app. Vanlig gammel LocalFull-bruk beholder oppførsel, og er ikke en godkjent inngang til den nye eksportkontrakten.

Node-modulen for preexport bruker kanonisk verifyRestoredSchoolDatabase og createRevocationJournal. Hele originaljournalens hendelser og subject-bindinger leses i en READ ONLY REPEATABLE READ-transaksjon. Verifiser eksakt baseline-prefix, identiteter, count/max/checkpoint, forventede nye hendelser og komplett ferskt innhold. Avslutt dette snapshotet før etterkontrollen. Hver ferskhetsport etter replay/før eksport, før første importskriving og etter import/før sluttbevis åpner en ny uavhengig READ ONLY REPEATABLE READ-transaksjon og sammenligner både checkpoint og fullinnholdshash. Ingen ferskhetsport får gjenbruke replayens pinned snapshot. Historisk gjenopprettet journal er bare backupbevis og avvises som originalkilde.

Snapshotets prosjekt/databasenavn alene er ikke produksjonsproveniens: den lokale runneren gir kun egne kontrollerte DB-håndtak. Framtidig ekstern leser krever separat TLS-/prosjekt-/rolle-/freeze-bevis. Denne leveransen påstår ingen slik ekstern binding.

Replay må faktisk håndtere alle ti støttede hendelsestyper. Dagens recovery godtar tre invitasjonshendelser uten å endre invitasjonsradene; dette skal først vises av en rød test og deretter rettes lokalt. Invitasjon-IDer settes brukt/tilbakekalt etter hendelse; perbruker-korrelasjons-ID uten invitasjonsrad er lovlig no-op. Skolemedlemskapsfjerning skal også stenge relevante klassemedlemskap/leksemottakere før pakken kan eksporteres. Ukjent type må stoppe med rollback, aldri få et grønt bevis.

Node→native SQL-adapteren kjører kun psql via docker exec mot eksakt UUID-merket network-none-container; ingen sockets eller porter publiseres på verten, ingen nettklient/credentials brukes. Parameterverdier SQL-escapes som literaler (ingen shell), SELECT/DML-returning pakkes til JSON og ROW_COUNT/SQLSTATE rammes inn. Transaksjoner beholdes i samme psql-prosess; feil kan rulles tilbake. Adapter testes for apostrof/newline/dollar/bytea/null, DML-count, SQLfeil/rollback og hemmelighetsfri feilmelding. Native canonical replay skal bruke denne adapteren, ikke en alternativ håndskrevet SQLreplayer.

## Manifest og eksportport

Replaybevis binder raw appdump-SHA, baselinejournalens fullinnholdshash/checkpoint, fersk originaljournals fullinnholdshash/checkpoint og kildekodehasher (recovery og replayer). Etter replay tas post-replay-fingeravtrykk; inaktivering får bare endre eksisterende gjennomgåtte drifts-/øktfelter. Ryddet eksport binder ny dump-/SQL-SHA, tabell-/sekvensfingeravtrykk, strukturpakke og replaybevisets digest. Ingen rå dump, gamle credentials, rå journalhistorikk eller diagnostikk legges i den delbare pakken.

Ny kontrollimport må validere manifestet mot aktuelt journalinnhold/checkpoint og aktuelle filhasher før første målskriving. Manifestutløp, rå/pre-replay-pakke, endret fil, endret/ufullstendig journal eller kodehashavvik betyr stopp. Revalider journal etter import og før godkjent sluttbevis; ved endring blir resultatet failed og kopien beholdes aldri som godkjent. Ingen automatisk delta-replay/retry. Hver invitasjon-/medlems-/slettehendelse har konkrete datakonsekvenser som verifiseres i både ryddet kilde og kontrollimport.

## Faktisk lokal delta

Bygg én gammel syntetisk appbackup med skole som skal slettes og kontrollskole som deler identitet; egne uavhengige rader for user delete/block, school block, class/school membership removal, retention og alle invitasjonsgrunner. Fang baselinejournal og appdump fra faktiske snapshots. Legg nyere hendelser i den separate originale lokale journalen etter appbackup. Gjenopprett gammel app lokalt, kjør kanonisk replay mot fersk originaljournal og inaktiver. Bare ryddet eksport importeres i nytt lokalt prepared-mål. Kontroller slettet skole/rader borte, delte identiteter/kontrollskole bevart, grants/mottakere/invitasjoner stengt og sekvenser/urelaterte data uendret. Providerstub er uaktiv fixture som tidligere og gir intet eksternt plattformbevis.

Negative deltaprøver: gammel journal, mutert event/subject med samme antall, manglende prefix, ukjent hendelse, feil kilde, replayfeil/rollback, pakke uten replay, modifisert eksport og journal som avanserer mellom replay/eksport/import/slutt. En faktisk native prøve lar en separat originaljournalforbindelse committe en hendelse mens replayens pinned lesesnapshot fortsatt er åpent: gammelt snapshot skal ikke se hendelsen, men neste uavhengige port skal oppdage den og stoppe eksport/import. Test at eksport/import ikke blir kalt ved avslag. Ikke gjenta gamle 16bygger-/6APItester som separat hovedfase; gjenbruk nødvendige bevarings-/isolasjonssjekker for den nye kjeden.

## Lokal livsløpskontroll

Ny separat offentlig lokal receipt, ny UUID og nye containernavn, aldri gammel fullrestore-receipt/container. Bare isolerte syntetiske data. Alle containerne network-none, ingen porter/vertsbind, pinned image/pullnever, tmpfs, memory=swap/noekstraswap, read-onlyroot, ikke-root, capdrop og ingen logging. Rå filer på ny AES256disk med privat root, fast arbeidsslutt20min/hard cleanup30min. Uavhengig vakt har bare eksakte egne navn/labels/image/paths, stop→inspect stopped→ordinær rm; ingen force eller bred prune. Alle ressurser føres som intent før create; cleanup prøver alle ressurser selv ved feil og beholder filene hvis containerfravær er uavklart. Sluttbevis krever fersk entydig fraværskontroll, daemon virker, volum demontert/image/privatefiler borte og cleanupErrors=[]; ellers passed=false og konkret varsling. Ingen gammel frist forlenges.

## Leveranse og verifikasjon

Adversarial planreview før kode. Rød/grønn nærtest per ny semantikk, kanoniske recovery-/journal-regresjoner, native adapterprøve og én faktisk ny PG17 replay→eksport→import-kjede med aktuelle negative porter. Ingen UIendring eller nytt bygge-/nettleserarbeid er nødvendig for metodedelta; relevante tester og diffcheck brukes. Slutt-review av faktisk diff/bevis. Dokumenter kildehasher, tidsstempler, manifestkjede og eksakt cleanup uten rad-/credentialinnhold. Beads m45j kan lukkes når lokal metode faktisk består; ya9r/twkq beholder ekstern restore/patch/driftsporter. Ikke send e-post, push, deploy eller merge.

## Utført 21. oktober 2026

Lokal metode bestod faktisk PostgreSQL 17.11, run 5756cba1, kl.13:59:14–13:59:50 Europe/Oslo. Alle ti grunner fikk forventet virkning før eksport og etter prepared kontrollimport. En separat samtidig journalcommit ble oppdaget av neste uavhengige transaksjon og avviste videre bruk av kopien. Fire egne containere,113privatefiler og ny kryptert disk ble fjernet uten feil; fersk fraværskontroll og slutt-review APPROVED0 bekreftet resultatet. Se output/preexport-replay-2026-10-21/README.md og verification.json. Ekstern prøve/patch og provider-/kildefrysporter er fortsatt separate og ikke bestått.
