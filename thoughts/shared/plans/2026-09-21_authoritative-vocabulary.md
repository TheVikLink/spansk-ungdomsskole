# Review-filen som autoritativ ordliste

Beads: `spansk-ungdomsskole-k1wn`. Brukeren har autorisert commit og push.

Årsaken til avviket er en eldre publisert versjon og en manuell byggekjedekobling: review-filen var en arbeidskopi, `audit:apply` leste en annen fil, og `build:app` oppdaterte ikke ordlisten. Svarvurderingen la dessuten til automatisk genererte bøyninger utenfor review-fasiten.

`data/vocabulary-canonical-review.json` skal være eneste redigerbare kilde for standardgloser og godkjente svar. Byggingen validerer den, genererer kompatibilitetskopien `vocabulary-canonical.json` og appens innebygde ordliste/fasit. En separat kontroll er skrivebeskyttet og feiler ved avvik. Gamle kommandoer skal ikke kunne føre andre kilder tilbake til appen. Auditer gir forslag som må legges i review-filen før de tas i bruk.

Gloseøving, blandet quiz og Lingo Links bruker den samme fasitfunksjonen. Standardkort får nøyaktig review-svarene; egne/lærerimporterte kort beholder sin egen oversettelse uten å arve en standardfasit bare fordi norskordet er likt. Nivåtestens fire ordoppgaver kobles eksplisitt til review-ID-er, slik at deres svar ikke blir en uavhengig fasit. Grammatikk, verbbøying, sammenhengende tekster og diktat har egne oppgavekataloger og er ikke en ordlisteimport.

Eksisterende elevdata skal ikke slettes. Eventuell utfasing av standardkort må bevare hele kortets fremgang i samme lagrings-/eksportformat, og holde egne/importerte kort adskilt. Det introduseres ikke elevdata, nettverkstrafikk eller nye lagringsnøkler.

Test først at endringer og slettinger bare i review-filen slår gjennom, at foreldet generert innhold stoppes, at ugyldig JSON/duplikat-ID/tomme svar ikke gir delvis oppdatering, og at «voy a hablar de» og «voy a hablar sobre» godtas mens feil person avvises. Kontroller alle standardkort mot review og faktisk quizbygger, inkludert like norskord med forskjellige spanske uttrykk. Kjør appbygg og test:all, samt berørte nettleser- og gjenopprettingskontroller. Dokumenter miljøblokkeringer uten å kalle tester bestått.

Arbeidstreet inneholder mye tidligere arbeid, inkludert nye lydøvinger. Leveransen må avgrenses til denne rettelsen; tidligere endringer skal bevares og ikke utilsiktet publiseres. GitHub Pages kjører main, mens den lokale grenen er fix/brukertest-2026-09-08. Push til en annen gren alene oppdaterer ikke offentlig nettside.

## Gjennomført lokalt

`sync-vocabulary.mjs` validerer review-filen og genererer gloser, svar i begge retninger, stabile kilde-ID-er, norske substantivvarianter og nivåtestens ordreferanser/fasit. `build:app` synkroniserer først; `check:vocabulary` er en skrivebeskyttet kontroll først i `test:all`. Gamle apply/generate-kommandoer bruker samme kilde. De 522 oppføringene og deres svar er uendret fra brukerens review-fil ved oppstart av oppgaven.

Fasitoppslaget bruker både norsk og spansk ordpar med kilde-ID, slik at like norske oppslag ikke låner hverandres svar. Egne og lærerimporterte ord arver ikke standardfasit ut fra norskord alene. Nivåtestord har eksplisitte referanser; manglende referanser stopper byggingen før filer skrives. Automatisk generering av ekstra yrkes-/substantiv-/ukedagssvar utenfor review er fjernet.

Standardkort lagrer valgfri `canonicalId` i eksisterende kortarray. Utgåtte kort holdes i `archivedVocabularyCards` i minnet og lagres sammen med aktive kort i den samme `spansk123Data_v4`-arrayen. Eksportformat og lagringsnøkler er uendret. Gamle Cola Cao-standardkort gjenkjennes etter ordparet; egne kort med samme tekst bevares. Gamle ukjente, umerkede kort slettes ikke ved gjetning. Nye ID-er reserverer også arkiverte kort-ID-er. Gjeninnføring med samme kilde-ID gjenoppretter fremgangen.

## Verifikasjon og leveransegrense

Test-først-forløpet viste tre reelle feil før retting: sletting bare i review ble ignorert; runtime la til «vinteren» utenfor review; nivåtesten beholdt en egen mor-fasit. Arkiveringstesten viste at Cola Cao fortsatt var aktiv og fanget deretter manglende standardfelt ved andre innlasting.

Bygg, alle innholdskontroller, grammar/diagnosis/learning-catalog, Tailwind, offline-hash og `git diff --check` er kjørt. Node-suiten består med 33 tester, inkludert ni nye regresjoner. De nye testene kjører faktiske appfunksjoner for alle 522 kort i begge retninger og den faktiske quizbyggeren, prøver «voy a hablar de», «voy a hablar sobre» og feil person, samt gammel lagring, sikkerhetskopiering, gjentatt innlasting, stabile ID-er, sletting, navneendring og gjeninnføring.

`npm run test:all` bestod kontrollene frem til nettleserne. Chromium ble avvist av macOS-sandkassen før appen startet: `bootstrap_check_in ... MachPortRendezvousServer: Permission denied (1100)`. Kjøringen ble avbrutt etter gjentatte like oppstartsfeil. Desktop/mobil og reell nettleserimport er derfor ikke bekreftet i denne økten. Loggene ligger i `output/vocabulary-authority/`.

Terminalens GitHub-forbindelse feilet med DNS-feil. GitHub-koblingen kunne lese main (`9ef837a777ad7e1f5d2650e15f8665916d44a92d`), men opprettelse av leveransegrenen ble avvist med «MCP tool call requires approval, but approval policy is never». Ingen remote-gren, commit, push eller publisering ble gjort. En tom lokal leveranse-worktree ble opprettet og fjernet igjen; tidligere brukerarbeid er bevart. De to nye filene sync-vocabulary.mjs og vocabulary-authority.test.mjs ble staged under klargjøringen; et forsøk på å ta bare disse ut av staging ble blokkert med `.git/index.lock: Operation not permitted`. Resten av rettelsen ligger ustaged, og staging er ikke en komplett leveranse. Prosjektets krav om grønn verifisering før commit gjenstår. Ikke bruk `git add .`: arbeidstreet inneholder andre endringer og private, urelaterte filer.

## Oppfølging av brukerens testkjøring 21. september

Brukeren kjørte bygg og hele testsuiten i sin terminal. Alle statiske kontroller og 33 Node-tester bestod; nettlesersuiten ga 442 beståtte og seks feil. `set -e` stoppet kommandoblokken før staging, commit og push.

De seks feilene gjaldt gamle testforventninger. Nivåtesten forventet innholdsversjon 1 selv om synkroniseringen hadde oppdatert spørsmålet til versjon 2. Fire tester krevde automatisk genererte substantiv-/ukedagssvar utenfor review-filen. Tur-testen slo opp et gammelt ordpar: den kanoniske oppføringen er «å gå tur / dar un paseo», og den inneholder allerede både «hacer senderismo» og «hacer caminatas».

`diagnosis-flow.spec.js` kontrollerer nå lagret versjon mot det faktiske katalogspørsmålet. `vocab-learning-mechanics.spec.js` sammenligner alle enkle el/la-substantivkort med review-fasiten, bruker det kanoniske turkortet og kontrollerer både svarlistene og aksept/avvisning av bestemt form/artikkel mot review. Ingen oppføringer eller svar i review-filen ble endret som følge av testfeilene.

Ny lokal verifisering: alle 33 Node-tester, `check:vocabulary`, syntakskontroll av begge endrede testfiler og `git diff --check` består. En avgrenset Playwright-kjøring av de to berørte filene ble stoppet etter første oppstartsfeil: samme `MachPortRendezvousServer ... Permission denied (1100)`. Ingen nettlesertest ble utført i den kjøringen. Full `test:all` må kjøres på nytt utenfor agentens sandkasse før commit/push. Ingen commit, push eller publisering er gjort i denne oppfølgingen.

## Full verifikasjon 22. september

Brukeren har nå kjørt full `npm run test:all` med de seks rettede testforventningene og den nye startsiden fra sak 902: alle statiske kontroller, 34 Node-tester og 453 nettlesertester bestod. Testloggen og `test-results/.last-run.json` bekrefter grønn nettlesersuite. Gjeldende appbygg er `4830ee6af0e99367`; fersk offline- og diff-kontroll består. Verifikasjonsblokkeringen er løst. Git-levering gjenstår; `.git` er fortsatt skrivebeskyttet for agenten, og ingen commit, push eller publisering er registrert.
