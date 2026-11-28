# Prosjektstatus – Spansk på 1-2-3

Sist oppdatert: 28. november 2026
Kanonisk teknisk og operativ statusoversikt. Detaljerte oppgaver følges i Beads (`bd --no-daemon ready --json`).

## Aktivt mandat (24. november 2026)

Produkteieren har løftet funksjonsfrysen fra 9. november 2026 for å gjennomføre den godkjente **firetrinns moderniserings- og produktforeningsplanen** ([`thoughts/shared/plans/2026-11-24_four-move-modernization-plan.md`](../thoughts/shared/plans/2026-11-24_four-move-modernization-plan.md), Beads `spansk-ungdomsskole-oku4`):

1. **Move 1 — Git-, repo- og dokumentasjonshygiene:** Fjern foreldreløse `.tsx`-filer og selskaps-PDF-er i rot, stram inn `.gitignore` og Beads `in_progress` (maks 3 aktive saker), og samle status her.
2. **Move 2 — Forenkle skolelanseringens gjenopprettingsmodell (Valg 2B):** Behold eksisterende to-database-runtime (`appPool` + `journalPool`), avslutt automatisert sky-restore-transport (`spansk-ungdomsskole-ya9r.11`), og bruk den verifiserte manuelle logiske gjenopprettingsrutinen (`pg_dump` -> lokal `verifyRestoredSchoolDatabase` -> import i PostgreSQL 17.12).
3. **Move 3 — Modulariser `index.html` og oppgrader AI-agent-ergonomi:** Ekstraher `src/data/` og `src/domain/`, legg til `ARCHITECTURE.md`, `npm run check:fast` (< 5 s) og `npm run doctor -- --json`.
4. **Move 4 — Foren læringsfeed, 45-minutters undervisningstimer og ekte skolelekser:** Rydd velkomst/navigasjon, koble de 46 undervisningstimene direkte til leksetildeling, og støtt tekstsvar (vurdert i minnet med null lagring av råtekst) + batch-godkjenning i Feide-skolemodus.

## Hva som er ferdig og verifisert lokalt

| Område | Status | Viktig merknad |
| --- | --- | --- |
| **Lokal grunnapp (`/`)** | Fungerer med og uten nett | Læringsfeed på Start, SM-2-gloser, 34 verb, 10 grammatikktemaer, 8 leksjoner, Brainmap, 5 lyttehistorier, 5 diktater, Refold-uttaleskole (62 opptak), Madrigal-ordgjenkjenning og kulturpakker. |
| **46 undervisningstimer / Undervisningspakken (`/undervisning/`)** | Bygd, lisenssikret og testet lokalt | 45-minutters opplegg med gloseøkt, skriving, MP3-lyd og utskrivbare A/B-kort. 3 åpne prøvetimer + 43 timer bak tilstandsløs skolekode (`SP123.*` via `server/undervisning-access.js`, genereres med `npm run license:create`). |
| **Skolemodus (`/school` + `server/`)** | Består 53+ server-/PGlite-tester og native PG 17.12-test | OIDC/Feide, MFA/ACR-krav, klasseinvitasjon, lærerprioritet («Fra læreren» i feeden), fire lekseområder, RLS, retensjon og `verifyRestoredSchoolDatabase`. |
| **Innholdsautoritet** | Synkronisert og sjekket | `data/vocabulary-canonical-review.json` er eneste redigerbare glosekilde (`npm run check:vocabulary`). |

## Hva som gjenstår før første kundeskole aktiveres med ekte elevdata (`rbec.4`)

1. **Databaseoppgradering, produksjonsdatabaser og varig jobbdrift (`twkq`):** Begge Supabase-stagingprosjektene (`peglwndjqnrstwnlrdsa` og `quznpkwsapehdcmicgsq`) ble oppgradert fra PostgreSQL 17.6.1.171 til `17.12.0.002` og etterkontrollert 27. november 2026 (`spansk-ungdomsskole-ya9r` lukket): alle 12 appmigreringer, 6 journalmigreringer, 23 kildehasher, roller/RLS, Security Advisor (`0 ERROR`, `0 WARN`) og staging `/healthz` (`{"status":"ok","securityJournal":"ok"}`) er bekreftet. Den 28. november ble også minstetilgangsroller, syntetisk `prepare_retention`/`apply_retention`, journalføring (`record_assignments`) og DB-først-stopp bekreftet på PostgreSQL `17.12` med rullede transaksjoner (`spansk-ungdomsskole-2nf2` lukket); utdatert `spansk123-school-retention-production` ble slettet fra Vercel og et passivt standby-stagingprosjekt (`spansk123-school-retention-staging`, `enabled:false`, `crons:[]`) ble opprettet uten databasepassord. Varig kundebundet retensjonsaktivering (`twkq`) og nye PG 17.12 produksjonsdatabaser avventer første betalte kundeskole.
2. **Faglig gjennomlytting av lyd (`4or0`):** Spansklærer/produkteier kontrollerer de valgte opptakene mot manus og på fysisk skoleutstyr før lytteoppgaver brukes med elever.
3. **Skolespesifikke avtaler og aktivering (`zq9b`):** Signert skoleavtale, databehandleravtale (DBA), bekreftede kontakter og skoleeiers godkjenning før første skole åpnes i produksjon.

## Viktige pekere

- **Arkitektur og agentregler:** [`AGENTS.md`](../AGENTS.md) og [`ARCHITECTURE.md`](../ARCHITECTURE.md)
- **Skoleleveranse og pilotstatus:** [`docs/feide/pilotskole/pilotstatus.md`](feide/pilotskole/pilotstatus.md)
- **Gjenoppretting og oppgradering (Valg 2B):** [`docs/feide/gjenoppretting-og-oppgradering.md`](feide/gjenoppretting-og-oppgradering.md)
- **Salgs-, GTM- og markedsføringspakke:** [`docs/salg/go-to-market-strategi-2026-11-24.md`](salg/go-to-market-strategi-2026-11-24.md) og [`docs/salg/markedsforingspakke-2026-11-24.md`](salg/markedsforingspakke-2026-11-24.md)
