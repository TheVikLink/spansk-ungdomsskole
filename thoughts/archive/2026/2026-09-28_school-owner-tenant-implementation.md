# Skoleeier som eksplisitt øverste tenant

## Mål

Legg inn en eksplisitt og fail-closed kobling fra skoleeier til skole slik at en manglende eller deaktivert skoleeier ikke kan gi Feide-brukere tilgang til skolens kontodata.

## Avgrensning

Denne endringen etablerer datamodell, databasevern, migrering og lokal syntetisk oppstart for skoleeierskap. Den oppretter ikke eieradministratorer, påstår ikke at en Feide-organisasjons-ID er juridisk skoleeier, og endrer ikke tilgang for allerede etablerte eksterne kontoer. Registrering av faktisk eier, vedtak, avtale og produksjonsaktivering forblir ekstern port.

## Akseptansekriterier

1. Hver skole har én eksplisitt skoleeier, og databasebegrensninger hindrer eier-/skole-mismatch.
2. Migrering av eksisterende skoler gjør ukjent eierstatus uverifisert og blokkerer tilgang fram til eksplisitt aktivering; den finner ikke på eier ut fra Feide `org_id`.
3. Sperret eller uverifisert eier stenger nye og eksisterende skoleøkter og autentiseringer.
4. Syntetisk demo seed kobler skole til tydelig syntetisk aktiv eier.
5. Tester dekker migrering, aktiv eier, uverifisert/sperret eier, to eiere, flere skoler hos én eier, og bevaring av skole-/klasse-/lekseisolasjon.
6. Feide/kommuneunderlaget forklarer implementert relasjon og hva som må verifiseres eksternt.

## Filer

- `server/migrations/005_school_owner_tenants.sql`
- `server/config.js` og oppstarts-/migreringskontroll
- `server/app.js` og databasefunksjoner som etablerer skoleøkter
- `scripts/seed-school-demo.mjs`, `scripts/setup-school-demo.mjs` og eksisterende testfixtures
- `tests/server/tenant-isolation.test.mjs`, `tests/server/school-flow.e2e.test.mjs` og migreringstest
- `docs/feide/README.md`, `docs/feide/behandlingsoversikt-og-dba.md`, `docs/feide/verifikasjon.md`

## Gjennomføring

1. Skriv migreringstest som viser at gammel skole uten verifisert eier stenges og at fremmed eierkobling avvises.
2. Legg til owner-tabell, FK/unikhetsregler og fail-closed overgang for eksisterende skoler.
3. Knyt autentiserings-/sesjonsoppretting og runtime medlemskontroll til aktiv eier; bevar skolen som minste API-tilgangsområde.
4. Oppdater syntetiske seeddata og nødvendige migreringsfixtures. Ikke oppdater eldre tester uten at migrering faktisk er en del av oppstartskontrakten.
5. Utvid tenant-tester med to eiere, flere skoler under én eier og ID-forsøk på tvers av skoler/eier.
6. Oppdater Sikt-/kommuneunderlaget med kilde, test og eksterne eier-/aktiveringsporter.

## Verifikasjon

- `node --test tests/server/tenant-isolation.test.mjs tests/server/school-flow.e2e.test.mjs`
- `npm run test:school`
- `npm run test:all`
- `git diff --check`

## Manuell risikogjennomgang

- Ikke behandle skoleeier som pedagogisk superadministrator; eierrelasjonen er kontrakts-/tenantgrense, ikke tilgang til alle resultater.
- Ikke aktivere migrerte skoleeiere automatisk eller basere eierforhold på `feide_org_id`.
- Sperring må stoppe allerede utstedte økter, også når flere skoler deler samme identitet.
- En skole under samme skoleeier må fremdeles ikke arve den andre skolens klasse- eller elevresultater.
