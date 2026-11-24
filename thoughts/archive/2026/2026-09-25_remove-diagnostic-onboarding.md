# Fjern nivåtesten fra elevoppsett

## Mål

La nye og eksisterende elever komme direkte til Dagens quiz og de øvrige øvingsmodusene, uten nivåtest som krav eller synlig førstesteg.

## Ikke mål

- Ikke slett tidligere eksporterte diagnosefelt eller deres lesing ved import.
- Ikke endre læringsprogresjon, gloser, verb, grammatikk eller lytteinnhold.
- Ikke innfør kontoer, ny lagring eller persondata.

## Akseptansekriterier

- En ny elev ser ikke «Finn nivået mitt» eller «Start nivåtest».
- Dagens quiz kan startes direkte, også ved 390 px.
- Quizvelgeren på Gloser er ikke låst av manglende diagnose.
- Tidligere eksport med diagnosefelt kan fortsatt importeres.
- Det oppstår ikke horisontal scrolling på mobil.

## Filer

- `index.html` — fjern diagnosegating og synlig onboarding.
- `tests/start-page.spec.js` — dekk direkte oppstart for ny elev.
- `tests/mobile-polish.spec.js` — erstatt nivåtestforventning med direkte quiz.
- `README.md` — oppdater elevflyt og eksportbeskrivelse.

## Testplan

1. Endre startside-testen slik at den forventer Dagens quiz for en ny elev, og observer at den feiler.
2. Fjern gating og synlig diagnosepanel fra ordinær navigasjon; kjør startside-testen grønn.
3. Oppdater mobilregresjon og kjør relevant Playwright-gruppe ved 390 px.
4. Kjør `npm run build:app`, `git diff --check` og `npm run test:all`.
