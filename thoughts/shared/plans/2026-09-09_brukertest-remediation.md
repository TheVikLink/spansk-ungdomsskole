# Gjennomføringsforslag: funn fra brukertest 8. september 2026

## Mål

Rett de bekreftede feilene og gjennomfør avgrensede forbedringer for alle F01–F19 i brukertestrapporten, med etterprøvbare tester, bevart lokal fremgang og en konkret leveranse til faglig gjennomgang og moderert pilot.

Dette er et gjennomføringsforslag, ikke en parallell oppgavestatusliste. Beads er kilden for status, ansvar og testbevis. Et aktivt Codex-mål opprettes når brukeren ber om gjennomføring; denne planen alene starter ikke et slikt mål.

## Grunnlag

- Hele `docs/brukertest-2026-09-08.md` er lest, inkludert alle 19 funn, 16 scenarioer og testplanen.
- `AGENTS.md`, `package.json`, `PILOT.md`, `sw.js`, relevante tester og utvalgte deler av appen er undersøkt.
- Arbeidskopiens `index.html` har fortsatt rapportens SHA-256: `5488be14fd5d2ac4168619a11b867595339e324f1e08efa0d076ccfbb022d104`.
- HEAD er `b6c38c8`, gren `main`. Arbeidskopien inneholder omfattende eksisterende endringer og nye filer. De inngår ikke automatisk i nye rettingscommits.
- De sju rapportspesifikke Beads-sakene er åpne. `tq0` og `z6i` er allerede under arbeid. Kort-ID-ene nedenfor har prefikset `spansk-ungdomsskole-`.
- De 89 grønne testene er rapportens tidligere resultat. Ingen appregresjonstester er kjørt på nytt som del av denne planleggingen.

## Avgrensning

Arbeidet dekker dagens lokale app, også lekser, lyd/diktat og spillstøtte. Det omfatter ikke ny innlogging, backend, automatisk innlevering, analyseinnsamling, nye spill eller en generell arkitekturomskriving. Eksisterende ideer om større adaptiv utvidelse skal ikke bli skjult tilleggsscope.

Teknisk gjennomføring, faglig godkjenning og observasjoner med mennesker dokumenteres separat. Agentens kildestøttede gjennomgang skal ikke registreres som en spansklærers godkjenning. Faktisk elevlæring, skolemaskinenes lyd og lærerens støttearbeid må vurderes av mennesker. Ingen slike kriterier lukkes med simulerte elever.

Push, PR og publisering følger mandatet brukeren velger. Oppdateringsflyten kan testes med lokal HTTP-server før eventuell publisering. Kontroll av den publiserte versjonen gjenstår til en publisering er autorisert og gjennomført.

## Avklaringer før appendringer

Tre spørsmål er sendt samlet: om andre arbeider i samme filer, ønsket levering (lokal gren/commits eller push/PR), og håndtering av faglig tvil. Svarene skal føres i Beads når gjennomføringen starter. Ved godkjent midlertidig uttak av tvilsomt innhold beholdes ID-er og lagret historikk; uttaket beskrives uttrykkelig og er ikke en påstand om at innholdet er faglig ferdig.

En lokal kopi/snapshot av relevante eksisterende endringer sikres før første kodeendring. Ingen `reset`, opprydding i andres filer eller bred staging av hele arbeidskopien. Arbeidsgren og utgangspunkt velges slik at rapportens testede endringer faktisk følger med. Hvis andre redigerer samme filer, brukes avtalt filansvar eller en separat checkout med det avtalte utgangspunktet.

## Rekkefølge og Beads-dekning

| Trinn | Funn og saker | Avgrenset gjennomføring og observerbart sluttkrav |
|---|---|---|
| 1. Rettferdige svar | F03/F04, `4jh` | Normaliser språkretning ved quizbyggerens grensesnitt; bevar registrerte alternativer. Vis instruksjon, språk og hullsetning i nivåtesten. Hele kandidatsettet beholder sine godkjente varianter. UI godtar blant annet «å drikke», «mora» og godkjente fullsetninger. Feil betydning og ñ-forveksling avvises fortsatt. |
| 2. Fremkommelig øving | F01/F11, `lx8`; F02, `c5t` | Bevar svar, tilbakemelding og Neste når hint vises. Avgrens globale snarveier; gi innspillsdialogen fokus og normal tekstredigering. Gi mobilmeny, navn og innstillinger tilstrekkelig plass. Alle menyvalg kan klikkes ved 360/390/640/768/1024 px, også med langt navn og større tekst. |
| 3. Gyldig innhold og hjelp | F05/F10 og vurderingsdelen av F16, `2op` | Rett profesora-oppgaven og manglende forklaring; gjennomgå ferdig utfylte setninger og svaralternativer i berørte A0/A1-ruter. Koble korte forklaringer til faktiske feil og relevante nye forsøk. Fjern delstrengbasert ros til meningsløse diktatfragmenter. Faglig tvil dokumenteres etter avtalt regel. |
| 4. Pålitelig aktivitet | F06/F07 og aktivitetsdelene av F15/F16, `xip` | Skill planlagt, besvart, riktig, forsøkt og fullført. Null svar gir nøytral avslutning. Avslutning registreres høyst én gang. Ny pakke arver ikke gammel aktivitet; alle valgte grammatikktemaer kan åpnes. Diktatrepetisjon får riktig aktivitetsdato. Startsiden anerkjenner dokumentert verb-/grammatikkøving. |
| 5. Forståelig lagring og avbrudd | F08/F17/F18, `0h5` | Forklar lokal kode, separat innspilleksport og diagnosens eksportinnhold. Bevar gamle importformater. Velg og dokumenter en liten, konsekvent regel for lokal gjenopptakelse eller avsluttet deløkt. Test før svar, etter svar før Neste og ved resultat. Ingen tap av tidligere fremgang eller dobbeltelling. |
| 6. Tilgjengelig lyd og sikre oppdateringer | F09/F12, `get`; samordnes med `tq0` | Vis faktisk lydtilgjengelighet, feil og ny prøving; ingen taus start av utilgjengelig diktat. Avgrens offline-løftet. Versjoner appskallet og prøv A → B i brukt profil med fremgang, også offline. Dokumenter alle nødvendige leveransefiler. |
| 7. En forståelig undervisningsøkt | F13/F14, avgrenset del av `v0n` eller egen koblet sak | Fungerende første handling, konsekvent bokmål og lærerinngang med ett 20–25-minutters opplegg. Dagens lokale oppsummering virker første dag og fremstilles ikke som innsending. Oppdater `PILOT.md` i tråd med rapportens pilotgrenser. |
| 8. Støtte og neste mål | Resten av F15, avgrensede deler av `6j4`/`egb`; F19 trenger eksplisitt egen dekning | Vis et konkret neste mål ut fra faktisk svargrunnlag. Gi svake og sterke testprofiler relevant forskjell i støtte/utfordring. Spill får avgrenset ordutvalg og valgfri hjelp etter reelt forsøk. Dokumenter hvilken spillrute som er undersøkt. Ingen bred mestringspåstand fra noen få faste spørsmål. |
| 9. Samlet kontroll | Alle F01–F19 | Gjenta rapportens tekniske reproduksjoner og relevante elev-/lærerreiser. Legg bevis og eventuelle avvik i Beads. Hvert funn har enten dokumentert gjennomført retting eller en uttrykkelig gjenværende faglig/menneskelig kontroll; ingen funn forsvinner mellom samleoppgavene. |

F01/F02/F03 kan leveres i små separate endringer før resten er ferdig. Endringer i telling kommer før avbrudds-/lagringsendringene fordi samme svar ellers kan registreres ulikt i flere historikker. Dokumentasjonen for læreropplegget ferdigstilles etter at tall og valgt elevrute er stabile. Alle trinn berører ofte samme `index.html`; planen forutsetter ikke samtidig redigering av denne filen.

## Filer og testflater

- `index.html`: quizbygging, nivåtestvisning, svarvurdering, hint, tastatur/dialog, navigasjon, grammatikkinnhold, resultater, aktivitet, leksepakker, lokal gjenoppretting, diktat, startside og spill.
- `src/styles/tailwind.css` og generert `dist/tailwind.css`: mobilnavigasjon og dialogplassering. Bygg CSS når kilden endres.
- `sw.js`: oppdateringsstrategi og offline-feilhåndtering; endre bare appens egne cacher og bevar lokal fremgang.
- `README.md`, `PILOT.md`, eventuelt `AGENTS.md`: korrekt lagrings-/eksportbeskrivelse, leveransefiler, pilotopplegg og oppdatert testinstruks. `AGENTS.md` påstår fortsatt at testpakke mangler selv om `package.json` og tester finnes.
- `tests/answer-acceptance-fuzz.spec.js`, `tests/adaptive-quiz.spec.js`, `tests/diagnosis-flow.spec.js`: godkjente varianter gjennom faktiske byggere, synlig kontekst og elevhandlinger.
- `tests/student-feedback.spec.js`, `tests/grammar-explanations.spec.js`, `tests/grammar-lessons.spec.js`, `tests/verb-focus.spec.js`, `tests/sentence-puzzle-game.spec.js`: hint, fokus, tastatur og resultat → teori → resultat.
- `tests/assignment-package.spec.js`, `tests/completion-header.spec.js`, `tests/start-page.spec.js`, `tests/dictation.spec.js`: 0/1/alle svar, aktivitet, pakker, datoer, første dag og diktatvurdering.
- `tests/import-export-compat.spec.js`, `tests/storage-recovery.spec.js`, `tests/backup-privacy.spec.js`: eldre/ny eksport, ren profil, avbrudd, dataminimering og personvern.
- `tests/pwa-and-ui-smoke.spec.js`, `tests/frontend-visual-audit.spec.js`, `tests/lingo-links-game.spec.js`, `tests/next-practice-recommendation.spec.js`: reelle klikk, oppdatering, offline, spillhjelp og neste mål.
- `scripts/check-content-accuracy.mjs`, `scripts/check-grammar-lessons.mjs`, `package.json`: innholdskontroller og inkludering av relevante tester som nå ligger utenfor `test:all`.

Nye små regresjonsfiler kan brukes der eksisterende tester ikke har et passende sted. Ikke legg appatferd i testkode eller erstatt reelle UI-handlinger med direkte funksjonskall i reproduksjonene. Direkte funksjonskall er egnet som supplement for full katalogdekning og syntetisk oppsett.

## Verifikasjon under gjennomføringen

For hver bekreftet kodefeil: legg til en fokusert test av den observerbare feiltilstanden, vis at den feiler før rettelsen, gjør den minste sammenhengende rettelsen, og kjør berørte tester. Dokumentasjonsendringer trenger ikke egne implementasjonsspeilende tester.

Før lagrings-/historikkendringene dokumenteres lokal datamodell, bakoverkompatibilitet, sletting og eksport. Nye felt skal ikke samle rå elevtekst eller identifikatorer uten at behov og gjeldende personvernmodell er avklart. Gammel aktivitet med ukjent pakke skal forbli ukjent; ikke gjett tilhørighet. En avgrenset gjennomgang av datatap/dobbeltregistrering skal skje før endringen prøves mot eldre eksport.

Eksempelkommandoer for de første rettelsene:

```sh
npx playwright test tests/answer-acceptance-fuzz.spec.js tests/adaptive-quiz.spec.js tests/diagnosis-flow.spec.js --browser chromium --workers=2 --reporter=line
npx playwright test tests/student-feedback.spec.js tests/grammar-explanations.spec.js tests/grammar-lessons.spec.js tests/verb-focus.spec.js tests/sentence-puzzle-game.spec.js --browser chromium --workers=2 --reporter=line
npx playwright test tests/assignment-package.spec.js tests/completion-header.spec.js tests/start-page.spec.js tests/dictation.spec.js --browser chromium --workers=2 --reporter=line
npx playwright test tests/import-export-compat.spec.js tests/storage-recovery.spec.js tests/backup-privacy.spec.js --browser chromium --workers=2 --reporter=line
```

Start en lokal HTTP-server som egen prosess for service-worker-testene:

```sh
python3 -m http.server 5178 --bind 127.0.0.1
```

Med serveren tilgjengelig kjøres:

```sh
npx playwright test tests/pwa-and-ui-smoke.spec.js --browser chromium --workers=1 --reporter=line
```

Eksisterende offline-test hopper over når serveren mangler. Det skal regnes som manglende verifikasjon, ikke bestått. A → B-testen må i tillegg servere to konkrete appversjoner etter hverandre på samme origin og kontrollere den samme nettleserprofilens fremgang. En fil-URL eller to rene profiler beviser ikke oppdatering.

Samlet teknisk kontroll etter rettelsene, med HTTP-serveren tilgjengelig:

```sh
npm run build:css
npm run extract:items
npm run check:content-accuracy
npm run check:grammar-lessons
npm run test:all
npx playwright test tests/answer-acceptance-fuzz.spec.js tests/student-feedback.spec.js tests/grammar-lessons.spec.js tests/dictation.spec.js tests/lingo-links-game.spec.js tests/next-practice-recommendation.spec.js --browser chromium --workers=2 --reporter=line
bd --no-daemon list --json
git diff --check
```

De eksplisitte tilleggstestene dekker sentrale rapportområder som dagens `test:all` ikke kjører. Hvis testkommandoen blir oppdatert til å inkludere dem, unngås unødvendig dobbeltkjøring. Nye regresjonsfiler må inngå i sluttkommandoen. Nettleserkontrollen skal også dekke desktop og mobil, langt navn/stor tekst, riktige og gale svar, nettbrudd og faktisk eksport/import mellom profiler. WebKit/Firefox kontrolleres hvis tilgjengelig; fysisk enhet og faktisk lydlytting rapporteres separat.

## Sluttleveranse

### Beslutning om lokal aktivitet og avbrudd (F06/F07/F18)

Minste sammenhengende løsning er å bevare besvart arbeid og avslutte en avbrutt deløkt ærlig ved omlasting. Det trengs ikke lagring av nye råsvar eller hele oppgaveskjermer. Den endelige implementeringen skal verifiseres mot følgende modell før den godkjennes:

- En økt får en tilfeldig lokal `sessionId`, aktivitet og eventuell eksplisitt `assignmentId` ved oppstart. Dette er lokale referanser, ikke elevidentifikatorer. Pakke-ID kopieres ved start fra en handling i den aktuelle pakken; en ny import må ikke endre tilhørigheten til en pågående økt.
- Nye øktposter i `spansk123_practiceHistory` kan ha valgfrie felt for disse referansene og om økten er pågående/avbrutt. `date`, `words`, `correct`, `sessions`, `activity` og `minutes` beholdes. Samme lokale økt oppdaterer samme post med kumulative faktisk besvarte tall; den legges ikke til igjen ved Neste, resultat, teori, avbrudd eller omlasting.
- Ingen post opprettes før et faktisk svar/egenrapportert gloseforsøk. Tid er forløpt økttid, ikke et bevis på aktiv konsentrasjon; et raskt svar skal ikke automatisk telle ett minutt. Ingen fritekst, navn eller lyd legges til aktivitetspostene.
- Eldre poster uten tilhørighet beholdes og kan vises i generell historikk, men tilskrives ikke nye pakker. Generelle uketall og pakketall må merkes og beregnes separat. Datoer følger enhetens lokale kalender.
- Ved ny innlasting merkes lagrede pågående poster avbrutt, og eleven får en konkret melding om bevart svarantall og at neste øving starter på nytt. Denne overgangsregelen oppdaterer ikke læringsprogresjon på nytt.
- Historikken begrenses etter dato (30 dager), ikke etter antall poster. Full fremgangseksport inkluderer de nye valgfrie feltene i eksisterende eksportformat; gammel og ny fil prøves i ren profil. Lokal sletting skal fjerne også de nye feltene gjennom eksisterende lagringsnøkkel.
- Moteksempler som må testes: dobbelt avslutt; svar uten Neste; bakover/teori; ny pakke midt i/etter økt; import av eldre historikk; samme pakke importert igjen; uke-/midnattsskifte; grammatikkresultat tilbake etter lagret post; avslutning uten svar. Importerte historikkposter må aldri brukes til å gjette manglende råsvar eller tilhørighet.

Faglig kildesjekk og fysisk pilot er fortsatt separat fra denne tekniske, lokale modellen. Ingen backend, automatisk overføring eller nye elevopplysninger innføres.

Lever en kontrollert kodeendring med testbevis per funn, oppdatert Beads, og en kort lærerveiledning med avtalt øvingsrute. Bevar rapporten fra 8. september som historisk utgangspunkt. En ny verifikasjonsrapport kan samle resultater og gjenværende kontroller, men skal ikke være en ny løpende oppgaveliste.

De positive regresjonskravene er: lokal bruk uten konto, eksport/import til ren profil og eldre filer, korrekt aksent/ñ-policy, aktiv elevinnsats og resultat → teori → tilbake uten endret fremgang eller dobbeltregistrering.

Teknisk mål kan avsluttes når den avtalte tekniske leveransen er ferdig og alle nødvendige automatiserbare kontroller er bestått. Menneskelige pilotkriterier og eventuell uautorisert publisering må stå tydelig utenfor denne ferdigmeldingen. Hvis mandatet i stedet krever lærerens godkjenning eller publisert kontroll som del av selve målet, kan det ikke markeres fullført før disse kravene er oppfylt.
