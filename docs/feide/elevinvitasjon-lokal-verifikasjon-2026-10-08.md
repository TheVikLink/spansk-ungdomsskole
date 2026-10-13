# Elevinvitasjon: lokal leveranse og ekstern port

8. oktober 2026. Beads `axkr`. Kode og testbevis er ferdige lokalt; ingenting i denne leveransen er migrert eller publisert eksternt.

**Oppdatert 13. oktober:** Invitasjonsendringene er rekonstruert sammen med PR12-diagnostikken på grunnlag `550ffe6` i en ny isolert lokal arbeidskopi. Gjeldende leveransegrunnlag ligger i `output/skoleflyt-klargjoring-2026-10-13/`; lærer/elev-protokollen ligger i [prøveprotokollen](laerer-elev-proeveprotokoll-2026-10-13.md). Den gamle `/private/tmp`-kopien nedenfor er historisk og skal ikke brukes som eneste kilde. GitHub-/Vercel-innlogging ble senere fullført og er ikke den dokumenterte gjeldende blokkeringen. Elevinvitasjonens separate PR og ekstern migrering 009 gjenstår; Feide-tokenutvekslingen gir fortsatt `invalid_client`.

## Resultat

Skoleadministrator kan utstede separate engangskoder for lærer og elev. Rollen bestemmes av endepunktet og lagres i invitasjonen. Elevkoden gir bare skolemedlemskap; klassekode og lærerens godkjenning er fortsatt nødvendig. Ny elev går gjennom vanlig lokal OIDC-innlogging og alle fire lekseområder uten seedet elevtilgang.

Innløsning holder SQL-låser til uavhengig journal er kontrollert og engangsbruk er journalført. Tilbakekalt skole, utsteder, konto eller kode kan ikke gjenåpnes av en gammel appbackup. Journalfeil ruller lokale endringer tilbake. Tidligere skolemedlemskap gjenopplives ikke av en ny kode. Ingen nye personopplysninger, Feide-scopes eller eksterne privilegier.

Lokal OIDC-test bruker Lax-cookie fordi loopback er HTTP/same-site. Ekstern Feide beholder None/Secure. CSP er uendret. Manuell utlogging i IAB ble blokkert av nettleserverktøyet før serverrespons, og er derfor ikke godkjent som en vellykket browserkontroll.

## Kilde og gjenopptakelse

Arbeidskopi: `/private/tmp/spansk123-feide-student-invitations`. Gren: `codex/feide-student-invitations`. Koden bygger på et hashregistrert utsnitt av hovedarbeidskopiens eksisterende, upubliserte filer. Den inneholder også eksisterende kultur-/uttaleendringer for å kjøre hele regresjonspakken; den skal ikke deployes samlet uten kontroll av leveranseomfang.

Varig lokalt underlag i repoet: `output/feide-elevinvitasjon-2026-10-08/`:

- `changes.patch`: bare de ni filene endret for denne rettingen.
- `before-sha256.json` og `after-sha256.json`: grunnlag for sikker anvendelse/verifisering.
- `files/`: eksakte, ferdige versjoner av de ni filene.
- Node22-testlogg, bygglogg, rå plan-/kodereview og desktop-/mobilbilder.

Patchen er testet med `git apply --check` mot hovedarbeidskopien, men ikke anvendt der. Kontroller før-hashene igjen før den tas inn i en godkjent Feide-leveransegren; ikke overskriv nyere arbeid. Hovedarbeidskopiens appfiler og den aktive uttalegrenen er bevart. Ingen commit, push eller produksjonsdeploy.

## Verifikasjon

Offisiell Node 22.23.3 (Darwin ARM64), verifisert SHA256 `23b25245dcfb9af7262f8ff142e9e2e0af025368117329e7a7458a51e5922f53` mot nodejs.org. Ikke bruk maskinens feilpekende Homebrew node@22 som versjonsbevis.

Bygg og hele `test:all` besto: 79 Node-tester, 72 servertester, én forventet PostgreSQL-opt-in, 545 Chromium-tester. Den separate ekte PostgreSQL-kjøringen besto 21/21, inkludert `app_runtime`, RLS-nekt og samtidig låseventing. Plan og kodegjennomgang: APPROVED; tidligere journal-/låse-/testfunn er rettet.

Nettleser: syntetisk administratorinnlogging, utstedelse/tilbakekalling og layout ved desktop/390 px verifisert. Full lærer–elev–lekseflyt er lokalt protokoll-/API-bevist, ikke eksternt Feide-bevist. IAB-utloggingens konkrete blokkering følges i `jfxz`.

## Ekstern migrering og rollback

Produkteier bekreftet Supabase administrator-/eiertilgang 8. oktober. Konkret operatørfil `output/feide-elevinvitasjon-2026-10-08/operator/migrate-009.sql` er nå klargjort og plan-/kodegjennomgått (APPROVED). Den bruker én transaksjon med en midlertidig egen-grant fra postgres, eksplisitt ADMIN FALSE/INHERIT FALSE/SET TRUE, og fjerner akkurat den nye grantor-raden før commit. Hele migratorens medlemskapsradsett skal være identisk før/etter. Opprinnelig grantor i staging er supabase_admin. Fire lokale PGlite-kontroller besto på Node22: suksess, feil etter DDL med full rollback, RLS-skjulte domenerader og avvikende opprinnelig grant. Skjema-/ACL-snapshot, tester, testlogg og rå review ligger ved. Ingen passord eller nye LOGIN-roller er opprettet. Operatørfilen er ikke kjørt eksternt.

Leveranseport: AGENTS.md krever en separat reviewbar PR for konto-/databasearbeidet. GitHub CLI har ugyldig token; Vercel CLI er fortsatt utlogget. Første Vercel-innlogging stoppet ved lagring utenfor sandkassen; ny innlogging ble startet med riktig lokal filtilgang, men ga ikke lagret innlogging. En gjennomført menneskelig CLI-innlogging til disse eksisterende kontoene er nødvendig før PR og staging-leveranse kan fullføres. Ingen kode eller schemaendring skal publiseres før leveranseporten er håndtert.

Neste levering må avgrenses til beskyttet staging og bruke godkjent operatørtilgang. Kontroller aktuelle migreringer 001–008, snapshot/gjenoppretting og syntetiske data før 009. Bare den separate migreringsrollen skal kjøre SQL; ikke utvid SQL Editor eller app_runtime for enkelhets skyld. Verifiser v2-funksjonens eier, faste search_path, fravær av PUBLIC EXECUTE, runtime-adgang og avvisning fra gamle signaturer. Ny runtime krever alle ni migreringer.

Behold 009 ved runtime-rollback. Gammel runtime får avvist alle skoleinvitasjoner; dette er tilsiktet og skal kommuniseres som midlertidig stengt onboarding. Ikke gjeninnfør den gamle SQL-funksjonen som alltid gav lærerrolle. Ny elevkode må aldri kunne gi lærerrolle, heller ikke ved restore/rollback.

Før godkjenning kreves faktisk Feide-retur, signert admin-ACR, ny elev, lærerens klassegodkjenning, publisert lekse, elevsvar, lærerresultat, uvedkommende nektet og utlogging i ekstern staging. Denne rapporten erstatter ingen av disse portene, skoleeiers avtale eller aktivering.
