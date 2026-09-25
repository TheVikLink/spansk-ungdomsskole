# Kursomfang og ferdighetsdekning — 23. september 2026

Beads: `spansk-ungdomsskole-t1du`. Beslutningsgrunnlag for bygg `7072d6e4a34f6771`, arbeidskopi over `1aba3dd`. Løpende gjennomføring spores i Beads.

## Valgt retning

Produkteieren valgte 23. september: **Styrk eksisterende A0-grunnlag først, etter piloten.** Dette er valgt prioritet; de nye oppgavene trenger fortsatt lærerens innholdsgjennomgang før elevbruk.

Første leveranse, `rl3y`, utvider alder, eierskap, hilsener og bosted. Andre leveranse, `o13t`, utvider hay, arbeid/yrker, yrker uten artikkel og spørsmål om ting. Hver av de åtte ferdighetene har nå én grammatikkoppgave. Målet er minst seks relevante, meningsfullt varierte oppgaver per ferdighet; tallet er et produktkrav til bredde, ikke en validert mestringsterskel. Konkrete oppgaver og distraktorer godkjennes faglig under leveransen.

Appens eksisterende løfte beholdes: lokal, aktiv A0–A1-øving for norske ungdomsskoleelever. Ingen ferdighetsstatus endres av denne kartleggingen. 27 planlagte ferdigheter er fortsatt planlagte. Et fullstendig kurs og CEFR-plassering er ikke levert.

## Metode og begrensning

Kartleggingen leste `learningCatalog`, `grammarTopics`, `grammarLessonCatalog`, `getGrammarExerciseSkillId()` og `getBrainmapSkillActionDescriptors()` direkte fra [index.html](../../../index.html). Eksisterende uttrekksfunksjoner i [extract-all-items.mjs](../../../scripts/lib/extract-all-items.mjs) ble brukt for ordliste, verb, puslespill og preposisjoner. Rutefunksjonen ble kjørt på de faktiske katalogobjektene i Node, uten nettleser eller elevdata.

Resultat: **64 unike ID-er, 37 med aktiv rute og 27 med planned-rute.** Alle 27 mangler eget tagget oppgavesett i den undersøkte grammatikkatalogen og direkte koblet publisert leksjon. Dette betyr ikke at emnene er fraværende i andre øvelser. Tabellene skiller dette.

Antall under «taggede grammatikkoppgaver» er antall direkte oppgaver for ID-en i grammarTopics, ikke antall visninger, verbformer, skriveoppgaver, leksjonens overføringsoppgaver eller læringsbevis. Verb og egen setningsøving har derfor 0 i denne kolonnen. `a1.adjectives.gender_number` er en samlerute for to delmål. Ingen ny nettleser- eller faglig godkjenning utledes av uttrekket.

## Alle 37 ferdigheter med aktiv rute

| Stabil ID | Mål | Faktisk rute | Taggede grammatikkoppgaver |
|---|---|---|---:|
| `a0.identity.me_llamo` | Si hva du heter med me llamo | Egen setningsøving | 0 |
| `a0.identity.soy_de` | Si hvor du er fra med soy de | Egen setningsøving | 0 |
| `a0.articles.indefinite_singular` | Bruke un og una | Grammatikk articles | 4 |
| `a0.articles.indefinite_plural` | Bruke unos og unas | Leksjon a0.articles.indefinite | 0 |
| `a0.articles.definite_singular` | Bruke el og la | Grammatikk articles | 8 |
| `a1.verbs.regular_ar.present` | Bøye regelrette -ar-verb i presens | Verb (ar) | 0 |
| `a1.verbs.regular_er.present` | Bøye regelrette -er-verb i presens | Verb (erir) | 0 |
| `a1.gustar.basic` | Bruke gustar med én ting eller aktivitet | Grammatikk gustar | 12 |
| `a1.ser_estar.identity_or_location` | Velge ser eller estar for identitet og sted | Grammatikk serEstar | 6 |
| `a0.identity.age` | Si hvor gammel du er med tener años | Grammatikk a0Foundation | 1 |
| `a0.existential.hay` | Bruke hay for å si at noe finnes | Grammatikk a0Foundation | 1 |
| `a0.possession.tener` | Si at du har noe med tener | Grammatikk a0Foundation | 1 |
| `a0.patterns.tengo` | Bruke uttrykk med tengo | Grammatikk patterns | 6 |
| `a1.patterns.quiero` | Uttrykke ønsker med quiero | Grammatikk patterns | 6 |
| `a1.patterns.me_gusta` | Uttrykke hva du liker med me gusta | Grammatikk patterns | 6 |
| `a1.patterns.voy_a` | Fortelle hva du skal gjøre med voy a | Grammatikk patterns | 6 |
| `a0.greetings.como_estas` | Spørre og svare på hvordan det går | Grammatikk a0Foundation | 1 |
| `a0.work.trabajar` | Fortelle hva du jobber med | Grammatikk a0Foundation | 1 |
| `a0.location.vivo_en` | Si hvor du bor med vivo en | Grammatikk a0Foundation | 1 |
| `a0.articles.definite_plural` | Bruke los og las | Grammatikk articles | 3 |
| `a0.professions.zero_article` | Utelate artikkel foran yrker | Grammatikk a0Foundation | 1 |
| `a0.questions.que_es_eso` | Spørre hva noe er med qué | Grammatikk a0Foundation | 1 |
| `a1.verbs.regular_ir.present` | Bøye regelrette -ir-verb i presens | Verb (erir) | 0 |
| `a1.verbs.ser.present` | Bøye ser i presens | Verb (irregular) | 0 |
| `a1.verbs.estar.present` | Bøye estar i presens | Verb (irregular) | 0 |
| `a1.verbs.ir.present` | Bøye ir i presens | Verb (irregular) | 0 |
| `a1.verbs.tener.present` | Bøye tener i presens | Verb (irregular) | 0 |
| `a1.verbs.hacer.present` | Bøye hacer i presens | Verb (irregular) | 0 |
| `a1.verbs.reflexive.present` | Bøye refleksive verb i presens | Grammatikk reflexive | 12 |
| `a1.adjectives.gender_number` | Bøye adjektiv etter kjønn og tall | Grammatikk adjectives (samler to delmål) | 0 |
| `a1.adjectives.regular_o` | Bøye regelrette adjektiv på -o | Grammatikk adjectives | 8 |
| `a1.adjectives.common_gender` | Bøye adjektiv på -e | Grammatikk adjectives | 4 |
| `a1.ser.identity` | Bruke ser for identitet, yrke og opprinnelse | Grammatikk serEstar | 5 |
| `a1.estar.location` | Bruke estar for hvor noen eller noe er | Grammatikk serEstar | 5 |
| `a1.hay_estar.contrast` | Skille mellom hay og estar | Grammatikk hayEstar | 10 |
| `a1.adjectives.demonstratives` | Bruke pekende adjektiv | Grammatikk demonstratives | 12 |
| `a1.adjectives.possessives` | Bruke eiendomsord | Grammatikk possessives | 14 |

Åtte A0-mål i denne tabellen har bare én direkte grammatikkoppgave: alder, hay, eierskap, hvordan det går, arbeid, bosted, yrker uten artikkel og qué es eso. Repetisjon av den samme oppgaven kan ikke alene dokumentere overføring til nye situasjoner. Det er begrunnelsen for den valgte første utvidelsen.

## Alle 27 planlagte ferdigheter

«Senere» betyr eksplisitt utsatt til etter de to valgte A0-leveransene og ny prioritering med lærer. «Samordnes først» betyr at målgrensen må avklares før ny ruting/progresjon, ikke at innhold skal slettes eller gamle ID-er slås sammen nå.

| Stabil ID | Eksisterende støtte | Konkret gap | Prioritet og forkunnskaper |
|---|---|---|---|
| `a1.verbs.modal.present` | Bøying av poder/querer og quiero-mønstre finnes; deber er ikke i verbdatabasen. | Kontekstuell modal + infinitiv, skille betydning og målrettet progresjon. | Etter grunnlaget: flere verb og betydninger krever egen fagkontroll. |
| `a1.verbs.near_future` | Verbmodulens futuro, voy a-mønstre og fremtidsgloser. | Avklar forskjellen fra a1.patterns.voy_a; flere personer og korrekt måltilknytning. | Samordnes først: unngå dobbelt mål/poeng for samme svar. |
| `a1.time.clock` | 14 gloser i klokka, blant annet es la una / son las dos. | Regel, klokkekontekst, egen rute og progresjon. | Senere samlet klokke/dato-forløp; krever tall og ser. |
| `a1.time.dates` | Ukedags-/tidsuttrykk og Hoy es lunes i ser/estar. | Sammenhengende datoøving med kontrollerte uttrykk og måltilknytning. | Senere med klokke; ikke full dekning fra gloser alene. |
| `a1.negation.no` | No me gusta-gloser og negative setninger i lyttehistorier. | Aktivt valg/plassering av no i enkle setninger, norsk kontekst og egen progresjon. | Neste grunnlagskandidat etter valgt A0-arbeid; trenger enkel setningsforståelse. |
| `a1.questions.interrogatives` | Spørsmål i setningspuslespill, gloser og A0 qué es eso. | Definere overordnet mål mot qué/quién/dónde-cuándo og entydig spørsmålskontekst. | Samordnes med delmål før ny implementasjon. |
| `a1.prepositions.basic` | Åtte preposisjoner i Prepo Invaders og fire puslespill om plassering. | Målrettet forklaring/øving med ferdighetsprogresjon, ikke bare spillresultat. | Senere: koble til estar/hay og fysisk plassering. |
| `a1.pronouns.subject` | Verbmodulens personvalg og subjekt i setninger. | Velge pronomen ut fra referent/person og registrere riktig ferdighet. | Neste grunnlagskandidat; egne oppgaver trengs selv om pronomen vises i verbtrening. |
| `a1.nouns.gender_number` | Artikkelteori, gloser med artikkel og eksisterende artikkeløving. | Avklare eget kunnskapsmål mot artikkelvalg; relevante substantivoppgaver og progresjon. | Senere etter artikkelpilotens erfaringer; unngå dobbeltelling. |
| `a1.nouns.plural_z` | Generell entall/flertall-støtte i artikkelleksjonen. | Egen kontrollert z→ces-regel og oppgaver; ikke påvist målrettet innhold. | Senere, etter vanlig flertall. |
| `a1.articles.al_del` | al/del forekommer i puslespill og lyttehistorier. | Forklaring av sammentrekning og aktivt valg med entydig kontekst. | Senere etter artikler og a/de. |
| `a1.adjectives.muy_mucho` | Muy i adjektivoppgaver og mucho/mucha i uttrykk/historier. | Forklaring og kontrastoppgaver som skiller adverb og mengdeord. | Senere etter adjektiv/nomen; krever kontekstkontroll. |
| `a1.adjectives.colours` | 12 fargegloser og fargeeksempler i mønstre/puslespill. | Målrettet samsvar, særlig ord med annen bøying enn -o, og egen progresjon. | Senere etter eksisterende samsvarsøving; lærer avgrenser varianter. |
| `a1.adverbs.mente` | Isolert glosen raramente; ingen egen regel/rute påvist. | Kontrollert adjektiv→adverb-forklaring, oppgaver og progresjon. | Utsettes lengst: større bredde enn første grunnlagsbehov. |
| `a1.gustar.activities` | Gustar-tema, me gusta-mønstre og aktivitetspuslespill. | Avgrense mot a1.gustar.basic/a1.patterns.me_gusta og sikre relevant evidens. | Samordnes først; ikke bare kopi av eksisterende mål. |
| `a1.ser_estar.origin` | Soy de i A0 og opprinnelseseksempel i ser/estar; eksplisitt tag peker til ser.identity. | Avklare forskjellen fra a0.identity.soy_de/a1.ser.identity og nasjonalitetsbredde. | Samordnes først; bevare gamle ID-er og progresjon. |
| `a1.ser_estar.weather` | 17 vær-/årstidsgloser og væruttrykk i historier. | Kontekstuelle hace/hay/está-oppgaver og egen forklaring/progresjon. | Senere; forkunnskaper ser/estar/hay og værord. |
| `a1.ser_estar.time` | Klokkegloser og dag-/tidssetninger i ser/estar. | Avgrense mot time.clock/time.dates; riktig evidensruting. | Samordnes med klokke/dato; én svarhendelse skal ikke gi doble bevis. |
| `a1.reflexive.llamarse` | A0 me llamo, refleksivøving og navnepuslespill. | Personvariasjon i llamarse og klar forskjell fra A0-navneuttrykket. | Senere; flere personer krever egen oppgavebredde. |
| `a1.questions.que` | A0 qué es eso og qué i fremtidsgloser. | Utvidet men fortsatt entydig qué-kontekst og separat målgrunnlag. | Samordnes med questions.interrogatives etter grunnlaget. |
| `a1.questions.quien` | Glosen ¿Con quién vives? finnes. | Egne spørsmål/svar om person, forklaring og progresjon. | Senere spørreordspakke; krever kjente personer/verb. |
| `a1.questions.donde_cuando` | ¿Dónde vives?-puslespill, steds- og klokkeuttrykk. | Skille sted fra tid med tydelig kontekst og riktige alternativer. | Senere spørreordspakke; del eventuelt i to mål før implementasjon. |
| `a1.prepositions.de_possession` | De forekommer i andre uttrykk; eiendomsord har egen øving. | Eierskap med de i fulle setninger, forklaring og målrettet øving. | Senere etter substantiv og eiendomsord; de i soy de beviser ikke eierskap. |
| `a1.prepositions.a_en` | Vivo en, ir a/voy a og preposisjonsspillets en. | Avgrenset kontrast retning/sted uten å blande futurumsmarkøren. | Senere etter bevegelses-/stedsverb. |
| `a1.prepositions.por_para` | Por og para finnes i ord/fortellinger. | Lærergodkjent smalt meningsomfang, egen regel og entydige oppgaver. | Utsettes lengst: bredt og lett tvetydig på dette nivået. |
| `a1.pronouns.tu_tu` | Tú i verbpersoner og tu i eiendomsordøving. | Meningsbasert kontrast mellom subjekt og eierskap, med aksentbevisst respons. | Senere etter subjektpronomen/eiendomsord. |
| `a1.pronouns.el_el` | El i artikler og él i verbpersoner/tekster. | Kontrast mellom artikkel og pronomen i sammenheng. | Senere etter artikler og subjektpronomen. |

Alle disse 27 beholder status planned inntil relevant øving og bevis er på plass. For eksempel viser verbmodulens futuro ikke automatisk bred kommunikativ ferdighet under near_future, og Prepo Invaders gir ikke automatisk ferdighetsprogresjon under prepositions.basic.

## Gjennomførbare neste saker

- `spansk-ungdomsskole-rl3y`: minst seks varierte oppgaver hver for `a0.identity.age`, `a0.possession.tener`, `a0.greetings.como_estas`, `a0.location.vivo_en`.
- `spansk-ungdomsskole-o13t`: samme bredde for `a0.existential.hay`, `a0.work.trabajar`, `a0.professions.zero_article`, `a0.questions.que_es_eso`, etter første leveranse.
- Begge gjennomføres etter `ee0` sin avgrensede pilot/oppfølging, slik spørsmålet til produkteieren avgrenset prioriteringen. Beads har de faktiske avhengighetene og ferdigkriteriene.
- `egb` (Jeg kan-mål) og `v0n` (aktivitetsforløp) vurderes mot pilotbehov; de er ikke automatisk del av innholdsutvidelsen. `1bb` er fortsatt separat leseinnhold. Konto-/personvernarbeid `brq`/`nsx` er utenfor denne fasen.

## Filer og verifikasjon for valgt utvidelse

Endringer av oppgaver/teori gjøres i `index.html`, med målrettede regresjoner i `tests/brainmap-catalog.spec.js` og relevante eksisterende progresjons-/støttetester. Standardgloser forblir styrt av `data/vocabulary-canonical-review.json`. Nye avhengigheter, tjenester og lagringsformat er ikke nødvendig.

Første test skal påvise den faktiske oppgavebredden per mål, ikke bare antall rader. Verifiser korrekt/feil svar, entydig kontekst, filtrert rute, at én svarhendelse registreres én gang, og at gammel progresjon og eksport/import bevares. Bruk mobilbredde og tastatur. Lærer må kontrollere alternativer som også kan være idiomatiske, særlig hilsefraser og artikkel ved yrkesbeskrivelse.

Etter nærmeste regresjoner:

```sh
npm run build:app
npm run test:all
git diff --check
```

Oppdater faktiske innholdstall. Den forventede minimumsutvidelsen er 40 nye grammatikkoppgaver dersom alle åtte nåværende beholdes, men endelig antall bestemmes av faglig gjennomgang. Ingen oppgave er implementert eller lærergodkjent gjennom denne omfangsbeslutningen.
