# Anbefalte ord etter tema

Beads: `spansk-ungdomsskole-rbec.4.5`

Eleven skal få uøvde, nyttige standardord på Start med en kort forklaring på hvorfor de ble valgt.

1. I `index.html`, behold den prioriterte startlisten. Fortsett med ord fra flere vanlige tema når startordene er brukt. Bruk eksisterende kanoniske ID-er, kategorier og ordprogresjon.
2. Gi plass til inntil to temaer der eleven de siste 14 dagene har vist god fremgang på minst to ulike ord. Bruk styrke 4 eller 5 i en retning etter minst tre forsøk. Bruk lagret repetisjonshistorikk som grunnlag for eldre ordkort når nyere retningsprogresjon mangler. Av fem plasser går normalt tre til prioriterte tema og to til andre tema. Fyll ledige plasser fra ord som fortsatt er tilgjengelige.
3. Vis en begrunnelse for ordutvalget ved valgt øktstørrelse. Bruk bare lokal progresjon og ordliste. Denne versjonen bruker temaer fra ordlista, mens grammatikkoblinger og innholdsrevisjon er egne endringer.
4. I `tests/home-vocabulary-review.spec.js`, sjekk stabil startliste, nylig mestring, svak og eldre historikk, variasjon, riktig begrunnelse og videre anbefalinger etter startlista. Kjør `npx playwright test tests/home-vocabulary-review.spec.js --browser chromium`, `npm run build:app`, `npm run test:all` og `git diff --check`.
