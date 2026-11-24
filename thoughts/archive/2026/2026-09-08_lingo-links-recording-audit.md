# Lingo Links-opptaksaudit

## Mål

Rette de tre eierobserverte avvikene i Lingo Links uten å endre lokal lagring eller øvrige ordkategorier.

## Ikke mål

- Ikke endre spillets 4×4-regler, poengmodell eller kategoridata for resten av appen.
- Ikke legge til kontoer, sporing eller annen lagring.

## Akseptansekriterier

- Når den fjerde gruppen blir riktig, blir alle kortene og korrekt tilbakemelding stående til eleven velger en eksplisitt «Se resultat»-handling.
- Kategorien `vær` vises som «vær og årstider» i Lingo Links, også i hint og løste kort.
- En ny runde starter med tom og nøytral tilbakemelding, selv om forrige runde sluttet med feil eller hint.

## Filer

- `index.html` — Lingo Links-tilstand og visning.
- `tests/lingo-links-game.spec.js` — Playwright-regresjonstester.

## Testplan

1. Legg til en test som feiler fordi siste gruppe nå skjuler brettet automatisk.
2. Implementer en eksplisitt overgang til resultat etter at sluttbrettet er synlig; kjør den nye testen grønn.
3. Legg til og kjør en test for kategorietiketten og tilbakestilt tilbakemelding ved ny runde.
4. Kjør `npx playwright test tests/lingo-links-game.spec.js --browser chromium`, `npm run check:content-accuracy` og `git diff --check`.
5. Verifiser samme flyt manuelt i nettleser ved desktop- og mobilbredde.
