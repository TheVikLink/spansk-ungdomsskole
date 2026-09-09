# Kritisk brukertest: Spansk på 1-2-3

Dato: 8. september 2026. Utført som ekspertgjennomgang med realistiske lærer- og elevscenarioer, ikke som en studie med faktiske elever.

## 1. Kort konklusjon

**Jeg ville ikke anbefalt selvstendig bruk med en hel klasse nå.** Jeg ville anbefalt en kort, lærerstyrt demonstrasjon av på forhånd kontrollerte oppgaver. Før klassepilot må fasitrettferdighet, låste øvingsflyter og mobilnavigasjon rettes. Resultatene må heller ikke brukes til vurdering eller dokumentasjon av gjennomført lekse i dagens form.

Det er lett å forstå hvorfor en lærer sier ja: norsk grensesnitt, ingen kontoer, mange relevante øvingsformer, egne gloser, korte økter og lokal lagring. Men et sannsynlig frafall skjer slik: Noen elever får feil på gode svar; andre blir stående fast etter å ha bedt om hjelp; læreren må feilsøke og overprøve fasiten; til slutt viser oppsummeringen upålitelige aktivitetstall. Da sparer ikke løsningen læreren for arbeid.

Dette er ikke en konklusjon om at hele appen eller hele innholdet er dårlig. Det er en konklusjon om at flere bekreftede feil rammer akkurat de øyeblikkene hvor lærer og elev skal kunne stole på produktet. En stor arkitekturomskriving eller innføring av innlogging er ikke nødvendig for å løse de viktigste problemene.

### Testgrunnlag og begrensninger

- Leste `AGENTS.md`, `README.md`, `PILOT.md`, relevant appkode, lagring/import/eksport, service worker og eksisterende tester.
- Hovedtesten gjelder den **lokale arbeidskopien**, inkludert endringer som allerede lå ukommittert. HEAD var `b6c38c8`; SHA-256 for testet `index.html`: `5488be14fd5d2ac4168619a11b867595339e324f1e08efa0d076ccfbb022d104`. Hashen var uendret ved sluttkontroll.
- Åpnet også [den publiserte nettsiden](https://theviklink.github.io/spansk-ungdomsskole/). Den returnerte HTTP 200, med sist-endret 4. september, og var ikke identisk med arbeidskopien. Hele scenariorekken ble ikke gjentatt offentlig. Den nedlastede offentlige HTML-en hadde også retningsfeilen i blandet quiz, den doble «profesora»-oppgaven og hintfunksjonene som overskriver fremoverknappen. De nye sju grammatikkleksjonene i arbeidskopien var ikke med der.
- Brukte Chromium med reelle klikk, tastatur, filvalg, eksport/import og separate, rene nettleserprofiler. Testet desktop 1440 × 900, mobil 390 × 844 og navigasjon på 768/1024 pikslers bredde. Dette er skjermbredder, **ikke** en full test på fysiske iOS-/Android-enheter eller nettbrett.
- Gjennomførte nivåtest, quiz med alternativt svar, kontrollert 10/10-quiz, grammatikk med mange feil, verbfeil/avbrudd, gloser med egenvurdering, leksepakke, diktat, Lingo Links og setningspuslespill. Perfekt quiz ble drevet med kjent fasit for å undersøke sluttflyten; det er ikke et mål på elevprestasjon.
- Testet vanlig omlasting, ny nettleserprofil, faktisk gjenoppretting fra fil og nettbrudd etter første innlasting. Flere ukers bruk er vurdert ut fra lagringslogikk og scenarioer, ikke observert over flere uker. Treg forbindelse, full lagringskvote, skjermleser og fysisk tastatur på nettbrett er ikke fulltestet.
- **89 utvalgte Playwright-tester bestod:** 63 tester for svaraksept, import/eksport, gjenoppretting, elevinnspill, grammatikkleksjoner, diagnose og diktat; ytterligere 26 for leksepakker, to spill og talehjelper. Innholdskontrollen bestod 16 kontroller; leksjonskontrollen bestod 7/7. Dette er ikke hele testpakken og ikke en faglig godkjenning av alle oppgaver.
- Lydfil ble faktisk avspilt online, og feiltilstand ble gjenskapt offline. Tale-testene bruker en simulert talesyntese; de dokumenterer ikke uttalekvalitet eller lyd på elevens enhet. Testnettleseren rapporterte ingen installerte stemmer. Ingen mikrofon-/talegjenkjenningsfunksjon ble funnet i appen; ingen mikrofontillatelse ble utløst. Appen har avspilling og diktat, ikke demonstrert uttalevurdering.
- Ingen appkode, elevdata fra virkelige personer, publisering eller utrulling ble endret. Testnavn og innspill var syntetiske. Rapport, testbevis og Beads-oppfølging er lagt til.

Bevismerking: **O** = observert gjennom nettleserhandlinger; **K** = støttet av kode/runtime-inspeksjon; **V** = vurdering som må valideres med mennesker. Sannsynlighet nedenfor er et kvalitativt anslag for den beskrevne situasjonen, ikke målt forekomst i en klasse. «Blokkerende» gjelder den berørte flyten, ikke at hele nettstedet er utilgjengelig.

## 2. De fem største risikoene for en dårlig førsteopplevelse

| Risiko | Konkret observasjon | Hvorfor læreren kan slutte å bruke siden |
|---|---|---|
| 1. Gode svar blir feil | `beber → å drikke` ble avvist til fordel for `drikke`. Nivåtesten avviste også naturlige svar. | Læreren må forsvare eller korrigere en fasit eleven med rette mistror. |
| 2. Å be om hjelp låser økten | «Vis hint» etter svar fjernet «Neste» i grammatikk og verb. | Elevene som trenger hjelp, trenger i stedet teknisk redning. |
| 3. Mobilmenyen svikter | På 390 px lå elevnavnet over «Lytteøvelser», og klikk ble avskåret. | En klasse med ulike enheter kommer ikke inn i samme aktivitet. |
| 4. Innhold og forklaring motsier læringen | «Mi madre es ___ profesora» godkjente «profesora»; annen feilforklaring viste `undefined`. | Én åpenbar feil er nok til at læreren må kvalitetssikre resten selv. |
| 5. Fremgangstall er ikke til å stole på | Ett verbsvar ble registrert som 20 oppgaver; null grammatikksvar ga «Du mestrer dette temaet». | Resultater gir verken trygg mestringsveiledning eller pålitelig læreroversikt. |

## 3. Funn sortert etter alvorlighetsgrad

### F01 — Hint etter svar fjerner eneste vei videre

**Blokkerende · faktisk feil · elev, deretter lærer · høy sannsynlighet når elever søker hjelp etter feil · O/K.**

- **Scenario:** Eleven svarer feil i grammatikk eller verb og trykker «Vis hint».
- **Forventet:** Mer hjelp, med mulighet til å lese fasiten og gå videre.
- **Faktisk:** Hintet erstatter tilbakemeldingen, inkludert «Neste». Grammatikksvaret er allerede låst; i verb står svaret som ferdigbehandlet. Et nytt svar åpner ikke flyten. Eleven må avslutte eller forlate økten.
- **Konsekvens:** Normal hjelpesøking blir en blindvei. Dette rammer særlig svake elever og genererer mange samtidige spørsmål til læreren.
- **Forbedring:** La navigasjonen være uavhengig av hintteksten. Bevar svaret, forklaringen og «Neste», eller gjør hint utilgjengelig når det ikke lenger er relevant.
- **Test:** Riktig/feil svar → hint → neste oppgave, i både verb og grammatikk, med mus og tastatur. Sjekk at svaret telles bare én gang.
- **Bevis:** [Skjermbilde](../output/playwright/critical-audit-2026-09-08/05-grammar-hint-trap.png). `index.html:18650`, `index.html:20277`.

### F02 — Mobilmenyen har overlappende, utilgjengelige knapper

**Blokkerende for berørt navigasjon · faktisk feil · begge · høy ved testet mobilbredde · O/K.**

- **Scenario:** En førstegangselev skal åpne lytteøvelser på mobil, eller bytte aktivitet senere i timen.
- **Forventet:** Alle synlige menyvalg kan trykkes uten særskilte forklaringer.
- **Faktisk:** Ved 390 × 844 overlapper merkevare, menyrad og brukerfelt. Brukerfeltet avskjærer klikk på «Lytteøvelser». Vanlig klikk fungerte ved 768 og 1024 px. Startsidens ekstra aktivitetsknapp ga en omvei på mobil.
- **Konsekvens:** Læreren kan ikke gi én instruksjon som fungerer på alle skjermene. At siden ikke har horisontal dokumentrulling, betyr ikke at knappene er tilgjengelige.
- **Forbedring:** En enkel mobilmeny eller bevisst linjebryting, med separat plass for elevkode/innstillinger. Ingen redesign av hele appen er nødvendig.
- **Test:** Klikk hvert menyvalg på 360, 390, 640, 768 og 1024 px, fra flere undersider. Inkluder langt elevkodenavn, større tekst og liggende skjerm. Kontroller treffområdet, ikke bare bredde.
- **Bevis:** [Mobil](../output/playwright/critical-audit-2026-09-08/nav-390.png), [768 px](../output/playwright/critical-audit-2026-09-08/nav-768.png). Motstridende navigasjonsregler rundt `index.html:916` og `index.html:3770`.

### F03 — Dagens quiz mister svarvarianter som appen allerede har godkjent

**Høy · faktisk feil · begge · høy gjennom gjentatt klassebruk · O/K.**

- **Scenario:** En elev oversetter naturlig og korrekt, men ikke med fasitens foretrukne ordlyd.
- **Forventet:** Samme ord godkjennes etter samme faglige regler i ulike øvingsmoduser.
- **Faktisk:** `beber → å drikke` ga «Feil — riktig svar: drikke». Den vanlige svarlisten godtar begge. Quizbyggeren sender `noToEs/esToNo` til en hjelper som forventer `no-es/es-no`; alternative svar faller derfor bort. Runtime-sammenligning fant manglende varianter i **396 av 1046 glose-/retningskandidater**. Dette er omfang av datamismatch, ikke en elevfeilrate på 38 prosent.
- **Konsekvens:** Falske feil påvirker resultat og videre øving. Læreren får en skalerende korrekturjobb; elevens protest er berettiget.
- **Forbedring:** Normaliser retning ved grensesnittet og gjenbruk godkjente svarlister konsekvent. Ikke løs problemet med generell, ubegrenset «fuzzy» godkjenning.
- **Test:** Kjør alle godkjente varianter gjennom selve quizbyggeren og svarflyten. Inkluder `å drikke`, bøyningsformer og synonymer, samt negative kontroller som endret betydning og `año/ano`.
- **Bevis:** [Faktisk avvisning](../output/playwright/critical-audit-2026-09-08/beber-answer-rejected.yml). `index.html:10745`, `index.html:12133`.

### F04 — Nivåtesten skjuler svarinstruksjoner og feilvurderer naturlige svar

**Høy · faktisk feil og pedagogisk svakhet · begge · høy på første besøk · O/K.**

- **Scenario:** Eleven tar testen som skal gi passende videre øving.
- **Forventet:** Det er tydelig hvilket språk og hvilket svarformat som kreves; språklig gode svar gir et rimelig nivågrunnlag.
- **Faktisk:** `instructionNb` vises ikke. Når norsk tekst finnes, erstatter den den spanske oppgaven, også i hulloppgaver. «Jeg liker eventyrbøker» vises med `gusta/gustan/gusto/gustas`, uten den spanske setningen. `la madre → mora`, `Jeg heter Ana → Yo me llamo Ana` og `jeg snakker → yo hablo` ble avvist. Den siste kunne legitimt vært en ren bøyningsoppgave, men den nødvendige avgrensningen er ikke synlig. Testen anbefalte deretter øving på blant annet identitet og -ar-verb.
- **Konsekvens:** Eleven lærer å gjette programmets format. Lærerens første møte med «nivåtilpasning» blir et tvilsomt resultat.
- **Forbedring:** Vis instruksjon, språkretning og nødvendig spansk kontekst. Faglig gjennomgå alternative svar. Presenter resultatet som et foreløpig øvingsforslag, ikke en validert CEFR-diagnose.
- **Test:** La elever forklare oppgaven før de svarer; test naturlige fullsetninger og tillatte norske former. Sammenlign resultatene fra semantisk like svar.
- **Bevis:** [«mora» avvist](../output/playwright/critical-audit-2026-09-08/02-mora-rejected.png). `index.html:1024`, `index.html:11815–11910`. Bokmålsformen «mora» er også omtalt av [Språkrådet](https://sprakradet.no/spraksporsmal-og-svar/far-min-mor-mi-fader-var-og-sa-videre/).

### F05 — En grunnoppgave har ingen rimelig korrekt utfylling

**Høy · faglig/teknisk innholdsfeil · begge · middels, høy når A0-grunnmuren brukes · O/K.**

- **Scenario:** Nybegynneren velger A0 grunnmur.
- **Forventet:** Valgt fasit gir en korrekt spansk setning.
- **Faktisk:** Oppgaven «Mi madre es ___ profesora» godkjenner alternativet «profesora». Utfylt blir det «Mi madre es profesora profesora». Det finnes ikke et tomt alternativ som kunne realisert den tilsiktede regelen om yrke uten artikkel.
- **Konsekvens:** En lærer oppdager straks at oppgaven er feil. En nybegynner kan ikke vite om det er eleven eller læremiddelet som tar feil. Grønne innholdstester hindret ikke dette.
- **Forbedring:** Rett selve oppgaven, og kontroller alle pilotoppgaver som ferdige setninger med innlagt svar. Dokumenter faktisk fagfellekontroll; sju nye leksjoner har `published`, men tomme `reviewedBy/reviewedAt`. Det dokumenterer manglende registrert kontroll, ikke at ingen noensinne har lest dem.
- **Test:** Spansklærer godkjenner setning, norsk støtte, alle svaralternativer og begrunnelse. Maskinell kontroll skal supplere, ikke erstatte, dette.
- **Bevis:** [Oppgaven](../output/playwright/critical-audit-2026-09-08/06-profesora-duplicated.png). `index.html:19347`.

### F06 — Resultatsiden kan påstå mestring uten svar og telle ubesvarte oppgaver

**Høy · faktisk feil og overdrevet mestringsspråk · begge · høy ved avbrudd i ordinære timer · O/K.**

- **Scenario:** Timen slutter før økten er ferdig, eller eleven avslutter straks.
- **Forventet:** En delvis økt merkes delvis, og bare besvarte oppgaver telles. Ingen svar betyr intet mestringsgrunnlag.
- **Faktisk:** Etter ett feil verbsvar og avslutning viste appen «Øving fullført», totalt 20 og 0 %, og lagret 20 oppgaver. I en separat grammatikkøkt med **null svar** viste resultatet «Flott jobbet! Du mestrer dette temaet!». Den tomme grammatikkøkten ble heldigvis ikke lagt til historikken.
- **Konsekvens:** Eleven kan bli urimelig straffet for ubesvarte oppgaver eller få ros uten innsats. Læreren kan ikke tolke oppsummeringen som dokumentasjon.
- **Forbedring:** Skill planlagt, besvart, riktig og fullført. Null svar skal ha en nøytral avslutning. Bruk forsiktig, oppgavespesifikk mestringstekst og registrer en økt høyst én gang.
- **Test:** Avslutt etter 0, 1 og alle svar, både riktige og feil. Sammenlign UI, historikk, lekserapport og eksport. Gjenta avslutning uten dobbeltelling.
- **Bevis:** [Mestring uten svar](../output/playwright/critical-audit-2026-09-08/16-mastery-with-zero-answers.png). `index.html:18701`, `index.html:20301`.

### F07 — En ny leksepakke får godskrevet gammel øving og starter bare første grammatikktema

**Høy · faktisk feil · begge · høy ved gjenbruk over uker · O/K.**

- **Scenario:** Læreren lager en ny pakke med gloser, verb og to grammatikktemaer.
- **Forventet:** Målene gjelder den nye pakken og den avtalte perioden; eleven kan gjennomføre alt tildelt innhold.
- **Faktisk:** Etter faktisk eksport/import av en ny pakke viste den allerede «Verb: 1 av 5 min» og «Grammatikk: 2 av 5 min», fra tidligere, uvedkommende økter. Koden summerer hele `practiceHistory` uten pakke-ID eller tidsavgrensning. Knappen for grammatikk starter alltid `grammarTopics[0]`; den andre valgte oppgaven har ingen egen inngang fra pakken. Det siste er kodebekreftet, ikke fullført som to-tema-elevforløp.
- **Konsekvens:** Lekser kan se utført ut før eleven begynner. Læreren må kontrollere innhold og aktivitet manuelt.
- **Forbedring:** Avgrens lokalt til pakke/periode og registrer aktivitetens tilhørighet. Vis alle tildelte deler. Bevar gamle importer med tydelig ukjent tilhørighet; ikke tilskriv dem en ny lekse.
- **Test:** Importer pakke B etter arbeid i A; B starter på null. Begge grammatikktemaer kan startes. Test omlasting, ukeovergang og gammel eksportfil.
- **Bevis:** `index.html:12804–12824`. Oppretting, nedlasting og filimport fungerte i hovedsak; feilen gjelder betydningen av fremgangstallene.

### F08 — Elevkode omtales som om den kan gjenopprette slettede data

**Høy · faktisk feil i informasjon · begge · middels; stor konsekvens når det skjer · O/K.**

- **Scenario:** Eleven bytter nettleser, eller nettleserdata slettes mellom to timer.
- **Forventet:** Velkomstteksten forklarer presist hva elevkoden og sikkerhetskopien kan gjenopprette.
- **Faktisk:** Velkomsten sier at eleven kan skrive inn elevkoden på nytt eller importere fremgang for å fortsette uten ny diagnose. Samme navn/kode i en ren profil ga tom historikk og ikke-startet diagnose. Import av den faktiske sikkerhetskopien gjenopprettet derimot diagnose, quiz og tidligere øvingshistorikk.
- **Konsekvens:** En lokal etikett kan bli oppfattet som en konto. Eleven har ingen sikkerhetskopi når læreren oppdager misforståelsen.
- **Forbedring:** Skriv: «Elevkoden er bare et navn på denne enheten. Den henter ikke fremgang fra andre enheter. Bruk eksport/import for å flytte eller sikre fremgangen.» Gi en kort, synlig sikkerhetskopirutine.
- **Test:** Ny profil med samme kode skal forklare at det ikke er gjenoppretting. En lærer må kunne eksportere, finne filen og gjenopprette uten utviklerhjelp.
- **Bevis:** `index.html:34`, `index.html:13050`. README forklarer begrensningen bedre enn selve velkomsten.

### F09 — Offline-løftet omfatter mer enn det eleven faktisk får

**Høy når lyd brukes · faktisk feil og misvisende forventning · begge · middels, høy ved nettbrudd · O/K.**

- **Scenario:** Appen er lastet én gang, så forsvinner nettet og klassen starter en ny diktat.
- **Forventet:** «Fungerer også uten internett etter at appen er lastet inn» betyr at valgt aktivitet er klar, eller at manglende nedlasting forklares før start.
- **Faktisk:** Startsiden og lagret navn overlevde frakoblet omlasting. En ikke tidligere lastet Madrid-lydfil gjorde ikke det. Forhåndsvisningen viste lydfeil, men «Start øvelsen» var fortsatt tilgjengelig. Inne i segmentet manglet synlig feilforklaring selv om lydavspilleren hadde feil. Bare appskallet forhåndslagres, ikke hele lydhistoriene.
- **Konsekvens:** Læreren mister den planlagte lytteaktiviteten midt i timen og må finne et alternativ. En tom lydkontroll ser ut som elevfeil eller uferdig produkt.
- **Forbedring:** Avgrens offline-påstanden. Vis hvilke historier som faktisk er lastet ned, eller tilby bevisst nedlasting. Blokker meningsløs start og gi ny prøving/alternativ tekstøving ved lydfeil.
- **Test:** Ren profil → last app → koble fra → prøv ubrukt historie. Test deretter ferdig nedlastet historie, avbrutt nedlasting og gjenopprettet nett. Alle segmenter må enten spille eller ha forståelig feiltilstand.
- **Bevis:** `sw.js:1–8`, diktatfunksjonene rundt `index.html:1490–1530`. Online avspilling ble bekreftet; lydens faglige kvalitet er ikke fullrevidert.

### F10 — Forklaringene hjelper ikke konsekvent eleven som strever

**Høy for de svakeste elevene · pedagogisk svakhet og faktisk visningsfeil · begge · høy i en nivåblandet klasse · O/K/V.**

- **Scenario:** Eleven gjør mange feil, åpner teori og prøver igjen.
- **Forventet:** Et lite eksempel forklarer nettopp feilen, og neste forsøk gir relevant støtte.
- **Faktisk:** A0-grunnmurens egentlige teori er én oppfordring til å øve på korte setninger, mens oppgavene krever blant annet `tengo`, `vivo`, `trabajo`, `hay` og yrkesuttrykk. Etter en økt med mange feil ble eleven sendt tilbake til samme sparsomme teori. Feil på `___ dos ventanas en el aula` viste bokstavelig `undefined` og en generell forklaring om person, kjønn eller tall. Den nye hay/estar-leksjonen er mye bedre, men plasserer «Las ventanas están abiertas» under forklaring av sted, selv om eksemplet viser tilstand.
- **Konsekvens:** «Les teori igjen» kan oppleves som skyldlegging når teorien ikke svarer på spørsmålet. Læreren må undervise hvert hull individuelt.
- **Forbedring:** Knytt hver pilotoppgave til en kort forklaring som faktisk lærer bort det oppgaven krever. Bruk ett gjennomarbeidet eksempel og ett støttet nytt forsøk. Fjern manglende tekst og eksempler utenfor leksjonens avgrensning.
- **Test:** Etter to feil skal en A0-elev kunne forklare hva som skal gjøres annerledes og løse en ny, tilsvarende oppgave. Maskinelt: ingen `undefined`, tomme hint eller irrelevante teorilenker.
- **Bevis:** [Feilforklaring](../output/playwright/critical-audit-2026-09-08/grammar-undefined.yml). `index.html:19333`, `index.html:20248`.

### F11 — Tastatursnarveier griper inn i dialoger og vanlige knapper

**Høy · faktisk tilgjengelighetsfeil · elev · høy for tastaturbrukere i berørt flyt · O/K.**

- **Scenario:** Eleven skriver en forklaring til et feilvurdert svar, eller bygger en setning uten mus.
- **Forventet:** Enter i tekstfelt gir normal tekstredigering; Enter på en fokusert knapp aktiverer knappen; modal dialog holder fokus inne og kan lukkes forutsigbart.
- **Faktisk:** Enter i tilbakemeldingens tekstområde flyttet grammatikkoppgaven bak dialogen fra 1/14 til 2/14, uten linjeskift. Fokus flyttes ikke inn når dialogen åpnes, og Escape lukket den ikke. I setningspuslespillet sjekket Enter hele setningen i stedet for å velge fokusert ordbrikke. Mellomrom fungerte som alternativ for brikken.
- **Konsekvens:** Eleven mister kontroll over hvor handlingen skjer. En tilgjengelighetsfunksjon for én øvelse blir en feil i en annen.
- **Forbedring:** Avgrens snarveier til aktiv øvelse og ignorer tekstredigering/dialoger. La native knapper beholde Enter/Mellomrom. Gi dialogen navn, modal semantikk, fokusflytting, fokusavgrensning og tilbakeføring.
- **Test:** Gjennomfør oppgave → feil → innspill med to avsnitt → lagre/lukk → neste, bare med tastatur. Oppgaven bak skal stå stille. Fullfør puslespill med Tab/Enter og Tab/Mellomrom.
- **Bevis:** [Dialogen etter Enter](../output/playwright/critical-audit-2026-09-08/15-feedback-enter-advances.png). `index.html:10945`, `index.html:17142`.

### F12 — Rettelser kan bli usynlige for tidligere besøkende

**Høy som utrullingsrisiko · kodebekreftet, ikke fullstendig gjenskapt over en ekte utrulling · begge · middels/høy ved gjentatte publiseringer · K.**

- **Scenario:** Læreren vender tilbake etter at utvikleren sier at feil er rettet.
- **Forventet:** Nytt besøk eller omlasting gir den publiserte, korrigerte versjonen uten tap av fremgang.
- **Faktisk:** Service worker bruker cache-first for også HTML/CSS. Cachen heter fortsatt `spansk123-v4`; siste git-endring av filen var i august. Når service worker ikke endres, fortsetter allerede lagrede ressurser å vinne over nyere nettressurser. Offentlig og lokal HTML var dessuten ulike under testen. Dette beviser ikke hvilken versjon en bestemt lærers enhet har.
- **Konsekvens:** Læreren kan møte samme feil igjen og miste tilliten til både appen og beskjed om retting. Rådet «slett nettleserdata» er særlig farlig i en lokal-først-app.
- **Forbedring:** En liten, eksplisitt oppdateringsstrategi for appskallet, synlig versjon og sikker oppdateringsmelding. Bevar `localStorage`. Rett også README-rådet om å laste opp bare `index.html`; CSS, service worker og lydressurser er nå relevante deler av leveransen.
- **Test:** Installer versjon A med fremgang. Publiser B i et separat testmiljø. Gjenåpne samme profil; bevis korrekt versjon og uendret fremgang online og offline, uten sletting av nettsteddata.
- **Bevis:** `sw.js:1`, `sw.js:25–39`, README «Deploy».

### F13 — Første side gir ikke læreren en tydelig vei til en vanlig time

**Middels · alvorlig friksjon · begge · høy for førstegangsbruk uten forklaring · O/K/V.**

- **Scenario:** En travel lærer åpner lenken og skal forklare oppstart for 25 elever.
- **Forventet:** «Dette er et supplement; slik starter klassen; velg dette i 20 minutter; slik avslutter vi.»
- **Faktisk:** Læreren møter elevens velkomst med fornavn/elevkode, uten en tydelig lærerinngang. På elevens startside heter hovedknappen «Start nivåtest først», men den er deaktivert. Den reelle diagnoseknappen ligger i et annet felt. «Nivåtest» og «diagnose» brukes om samme flyt. Læreropplegg finnes i `PILOT.md`, men oppstartsflaten gjør dem ikke tilgjengelige. «Brainmap», «spaced repetition» og «mikroskills» krever mer tolkning enn resten av bokmålsteksten.
- **Konsekvens:** Læreren må lage sin egen introduksjon, og elevene velger ulike ruter. Det er mulig å bruke andre øvelser uten diagnose; ikke hele appen er låst.
- **Forbedring:** Én fungerende førstegangshandling, konsekvent begrep og en liten «For læreren: første 20 minutter»-inngang med lenke til ferdig opplegg. Et forhåndsvalgt, begrenset innholdssett er viktigere enn flere valg.
- **Test:** Uinformert lærer skal på tre minutter kunne forklare formål, start, mål og avslutning. Fem elever skal finne første avtalte oppgave uten muntlig pekehjelp.
- **Bevis:** [Velkomst](../output/playwright/critical-audit-2026-09-08/01-welcome-desktop.png), `index.html:13545–13570`.

### F14 — Lærerens kontroll- og avslutningsbehov er dårlig dekket

**Middels; høy hvis produktet selges inn som leksedokumentasjon · produktbegrensning og arbeidsflytfriksjon · lærer · høy · O/K/V.**

- **Scenario:** Etter 20–30 minutter vil læreren vite hvem som øvde på hva, og hva som bør gjennomgås i fellesskap.
- **Forventet:** En enkel, ærlig avslutning med mål, besvarte oppgaver og noe eleven kan vise læreren.
- **Faktisk:** Ingen sentral klasseoversikt finnes, som dokumentert og forventet i lokalmodellen. Men utskrift/levering av ukesrapport krever normalt to øvingsdager, slik at første time ikke kan avsluttes gjennom denne flyten. «Lever ukeslekse» åpner en lokal rapport, ikke en lærerinnboks. Elevinnspill ligger også på hver elevs enhet.
- **Konsekvens:** Læreren får mer innsamling og mindre oversikt enn begrepene «lekse», «elevkode» og «lever» kan antyde. Dette er ikke et argument for å samle flere elevdata automatisk.
- **Forbedring:** «Vis dagens oppsummering» fra første økt, tydelig skille mellom lokal visning og innsending, og et enkelt sluttspørsmål: hva kan jeg nå, hva trenger jeg hjelp til? Læreren velger frivillig lokal visning eller en allerede godkjent skolekanal.
- **Test:** Lærer avslutter en førstetime på tre minutter uten å hente 25 JSON-filer. Ingen skal tro at data er sendt når de bare er skrevet ut.
- **Bevis:** Leksefanen og `index.html:13030–13045`. Ingen ny backend er nødvendig for minimumsløsningen.

### F15 — Videre veiledning og nivåforskjeller håndteres mindre presist enn lovet

**Middels · pedagogisk svakhet · begge · høy over flere økter · O/K/V.**

- **Scenario:** Én elev får nesten alt feil; en annen får 10/10 og er ferdig tidlig.
- **Forventet:** Den første får mindre, relevant støtte; den andre får en konkret, litt vanskeligere anvendelse. Begge ser at arbeid blir anerkjent.
- **Faktisk:** Etter 10/10 var hovedretningen mer quiz og fremdrift mot fem quiz samme dag. Etter grammatikk/verb, men før fullført dagsquiz, sa startsiden «Du har ikke øvd i dag ennå». Brainmap har faktisk forfalls-/svakhetsstyring, men enkelte brede verbferdigheter er representert med svært få faste spørsmål i diagnose-/quizkatalogen. Den separate verbtreningen oppdaterer historikk, men har ikke tilsvarende kobling til `updateLearningProgress` som grammatikkøvelsene. Gloseutvalg og Lingo Links er ikke generelt avgrenset til elevens aktuelle lærebokkapittel/nivå.
- **Konsekvens:** Flinke elever kan samle aktivitet uten særlig ny læring; svake elever kan fortsette i gjette- og feilsløyfer. «Adaptiv» og farger i et kart kan gi større forventning enn grunnlaget tåler.
- **Forbedring:** Anerkjenn all relevant øving med presise etiketter. Vis et avgrenset neste mål og grader støtten, ikke bare antall quiz. Skill oppgaveprestasjon, egenvurdering og robust ferdighet. Prioriter variasjon innen samme læringsmål.
- **Test:** Svak og sterk testprofil følger tre økter med nye oppgaver. Vis konkret forskjell i støtte/utfordring; ingen får «ikke øvd» etter en dokumentert økt. Kontroller at flere relevante verb og personer kreves før bred mestringstekst.
- **Bevis:** `index.html:13545`, `index.html:12078`, `index.html:18610–18735`. Langsiktig læringseffekt er ikke målt.

### F16 — Diktat kan gi misvisende ros og fullføres uten meningsfull innsats

**Middels · faktisk vurderingsfeil og pedagogisk svakhet · begge · middels, høy ved «bli fort ferdig»-atferd · O/K.**

- **Scenario:** Eleven skriver én bokstav eller lar alle segmenter stå tomme og går videre.
- **Forventet:** En kort fragmenttekst beskrives som ufullstendig. Gjennomført lytting må ikke fremstå som mestret diktat.
- **Faktisk:** Svaret `a` på «Camina hasta la plaza.» ga «Veldig nærme» og beskjed om en liten forskjell, fordi sammenligningen bruker delstrengtreff. Sju tomme segmenter og ett med én bokstav var nok til å lagre historien som fullført. Koden lagrer bare første fullføringsdato for en historie; repetisjon av samme historie en senere uke gir dermed ikke en ny øvingsdag via denne registreringen. Ukeeffekten er kodebekreftet, ikke observert over ekte uker.
- **Konsekvens:** Eleven kan gjennomføre aktiviteten uten å lytte eller hente frem språk. Flittig repetisjon og rask gjennomklikking behandles heller ikke konsistent.
- **Forbedring:** Skille «sett/gått gjennom», «forsøkt» og «riktig», uten krav om å lagre rå elevtekst. Gi nøktern respons på tomme/korte fragmenter og et tydelig «vis svar / hopp over». Gjentatt øving kan registreres som aktivitet, ikke automatisk mestring.
- **Test:** Tomt, én bokstav, halv setning, tegnsettingsvariant og riktig setning får riktig tekst/status. Samme historie på to forskjellige dager gir riktig dagshistorikk.
- **Bevis:** [Én bokstav er «veldig nærme»](../output/playwright/critical-audit-2026-09-08/13-dictation-letter-near.png). `index.html:1444–1446`.

### F17 — Elevinnspill og sikkerhetskopi har ulike grenser som bør forklares bedre

**Middels · informasjons- og arbeidsflytfriksjon · begge · middels · O/K.**

- **Scenario:** Eleven melder et riktig svar som feilvurdert, og flytter deretter fremgangen til en annen nettleser.
- **Forventet:** Eleven forstår at meldingen ikke automatisk når læreren/utvikleren, om poeng endres, og hva en sikkerhetskopi omfatter.
- **Faktisk:** Dialogen opplyser positivt og tydelig om lokal lagring og anonymitet som standard. Innspillet ble lagret, men feilpoenget ble stående. Full fremgangseksport inneholder ikke elevinnspill; gjenopprettet profil hadde null innspill. Disse krever egen eksport. I tillegg lagrer diagnosen råsvar og normalisert svar lokalt, som også følger med vanlig fremgangseksport; den generelle teksten «fremgang» gjør ikke dette særlig synlig.
- **Konsekvens:** En elev kan tro protesten blir behandlet, eller at alt lokalt arbeid er sikret. Læreren kan dele mer tekst enn tenkt ved å sende en fil. Det ble ikke påvist automatisk overføring av disse opplysningene.
- **Forbedring:** Si eksplisitt «Ingen har mottatt innspillet. Poengsummen endres ikke nå». Beskriv innholdet i hver eksport og vis valg/bevisst advarsel om innspill ikke er med. Gjennomgå behovet for rå diagnosesvar og gi en kort, konkret lokal dataliste med sletting/eksport.
- **Test:** Elev og lærer forklarer korrekt hvor innspillet finnes og hvem som kan se det. Eksport/import testes med både signerte og anonyme innspill, tydelig separat format og uten automatisk nettverksoverføring.
- **Bevis:** `index.html:10945`, `index.html:11719`, `index.html:13050`. Eksisterende feedback- og gjenopprettingstester bestod.

### F18 — Pågående øving overlever ikke alle realistiske avbrudd

**Middels · kontinuitetsfriksjon · elev · middels/høy på mobile enheter · O/K.**

- **Scenario:** Eleven laster siden på nytt midt i en grammatikkøkt, eller kommer tilbake etter at nettleserfanen er kastet ut av minnet.
- **Forventet:** Fortsett der du var, eller forstå tydelig hva som er lagret og hva som må startes på nytt.
- **Faktisk:** Omlasting under grammatikk ga startsiden og ingen aktiv økt/resultat å fortsette. Tidligere fullført fremgang var bevart. Enkeltsvar kan ha oppdatert ferdighetsdata før selve økten er ført i aktivitetshistorikken. Diagnosen har bedre støtte for lagret deltilstand. Vanlig fanebytte i en aktiv gloseøkt utløste en nyttig bekreftelse.
- **Konsekvens:** Eleven opplever delvis tap og ulike tall, særlig når lærerens time avbryter en lang økt. Dette er ikke det samme som at all lokal fremgang forsvinner ved oppdatering.
- **Forbedring:** Lagre en liten lokal øktstatus, eller avslutt deløkten ærlig og vis hva som ble tatt vare på. Bruk en felles forståelig regel på tvers av øvingsformer; en slik endring trenger kompatibilitetstester.
- **Test:** Last om før svar, etter svar før «Neste», og ved resultat. Kontroller gjenopptakelse/avslutning, svarantall, historikk og at siste svar ikke telles dobbelt.
- **Bevis:** Testet omlasting i hay/estar-økt; tilstanden ble tom mens tidligere data bestod. Reell mobil bakgrunnsutkasting gjenstår.

### F19 — Spillene er faglige, men mangler en god vei for elever som ikke kjenner ordene

**Middels · pedagogisk svakhet / mulig forbedring · elev · middels, særlig A0 · O/K/V.**

- **Scenario:** En ny elev velger spill mens andre allerede kjenner mesteparten av ordforrådet.
- **Forventet:** Et forståelig læringsmål og en vei videre når eleven ikke klarer å se sammenhengen.
- **Faktisk:** Lingo Links fungerte med feil, riktig gruppe og kategorihint etter tre feil. Brettet kom fra den samlede ordlisten, ikke en valgt, nylig innlært gruppe. Videre feil gir ikke en ny støttestige. Setningspuslespillet krevde faktisk spansk ordstilling, men en feil ga bare generell oppfordring om å flytte ordene. Et trebrikkers eksempel kunne løses med lite aktiv produksjon.
- **Konsekvens:** Sterke elever får en meningsfull liten aktivitet; svake elever kan sitte fast med ord de aldri har lært. Det er et nivå-/støtteproblem, ikke bevis for at spillene er pynt.
- **Forbedring:** Tilby et enkelt lærer-/temavalg og et valgfritt neste hint: betydning, eksempel eller én forklart plassering etter et reelt forsøk. Knytt en kort etteroppgave til ordene eleven brukte.
- **Test:** En elev uten forkunnskaper får hjelp til å løse én ny runde og kan forklare minst to ord etterpå. En sterk elev får fortsatt et reelt gjenkallingskrav. Test små skjermer og spill uten tidspress.
- **Bevis:** `index.html:20626`, `index.html:20739`. Lingo Links og setningspuslespill ble brukt; Invaders-spillenes fulle elevopplevelse gjenstår og er ikke underkjent på grunnlag av disse funnene.

## 4. Scenarioer som bør testes med ekte elever og lærer

Alle de 16 bestilte scenarioene er vurdert nedenfor. «Gjennomgått» betyr ikke at en ekte klasse har deltatt. Særlig læringsutbytte, tidsbruk i klasse og lærernes gjenbruksbeslutning trenger menneskelig testing.

| Nr. | Scenario og dagens dekning | Neste test med mennesker |
|---|---|---|
| 1 | Lærer åpner uten forklaring: ren startside og dokumentasjon gjennomgått; F08/F13. | To lærere tenker høyt i tre minutter uten forhåndspresentasjon. Hva tror de elevkoden og siden gjør? |
| 2 | Introdusere hel klasse: oppstarts- og pakkehandlinger utført; klassekoordinering vurdert, F02/F13/F14. | Læreren gir bare én felles oppstartsbeskjed. Tell hvem som trenger hjelp og hvorfor. |
| 3 | Elev først på mobil: ren profil 390 px; reelle klikk; F02. | Fysiske iPhone-/Android-enheter med skjermtastatur, skole-Wi-Fi og elevens vanlige tekststørrelse. |
| 4 | Naturlig alternativ oversettelse: `å drikke` skrevet i ekte quiz; F03. | La elever bruke eget språk, ikke instruer dem til å kopiere fasitens stil. |
| 5 | Egentlig riktig, men avvist: flere slike svar og elevinnspill testet; F03/F04/F17. | Registrer elevens reaksjon og tiden læreren bruker på å avgjøre tvisten. |
| 6 | Grammatikk uten forklaring: A0-teori og hay/estar lest og brukt; F10. | Elev forklarer med egne ord hva som kreves før og etter teorien. |
| 7 | Mange feil: faktisk feiløkt, hintfelle, resultat og teori prøvd; F01/F10. | Tre elever med svake forkunnskaper: Kan de løse en ny oppgave etter hjelpen? |
| 8 | Alt riktig: kontrollert 10/10-quiz; F06/F15. | Sterke elever får fem ekstra minutter: velger de ny læring eller bare flere poeng? |
| 9 | Store nivåforskjeller: katalog/ruting og kontrasterende svarforløp undersøkt; F15/F19. | To svake, to middels og to sterke elever gjør samme mål med ulike støttenivåer. |
| 10 | Omlasting/ny nettleser: omlasting, samme kode i ren profil og faktisk eksport/import; F08/F18. | Eleven utfører gjenoppretting selv; læreren forklarer en manglende sikkerhetskopi. |
| 11 | 20–30 minutters time: bygging/import, avbrudd og første-dagsrapport undersøkt; F06/F07/F14. | Én 25-minutters økt, inkludert oppstart og oppsummering, med klokket støttearbeid. |
| 12 | Flere uker: kodegjennomgang av historikk, pakker og diktatdatoer; F07/F12/F16. | To–tre uker med samme elever, ny pakke og minst én publisert oppdatering. |
| 13 | Lærer vil vite hva elevene gjorde: lokal rapport og dokumenterte begrensninger; F07/F14. | Lærer skal svare hvem som strevde med dagens mål uten å samle rå elevtekst. |
| 14 | Tastatur alene: glosekort, ordbrikker og dialog prøvd; F11. | Hele reisen uten mus, deretter skjermleser og 200 % tekst/zoom. |
| 15 | Dårlig/ingen forbindelse: ekte offline-modus etter innlasting; F09/F12. | Treg forbindelse, frakobling under lyd og gjenåpning offline på skoleenhetene. |
| 16 | Alternativer: arbeidsflyt sammenholdt med lærebok/egne oppgaver og offentlig produktdokumentasjon nedenfor. | Samme lærer lager samme 20-minutters mål i to verktøy og sammenligner forberedelse, hjelp og etterarbeid. |

### Sammenligning med alternativer

Læreren vurderer ikke antall funksjoner isolert, men om produktet gjør en bestemt undervisningsoppgave enklere:

- **Lærebok/egne oppgaver:** Spansk på 1-2-3 tilbyr mer umiddelbar respons og repetisjon. Læreboka eller lærerens eget opplegg kan likevel vinne på kjent rekkefølge og at læreren vurderer naturlige svar. Dette er en arbeidsflytvurdering, ikke en faglig rangering av bestemte lærebøker.
- **Quizlet:** Klassespesifikt innhold og oppfølging er en etablert forventning. Quizlet beskriver klassefremgang med oversikt over aktivitet og vanskelige begreper for relevante lærerabonnementer. Spansk på 1-2-3 bør konkurrere på enkel, lokal norsk-spansk øving, ikke antyde at det allerede har tilsvarende klasseoversikt. Ingen pris- eller personvernsammenligning er gjort. [Quizlets beskrivelse](https://help.quizlet.com/hc/en-us/articles/360030512432-Using-Class-Progress/).
- **Kwiziq:** Kwiziq beskriver en sammenheng mellom nivåtest, personlig studieplan, grammatikkleksjoner og Brainmap. Den samme typen begreper i denne appen skaper en forventning om en tett forklaring–øving–veiledning-kjede. Dagens svakeste lenke er kvaliteten på denne kjeden, ikke størrelsen på kartet. Sammenligningen bygger på deres egen produktbeskrivelse, ikke en full konkurrenttest. [Kwiziq Spanish](https://spanish.kwiziq.com/).

## 5. Minimumskrav før en pilot med en klasse

1. **Et avtalt pilotinnhold er faglig godkjent.** Ingen kjente urimelige fasiter, ødelagte setninger eller tomme forklaringer i de rutene læreren skal bruke. Test hele hovedflyten, ikke bare hjelpefunksjonene.
2. **Alle kommer inn og ut.** Start, navigasjon, svar, hint, neste, teori, resultat og avslutning fungerer med mobil og tastatur. Ingen elev må slette data for å fortsette.
3. **Resultater beskriver faktisk arbeid.** Deløkter teller bare svar, null svar gir ikke mestring, nye lekser arver ikke tidligere øving og egenvurdering presenteres som egenvurdering. Ellers må resultat-/leksefunksjonen tas eksplisitt ut av pilotformålet og ikke vises som bevis.
4. **Et enkelt 20–25-minutters læreropplegg ligger klart.** Ett mål, en avtalt start, en støttevei, en utfordring for tidlig ferdige og en avslutning som virker første dag. Dette kan være en kort veiledning og en lokal pakke; det krever ikke lærerportal.
5. **Lokal lagring forklares korrekt før første svar.** Kode er ikke konto. Vis hva som lagres, hva som eksporteres, at ingen lærer mottar det automatisk, og hvordan eleven sikrer fremgangen. Ikke krev fullt navn.
6. **Offline og lyd er kontrollert på skolens faktiske enheter.** Historier enten er tilgjengelige eller sier tydelig fra. Hvis lyd ikke inngår i piloten, må læreren vite det og den avtalte elevruten ikke lede dit.
7. **En rettet versjon når både nye og tidligere besøkende.** Kontroller publisert versjon i ren og brukt profil, uten å nullstille fremgang.
8. **En enkel stopp- og reserveplan.** Ved falsk feil, fastlåst elev eller manglende lyd: eleven viser problemet til lærer; lærer kan bytte til en kontrollert alternativ oppgave. Ikke krev at eleven sender identifiserende fritekst eller skjermopptak.

Ikke bruk denne piloten til karaktersetting, validert CEFR-plassering eller kontroll av ærlig leksegjennomføring. Målet bør være å undersøke om et kort, kontrollert supplement gir nyttig øving uten å øke lærerens støttearbeid.

## 6. Forslag til prioritering

### Må fikses før pilot

- F01–F05: låsing, mobilmeny, quizvarianter, diagnoseinstruksjoner/aksept og ødelagt A0-oppgave.
- F06: uriktig telling og mestringstekst. Det er tillitskritisk også uten en lærerportal.
- F08 og F11: feil gjenopprettingsløfte og tastatur/dialog-feil.
- F10: `undefined` og manglende forklaring i valgt pilotinnhold; full teoriutvidelse kan vente.
- F12: bevis at rettet versjon når brukerne før klassen inviteres.
- F07 hvis leksepakke/minuttmål inngår; ellers avgrens piloten tydelig fra disse tallene.
- F09/F16 hvis lyd/diktat inngår; ellers en uttrykkelig tekstøvelsespilot med avgrenset rute. Ikke markedsfør hele appen som offline-klar.

### Bør fikses før pilot

- F13/F14: lærerinngang, begrepsrydding og første-dagsoppsummering. En kort lærerveiledning er tilstrekkelig som første steg.
- F15: anerkjenn all øving, gjør neste læringsmål konkret og demp brede mestringspåstander.
- F17/F18: tydelige eksportgrenser og en forståelig avbrudds-/gjenopptakelsesregel.
- Rett dokumentasjon som beskriver eldre innholdstall, planlagt pakke som nå finnes og ufullstendig publiseringsoppskrift.

### Kan vente

- Lærerinnlogging, Feide, dashboard, automatisk innlevering og skysynk. Disse krever en separat personvern-/datamodell og er ikke løsningen på de bekreftede fasitfeilene.
- Flere spill, flere merker, flere grammatikktemaer og omfattende visuell polering.
- Full adaptiv støtte for hele katalogen. Start med ett godt avgrenset læringsmål og dokumentert kvalitet.
- Større arkitekturomskriving. Små, testede rettelser i eksisterende struktur er tilstrekkelig for de fleste funnene. Eventuell felles svar-/økthåndtering kan trekkes ut senere under kompatibilitetstester.

Dette er auditprioritering, ikke en parallell oppgavestatusliste. Beads er kilden for videre arbeid.

Oppfølgingen er registrert i Beads: `4jh` (F03/F04), `lx8` (F01/F11), `c5t` (F02), `xip` (aktivitet/mestring), `2op` (innhold/forklaringer), `0h5` (lagring/avbrudd) og `get` (offline/oppdatering), alle med prefikset `spansk-ungdomsskole-`. Eksisterende `v0n`, `6j4` og `egb` dekker videre lærerforløp, gradert støtte og forsiktige «Jeg kan»-mål; disse er ikke markert ferdige av denne gjennomgangen.

## 7. Ting som allerede fungerer godt og bør bevares

- **Ingen innlogging og lokal fremgang.** Det fjerner konto- og passordfriksjon. Ikke løs læreroversikten med skjult elevsporing.
- **Faktisk fungerende eksport/import.** Jeg flyttet sikkerhetskopien til en ren nettleserprofil og fikk tilbake sentral fremgang. Eksisterende tester dekker også eldre format og korrupte lagringsdata.
- **Mange reelle læringshandlinger.** Elevene må velge, skrive eller bygge; gloser øves begge veier. Puslespill og Lingo Links har faglig innhold, ikke løsrevet poengjakt.
- **Glosekort med bevisst egenvurdering.** Mellomrom for å vise svar og 1/2 for igjen/bra fungerte. Selvrapportering er legitim gjenkallingsøving, men må ikke forveksles med kontrollert ferdighet. Bekreftelse ved fanebytte reduserer utilsiktet avbrudd.
- **Eleven kan protestere.** Dialogen viser oppgave, svar og fasit, sier at lagringen er lokal og er anonym som standard. Bevar dette, men rett tastaturfeilen og forklar hva som skjer videre.
- **De nye, avgrensede grammatikkleksjonene.** Synlig læringsmål, norske forklaringer, eksempler og knapp til relevant ny øving er riktig retning. Jeg gikk faktisk fra resultat til leksjon og tilbake: resultatet og lagret lærings-/grammatikk-/aktivitetstilstand var uendret.
- **Ikke all stavingsvariasjon jevnes ut.** Det finnes eksplisitt håndtering av svarvarianter og forskjell på aksent og `ñ`. Bevar faglig begrunnet strenghet, men bruk den konsekvent.
- **Manuell lydstart og reell offline-basis.** Avspilling krever et elevvalg; appskallet fungerte offline etter innlasting. Begrensningen gjelder blant annet ikke-nedlastet lyd, ikke at offline-støtten er verdiløs.
- **Et brukbart testgrunnlag finnes allerede.** 89 utvalgte tester bestod. De gir et godt utgangspunkt for nye tester av overgangene som denne gjennomgangen fant hull i.

## 8. Konkret testplan for neste revisjon

### A. Før mennesker inviteres: rettelsessjekk i nettleser

Bruk en ren profil, en profil med dagens fremgang og en eldre eksportfil. Ingen virkelige elevdata trengs.

| Test | Fremgangsmåte | Bestått når |
|---|---|---|
| Rettferdig fasit | Kjør alle godkjente svarvarianter gjennom vanlig gloseøving, diagnose og blandet quiz; skriv manuelt `å drikke`, `mora` og relevante fullsetninger. | Like læringsmål har dokumentert, konsistent aksept. Negative betydningsendringer avvises fortsatt. |
| Oppgavekvalitet | Lærer leser ferdig utfylte pilotsetninger, alle alternativer og norske instruksjoner. | Ingen ugyldig fasit, mer enn én umerket riktig flervalgsfasit eller skjult nødvendig kontekst. |
| Hjelp etter feil | Riktig/feil → hint → neste; feil → teori → samme resultat → ny øving. | Ingen blindvei; forklaring er relevant; ingen dobbeltregistrering. |
| Tastatur/dialog | Tab/Enter/Mellomrom gjennom hver valgt øvelse; skriv to avsnitt i elevinnspill; Escape og avbryt. | Fokus og handling blir i riktig område, uten bakgrunnsnavigasjon. |
| Mobil | Klikk alle hovedmenyvalg ved 360/390/640/768/1024 px; test skjermtastatur og stor tekst på fysiske enheter. | Alt nødvendig er lesbart, trykkbart og synlig uten overlapp. |
| Ærlig resultat | Avslutt hver økt etter 0, 1 og alle svar. Gjenta avslutning og gå tilbake. | Bare faktisk besvarte oppgaver telles; tom økt gir ikke mestring eller aktivitet. |
| Ny pakke/ny uke | Gjør pakke A, importer B med to grammatikktemaer; flytt testklokken til neste uke. | B starter riktig, alle temaer nås, ukedager og minutter er korrekt avgrenset. |
| Gjenoppretting | Last om midt i oppgave og etter svar; eksporter/importer i ren profil; prøv samme kode uten fil. | Forventet data bevares, avbrudd forklares, kode blir ikke fremstilt som konto. |
| Lydfeil/offline | Ubrukt og nedlastet historie, treg/avbrutt forbindelse, deretter gjenopprettet nett. | Avspillbar lyd eller konkret feil med ny prøving/alternativ; ingen taus start av umulig oppgave. |
| Diktatvurdering | Tomt, `a`, fragment, tegnsettingsvariant, helt riktig; gjenta på ny dag. | Ingen overdreven nærhet/mestring; aktiviteten og ny dato registreres etter tydelig policy. |
| Oppdatering | Brukt profil på A → publisert B i testmiljø → omlasting og offline. | Versjon B kan bekreftes, og fremgang er intakt uten sletting av nettsteddata. |
| Personvern | Observer appens nettverksforespørsler og eksporter ved hvert steg. | Ingen nye identifikatorer, råsvar eller innspill sendes automatisk; eksportens omfang er forståelig. |

Kjør deretter eksisterende relevante tester på nytt. Utvid dem med disse reproduksjonene. Et ekstra rent hjelpefunksjonstestsett er ikke tilstrekkelig: retningene må gå gjennom quizbyggeren, og tastetrykkene må skje med korrekt fokus i en ekte UI-flyt. TTS-tester med simulering må suppleres med faktisk lytting på pilotmaskinene. Offline-testen i `tests/pwa-and-ui-smoke.spec.js` trenger lokal HTTP-server på port 5178 og kan ellers bli hoppet over; rapporter dette eksplisitt.

### B. Moderert prøve: to lærere og seks elever

Ta med elever med svake, middels og sterke forkunnskaper, minst to mobilbrukere og én tastaturbruker. Ingen opptak eller identifiserende innsamling er nødvendig. Noter anonymt oppgavetype, stoppunkt og om lærerhjelp ble nødvendig.

Forslag til 25 minutter:

1. **0–3 min:** Læreren introduserer mål og start uten individuell hjelp.
2. **3–6 min:** Én kort felles modelloppgave med eksplisitt fasitpolicy.
3. **6–16 min:** Avgrenset selvstendig øving. Observer feil, hjelp og nye forsøk.
4. **16–21 min:** Støttet alternativ for dem som strever; ny anvendelse for dem som er ferdige.
5. **21–25 min:** Lokal oppsummering, ett selvstendig sluttspørsmål og sikkerhetskopi ved behov.

Foreslåtte pilotgrenser, ikke påståtte standarder: null falske avvisninger i det valgte innholdet, null fastlåste økter, alle seks kommer til avtalt oppgave, og læreren klarer oppstart/avslutning uten utviklerstøtte. Noter hvor mange hjelpespørsmål som skyldes teknologi/fasit fremfor spansk. En elev skal etter feil kunne forklare ett konkret forbedringspunkt; en sterk elev skal kunne finne en relevant neste utfordring.

Spør læreren etterpå: «Hva måtte du gjøre som nettsiden skulle ha gjort?», «Hvilken situasjon ville fått deg til å avbryte med en full klasse?» og «Ville du brukt nøyaktig dette opplegget igjen neste uke — hvorfor eller hvorfor ikke?»

### C. Begrenset oppfølging over to–tre uker

Bruk samme avgrensede målstruktur, men en ny pakke og nye eksempeloppgaver. Kontroller om fremgang, datoer og gjenoppretting holder, om læreren faktisk gjenbruker løsningen, og om elever kan anvende språket utenfor den kjente quizformuleringen. Ikke bruk antall quiz eller selvrapporterte riktige kort som eneste suksessmål.

### Verifikasjonslogg fra denne revisjonen

Kjørt 8. september 2026:

```text
npm run check:content-accuracy
  Bestått: 16 kontroller; 537 glossary items, 111 grammar exercises,
  34 verbs, 14 sentence puzzles.

npm run check:grammar-lessons
  Bestått: 7/7 publiserte leksjoner.

npx playwright test tests/answer-acceptance-fuzz.spec.js
  tests/import-export-compat.spec.js tests/storage-recovery.spec.js
  tests/student-feedback.spec.js tests/grammar-lessons.spec.js
  tests/diagnosis-flow.spec.js tests/dictation.spec.js
  --browser chromium --workers=2 --reporter=line
  --output=output/playwright/critical-audit-2026-09-08/regression
  63 passed (6.4s).

npx playwright test tests/assignment-package.spec.js
  tests/sentence-puzzle-game.spec.js tests/lingo-links-game.spec.js
  tests/tts.spec.js --browser chromium --workers=2 --reporter=line
  --output=output/playwright/critical-audit-2026-09-08/additional-regression
  26 passed (4.7s).

git diff --check
  Bestått uten meldinger.
```

Linjebrytningene ovenfor er for lesbarhet; hver Playwright-gruppe ble kjørt som én kommando. Antall katalogelementer er ikke identisk med antall aktive glosekort: runtime hadde 523 kort, altså 1046 retningstilfeller i den undersøkte delen av quizbyggeren.

UX-audit-skillen styrte vurderingen av forventning, friksjon, feilretting og tastatur. Playwright-skillen styrte bruk av ekte nettleserhandlinger og bevis. Verifikasjons-skillen avgrenset konklusjonene til ferske kontroller. Ingen av dem ble brukt til å autorisere app-endringer.
