# Faglig innholdsforbedring - revidert implementeringsplan

## Mål

Utvid appens A0-A1-innhold og produksjonsaktiviteter uten å svekke:

- faglig korrekthet og entydige oppgaver
- lokal fremgang, eksport/import og eksisterende elevflyt
- personvern og no-login/local-first-arkitekturen
- diagnostikkens stabile kontrakt
- tilgjengelighet og brukbarhet på mobil

Appens A0/A0+/A1-start/A1 er lokale rutingsbånd for øving, ikke CEFR-sertifisering.

## Adversarial review - innarbeidede beslutninger

Planen er revidert etter adversarial review. Følgende regler er bindende:

1. TTS behandles som en valgfri lokal browserfunksjon, ikke som en garantert identisk offline-stemme.
2. Automatisk lyd er av som standard inntil eleven har aktivert lyd for økten. Manuell avspilling finnes alltid når TTS støttes.
3. `hay` modelleres som en grammatikkonstruksjon, ikke som et vanlig verb i `verbDatabase`.
4. Nye diagnoseitems blandes ikke inn i eksisterende 12-itemsdiagnose uten `diagnosis-v2`, migrering og ny kalibrering.
5. Typed-øvelser bruker samme strukturerte svarmodell som diagnose: flere korrekte svar, variantregler, near-miss-regler og normaliseringspolicy.
6. Alt nytt innhold får stabile ID-er, provenance, nivåbånd, læringskatalogkobling og automatiske innholdsgater.
7. Første leveranse er en liten pilot-slice. De store innholdslistene bygges først etter at plattformkontraktene er grønne.

## Privacy og lyd

Appen sender ikke lyd, elevsvar eller progresjon til en server. `speechSynthesis` kontrolleres av nettleseren og operativsystemet. Derfor skal brukergrensesnittet si at appen ikke laster opp lyd, men ikke love at alle operativsystemstemmer er lokale.

TTS-hjelperen skal:

- kontrollere `typeof window.speechSynthesis === 'object'`
- vente på `voiceschanged` når stemmelisten ikke er klar
- velge en spansk stemme med `lang` som starter med `es`, med `es-ES` som preferanse
- falle tilbake til utterance med `lang = 'es-ES'` dersom ingen spansk stemme finnes
- bruke `speechSynthesis.cancel()` før ny utterance for å unngå lydkø
- håndtere `onerror` uten å blokkere økten
- eksponere `isSpeechAvailable()` og en synlig «Lyd er ikke tilgjengelig»-tilstand
- aldri lese norsk instruksjon med spansk stemme ved en feil

Lyd skal ikke auto-spilles på hver render. Økten kan ha en eksplisitt «Spill spansk lyd automatisk»-innstilling, av som standard. Fasiten kan leses etter at eleven har svart, men ikke før meningsfull innsats.

## Fase 0: kontrakter og innholdsgate

Før nye aktiviteter bygges skal følgende kontrakter dokumenteres i kodekommentar eller en liten lokal modell:

### Innhold

Alle nye gloser skal ha minst:

```js
{
  id: 'a0.greetings.hola',
  categoryId: 'greetings',
  spanish: 'hola',
  norwegian: ['hei', 'hallo'],
  gender: null,
  levelBands: ['A0'],
  sourceNote: 'written-original'
}
```

Kjønn/artikkel skal lagres separat når det er en del av målet, for eksempel `la cabeza`, og skal ikke skjules i en løs oversettelsesstreng.

Alle nye verb skal ha eksplisitt metadata for mønster, presensformer, aksenter og eksempelsetning. `hay` skal ikke tilfredsstille denne verbkontrakten.

### Typed-svar

Typed grammatikk- og diktasjonsitems skal støtte:

- `acceptedAnswers[]` for likeverdige svar
- `variantRules[]` for case/aksent-varianter
- itemspesifikke `nearMissRules[]`
- `normalization` for mellomrom, Unicode og tegnsetting
- `explanation` og `contentVersion`

Synonymer skal modelleres som samme `canonicalMeaningId`, slik at `alumno` og `estudiante` gir én korrekt evidens, ikke to poeng. Krav som «begynner på a» skal være eksplisitt metadata, ikke gjemmes i fritekst.

### Innholdsgate

`check:content` skal utvides eller suppleres med validering av:

- unike ID-er og kategori-ID-er
- ingen dubletter mot eksisterende glossary/verb/grammar-data
- gyldige spanske aksenter og Unicode NFC
- bokmålstekst og idiomatiske oversettelser
- kjønn/artikkel der relevant
- stabile nivåbånd
- læringskatalogkobling
- alternative korrekte svar
- provenance-note og manuell faglig review

Ingen ny katalog aktiveres før denne gaten og relevante Playwright-tester passerer.

## Fase 1: pilot-slice

Fase 1 skal leveres som separate, små Beads som kan testes og merges uavhengig.

### 1A: TTS-plattform

Implementer én gjenbrukbar `speakSpanish(text, options)`-hjelper og én visuell lydkontroll. Start med flashcardens spanske ord og én quizprompt.

Akseptansekriterier:

- manuell lydknapp finnes og er tastaturtilgjengelig
- TTS-kall bruker spansk tekst og `lang` som starter med `es`
- manglende TTS gir tilgjengelig status, ikke JavaScript-feil
- ny lyd avbryter gammel lyd
- ingen automatisk lyd før eleven har aktivert øktens lydvalg
- tester mocker `speechSynthesis` og verifiserer kall, fallback og error-path
- mobilvisning har ingen layoutskift eller horisontal overflow

### 1B: Kvalitetssikret glosepakke

Start med én pakke på 12-15 gloser: hilsener, én ukedagsgruppe og noen kroppsdeler. Ikke legg inn alle 51 glosene ennå.

Før innlegging skal hver glose kontrolleres mot eksisterende data for semantisk dublett, ikke bare identisk ID. Test retningene spansk-norsk og norsk-spansk, kjønn/artikkel og alternative norske svar.

Akseptansekriterier:

- alle gloser har stabile ID-er og kategori
- ingen eksisterende glose får ny SM-2-duplikat
- alle nye gloser vises i vanlig flashcard og adaptiv quiz
- læringskatalog/brainmap kobles bare dersom det finnes en definert node
- eksport/import bevarer de nye kortene
- `check:content` og innholdsreview passerer

### 1C: To verbmønstre

Legg til bare `jugar` og `dar` som første verbtest. De dekker henholdsvis stammeendring og uregelrett kort verb.

For hvert verb skal alle støttede tider og personer ha eksplisitte former, aksenter, eksempel og tester. De øvrige verbene (`pensar`, `llegar`, `poner`, `tomar`, `creer`) kommer først etter at datamodellen er verifisert.

## Fase 2: produksjon

### 2A: Typed grammatikk proof-of-concept

Ikke konverter hele grammatikkbanken. Velg 2-3 eksisterende øvelser med entydig fasit, for eksempel bestemt/ubestemt artikkel med eksplisitt kontekst og en enkel ser/estar-lokasjon.

Akseptansekriterier:

- eleven kan svare med Enter via én autoritativ submit-path
- korrekt synonym/alternativ variant godtas når den er faglig likeverdig
- manglende aksent klassifiseres separat når aksent ikke er hovedkonstrukt
- `tú/tu` og andre betydningsbærende aksenter kan fortsatt testes strengt
- near-miss gir pedagogisk forklaring, men endrer ikke fasit
- progress oppdateres nøyaktig én gang
- øvelsen fungerer med tastatur og på 390px bredde

### 2B: Diktasjon v1

Diktasjon skal starte med spansk ord eller kort, kjent uttrykk til typed svar. Ikke bland ord- og setningsdiktat i første versjon.

Itemkontrakten skal inneholde retning, stimulus, godkjente svar, aksentpolicy, forklaring og progress-event. Utvalget skal være seedbart i tester og prioritere elevens aktive læringskatalog fremfor tilfeldig hele glossary.

Akseptansekriterier:

- 5 items per økt med tydelig start, neste og avslutning
- TTS kan spilles én eller to ganger med manuell kontroll
- svar, near-miss og feil vises tydelig
- ingen mikrofon, lydopptak eller ekstern request
- diktasjonens progress og eksport/import er testet
- manglende TTS gir en forståelig alternativ melding

## Fase 3: grammatikkinnhold

Bygg ett tema om gangen, hver som en egen Bead med faglig review og tester:

1. `questionWords`: qué, dónde, cuándo, quién, cómo, por qué, cuál, cuánto
2. `negation`: no, nunca, nadie, nada, tampoco
3. `hayAndPrepositions`: hay, a, de, con, en, med tydelig avgrensning av por/para
4. `tenerExpressions`: tener hambre/sed/sueño/frío/calor og tener que
5. `irAInfinitive`: presens av ir + a + infinitiv

Hvert tema skal ha:

- kort norsk teori
- 8-10 faglig gjennomgåtte items før utvidelse
- minst én typed øvelse først når fasiten er entydig
- alternative korrekte svar eksplisitt modellert
- forklaring ved feil
- læringskatalog-ID og brainmap-status
- tester for options, accepted answers, teori og progress

Por/para og qué/cuál skal ikke introduseres som absolutte én-til-én-regler. Hvert item må gi konteksten som avgjør svaret.

## Fase 4: katalog og eksisterende aktiviteter

### 4A: Læringskatalog

Legg kun til katalog-noder etter at tilsvarende innhold og øvelser finnes. Nye diagnoseitems skal ikke endre `diagnosis-v1`.

Hvis nye items skal brukes i nivåprofilering, opprett `diagnosis-v2` som en separat Bead med:

- ny stabil itemliste
- versjonert scoring og terskler
- migrering/restart-regler
- analyse av gamle versus nye resultater
- egne tester og tydelig UI-tekst om at dette er en ny diagnose

Alternativt brukes de nye items først som adaptive observasjoner etter eksisterende diagnose.

### 4B: Puslespill og preposisjonsspill

Utvid først med 6-8 setninger og relevante preposisjoner. Hver setning skal ha forventede ordrekkefølger og eksplisitte alternative varianter der det er nødvendig. Ikke øk direkte til 40+ setninger eller 14 preposisjoner uten innholdsreview.

## Fase 5: senere aktiviteter

Lesetekster, skriving og TTS på verbtabeller er egne framtidige Beads. De krever egne kontrakter for tekstnivå, forståelsessvar, alternative formuleringer, personvern og mobiltilgjengelighet. De inngår ikke i første implementeringsrunde.

## Avhengigheter og parallellisering

```text
Fase 0 kontrakter/gate
  ├── 1A TTS-plattform
  ├── 1B glosepakke
  └── 1C to verbmønstre

1A ──> 2B diktasjon
Fase 0 + 1B/1C ──> 2A typed proof-of-concept
2A ──> Fase 3 grammatikktemaer
Fase 3 ──> 4A læringskatalog
1B + 3 ──> 4B puslespill/preposisjoner
```

1A, 1B og 1C kan gjennomføres parallelt etter at Fase 0-kontrakten er avklart. Fase 2A kan starte med eksisterende innhold mens nye grammatikktemaer venter på den verifiserte typed-modellen.

## Estimat

Estimatet gjelder første pilot-slice, ikke hele Fase 1-4:

| Slice | Estimat |
|---|---:|
| Fase 0-kontrakter og innholdsgate | 2-4 timer |
| 1A TTS-plattform | 3-5 timer |
| 1B kvalitetssikret glosepakke | 2-3 timer |
| 1C to verbmønstre | 2-3 timer |
| 2A typed proof-of-concept | 3-5 timer |
| 2B diktasjon v1 | 4-6 timer |

Større innholdsutvidelser estimeres først etter at pilot-slicen er grønn. Det opprinnelige 20-25-timersestimatet gjelder derfor ikke lenger som leveranseløfte.

## Verification

Etter hver Bead kjøres relevante tester, ikke bare ved slutten:

```bash
npm run check:content
npm run check:learning-catalog
npm run check:diagnosis-catalog
npm run check:tailwind
npm run build:css
git diff --check
```

TTS-testene skal mocke browser-API-et og dekke tilgjengelig, utilgjengelig, manglende stemmeliste, `voiceschanged`, avbrutt lyd og utterance-feil. Minst én manuell test skal kjøres i Chrome og Safari på desktop eller mobil.

For alle innholdsslices skal relevante Playwright-tester dekke:

- vanlig elevflyt på 390px og desktop
- Enter og tastatur
- korrekt svar, alternativt korrekt svar, near-miss og feil
- ingen dobbeltinnsending
- progress/export/import
- ingen horisontal overflow
- eksisterende diagnose, quiz, verb, grammatikk, spill og lekseflyt

Før pilot kjøres `npm run test:all` og den modellstyrte studentvideo-auditen. Videoauditens output skal inspiseres manuelt, men video eller elevdata skal ikke committes.

## Non-goals i denne runden

- ingen sky, login, analytics eller mikrofon
- ingen ny diagnoseversjon før separat beslutning og kalibreringsplan
- ingen masseinnlegging av 51 gloser eller 8 verb før pilot-slicen er verifisert
- ingen automatisk lyd som standard
- ingen store arkitekturendringer eller oppsplitting av `index.html`
- ingen CEFR-påstander basert på den korte diagnosen
