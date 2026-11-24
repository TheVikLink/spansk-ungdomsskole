# Design- og brukervennlighetsgjennomgang av kulturdelen

Gjennomført 7. oktober 2026 mot den lokale versjonen på `http://127.0.0.1:8768/docs/kultur/index.html`. Ingen produktkode, innhold, CSS eller PDF-er er endret. Rapporten, skjermbilder og Beads-oppfølging er leveransene.

Kulturdelen har en tydelig og rolig grunnform. Katalogen er innbydende, lesestøtten ligger ved ordene, og lærerveiledningene gir læreren et konkret undervisningsforløp. Det som mest svekker opplevelsen, er en feil i svarresponsen, lange avstander mellom aktiviteter og en lite stabil lesebredde på desktop. Dette er avgrensede forbedringer innenfor dagens design.

Bildestatus er viktig å beskrive presist: Peru-opplegget bruker ekte fotografier. Juleopplegget bruker fortsatt fotografisk utformede KI-bilder, tydelig merket som slike under bildene og i lærerveiledningen. Jeg har ikke behandlet julebildene som dokumentariske fotografier.

## Grunnlag og avgrensning

Jeg gikk gjennom begge brukerreisene: katalog → lærerveiledning → elevark/elevøkt, og elevøkt → ordoppslag/bildeord → spørsmål → Gloser → retur.

| Kontroll | Faktisk utført |
|---|---|
| Sider | Katalog, Peru-elevøkt, jule-elevøkt og begge lærerveiledningene |
| Desktop | 1440 × 1000; juleveiledningen også ved 1920 × 1080 |
| Mobil | Alle fem sider ved 390 × 844; ingen horisontal sideoverflyt observert |
| Berøring | Emulerte berøringshendelser åpnet og lukket julebildets ordpunkt og et ordoppslag |
| Tastatur | Tab gjennom navigasjon, bildeord og leseord; Escape; lukking med fokusretur; lenke til oppgaver; radiovalg med piltast |
| Svarrespons | Tomt svar, feil svar, riktig svar og endret valg etter riktig svar, i begge opplegg |
| Gloser | Peru fra førstegangsoppsett med syntetisk kallenavn, visning av fasit, ett vurdert kort og retur; riktig juleglosesett åpnet fra juleøkten |
| PDF | Alle fire lenker svarte HTTP 200. Visuell gjennomgang av Peru-elevarkets 4 sider, jule-elevarkets 6 sider og de to lærerveiledningenes 3 sider hver. Lenkeannotasjoner kontrollert. |
| Kontrast | Beregnet fra nettleserens faktiske CSS-farger: brødtekst 14,12:1, dempet tekst på sidebakgrunn 5,37:1, hvit knappetekst på lilla 7,90:1 |

Dette er en ekspertgjennomgang i Chromium, med mobil- og berøringsemulering. Det er ikke en elev-/lærerstudie, en test på fysisk mobil/projektor eller en full gjennomgang med skjermleser. Den faktiske tidsbruken på 45 minutter og faglig nivåtilpasning er ikke utprøvd i klasse. En ekstra simulering av manglende bildefil traff ikke bildeforespørselen og brukes derfor ikke som bevis på feil- eller reservevisning.

Arbeidsmengden er anslått som **liten** for en avgrenset endring i eksisterende tekst, mal eller hendelseshåndtering, og **middels** for endringer i flere visninger som må kontrolleres sammen.

## Ni prioriterte funn

### 1. «Riktig» blir stående når eleven bytter til et galt svar

**Prioritet: høy. Arbeidsmengde: liten. Dokumentert funksjonsfeil.**

**Side og element:** Begge elevøkter, flervalgsspørsmålene og svarmeldingen.

**Observasjon:** I juleopplegget valgte jeg «Nochebuena», sjekket og fikk «Riktig». Deretter valgte jeg «Nochevieja». Meldingen «Riktig» og forklaringen om Nochebuena ble stående. Samme problem oppstod i Peru etter å ha sjekket «Su tía.» og deretter valgt «Su hermano.».

**Virkning:** Eleven ser et galt valgt alternativ samtidig med en positiv vurdering. Det svekker tilliten til oppgaven og kan støtte feil innlæring.

**Konkret forbedring:** Fjern tidligere svarmelding og forklaring straks radiovalget endres. Eventuelt vis «Svaret er endret. Sjekk på nytt.» Behold den aktive handlingen «Sjekk svaret».

![Nochevieja er valgt, men Riktig og forklaringen om Nochebuena står fortsatt på skjermen.](/Users/olehenrikvik/spansk-ungdomsskole/output/playwright/kultur-audit-jul-feil-tilbakemelding.png)

### 2. Elevene må lete seg tilbake gjennom lange sider

**Prioritet: høy. Arbeidsmengde: middels. Observert friksjon i arbeidsflyten.**

**Side og element:** Begge elevøkter, navigasjonen mellom tekst, spørsmål, bildeoppgave og gloser; særlig mobil.

**Observasjon:** Ved 390 px er Peru-siden omtrent 7790 px høy og julesiden 8725 px. Første spanske avsnitt begynner ved henholdsvis omtrent 1875 og 1639 px. «Til oppgavene» ligger øverst. Spørsmålene ber eleven gå tilbake og lese, uten lenke til teksten. Peru-paroppgaven ber eleven finne ting i fotografiet, mens fotografiet ligger flere skjermlengder opp. Gloselenken ligger langt nede, etter ordtabellen.

**Virkning:** Eleven mister lett plasseringen sin når hen skal kontrollere et svar eller se på bildet igjen. Læreren må også bla mye ved felles gjennomgang. Juleoppleggets to tekster er vanskelige å veksle mellom under sammenligning.

**Konkret forbedring:** Legg til en kompakt innholdsmeny med «Les», «Spørsmål», «Samtale» og «Gloser». På julesiden kan «Les» ha lenker til Spania og Chile. Legg en lokal «Tilbake til teksten»-lenke ved spørsmålene og «Se bildet»-lenke ved Peru-paroppgaven. Gi også en tydelig «Start lesingen»-handling øverst. La snarveiene fungere med tastatur og ta liten plass på mobil.

### 3. Leselinjene er for lange og skifter bredde ved bildet

**Prioritet: høy. Arbeidsmengde: middels. Observasjon med faglig designvurdering.**

**Side og element:** Begge elevøkter, spansk brødtekst på desktop; Peru-fotografiet inne i teksten.

**Observasjon:** Ved 1440 px er tekstområdet 958 px bredt, med skrift 17 px og linjehøyde rundt 28 px. De to første fulle linjene i Spania-teksten har omtrent 123 og 119 tegn. I Peru går teksten først over hele bredden, deretter i en smalere kolonne ved bildet, og så over hele bredden igjen. Avsnittsavstand og skriftkontrast fungerer godt.

**Virkning:** Lange linjer krever mer arbeid for å finne neste linjestart, særlig ved lesing av et fremmedspråk. Breddeendringen gjør den visuelle leserytmen mindre forutsigbar, også når elever leser høyt annenhver gang.

**Konkret forbedring:** Prøv en stabil lesekolonne på omtrent 65–75 tegn, med dagens romslige linjehøyde. La støttefotografiet stå ved siden av en fast tekstkolonne på brede skjermer, eller mellom hele avsnitt. Bevar ekte fotografier og dagens rolige uttrykk. Kontroller løsningen ved både vanlig desktopbredde og mellomliggende bredder.

![Peru-teksten veksler mellom full bredde og smalere linjer ved støttefotografiet.](/Users/olehenrikvik/spansk-ungdomsskole/output/playwright/kultur-audit-peru-tekstflyt-desktop.png)

### 4. Katalogen gir for lite grunnlag for å velge et passende opplegg

**Prioritet: middels. Arbeidsmengde: liten. Observert informasjonsmangel.**

**Side og element:** Katalogens introduksjon og oppleggskort.

**Observasjon:** Kortene viser land, «45 min», tittel og en kort tematisk beskrivelse. Forkunnskaper og arbeidsmåte blir først tydelige i lærerveiledningen. Introduksjonen lover «Ferdige kulturopplegg», mens oppleggene er merket «Arbeidsutkast · til lærervurdering». Katalogens egen utkastforklaring ligger helt nederst.

**Virkning:** Læreren må åpne flere sider for å vurdere språkkrav og klargjøringsstatus. «Ferdige» kan gi et sterkere inntrykk av utprøving enn den senere statusen støtter.

**Konkret forbedring:** Gi hvert kort én kort linje med konkrete forkunnskaper og arbeidsform, for eksempel «Enkle presenssetninger · lesing og samtale i par». Vis utkaststatus ved kortet så lenge den gjelder. Bruk «Kulturopplegg med …» i introduksjonen til ferdigstatusen er avklart. Unngå å erstatte dette med én bestemt klassetrinnsetikett.

### 5. Ordavslutningen bruker papirinstruksjoner på nettsiden

**Prioritet: middels. Arbeidsmengde: liten. Observert misforhold mellom instruksjon og tilgjengelige handlinger.**

**Side og element:** «Ord du kan bruke videre» og «Juleord du kan bruke videre».

**Observasjon:** Nettsiden ber eleven «Dekk den spanske kolonnen». Juleopplegget ber også eleven sette et lite merke ved ord. Tabellen har ingen skjul- eller markeringsfunksjon. Alle svar er synlige. Den fungerende glosetreningen ligger som knapp under ti tabellrader.

**Virkning:** På mobil blir oppgaven vanskelig å utføre slik den beskrives, og nettsiden viser svar før eleven prøver å hente dem frem. Papirlogikken gjør veien til den digitale øvingen mindre tydelig.

**Konkret forbedring:** Flytt «Lær Peru-glosene»/«Lær juleglosene» øverst i avslutningskortet, og si kort at eleven skal prøve å huske før kortet snus. Legg den komplette tabellen under «Se de ti ordene» dersom den fortsatt trengs på nett. Behold dekk-/markeringsinstruksjonene i papirarkene. Dette bruker den øvingen som allerede finnes.

[Skjermbilde av ordavslutningen på mobil](/Users/olehenrikvik/spansk-ungdomsskole/output/playwright/kultur-audit-jul-ordliste-mobil.png)

### 6. Førstegangsbrukeren mister sammenhengen på vei til gloser

**Prioritet: middels. Arbeidsmengde: liten. Observert brudd i presentasjonen; oppleggsvalget virker.**

**Side og element:** Overgangen fra «Lær Peru-glosene» til appens førstegangsoppsett.

**Observasjon:** I en ubrukt nettleser kom jeg til «Fornavn eller elevkode» uten at Peru eller det valgte glosesettet ble vist i oppsettet. Etter å ha skrevet et syntetisk kallenavn, startet det riktige Peru-settet. Julelenken åpnet også riktig sett i en allerede opprettet lokal profil.

**Virkning:** Eleven kan oppfatte oppsettet som at lenken førte til feil sted, eller som en ny innloggingsbarriere midt i økten. Det gjelder særlig når læreren har presentert kulturøkten som noe man bare åpner.

**Konkret forbedring:** Vis kontekst i oppsettet: «Du skal øve på de ti ordene fra Peru», sammen med en kort forklaring av den lokale profilen og en tydelig retur til opplegget. Bevar at det valgte settet åpnes automatisk etterpå. Ingen ny konto- eller datamodell er nødvendig for denne forbedringen.

[Skjermbilde av førstegangsoppsettet](/Users/olehenrikvik/spansk-ungdomsskole/output/playwright/kultur-audit-gloser-forstegangsbruk.png)

### 7. Toppmerket og returlenken har upresise mål

**Prioritet: middels. Arbeidsmengde: liten. Verifisert navigasjonsinkonsistens.**

**Side og element:** «Spansk på 1-2-3 Kultur» i toppfeltet og «Tilbake til teksten» i Gloser.

**Observasjon:** I katalogen går toppmerket til hovedappen. Inne i et opplegg går det til den samme elevsiden, og fra lærerveiledningen går det til elevsiden. Returlenken fra Gloser ender ved ordtabellen nederst i opplegget (`#word-recall`), ikke ved leseteksten.

**Virkning:** Samme merke betyr ulike ting fra side til side. Eleven som vil lese en setning på nytt, kommer tilbake til ordavslutningen og må lete opp teksten selv.

**Konkret forbedring:** La produktnavnet gå til hovedappen konsekvent, og gi «Kultur» en egen tydelig lenke til katalogen. La «Tilbake til teksten» gå til lesedelen, eller endre teksten til «Tilbake til opplegget» dersom ordavslutningen er tilsiktet mål.

### 8. Papirarkene mangler en direkte vei til nettøkten og glosene

**Prioritet: middels. Arbeidsmengde: liten for lenker og nettadresse. Observert mangel i lærerens overlevering.**

**Side og element:** Elevarkene, siste side; lærer-PDF-enes henvisning til Gloser.

**Observasjon:** Elevarkene sier at eleven skal velge oppleggets valgfrie sett i Gloser, men har ingen synlig nettadresse eller QR-kode dit. PDF-enes lenkeannotasjoner inneholder heller ingen lenke til elevøkt eller glosesett. Peru-arkene har bare bilde-/lisenslenker; julearkene har ingen klikkbare lenkeannotasjoner.

**Virkning:** Læreren må lage en ekstra digital beskjed for å komme fra utskrevet ark til riktig øving. En lærer som får PDF-en videresendt, mangler en direkte inngang til den interaktive delen.

**Konkret forbedring:** Legg inn lesbar nettadresse og klikkbar lenke til elevøkten og glosesettet. Legg eventuelt til QR-kode for papirbruk. Bruk den faktiske, avklarte publiseringsadressen når materialet skal deles; denne gjennomgangen publiserer ingenting.

### 9. Bildekrediteringen får mer plass enn den trenger i leseflyten

**Prioritet: lav. Arbeidsmengde: liten. Designvurdering basert på observert plassbruk.**

**Side og element:** Peru-bildene, bildetekst, kreditering og «Bildekilde».

**Observasjon:** Under markedsbildet står først motiv og år, så fotograf, år, Commons, lisens, nedskalering, beskjæringsstatus og ordpunkter. Deretter kommer «Bildekilde», som åpner en ny lenke til samme Commons-side. På 390 px blir dette flere linjer mellom bildet og teksten. Støttefotografiet har tilsvarende struktur.

**Virkning:** Tekniske bildedetaljer bryter leseflyten og forlenger mobilen uten å hjelpe eleven med den aktuelle språkoppgaven. Fotografiene i seg selv gir god stedstilknytning.

**Konkret forbedring:** Behold en kort motivtekst og synlig fotograf-/lisenskreditering. Samle kilde og detaljer om bearbeiding under én «Om bildet»-utvidelse. Fjern gjentatte opplysninger, og bevar all nødvendig krediteringsinformasjon.

[Skjermbilde av bildeord og kreditering ved 390 px](/Users/olehenrikvik/spansk-ungdomsskole/output/playwright/kultur-audit-peru-bildeord-mobil.png)

## Dette fungerer godt og bør bevares

- **Det rolige formspråket:** lys bakgrunn, mørk tekst og én gjennomgående lilla handlingsfarge gir god sammenheng mellom kultursidene. Det er ingen grunn til å legge til flere konkurrerende farger.
- **Oversettelser ved ordene:** både enkeltord og hele uttrykk kan slås opp uten en lang ordliste midt i lesingen. Panelene holder seg innenfor mobilskjermen, og lukking gir fokus tilbake til ordet.
- **Bildeord med gode trykkflater:** ordpunktene er 44 × 44 px, fungerer med berøring og tastatur og viser ordet på både spansk og norsk. Nummereringen krever ikke at eleven tolker farge alene.
- **Aktive arbeidsformer:** lesing høyt, muntlig oversettelse, egne svar, sammenligning og pararbeid henger godt sammen. Tomt svar gir «Velg et svar først», og feil svar gir et tekstnært hint.
- **Lærerveiledningene:** forkunnskaper, mål, tidsplan, fasit og tilpasning er samlet og lette å kjenne igjen. Elevark og lærerark ligger separat, og PDF-ene har ryddige sider uten synlig klipping i gjennomgangen.
- **Kildebevissthet:** Peru-fotoenes sted og år er oppgitt, fiktive personer skilles fra faktakilder, og tekstene tar forbehold om variasjon mellom familier og regioner. Julebildenes KI-status er oppgitt åpent.
- **Grunnleggende tilgjengelighet:** tydelige fokusringer, hopp-til-innhold-lenke, radioknapper med etiketter, bildebeskrivelser og god målt tekstkontrast. Jeg fant ingen tastaturfelle i de testede forløpene.

Storskjermkontrollen viste at layouten holdes samlet på brede skjermer. Behovet under felles undervisning er først og fremst enklere navigasjon til tekst og bilder, samt en lesebredde som også fungerer ved forstørring. Faktisk lesbarhet fra bakerste rad må prøves i undervisningsrommet.

## Kildesteder for senere implementering

Dette er oppslagshjelp, ikke endringer. HTML-sidene bygges fra mal og data; en senere retting må gjøres i riktig kilde.

| Funn | Relevant kilde |
|---|---|
| 1 | [Svarhåndteringen](/Users/olehenrikvik/spansk-ungdomsskole/docs/kultur/jul-spania-chile/preview.js:166) |
| 2, 4, 5, 7 | [Sidemal og katalog](/Users/olehenrikvik/spansk-ungdomsskole/scripts/build-culture-preview.mjs:177) |
| 3 | [Tekst- og bildestiler](/Users/olehenrikvik/spansk-ungdomsskole/docs/kultur/jul-spania-chile/preview.css:53) |
| 6 | [Førstegangsoppsettet](/Users/olehenrikvik/spansk-ungdomsskole/index.html:22) |
| 7 | [Kontekst og returlenke i Gloser](/Users/olehenrikvik/spansk-ungdomsskole/index.html:21696) |
| 8 | [PDF-avslutningen](/Users/olehenrikvik/spansk-ungdomsskole/scripts/build-culture-pdfs.py:180) |
| 9 | [Fotokrediteringens stiler](/Users/olehenrikvik/spansk-ungdomsskole/docs/kultur/jul-spania-chile/preview.css:46) |

## Gjør disse tre forbedringene først

1. **Rett den utdaterte svarmeldingen.** En elev må aldri se «Riktig» som respons til et annet, galt valgt svar.
2. **Knytt tekst, bilde, oppgaver og gloser sammen med korte snarveier.** Dette vil hjelpe både selvstendige elever på mobil og læreren under felles gjennomgang.
3. **Gi leseteksten stabil og kortere linjelengde på desktop.** Bevar fotografiene, den romslige linjehøyden og oversettelsene ved ordene.

`git diff --check` bestod under gjennomgangen. Produktets byggetrinn og regresjonssuite er ikke kjørt, siden ingen produktkode eller innhold er endret.
