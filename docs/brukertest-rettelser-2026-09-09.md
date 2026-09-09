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
