# Fotografisk bilderevisjon for kulturpakkene

Status 7. oktober 2026: De seks Mundo AM-bildene nedenfor er historikk. Disse oppleggene bruker nå ekte fotografier; se [gjeldende bilde- og kildeprotokoll](mundo-am/bilde-og-kildeprotokoll.md). De to julebildene er fortsatt i bruk.

Produkteierens tilbakemelding 6. oktober 2026 var at de glade, mettede illustrasjonene var umiddelbart gjenkjennelige som KI-genererte. Det aktive bildesettet er derfor erstattet med et vesentlig annet uttrykk: vanlig kameravinkel og lys, dempede farger, synlige materialer og hverdagsdetaljer. Seks Mundo AM-motiver og de to julemotivene er revidert. Bildene støtter teksten gjennom gjenstander og situasjoner fremfor poserte familieportretter.

Genereringen bruker innebygd `image_gen`, ingen CLI/API-fallback. [Nøyaktige prompter](fotografiske-bilder-prompter.json), [den avgrensede redigeringen av Valencia-boken](fotografiske-bilder-redigeringer.json) og [alle aktive filreferanser, originaler og SHA-256](fotografiske-bilder-filer.json) er lagret. Nye filer er versjonert; tidligere illustrasjoner er bevart som historikk. Alle aktive bilder er 1536 × 1024 piksler, kopiert fra generatorens originalfiler uten lokal bildebehandling.

Bildene har et fotografisk uttrykk, men er **genererte fiktive motiver**. De er ikke fotografiske bevis for hvordan en bestemt gate, kafé, bygning, marked eller familie faktisk ser ut. Merkingen er beholdt på nettsidene og i papirarkene. Kulturfakta bygger fortsatt på kildene i hver pakke og kartene på Natural Earth. Det gjøres ingen påstand om at resultatene ikke kan gjenkjennes som KI-genererte.

## Visuell kontroll

Honduras viser myk hvetetortilla med bønner og ost, vann, ryggsekk og skrivebok. Cartagena viser tilberedt fisk, ris, flaske, pose og rengjøringshansker. Oaxaca viser mais, papaya, tomater og sjokolade i kopp. Valencia viser hvit horchata, avlange fartons, sykkel og appelsiner. Cusco viser forskjellige poteter, mais, tekstiler og tøypose. Bata viser tegnebok, fargeblyanter, vannflaske, kokebananer og båt.

Julebildet for Spania har turrón med synlige mandler, en gave, et juletre og familiemedlemmer som deltar i måltidet uten å posere. Chile har et rundt pan de Pascua med synlig frukt og nøtter, gave, tre og en annen familie. Spania har mørke vintervinduer; Chile har sommerklær og lys fra et åpent dørparti. Motivet dokumenterer ikke et bestemt klokkeslett.

Valencia-genereringen fikk først uønsket pseudotekst i skriveboken. Den er fjernet med en avgrenset redigering; den aktive boken har blanke linjer. Andre gjenstander og det fotografiske uttrykket er beholdt.

Alle 34 bildeord er plassert på nytt på synlige gjenstander. De to mobiltestene kontrollerer nå også begge julebilder: hvert punkt trykkes separat, viser riktig spansk/norsk ord og kan lukkes, på 360 og 390 pikslers bredde. Testene består. Den utvidede testen fikk først en feil fordi den ikke avgrenset mellom Spania- og Chile-panelet; det er rettet i testen.

Alle 14 aktuelle PDF-er er bygget på nytt fra samme datakilde. De 51 sidene er rasterisert og kontrollert visuelt. Tekstuttrekk bekrefter komplette avsnitt, alle spørsmål og alternativer, lærerfasiter, 515 leseoppslag og 70 øvingsordpar. Eldre elevark med støttevarianter er fortsatt historiske og er ikke bygget om.

Fersk sluttkjøring av `npm run test:all` bestod: 68 enhetstester, 52 servertester og 505 Chromium-tester, 625 totalt. `build:app`, `check:culture`, `check:vocabulary` og `git diff --check` består også. Den tidligere testen for bildemerking krevde ordet «illustrasjon»; den godtar nå også «bilde», men krever fortsatt eksplisitt KI-merking. Kulturoversikten og Honduras på mobil er kontrollert i nettleseren.

Arbeidssak: Beads `spansk-ungdomsskole-w7v9`. Ingen publisering.

## Aktive motiver og koordinater

Bildekoordinatene er andeler av bildets bredde og høyde fra øvre venstre hjørne. Se filregisteret for originalfil og hash.

### Jul i Spania og Chile – Spania

[images/kultur/jul-spania-chile/espana-navidad-foto-v2.png](../../images/kultur/jul-spania-chile/espana-navidad-foto-v2.png)

| Nummer | Spansk | Norsk | x | y |
|---:|---|---|---:|---:|
| 1 | la familia | familie | 0.290 | 0.230 |
| 2 | el turrón | her: mandelkonfekt | 0.295 | 0.720 |
| 3 | el regalo | gave | 0.785 | 0.750 |
| 4 | el árbol de Navidad | juletre | 0.940 | 0.275 |

### Jul i Spania og Chile – Chile

[images/kultur/jul-spania-chile/chile-navidad-foto-v3.png](../../images/kultur/jul-spania-chile/chile-navidad-foto-v3.png)

| Nummer | Spansk | Norsk | x | y |
|---:|---|---|---:|---:|
| 1 | la familia | familie | 0.260 | 0.220 |
| 2 | el pan de Pascua | et chilensk julebakverk med frukt, nøtter og krydder | 0.440 | 0.640 |
| 3 | el regalo | gave | 0.875 | 0.830 |
| 4 | el árbol de Navidad | juletre | 0.900 | 0.350 |

### Honduras: Un día en Copán Ruinas – Honduras

[images/kultur/mundo-am/honduras-dia-foto-v2.png](../../images/kultur/mundo-am/honduras-dia-foto-v2.png)

| Nummer | Spansk | Norsk | x | y |
|---:|---|---|---:|---:|
| 1 | una baleada | en honduransk hvetetortilla med fyll, her bønner og ost | 0.430 | 0.590 |
| 2 | el agua | vann | 0.915 | 0.400 |
| 3 | la mochila | ryggsekk | 0.115 | 0.460 |
| 4 | el cuaderno | skrivebok | 0.850 | 0.800 |

### Colombia: Un día en Cartagena – Colombia

[images/kultur/mundo-am/colombia-dia-foto-v2.png](../../images/kultur/mundo-am/colombia-dia-foto-v2.png)

| Nummer | Spansk | Norsk | x | y |
|---:|---|---|---:|---:|
| 1 | el arroz | ris | 0.270 | 0.620 |
| 2 | el pescado | fisk | 0.450 | 0.620 |
| 3 | la botella | flaske | 0.730 | 0.370 |
| 4 | los guantes | hansker | 0.880 | 0.810 |
| 5 | la bolsa | pose | 0.900 | 0.365 |

### Mexico: Un día en Oaxaca – Mexico

[images/kultur/mundo-am/mexico-dia-foto-v2.png](../../images/kultur/mundo-am/mexico-dia-foto-v2.png)

| Nummer | Spansk | Norsk | x | y |
|---:|---|---|---:|---:|
| 1 | el maíz | mais | 0.180 | 0.570 |
| 2 | la papaya | papaya | 0.630 | 0.525 |
| 3 | el tomate | tomat | 0.860 | 0.200 |
| 4 | la taza | kopp | 0.815 | 0.720 |

### Spania: Un día en Valencia – Spania

[images/kultur/mundo-am/espana-dia-foto-v2.png](../../images/kultur/mundo-am/espana-dia-foto-v2.png)

| Nummer | Spansk | Norsk | x | y |
|---:|---|---|---:|---:|
| 1 | la bicicleta | sykkel | 0.900 | 0.570 |
| 2 | la horchata | horchata | 0.320 | 0.680 |
| 3 | los fartons | avlange søte bakverk | 0.565 | 0.775 |
| 4 | la naranja | appelsin | 0.285 | 0.145 |

### Peru: Un día en Cusco – Peru

[images/kultur/mundo-am/peru-dia-foto-v2.png](../../images/kultur/mundo-am/peru-dia-foto-v2.png)

| Nummer | Spansk | Norsk | x | y |
|---:|---|---|---:|---:|
| 1 | la papa | potet | 0.200 | 0.510 |
| 2 | el maíz | mais | 0.505 | 0.425 |
| 3 | la bufanda | skjerf | 0.660 | 0.760 |
| 4 | la bolsa | pose | 0.920 | 0.520 |

### Ekvatorial-Guinea: Un día en Bata – Ekvatorial-Guinea

[images/kultur/mundo-am/guinea-ecuatorial-dia-foto-v2.png](../../images/kultur/mundo-am/guinea-ecuatorial-dia-foto-v2.png)

| Nummer | Spansk | Norsk | x | y |
|---:|---|---|---:|---:|
| 1 | el cuaderno | skrivebok | 0.295 | 0.675 |
| 2 | el lápiz | blyant | 0.550 | 0.500 |
| 3 | la botella de agua | vannflaske | 0.790 | 0.445 |
| 4 | los plátanos | her: kokebananer | 0.900 | 0.780 |
| 5 | la barca | båt | 0.912 | 0.210 |
