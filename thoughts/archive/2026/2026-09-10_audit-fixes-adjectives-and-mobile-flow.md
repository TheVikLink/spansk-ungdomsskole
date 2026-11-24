# Implementeringsplan: Kritiske rettelser etter brukeropptak 10. september 2026

## Kontekst og bakgrunn
Brukeropptakene (desktop 8 min og mobil 3.5 min, 10. september 2026) avdekket to kritiske blokkerende feil og to merkbare UX-svakheter:
1. **Adjektiv-katastrofe (`spansk-ungdomsskole-wo6`, P1 bug):** Ved oppstart fra leksjonen *Adjektivsamsvar - bøyning på -o* overskrives svaralternativene på alle temaets oppgaver med `["Alto", "Alta", "Altos", "Altas"]`. Dermed blir oppgaver som krever *pequeño, bonita, rica, simpática* umulige å besvare riktig.
2. **Nivåtest-felle på mobil (`spansk-ungdomsskole-uo4`, P1 feature):** Nivåtesten ligger som et inline-kort på Start-siden. Under scrolling trykkes den store knappen utilsiktet. Testen starter umiddelbart uten modal/sideisolasjon, mangler Avbryt- eller Tilbake-knapp (✕), og fanger eleven i en 12-oppgavers sekvens.
3. **Trippel-tekst redundans i quiz (`spansk-ungdomsskole-ld9`, P2 task):** Oversettelsesoppgaver gjentar samme setning 3 ganger (instruksjon, overskrift, og blå «Norsk kontekst»-ramme).
4. **Lagringslekkasje ved sletting (`spansk-ungdomsskole-wco`, P2 bug):** `spansk123_dailyAskedIds` utelates fra `clearAllLocalAppData()`.

---

## Mål og avgrensning
* **Mål:** Rette de to P1-feilene og de to tilknyttede UX-feilene i `index.html`, støttet av Playwright-regresjonstester.
* **Avgrensning:** Ingen nye skyløsninger, ingen backend, ingen arkitekturomskriving; bevare all eksisterende lokal lagring og formatkompatibilitet.

---

## Arbeidspakker og rekkefølge

### Trinn 1: Fiks overskriving av oppgavealternativer (`spansk-ungdomsskole-wo6`)
* **Problem:** I `startGrammarExercises(options)` ([`index.html:21653-21658`](file:///Users/olehenrikvik/spansk-ungdomsskole/index.html#L21653-L21658)):
  ```javascript
  if (lesson?.practice?.options) {
      grammarExercises = grammarExercises.map(exercise => ({
          ...exercise,
          options: [...lesson.practice.options]
      }));
  }
  ```
* **Endring:** Oppgaver som har egne definerte alternativer (`exercise.options && exercise.options.length > 0`) skal beholde disse. `lesson.practice.options` skal kun brukes som reserve for oppgaver som mangler egne `options` (f.eks. enkle artikkelhulloppgaver).
  ```javascript
  if (lesson?.practice?.options) {
      grammarExercises = grammarExercises.map(exercise => ({
          ...exercise,
          options: (Array.isArray(exercise.options) && exercise.options.length > 0)
              ? exercise.options
              : [...lesson.practice.options]
      }));
  }
  ```
* **Test:** Utvide `tests/grammar-lessons.spec.js` med en test som starter øving fra `a1.adjectives.regular_o` og verifiserer at:
  * `El perro es ___` har alternativene `pequeño, pequeña, pequeños, pequeñas` (og godkjenner `pequeño`).
  * `La casa es muy ___` har alternativene `bonito, bonita, bonitos, bonitas` (og godkjenner `bonita`).
  * Ingen oppgaver får overskrevet alternativene med *alto/alta/altos/altas* når fasit er et annet adjektiv.

---

### Trinn 2: Isoler nivåtesten med avbryt-knapp (`spansk-ungdomsskole-uo4`)
* **Problem:** På mobil og desktop starter nivåtesten direkte inne i `#homePage` i `#diagnosisSection`. Eleven har ingen måte å avbryte på, og utilsiktet trykk under scrolling låser eleven.
* **Endring:**
  1. **UI-struktur:** La Start-siden ha et rent introduksjonskort:
     * *«Finn nivået ditt»*
     * *«Svar på 12 korte spørsmål for å få et tilpasset startpunkt (ca. 5 min).»*
     * Knapp: `[ Ta nivåtesten → ]`
  2. **Dedikert visning:** Ved klikk på knappen åpnes en dedikert, fokusert fullskjermsvisning (`#diagnosisScreen` eller fokusert overlegg) der toppnav skjules under aktiv test for å unngå feiltrykk og distraksjon.
  3. **Avbryt-handling:** Øverst i visningen legges det til en tydelig `✕ Avslutt`-knapp.
     * Ved trykk: Vis en bekreftelse (`confirm('Vil du avbryte nivåtesten? Ufullstendige svar lagres ikke som et ferdig resultat.')`).
     * Hvis bekreftet: Tilbakestill pågående deltilstand trygt og returner til Start-siden.
* **Test:** Ny test i `tests/diagnosis-flow.spec.js`:
  * Verifisere at nivåtesten har synlig `Avslutt/Avbryt`-knapp.
  * Verifisere at avbrudd ber om bekreftelse og returnerer til Start uten korrupt tilstand.
  * Verifisere fullføring til resultatskjerm ved alle 12 svar.
  * Verifisere visning på mobilbredde (390px) og desktop (1440px).

---

### Trinn 3: Fjern trippel-tekst redundans i blandet quiz (`spansk-ungdomsskole-ld9`)
* **Problem:** I blandet quiz ([`index.html:18380-18450`](file:///Users/olehenrikvik/spansk-ungdomsskole/index.html#L18380-L18450)) vises:
  1. Instruksjon: «Velg den spanske setningen som betyr «X»»
  2. Prompt: «X»
  3. Blå boks: «NORSK KONTEKST: X»
* **Endring:** I `renderMixedQuizQuestion()`:
  * Hvis `prompt.trim().toLowerCase() === norwegianContext.trim().toLowerCase()`, skjul den ekstra boksen `NORSK KONTEKST`.
  * Vis kun «NORSK KONTEKST» når setningen som skal fylles ut er på spansk (f.eks. *«_____ en Oslo»* der eleven trenger å vite at det betyr *«Jeg bor i Oslo»*).
* **Test:** Test i `tests/adaptive-quiz.spec.js` som bekrefter at oversettelser ikke viser redundant kontekstboks.

---

### Trinn 4: Slett `spansk123_dailyAskedIds` ved nullstilling (`spansk-ungdomsskole-wco`)
* **Problem:** `clearAllLocalAppData()` ([`index.html:12157`](file:///Users/olehenrikvik/spansk-ungdomsskole/index.html#L12157)) mangler `spansk123_dailyAskedIds`.
* **Endring:** Legg til `'spansk123_dailyAskedIds'` i `appKeys`.
* **Test:** Oppdatere testen `delete-all-data clears preserved recovery payloads too` i `tests/backup-privacy.spec.js`.

---

## Verifikasjonsplan

1. **Enhetstester / Playwright fokus-kjøringer:**
   * `npx playwright test tests/grammar-lessons.spec.js`
   * `npx playwright test tests/diagnosis-flow.spec.js`
   * `npx playwright test tests/adaptive-quiz.spec.js`
   * `npx playwright test tests/backup-privacy.spec.js`
2. **App-bygg:**
   * `npm run build:app` (oppdaterer CSS og `APP_BUILD`-stempel)
3. **Full regresjonstest:**
   * `npm run test:all` (alle 349+ tester må forbli 100 % grønne)
