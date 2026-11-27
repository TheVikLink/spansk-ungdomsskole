# Samlet kvalitets- og forbedringsplan etter 8 auditer (Bølge 1–5 + klasseromsløft)

Dato: 27. november 2026  
Branch: `codex/audit-improvements-2026-11-27`  
Beads-samlesak (epic): `spansk-ungdomsskole-xexg`

## Bakgrunn og kunnskapsgrunnlag

Planen sammenstiller funn fra 8 uavhengige auditer gjennomført mot den lokale kodebasen og live nettleserkjøringer (desktop 1920×1080 / 1440×900 / 1366×768 / 1280×800 og mobil 390×844, normal tilkobling, 3G-throttling og offline):
1. Første 15 sekunder (elev uten innlogging + spansklærer på `/undervisning/`)
2. Visuell design-, WCAG AA-kontrast- og layout-audit (`/`, `/undervisning/`, `/school`)
3. Stresset spansklærer kl. 08:12 (`/undervisning/`)
4. Feel & micro-interactions i alle 6 øvingsløkkene på `/`
5. Umotivert 14-åring på mobil (`/` på 390×844)
6. Redaksjonell språk-, mikrotekst- og tillitsaudit
7. Ytelse, lyd, offline (`sw.js`) og tilgjengelighet (inkl. 200 % zoom)
8. Brutal skeptiker / Red Team (produktleder + skeptisk avdelingsleder)

## Låste eierbeslutninger (27. november 2026)

1. **Visuell retning (1A):** Ro ned `/` og `/school` til lys nøytral bakgrunn (`#f8fafc`) med `#4f46e5` primæraksent (i Bølge 3), og samordne typografi, knappehøyder, hjørneradier og merkevarelinje med `/undervisning/` (som beholder sin rolige papirfølelse for utskrift og tavle).
2. **Lydoptimalisering:** Konverter de godkjente `.wav`-opptakene i `audio/lyttehistorier/` og `audio/diktat/` til MP3 (96 kbps mono) og rydd bort ubrukte filer i `audio/` (i Bølge 5). De 62 Refold-uttalefilene og deres hasher beholdes 100 % urørt.
3. **Klasseromsløft fra Bølge 6 inkludert nå:** **Tavlemodus / Prosjektorvisning med nedtellingstimer** og **Smakebit-visning på låste undervisningstimer** (uten å lekke betalt manus, fasit eller PDF-er) tas med i Bølge 4. De resterende tre ideene er opprettet som egne oppfølgingssaker i Beads.
4. **Norske spillnavn:** `Lingo Links` → `Ordkobling`, `Verbo Invaders` → `Verbjakt`, `Prepo Invaders` → `Preposisjonsjakt` (interne JS-ID-er og lagringsnøkler beholdes uendret; tas i Bølge 5).

## Ufravikelige rammer (`AGENTS.md`)

- Ingen nettleser-, OS- eller sky-TTS (heller ikke som fallback).
- Null midtpunkter (`U+00B7`) i UI, titler, skole­sider, lydmanus og utskrifter.
- Bevar innloggingsfri lokal øving (`localStorage`) og eksisterende eksport/import-kompatibilitet.
- Ingen ny stille datainnsamling eller analyse av elevsvar.
- Ingen stor omskriving av `index.html` – kun kirurgiske, målrettede endringer.
- De 62 Refold-lydopptakene (`data/pronunciation-refold.json`, `data/pronunciation-audio-manifest.json`) og `data/vocabulary-canonical-review.json` som autoritativ glosekilde bevares.

## Bølger og Beads-sporing

| Bølge | Beads-ID | Omfang | Verifikasjonsport |
| --- | --- | --- | --- |
| **Bølge 1** | `spansk-ungdomsskole-xexg.1` | Kritiske `/school`-UI-feil (`[hidden]`, `.top-actions`, `Slett konto`-plassering, rolleoversettelse, nettverksfeilkort), `/personvern` → `/privacy`, stylet `/besoksstatistikk.html`, bunnlenker, WCAG AA-kontrast & manglende CSS-variabler, `#appUpdateNotice`, generalisert mobil-`.study-header`, `ñ` (near-miss) & `¿?` i svarretting, `</p>`-tagg, mixed quiz-teller, `trackLicenseActivation`-scope, `var(--line)` i `time.css`, `jul-spania-chile` partnerkort-kolonner og auto-åpning av `elev.html`-eksempelsvar | `npm run build:app && npm run check:fast && npm run test:school`, `test:frontend-audit-fixes`, `test:pwa-ui`, `test:adaptive-quiz`, `test:lesson-plans`, `git diff --check` |
| **Bølge 2** | `spansk-ungdomsskole-xexg.2` | Øvingsfølelse, tastaturflyt og mobil-ergonomi i `/`: Enter/Space-nedkjøling, forutsigbart fokus uten scrollhopp, bytt `Sjekk svar` → `Neste` på stedet, aksentrad (`tabindex="-1"`, `preventDefault`, plassering over felt på mobil, gjenbruk i diktat), `1`–`4`/Select-`Enter`/`Backspace`/`Alt+R`-snarveier, husk diktat-tempo & hindre tomt låst svar, hopp over `confirm()` ved 0 svar, rydd Uttaleskolen + XP for SM-2/diktat/uttale, 1-bokstavs tastefeil-veiledning og `:active`/mikro-animasjoner | `npm run build:app`, `test:vocab-mechanics`, `test:verb-focus`, `test:grammar-explanations`, `test:sentence-puzzle`, `test:adaptive-quiz`, `test:completion-header`, mobil- & tastatursjekk |
| **Bølge 3** | `spansk-ungdomsskole-xexg.3` | Første 15 sek, visuell ro (palett 1A `#f8fafc` + `#4f46e5`) og navigasjon: rydd `#welcomeScreen`, flytt `Anbefalt for deg` over tom `0 XP`-graf, stram 1–2-raders `.nav-bar` + lukk `Flere områder` automatisk + skjul `.nav-bar` under aktive mobiløkter, gjenopprett `font-weight: 700`, rydd Gloser/Grammatikk/Verb/Lekse (`For lærer`-sammenklapping)/Kunnskapskart, `/school`-polering | `npm run build:app`, `test:start-page`, `test:brainmap`, `test:assignment-package`, `test:frontend-visual-audit`, `test:school` + desktop/Chromebook/mobil-kontroll |
| **Bølge 4** | `spansk-ungdomsskole-xexg.4` | `/undervisning/` kl. 08:12-verktøy & låst smakebit + Tavlemodus: snu CTA-hierarki og løft Gratis prøvetimer over bretten, skjul `.package-hero` ved aktiv skolekode, `2×2` highlights + kortforhåndsvisning + trinnmerking/ryddige filtertall, låst smakebit-visning uten lekkasje, 5-trinns ankerstripe, slank verktøylinje + **lokal SVG-QR**, **Tavlemodus med nedtellingstimer**, `↺ -5 sek` / `Spill fra start`, adressefelt-advarsel på `elev.html?laerer=1`, stylet `<textarea>`/gloseblokk/`Åpne glosene` + `Skriv ut` & tilbake-lenke på partnerkort | `npm run build:app && node scripts/build-lesson-plans.mjs --check`, `test:lesson-plans`, `test:undervisning-pakke`, live nettlesersjekk på 1920×1080, 1366×768, 390×844 |
| **Bølge 5** | `spansk-ungdomsskole-xexg.5` | Ytelse, lyd, offline, A11y og språkvask: fjern dobbel `index.html`-nedlasting i `sw.js`, `Cache-Control` for `refold-v1` i `vercel.json`, forhåndslast aktivt uttalekort + ekte `Laster lyd …`-status + parallell offline-nedlasting, global `offline`/`online`-status & stylede lydfeilkort, A11y (`aria-label`, `summary`-fokus, `H1`–`H3`, 200 % tekstzoom `verbs`), full redaksjonell språkvask inkl. norske spillnavn (`Ordkobling`, `Verbjakt`, `Preposisjonsjakt`), re-enkoding av 7 `.wav` → MP3 + opprydding av ubrukte filer i `audio/` | `npm run build:app && npm run test:all` + 3G/offline Chromium-sjekk + full diff-gjennomgang |

### Oppfølgingssaker opprettet for senere arbeid (utenfor Bølge 1–5)
- `spansk-ungdomsskole-qb76` — 60-sekunders Madrigal-smakebit («Du kan allerede spansk!») på `/`
- `spansk-ungdomsskole-d3ho` — Valgfri ekte spansk lyd ved riktig svar der godkjent opptak finnes
- `spansk-ungdomsskole-q96e` — Hash/URL-ruting på `/` og utskrivbart «Ukens mestringskort»
