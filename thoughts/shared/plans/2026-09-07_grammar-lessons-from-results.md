# Implementeringsplan: «Lær mer» fra quizresultater

Opprettet: 2026-09-07. Ferdigstilt: 2026-09-08. Beads: `spansk-ungdomsskole-z6i` (åpen; implementering er ikke startet).

## 1. Mål og bindende avgrensning

Eleven skal kunne åpne en kort, relevant grammatikkleksjon fra et ferdig resultat, lese forklaringen, gå tilbake uten ny registrering og eventuelt starte en ny, målrettet økt.

Planen er en utføringsspesifikasjon. Følg delstegene i rekkefølge. Registrer arbeidsstatus i Beads, ikke ved å gjøre dette dokumentet til en parallell oppgaveliste.

Arbeidsantakelse for inngangene: blandet quiz er hovedinngangen, med «Lær mer» ved relevante besvarte oppgaver; grammatikkøkten får samme leksjon som en anbefaling under de summerte resultatene. Dette følger brukerens opprinnelige beskrivelse av siste quizside og den påfølgende avklaringen av grammatikkøkter.

Første leveranse inneholder én leksjon om valg av formen `el/la/los/las`. Andre leksjoner, fullstendig bibliotek, søk, lydavspilling, bokmerker, URL-ruting, ny gjennomgang av enkeltoppgaver i grammatikkøkter og nye elevdata i lagring er utenfor piloten. Behold dagens avbryt-flyt for blandet quiz: avbrudd går tilbake til start og oppretter ikke en ferdig quiz.

Vi endrer ikke eksisterende ferdighets-ID-er, progresjonsskjemaer eller oppgaverekkefølge i innholdsbanken. Innfør ingen backend, LLM-kall i elevflyten eller analyse av elevenes bruk. Ingen push, deploy eller publisering av leksjonen uten separat bestilling/godkjenning.

## 2. Kodekart og verifisert utgangspunkt

Linjenumrene gjelder ved planlegging og vil flytte seg. Søk etter funksjonsnavnene før redigering.

| Område | Finn i `index.html` | Betydning for endringen |
| --- | --- | --- |
| Grammatikkpanel | `id="grammarPage"`, ca. 384 | Temavalg, førteori og oppgaver ligger her. |
| Ferdighetskobling | `getGrammarExerciseSkillId`, ca. 10915 | Artikler skilles allerede i ubestemt entall, bestemt entall og bestemt flertall. |
| Quizkandidater | `buildGrammarSkillCandidates`, ca. 11668 | Kandidat har `targetType: 'skill'` og `targetId`. Oppgave-ID bygger på tema og indeks. |
| Leksehistorikk | `recordPracticeSession`, ca. 12224 | Øker ord, riktige, økter og minutter. Skal aldri kalles av teorivisning eller retur. |
| Navigasjon | `showPage`, `abandonActiveSession`, ca. 13212 | `showPage('grammar')` og `showPage('vocab')` tilbakestiller undervalg. Ikke bruk dem for retur til et bevart resultat. |
| Quizsvar | `submitMixedQuizAnswer`, ca. 16540 | `mixedQuizState.results` har svar/resultat, men mangler `targetType/targetId`. |
| Quizavslutning | `finishMixedQuiz`, ca. 16604 | Blander registrering, quizrekke, merker og tegning av resultater. |
| Quizgjennomgang | `.mixed-quiz-review-item` | Har allerede `<details>` med hvert svar; feil er åpne og riktige er lukket. |
| Globale snarveier | `setupKeyboardShortcuts`, ca. 16744 | Kan reagere på skjulte knapper; må ikke overstyre teorisidens knapper. |
| Oppgavebank | `const grammarTopics = {`, ca. 18934 | `articles` har 15 oppgaver; 11 med bestemt artikkel og 4 med `un/una`. |
| Førteori | `startGrammarTopic`, `showGrammarTheory`, ca. 19434/19536 | Automatisk første gang/etter feil. Setter `hasSeenTheory` og lagrer. Ikke bruk for ny teoriside. |
| Oppgavestart | `startGrammarExercises`, ca. 19568 | Velger opptil 10 oppgaver adaptivt fra temaet. |
| Grammatikkregistrering | `selectGrammarAnswer`, ca. 19630 | Skriver ferdighets- og temaprogresjon ved svar. Mangler eksplisitt vern mot gjentatt innsending. |
| Grammatikkavslutning | `endGrammarSession`, ca. 19709 | Registrerer i dag planlagt oppgavetall, også ved avbrudd, og tegner resultat i samme funksjon. |

Grammatikkens resultatside viser summerte tall, ikke en svarliste. Behold denne forskjellen mellom de to resultatvisningene.

`AGENTS.md` har en foreldet setning om manglende tester. `package.json` og `tests/` inneholder et fungerende Playwright-oppsett. Verifisert ved planlegging:

```sh
npx playwright test tests/grammar-explanations.spec.js tests/completion-header.spec.js tests/quiz-streaks.spec.js --browser chromium --workers=1
```

Resultat: 16 tester bestod. Dette verifiserer eksisterende funksjonalitet, ikke den planlagte endringen.

## 3. Filer som implementeringen skal berøre

Alle stier er relative til `/Users/olehenrikvik/spansk-ungdomsskole`.

| Fil | Arbeid |
| --- | --- |
| `index.html` | Innebygd leksjonsdata, delt regelinnhold, resultatsnapshots, teoriside, navigasjon og målrettet øving. |
| `src/styles/tailwind.css` | Avgrensede stiler for leksjon og anbefalinger. Gjenbruk eksisterende knapper og farger. |
| `dist/tailwind.css` | Genereres med eksisterende byggkommando etter CSS-endringer. Ikke rediger manuelt. |
| `tests/grammar-lessons.spec.js` (ny) | Leksjonsdata, relevans, publisering, delt førteori, målrettet øving og tilgjengelighet. |
| `tests/result-theory-navigation.spec.js` (ny) | Svar-/avslutningsvern, retur, avbrudd, lagring og blandet quiz. |
| `tests/completion-header.spec.js` | Oppdater grammatikk-fixturen til faktisk besvarte oppgaver. Behold eksisterende forventninger for 9/10 riktig. |
| `tests/grammar-explanations.spec.js` | Tilpass eksisterende syntetiske økter til den nye minnetilstanden, og behold feedbacktestene. |
| `package.json` | Legg til `test:grammar-lessons` og ta den med i `test:all`. |
| `README.md` | Kort beskrivelse av elevflyt, innholdsstatus, godkjenning og at resultat/svarhistorikk her bare lever i minnet. |

Beads oppdateres gjennom CLI. Ikke rediger `.beads/issues.jsonl` manuelt. Ingen endring i `sw.js` trengs for nye filer: leksjonen bygges inn i HTML. Cacheversjon ved en senere utrulling er en egen leveringshandling.

Arbeidstreet er skittent, også `index.html`, med tidligere brukerarbeid. Før implementering: les `git diff -- index.html`, opprett en feature branch fra gjeldende `main` uten å kaste endringer, og begrens egne patcher. Ikke stash, tilbakestill, formatter hele filen eller commit alt. Bevar glosereview, historieutkast, Lingo Links og øvrige endringer.

## 4. Leksjonsdata og innholdskontrakt

### 4.1 Én kilde, også ved åpning som lokal fil

Legg inn `<script type="application/json" id="grammar-lessons-data">` ved den eksisterende JSON-blokken for diagnose, før hovedskriptet. Les blokken én gang med `JSON.parse` til `grammarLessonCatalog` før katalogen brukes. Dette følger et mønster som allerede finnes, og virker med `file://` uten `fetch`.

Ikke opprett en ekstra JSON-kopi som må synkroniseres. Ikke legg elevens svar inn i innholdsblokken. Vanlig tekst i innholdet rendres med `escapeHtml`, og spanske eksempler får `lang="es"`.

Følgende er startinnholdet som skal implementeres som utkast:

```json
{
  "schemaVersion": 1,
  "lessons": [
    {
      "id": "a0.articles.definite",
      "level": "A0",
      "category": "Artikler og substantiv",
      "title": "Velg el, la, los eller las",
      "status": "draft",
      "reviewedBy": null,
      "reviewedAt": null,
      "learningGoal": "Jeg kan velge el, la, los eller las ut fra substantivets kjønn og tall.",
      "explanation": "Her øver du på formen til den bestemte artikkelen. Se på substantivet: Er det hankjønn eller hunkjønn? Er det én eller flere? På norsk sitter den bestemte formen ofte på slutten av ordet, som i boka og bøkene.",
      "forms": [
        { "article": "el", "gender": "hankjønn", "number": "entall" },
        { "article": "la", "gender": "hunkjønn", "number": "entall" },
        { "article": "los", "gender": "hankjønn", "number": "flertall" },
        { "article": "las", "gender": "hunkjønn", "number": "flertall" }
      ],
      "examples": [
        { "es": "El libro es rojo.", "no": "Boka er rød." },
        { "es": "Los libros son rojos.", "no": "Bøkene er røde." },
        { "es": "La mochila es negra.", "no": "Sekken er svart." },
        { "es": "Las mochilas son negras.", "no": "Sekkene er svarte." }
      ],
      "tip": "Lær gjerne substantivet sammen med artikkelen. Hovedregelen er at substantiv som ender på -a har la, og substantiv som ender på -o har el. Men det finnes unntak, som el día, substantiv som ender på -ma (el problema) og la mano.",
      "shortHint": "Velg bestemt artikkel etter substantivets kjønn og tall.",
      "prerequisites": ["Du kjenner forskjellen på entall og flertall. Kjønnet til substantivet må være kjent eller oppgitt."],
      "skillIds": ["a0.articles.definite_singular", "a0.articles.definite_plural"],
      "practice": {
        "topicId": "articles",
        "label": "Øv på el, la, los og las"
      },
      "transferExercises": [
        {
          "id": "a0.articles.definite.transfer.bicicletas",
          "skillId": "a0.articles.definite_plural",
          "sentence": "___ bicicletas son nuevas",
          "no": "Syklene er nye.",
          "answer": "Las",
          "options": ["El", "La", "Los", "Las"],
          "hint": "bicicletas er feminin flertall"
        },
        {
          "id": "a0.articles.definite.transfer.ventanas",
          "skillId": "a0.articles.definite_plural",
          "sentence": "___ ventanas están abiertas",
          "no": "Vinduene står åpne.",
          "answer": "Las",
          "options": ["El", "La", "Los", "Las"],
          "hint": "ventanas ender på -a og er feminin flertall"
        },
        {
          "id": "a0.articles.definite.transfer.flores",
          "skillId": "a0.articles.definite_plural",
          "sentence": "___ flores son bonitas",
          "no": "Blomstene er fine.",
          "answer": "Las",
          "options": ["El", "La", "Los", "Las"],
          "hint": "flores er hunkjønn flertall"
        },
        {
          "id": "a0.articles.definite.transfer.problema",
          "skillId": "a0.articles.definite_singular",
          "sentence": "___ problema es difícil",
          "no": "Problemet er vanskelig.",
          "answer": "El",
          "options": ["El", "La", "Los", "Las"],
          "hint": "problema ender på -ma, men er hankjønn"
        },
        {
          "id": "a0.articles.definite.transfer.perros",
          "skillId": "a0.articles.definite_plural",
          "sentence": "___ perros son grandes",
          "no": "Hundene er store.",
          "answer": "Los",
          "options": ["El", "La", "Los", "Las"],
          "hint": "perros ender på -o og er maskulin flertall"
        }
      ],
      "recommendedNext": null,
      "relatedLessonIds": []
    }
  ]
}
```

`id` identifiserer leksjonen; den er ikke en ny progresjonsferdighet. `skillIds` er den eneste listen for både relevans og oppgavefilter. Ikke dupliser listen under `practice`.

`forms` brukes også til å lage et kort sammendrag av de fire formene i hint. Eksemplene er egne setninger; artikkelen skal fremheves. Ikke innfør HTML i innholdsverdiene for fremheving; bruk første artikkel som et separat escaped tekstfragment ved rendering.

### 4.2 Publisering og validering

- Tillatte statuser: `draft`, `reviewed`, `published`.
- Nye elevlenker og hele teorisiden er tilgjengelige bare når status er `published`.
- Brukeren godkjenner forklaring, oversettelser, eksempler, vanskelighetsgrad og oppgaveutvalg. Implementeringsmodellen kan ikke godkjenne seg selv eller fylle inn fiktiv godkjenner/dato.
- Ved godkjenning settes `reviewedBy` og ISO-dato i `reviewedAt`; status blir `reviewed`. Etter eksplisitt beslutning om aktivering kan den settes til `published`. Dette er innholdsstatus, ikke tillatelse til deploy.
- Teknisk arbeid kan ferdigstilles med `draft`. Publisert flyt testes ved å sette status/metadata i testens minnekopi. Lever tekst og lokal testdokumentasjon for godkjenning; ikke bygg en redaktørportal eller elevtilgjengelig forhåndsvisningsbryter.
- Første leksjon har ingen naboer. Senere relasjoner til eksisterende utkast er lov. Render bare publiserte mål, filtrer selvlenker og dubletter, og skjul tomme seksjoner. `recommendedNext` vises én gang og dupliseres ikke under relaterte.
- Valider unik leksjons-ID, felttyper, ikke-tomme læringsmål/eksempler, alle fire artikler, gyldige ferdigheter og øvingstema. Publisert innhold krever review-metadata og minst én faktisk øvingsoppgave. En relasjons-ID som ikke finnes er en valideringsfeil; lenker til eksisterende upublisert innhold er ikke feil.
- Feil i katalogen skal ikke ødelegge resten av appen: fang parsefeil, bruk tom katalog, logg én teknisk feilmelding og vis ingen elevlenke. Dagens generelle teori-/regelkontroll skal fortsatt fungere. Test også denne feilstien.

### 4.3 Førteori uten dupliserte regler

Behold artikkeltemaets førteori i sin helhet: `un/una`, den eksisterende hardkodede tabellen for `el/la/los/las`, ordendelser og unntak. Den hardkodede tabellen er den statiske reservekilden.

Legg et tydelig, statisk avgrenset område rundt den eksisterende tabellen, for eksempel `<div data-grammar-theory-slot="definite-articles">…eksisterende tabell…</div>`. Lag `getGrammarTheoryContent(topic)` som kun erstatter innholdet i dette området med en formtabell generert fra `forms` når katalogen er gyldig og pilotlessonen finnes. Bruk funksjonen i `showGrammarTheory()` i stedet for direkte `topic.theory.content`. Dersom katalogen ikke kan leses, eller piloten mangler, returnerer funksjonen den uendrede hardkodede teorien inkludert alle seks formene (`un`, `una`, `el`, `la`, `los`, `las`).

Grunnen til et statisk område: `scripts/lib/extract-all-items.mjs` evaluerer `grammarTopics` isolert. Et direkte funksjonskall eller en referanse til `grammarLessonCatalog` inni objektinitialiseringen bryter ekstraktoren. La objektet være selvstendig evaluerbart og ha en komplett teori dersom etterfølgende runtime-kode feiler.

Den dynamiske formtabellen kan gjenbrukes fra katalogen selv om den nye, fullstendige leksjonssiden er et utkast. Utvidet utkasttekst og nye eksempler vises ikke i førteorien før godkjenning. Førteorien skal fortsatt inneholde både bestemte og ubestemte artikler, også ved katalogfeil.

Endre `getGrammarMistakeExplanation(topicId, exercise = null)` med valgfritt ekstra argument. For bestemte artikkeloppgaver brukes `shortHint` + sammendrag generert fra `forms`; for ubestemte og andre temaer beholdes nødvendig gammel forklaring. Gamle kall med ett argument skal fortsatt fungere. Mønsterkortet for hele artikkeltemaet beholdes, fordi det dekker hele økten.

## 5. Tilstand og funksjonskontrakter

### 5.1 Grammatikk: besvarte oppgaver er sannhetskilden

Legg til `grammarSession = null`. Behold eksisterende variabler (`grammarExercises`, `grammarCurrentIndex`, `grammarStats` osv.) for å unngå omfattende omskriving. Ny minnetilstand ved start:

```js
grammarSession = {
  topicId: 'articles',
  lessonId: null, // eller pilotens ID ved målrettet øving
  filterSkillIds: null, // null betyr hele temaet; kopiert liste ved leksjonsøkt
  plannedCount: grammarExercises.length,
  startedAt: new Date().toISOString(),
  answers: [],
  result: null
};
// Én svarpost:
// { exerciseIndex, skillId, correct }
// Ferdig resultat:
// { topicId, topicName, lessonId, filterSkillIds, plannedCount,
//   answeredCount, correctCount, errorCount, accuracy, durationMinutes,
//   endedEarly, answers }
```

En svarpost trenger ikke inneholde elevens tekst eller hele oppgaven. Indeksen gjelder den valgte øvingskøen; ikke bruk den som stabil kilde-ID eller til relasjoner mellom leksjoner.

I `selectGrammarAnswer`:

1. Returner uten sideeffekter hvis økten mangler, har ferdig resultat, aktuell oppgave mangler eller samme `exerciseIndex` allerede er besvart.
2. Beregn resultat og ferdighets-ID. Legg én post i `answers` før annen håndtering som kan trigges på nytt.
3. Utfør dagens progresjonsoppdateringer én gang. Behold gradering og feedback.
4. Sett faktisk `disabled = true` på svaralternativene, ikke bare CSS-klassen. Behold «Neste» aktiv og fokuserbar. Deaktiver hint etter svar slik at det ikke erstatter feedback og fjerner «Neste».

I `advanceGrammarExercise`: gå bare videre dersom aktuell indeks er besvart og økten ikke er avsluttet. Dette stopper dobbel Enter/dobbeltklikk fra å hoppe over neste oppgave.

`grammarStats.total` kan fortsatt beskrive kølengde under øving. Bruk aldri dette feltet som antall besvarte ved avslutning. Resultatet beregnes fra `answers`; en oppgave som er besvart men hvor eleven ennå ikke har trykket «Neste», skal telles.

### 5.2 Avslutt én gang, render uten skriving

Del dagens `endGrammarSession()` i:

- `finalizeGrammarSession()` beregner og lagrer resultat i minnet én gang og registrerer én økt hvis `answeredCount > 0`. Returverdien er samme snapshot ved gjentatte kall. Sett `grammarSession.result` før registrering for å hindre gjeninntreden. Ikke kall `saveGrammarProgress` eller `updateLearningProgress` igjen; de er allerede oppdatert ved svar.
- `renderGrammarResult(result)` oppdaterer bare DOM, fokus og synlighet. Leser aldri ny øvingstid og skriver aldri lagring.
- `endGrammarSession()` blir en tynn kompatibel wrapper: finaliser, sett `activeSessionType = null`, vis resultat.

Ingen svar: vis «Ingen oppgaver besvart», 0 besvarte og ingen prosent/mestringspåstand, og ikke registrer en nulløkt. Ved avbrudd etter 3 av 10: vis antall riktige av 3, samt «3 av 10 oppgaver besvart». Ikke vis 10/10 eller 100 % fremdrift. Ved fullført økt behold dagens 100 % fremdrift og tellere. Unngå påstanden «Du mestrer temaet» som konklusjon etter noen få besvarte oppgaver; bruk «Godt jobbet!».

Snapshot skal kopiere svarposter og filterlisten, ikke beholde referanser til mutable øktlister. `accuracy` er `null` ved null svar, ellers avrundet prosent av besvarte; `endedEarly` er `answeredCount < plannedCount`. Tittel ved avbrudd er «Økten er avsluttet», ved fullføring beholdes tematitlene. Resultatsnapshot er skrivebeskyttet etter oppretting; visningsfunksjoner skal ikke endre det.

Avslutt-knappen under førteori går til temavalget uten øktregistrering dersom ingen øvingsøkt er startet. Skjul den aktive øktens Avslutt-knapp på resultatet; behold de eksisterende resultathodene som testene bruker. Ny økt viser Avslutt igjen.

Tiden fryses ved første finalisering. Teoritid etter dette må aldri bli nye lekseminutter. Ny målrettet økt får nytt starttidspunkt etter lesingen.

### 5.3 Blandet quiz: bevar dagens resultater og registrering

Utvid svarpostene i `submitMixedQuizAnswer` med `targetType` og `targetId` kopiert direkte fra den besvarte oppgaven. Ikke tolk spørsmåls-ID, spansk tekst eller fasit for å gjette ferdigheten. Ordforrådsposter (`targetType: 'word'`) skal ikke få grammatikklenker.

Del `finishMixedQuiz()` tilsvarende:

- Første kall tar snapshot av besvarte resultater, total/riktig/accuracy, quizrekke og merkene som tildeles. Behold dagens betingelse om fullført quiz for `recordPracticeSession`, `completeQuizForToday` og `addTodayAskedQuestionIds`.
- `awardMasteryBadges` kjøres bare under første finalisering, ikke under rendering. Lagre `newlyEarned` i resultatet slik at merket fortsatt vises ved retur.
- Lagre snapshot som `mixedQuizState.finalResult`; gjentatte `finishMixedQuiz()`-kall skal bare vise samme resultat.
- `renderMixedQuizResult(result)` får dagens HTML. Ingen registrering, merketildeling eller lagring i denne funksjonen.
- Ny quiz starter med `finalResult: null`. `submitMixedQuizAnswer` avviser også kall etter finalisering.
- Behold dagens avslutning ved avbrudd (`endMixedQuizEarly`) uten å opprette en ny resultatside.

Snapshotkontrakten for blandet quiz er `{ total, answeredCount, correctCount, accuracy, results, quizStats, newlyMastered }`. Kopier `results` inkludert `correctAnswers`, og kopier statistikk/merkelister slik at senere oppdateringer ikke endrer det gamle resultatet. `renderMixedQuizResult` skal bruke disse verdiene, ikke hente nye statistikker fra lagring. Behold eksisterende `mixedQuizState.correct/answered` som kilder til totalsummene slik at gamle tester med syntetisk quiztilstand fortsatt er gyldige.

Legg samme fremrykkingsvern i `advanceMixedQuizQuestion`: ingen videreføring etter finalisering eller før aktuell indeks har fått et svar (`answered > index`). Gjentatt Enter skal ikke hoppe over et spørsmål.

Gamle syntetiske testresultater uten `targetType/targetId` skal fortsatt vises, bare uten «Lær mer». Ikke migrer lagring for å støtte disse minnefeltene.

## 6. Relevans og knapper

Lag en ren hjelpefunksjon:

```js
getRelevantGrammarLessons(answeredItems, lessons)
// answeredItems: [{ skillId: string, correct: boolean }]
// output: relevante publiserte leksjoner, uten dubletter
```

En leksjon er relevant hvis minst én besvart post har `skillId` i leksjonens `skillIds`. Sorter først leksjoner med feil, deretter synkende antall feil, så behold katalogrekkefølge for lik rangering. Ingen feilkrav. Tom besvartliste gir tomt resultat. Funksjonen må ikke mutere inngangene.

I grammatikkresultatet: én oppføring per relevant leksjon under «Lær mer», med leksjonstittel og en knapp med synlig tekst «Lær mer». Skjul hele seksjonen hvis tom.

I blandet quiz: legg lenken inni aktuell oppgaves `<details>`, etter forklaring, utenfor `<summary>`. Bruk postens `targetType/targetId`. Både riktige og gale besvarte oppgaver får tilgang; behold eksisterende åpnet/lukket tilstand og rekkefølge. Sortering av leksjoner gjelder hvis én oppgave senere matcher flere, ikke omrekkefølge av quizsvarene.

Knappene får `aria-label="Lær mer: Velg el, la, los eller las"`, `type="button"` og `data-lesson-id`. Bind hendelser til kjente leksjons-ID-er, ikke til innholdstekst interpolert i inline-JavaScript. Ikke legg knapper inni temaknapper eller inni `<summary>`.

## 7. Teoriside og retur

### 7.1 Panel og leseflyt

Legg et eget skjult søskenpanel `#grammarLessonPage` ved de øvrige hovedpanelene. Det inneholder et `<article>` med:

1. «Tilbake til resultatet» øverst.
2. Nivå, kategori, overskrift og ett læringsmål.
3. Forklaring og formtabell.
4. Fire spanske eksempler med norsk oversettelse rett under.
5. «Husk dette» med tipset.
6. Publisert anbefalt fortsettelse og publiserte relasjoner når de finnes.
7. «Øv på el, la, los og las» og teksten «Starter en ny økt.».

Forutsetningsteksten vises diskret under læringsmålet. Ingen forfatterbilde, krav om innlogging, lesekvittering eller tekniske redaksjonsfelt i elevvisningen. La innholdet flyte i én kolonne på mobil; bruk begrenset lesebredde på stor skjerm.

### 7.2 Konkret navigasjonskontrakt

Legg til `grammarLessonView = null`, med `{ sourcePanelId, triggerElement, scrollY, rootLessonId, currentLessonId }` mens eleven leser. Opprett tilstanden bare fra et ferdig resultat.

`openGrammarLesson(lessonId, triggerElement)`:

- Avvis ukjent/upublisert leksjon før DOM endres.
- Avvis åpning mens `activeSessionType` angir aktiv øving.
- Bevar kildepanelet (`vocabPage` eller `grammarPage`) og triggeren. Skjul kildepanelet, men ikke tøm eller render det på nytt.
- Vis `grammarLessonPage`, render valgt leksjon, fokusér overskriften med `tabindex="-1"` og flytt til toppen.
- Ikke kall `showPage`, `showGrammarTheory`, `finishMixedQuiz` eller `endGrammarSession`.

Lenke til relatert leksjon oppdaterer bare `currentLessonId`. Den skal ikke overskrive resultatets opprinnelige trigger, scroll eller kilde. «Tilbake til resultatet» går alltid til opprinnelig resultat, også etter flere relaterte leksjoner.

`returnFromGrammarLesson()`:

- Skjul/tøm lesepanelet og vis bevart kildepanel.
- Ikke kall en avslutningsfunksjon eller `showPage`.
- Fordi kilde-DOM bevares, er åpne `<details>`, resultattekster og merker uendret.
- Gjenopprett scroll og fokus til triggeren med `preventScroll: true`. Hvis triggeren ikke finnes, fokusér resultatoverskriften.
- Nullstill `grammarLessonView` etter retur.

Utvid `showPage` slik at vanlig fanebytte også skjuler lesepanelet og forkaster lesekonteksten. Ikke legg det nye panelet til som en ny hovedfane. Behold opprinnelig fane aktiv mens teorien vises. En senere retur til Grammatikk via toppmenyen skal fortsatt vise vanlig temavalg.

Fang ikke nettleserens historikk i piloten. Den uttrykkelige «Tilbake til resultatet»-knappen er returmekanismen. I `setupKeyboardShortcuts`, returner fra øvingssnarveiene når teoripanelet er synlig, uten `preventDefault`; da får native Enter/Space på teoriknapper virke og skjulte øvingsknapper trigges ikke.

Ingen av lesefunksjonene skal skrive `hasSeenTheory`, progresjon, elevsvar, quizstatistikk eller minutter. Full sideoppdatering kan miste resultatet; ny gjenoppretting fra lagring inngår ikke.

## 8. Målrettet øving

Utvid `startGrammarExercises(options = {})` slik at nye økter får et eksplisitt utvalg. En tom options-verdi betyr hele `currentGrammarTopic`; den skal ikke arve et gammelt filter.

Optionskontrakten er `{ lessonId: null, filterSkillIds: null }`, med kopierte verdier når en leksjonsøkt startes. `null` betyr hele temaet; en tom liste betyr ingen tillatte ferdigheter og skal gi den kontrollerte tom-filter-feilen. Hvis `lessonId` er satt, må filteret samsvare med den publiserte leksjonens ferdigheter. Ikke tillat motstridende valg.

Lag `startGrammarLessonPractice(lessonId)` og `restartGrammarPractice()`:

- Leksjonsstart validerer publisert leksjon, tema og tilgjengelige oppgaver før navigasjon.
- Hent oppgaver med `getGrammarExerciseSkillId`. Filter først på leksjonens `skillIds`, deretter bruk dagens `selectGrammarExercises(..., 9)`. Ikke filtrer først etter at køen er valgt.
- Pilotens kildeliste har 11 oppgaver: indeks `0,1,3,5,6,7,9,10,11,12,13` i dagens `grammarTopics.articles.exercises`. Disse indeksene er bare kontrollgrunnlag; implementer med ferdighetsfilter, ikke hardkodede posisjoner.
- Svar i de 11 kildeoppgavene er former av `el/la/los/las`. I en leksjonsøkt skal hver kopierte oppgave få bare disse fire svaralternativene, med samme forbokstavpraksis som fasiten. Dette avgrenser testen til valg av bestemt form. Ikke muter kildebankens `options`.
- Etter de ni utvalgte kildeoppgavene legges fem `transferExercises`-oppgaver fra leksjonskatalogen til. De gir nye substantiver og dekker `bicicletas`, `ventanas`, `flores`, `problema` og `perros`. Fire følger hovedregelen; `problema` er det ene unntaket. De finnes ikke i `grammarTopics.articles.exercises`, behandles som vanlig grammatikkøving med relevante ferdighets-ID-er og markeres i resultatsnapshotet med `isTransfer: true`. Ikke legg kontrolloppgavene inn i den vanlige artikkelbanken.
- Instruksjonen over oppgaven blir «Velg riktig bestemt artikkel: el, la, los eller las.» Behold norsk betydningskontekst og konkrete ordhint, inkludert unntak. Kontrolloppgaven gir et nytt substantiv og en ny setning, slik at elevpilotens faglige overføring kan vurderes.
- Dersom filteret er tomt: behold teorisiden, vis en kort melding om at øving ikke er tilgjengelig, og ikke start en tom økt eller fall tilbake til hele temaet.
- Ved vellykket start: forkast lesekonteksten, bytt til Grammatikk, sett `currentGrammarTopic`, og start direkte med målrettede oppgaver. Ingen ekstra førteori etter at eleven har lest leksjonen.
- Behold `activeAssignment` og dagens leksemål. Ikke endre leksens tema-/minuttkonfigurasjon. Telling ved faktiske svar og avslutning følger vanlig grammatikkøving.
- `restartGrammarPractice()` kopierer tema, leksjons-ID og filter fra siste grammatikkresultat og oppretter en helt ny økt. Resultatets «Øv mer» bruker denne funksjonen.
- `startGrammarTopic(topicId)` nullstiller gammelt leksjonsfilter/minnesnapshot og beholder dagens førteorivalg for vanlig temaøving. Alle 15 artikkeloppgaver er igjen tilgjengelige, inkludert fire ubestemte.
- Ikke slett eller omskriv `hasSeenTheory` for å oppnå dette. Skill lesing av ny teori fra dagens førteoriflagg.

«Tilbake til resultatet» gjelder bare under lesing. Etter start av ny øving gjelder vanlig aktiv økt, vanlig avbrudd og nytt resultat; ikke opprett en stakk med gamle økter.

Utvid grammatikkgrenen i `abandonActiveSession` med `grammarSession = null`; svar som allerede er registrert skal ikke rulles tilbake. Behold dagens forskjell mellom eksplisitt «Avslutt» i grammatikkøving (finaliser besvarte oppgaver) og bekreftet fanebytte (dagens abandon-flyt). Test at en ny økt etter fanebytte ikke arver svar eller filter. `startGrammarTopic` nullstiller gammel `grammarSession` før eventuell førteori, slik at Avslutt på førteori ikke kan registrere en tidligere økt. Full nullstilling av elevdata må også tømme de nye minnetilstandene hvis den eksisterende reset-funksjonen ikke allerede laster siden på nytt.

På resultatsiden for `articles` beregnes publiserte relevante leksjoner først. Hvis minst én finnes, vises «Lær mer» for den smale leksjonen. Hvis ingen publisert relevant leksjon finnes – fordi leksjonen er `draft`/`reviewed`, katalogen er defekt, eleven bare har besvart `un/una`, eller ingen oppgaver er besvart – behold eksisterende «Se teori igjen» som åpner hele artikkeltemaets førteori. Dette er alltid en virkende vei til regelkortet; den skal ikke være disabled eller forsvinne. For øvrige temaer uten pilot beholdes deres eksisterende teoritilbud. Vanlig førteori for hele artikkeltemaet er fortsatt tilgjengelig gjennom temastart.

## 9. Utføring i små delsteg

### Steg 0 — Oppstart og baseline

Les `AGENTS.md`, denne planen og de oppgitte kodepunktene. Kjør session-start-kommandoene. Claim `spansk-ungdomsskole-z6i` først når implementeringen faktisk begynner. Opprett feature branch, les eksisterende diff og kjør baselinekommandoen fra seksjon 2. Hvis baseline feiler nå: noter presis feil og undersøk om den overlapper arbeidet; ikke slett tester for å få grønt.

### Steg 1 — Grammatikkens svarhistorikk og ren avslutning

Skriv først regresjonstester for 2 besvarte av 10, 0 besvarte, dobbelt svar og dobbelt avslutning. Innfør `grammarSession`, svarvern og resultatsnapshot. Flytt gammel HTML til `renderGrammarResult`. Oppdater kun grammatikkdelen av completion-fixturen og relevante gamle feedback-fixturer til å starte en reell økt eller initialisere den nye kontrakten fullstendig. Ikke konstruer fiktiv svarhistorikk i produksjon for å holde gamle tester i live.

Kontroll: målrettede tester + `tests/grammar-explanations.spec.js` og `tests/completion-header.spec.js`.

### Steg 2 — Blandet quiz: ren resultatvisning

Skriv først testen som kaller `finishMixedQuiz` to ganger og sjekker uendret quizantall, økter og merker etter andre kall. Legg `targetType/targetId` i svarposter, innfør `finalResult`, og trekk rendering ut. Behold eksisterende HTML-klasser/ID-er og åpne/lukkede resultatrader.

Kontroll: målrettede tester + hele `tests/quiz-streaks.spec.js` og relevante `tests/adaptive-quiz.spec.js`.

### Steg 3 — Innholdsdata og rene koblinger

Legg inn utkastet fra seksjon 4. Implementer kataloglesing/validering, publisert oppslag og `getRelevantGrammarLessons`. Test med lokale katalogargumenter for draft/reviewed/published, korrekt/feil og upubliserte naboer. Koble den dynamiske formtabellen til det statiske tabellområdet, men behold den komplette hardkodede artikkelteorien som reserve. Test katalogfeil før etterfølgende UI-arbeid. Ikke endre oppgaverekkefølgen eller gjør oppgavebanken avhengig av en ekstern variabel i objektinitialiseringen.

Kontroll: katalog/relevanstester, `npm run extract:items` og eksisterende grammatikkforklaringstester.

### Steg 4 — Teoripanel, retur og lenker

Implementer lesepanelet, navigasjonskontrakten og «Lær mer» i begge resultatvisninger. Test publisert flyt ved å endre status kun i testens minnekopi. Legg til keyboard-vern. Bevar kilde-DOM gjennom lesingen. Bygg stiler og kontroller at alle returnerende handlinger bare renderer/skifter synlighet.

Kontroll: tre runder resultat → teori → resultat for begge flyter, med full lagringssammenligning og bevart fokus/details.

### Steg 5 — Målrettet oppgaveutvalg og «Øv mer»

Skriv testene for filter, overføringsoppgave og ikke-mutasjon av kildebanken først. Innfør eksplisitte øktvalg, leksjonsstart og restart. Vis instruksjon for bestemte artikler. Test overgang fra blandet quiz til grammatikkøving og fra grammatikkresultat til ny filtrert øving. Test så vanlig artikkelstart og kontroller hele kildeutvalget.

Kontroll: ingen ubestemte alternativer i leksjonsøkten, fem nye kontrolloppgaver, ingen bredere fallback, riktig leksekontekst og nye forsøk registreres først ved svar.

### Steg 6 — Sluttkontroll og overlevering for faglig godkjenning

Oppdater README og testkommando. Kjør seksjon 11. Se gjennom egen diff, særlig lagringskall i renderfunksjoner og fallbacken for regelkortet. Lever skjermbilder av teorien ved mobil-/desktopbredde og rapporter testresultat. Før status settes til `published`, gjennomfør en kort manuell elevkontroll: eleven leser leksjonen, gjør kildeoppgavene og svarer på de fem nye kontrolloppgavene; noter om eleven kan forklare valg av artikkel i både hovedregel- og unntakseksemplene. Behold `draft` inntil brukerens faglige godkjenning foreligger. Marker teknisk leveranse og gjenstående innholdsgodkjenning presist i Beads; ikke lukk hele piloten som publisert hvis bare teknikken er ferdig.

## 10. Testmatrise med eksakte forventninger

Bruk prosjektets eksisterende Playwright-mønster med `pathToFileURL(path.resolve('index.html'))`. Kjør hver test i ren kontekst. `page.evaluate` kan klargjøre faste køer og testkatalog, men minst én full flyt per kilde skal svare via synlige kontroller. Ikke la alle tester omgå hendelsesbehandlerne.

| Test | Oppsett/handling | Forventning |
| --- | --- | --- |
| G1 Fullført grammatikk | 10 svar, 9 riktige | Resultat/hode 9/10 og 90 %, én historikkøkt. |
| G2 Avbrudd | Kø på 10, besvar 2 (1 riktig), avslutt før Neste på nr. 2 | 2 besvarte, 1 riktig, 50 %, 2 registrerte oppgaver, én økt. |
| G3 Ingen svar | Start øving, avslutt uten svar | Ingen historikkregistrering og ingen leksjonsanbefaling; ingen NaN. |
| G4 Ubesvart relevant oppgave | Besvar bare en `un`-oppgave, la bestemte være ubesvart | Ingen anbefaling av pilotleksjonen; virkende «Se teori igjen» åpner hele artikkelregelverket. |
| G5 Dobbelt svar | Send inn to svar på samme indeks | Én svarpost, ett progresjonsforsøk, ett temaforsøk. |
| G6 Dobbelt Neste | Aktiver neste to ganger uten nytt svar | Bare én oppgave avanseres. |
| G7 Finalisering | Avslutt samme økt to ganger | Identiske registrerte økter, minutter, oppgavetall og resultat. |
| Q1 Quizretur | Fullfør quiz, åpne teori, gå tilbake tre ganger | Samme svaroversikt, samme merker, samme quizantall, ingen nye historikkøkter. |
| Q2 Metadatakobling | Relevant skill, relevant-looking word og post uten metadata | Bare riktig ferdighetspost får lenke; ingen tekstgjetting. |
| Q3 Alt riktig | Relevant svar er riktig | «Lær mer» finnes inne i lukket details når eleven åpner det. |
| Q4 Quizavbrudd | Avbryt før fullført quiz | Dagens startvisning; ingen ekstra fullført quiz eller leksjonsanbefaling fra ubesvarte. |
| L1 Relevanssortering | To publiserte testleksjoner; en koblet til feil | Feilkoblet først; ingen dubletter; inngangslister uendret. |
| L2 Status | Test draft, reviewed, published | Bare published gir elevlenke og tillatt direkte åpning; draft/reviewed gir fortsatt «Se teori igjen» fra artikkelresultatet. |
| L3 Relasjoner | Publisert leksjon med draft-nabo og ingen published-nabo | Ingen tom relasjonsseksjon, piloten kan brukes alene. |
| L4 Flerleddlesing | Testpublisert nabo → tilbake | Samme opprinnelige resultat, trigger og åpne details. |
| L5 Ingen leselagring | Snapshot av alle localStorage-nøkler og relevante minneverdier etter fullføring | Byteidentisk localStorage etter tre åpne/lukke-runder; uendret progresjon/history/hasSeenTheory. |
| L6 Tid | Fullfør, les i fem simulerte minutter, returner | Samme registrerte minutter; ny økt får nytt starttidspunkt. |
| L7 Førteori | Vis vanlig artikkelteori | Både un/una og de fire bestemte formene finnes; gyldig katalog erstatter bare det avgrensede området. |
| L8 Defekt katalog | Ugyldig JSON i testdokumentets katalogblokk | App og øving laster; ingen «Lær mer»; kontrollert logg; den uendrede førteorien viser fortsatt un, una, el, la, los og las. |
| P1 Filtrert bank | Start leksjonsøving | Kun to bestemte ferdighets-ID-er og fire bestemte alternativer; vanlig kildebank uendret. |
| P2 Øv mer | Fullfør/avbryt filtrert økt, trykk Øv mer | Ny økt, tom svarhistorikk, samme filter. |
| P3 Vanlig øving | Gå til temavalg og start Artikler | `filterSkillIds === null`; tilgjengelig bank inkluderer alle 15 og un/una. Ikke krev at hver adaptiv tioppgavekø inneholder alle former. |
| P4 Tomt filter | Testkatalog med ingen tilgjengelige oppgaver | Ingen økt eller bred fallback, lesesiden beholdes. |
| P5 Lekse | Aktiv lokal lekse, les og returner, start ny målrettet økt | Lekseobjekt uendret; lesing gir null tillegg; besvart ny økt telles vanlig. |
| P6 Faglig overføring | Start målrettet leksjonsøkt | Ni valgte kildeoppgaver etterfølges av fem nye kontrolloppgaver; de finnes ikke i kildebanken og registreres som `isTransfer`. |
| U1 Tastatur | Tab/Enter på Lær mer, Tab/Space på retur | Teori og retur fungerer, fokus gjenopprettes, ingen skjult øvingsknapp aktiveres. |
| U2 Mobil | 390×844 og desktop 1280×900 | Ingen horisontal overflow; tilbake- og øvingsknapper synlige/brukbare ved scrolling. |
| U3 Lokal fil | Last file://, vis teori fra resultat | Ingen fetch-avhengighet for leksjon; CSS og interaksjon fungerer. |

Lagringstestene skal ta snapshot ETTER avslutningsregistreringen, ikke før, og skal ikke bare sammenligne den avrundede prosenten. Sammenlign også `practiceHistory` i minnet. For blandet quiz, sammenlign quizstatistikk, historikk, merkene og daglige spurte ID-er. For grammatikk, sammenlign `grammarProgress`, `hasSeenTheory` og ferdighetsprogresjon.

For tidsprøven bruk Playwrights klokke eller et fast tidsgrunnlag, ikke fem minutters faktisk venting. Oppgavene velges deterministisk i testene; ikke baser pass/fail på tilfeldig tioppgaveutvalg.

## 11. Kommandoer og sluttkriterier

Ny package-kommando:

```json
"test:grammar-lessons": "playwright test tests/grammar-lessons.spec.js tests/result-theory-navigation.spec.js --browser chromium"
```

Kjør underveis relevante enkeltfiler, og til slutt:

```sh
npm run build:css
npm run test:grammar-lessons
npx playwright test tests/grammar-explanations.spec.js tests/completion-header.spec.js tests/quiz-streaks.spec.js tests/adaptive-quiz.spec.js tests/learning-progress-core.spec.js tests/assignment-package.spec.js tests/import-export-compat.spec.js tests/storage-recovery.spec.js tests/frontend-visual-audit.spec.js --browser chromium --workers=1
npm run extract:items
npm run check:content-accuracy
npm run check:learning-catalog
npm run check:tailwind
git diff --check
```

Forventning: alle målrettede og relevante regresjonstester består; audit og statiske sjekker gir ingen nye feil. Dersom bredere sjekker har en eksisterende feil, sammenlign med baseline uten å forkaste brukerens endringer, beskriv den konkret og ikke presenter sjekken som bestått. Genererte auditfiler skal ikke inkluderes som håndskrevet produktinnhold eller overskrive brukerens review-filer.

Test import/eksport av eksisterende progresjon uten noen nye obligatoriske felter. Ny svarhistorikk, snapshots og lesekontekst er bare minnetilstand og skal ikke eksporteres eller få nye localStorage-nøkler.

Teknisk ferdig betyr: flytene og testene fungerer med testpublisert innhold, eksisterende progresjon er kompatibel, CSS er bygget og egen diff er gjennomgått. Elevklar pilot betyr i tillegg: brukerens faglige godkjenning er dokumentert og leksjonen er satt til `published`. Deploy er et separat steg.

Overleveringen skal oppgi Beads-ID, endrede filer, faktisk testresultat, innholdsstatus og eventuelle reelle feil. Planen alene og en bestått baseline er ikke implementering. Ikke påstå at elevforsøket er gjennomført; etter aktivering prøves leksjonen med elever som leser kort og løser andre eksempler, uten ny automatisk datainnsamling.
