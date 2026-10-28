# Genererte bilder til jul i Spania og Chile

## Gjeldende fotorevisjon

Etter produkteierens tilbakemelding er de maleriske familieportrettene erstattet av nye genererte bilder med fotografisk uttrykk: `espana-navidad-foto-v2.png` og `chile-navidad-foto-v3.png`. Turrón/pan de Pascua, gave, juletre og ulike fiktive familier er fortsatt synlige. Familiene er opptatt med måltidet; bildene har ikke poserte smil mot kameraet. Åtte punktkoordinater og begge alternative bildebeskrivelser er oppdatert i datakilden.

Se [gjeldende bildeprotokoll med prompter, filreferanser og kontroll](fotografiske-bilder.md). Bilder, ordpunkter, nettsider og elev-PDF samsvarer. Bildene er merket som KI-genererte, og er ikke autentiske fotografier eller faktakilder.

## Historikk: tidligere illustrasjoner

Resten av dokumentet beskriver de erstattede v1/v2-illustrasjonene. De gamle filene er bevart som historikk og brukes ikke lenger i aktive nettsider eller aktuelle PDF-er.

Prosjektutkast, revidert 6. oktober 2026. Produkteieren foretrekker egen bildegenerering. Dette dokumentet registrerer de nøyaktige promptene og kontrollen av de to illustrasjonene. Bildene skal merkes **KI-generert illustrasjon** i elevmaterialet. De viser fiktive eksempler og er ikke faktakilder, faktiske familier eller representative bilder av alle i et land.

Genereringsmåte: innebygd `image_gen`, brukt via [imagegen-skill](/Users/olehenrikvik/.codex/skills/.system/imagegen/SKILL.md). De første bildene ble generert uten referanser; Chile v2 er redigert med de to lokale v1-bildene som referanser. Ingen CLI/API-fallback er brukt. Plan: [Jul i Spania og Chile](../../thoughts/shared/plans/2026-10-05_jul-spania-chile-kultur-til-gloser.md).

## Status og filer

To prosjektutkast er generert, vist og visuelt kontrollert. Begge er PNG i 1536 × 1024 piksler og forhold 3:2. Kopier er lagret i prosjektet; de opprinnelige generatorfilene er bevart. [Den lokale julepakken](jul-spania-chile/README.md) har nå interaktive ordpunkter, alternativ ordliste og nummererte PDF-bilder. Prøven virker også når HTML-filen åpnes lokalt uten nett. Produksjonskomprimering, faglig godkjenning, hovedappintegrasjon og hovedappens offline-oppsett gjenstår.

| Utkast | Fil | Filstørrelse |
|---|---|---|
| Spania | [espana-navidad-v1.png](../../images/kultur/jul-spania-chile/espana-navidad-v1.png) | 2 472 260 byte. |
| Chile | [chile-navidad-v2.png](../../images/kultur/jul-spania-chile/chile-navidad-v2.png) | 2 458 370 byte. |

Chile v1 er bevart som historisk original, men brukes ikke lenger i nettprøven eller PDF-ene. Det viste personer som lignet for mye på Spania-familien. Produkteieren ba derfor om en tydelig annen familie.

## Visuell kontroll

Begge motivene har fire fiktive personer, gaver, juletre og en klart synlig søtsak. Uttrykket er sammenhengende og detaljert, med malerisk tekstur og realistiske personer. Det er mer realistisk enn en enkel flat tegning, så illustrasjonsmerkingen er særlig viktig. Ingen innbakte ordetiketter, knapper, nummerering, logoer eller alkohol er synlige.

Spania-utkastet viser en tydelig rektangulær mandelsøtsak på bordet og mørk kveld utenfor. Chile-utkastet viser et rundt fruktbakverk med utskåret stykke og lyst, varmt kveldsmiljø. Store gjenstander kan få separate markører; noen pyntedetaljer er tett plassert og skal ikke få egne små treffområder. Velg bare tydelige gjenstander med plass til minimumsmålene i planen. Bevar hele 3:2-utsnittet ved responsiv visning.

Denne kontrollen gjelder synlig utforming, ikke matfaglig/kulturell godkjenning. Særlig pan de Pascua-formen, frukt-/nøtteutseendet og eventuelle detaljer i julepynt må vurderes av spansklærer. En oppdiktet utsikt eller bygning identifiserer ikke en faktisk by. Spania v1 og Chile v2 viser ulike fiktive familier. Personenes utseende brukes ikke som et bilde av nasjonal identitet eller representative innbyggere.

## Ordpunkter i den lokale prøven

Koordinater er sentrumspunkter i originalbildet, målt som andel fra venstre/topp (0–1). Den lokale prøven bruker disse punktene fra `data/culture-packages.json`. Treffer på minst 44 × 44 px, avstand og visning er kontrollert ved 390 px; hovedappintegrasjon får egen kontroll. Etter byttet til Chile v2 er alle fire etiketter og plasseringen kontrollert på desktop og 390 px mobil, inkludert Escape-lukking. Alle 11 sider i de tre gjenbygde PDF-ene er visuelt undersøkt; de to elevarkene inneholder den nye bildefilen, bekreftet med pikselkontroll. Nye standardord får review-ID først etter ordinær faglig behandling.

| Bilde | Punkt | Foreslått plassering x/y | Referanse og visning |
|---|---|---|---|
| Spania | Familie | 0,38 / 0,38 | Kjerneordkandidat: `la familia – familie`. |
| Spania | Turrón | 0,58 / 0,73 | Lesestøtte: `el turrón`, norsk forklaring gjennomgås faglig. |
| Spania | Gave | 0,86 / 0,65 | Kjerneordkandidat: `el regalo – gave`. |
| Spania | Juletre | 0,90 / 0,20 | Lesestøtte: `el árbol de Navidad – juletre`. |
| Chile | Familie | 0,39 / 0,35 | Kjerneordkandidat: `la familia – familie`. |
| Chile | Pan de Pascua | 0,44 / 0,72 | Lesestøtte: `el pan de Pascua`, norsk forklaring gjennomgås faglig. |
| Chile | Gave | 0,93 / 0,46 | Kjerneordkandidat: `el regalo – gave`. |
| Chile | Juletre | 0,92 / 0,19 | Lesestøtte: `el árbol de Navidad – juletre`. |

Foreslått bildebeskrivelse Spania: «Illustrasjon av fire personer samlet ved et julebord. På bordet ligger mandelsøtsaker. Et pyntet juletre og innpakkede gaver står ved siden av. Det er mørkt utenfor.»

Bildebeskrivelse Chile v2: «Illustrasjon av en eldre kvinne, en voksen kvinne og to ungdommer ved et bord med et rundt fruktbakverk og et utskåret stykke. Ved siden av står et pyntet juletre og gaver. Et åpent vindu viser et lyst kveldsmiljø.»

## Kulturgrunnlag

Turrón i Spania og pan de Pascua/jul om sommeren i Chile er tekstens avgrensede eksempler, støttet av [Spanias turistportal](https://www.spain.info/es/top/tradiciones-navidad-espana/) og [Chile Travel](https://chile.travel/blog/viejo-pascuero-el-llamativo-nombre-de-santa-claus-en-chile/). Illustrasjonene dokumenterer ikke detaljene i en bestemt families feiring. Gaver i motivet sier ikke hvilken dato de åpnes. Unngå å bruke tilfeldige klær, personer eller interiør som bevis på nasjonal kultur.

## Nøyaktig prompt: Chile v2 – ny familie

Redigert 6. oktober 2026 med to lokale referanser: Chile v1 var redigeringsmålet; Spania v1 var referanse for stil og for ansikter som ikke skulle gjenbrukes. Bare ett nytt Chile-bilde ble generert. Generatorfilen er bevart som `/Users/olehenrikvik/.codex/generated_images/01a10ba0-1388-7141-9be5-d89d9fa8a60e/exec-bca3c330-3c8e-4dfb-a0a0-61eae74506ad.png`.

Chile v2: PNG, 1536 × 1024 px, 2 458 370 byte; SHA-256 `675a7d6e9689cfce3781d8263fa97d22e137a7defe5076f1d9e3525a935c0a4f`. Spania v1 er uendret, bekreftet med SHA-256 `71ba8e9bf8e8e344f6271805c8cfda63adef07ab6f15e693ff7e547c533ef0ba`.

Visuell kontroll av v2: den eldre kvinnen med sølvgrått hår og briller erstatter mannen bak bordet; ungdommene og den voksne kvinnen har andre ansikter, frisyrer og klær enn Spania-familien. Bildet har fortsatt fire personer. Fruktbakverket, utskåret stykke, sommerlys, gaver og juletre er tydelige. De fire opprinnelige punktkoordinatene treffer fortsatt familiegruppen, bakverket, gaveeskene og treet.

```text
Edit the FIRST attached image, the Chile Christmas illustration, and return ONE finished Chile illustration. The SECOND attached image is the Spain illustration and is reference only: do not alter it and do not reuse any of its people.

The product needs two clearly different fictional families. Replace all four people in the Chile picture with four NEW people whose facial identities are unmistakably different from the people in BOTH references. Change faces, ages, hairstyles, and clothing, rather than simply recoloring the same family. Use this new four-person household: an elderly grandmother with short silver hair and round glasses, standing behind the table where the original father stood; a teenage boy at the left with closely cropped dark hair and a mustard short-sleeved shirt; a teenage girl near the middle with short wavy hair and a light teal top; and an adult mother at the right with straight shoulder-length dark hair, a distinctly different rounder face, and a simple light-colored summer blouse. Give them distinct natural facial features and warm, relaxed expressions. No additional people. They are ordinary fictional people, not representations of a national ethnic appearance; no national costumes or stereotypes.

Preserve the original Chile illustration's scene composition, object placement, table, background, editorial painted illustration style, warm summer evening light, open window on the left, Christmas tree on the right, and wrapped gifts below it. Preserve the round brown pan de Pascua fruitcake near the front center, including the separate cut slice on a plate. Keep the fruitcake, tree, and gifts clearly recognizable and unobstructed for interactive vocabulary hotspots. Preserve the original landscape 3:2 framing at 1536 by 1024 pixels. Use natural hands and anatomy. No printed words, captions, labels, numbers, logos, UI, or alcohol. The finished picture must look like the same illustrated lesson series while showing a genuinely different family.
```

## Nøyaktig prompt: Spania v1

```text
Use case: illustration-story.
Asset type: original educational illustration for a Norwegian Spanish-learning website used by teenagers and their teachers.
Primary request: Make one polished, landscape illustration (approximately 3:2, ideally 1536 by 1024) that supports a short text about Christmas. The app will later add interactive vocabulary buttons over visible objects. Do not create a website mockup.
Style: contemporary editorial painted illustration, softly textured gouache, clean readable shapes, restrained warm colors, natural human proportions, appealing to ages 12–18, not preschool cartoon, not photorealistic. Keep the image quiet and uncluttered.
Composition: a family gathering around a table in a modest contemporary home, medium wide view. Four fictional family members, including teenagers, with calm natural expressions and accurate hands. Clearly separated visible objects suitable for a few large tap targets: the family group, wrapped gifts, Christmas sweets, and a small Christmas tree. Make these elements recognizable when the image is displayed on a phone. Keep key objects entirely inside the frame with some space around them. Do not overlap the gift box, sweets, and tree.
Constraints: A possible fictional celebration, not a documentary or a universal claim about the country. No written text, captions, letters, numbers, flags, logos, watermarks, UI, arrows, or hotspot markers. No alcohol, branded products, stereotypical national costumes, snow, beach, palm trees, or tourist monument collage. No geographical map. No unnecessary decorative clutter.
Scene: a fictional Christmas Eve family gathering in Spain. A softly lit interior with a dark blue evening outside a window. On the table in the foreground is a clearly visible rectangular slab of almond turrón, partly cut into rectangular pieces, with the almond texture legible. The turrón is a distinctive focal object, not an unlabeled generic cake. Wrapped gifts sit beside the small Christmas tree on one side, separated from the dessert table. Avoid portraying the gifts as a statement about the date they are opened. Warm friendly atmosphere, contemporary everyday clothing, a plausible example of a family gathering rather than an image claiming all Spanish families celebrate identically.
```

## Nøyaktig prompt: Chile v1 – historisk, erstattet av v2

```text
Use case: illustration-story.
Asset type: original educational illustration for a Norwegian Spanish-learning website used by teenagers and their teachers.
Primary request: Make one polished, landscape illustration (approximately 3:2, ideally 1536 by 1024) that supports a short text about Christmas. The app will later add interactive vocabulary buttons over visible objects. Do not create a website mockup.
Style: contemporary editorial painted illustration, softly textured gouache, clean readable shapes, restrained warm colors, natural human proportions, appealing to ages 12–18, not preschool cartoon, not photorealistic. Keep the image quiet and uncluttered.
Composition: a family gathering around a table in a modest contemporary home, medium wide view. Four fictional family members, including teenagers, with calm natural expressions and accurate hands. Clearly separated visible objects suitable for a few large tap targets: the family group, wrapped gifts, Christmas sweets, and a small Christmas tree. Make these elements recognizable when the image is displayed on a phone. Keep key objects entirely inside the frame with some space around them. Do not overlap the gift box, sweets, and tree.
Constraints: A possible fictional celebration, not a documentary or a universal claim about the country. No written text, captions, letters, numbers, flags, logos, watermarks, UI, arrows, or hotspot markers. No alcohol, branded products, stereotypical national costumes, snow, beach, palm trees, or tourist monument collage. No geographical map. No unnecessary decorative clutter.
Scene: a fictional Christmas-season family gathering in Chile during summer. A comfortable contemporary home with an open window admitting soft warm summer evening light; an ordinary residential view, no snow or tropical stereotypes. On the table in the foreground is a clearly visible round golden-brown pan de Pascua Christmas fruit cake with one wedge cut out, showing dried fruit and nuts in the slice. It is a rich brown fruit cake, not white frosted sponge cake. Wrapped gifts sit beside a small Christmas tree on one side, separated from the dessert table. Four fictional family members in ordinary light summer clothes share the scene. Warm friendly atmosphere, a plausible example rather than a claim about every Chilean family. Match the restrained editorial gouache style and clarity described above.
```
