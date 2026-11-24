# Implementeringsplan: Gradvis støtte i adaptive svarformer (spansk-ungdomsskole-6j4)

## Mål og akseptansekriterier
1. **Eksplisitt policy per øvingsfamilie**:
   - `vocabulary` (Gloser):
     - Styrke 0–1 (nytt/svakt) eller etter feil: `flip` (eller `choice`/`select` med distraktorer), synonymhint.
     - Styrke 2–3 (utviklende): `select` (nedtrekk) eller `typed` med `startsWith`-hint.
     - Styrke 4–5 (mestret): `typed` (full produksjon uten hjelp).
   - `mixedQuiz` (Dagens quiz):
     - Målfordeling `{ typed: 5, select: 3, choice: 2 }` bevares deterministisk.
     - `choice` tildeles de gjenkjennelseskandidatene som har lavest styrke, flest tilbakefall (lapses) eller nylig feil.
     - `select` tildeles gjenkjennelseskandidater med høyere mestring (styrke 2–3).
     - `typed` med `startsWith` tildeles produksjonsoppgaver med styrke < 3 eller etter tilbakefall.
     - `typed` uten hint kreves ved styrke >= 3/4.
   - `verbs` (Verbbøying):
     - Styrke 0–1 (nytt/svakt): synlige valgknapper / stammehjelp under skrivefeltet som støtter eleven.
     - Styrke 2–3 (utviklende): skriving med stammehint / endelseshjelp (`showVerbHint` lett tilgjengelig).
     - Styrke 4–5 (mestret): fri skriving eller utfordringsmodus (`yo hablo`).
   - `grammar` (Grammatikk):
     - Styrke 0–1: flervalgsknapper + norsk kontekst + lett tilgjengelig forklaring.
     - Styrke 2–3: nedtrekk / flervalg.
     - Styrke 4–5: mestringsutfordring.
2. **Synlig støtte etter feil**:
   - Når en elev feiler på en oppgave, registreres tilbakefall i `learningProgress`, og styrken synker.
   - I vokabularøkt: kort som feiles re-køes med `scaffoldedAfterError: true`, nedjustert svarform (f.eks. `typed` -> `select`), og UI viser merket «💡 Støtte etter feil».
   - I blandet quiz og påfølgende økter: gjenkjennelsesoppgaver som har hatt feil rykker frem til `choice` (flervalg) i stedet for `select`.
   - I verb: etter feil vises bøyingsskjema og eleven får valgknapper / stammehjelp på neste forsøk.
3. **Mestring og redusert støtte**:
   - Etter en serie korrekte forsøk (`updateProgressCell`: `0 -> 2 -> 3 -> 4 -> 5`) reduseres støtten trinnvis fra flervalg/nedtrekk til ren skriving.
4. **Forutsigbar og forklart i UI (ingen skjult profilering)**:
   - Tydelige merker i UI: «💡 Flervalg», «📝 Nedtrekk», «✍️ Skriv inn», «💡 Støtte etter feil».
   - All logikk er avledet direkte fra elevens lokale `learningProgress` og `cards`-SR-data, som kan eksporteres, inspiseres og nullstilles.
5. **Robusthet**:
   - Aksenter, alternative svar og eldre/importert progresjon uten `strength`-felt håndteres uten tap.

---

## Gjennomføringssteg

1. **Policy og hjelpefunksjoner i `index.html`**:
   - Definer `ADAPTIVE_SCAFFOLDING_POLICY`.
   - Implementer `getScaffoldedResponseMode(family, cell, options)` og `getScaffoldingUiBadge(family, mode, options)`.
   - Oppdater `getVocabularyResponseMode(srData, options)` til å støtte `scaffoldedAfterError` og lapse-sjekk.
   - Oppdater `rateCard(quality)` i vokabular til å sette `scaffoldedAfterError: true` og nedjustere `responseMode` ved feil.
   - Oppdater `showVocabCard` til å vise støttemerke ved `scaffoldedAfterError`.

2. **Blandet quiz (`buildMixedQuiz`)**:
   - Sorter `recognitionItems` etter mestringsbehov: laveste styrke og flest lapses får `choice`, høyere styrke får `select`.
   - For `typed`-oppgaver i mixed quiz: hvis kandidaten har `strength < 3` eller nylig lapse, legg til `answerConstraint: { type: 'startsWith', value: expected[0] }`.
   - Vis svarformsmerker («Flervalg», «Nedtrekk», «Skriv inn», «Støtte etter feil») i `renderMixedQuizQuestion`.

3. **Verbbøying (`verbs`)**:
   - I `showVerbExercise`: sjekk verbets mestringsgrad i `learningProgress.skillProgress`.
   - Hvis `strength < 2` eller `lapses > 0`: vis alternativ-knapper for de 4 personformene under `#verbInput` som utfyller feltet, samt støttemerke «💡 Støtte: Velg eller skriv».
   - Hvis `strength 2..3`: vis stammehint.
   - Hvis `strength >= 4`: ren skriving eller utfordring.

4. **Grammatikk (`grammar`)**:
   - I `showGrammarExercise`: vis mestrings- eller støttemerke basert på `skillProgress`.
   - Etter feil: forklar regelen og opplys om at neste forsøk får forsterket støtte.

5. **Tester**:
   - Opprett `tests/adaptive-scaffolding.spec.js` med grundige Playwright-tester.
   - Kjør `npm run build:app` og `npm run test:all`.
