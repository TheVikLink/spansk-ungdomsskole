# Julepakken: naturlig språk, oversettelse i par og valgfrie gloser

Produkteierens tilbakemelding 6. oktober 2026 er styrende. Denne revisjonen erstatter tidligere støttevalg, avslutningsoppgaver og planlagt utsettelse av gloserbroen i juleplanen. Aktivt arbeid følges bare i Beads `spansk-ungdomsskole-tc0b.8`.

## Mål og avgrensning

Gjør tekstøkten naturlig å bruke i klassen, med lesing og muntlig oversettelse i par, større åpne/lukke-ordlister og et fungerende valgfritt juleglosesett i eksisterende Gloser. Behold de lengre spanske tekstene, de to ulike familiebildene, ordpunktene og eksisterende no-login-øving. Ingen publisering, lydgenerering, innsamling av muntlige svar, backend eller kontofunksjoner.

## Gjennomføring og observerbart resultat

Spørsmål 1 spør hva julaften kalles; spørsmål 2 spør når mange barn i Spania får gaver. Spørsmål 3 blir et åpent spørsmål om hvordan jul feires i Chile, med samtale i par og svarforslag bare i lærerveiledningen. Spørsmål 4 spør hvilket annet navn Papá Noel har. Sammenligning og besøksråd følger produkteierens formuleringer. Den tidligere tunge termen for å vise hvor svaret står fjernes fra aktive elev- og lærertekster. Introen blir kort og konkret.

Én elevvisning har lesing høyt og muntlig oversettelse i par som oppgave. Hvert land får en omfattende ordliste med ord og uttrykk fra alle avsnittene, i tekstens rekkefølge. Native details/summary lar eleven vise og skjule listen. Bildeordene beholdes som en egen liten tilgjengelig liste. Støttevelgeren og avslutningsdelen fjernes. PDF får én aktuell elevutgave og én lærerveiledning; gamle støtteutgaver merkes historiske i lesmeg og lenkes ikke fra aktiv prøve.

Gloselenken bruker en relativ fragmentrute til hovedappen. Settet bygges fra samme JSON som leseteksten. Tre eksisterende standardord gjenbruker stabile kort og fasiter; de sju nye temaordene er separate valgfrie kort, opprettet først når eleven velger temaet. Kategorien vises separat og velges ikke av standardvalget «Velg alle». Temaord endrer ikke den kanoniske standardordlisten. Lokal fremgang, SM-2, angre, repetisjon og sikkerhetskopiformat gjenbrukes. Reaktivering og import finner samme temaord gjennom stabile pakkereferanser, selv om eldre import omnummererer kort-ID-er.

Valg av den spesielle kategorien avgrenser både nye ord og repetisjon til settet. Øktkonteksten bevares ved omstart. Hvis alle temaord er planlagt senere, vises neste dato og en egen knapp for ekstraøving uten å endre repetisjonsplanen. Aktiv økt avklares før ruten eller kategorien byttes; avbrutt navigasjon beholder økt og kø. Ukjent pakkelenke viser en norsk melding og fungerende vei til Gloser. Førstegangsbruk følger appens eksisterende lokale elevkodeflyt; ingen ny konto eller persondatakilde.

## Filer og rekkefølge

1. `data/culture-packages.json`, `scripts/build-culture-preview.mjs`, `docs/kultur/jul-spania-chile/preview.js` og `preview.css`: innhold, åpne spørsmål, ordliste og faktisk gloselenke. Oppdater eksisterende innholds-/flyttester for den nye leseflyten før implementasjon.
2. `index.html`: avgrenset generert JSON-blokk for valgfrie glosesett, kategorivalg, oppstartsrute og øktkontekst. `scripts/build-culture-preview.mjs` synkroniserer blokken; `package.json` kjører synk før offline-hash og kontrollerer synk i test:all. Byggdata inneholder bare de ti øvingsordene, ikke lærerfasit eller elevsvar.
3. `scripts/build-culture-pdfs.py`: én seks siders elevutgave med landtekst og egen ordlisteside per land, oppgaver og nøkkelord; lærerforløp og fasit revideres. Kontroller faktisk sidetall og layout etter bygg.
4. `docs/kultur/jul-spania-chile/README.md` og hovedappens `README.md`: beskriv aktuell klasseflyt, valgfri kategori, lokal lagring og gjeldende PDF-er. Beads registrerer resultat og gjenværende lærer-/klassegjennomgang.

## Testplan

Bruk test-først for leseflyt og gloserbroen. Kjør nærmeste test etter hver avgrensede implementasjon, med Node 22.23.3:

```sh
node --test tests/culture-packages.test.mjs
node scripts/build-culture-preview.mjs --check
npx playwright test tests/culture-christmas-flow.spec.js tests/culture-vocabulary.spec.js --browser chromium --workers=1
npx playwright test tests/import-export-compat.spec.js tests/home-vocabulary-review.spec.js tests/vocab-learning-mechanics.spec.js --browser chromium --workers=1
npm run build:app
npm run test:all
git diff --check
```

Kontroller hovedappens standardsett uten aktivering, julelenke ved første/gjentatt oppstart, egen kategorivelger, omstart, forfalte/fremtidige ord, ekstraøving, aktiv økt som avbrytes/beholdes, ukjent pakke, gammel/ny eksport-import, mobilbredde 390 px og direkte lokal HTML uten nett. PDF-ene tekstkontrolleres og alle sider gjengis og undersøkes visuelt. Bare teknisk kontroll dokumenteres; lærer-/klassegodkjenning må fortsatt komme fra faktisk gjennomgang.
