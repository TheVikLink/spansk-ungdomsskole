---
name: spansk123-salg
description: >-
  Use when preparing or sending school outreach emails, updating the Spansk på 1-2-3
  Salgslogg CRM in Google Sheets, creating outreach preview docs in Google Drive, or
  handling school invoicing/follow-up for Spansk på 1-2-3 (Oversikt AS).
---

# Spansk på 1-2-3 – Skolesalg, utsendelse og CRM

## Faste tekst- og produktregler (eiervedtak)

- **Presenter begge deler av løsningen:** Løft frem både den gratis, adaptive øvingsappen (`https://www.spansk123.no`) og de 46 ferdige 45-minutters undervisningstimene (`https://www.spansk123.no/undervisning/`).
- **Tre tydelige alternativer:** Gratis (`spansk123.no` + 3 prøvetimer), Undervisningspakken (`3 490 kr per skole per år`, ingen elevkonto/Feide/DBA), Komplett Skolepakke med Feide (`4 995 kr første år`, inkluderer alt over + Feide, lekser, læreroversikt og DBA/DPIA).
- **Forbudte formuleringer (legg inn automatisk sjekk i skript):**
  - Aldri midtpunkt (`U+00B7`).
  - Aldri nevn «robotstemmer» eller «helt uten robotstemmer» (lyden er KI-generert; beskriv konkret som naturlige lyttedialoger / innspilt lyd).
  - Aldri nevn «inntil 6 klasser» i oppsøkende salg.
  - Aldri skriv «eks. mva» så lenge Oversikt AS (`930687758`) står som `registrertIMvaregisteret: false` i Brønnøysundregistrene.
- **Avsender og kontakt:** Bruk alltid `Ole Henrik Vik <ole@spansk123.no>` (ikke `olevik91@gmail.com`).
- **Fakturering (EHF):** Ikke spør skolen om organisasjonsnummer – slå opp offentlig org.nr i Brønnøysundregistrene (`data.brreg.no`) og be kun om bestillerreferanse / ressursnummer.

## Klargjøring av nye utsendelsespuljer

1. **Verifiserte kontakter:** Gjett aldri e-postadresser. Verifiser gjeldende rektor eller avdelingsleder for språk/fremmedspråk og offisiell e-post mot kommunale/fylkeskommunale nettsider.
2. **Kryssjekk mot duplikater og ekskluderinger:**
   - `Spansk på 1-2-3 – Salgslogg`: `19rjx-8pOgKI_-gep226hK4YX6F7-sKsKqvqAHh3lA2k` (fanen `Utsendelser`).
   - `Kodeverkstedet – Salgslogg`: `1gFda58GWDVNyjageOGqn68M78zBeMuY3ZVMnfE03fbs` (fanen `Salgslogg`).
   - Utelat alltid `Slåtthaug skole` og `Inderøy kommune`.
3. **Personvern i repo:** Lagre aldri mottakerlister, sendingslogger eller utsendelsesskript i Git-repoet. Hold alt lokalt i samtalens `scratch/`-mappe.
4. **Godkjenningsport før sending:** Send aldri e-post uten eksplisitt godkjenning. Legg først nye skoler i `Utsendelser` (`Status = Klar til utsending`) og eksporter komplett e-postforhåndsvisning som native Google Doc i mappen `Spansk123 / Markedsføring og salg` (`1JY8JG1EAmsWrE6kZeoD4ezjjw7wjOHso`).

## Utsendelse via Gmail CLI (`ole@spansk123.no`)

- Bruk `gmail mutate send` (ikke `update-draft` / `send-draft`, som mangler `--from`):
  ```bash
  gmail mutate send \
    --from "Ole Henrik Vik <ole@spansk123.no>" \
    --to "<epost>" \
    --subject "<emne>" \
    --md --body-file "<fil.md>" \
    --default-style "" --json
  ```
- **Visningsnavn:** Inkluder alltid `"Ole Henrik Vik <ole@spansk123.no>"` (ren adresse utelater visningsnavnet).
- **Idempotens og kvoter:**
  - Send alltid med `--default-style ""` (uten flagget treffes `403 RATE_LIMIT_EXCEEDED` etter ca. 4 kall).
  - Lagre hver `messageId` i en lokal JSON-logg i `scratch/` rett etter sending og hopp over mottakere som allerede finnes i loggen.
  - Send i puljer på 4–5 e-poster med `schedule` (`DurationSeconds: 65`) mellom puljene; bruk aldri `sleep`.
  - Ikke opprett Gmail-etiketter med mindre brukeren ber om det.
- **Verifisering etter utsending:** Sjekk JSON-loggen (alle unike mottakere), `gmail readonly search "in:sent SPANSK2026"`, stikkprøve med `gmail readonly get <id>`, og oppdater `Salgslogg` (`Status = Sendt`, `Dato sendt`, `Neste steg = Oppfølging 1`, `Neste dato`).

## Google Sheets CRM (`gsheets`) – viktige detaljer

- `gsheets mutate write` splitter celler på `,` og rader på `|`: escape alle komma i celletekst og formler som `\,` før sending.
- `gsheets readonly read --json` returnerer en ren 2D-tabell (`[[...]]`), ikke `{ values: [...] }`.
- `gsheets mutate add-sheet` returnerer ren tekst (`Added: <navn>`), ikke JSON, selv med `--json`.
- Pakk datoformler med `INDEX(SORT(...))` inn i `TEXT(..., "yyyy-mm-dd")` så Google Sheets ikke viser serienummer.
- Les alltid tilbake `Pipeline` og endrede rader i `Utsendelser` etter skriving for å verifisere null `#ERROR!` / `#NAME?` og uskadde kolonner.
