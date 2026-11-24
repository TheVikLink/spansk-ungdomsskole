# Lærer-elev leksepakke round-trip: glosekobling

## Mål

Gjøre eksisterende innebygde gloser øvbare etter import av en lærerleksepakke, uten dubletter, uten å endre eksportformatet unødvendig og uten å bryte nye ord, verb, grammatikk eller lokal persistens.

## Avgrensning

- Behold assignment-v1 og eksisterende activeAssignment-lagring.
- Behold importedWords som antall nye kort som faktisk ble lagt til.
- Bruk activeAssignment.vocabulary som fasit for hvilke gloser leksepakken målretter.
- Ikke sett assignmentId på eksisterende innebygde kort; ett kort skal ikke eies av én lekse.
- Nye importerte kort beholder dagens assignmentId-kobling.
- Behold fallback til assignmentId for eldre lagrede leksepakker som mangler vocabulary.

## Kontrakt

### Import og lagring

1. Normalisering av en pakke lagrer hele, normaliserte vocabulary-listen som pakkens mål.
2. Import analyserer fortsatt rader mot elevens kortstokk:
   - Nye ord legges til som lokale kort med assignmentId.
   - Eksisterende ord hoppes over som nye kort, men regnes fortsatt som tilgjengelige lekseord.
3. activeAssignment beholder:
   - vocabularyCount: antall ord i pakken.
   - importedWords: antall nye kort.
   - skippedWords: antall eksisterende/avviste rader, med dagens semantikk.
   - vocabulary: pakkens fullstendige ordliste.
4. En ren resolver finner elevens aktuelle kort ved å matche norsk, spansk og normalisert kategori mot activeAssignment.vocabulary. Den skal:
   - inkludere både innebygde og nye kort,
   - ikke inkludere andre ord fra samme kategori som læreren ikke valgte,
   - deduplisere samme kort/pair,
   - tåle at et kort senere er fjernet.
5. For eldre assignment-data uten vocabulary brukes dagens assignmentId-filter som fallback.

### Start gloser

- renderAssignmentActions() viser Start gloser når pakken har målrettede ord, basert på vocabulary.length, ikke importedWords > 0.
- startActiveAssignmentVocabulary() bruker resolveren og starter en vanlig gloseøkt mot det konkrete kortutvalget.
- Hvis resolveren finner null kort, vises en tydelig feilmelding om at ordene ikke finnes lokalt lenger.
- Vanlig gloseøkt, due/repetisjon, tidsmål, progress og abandonment-guard skal beholde eksisterende oppførsel.

### Lærerfeedback

Etter bygging/nedlasting skal statusen forklare forskjellen mellom nye og eksisterende ord, for eksempel:

Leksepakke laget med 60 gloser. Ord eleven allerede har, hoppes over som nye kort, men brukes fortsatt i lekseøkten.

Teksten må være generell fordi læreren ikke kjenner elevens lokale kortstokk. Den skal ikke antyde at eleven har fullført leksen.

### Builder-rendering

- Verifiser at renderHomeworkPage() fyller kategori-, verb- og grammatikkfeltene ved sidevisning.
- Hvis eksisterende test viser at dette ikke skjer stabilt, flyttes kallet til en tydelig idempotent homework-render-initiering. Ikke legg til polling eller timing-avhengig logikk.

## Implementasjonssteg

1. Opprett og claim en Beads-oppgave for round-trip-fiksen.
2. Skriv røde tester i tests/assignment-package.spec.js for:
   - eksisterende innebygde kategorikort gir importedWords: 0, men viser Start gloser,
   - start av pakken finner og øver på eksisterende kort,
   - blanding av eksisterende og nye ord gir riktige kort uten dubletter,
   - re-import fortsatt er idempotent og startbar,
   - lærerstatusen forklarer hoppede eksisterende ord,
   - builder-feltene faktisk er fylt etter sidevisning.
3. Implementer en ren assignment-vocabulary-resolver nær eksisterende import/helpers i index.html.
4. Utvid gloseøktens startfunksjon med et valgfritt konkret kortutvalg, uten å endre vanlige kall.
5. Bytt assignment-handlingene til resolveren og behold legacy-fallback.
6. Oppdater lærerstatus og eventuelle visningstall.
7. Kjør fokustester og juster eksisterende forventninger bare der den nye, dokumenterte semantikken krever det.

## Berørte filer

- index.html
  - assignment normalisering/import,
  - assignment action rendering,
  - assignment vocabulary resolver,
  - gloseøkt-start,
  - teacher builder status/rendering.
- tests/assignment-package.spec.js
  - round-trip, blandet nytt/eksisterende, re-import, status og builder-initiering.
- package.json
  - ingen nytt script forventet; bruk eksisterende test:assignment-package.
- thoughts/shared/plans/2026-08-10_assignment-roundtrip-fix.md
  - denne kontrakten og verifikasjonsevidence.

## Verifikasjon

Først:

~~~bash
npm run test:assignment-package
~~~

Deretter:

~~~bash
npm run check:content
npm run check:learning-catalog
npm run check:tailwind
npm run test:all
git diff --check
~~~

Round-trip-beviset skal eksplisitt vise:

- lærerpakke med kun eksisterende innebygde gloser,
- elevimport med null nye kort,
- Start gloser synlig,
- økt med de valgte eksisterende kortene,
- ingen dubletter etter re-import,
- nye ord importeres fortsatt og kan øves,
- lokal activeAssignment overlever reload/export/import.

## Implementert

- `resolveAssignmentVocabularyCards()` bruker pakkens ordliste som fasit og har legacy-fallback via `assignmentId`.
- Eksisterende og nye kort kan øves i samme assignment-økt uten dubletter.
- Reimport er idempotent, og builder-statusen forklarer at eksisterende elevkort hoppes over som nye kort.
- Verifisert med 13 assignment-tester og full `npm run test:all`.
