# Uttaleskole med Refold: fra skrift til lyd og egen høytlesing

**Gjeldende flyt er revidert etter eierens utprøving:** [Enklere uttaleskole](2026-10-07_uttaleskole-enklere-flyt.md) erstatter quiz, vokalgjetting og de mange bekreftelsene i planen nedenfor. Innhold, lydkilde og den avgrensede opptaksmodellen beholdes.

Dato: 7. oktober 2026. Planoppgave: `spansk-ungdomsskole-uow1`. Implementering: `spansk-ungdomsskole-lamg`; fagkontroll: `lamg.1`; supplerende opptak: `spansk-ungdomsskole-ksey`. Status: ferdig plan, kritisk gjennomgang APPROVED etter to runder; ingen appimplementering eller publisering i denne leveransen. Levende oppgavestatus føres i Beads.

## Mål og anbefalt retning

Eleven skal lære å koble spansk skrift til lyd og bruke denne kunnskapen i egen høytlesing, gjennom korte aktive økter med alle de 93 Refold-opptakene som modeller.

Anbefalingen er en egen **Uttale**-inngang med undertittelen **Lær å lese spansk høyt**, økter på omtrent 5–8 minutter, et søkbart lydoppslag og en enkel visning til felles gjennomgang. Tidsforslaget må prøves i klasserommet. Innhold velges etter forkunnskaper, ikke klassetrinn, for hele ungdomsskolen og spansk nivå I i videregående. Ingen innledende diagnose er nødvendig for å begynne.

Et valgfritt kort opptak av egen stemme kan gjøre sammenligningen konkret. Anbefalt første produktversjon inkluderer dette etter at kjerneøving uten mikrofon virker. Ingen automatisk uttalekarakter, talegjenkjenning eller krav om å høres ut som én bestemt morsmålsbruker. Mål: forståelig tale, bevisst lytting og trygghet i lesing.

Produkteier er spurt om to preferanser: (1) egenopptak i første versjon eller senere, (2) korte elevøkter med lærervisning, lærerstyrt opplegg først eller selvstendig kurs først. Eier besluttet senere 7. oktober: valgfritt egenopptak med i første versjon, ingen overføring/varig lagring av lyd, og korte elevøkter på 5–8 minutter. Eier har bestilt implementering og framhever bruk som begynnerlekse. Direkte temalenker gir denne bruken uten ny Feide-integrasjon.

Faglig forankring: skrift–lyd, uttaleregler, lesing og læringsstrategier støtter relevante mål i [Udirs fremmedspråk nivå I](https://www.udir.no/lk20/fsp01-04/kompetansemaal-og-vurdering/kv965?lang=nob). Modulen er et avgrenset bidrag, ikke dokumentasjon på full læreplandekning eller en selvstendig vurdering av muntlig kompetanse.

## Verifisert grunnlag

### Rettigheter

Ben Adams fra Refold svarte 7. oktober på forespørselen «Permission request: Spanish Phonetic Writing System deck in a Norwegian learning app». Svaret sier ja til den beskrevne bruken med kreditering av Refold og kildeangivelse. Forespørselen beskrev lyd og tekst, norsk bearbeiding, offline-bruk og mulig kommersiell bruk; produkteier har uttrykkelig gitt klarsignal til implementering på dette grunnlaget.

Før implementering dokumenteres denne prosjektspesifikke tillatelsen i `docs/uttale/refold-rettigheter.md`, med dato, avsenderorganisasjon, forespørselens omfang og betingelse. Original e-post oppbevares i eierens e-postarkiv; ikke legg en privat e-postdump eller hele Anki-eksporten i en offentlig leveranse. Tillatelsen omtales ikke som en generell åpen lisens.

Foreslått synlig kreditering på oversikten og i «Om lydopptakene»: «Lyd og originaleksempler: Refold, Spanish Phonetic Writing System. Brukt med tillatelse. Norske forklaringer og øvelser: Spansk på 1-2-3.» Lenker til Refold og [originaldekket](https://ankiweb.net/shared/info/1195472731), også tilgjengelig som tekst offline. Ingen innebygde eksterne spillere, fonter, piksler eller automatisk lasting fra Refold/AnkiWeb.

Ønsket om omtale av ordforrådsdecket er formulert som et ønske. Eventuell vanlig ressurslenke kan stå i lærer-/ressursinformasjon; inntektsdeling, kjøpssporing og reklame i elevøvelsene inngår ikke i planen. Det er ikke inngått noen slik avtale.

### Den faktiske pakken

Lest fra eierens AnkiDroid-eksport i `/Users/olehenrikvik/Downloads/`, med filnavn som slutter på `Spanish Phonetic Writing System - Free Refold Deck-20261006201858.apkg`. Analyseres som data; Anki-maler/scripts kjøres ikke.

| Kontroll | Resultat |
| --- | --- |
| Arkivets SHA-256 | `d67fa8c7937f6f7f0a02f4054ebdd61749c13a68583a7356dc054d960d152c97` |
| Riktig database | `collection.anki21`; `collection.anki2` er bare en kompatibilitetsmelding |
| Innhold | 31 lydtemaer × introduksjon, ord og setning = 93 læringsnotater; dessuten ett tomt ekstra notat |
| Mediefiler | 93 forskjellige MP3-filer og fem fonter |
| Lydstruktur | 31 × `letter`, `word`, `sentence`; alle 93 referanser finnes |
| Lydstørrelse | 2 413 389 byte, omtrent 2,4 MB |
| Samlet varighet | 140,230 sekunder; enkeltfiler omtrent 0,74–3,45 sekunder |
| Teknisk kvalitet | Alle 93 dekoder uten feil/varsler i ffmpeg; MP3, 44,1 kHz, mono/stereo |
| Faglig lydkontroll | Ikke gjennomlyttet ord for ord i denne kartleggingen; eier har uttrykt god vurdering av opptakene |

Fullt innholdsgrunnlag, kontrollmetode og hash/varighet for hver fil står i [kildekartleggingen](../../../docs/uttale/refold-kartlegging-2026-10-07.json). Den er et forskningsvedlegg med originaltekst, **ikke** en godkjent innholdskatalog. Ingen Anki-repetisjonshistorikk eller elevdata er tatt med. Fonters egne rettigheter er ikke undersøkt; bruk appens eksisterende fonter.

31 temaer betyr ikke 31 enkeltfonemer eller 31 bokstaver: materialet omfatter både lyder, flere skrivemåter og vokalforbindelser. Flere `word`-opptak inneholder flere ord. UI må si «Lytt til ordene» der det er tilfellet. `letter`-filene skal faglig kontrolleres og presenteres som lydmodell, ikke automatisk som bokstavnavn.

## Pedagogisk oppbygning

### Ti temaer, små økter

Temaene nedenfor dekker alle kildeindeksene 1–31 nøyaktig én gang. Store temaer deles i økter med 2–3 nye lydkort og noen repetisjoner. Alle lyder kan åpnes direkte av lærer eller elev; anbefalt rekkefølge er veiledning, ikke låste porter.

| Tema | Refold-indekser | Fokus |
| --- | --- | --- |
| 1. De fem vokalene | 1–5 | a, e, i, o, u; lytte, lese og holde vokalene tydelige |
| 2. Vanlige konsonanter | 17, 18, 21, 23, 24, 26, 30 | d, f, l, m, n, p, t i ord |
| 3. c/qu/k og g/gu | 16, 19 | Betydningen av bokstaven som følger etter |
| 4. b/v og j/g | 15, 20 | Samme lydkategori med ulike skrivemåter; norsk overføring |
| 5. ñ og ll/y | 25, 22 | n/ñ og ulike regionale realiseringer av ll/y |
| 6. r og rr | 27, 28 | Én berøring og rulling, med korte øvingstips |
| 7. s, c og z | 29, 31 | Høre og forstå gyldige regionale forskjeller |
| 8. ai/ay, ei/ey, oi/oy | 6–8 | To vokaler i sammenheng |
| 9. au og eu | 9–10 | Vokalforbindelser; egen presisering av cacao/ao |
| 10. iu, ui, ue og uo | 11–14 | Fra lydforbindelse til eksempelord og setning |

For skolebruk foreslås ett tema fordelt på korte innslag i flere timer. Hver økt veksler mellom lytting og egen produksjon; en hel undervisningstime med isolerte lyder anbefales ikke som standard. Vanskelige r-lyder skal kunne repeteres uten å sperre videre læring.

### En konkret økt

1. **Oppdag:** Vis skrift, spill lyd etter elevens trykk, marker relevant bokstavkombinasjon og gi én kort norsk forklaring. Her er modellen undervisning, og kan høres før elevens forsøk.
2. **Lytt og velg:** Spill et modellopptak, la eleven velge mellom 2–3 faglig gyldige alternativer, og vis fasit først etter svar. Ingen automatisk avspilling; tydelig «Spill igjen».
3. **Les selv:** Vis eksempelord uten IPA, oversettelse eller avspilt fasit. Eleven prøver høyt og velger «Jeg har prøvd – hør modellen». «Jeg trenger å høre først» er et likeverdig støttevalg, men teller ikke som et selvstendig svar.
4. **Sammenlign:** Hør modellen, prøv igjen og eventuelt ta opp eget forsøk. Still ett konkret spørsmål: «Hørte du én kort r, eller flere slag?» Egenvurdering er ikke automatisk rett/galt.
5. **Les i sammenheng:** Bruk setningsopptaket til samme lyd. Vis norsk betydning på forespørsel slik at ukjent ordforråd ikke blokkerer uttalearbeidet. Marker fokuslyden etter første forsøk; ikke krev at eleven kan all grammatikken.
6. **Hent fram igjen:** Avslutt med et tidligere lydkort eller en liten oppgave om skrift/trykk. Tilby «Øv mer på dette» eller «Ferdig for nå» uten vurdering av elevens aksent.

Eksempel med `c/qu/k`: Læreren/eleven hører hele opptaket «casa, queso, kilo». En kontrolloppgave kan spørre hvilken skrivemåte som gir k-lyd foran e, med fasit qu. Dette er kontroll av en uttaleregel. Appen skal ikke gi uttalepoeng fordi eleven valgte riktig. Det er heller ikke en ren lyttediktat der k-lyden skulle identifisere én unik skrivemåte.

For r/rr kan de to isolerte lydopptakene sammenlignes. Ikke kall «carro, raro» mot «caro» et ferdig, balansert minimalpar: det ene ordopptaket inneholder to ord. Ingen automatisk oppkutting eller konstruerte lydsammenstillinger i første versjon.

IPA skjules bak «Vis lydskrift». Den skal hjelpe interesserte elever/lærere, ikke være en forkunnskap. Norske tilnærminger brukes varsomt fordi norske dialekter varierer. Forklar tungestilling og hva eleven kan lytte etter, og la det faktiske opptaket være modellen. Normal avspillingshastighet først; saktere avspilling og automatisk sammenligning i løkke vurderes senere etter lyttetest.

### Hva appen faktisk kan kontrollere

| Oppgave | Tilbakemelding | Hva den ikke beviser |
| --- | --- | --- |
| Velge hørt lyd/ord blant entydige alternativer | Riktig/ikke helt + forklaring | Elevens egen uttale |
| Velge skriveregel eller trykkstavelse | Kontroll mot faglig fasit | Samlet leseferdighet eller muntlig kompetanse |
| Lese høyt, med/uten opptak | Modell og avgrenset egenrefleksjon | At eleven sa noe, eller at uttalen var riktig |
| Avspille et opptak eller bla videre | Kun aktivitet i økten | Gjennomført øving eller mestring |

Distraktorer må gjennomgås per oppgave. Ikke bruk b/v som hørbar kontrast, eller krev s kontra c/z som forskjellig i et opptak med seseo. Regionale varianter er ikke feil. Lytteoppgaver skal ikke røpe svar gjennom filnavn, tilgjengelighetsetiketter eller forhåndsmarkering; tekststøtte er tilgjengelig som eksplisitt støttevalg og markeres som støttet forsøk.

### Dekningshull og kildekorreksjoner

Alle 93 opptak skal ha en pedagogisk plass. Tekster skal likevel ikke kopieres ukritisk. Spesifikke funn i dekket:

| Kilde | Funn og behandling |
| --- | --- |
| 9, au/ao | Ikke lær en generell regel om at ao blir au. Bevar lydfilene, kontroller hva som faktisk uttales i cacao, og skill kildeopptaket fra normal forklaring av vokalrekkefølgen. RAE behandler to åpne vokaler som ortografisk hiatus; faktiske uttaler kan variere. [Kilde](https://www.rae.es/ortograf%C3%ADa-b%C3%A1sica/uso-de-la-tilde/las-reglas-de-acentuaci%C3%B3n-gr%C3%A1fica/la-acentuaci%C3%B3n-gr%C3%A1fica-de-las-palabras-con-secuencias-voc%C3%A1licas) |
| 15, b/v | Erstatt regelen «b i starten, v i midten» med kort, korrekt forklaring: samme lydkategori; realiseringen avhenger av lydomgivelsene. Ikke norsk labiodental v. [RAE](https://www.rae.es/dpd/v) |
| 19, ü | Originalnotatet beskriver ü som tegn for hard g. Rett til at ü angir at u skal uttales i güe/güi. Det finnes ikke et eget pingüino-opptak. [RAE](https://www.rae.es/dpd/di%C3%A9resis) |
| 27–28, r/rr | «r ved starten av en stavelse» er for vidt. Forklar rr mellom vokaler, r i starten av ord og relevante konsonantomgivelser; enkel r mellom vokaler. Skill dette fra kildeopptakets variasjon i andre posisjoner. [RAE](https://www.rae.es/dpd/r) |
| 29 og 31, region | Erstatt «alle steder utenom Spania» med korrekt informasjon om seseo også i deler av Spania. Begge modellene skal anerkjennes. Ikke utled talerens nasjonalitet fra én lyd. [RAE](https://www.rae.es/buen-uso-espa%C3%B1ol/el-seseo-y-el-ceceo) |
| 22, yema/llave | Engelsk ordfelt dekker bare «key». Norsk ordstøtte må dekke begge ordene: eggeplomme og nøkkel. |
| 26 og 28 | Oversett spansk direkte: papel er papir i denne sammenhengen, ikke engelsk «role»; cara må vurderes i setningen, ikke blindt kopieres fra «dear». |
| 4, sol | «El sol puso tos» / «The sun coughed» trenger særskilt manus-/betydningskontroll. Dersom lyd og tekst avviker, dokumenter faktisk opptak og korrekt transkripsjon. Ikke lær en tvilsom vending som dagligspråk. |

Resten av setningene må også gjennomgås. Flere er kunstige lydøvelser, noen har fortidsformer eller ord utenfor nybegynnerens ordforråd. Merk dem ved behov som «lydøvesetning», gi kort norsk støtte og unngå å gjøre innholdet til nytt grammatikkkrav. Modelltekst skal alltid samsvare med opptaket; ikke omskriv det som vises under uendret lyd til en annen spansk setning.

Dekket mangler en egen, systematisk gjennomgang av blant annet stum h, ch, trykkregler/aksenter og güe/güi. H og trykk kan introduseres med eksisterende eksempler som hay/huevo, mamá og bebé etter kontroll. ch og ü krever nye eierleverte opptak for å få tilsvarende lydøving; de skal ikke få falske avspillingsknapper eller TTS. Produktet kan lanseres som «grunnkurs med 31 lydtemaer» med ærlig beskrivelse av dekningen. En utvidelse mot et mer komplett lesekurs får en konkret manus-/opptaksliste etter kildegjennomgangen. W/x og lånord kan ligge senere.

Om et enkelt kildeopptak ikke kan presenteres faglig forsvarlig selv med riktig kontekst, dokumenteres avviket og forelegges eier med forslag. Målet om alle 93 beholdes; en slik fil skal verken snikes ut av omfanget eller brukes som uriktig norm. Endelig plassering av alle filer inngår i faglig godkjenning før elevbruk.

## Flater og elevflyt

- **Start:** Ett kort «Lær å lese spansk høyt» og neste anbefalte økt.
- **Navigasjon:** Egen «Uttale» i eksisterende «Mer»-meny på smale skjermer, med tydelig direkte inngang fra Start. Ikke legg en ny knapp i den allerede trange primærraden. Samordnes med planen `2026-10-05_enklere-gloser-mobilnavigasjon-og-fremgang.md`.
- **Uttaleoversikt:** «Fortsett», «Velg tema» og «Finn en lyd». Ikke to konkurrerende kurs med kopierte data.
- **Lydoppslag:** Søk med vanlige skrivemåter, eksempelord og norsk temanavn; tre navngitte spillere for lyd, ord og setning. Søk ligger bare i minnet.
- **Lærervisning:** Samme lydkort i større skrift, forklaring som læreren kan vise/skjule og rolig manuell avspilling. Ingen klasseoversikt, konto eller registrering. Kildekreditering beholdes.
- **Øvelse:** Én hovedhandling om gangen, eksplisitt spill/stopp, aldri to lydkilder samtidig. Avbrudd rydder lyd og opptak før navigasjon/oppdatering.
- **Tilgjengelighet:** Tastatur, tydelig fokus, lesbar størrelse ved 390 px og 200 % zoom, minst 44 px betjeningsflater, `lang="es"` for spansk, status i `aria-live`, markering med tekst/fet skrift i tillegg til farge. Ingen tidsbegrensning for elevsvar.

Øving uten mikrofon er alltid tilgjengelig: lytt, velg og les høyt for deg selv eller sammen med en medelev. Det skal ikke koste poeng eller hindre videre øving å avslå opptak. Elever som trenger tekststøtte kan bruke den uten skam eller feilmerking; det måles da ikke som uavhengig lytting. Elever som ikke kan/vil snakke kan øve på koblingen skrift–lyd uten at appen hevder å ha vurdert produksjon.

## Valgfritt «Ta opp og sammenlign»

Dette er en ny, avgrenset behandling av stemmelyd selv om den er lokal. Planen under er data-/personvernmodellen for funksjonen, ikke en påstand om at en nettlesertillatelse alene erstatter skolens personvernvurdering.

### Datamodell og levetid

| Data | Formål og tilgang | Oppbevaring/sletting |
| --- | --- | --- |
| Refold-MP3 | Felles modellinnhold, ingen elevdata | Appens lokale filpakke eller frivillig offline-cache |
| Elevens lyd | Eleven lytter til ett forsøk på gjeldende oppgave | Kun JS-referanser til en midlertidig Blob; maks 15 sekunder, i tillegg maks 1 MB. Aldri appstyrt varig lagring eller overføring |
| Lokal fremgang | Finne tilbake til øvde temaer | Minimal, versjonert lokal metadata; se neste del |
| Valg, egenrefleksjon, søk og råsvar | Styre den aktuelle økten | Kun i minnet; ingen fritekst, ingen logger eller opplasting |

Bruk `getUserMedia({audio: true, video: false})` og `MediaRecorder`, med funksjons-/formatkontroll, i HTTPS/localhost. Den tekniske muligheten er dokumentert i [MDNs mikrofon-API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) og [formatkontroll](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static). Formatstøtte garanterer ikke at opptaket lykkes; valider også at en ikke-tom Blob kan avspilles.

UI-tekst før første opptak: «Valgfritt: Ta opp stemmen din og sammenlign med modellen. Appen sender ikke opptaket og legger det ikke i fremgangen din. Opptaket fjernes når du tar et nytt eller forlater oppgaven. Du kan øve uten mikrofon.» Unngå det sterkere løftet «aldri på disk»: nettleser/operativsystem kan håndtere midlertidig minne selv.

Ingen `localStorage`, IndexedDB, Cache API, eksport, nedlastingsknapp, `fetch`, beacon, WebSocket eller skolehendelse får elevlyd, lydavledede verdier eller transkripsjon. Ingen talegjenkjenning, støy-/stemmeprofil, kamera, AI-score eller backend. Ikke samle mikrofonens enhets-ID/etikett. Mikrofontillatelse som nettleseren selv husker er separat fra appens lagring.

### Tilstand og opprydding

`klar → venter på tillatelse → tar opp → klar til avspilling → fjernet/nytt forsøk`. Hvert oppgavesteg har et token som ugyldiggjøres ved avslutning.

- Tillatelse spørres bare etter elevens trykk på «Ta opp». Først stoppes modellavspilling. Synlig «Tar opp» og «Stopp» så lenge mikrofonen er aktiv; aldri automatisk neste opptak.
- Spill «Modell» og «Mitt opptak» med to tydelige knapper; avspillinger stopper hverandre. Ikke automatisk modelllyd mens mikrofonen er på. Ett fokusspørsmål etter lytting, ingen prosentlikhet eller bølgeform som antyder fasit.
- Stopp etter 15 sekunder eller størrelsesgrensen, ved feil og ved eksplisitt stopp. Ved alle disse normale stoppene skal også samtlige mikrofonspor stoppes straks; `MediaRecorder.stop()` alene er ikke tilstrekkelig. Tilstanden «klar til avspilling» krever at ingen track er aktiv. Behandle den siste datahendelsen uten å holde mikrofonen åpen. Bruk løpende datahendelser til størrelseskontroll, med sluttkontroll av samlet Blob. Timeren er en grense for opptak, ikke en prøvetidsfrist.
- Slipp mikrofonen med `stream.getTracks().forEach(track => track.stop())`, også på konstruktør-/avspillingsfeil. Koble fra avspiller, tilbakekall objekt-URL og tøm chunk-/Blob-referanser ved nytt opptak, «Slett», neste oppgave, navigasjon, reset, brukerbytte/utlogging, `pagehide` og når dokumentet blir skjult. Dette reduserer risiko på delte enheter og ved skjermlås; ikke lov sikker sletting av OS-minne.
- Avbryt ventetilstand når eleven velger «Øv uten mikrofon». `getUserMedia()` kan forbli uavklart mens dialogen er åpen: ignorer et sent svar fra en gammel oppgave og stopp en sent mottatt stream umiddelbart. Ingen start etter at eleven har forlatt oppgaven. Samme regel for sene `dataavailable`/`stop`-hendelser.
- Håndter avslått/ubesvart tillatelse, manglende mikrofon, blokkert skoleutstyr, opptatt enhet, manglende API/codec, avbrutt stream og for lite minne. Norsk melding og fortsatt øving uten mikrofon. Ikke gjenta tillatelsesdialog automatisk.

Appen kjører i egen fane; ingen innebygd mikrofon i iframe. Faktiske skoleenheter og Safari/iPad må prøves. At Playwright kan levere en syntetisk mikrofon beviser ikke tillatelser, maskinvare eller opptakskvalitet på disse enhetene. Før skolebruk innarbeides den lokale funksjonen i relevant personverninformasjon og skoleeiers vurdering med likeverdig alternativ uten mikrofon; ingen opptaksdata deles med lærer.

## Lokal fremgang, uten uttalekarakter

Første versjon trenger bare å huske hvilke lydkort eleven har øvd og hvor de kan fortsette. Bruk ny nøkkel `spansk123_pronunciation_v1` med `schemaVersion: 1`, gjeldende katalogversjon og en begrenset liste `practiced: [{itemId, contentVersion, practicedOn}]`. Maks én nyeste lokal kalenderdato per lydkort/innholdsversjon. Ingen navn, opptak, eksakte klokkeslett, råsvar, mikrofonbruk eller egenvurdering i denne nøkkelen. Ingen nye serverhendelser.

Et lydkort merkes «øvd» når eleven har gjort en oppgave i kortet (evt. et merket støtteforsøk) og aktivt fullført lese-/sammenligningssteget. Det er selvrapportert øving; ikke bevis på at eleven faktisk snakket. Avspilling, «hopp over», feil på lyd, tom økt eller lærervisning gir ikke fremgang. Mikrofonbruk er aldri et kriterium. Øktens kontrolloppgaver kan oppsummeres i minnet, men «3 av 4» skal hete «lytte-/regeloppgaver», ikke «75 % riktig uttale».

Ikke send dette til eksisterende mestringsprosent, karakterer, streaks, Feide eller læreroversikt i første versjon. Lokal visning kan si «12 av 31 lydtemaer øvd» med forklaring. Dette unngår en stor ombygging av nåværende fremgangskatalog.

Utvid `spansk123_export_v1` med et valgfritt `pronunciation`-felt; eldre filer uten feltet skal fortsatt importeres uendret og skal ikke slette eksisterende uttaleøving. Gyldige kjente oppføringer flettes uten duplikater med nyeste dato. Nye filer lest av gammel app kan miste dette tillegget ved reeksport; dokumenter begrensningen og behold originalbackup. Valider hele uttalefeltet før det skrives. Ugyldig felt skal varsles og ikke overskrive gyldig lokal uttaledata; øvrige gamle felt behandles etter dagens kontrakt, og resultatmeldingen skal tydelig si at uttaledelen ikke ble importert.

Konkrete grenser for den nye uttaledelen: maks 64 KiB serialisert UTF-8, maks 155 oppføringer og maks fem ulike innholdsversjoner per lydkort. Tillat bare de tre rotfeltene `schemaVersion`, `catalogVersion`, `practiced`, og bare `itemId`, `contentVersion`, `practicedOn` i hver oppføring. Skjemaversjon er 1; katalog-/innholdsversjon er positive heltall opptil 1 000 000; kort-ID er en av `refold-es-01`–`31`; dato er en reell kalenderdato i `YYYY-MM-DD` innen 2000–2100. Ingen ekstra felt, lyd/base64, transkripsjoner eller fritekst godtas. Dagens generelle import har ingen dokumentert størrelsesgrense; disse nye grensene implementeres eksplisitt for uttaledelen, uten å påstå at resten av importen dermed er hardnet.

Ukjent skjemaversjon avvises med beskjed om å beholde originalfilen og bruke en kompatibel app; råfeltet lagres aldri som appbackup. Ukjent katalogversjon med kjent og strengt validert metadataskjema kan derimot bevares/eksporteres som metadata uten å tolkes som dagens øvde innhold. Ved grenseoverskridelse i innkommende eller sammenflettet data, ugyldige/forbudte felt eller lagringskvote beholdes eksisterende uttaledata uendret; ingen delvis skriving eller automatisk klipping. Ved en lokal kursoppdatering som ville overskride versjonsgrensen fungerer øving i minnet, og appen forklarer at ny fremgang ikke kan lagres før eleven har eksportert og selv valgt å rydde uttaledata. Test eldre app/format og ny→ny rundtur separat. Reset sletter uttaledata og stopper pågående opptak.

Denne lokale modellen skal beskrives i README, inklusive eksport som selvrapportert øving og at eleven/andre med tilgang til den delte nettleserprofilen kan lese lokal metadata. Gamle kursoppføringer bevares ved ny innholdsversjon og vises som eldre øving, uten å telles som øvd i den nye versjonen. Originalimportfilen forblir elevens gjenopprettingskilde ved avvist import; appen lager ikke en egen råkopi med ukjent innhold. Egen «Slett uttaleøving»-handling krever et bevisst valg og gir eksportmulighet før sletting; øvrig lokal fremgang berøres ikke.

## Teknisk innpassing

Nåværende `index.html` har lydflyter ved `listeningAudioUrl`, `downloadListeningStoryAudio`, `getDictationAudioUrls` og `downloadDictationAudio`. `sw.js` bruker `spansk123-audio-v1` med støtte for byteområder, men rutingen gjenkjenner nå bare `audio/diktat/` og `audio/lyttehistorier/`. Metadata for lytting ligger i HTML; dette mønsteret passer også uttale uten runtime-database eller Anki-bibliotek.

### Filer som opprettes eller endres under implementering

Alle stier er relativt til `/Users/olehenrikvik/spansk-ungdomsskole`.

| Fil | Planlagt ansvar |
| --- | --- |
| `data/pronunciation-refold.json` (ny) | Godkjent kanonisk innhold: 31 stabile `refold-es-01`–`31`-ID-er, norsk forklaring, faktisk spansk manus, målmarkeringer, regionmerknad, nivå for støtte, tre lydreferanser og konkrete oppgaver |
| `data/pronunciation-audio-manifest.json` (ny) | Nøyaktig 93 filer, relativ sti, rolle, kildeindeks, størrelse, SHA-256, varighet og lydversjon |
| `audio/uttale/refold-v1/` (ny) | Alle 93 MP3-filer byteidentiske med kartlagt eksport, med eksisterende entydige originalfilnavn |
| `scripts/sync-pronunciation.mjs` (ny) | Valider katalog/manifest og generer kun avgrenset inline-katalog i HTML; `--check` krever samsvar. Ikke importer fra vilkårlig Anki-HTML ved runtime |
| `index.html` | Ny avgrenset Uttale-flate, rene utvalgs-/valideringsfunksjoner, avspillingskontroll og senere opptakskontroll; navigasjon, øktavbrudd, lokal fremgang, import/eksport/reset |
| `src/styles/tailwind.css`, generert `dist/tailwind.css` | Gjenbruk eksisterende komponenter; bare nødvendige tillegg |
| `sw.js` | Utvid kun lydrutingen til den nye eierstyrte prefiksen; bevar range-håndtering og unntak for skole/API/auth |
| `package.json` | Nye `sync:pronunciation`/`check:pronunciation`-kommandoer, integrert før offline-bygg og i `test:all` |
| `README.md`, `AGENTS.md` | Bruk, rettigheter, tydelig skille mellom eierleverte modellopptak og valgfri midlertidig elevlyd; fortsatt totalforbud mot TTS |
| `docs/uttale/refold-rettigheter.md`, `docs/uttale/faglig-gjennomgang.md`, `docs/uttale/laererveiledning.md` (nye) | Kilde/tillatelse, sporbare korreksjoner og lydgodkjenning, kort undervisningsopplegg |
| `tests/pronunciation-catalog.test.mjs`, `tests/pronunciation-progress.test.mjs` (nye) | Katalog-/lydkontrakt, versjonering, rene funksjoner og importtilfeller |
| `tests/pronunciation-flow.spec.js`, `tests/pronunciation-offline.spec.js`, `tests/pronunciation-recording.spec.js` (nye) | Aktiv øving, mobil/tastatur, ekte modelllyd/offline, opptakslivsløp og personvern |
| `tests/import-export-compat.spec.js`, `tests/backup-privacy.spec.js`, `tests/storage-recovery.spec.js`, `tests/tts.spec.js` | Relevante nye tilfeller i eksisterende kontrakter |

Ingen endring i standardordlisten. Nye uttaleeksempler skal ikke automatisk tilføyes elevenes vanlige gloser. Ikke kjør Anki-kortmalene: de inneholder eksterne lenker, fonter og andre funksjoner som ikke tilhører denne appen. Hent bare eksplisitte innholdsfelt, avkod HTML-entiteter og render egne tekstelementer sikkert. Ingen ukontrollert `innerHTML` fra kildefelter eller import; markerte bokstavspenn defineres som validerte indekser/strukturer.

`scripts/build-vercel-public.mjs` kopierer allerede hele `audio/`, så den nye mappen følger med. Innholdet bygges inn i HTML; JSON trenger derfor ikke egen offentlig fetch. `scripts/build-offline.mjs` hasher HTML/CSS/manifest/SW; inline-katalogen inkluderer manifesthash/innholdsversjon slik at lydendringer gir ny appversjon. Endrede lydbyte får en ny versjonert sti; ikke overskriv eksisterende cacheidentitet. Bygg- og distribusjonstest skal kontrollere alle 93 filer i lokal `public/` uten å publisere.

`server/app.js` setter `microphone=()` og CSP `media-src 'self'` for skoleappen. Denne versjonen bygges i den eksisterende lokale/offentlige øvingsappen, ikke inne i `/school`. Skolens forbud skal ikke fjernes globalt. Verifiser faktiske toppdokument-headere for offentlig statisk app på aktuell driftsvei før aktivering. Hvis mikrofon/blob avvises der, avgrenses nødvendige headere til offentlig øvingsdokument, med egen regresjon som fortsatt avviser mikrofon på `/school`; ellers virker øvingen uten opptak. Ingen endringer av skoledata, Feide-innholdskatalog eller database.

### Offline

Knapp «Last ned hele uttaleskolen · ca. 2,4 MB». Ingen automatisk nedlasting av alle modellfiler ved appstart; avspilling kan hente aktuell fil online. Samme cache som annen eierlevert lyd, tydelig fullføringsstatus og kontroll av faktisk nærvær av alle 93 manifest-URL-er. Bare komplette HTTP 200-responser med riktig innhold/type/hash legges inn; aldri lagre 206 som hel fil. Nedlastingsløkken kan avbrytes og fortsette med manglende filer.

UI må håndtere nettbrudd, feil dekoding, cachekvote, delvis gammel pakke og slettet cache. En øvelse som trenger manglende lyd får «Lydopptaket er ikke tilgjengelig. Koble til nettet og prøv igjen, eller velg en annen øvelse.» Ingen TTS eller falsk fullføring. Tekst/oppslag kan fortsatt leses. En grønn nedlastingsstatus er ikke et løfte om at nettleseren aldri rydder plass; sjekk den før timen. Elev-Blob har aldri en sti under modelllydprefiksen og skal ikke nå service worker-cachen.

## Trinnvis gjennomføring

Arbeid på en `codex/`-gren når implementering starter. Arbeidstreet hadde mange uavhengige endringer ved planstart; undersøk dem og samordne før gren/worktree-valg. Ingen bred opprydding eller overskriving av andres arbeid. Ingen nye runtime-avhengigheter er nødvendig.

1. **Innhold og kildeimport.** Lag rettighetsnotat og godkjent katalog, pakk ut bare modelllyd, verifiser 31/93-mapping og byteidentitet. Oversett direkte fra spansk, rett identifiserte forklaringer og lytt gjennom lyd mot manus. Faglig kontroll kan gjøres parallelt med teknikk, men elevbruk krever den. Skriv katalogtester før generatoren. Leveranse: reproduserbar, lokalt kontrollert kildepakke uten elevflyt.
2. **Én komplett økt uten mikrofon.** Bruk fem vokaler som første utsnitt; bygg oppdag/lytt/les/sammenlign/setning, navigasjon og feiltilstand, med kontroll av aktive forsøk. Test 390/1280 px. Deretter fylles resten av samme mal med alle 31 temaer og 93 filer, samt kontrollerte distraktorer. Ingen separat motor for hvert tema.
3. **Offline, oppslag og lærervisning.** Koble manifestet til cache/range-ruting, full nedlasting, stopp/fortsett og revisjonskontroll. Alle tre lydroller nås fra både øving og oppslag. Lærervisningen gjenbruker innhold uten elevfremgang. Verifiser lokal publiseringspakke.
4. **Minimert lokal fremgang og gjenoppretting.** Legg til «øvd» med den definerte kontrakten. Test ny/eldre/ugyldig/fremtidig import, rundtur, reset og ingen elevlyd i noen varig flate. Ingen uttalescore.
5. **Valgfritt opptak.** Gjennomfør først en liten lokal nettleserprøve med syntetisk lyd og voksen teststemme, ikke elevopptak. Implementer tilstand/opprydding og tilgangstekst. Test avslag og sene hendelser før ordinær flyt. Gjør samme oppgave fullt gjennomførbar uten mikrofon. Rekkefølgen justeres hvis eier vil vente med denne funksjonen.
6. **Faglig og praktisk prøve.** Eier/spansklærer kontrollerer alle modellkoblinger, forklaringer, regionale merknader og oppgaver. Prøv en kort klasseøkt og noen elevøkter med skolens rutiner og uten innsamling av navn/lyd. Observer om eleven finner riktig modell, forstår forskjellen på bokstav og lyd, forsøker før sammenligning og kan bruke regelen på et nytt ord med lærer. Juster tidsbruk/støtte. Kall ikke dette dokumentert læringseffekt; en slik evaluering ville kreve et eget opplegg.

All teknisk implementering er lokal til dette er separat bestilt publisert. Feide-lekser, lærerrapporter, kommersielt samarbeid og nye modellopptak er egne leveranser. Den første komplette uttaleleveransen omfatter alle 93 kildeopptak, ikke bare vokaldemoen.

## Akseptansekriterier

1. Katalogen har 31 stabile lydtemaer og alle 93 kildefiler med tre korrekte roller hver, sporbar kilde og synlig kreditering. Ingen kildefil er utelatt eller erstattet med syntetisk lyd.
2. Eleven kan gjøre en kort aktiv økt uten mikrofon, bruke oppslag og høre lyd/ord/setning. Første demonstrasjon og senere gjenhenting er tydelig atskilt; fasit vises etter meningsfullt forsøk eller eksplisitt støttevalg.
3. Ingen poengsetting hevder å vurdere elevens uttale. Bare definerte forsøk gir «øvd», og lærervisning/avspilling/alene neste-knapp gir ingen fremgang.
4. Hele pakken virker etter nedlasting, omlasting og faktisk nettfrakobling; en manglende fil håndteres forståelig uten falsk grønn status. Vanlig diktat/lytting og skoleunntak fortsetter å virke.
5. Dersom opptak inngår: eksplisitt trykk, tydelig tilstand, én kort Blob, ingen overføring/varig lagring, og dokumentert opprydding for alle exit-/feilstier. Avslag blokkerer ingen kjerneoppgave.
6. Nye uttaledata kan eksporteres/importeres uten tap i ny versjon. Alle støttede gamle formater fungerer. Ukjent skjema avvises med beskjed om å beholde originalfilen; bare kjent, strengt validert metadata bevares ved ukjent katalogversjon. Grenser/kvotefeil overskriver aldri eksisterende uttaledata. Reset sletter uttaledata. Ingen lyd, transkripsjoner eller råsvar i eksport/logg/skole-API.
7. Norsk innhold, IPA som valgfri støtte og regional variasjon er faglig kontrollert; alle oppgavers korrekte svar er entydige for det konkrete opptaket. Kildens påviste feil er ikke videreført som regler.
8. Tastatur, 390/1280 px, 200 % zoom, faktiske lydutganger og målrettede feilscenarier er prøvd; mikrofon testes særskilt på aktuelle skoleenheter og Safari/iPad før den tilbys der.

## Verifikasjonsplan

Kommandoene under ble satt opp i planfasen. Lokal implementering er nå utført; dokumentert verifikasjon og gjenværende menneskelig prøve står i gjennomføringsnotatet nedenfor.

Etter innhold/generator:

```sh
npm run sync:pronunciation
npm run check:pronunciation
node --test tests/pronunciation-catalog.test.mjs
```

Bestått betyr blant annet 31 temaer, 93 unike lydfiler, byteidentitet, ingen manglende/orphan-referanser, rett kobling mellom tekst/rolle og kildeindeks, kun lokale stier, validerte målmarkeringer og ingen uakseptert oppgave uten fasit. Mutationstilfeller: slettet MP3, feilrolle, feilhash, ugyldig sti, endret katalog uten regenerering. Dette erstatter ikke menneskelig lytting.

Etter appendringer, før nettlesertester:

```sh
npm run build:app
node --test tests/pronunciation-progress.test.mjs
npx playwright test tests/pronunciation-flow.spec.js tests/pronunciation-offline.spec.js --browser chromium --workers=1
npx playwright test tests/import-export-compat.spec.js tests/backup-privacy.spec.js tests/storage-recovery.spec.js --browser chromium --workers=1
```

Opptak har egne tester:

```sh
npx playwright test tests/pronunciation-recording.spec.js --browser chromium --workers=1
```

Bruk både reell MediaRecorder mot en syntetisk mikrofon og kontrollerte API-feil for avslag, manglende støtte, uavklart/sent tillatelsessvar, datahendelse etter oppgavebytte, stream-avbrudd, dobbeltklikk, 15 sekunder/1 MB, skjult fane, sletting og nullstilling. Verifiser stoppede tracks også ved manuell stopp og begge grensene, før «klar til avspilling». Inspiser åpne tracks, objekt-URL-er, localStorage/IndexedDB/cache, eksport og nettverkskall. Test må feile hvis en elev-Blob eller avledet innhold havner i nettverk, logger eller persistens. Fremgangstestene skal også prøve forbudte/ekstra importfelt, ukjent skjema, ukjent katalog med kjent skjema, 64 KiB/155 oppføringer/fem versjoner, overfull sammenslåing og lagringskvote uten overskriving. Suppler med fysisk Chrome/Edge på faktisk skolemaskin og Safari/iPad; ikke installer nettlesere eller anta at de er testet uten resultat.

Regresjon og levering:

```sh
npx playwright test tests/listening-release.spec.js tests/dictation.spec.js tests/report-offline-update.spec.js tests/tts.spec.js --browser chromium --workers=1
node scripts/build-vercel-public.mjs
node --test tests/server/vercel-runtime.test.mjs
npm run test:all
git diff --check
```

Legg lokal kontroll av alle 93 filer i `public/audio/uttale/refold-v1/` inn i katalog-/distribusjonstestene. Verifiser faktiske response-headere separat ved senere autorisert utrulling; et statisk lokalt testmiljø beviser ikke produksjonsheadere. Kontroller at eksisterende skolebegrensninger fortsatt gjelder. Ingen push/deploy følger av grønn lokal verifikasjon.

For denne planleveransen: kontroller vedleggets antall/hashes/mapping mot originalarkivet, lenker til lokale repo-filer, `bd --no-daemon list --json`, `git diff --check`, og kritisk plangjennomgang. Dokumenter utført kontroll og gjenværende menneskelig lydvurdering i Beads.

## Gjennomført planverifikasjon 7. oktober

ZIP-/SQLite-kartlegging bekreftet 31 innholdsgrupper med tre like innholdsvarianter per gruppe og 93 ulike lydreferanser uten mangler. `ffprobe` målte varighet/format og `ffmpeg -v error -i FILE -f null -` dekodet alle 93 uten feil eller varsler. En separat kontroll av det lagrede vedlegget mot originalarkivet bekreftet alle SHA-256-verdier, størrelser og lydroller. Lokale Markdown-lenker ble kontrollert, Beads-listen lot seg lese som JSON, og `git diff --check` var grønn. Nye dokumenter ble i tillegg kontrollert direkte for etterfølgende blanktegn, siden uregistrerte filer ikke inngår i vanlig Git-diff.

Uavhengig plangjennomgang fulgte `adversarial-plan-review`. Runde 1 fant ett vesentlig funn (råbackup av ukjent skjema kunne lagre uønskede data) og ett mindre funn (vanlig stopp måtte uttrykkelig frigi mikrofonen). Begge ble rettet med konkret kontrakt og tester. Runde 2 markerte begge FIXED, fant ingen nye vesentlige funn og ga `VERDICT: APPROVED`. Dette er godkjenning av planens gjennomførbarhet, ikke menneskelig lyd-/innholdsgodkjenning eller dokumentert læringseffekt. Faglig gjennomlytting og fysisk enhetsprøve følger i implementeringsarbeidet.


## Lokal gjennomføring 7. oktober

Eier bekreftet valgfritt egenopptak i v1 og økter på omtrent 5–8 minutter. Implementeringen ligger på `codex/uttaleskole-refold`, med tidligere urelaterte lokale endringer bevart. Ingen nye avhengigheter, push eller publisering.

Alle 93 originale MP3-filer er importert uendret. Norsk katalog, ti temainnganger, korte økter, aktiv lesing før sammenligning, frivillig tekststøtte, Refold-kreditering, søkbart oppslag, delbare temalenker, full offline-nedlasting og metadataeksport/import er implementert. Det nye grensesnittet nås fra Start og Uttale. Temaer kan brukes som lekser via en vanlig lenke; ingen Feide-oppgave eller lærerrapport er innført.

Ny uttalelogikk ligger i fire avgrensede `src/pronunciation-*.js`-filer og kompileres inn i den eksisterende HTML-appens skript av `scripts/sync-pronunciation.mjs`. Dette gjør den nye logikken lesbar og testbar uten å flytte eller omskrive gammel appkode. Bygget avviser manglende kildemoduler. Katalog, lydmanifest og bokstavmarkeringer valideres før innbygging.

Opptak bruker bare midlertidige lyddata og én objekt-URL. Maksimal lengde er 15 sekunder og maksimal datamengde 1 MB. Mikrofonspor stoppes allerede ved vanlig stopp. Nytt opptak, videreknapp, avslutning, skjult side, innstillinger, import og reset rydder opp. Sene tillatelses-/data-/avspillingshendelser kan ikke gjenopprette eller avbryte et nytt opptak. Elevlyd sendes ikke, skrives ikke til nettleserlagring/cache og inngår ikke i eksport. Det finnes ingen stemmevurdering eller nedlastingsknapp for elevlyd.

Gjenopprettingen har én presisering fra planen: ugyldige eksisterende uttaledata skal ikke blokkere sikkerhetskopi av andre fagområder. En slik eksport utelater uttaledelen, varsler i en tydelig dialog, beholder originaldata lokalt og markerer ikke eksporten som en fullstendig backup. Ukjente felt eksporteres aldri som rådata. Defekte modellfiler fjernes fra lydcachen før ny nedlasting, slik at service workeren ikke gjenbruker samme defekte fil.

Rettigheter er dokumentert i `docs/uttale/refold-rettigheter.md`, bruken i `docs/uttale/laererveiledning.md`, og den utestående faglige/enhetsmessige prøven i `docs/uttale/faglig-gjennomgang.md`. Katalogens `review.status` er fortsatt `pending-owner-listening`; automatiske tester er ikke en attest på uttalekvalitet.

Sluttkontroll: `npm run build:app` og `npm run test:all` bestod med Node 22.23.3 på bygg `320c438845e6c18e`: 78 katalog-/enhetstester, 52 servertester og 541 Chromium-tester. Alle 93 lydhashene er også kontrollert i den lokale public-pakken. Mobil-/desktopvisning og tastatur er prøvd. Se [verifikasjonsnotatet](../../../docs/uttale/verifikasjon-2026-10-07.md) for evidens og tydelige avgrensninger. Menneskelig gjennomlytting og fysisk enhetsprøve er fortsatt åpne i Beads.
