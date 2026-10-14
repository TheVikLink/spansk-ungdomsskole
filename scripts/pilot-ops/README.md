# Skolelivsløp — syntetisk staging

Disse operatørverktøyene gjelder bare app `peglwndjqnrstwnlrdsa` og journal `quznpkwsapehdcmicgsq`. Produksjon og ekte skoledata er ikke godkjent. Eksport og sletting krever en eksplisitt, kortlivet skoleautorisering i private operatørskjemaer. Nettrollen får ingen eksport-/sletteprivilegier.

Migrering 010 og journal 005 ble installert 14.10.2026; de er immutable. `build-migration-packages.mjs` lager førstegangspakker med kontroll av tidligere migreringer, funksjonseiere og nøyaktig gjenoppretting av migratorgrants. Ikke generer over evidensfilene fra den gjennomførte installasjonen. `build-followup-packages.mjs` lager 011-/kilderegisterpakken og en separat syntetisk testskole med eksisterende offentlige Feide-testidentiteter. Ingen produksjonspromotering eller automatisk SQL-kjøring inngår i generatorene.

`exportSchool` i `server/school-lifecycle.js` tar ett konsistent snapshot av skolebundne data og tilknyttede profiler. Globale Feide-identiteter og sikkerhetsjournal er egne sikkerhetsdata. Eksporten skal lagres med modus 0600 og leveres sikkert; ikke logg innhold. `deleteSchool` er rollback/rapport som standard. Apply krever separat journalbekreftelse før appdatakommit, og beholder globale profiler som andre skoler kan bruke. Den gamle Feide-testskolen skal ikke slettes i denne prøven.

Før restore åpnes, må alle journalhendelser replayes med oppdatert kode. `verifyReopeningGate` kontrollerer kildedigester, komplett/fersk journal og at skole-, oppgave- og brukersletting faktisk er anvendt. En gammel deployment er ikke en gyldig rollback etter første livsløpshendelse. Behold en kompatibel runtime og sperret skole ved feil. Leverandørens backup-/journalfrister og global profilsletting krever fortsatt egne beslutninger.

## Automatisk opprydding er ikke levert

Retensjonsmotoren er testet lokalt, inkludert native PostgreSQL, journalfeil og samtidighet. Fem godkjente skoler behandles per runde, med høyst 20 oppgaver og 100 rader per teknisk kategori/skole. Globale tekniske utløp krever egen versjonert policy. Økthasher, audit- og invitasjons-ID-er blir i databasens private batch; jobben mottar skole-/oppgave-ID-er, referanser og tellerdata.

`supabase/functions/school-retention` og `scheduler.sql` er et uferdig, ikke deploybart forsøk. **Ikke deploy eller aktiver dem.** Den faktiske Supabase Edge Runtime v1.70.0 lar ikke `Deno.env.delete` fjerne injiserte administrative variabler, og permissions.revoke begrenser dem heller ikke i prøven. Oppstartsguarden stopper før databasekontakt. pg_net-køene får dessuten PUBLIC-grants fra supabase_admin som den tilgjengelige postgres-operatøren ikke kan fjerne. Native cronprøve stoppet på den eksplisitte sikkerhetskontrollen, uten å sende jobbkall.

Ingen nye jobbcredentials, Edge Function, Vault-secret eller cron er opprettet eksternt. En isolert kjøretid og scheduler må velges og gjennomgås før ekstern opprydding kan testes. Ikke fjern guarden, bruk administrasjonscredentials, svekk TLS eller utvid eksisterende roller som snarvei.

`stage-worker.mjs` kopierer fire moduler og skriver bare kildehasher. Map-testen av miljøskrubben er en enhetstest, ikke bevis for plattformisolasjon. `verify-scheduler-native.mjs` er en lokal, ikke bestått eksperimenttest mot den særskilte engangscontaineren på 5448; den skal ikke regnes som leveringsbevis.

## Verifisering

`npm run test:all` bestod 14.10: 47 ordinære Node-tester, 96 skolebackendtester (4 opt-in native tester hoppet over) og 483 Chromium-regresjoner. Native samtidighet, migratorgrants og faktisk pg_dump/restore er kontrollert separat. SQL-/kilderegisterpakken har godkjent adversarial review; scheduler er uttrykkelig utenfor godkjenningen. Eksterne resultater må dokumenteres separat fra disse lokale testene.
