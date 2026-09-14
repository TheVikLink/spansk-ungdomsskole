# Implementasjonsplan: Varierte øvelser for produktive uttrykksmønstre (spansk-ungdomsskole-63l)

## Bakgrunn og formål
Elever på ungdomsskolen (A0–A1) har stor nytte av **produktive uttrykksmønstre** («chunking» / setningsrammer): i stedet for å memorere isolerte gloser eller én stiv setning utenat, lærer de å hente fram en fast verbfrase (`tengo`, `quiero`, `me gusta`, `voy a`) og kombinere den fleksibelt med naturlige, alderstilpassede avslutninger (infinitiv, substantiv, faste tilstandsuttrykk).

---

## Kritiske hensyn fra teknisk og pedagogisk analyse

1. **`learning-progress-core.spec.js:34-46` bevares**:
   - `getGrammarTopicSkillId(topicId)` forventer en eksakt liste over 1:1-mappede emner.
   - `patterns` er et sammensatt emne med 4 ferdigheter (akkurat som `a0Foundation`), og skal **ikke** mappes 1:1 i `getGrammarTopicSkillId` (skal returnere `null`).
   - Hver enkelt oppgave i `patterns` har sin egen `skillId`, som håndteres direkte av `getGrammarExerciseSkillId(topicId, exercise)` via `if (exercise.skillId) return exercise.skillId;`.

2. **Leksjons-options skal ikke overskrive oppgavedistraktorer**:
   - Leksjonen `a1.patterns.productive` definerer `practice: { topicId: "patterns", label: "Øv på uttrykksmønstre" }` **uten** `options`.
   - Dette sikrer at `startGrammarExercises` ikke overskriver spesialtilpassede distraktorer (f.eks. `['Tengo', 'Soy', 'Estoy', 'Hago']` for L1-interferens).

3. **Katalogkrav**:
   - `scripts/check-learning-catalog.mjs`: `sourceNote: 'grammar-topic'` og `contentStatus: 'ready'`.
   - `scripts/check-grammar-lessons.mjs`: Minst 5 transfer-oppgaver, alle `skillId`-er finnes i `learningCatalog`, og `lesson.forms` følger skjemaet (`article`, `gender`, `number`).

4. **UI- og stillasintegrasjon**:
   - **Brainmap** (`index.html:19739`): Mappe de 4 mønster-ferdighetene i `getBrainmapSkillActionDescriptors()` til `{ kind: 'grammar', topicId: 'patterns', label: '...' }`.
   - **Pedagogisk feilforklaring** (`index.html:21852`): Legge til forklaring i `getGrammarMistakeExplanation('patterns')` som forklarer forskjellen på tilstand/alder (`tengo`), ønsker (`quiero`), like (`me gusta`) og planer (`voy a`).
   - **Stillas / Scaffolding** (`index.html:21750`): Legge til oppføring for `patterns` i `getGrammarScaffold(topic)`.
   - **Stjernelabler / chips** (`index.html:13000`): Mappe `a0.patterns.tengo`, `a1.patterns.quiero`, `a1.patterns.me_gusta`, `a1.patterns.voy_a` i `getQuizStarLabel(badge)` til korte etiketter: `'tengo'`, `'quiero'`, `'me gusta'`, `'voy a'`.

5. **Variasjonskontroll (2-pass i `selectGrammarExercises`)**:
   - For å unngå duplikate setninger i samme økt når alternativer finnes (Akseptansekriterium 3):
     - Pass 1: Velg rangerte oppgaver med unike `no`-nøkler (bevarer prioriteringsrekkefølgen due -> new -> weak).
     - Pass 2: Fyll på med eventuelle gjenværende oppgaver dersom kandidatutvalget har færre unike setninger enn `limit`.

6. **Pedagogisk distraktordesign og unngå tvetydighet**:
   - L1-interferens for tilstand: `___ hambre` («Jeg er sulten») -> `['Tengo', 'Soy', 'Estoy', 'Hago']` (norske elever oversetter ofte direkte til *Soy* eller *Estoy*).
   - Mønstervalg: `___ comer una manzana` («Jeg vil spise et eple») -> `['Quiero', 'Voy a', 'Me gusta', 'Tengo que']`.
   - `Tengo que estudiar`: Skrives som `___ que estudiar` (med fasit `Tengo`) eller `Tengo que ___` (med fasit `estudiar`), aldri `___ estudiar` med fasit `Tengo`.

7. **Setningspuslespill (index.html:22203)**:
   - 3–5 ord per puslespill for meningsfull kognitiv utfordring.
   - Punktum festet til siste ord (f.eks. `años.`, `música.`, `dormir.`).
   - Unngår duplikat mot `basic`-nivået (som allerede har *Me gusta el fútbol.*).

---

## Innhold: 4 mønstre, 24 temaoppgaver, 6 transferoppgaver, 12 puslespill

### Ferdighets-ID-er under `Setninger og uttrykk`:
1. `a0.patterns.tengo`: «Bruke uttrykk med tengo (tilstand, alder, eie)»
2. `a1.patterns.quiero`: «Uttrykke ønsker med quiero»
3. `a1.patterns.me_gusta`: «Uttrykke hva du liker med me gusta»
4. `a1.patterns.voy_a`: «Fortelle hva du skal gjøre med voy a»

---

## Gjennomføringssteg

1. **`learningCatalog.skills` (index.html)**:
   - Legg til de 4 mønster-ferdighetene under `group: 'Setninger og uttrykk'` med `contentStatus: 'ready'` og `sourceNote: 'grammar-topic'`.
   - Verifiser med `node scripts/check-learning-catalog.mjs`.

2. **UI- og støttefunksjoner (index.html)**:
   - `getQuizStarLabel(badge)`: Legg til `'tengo'`, `'quiero'`, `'me gusta'`, `'voy a'`.
   - `getBrainmapSkillActionDescriptors()`: Legg til oppføringer for de 4 mønstrene med `kind: 'grammar', topicId: 'patterns'`.
   - `getGrammarScaffold(topic)`: Legg til scaffold-støtte for `patterns`.
   - `getGrammarMistakeExplanation(topicId)`: Legg til feilforklaring for `patterns`.

3. **Variasjonskontroll i `selectGrammarExercises` (index.html)**:
   - Implementer 2-pass utvelgelse basert på `exercise.no` for å hindre duplikate setningsmeninger i samme økt.

4. **Leksjon i `grammar-lessons-data` (index.html)**:
   - Legg til leksjonen `a1.patterns.productive` med læringsmål, teori, eksempler, forms-tabell og 6 transfer-oppgaver.
   - Verifiser med `node scripts/check-grammar-lessons.mjs`.

5. **Grammatikktema i `grammarTopics.patterns` (index.html)**:
   - Opprett `patterns` med teori og 24 oppgaver fordelt på de fire mønstrene med L1-distraktorer og mønsterdistraktorer.
   - Sørg for at `getGrammarTopicSkillId('patterns')` returnerer `null`.

6. **Setningspuslespill i `sentencePuzzleBank.patterns` (index.html)**:
   - Legg til 12 mønsterpuslespill (3–5 ord per setning, punktum på siste ord).
   - Legg til valgknapp i UI (`sentencePuzzleSetup`).

7. **Testdekning og verifikasjon**:
   - Lag `tests/productive-patterns.spec.js` som dekker:
     - De 4 mønstrene og fasiter
     - Ingen overrapportering på verbkompetanse
     - Variasjonskontroll (ingen duplikater i 10-oppgavers økt)
     - Setningspuslespill for mønstre
     - L1-interferensdistraktorer
   - Oppdater `package.json` med `"test:productive-patterns"`.
   - Kjør `npm run build:app`.
   - Kjør `npm run test:all`.
