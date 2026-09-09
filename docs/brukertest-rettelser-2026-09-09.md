# Rettelser og verifikasjon etter brukertesten

Utgangspunkt: rapporten `brukertest-2026-09-08.md` og arbeidskopien med SHA-256 `5488be14fd5d2ac4168619a11b867595339e324f1e08efa0d076ccfbb022d104`. Brukeren autoriserte 9. september retting, commits, push og PR. Dette dokumentet samler bevis; Beads styrer oppgavestatus.

## Utgangspunktet er bevart

Den eksisterende appen, grammatikkleksjonene, Lingo Links, relevante tester og rapporten er bevart i commit `49bbbcf`. Rapportens 89 tester ble kjørt på nytt: **89 bestod**. Innholdskontrollen bestod 16 kontroller, og leksjonskontrollen bestod for sju leksjoner. Urelaterte lokale filer ble ikke lagt til.

## F03/F04: svaraksept og nivåtest

Quizbyggeren brukte lagringsretning (`noToEs`/`esToNo`) når svarhjelperen krevde øvingsretning (`no-es`/`es-no`). Den bruker nå riktig grensesnitt. En katalogtest går gjennom begge retninger og alle registrerte varianter; elevtesten svarer «å drikke» gjennom en faktisk bygget quiz ved 1440 og 390 px. Negative kontroller avviser endret betydning og ñ-forveksling.

Nivåtesten viser instruksjon, original spansk oppgave og norsk betydning sammen, også når svaret gjennomgås. «mora» og «Yo me llamo Ana» er eksplisitte svaralternativer; oppgavenes innholdsversjon er økt. Bøyningsoppgavene viser verb og pronomen, slik at det er klart at en verbform etterspørres. Resultatet omtales som et foreløpig øvingsforslag.

Kildesjekk utført av Codex, **ikke spansklærergodkjenning**:

- [Språkrådet om mor/mora og eiendomsuttrykk](https://sprakradet.no/spraksporsmal-og-svar/far-min-mor-mi-fader-var-og-sa-videre/) og [Bokmålsordboka: mor](https://ordbokene.no/nno/bm/mor) støtter bokmålsvarianten.
- [ASELE-artikkel hos Instituto Cervantes, side 891](https://cvc.cervantes.es/ensenanza/biblioteca_ele/asele/pdf/15/15_0887.pdf) beskriver eksplisitt og utelatt subjektpronomen og gir et eksempel med «yo me llamo». Tillegget endrer ikke verbets person eller navnets betydning.

Testene ble observert røde før retting: mistede svarvarianter i quizbyggeren, skjult gustar-instruksjon og begge avviste diagnosevarianter. Etter retting bestod **50 tester** i `report-answer-fairness`, `answer-acceptance-fuzz`, `adaptive-quiz` og `diagnosis-flow`; `check:diagnosis-catalog` bestod også.

Et hull i eldre glosetester ble samtidig rettet: ordlisten må lastes før katalogløkkene kjøres, og hovedtesten krever over 500 faktiske kort. En tom liste kan ikke lenger gi falskt grønt resultat i denne kontrollen.

## F01/F11: hint og tastatur

Hint vises i et eget felt og erstatter ikke svaret, forklaringen eller Neste. Riktig og feil svar etterfulgt av gjentatte hint er testet i verb og grammatikk uten ekstra registrering. Bøyingstabellen legges til uten å opprette eksisterende inputfelt på nytt.

Innspillsdialogen har navn og modalsemantikk, flytter fokus til tekstfeltet, holder Tab inne og lukker med Escape. Enter lager linjeskift i forklaringen; lagring og avbryt gir fokus tilbake. Globale øvingssnarveier ignorerer dialoger, vanlig tekstredigering og aktivert standardatferd på knapper. Enter velger fokusert ordbrikke. Skjulte Neste-knapper overtar ikke snarveien.

De nye reproduksjonene feilet før retting. **49 tester bestod** i `report-practice-navigation`, `student-feedback`, `grammar-explanations`, `grammar-lessons`, `sentence-puzzle-game` og `diagnosis-flow`. Resultat → teori → tilbake er fortsatt dekket.

## F02: mobilmeny

Mobilmenyen har egne rader for merkevare, menyvalg og elevkode/innstillinger. Menyvalgene får to kolonner på små skjermer; lange navn og stor tekst bryter innenfor sin plass. Dialoginnhold kan rulles på korte skjermer.

Reproduksjonen bekreftet at elevnavnet avskar klikk på menyvalg. Etter retting bestod reelle klikk på alle åtte menyvalg, både fremover og bakover fra ulike undersider, ved **360/390/640/768/1024 px** med langt navn og 24 px menytekst. `check:tailwind` bestod. Fysisk mobil og skolens tekstinnstillinger gjenstår til pilot.

## F05/F10 og svarforklaring i F16

Yrkesoppgaven gir nå «Mi madre es profesora» og ber uttrykkelig om den enkle yrkesbeskrivelsen uten artikkel. Denne instruksjonen følger også oppgaven inn i blandet quiz. A0-teorien forklarer uttrykkene oppgavene krever. Alle ti hay/estar-oppgavene har konkrete hint, og feilforklaringen har en trygg reserve hvis innhold mangler. Vindu-eksempelet handler nå om plassering ved døra.

[Instituto Cervantes, grammatikkoversikt A1–A2](https://cvc.cervantes.es/ensenanza/biblioteca_ele/plan_curricular/niveles/02_gramatica_inventario_a1-a2.htm) støtter yrkesbeskrivelser uten artikkel, hay ved presentasjon av noe som finnes, og estar for plassering. Dette er kildestøttede rettelser, ikke godkjenning av hele oppgavebanken fra spansklærer.

Diktat skiller mellom tomt svar, ufullstendig svar, tegnsettingsforskjell og øvrig forskjell. Delstrengtreff gir ikke lenger ros. En faktisk innsending av «a» avdekket dessuten at aksenthåndteringen blokkerte tekstinnsetting uten fysisk tastetrykk; denne blokkeringen er fjernet.

Reproduksjonene ble observert røde før retting. **37 tester bestod** i `report-content-feedback`, `dictation`, `grammar-explanations`, `grammar-lessons` og `report-answer-fairness`. Innholdskontrollen bestod 16 mekaniske kontroller og leksjonskontrollen sju leksjoner. Diktatens fullføringsregistrering og lydtilgjengelighet behandles sammen med F06–F09/F12/F16.

## F06/F07/F08/F17/F18: opptelling, pakker og lokal gjenoppretting

Verb, grammatikk, gloser og blandet quiz lagrer antallet besvarte oppgaver før Neste. Øktreferansen gjør at gjentatt avslutning oppdaterer samme post. Delvise resultater viser besvart av planlagt; null svar gir ingen registrert økt eller mestringspåstand. Gloseinnsending registrerer svaret før navigasjon, og Angre tilbakefører kort, læringsdata og historikk. Den gamle Angre-koden gjenopprettet kortreferanser uten kortdata; reproduksjonen avdekket og rettet dette.

Ved omlasting merkes den lagrede deløkten avbrutt, og et synlig varsel forklarer at svarene er bevart og en ny økt må startes. Ingen oppgaver eller råsvar legges til historikken. Resultat → teori → tilbake registrerer fortsatt ikke noe ekstra.

Pakketilknytning gis bare ved start fra pakkens knapper. Pakkens tidsmål inkluderer ikke annen eller eldre øving. Alle tildelte grammatikktemaer kan åpnes, også via teori. Nye pakker har egen ID; samme eldre fil får stabil ID ved ny import. Tid er medgått tid uten oppavrunding til ett minutt per klikk, og merkes som et anslag som kan inkludere pauser. Kalenderen bruker lokal dato. Datamodell, tidsavgrensning og 30-dagers historikk er dokumentert i README.

Velkomsten sier uttrykkelig at elevkoden ikke gjenoppretter data. Eksportområdet opplyser om nivåtestsvar i fremgangsfilen og separat eksport av innspill. Dialogen sier at ingen mottar innspillet automatisk og at poengsummen ikke endres.

Alle de sju opprinnelige reproduksjonene var røde. Etter retting bestod **58 tester** for opptelling, leksepakker og gloser. Deretter bestod **48 tester** for opptelling, personverntekst, eksport/import av gamle og nye formater, skadet lagring, grammatikkleksjoner, innspill og resultathoder. Nytt innhold i historikken ble også eksportert til en ren nettleserkontekst. Omlasting ble prøvd to ganger uten doble svar, og lokal mandag kl. 00.30 ble registrert på riktig uke.

## F09/F12/F16 og diktattastatur i F11

Diktat har én visnings- og tastaturflyt. Innsending bevarer lydavspilleren, Neste har vanlig knappatferd, og Enter i innspillsdialogen endrer ikke diktatoppgaven. Resultatet skiller besvarte deler fra riktige svar. En tom gjennomgang registreres ikke som fullført. Ny gjennomføring på en annen dag bevares som en ny dato; gjentatt avslutning/import lager ikke duplikater. Bare historie-ID og dato lagres.

Start og Sjekk svar venter på tilgjengelig lyd. Både forhåndslytting og enkeltsegment har synlig feil og Prøv igjen. Eleven kan laste ned hele den valgte historien eksplisitt. Appskall og lyd lagres separat; en lydfeil returnerer ikke HTML. Cachede lydfiler støtter delvise forespørsler fra lydspilleren.

Byggkommandoen lager en innholdsstyrt versjon for app og service worker. Hele appskallet hentes før aktivering, og en åpen app får en oppdateringsknapp uten automatisk omlasting. Knappen bevarer en pågående økt. Aktivering sletter ikke fremgang, nedlastet lyd eller andre programmers cacher. Oppgraderingen er prøvd både fra tidligere v4-cache og fra bygg A til B i samme brukte profil.

Teknisk grunnlag: [MDN om aktivering med skipWaiting](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting), [Cache.put](https://developer.mozilla.org/en-US/docs/Web/API/Cache/put) og [delvise HTTP-forespørsler](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests). Aktivering og omlasting behandles separat, og bare hele lydressurser lagres før de deles opp i avspillingssvar.

De fire diktatreproduksjonene feilet før retting; deretter bestod **16 tester** for innhold og diktat. **23 tester** bestod for diktat, offline, oppdatering og PWA. Testene starter en ekte lokal HTTP-server, og nettbruddet avviser også forbindelser på serversiden: nettleserens offline-emulering alene stanset ikke service workerens nettverk i dette miljøet. Nedlastet historie gjennomføres med alle åtte deler uten servertilgang. Bygg- og Tailwind-kontroll bestod. Fysisk lydvurdering er fortsatt menneskelig pilotarbeid.

## Menneskelig sluttkontroll

Beads `spansk-ungdomsskole-ee0` samler lærerens faglige kontroll, moderert elevpilot, fysisk mobil/lyd og bruk over flere uker. Dette er ikke gjennomført av automatiske tester. Ingen publisering eller faktisk elevstudie inngår i rettingsmandatet.

## Første time og første dags oppsummering (F13/F14, del av F15)

Hovedknappen starter nivåtesten ved første besøk. Lærerveiledningen er synlig før elevkode, og åpner én avgrenset leksjon om bestemte artikler. PILOT.md er skrevet om til faglig gjennomgang og liten moderert prøve før eventuell helklassebruk, med konkret 20-minutters opplegg og reserve. Dagens og ukens oppsummering er tilgjengelige fra første dag, uten automatisk utskrift eller innsending. Start anerkjenner registrert aktivitet også uten dagsquiz.

Fire nye nettlesertester dekker reelle startklikk på 390/1440 px, lærerinngang før kode og én besvart grammatikkoppgave → Start → dagens rapport uten utskriftskall. Eldre tester er oppdatert fra deaktivert hovedknapp og todagerssperre til den nye tilgjengelige flyten.


## F15/F19: konkrete mål, variasjon og spillstøtte

Separate presenssvar oppdaterer de relevante verbferdighetene. Fremtidsformer tilskrives ikke presens, og en isolert modalform tilskrives ikke bruk sammen med infinitiv. Regelrette verbgrupper trenger riktige svar på minst seks former, to verb og tre personer før sterke oppgaveresultater/merker vises. Eldre import uten variasjonsgrunnlag gir ikke et slikt merke. Oppgavereferanser følger eksisterende lokal eksport; ingen nye råsvar lagres.

Målrettet verbøving bruker fem oppgaver og velger nye former så lenge utvalget rekker. En svak profil får hjelp til stamme/person/ending og en bøyingstabell etter feil; en sterk profil må skrive personord og verbform. Begge syntetiske profilene gjennomførte tre runder med 15 ulike former på mobilbredde. Neste mål har navn på ferdigheten, og fem quizer om dagen er ikke lenger det synlige læringsmålet. Variasjonsgrensen er en forsiktig produktregel, ikke en forskningsvalidert mestringsterskel. Utvidet adaptiv støtte utover disse rutene inngår ikke i denne rettingen.

Lingo Links har fire starttemaer, lærerens valg av fire temaer og et utvalg med bare tidligere øvde ord. For lite innhold gir beskjed uten automatisk påfyll. Etter et faktisk gruppeforsøk kan eleven vise betydninger; kategorihintet etter tre feil beholdes. Etter brettet skal to ord skrives uten brettet. Setningspuslespillet tilbyr én forklart plassering etter et forsøk. Reelle mobilklikk dekker feil, betydningshjelp, fullført brett og begge gjenkallingsordene. Om elever lærer av støtten, må prøves med mennesker.

Fire nye F15-tester var røde før retting. Spillreproduksjonene bekreftet manglende temavalg, og nye kontroller dekker også hjelp etter innsats. 24 tester bestod for veiledet øving, spill og quizmerker; 38 oppfølgingskontroller bestod for pakker, mobil, nivåtest, riktig svarvariant og læringsflyt.

## Supplerende kontroll av overgangene

Anførselstegn i et skrevet svar kunne ødelegge knappen til elevinnspill. Feilen ble gjenskapt og rettet ved å holde svarinnholdet utenfor selve handlingskoden; den samme løsningen brukes i gloser, quiz, verb og grammatikk. En ny test åpner dialogen med både doble og enkle anførselstegn og kontrollerer uendret svartekst.

Den generelle ukeoversikten og den aktive pakkens oppgaver/dager vises nå separat. En ny pakke får null egne oppgaver og dager selv om generell ukeøving finnes. Diktathistorier vises som forsøkte historier, ikke som oppgaver med beregnet treffprosent.

Innholdskontrollen hadde en eldre avhengighet av mellomrom i HTML-kildens glosearrayer. Den kontrollerer nå de uttrukne ordparene uavhengig av kildeformatering, med de samme 18 påkrevde rettelsene og negative kontrollene. Et vindu-eksempel i en overføringsoppgave fikk også samsvarende spansk og norsk tekst.

## Dekning av rapportens funn

| Funn | Teknisk resultat og hovedbevis |
|---|---|
| F01 | Hint bevarer Neste og svar; `report-practice-navigation`. |
| F02 | Klikkbar meny med langt navn og stor tekst på seks bredder; `report-mobile-navigation`. |
| F03 | Registrerte svarvarianter beholdes gjennom quizbyggeren; `report-answer-fairness`, `answer-acceptance-fuzz`. |
| F04 | Instruksjon/kontekst og naturlige varianter; `report-answer-fairness`, `diagnosis-flow`. |
| F05 | Gyldig yrkessetning og synlig begrensning også i quiz; `report-content-feedback`. |
| F06 | 0/1/alle svar, faktisk antall og idempotent avslutning; `report-session-accounting`. |
| F07 | Pakke-ID/periode, separate pakkedager og alle temaer; `report-session-accounting`, `assignment-package`. |
| F08 | Kode er lokal etikett, virkelig filgjenoppretting; `report-delivery-smoke`, `backup-privacy`. |
| F09 | Feil/ny prøving og eksplisitt full lydnedlasting; `report-offline-update`, `report-dictation`. |
| F10 | Konkret A0-teori og hint uten undefined; `report-content-feedback`, `grammar-lessons`. |
| F11 | Fokus, Enter, hint, innspill og sitattegn; `report-practice-navigation`, `student-feedback`, `report-dictation`. |
| F12 | Eldre v4 og bygg A → B i brukt profil, også uten nett; `report-offline-update`. |
| F13 | Fungerende første handling og avgrenset lærerinngang; `report-classroom-flow`, PILOT.md. |
| F14 | Dagens lokale oppsummering fra dag én; `report-classroom-flow`. |
| F15 | All registrert øving anerkjennes, konkrete mål og varierte verbformer; `report-guided-practice`. |
| F16 | Nøktern diktatrespons, ingen tom fullføring, nye datoer; `report-dictation`, `report-content-feedback`. |
| F17 | Separat innspilleksport, innhold i sikkerhetskopi og ingen automatisk mottaker; `report-session-accounting`, `student-feedback`. |
| F18 | Besvart arbeid lagres før Neste; avbrudd forklares og import bevares; `report-session-accounting`, `report-delivery-smoke`. |
| F19 | Temavalg, betydningshjelp og kort gjenkalling; `report-game-support`. |

De 16 opprinnelige scenarioene har teknisk dekning gjennom disse testene og læreropplegget. Scenarioenes krav om ekte elever, klassekoordinering, alternativsammenligning med lærer og flere ukers observasjon er fortsatt menneskelig prøvearbeid i `ee0`. Ingen test av publisert versjon er påstått; oppdateringene er prøvd på lokal HTTP-server.


Lydfeiltesten ble gjort deterministisk: en kunstig `error`-hendelse på en gyldig lydfil kunne bli etterfulgt av en reell `loadedmetadata`-hendelse. Testen serverer nå faktisk HTTP-feil, åpner forbindelsen for ny prøving og feiler neste segment. Den bestod tre påfølgende kjøringer uten test-retries. Appens lydflyt ble ikke endret for å tilfredsstille den kunstige hendelsen.

**Ekstra nettleserdekning:** 47 tester bestod i installert WebKit for lærerstart, hint/tastatur, mobilmeny, opptelling, pakker, spillstøtte, målrettet verbøving og eksport/import. Dette er nettleserautomatisering på Mac, ikke en fysisk iPhone-test. Firefox var ikke installert.

**Virkelig filflytting:** `report-delivery-smoke` laster ned en JSON-fil via brukerknappen og importerer den via filvelgeren i en separat, ren nettleserkontekst. Aktivitet og verbformgrunnlag ble bevart. Testen observerte bare GET-forespørsler til appens lokale origin i den prøvde elevruten, uten automatisk overføring av elevdata. Desktop- og mobilskjermbilder fra sluttflyten er kontrollert i `output/brukertest-rettelser/`.

## Samlet sluttverifikasjon

Kjørt 9. september 2026 på appbygg **3b7d7d7ef7b25a93**:

- `npm run build:app` og `npm run check:offline-build`: bestått; HTML og service worker peker på samme appinnhold.
- `npm run test:all`: bestått. 18 beskyttede innholdsrettelser, 16 innholdskontroller, 7 publiserte leksjoner, 12 nivåtestoppgaver, 60 katalogferdigheter, 2 Node-tester og **308 Chromium-tester**. Ingen tester hoppet over; nettleserdelen tok 44,3 sekunder.
- Ekstra WebKit-kjøring av `report-classroom-flow`, `report-practice-navigation`, `report-mobile-navigation`, `report-session-accounting`, `report-game-support`, `report-guided-practice` og `import-export-compat`: **47 bestod**.
- Lydfeil/ny prøving fra ekte HTTP-server: **3 av 3** påfølgende kontroller bestod.
- `git diff --check`: bestått.

De historiske testantallene tidligere i dokumentet beskriver delkontroller, og skal ikke summeres med sluttkjøringen. CI kjører nå samme `test:all` og omfatter de nye rapportregresjonene. Manuelle auditopptak og probe mot offentlig nettsted er eksplisitt separate kommandoer. Det er ikke gjort deploy, fysisk enhetstest, spansklærergodkjenning eller reell elevstudie.

Leveransen er pushet på `fix/brukertest-2026-09-08` og opprettet som [PR #6](https://github.com/TheVikLink/spansk-ungdomsskole/pull/6). Beads-epikken `irj` og de ni tekniske deloppgavene er lukket. `ee0` står åpen for den menneskelige kontrollen. PR-en er ikke slått sammen og appen er ikke publisert av denne leveransen.

## Oppfølging etter lærerens egen utprøving

Brukeren gjennomførte artikkeløkten med 14 av 14 riktige og meldte at teksten likevel sa «de fleste». Øvingsflyten ble vurdert positivt og ønskes brukt som mal. Dette er én brukers tilbakemelding, ikke den planlagte elevpiloten.

Beads `hch`: grammatikk, verb og blandet quiz deler nå en liten funksjon for presis resultattekst. Full pott gir «Du svarte riktig på alle oppgavene». Delvis riktige svar oppgir antallet; tidlig avslutning omtaler bare besvarte oppgaver. Null svar gir en nøytral melding. Gloser bruker samme funksjon, men omtaler registrerte kortforsøk fordi egenvurdering og nye forsøk kan inngå. Sammenligningen bruker antall, slik at 199/200 ikke omtales som «alle» selv om prosentvisningen avrundes til 100 %.

Alle grammatikktemaene deler allerede artikkeløktens oppgave- og resultatvisning. Malen er beskrevet i `PILOT.md`. Hint/Neste, teorikoblinger, øktregistrering og lagringsformat er bevart. Ingen nye spanskleksjoner eller større pedagogisk omlegging inngår i denne oppfølgingen.

Verifisert på bygg **e0027af0933febde**:

- `session-result-feedback.spec.js`: **23 bestod**, inkludert 14 faktiske artikkelsvar ved 1440 og 390 px, hint etter svar, resultat → teori → tilbake uten endring i eksportdata, ny øving, samtlige grammatikktemaer og resultatgrensene i fire øvingsfamilier. Desktop- og mobilskjermbilder er kontrollert.
- `npm run build:app` og `npm run test:all`: **bestått**, med **331 Chromium-tester** (3,9 minutter), 2 Node-tester og alle innholds-, katalog- og byggkontroller. De 23 nye testene inngår i de 331.
- `git diff --check`: bestått. Den lokale HTTP-serveren leverer samme bygg.

De 47 WebKit-testene ovenfor gjelder den foregående leveransen; denne lille oppfølgingen er verifisert i Chromium. Den publiserte appen er fortsatt uendret.
