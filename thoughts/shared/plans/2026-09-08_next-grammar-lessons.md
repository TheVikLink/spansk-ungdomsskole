# Neste grammatikkleksjoner

Dato: 2026-09-08. Status: implementeringsforslag. Planen beskriver fremtidig arbeid; gjennomføringsstatus føres i Beads. Viderefører artikkelpiloten og brukerens valgte detaljerte teorimal.

## Mål

Bygg en sammenhengende serie korte, norske grammatikkleksjoner som forbereder eleven på relevante oppgaver og kan åpnes igjen fra «Lær mer» etter quiz.

## Avgrensning

Bruk eksisterende lokale app, øvingsmotor og eksport/import. Ingen innlogging, nye eksterne tjenester, automatisk publisering av modellutkast eller stor oppdeling av index.html. Denne planen innfører ikke et nytt generelt adaptivt system. A0 brukes som appens innføringsnivå. Innholdet må vurderes for norske nybegynnere, ikke ukritisk arve nivåplassering fra andre tjenester.

## Faktisk utgangspunkt og nødvendige rettinger

Undersøkt i index.html: grammar-lessons-data, learningCatalog.skills, grammarTopics, renderGrammarLesson, startGrammarTopic, openGrammarTopicTheory og startGrammarExercises.

To teoritekster finnes: bestemte og ubestemte artikler. De er merket published, men har ingen registrert faglig godkjenner. Eksisterende grønne tester dokumenterer ikke at hele den nye leksjonen fungerer.

Før flere sider implementeres:

1. Fjern hardkodet overstyring av alle leksjoners svaralternativer til El/La/Los/Las. Hver oppgave skal ha sine egne faglig vurderte alternativer. Kontroller at riktig svar faktisk finnes blant dem.
2. Registrer a0.articles.indefinite_plural i ferdighetskatalogen. Den brukes allerede i kontrolloppgavene, men finnes ikke i katalogen. Legg til ordinære flertallsoppgaver slik at ferdigheten også kan dukke opp i blandet quiz.
3. La «Les teori» åpne den detaljerte teorien. I dag kaller openGrammarTopicTheory fortsatt showGrammarTheory med gammel tekst.
4. Gjør «Les teori» til en separat ekte knapp ved siden av temaknappen. Nå ligger en fokuserbar role=button inni en button.
5. Vis publiserte anbefalte og relaterte leksjoner. Relasjons-ID-ene finnes nå bare i data. Skjul tomme seksjoner og lenker til utkast.
6. Skill sett teori per leksjon fra sett teori per bredt tema. To artikkelleksjoner kan ikke dele ett flagg som om begge er gjennomgått. Bevar eksisterende progresjon; et gammelt temaflagg skal ikke påstå at nye detaljerte sider er lest.
7. Bevar leksjon og ferdighetsfilter ved «Øv mer». Resultat → teori → resultat må fortsatt være ren visning uten ny øktregistrering.

Dette er fase 0 og må verifiseres før første nye leksjon publiseres.

## Elevflyt som alle leveranser skal følge

- Første besøk på en leksjon: full detaljert teori, deretter en tydelig «Start øvelser»-knapp nederst. Ingen tidslås eller påstand om at eleven har forstått fordi siden ble åpnet.
- Registrer gjennomgått introduksjon når eleven velger å gå videre til øvelsene. Avbrutt førstegangslesing skal fortsatt åpne teori neste gang.
- Senere besøk: eleven kan starte øving direkte eller velge «Les teori». For disse leksjonene skal nylige feil gi et tilbud om teori, ikke tvinge frem teori igjen.
- Brede temaer får en leksjonsoversikt med separate knapper. Artikler viser bestemt og ubestemt artikkel; ser/estar viser sine delregler. Temaer med bare én leksjon kan åpne den direkte.
- «Øv på dette» gjelder bare ferdighetene og oppgavene som siden forklarer. Bred blandet temaøving kan tilbys separat når introduksjonene for inkluderte regler er gjennomgått.
- Quizresultat viser leksjoner knyttet til besvarte oppgaver, med feil først. Elever med alt riktig får også tilgang. Ubesvarte oppgaver gir ingen anbefaling.
- Når flere leksjoner anbefales: behold «Lær mer om dette», men vis leksjonstittel som tilhørende tekst og i tilgjengelig navn så knappene kan skilles.
- Tilbakeknappen returnerer til riktig resultat eller leksjonsoversikt, med fokus, rulleposisjon og leksekontekst bevart.

## Prioritert innholdsrekkefølge

Hver rad er en egen leveranse med teori, oppgaver, faglig gjennomgang og flyttest. Oppgitte nye ID-er er forslag som må registreres før bruk.

| Rekkefølge | Leksjon og læringsmål | Innhold og avgrensning | Kobling og oppgavebehov |
|---|---|---|---|
| 1 | Adjektiv: velge alto/alta/altos/altas | Samsvar med substantivets kjønn og tall. Vis alle fire former og hvilke ord som styrer valget. | Eksisterende adjectives; gi oppgaver en ny presis a1.adjectives.regular_agreement-ID. Behold eldre a1.adjectives.gender_number-progresjon som bred historikk. |
| 2 | Adjektiv: grande og interesante | Samme form for begge kjønn, men flertall med -s når grunnformen ender på -e. Ikke si at alle konsonantadjektiv er uforanderlige i kjønn. | Gjenbruk passende adjectives-oppgaver, ny a1.adjectives.common_gender-ID. Ikke test español/española uten egen forklaring. |
| 3 | Ser: hvem noen er og hvor de kommer fra | Identitet, yrke, opprinnelse; soy/eres/es/somos/sois/son med pronomenstøtte. Yrker uten ubestemt artikkel i enkle utsagn. | Eksisterende serEstar og opprinnelsesferdighet. Ny a1.ser.identity-ID for identitet/yrke; ingen steds- eller tidsoppgaver i denne øvingen. |
| 4 | Estar: hvor personer og ting befinner seg | Estoy/estás/está/estamos/estáis/están. Entall/flertall; tydelig avgrensning til personer og ting. Unngå permanent/midlertidig som valgmetode. | Gjenbruk stedsoppgaver fra serEstar; ny a1.estar.location-ID. Ikke slå identitetsoppgaver sammen med sted i anbefalingen. |
| 5 | Hay eller está/están | Introdusere at noe finnes kontra lokalisere en bestemt ting. Sammenhengende eksempelpar, også hay med flertall. | a0.existential.hay finnes, men dekker ikke kontrasten alene. Opprett a1.hay_estar.contrast og minst ti egnede kildeoppgaver. Nye oppgaver må inn i både målrettet øving og quizutvalg. |
| 6 | Estar: hvordan noen har det | Følelser/tilstander i tydelig kontekst og samsvar i cansado/cansada. Avgrens mot stedsbruk og betydningsskifter som es aburrido/está aburrido. | Skill ut relevante serEstar-oppgaver med a1.estar.states. Først etter leksjon 1 og 4. |
| 7 | Regelrette -ar-verb i presens | Infinitiv, stamme og personendelser med hablar/trabajar. Pronomen kan utelates når verbformen viser personen. | a1.verbs.regular_ar.present finnes. Bruk eksisterende verbdata via en eksplisitt øvingsadapter; nåværende lesson.practice støtter bare grammarTopics. |
| 8 | Regelrette -er-verb i presens | Comer/beber og personendelser. Sammenlign med -ar uten å gjøre hele siden til repetisjon. | a1.verbs.regular_er.present; samme adapter og resultatkobling som leksjon 7. |
| 9 | Regelrette -ir-verb i presens | Vivir/escribir; fremhev vivimos/vivís sammenlignet med -er. Ingen stammeendringer i denne leksjonen. | a1.verbs.regular_ir.present finnes. Gjenbruk kontrollerte verbdata; minst fem nye kontrolloppgaver. |
| 10 | Me gusta eller me gustan | Én ting mot flere ting. Betydning på norsk; det som likes styrer verbets tall. | Del dagens brede gustar-oppgaver i presise ferdigheter. Ny a1.gustar.number-ID, ikke bland inn valg av alle objektspronomen. |
| 11 | Me gusta + infinitiv | Si hva du liker å gjøre, med gusta og infinitiv. | a1.gustar.activities finnes som planlagt. Aktiver bare med ferdige oppgaver og teori. |

Anbefalt første innholdspakke er leksjon 1–5. Gjennomfør og vurder én leksjon av gangen før resten av pakken.

Senere pakker: eiendomsord (mi/mis, tu/tus, su/sus før nuestro), pekende ord (este/esta før ese), refleksive verb, ir a + infinitiv, tener que, klokkeslett og spørsmål. De får egne detaljerte planer når første pakke er prøvd.

## Felles teorimal

Bruk den detaljerte leksjonsvisningen som felles kilde og komponent:

1. Konkret tittel og ett «Jeg kan»-mål.
2. Kort forklaring av bruken med nødvendig forkunnskap.
3. To til fire avsnitt med tydelige undertitler; normalt 150–300 ord norsk forklaring, mer bare når oppgavene krever det.
4. Fremhev relevante ord og endelser i både forklaring og eksempler. Bruk eksplisitt markering i data, ikke global regex som også kan gjøre norsk «la» fet. Bevar HTML-escaping; tillat bare et begrenset format for utheving.
5. Fire til seks originale eksempler med norsk oversettelse. Vis forskjeller eleven skal oppdage, ikke bare like setninger med nye substantiv.
6. «Pass på» med bare de unntakene eleven faktisk møter. Forklar dem før øving; unngå at regelen presenteres som absolutt.
7. Tydelig startknapp, én anbefalt fortsettelse og valgfrie relaterte leksjoner.

Lesbar bredde, tydelige overskrifter, god linjeavstand og synlig fet skrift skal fungere ved 360 px, desktop og 200 % zoom. Ikke legg hver setning i en egen dekorativ boks. Behold dagens visuelle identitet.

## Oppgaver og faglig kvalitet

- Per ny leksjon: minst ti varierte kildeoppgaver og fem kontrolloppgaver med nye setninger som ikke er gjengitt i teorien. Kontroller at kildene ikke allerede inneholder kontrollsetningene.
- Første målrettede økt: fem kildeoppgaver og fem kontrolloppgaver, alle innen læringsmålet. Vanlig ny øving kan variere utvalg, men skal unngå duplikater i økten.
- Der læringsmålet er en hovedregel, skal høyst én av fem kontrolloppgaver teste et forklart unntak. Ikke legg inn unntak bare for å fylle en kvote. Kontrastleksjoner må balansere de relevante alternativene.
- Norsk oppgavekontekst må gjøre person, tall og betydning entydig. Bare én flervalgsfasit med mindre motoren eksplisitt støtter flere korrekte valg.
- I skriveoppgaver godtas naturlige varianter, blant annet hablo/yo hablo når begge oppfyller målet. Ikke endre generell aksentpolicy eller lagre stavefeil som fasit.
- Sjekk faglige grenseeksempler mot primærkilder som RAE/ASALE ved utarbeiding. Lag egne norske forklaringer og originale eksempler. Registrer kildegrunnlag i redaksjonelle metadata.
- Nye tekster opprettes som draft. Faglig gjennomgang omfatter norsk/spansk tekst, eksempler, fasit, distraktorer, nivå og hele målrettede oppgaveutvalget. Brukeren godkjenner før published; reviewedBy/reviewedAt skal beskrive faktisk gjennomgang.
- Vanlige presisjonsfeller: -ma er ikke en universell hankjønnsregel; trykksterk a- er ikke alle ord som begynner på a; ser/estar er ikke permanent/midlertidig; -e får normalt -s i flertall, ikke en ekstra -es etter eksisterende e.

## Implementering i små trinn

1. Fase 0: opprett/avklar Beads-arbeid med referanse til eksisterende pilot spansk-ungdomsskole-z6i. Lag meningsfulle regresjonstester for feilene over og rett dem før innholdsutvidelsen.
2. Gjør leksjonsvalg, lesestatus, navigasjonskontekst og målrettet øving generiske. Foreslått tillegg: practice.source, topicId, skillIds og eksplicitte oppgave-ID-er ved behov. Bevar gamle ID-er og data; ikke fordel historisk mestring automatisk til nye delferdigheter.
3. Lag liten katalogvalidator som krever unike leksjons-/oppgave-ID-er, kjente ferdigheter, gyldige relasjoner, minst fem kontrolloppgaver og fasit blant alternativer. Validatoren må kontrollere det faktiske øvingsutvalget.
4. Lever adjektivleksjon 1 komplett som referanse. Kontroller manuelt sammen med brukeren, og bruk erfaringene før leksjon 2–5.
5. Lever leksjon 2–5 hver for seg med egen oppgavemapping. Nye presise ferdigheter registreres i katalogen; brede historiske ferdigheter beholdes.
6. Lever adapter til verbøving før leksjon 7–9. Definer hvordan lessonId følger verbøkt, resultat og «Lær mer» uten dobbeltregistrering.
7. Lever gustar-leksjonene og oppdater relasjonslenker bare til publisert innhold.

## Filer

- index.html: leksjonskatalog, ferdighetsregister, relevante oppgavebanker, teorivisning, førstegangsvalg, resultatkobling og øvingsadaptere.
- src/styles/tailwind.css: små gjenbrukbare forbedringer i eksisterende teorikomponent ved behov.
- dist/tailwind.css: genereres bare ved CSS-endringer.
- tests/grammar-lessons.spec.js: førstegangs- og gjenbesøksflyt, filtrering, kontrolloppgaver, relasjoner og tilgjengelighet.
- tests/adaptive-quiz.spec.js: besvarte ferdigheter gir riktige leksjoner, også ved alt riktig og avbrudd.
- tests/import-export-compat.spec.js: kompatibel lesestatus og bevart gammel progresjon.
- tests/verb-focus.spec.js: adapter og leksjonskontekst i verbøving.
- scripts/check-grammar-lessons.mjs (ny): katalog- og oppgaveinvarianter; package.json får tilhørende check:grammar-lessons.
- README.md: kort forklaring av leksjonsflyt, innholdsformat og redaksjonell godkjenning.

## Verifikasjon og akseptanse

For hver leksjon skal en elev kunne åpne riktig teori, lese forklaringen, starte en økt hvor alle svaralternativer passer, fullføre og gå mellom resultat og teori uten at resultat eller lekseøving registreres på nytt. Neste besøk skal tilby direkte øving. Tilbake fra førstegangslesing skal vise riktig leksjonsoversikt, også når et gammelt quizresultat finnes i DOM.

Kjør relevante kontroller etter hvert berørt område:

```sh
node scripts/check-grammar-lessons.mjs
npm run check:learning-catalog
npx playwright test tests/grammar-lessons.spec.js tests/adaptive-quiz.spec.js --browser chromium --workers=1
npx playwright test tests/import-export-compat.spec.js --browser chromium --workers=1
npx playwright test tests/verb-focus.spec.js --browser chromium --workers=1
npm run extract:items
npm run check:content-accuracy
git diff --check
```

Første kommando gjelder etter at validatoren er implementert. Kjør import/eksport- og verbtestene når de respektive områdene endres. Ved CSS-endringer: npm run build:css og npm run check:tailwind.

Browserkontroll med faktiske klikk og tastatur, ikke bare direkte funksjonskall: første besøk, gjenbesøk etter reload, «Les teori», «Lær mer», start, svar, fullføring og tilbake. Test tom/ugyldig katalog, upublisert leksjon og ingen passende oppgaver uten blank side. Ta og inspiser skjermbilder av detaljert teori og kontrolloppgave ved 360 px og desktop; kontroller fokus, lesbar fet skrift og horisontal overflow.

Tekniske tester erstatter ikke faglig gjennomgang. Ingen leksjon regnes som ferdig bare fordi JSON er gyldig eller eksisterende tester er grønne.
