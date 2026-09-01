# Diktat v1: fortellingsbasert lytting

## Summary

Lag en egen diktatmodus med fem originale, korte historier på A0–A1/A1-nivå. Historiene skal hovedsakelig bruke kjent ordforråd, men kan introdusere nye hintord. Hver historie skal være knyttet til et konkret sted eller en kulturkontekst i den spanskspråklige verden.

Diktat skal trene aktiv lytting og skal ikke kobles til grammatikkmål, ordliste, læringskatalog eller spaced repetition.

## Innhold og lyd

- Fem historier med 7–13 setninger og 8–13 segmenter.
- Historiene har fiksjonelle personer, men forankres i virkelige steder, regioner eller kulturkontekster.
- Nivåfiltre: A0, A1 og eventuelt A1+.
- Stedsfiltre: Spania, Sør-Amerika, Mellom-Amerika og Mexico.
- Hver historie får ett kulturelt tema, men ikke et eksplisitt læringsmål.
- Nye eller krevende ord vises som korte hint ved siden av avspillingskontrollen.
- Historiene får ferdigprodusert lyd på forhånd, inkludert regionale aksenter der det er relevant.
- Eleven skal aldri treffe ElevenLabs eller andre eksterne tjenester i selve appen. Eventuell ekstern lydgenerering skjer kun i forfatterflyten.
- Tempojustering implementeres som elevstyrt avspillingshastighet, med normalverdi 1,0 og et begrenset område rundt normaltempo. Kontrollens tilgjengelighet og lydkvalitet testes i Chrome.

Minimal intern metadata skal angi historie-ID, nivå, region, sted, kulturelt tema, segmentrekkefølge, hintord og dato for manuell kvalitetskontroll.

## Elevflyt

1. Historieoversikt med tittel, nivå, region og kort introduksjon.
2. Eleven kan filtrere etter nivå og geografisk område.
3. Før start kan eleven høre hele historien så mange ganger som ønsket.
4. Øvelsen viser ett segment om gangen.
5. Eleven styrer selv tempo og antall avspillinger.
6. Eleven skriver det han eller hun hører.
7. Fasiten vises først etter innsending.
8. Eleven kan høre segmentet igjen etter fasiten.
9. Tilbakemeldingen viser fasit og én kort, motiverende melding basert på graden av samsvar.
10. Antall feil vises ikke.
11. Eleven gir seg selv 1–5 stjerner.
12. Stjernene påvirker ikke progresjon, score eller læringsalgoritmer.
13. Etter siste segment vises hele historien som tekst, med mulighet for helavspilling.
14. En kort kulturbrikke og ett sammenligningsspørsmål vises etter historien.

## Lagring og lekse

- Diktat får en egen lokal lagringsmodell.
- Det lagres bare at en historie er fullført, med historie-ID og dato.
- Elevsvar, antall feil og stjerner lagres ikke.
- Fullført diktat registreres som egen aktivitet og kan telle som øvingsdag i ukesleken.
- Diktatdata endrer ikke ordprogresjon, grammatikkprogresjon, Brainmap-status eller SM-2-data.
- Eksport/import bevarer fullførte diktataktiviteter uten elevsvar eller ekstra persondata.
- Historiene er tilgjengelige uten læreroppsett, men kan senere velges i leksepakker.

## Testing og kvalitetssikring

Automatiske tester dekker datavalidering, avspilling, tempo, fasitvisning, ikke-lagring av elevsvar/feil/stjerner, separat fullføring, ukeslek, eksport/import, filtrering, hint, tastatur, 390px, manglende lyd og fravær av runtime-kall til eksterne lydtjenester.

Alle fem historier kvalitetssikres manuelt for spansk språk, lyd, nivå, kulturfakta, segmentering, hintord og regionale uttaler.

## Presiseringer før implementering

- Historier og segmenter bruker en lukket metadata-taxonomi: nivå `A0`, `A1` eller `A1+`; region `Spania`, `Mexico`, `Mellom-Amerika` eller `Sør-Amerika`; samt ett eksplisitt sted. Karibia inngår ikke i v1. Hver historie har 7–13 setninger og 8–13 segmenter; segmentgrenser kan avvike fra setningsgrenser, men rekkefølgen er fast.
- Lyd leveres som lokale, statiske MP3-filer med stabile relative URL-er under en egen diktat-lydmappe. Et manifest validerer historie-/segment-ID, URL, varighet, språk/aksent, lisens/provenance og filintegritet. Elevappen har ingen lydgenerator eller forfatterverktøy i bundlen, og fungerer uten nett for filer som allerede er levert/cachet; 404, avbrutt avspilling og manglende cache gir en tydelig tekstlig feilmelding uten å avsløre fasit før innsending.
- Elevappen refererer kun til lokale lyd-URL-er. En statisk URL-audit og en browser-test med request interception feiler på eksterne nettverkskall, særlig ElevenLabs. Eventuell forfattergenerering skjer utenfor elevappen og dokumenteres ikke som runtime-avhengighet.
- Svar sammenlignes med en dokumentert, deterministisk normalisering: trim og sammenhengende mellomrom ignoreres, store/små bokstaver og ytre tegnsetting ignoreres, mens ordrekkefølge, ordinnhold, aksenter og `ñ` beholdes som standard. Segmentmetadata kan eksplisitt angi pedagogisk godkjente alternativer eller en streng variant; tomt svar er større avvik. Tilbakemeldingsnivåene og testene dekker disse reglene.
- Fullføring lagres idempotent først etter innsending av siste segment, aldri ved åpning, avspilling, refresh eller avbrudd. Avbrutte økter kan ikke gjenopptas i v1. Gjentatt gjennomføring endrer ikke historikk utover at eksisterende completion beholdes.
- Diktat bruker egen nøkkel `spansk123_dictation_v1` med `{version: 1, completed: [{storyId, completedOn}]}`. `storyId` må finnes i katalogen, dato lagres som lokal ISO-dato, og duplikater dedupliseres på `storyId` (seneste gyldige dato beholdes). Import merger gyldige diktatfullføringer med eksisterende data, avviser ukjent/fremtidig versjon uten å overskrive, og håndterer tom/skadet payload uten å skade annen lagring. Gammel eksport, gjentatt import og skadet/fremtidig eksport testes.
- Ukesleken leser kun eksistensen av minst én gyldig diktatfullføring på lokal dato som en egen aktivitetstype; den kopierer ikke svar, fasit, feil, stjerner, lydbruk eller minutter til `practiceHistory`, lekserapport eller annen læringsprogresjon. Flere historier samme dag teller som én øvingsdag. Eksport/import bevarer kun completion-recordene.
- Stjerner holdes kun i minnet og kastes ved navigasjon/refresh. Svarfeltet har ingen autofyll/persistensmekanisme, diktat har ingen feedback-kanal som sender eller lagrer råsvar, og ingen logger/eksportfelt inneholder elevens tekst.
- Tilgjengelighet aksepteres bare når alle kontroller kan brukes med tastatur, fokus flyttes tydelig mellom segment, svar, fasit og neste steg, tempo-slideren har navn/verdi, og fasit/tilbakemelding annonseres i en passende live-region. Flyten testes ved 390px bredde og med redusert bevegelse.
- Offline leveres som en eksplisitt, versjonert cache-strategi: service worker precacher appskallet, katalogen og alle fem historienes lydfiler ved førstegangsinnlasting, bruker cache-first for disse lokale ressursene, og oppdaterer atomisk til ny cacheversjon. Ved installasjons- eller oppdateringsfeil beholdes forrige fungerende cache; manglende ressurs viser tekstlig fallback. Testen laster appen én gang i Chrome, går offline i en ren profil og verifiserer oversikt, tekst og lyd.
- Nettverkstesten er allowlist-basert: alle runtime-requests i oversikt, filter, førlytting, øvelse, feilflyt og refresh må være lokale relative ressurser fra appens egen origin. Ingen fonter, favicons, analytics, API-er, CDN-er eller eksterne lydtjenester tillates; avvik feiler testen. Forfatterflyten er ikke del av elevbundlen.
- Filintegritet verifiseres i bygg-/CI-testen ved å hashe hver levert lydfil og sammenligne mot manifestet, samt kontrollere at filen kan dekodes som MP3. Runtime trenger ikke hashverifisering; ved manglende eller ikke-dekodbar fil vises fallback og historien kan ikke fullføres før segmentet er sendt inn på nytt etter at lyd er tilgjengelig.
- Import er atomisk: enhver ukjent/fremtidig versjon eller ugyldig record avviser hele diktatdelen uten å endre eksisterende diktatdata eller annen lagring, med forståelig feilmelding. Gyldig payload med duplikater merger idempotent. Blandede, tomme, skadde, gjentatte og fremtidige payloads testes.
- Segmentflyten har en eksplisitt tilstandsmaskin (`ready → playing → awaitingAnswer → submitted → completed`) med deaktivert innsending/neste-knapp under overgang. Dobbeltklikk, tastaturrepetisjon, avbrutt avspilling og refresh under siste innsending gir høyst én completion; refresh før bekreftet completion gir ingen fullføring.
- Service worker registreres med samme relative base path som appen (inkludert GitHub Pages-underbane), og alle precache-URL-er bygges fra denne basen. Ny cache bygges og valideres komplett før den aktiveres; første lasting uten nett er en forventet ikke-støttet tilstand med forståelig beskjed, mens etterfølgende offline-innlasting testes i ren Chrome-profil. Cacheversjonsbytte, oppdatering og rollback ved ufullstendig precache testes.
- Siste innsending bruker én synkron lokal commit-sekvens: valider svar → skriv completion atomisk til `spansk123_dictation_v1` → marker UI som `completed`. Refresh/crash før commit gir ingen completion; etter commit kan UI vises på nytt uten duplikat fordi `storyId` dedupliseres. Testene simulerer refresh/crash før, under og etter commit og verifiserer både ingen tap før commit og høyst én record etter commit.
- Svarnormalisering er `String.normalize('NFC')`, trim, kollaps av Unicode-whitespace, case-folding og fjerning kun av tegnsetting i starten/slutten av hele svaret (`¿ ¡ , . ! ? : ; « » " '`). Apostrofer og bindestreker inne i token, ordrekkefølge, aksenter og `ñ` beholdes. Testene dokumenterer godkjente eksempler (ekstra mellomrom, stor bokstav, sluttpunkt) og avviste eksempler (manglende aksent/ñ, endret ord eller innvendig tegn).
- Sammenligningsspørsmålet er display-only i v1: eleven får et kort spørsmål til egen refleksjon og ingen svarwidget. Det samles eller lagres ingen respons; dette verifiseres ved eksport og gjennomgang av lagringsnøkler.
- `completedOn` beregnes av én felles funksjon som bruker elevens lokale kalenderdato fra nettleserens lokale klokke (`YYYY-MM-DD`), ikke UTC-konvertering. Ukesleken bruker samme funksjon og dermed samme dato-kontrakt. Datoer må være syntaktisk gyldige og ikke ligge frem i tid ved import; ugyldig/fremtidig dato avviser hele diktatpayloaden. Tester dekker Europe/Oslo rundt UTC-midnatt, sommertid og datoendring, samt import av ugyldige/fremtidige datoer.
