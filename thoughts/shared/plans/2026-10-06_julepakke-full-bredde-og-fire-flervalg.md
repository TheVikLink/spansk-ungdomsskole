# Full lesebredde og fire avkrysningsspørsmål

Beads: `spansk-ungdomsskole-w83j`. Følg produkteierens siste tilbakemelding: fjern nettets tekstordlister og tilhørende piler, vis begge hele tekstene under bildene, bruk fire avkrysningsspørsmål og fjern delen «Vurdering før elevbruk» fra lærerveiledningen.

Tekstinnhold, ulike familiebilder, lokale ordoppslag og valgfri Gloser-kobling beholdes. Ingen endring i standardfasit, fremgang, konto, avhengigheter eller publisering. Intern status for faglig gjennomgang endres ikke av at en synlig seksjon fjernes.

## Utforming og aksept

- Ingen tekstordliste eller ordlistepil i noen landseksjon. Teksten starter nedenfor bildet og bruker landkortets fulle innvendige bredde på desktop og mobil. Bildet holdes moderat stort og sentrert; bildeord og oversettelser i teksten virker fortsatt.
- Første spørsmål beholdes som «Hva kalles julaften i Spania-teksten?» med Nochebuena som riktig svar. Chile-spørsmålet blir «Hva gjør noen familier i Chile ved midnatt?» med ett riktig svar: «Abren los regalos.» Distraktorene er andre handlinger omtalt i tekstene.
- Alle fire spørsmål krever et eget valg før tilbakemelding. Lærerfasit og 45-minuttersplan følger fire flervalgsspørsmål.
- «Vurdering før elevbruk» fjernes fra lærer-HTML, tilsvarende statusseksjon fra lærer-PDF. Kilder, pedagogisk veiledning og intern arbeidsutkaststatus beholdes.
- Elev- og lærer-PDF får samme spørsmål og fasit. Papirordlistene beholdes som støtte når det ikke finnes interaktive ordoppslag. Nettets instruksjoner bruker ordoppslag i stedet for å be eleven åpne en fjernet liste.

## Filer og gjennomføring

Oppdater `data/culture-packages.json`, `scripts/build-culture-preview.mjs`, `docs/kultur/jul-spania-chile/preview.css` og `preview.js`. Fjern bare listevisning; behold leseorddata som kilde for direkte oversettelse. Revider `scripts/build-culture-pdfs.py` og bygg begge stabile PDF-er. Generer elev-/lærer-HTML og oppdater pakkens README.

Bruk test-først-runder for lesebredde og listefravær, deretter alle fire avkrysningsspørsmål og fjernet lærerseksjon. Oppdater eksisterende utskrifts-/skriptfeiltester til den nye flyten. Kontroller visuelt begge land på desktop og mobil samt alle sider i oppdaterte PDF-er.

## Kontroll

Med prosjektets Node 22-runtime:

```sh
node --test tests/culture-packages.test.mjs
npx playwright test tests/culture-christmas-flow.spec.js tests/culture-vocabulary.spec.js --browser chromium --workers=1
npm run build:app
npm run test:all
git diff --check
```

PDF bygges med eksisterende Python-/ReportLab-runtime og Noto Sans. Render alle sider til midlertidige PNG-er, kontroller dem visuelt, og sjekk de nye spørsmålene/alternativene/fasiten og begge komplette lesetekstene med tekstuttrekk. Oppdater og avslutt Beads først etter ferske grønne kontroller, og kjør `bd --no-daemon sync`. Ingen push eller publisering.
