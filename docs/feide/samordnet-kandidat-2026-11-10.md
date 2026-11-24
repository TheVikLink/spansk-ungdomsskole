# Samordnet skolekandidat — 10. november 2026

Bestilt i chatten: samle inn-/utlogging, gjenoppretting og skolevis drift til én kandidat og kontrollere skoleflyten. Arbeidet følges i Beads y8nr under rbec.4. Hovedarbeidsmappen er bevart; kandidaten ligger på egen codex/integrated-school-candidate-20261110. Eksakt kildecommit, filhasher og sluttgate finnes i [leveransepakken](../../output/integrated-school-candidate-2026-11-10/README.md). Ingen publisering eller åpning for elevdata følger av lokal samordning.

## Kildegrunnlag

Backend: e52e046 med elevinvitasjoner, MFA, skrivebarrierer, skoleavgrenset stans/eksport/sletting og retensjon. To konkrete produktgap er rettet: samme vertsnavn for lokal app/OIDC, og krav om alle12app-/6journalmigreringer før runtime åpner. Nyere grunnapp/eksisterende innhold og byggeverktøy kommer fra et SHA256-bundet øyeblikksbilde av hovedarbeidsmappen. Ingen nye oppgave-/lydpakker eller avhengigheter er lagt til.

Grunnappen er treveissammenslått mot felles utgangspunkt d45fbfd for å bevare begge grenenes arbeid. Begge importhjelperne og den nyere5MBgrensen er beholdt. Allerede implementerte rettinger for lokal lekseimport, valgbevaring/feltfeil/elevinstruks, lydreplay og øvingsveiledning er med. Relaterte tester er også treveissammenslått; faktiske brukerklikk og tidligere kontroller er beholdt. Ingen nye skips for å få grønt.

Gjenoppretting: seks filer fra b29782c er med som cherry-pick425197e, kontrollert byte for byte. Lokale partransport-/guardianregresjoner er prøvd på nytt; ingen ny rårestore eller ny hostedimplementering er laget. Sperrene integrationReady/externalExecutionPermitted er fortsatt false i providerløpet.

## Hva som er kontrollert

Den samlede nettleserflyten logger inn via reell lokal OIDCform_post i egne lærer-/elevprofiler, oppretter klasse/invitasjon/godkjenning, publiserer en lekse i hvert av fire områder, lar eleven svare og kontrollerer lærerens oppfølging.390og1280px er prøvd, inkludert nektet elevtilgang til lærerAPI og gammeløktavslag etter utlogging. Separate eksisterende prøver dekker kontobytte, Origin/CSRF, tapt svarkvittering og gjenopptak uten dobbeltføring.

Disse browserprøvene bruker **PGlite**, fullt migrert til012/006; de er ikke nativePGbrowserprøver eller ekstern Feide. Seks separate nativePostgreSQL17.11-prøver dekker migreringer, stans→eksport→auditrydding→purge, skrivebarrierer, begrenset loginrolle og faktisk avvisning når012eller006mangler. Bare egne syntetiske containere brukes og fjernes. Gamle restore-/stagingkvitteringer godkjenner ikke automatisk nye kilde-/migreringshasher.

## Ekstern staging gjenstår

Read-only kontroll10.november: appstaging peglwndjqnrstwnlrdsa har001–011, journalstaging quznpkwsapehdcmicgsq har001–005, beggePostgreSQL17.6. Ingen012/006 eller nye kildebindinger er installert av denne oppgaven. Det eksisterende eksterne miljøet kjører derfor ikke denne kandidaten.

Før faktisk ekstern kandidatprøve må gjenopprettings-/gjenåpningsporten oppfylles, nye migreringer og kildebindinger gjennomføres med kontrollert stagingprosedyre og riktig rollback, deretter riktig beskyttet appkandidat testes med Feide/lærer/elev. Ingen blind oppdatering av digester for å gjøre helsesjekken grønn. Databasepatch, aktiv skoleworker/monitor, kundeinstruks og produksjonsåpning er egne rester. Første skolepakke er fortsatt én skole/inntil seks klasser; ingen ny pedagogisk pilotskole kreves.
