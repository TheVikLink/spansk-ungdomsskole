# Implementeringsplan: Lytteforståelse fra eksisterende historier (spansk-ungdomsskole-zme)

## Mål

Legg til en lokal, A0-pilot i «Lytteøvelser» der eleven lytter til den eksisterende hellydfilen for **En morgen i Madrid**, svarer på tre forståelsesspørsmål, og først deretter kan åpne spansk tekst og norsk oversettelse.

## Avgrensning

- Behold dagens diktatflyt, `spansk123_dictation_v1`, eksport/import og aktivitetsregistrering uendret.
- Ikke lagre flervalg, resultat, lytting eller tekststøtte; ingen ny lagringsnøkkel, eksportfelt eller læringsprogressoppdatering. «Jeg kan»-mål og resultatbasert mestring hører til `spansk-ungdomsskole-egb`.
- Ikke innfør fritekstsvar, femstjernersvurdering, nye lydfiler, talegjenkjenning, kontoer eller nettjenester i denne piloten.
- Ikke gjør en generell ombygging av den enkeltfilbaserte diktatkoden. Utvid den avgrenset med en separat lytteforståelsesgren som deler den eksisterende lokale lyd- og offline-håndteringen.

## Akseptansekriterier

1. Bare Madrid-kortet tilbyr «Start lytteforståelse (pilot)» ved siden av dagens «Start historien».
2. Eleven ser en nøytral instruksjon og kan spille av den eksisterende `Ana vive en Madrid full.m4a`; start av spørsmål er sperret til lydspilleren har avfyrt minst én `play`-hendelse. Dette dokumenterer et reelt lytteforsøk, uten å late som appen kan måle forståelse eller oppmerksomhet.
3. Tre faglig gjennomgåtte flervalgsoppgaver dekker hovedinnhold, detalj og handlingsrekkefølge. Valgt svar får riktig/ikke riktig, korrekt alternativ og en kort norsk forklaring, men aldri transkripsjon eller oversettelse underveis.
4. Først etter at eleven har avgitt svar på alle tre spørsmålene, får eleven valgfri tekststøtte med den eksisterende spanske transkripsjonen og norske oversettelsen. Støtten er lukket som standard.
5. Lydfeil sperrer oppgavestart og har samme tydelige «Prøv lyden igjen»-vei som diktat. Nedlasting/offline gjenbruker dagens cache for den samme lokale historien.
6. Dagens diktatflyt, fullføringsregistrering, eksport/import og fravær av lagrede elevtekster og lydopptak består. Lyttepiloten endrer ikke `localStorage` eller eksportdata.
7. Hele flyten fungerer med tastatur og ved 390 px: tydelig fokus, native radio-knapper med `fieldset`/`legend`, status med `aria-live`, minst 44 px trykkmål og ingen horisontal scrolling.

## Innhold som skal faglig godkjennes før merge

Bruk bare den eksisterende lydhistorien `madrid-plaza`; den har en faktisk lokal hellydfil og åtte segmenter. Legg spørsmålsdata på historien som en liten, eksplisitt metadata-blokk (ID, spørsmål, alternativer, korrekt alternativ og forklaring), ikke som spredte UI-strenger.

| Formål | Spørsmål | Korrekt alternativ | Forklaring |
| --- | --- | --- | --- |
| Hovedinnhold | «Hva gjør Ana denne morgenen?» | «Hun går til torget, kjøper brød og går hjem.» | Historien følger Anas korte morgenrunde i Madrid. |
| Detalj | «Hva har den lille hunden?» | «En rød ball.» | Etter at Ana har kjøpt brød, ser hun hunden og ballen. |
| Relevant handling/rekkefølge | «Hva skjer etter at Ana kjøper brød?» | «Hun ser en liten hund.» | Dette tester rekkefølgen i fortellingen, ikke oversettelse av ett enkeltord. |

Skriv tre plausible, alderstilpassede norske distraktorer per spørsmål som ikke overlapper korrekt svar eller kan forsvares ut fra historien. En spansklærer må kontrollere spansk lyd/transkripsjon, norsk formulering, ett tydelig korrekt svar per spørsmål, nivå og forklaring før merge; noter eventuelle endringer i den samme metadata-blokken og oppdater testen til godkjent ordlyd.

## Filer som skal endres

- `index.html` — metadata for Madrid-piloten, knapp i historieoversikten, lytteforståelsesflyt og gjenbruk/utvidelse av lydtilstandene.
- `src/styles/tailwind.css` — små, navngitte regler for handlingsknapper, svaralternativer, tilbakemelding og lukket tekststøtte, inkludert 390 px-regler.
- `tests/dictation.spec.js` — pilotens synlighet, lytteport, spørsmål, fasitport og tastatur/mobilflyt, samt bevaring av eksisterende diktattester.
- `tests/report-dictation.spec.js` — test at lytteflyten ikke skriver til diktatlagring eller progresjon, og at lydfeil/retry også sperrer lytteoppgaver.
- `tests/report-offline-update.spec.js` — utvid eksisterende nedlastet-Madrid-scenario med lyttepiloten, dersom gjenbruket av hellyden ikke allerede gir direkte dekning.
- `README.md` — presiser at lytteforståelse bruker lokale historier, at svar bare er i minnet og at tekststøtte/oversettelse kommer etter forsøket.
- `dist/tailwind.css` og `sw.js` — forventede genererte filer fra `npm run build:app`; ikke rediger dem manuelt.

## Gjennomføringssteg

1. **Fastslå og teste datakontrakten først.** Legg `listeningQuestions` bare på `madrid-plaza`, med tre stabile spørsmåls-ID-er og én eksplisitt korrekt alternativ-ID per spørsmål. Skriv en test som avviser tomme spørsmål, færre enn tre alternativer, dupliserte alternativtekster og manglende forklaring, slik at senere historier ikke får ufullstendige lytteoppgaver.

2. **Gjør piloten valgbar uten å endre diktatens inngang.** La eksisterende «Start historien» fortsatt kalle `startDictation(storyId)`. Vis den ekstra pilotknappen bare når `story.listeningQuestions` er komplett; ikke vis en inaktiv eller falsk lytteknapp på de andre historiene.

3. **Implementer en avgrenset lytteforståelses-tilstand.** Start med kun minnetilstand (`story`, `questionIndex`, valgte svar, `hasPlayed`, `submitted`). Render en forhåndsvisning uten intro som røper innhold, transkripsjon eller oversettelse. Koble hellyden til dagens lokale URL, cache-status, feiltekst, retry og nedlastingsfunksjon. Bruk `play`-hendelsen til å aktivere «Start spørsmål»; behold avspilling/replay på alle spørsmålene.

4. **Bygg spørsmål-og-tilbakemeldingsflyten.** Render ett `fieldset` med radioknapper per spørsmål, en deaktivert «Sjekk svar» til et valg finnes, og en `aria-live`-tilbakemelding etter innsending. Lås valgt radio etter innsending, vis korrekt alternativ og forklaring, flytt fokus til «Neste spørsmål», og tillat ikke neste steg før et reelt svar er avgitt. Etter spørsmål tre vises en liten oppsummering av antall riktige i den flyktige økten, etterfulgt av en lukket tekststøtte som henter eksisterende segmenttekst og `DICTATION_TRANSLATIONS`.

5. **Bevar personvern- og progresjonskontrakten.** Ikke kall `saveDictationCompletion`, ikke skriv `practiceHistory`/`learningProgress`, og ikke før svar over i eksport eller student-feedback. Nullstill minnetilstanden når eleven går tilbake, navigerer bort eller laster på nytt. Sørg for at eksisterende navigasjonsvakt fortsatt ser en aktiv lytteøkt og avslutter den trygt.

6. **Gjør layouten tilgjengelig på mobil.** Stil svar som store, synlige radiokort med fokusmarkering og utvalgt tilstand; hold lydkontroller, status, feilmelding og handlingsknapper innenfor dagens maksbredderegler. På liten skjerm skal alternativene og knappene være én kolonne og tekststøtten leses som én kolonne.

7. **Oppdater lærer- og personverndokumentasjon, bygg og kontroller genererte filer.** Beskriv at dette er en avgrenset, ikke-lagrende pilot, at lyd må være nedlastet før offline bruk, og at læreren skal kontrollere fysisk lydkvalitet. Kjør byggkommandoen slik at stylesheet og service-worker-versjon samsvarer med endret app.

## Test- og verifiseringsplan

Automatisk:

```bash
npx playwright test tests/dictation.spec.js tests/report-dictation.spec.js tests/report-offline-update.spec.js --browser chromium
npm run build:app
npm run check:offline-build
npm run test:all
git diff --check
```

De nye Playwright-scenarioene må eksplisitt dekke:

- før `play` er «Start spørsmål» deaktivert; etter `play` er den aktiv og ingen spansk tekst/norsk oversettelse finnes i DOM;
- korrekt og feil alternativ gir ulike, korte tilbakemeldinger med korrekt svar og forklaring, og tastatur kan velge radio og fortsette;
- fullført tredje spørsmål åpner den valgfrie tekststøtten først da, og den viser begge eksisterende tekstversjoner;
- lokal lagring og `buildProgressExportData()` er byte-/strukturmessig uendret etter en lytteøkt;
- manglende lyd sperrer start, retry gjenoppretter den, og nedlastet Madrid-lyd fungerer offline;
- 390 px bredde har synlige fokusmarkeringer, trykkbare kontroller og ingen horisontal overflow;
- alle eksisterende diktatscenarioer fortsetter å passere, særlig tom gjennomgang, fullføring på to datoer og eksport/import uten elevtekst.

Manuelt før levering:

1. Lytt til hellyden med hodetelefoner og høyttaler på desktop og mobil; bekreft at spørsmålene kan besvares uten å se tekst.
2. La en spansklærer gjennomføre den faglige godkjenningen av de tre spørsmålene og distraktorene nevnt over.
3. Prøv én korrekt og én feil gjennomføring, tilbakeknapp underveis, lydfeil og offline etter nedlasting. Bekreft i nettleserlagring og eksport at ingen lytte- eller svardata er bevart.
