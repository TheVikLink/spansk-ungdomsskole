# Besøksstatistikk og offentlig Vercel-overgang

Status 29. oktober 2026: integrasjonen er klargjort og testet lokalt. Ikke aktiv på spansk123.no. Nettstedet leveres fortsatt fra GitHub Pages; teamtilgang til Vercel er etterspurt. Ingen DNS eller produksjonsmiljø er endret.

## Hva eieren vil kunne se

I Vercel: riktig offentlig prosjekt → Analytics → siste 24 timer. Se både Visitors (anslåtte besøkende) og Page Views (sidevisninger). Under Referrers finner du Facebook; summer aktuelle facebook.com-, www.facebook.com-, m.facebook.com- og l.facebook.com-henvisninger dersom de vises separat. Samme person kan telles flere ganger mellom nettlesere/enheter og døgn. Skjulte henvisninger kan ikke tilordnes Facebook, og tallene viser ikke hvilke personer som klikket. Ingen historiske tall kan rekonstrueres før aktiveringen.

Integrasjonen teller maksimalt én visning per lastet dokument. Intern øving, navigasjon og oppgaver gir ikke flere hendelser. Refresh eller gjenåpning kan gi en ny visning. Besøk med GPC/Do Not Track, blokkert lagring, offline nettleser, eksisterende Vercel-identifikasjon eller en henvisningsadresse med sti/parametere/fragment utelates. Det siste er et bevisst vern fordi Vercels hook ikke kan rense henvisningsfeltet. Facebook-tallet er derfor et minimum av de målbare henvisningene, ikke et presist mål på innleggets effekt.

## Dataminimering

Formålet er samlet rekkevidde og henvisningskilder. Kun offentlig HTTPS-rot på www.spansk123.no/spansk123.no måles. Skole-, auth-, API-, localhost- og preview-adresser utelukkes. Kilde-HTML på GitHub endres ikke; statistikken finnes bare i et eksplisitt aktivert Vercel-bygg.

Før innsending normaliseres sideadressen til origin + `/`. Alle queryparametere, inkludert fbclid, og fragmenter fjernes. Tidlig `Referrer-Policy: no-referrer` i dokumentet hindrer at sidens rå URL likevel følger med som HTTP Referer til script og intake. Facebook-opprinnelsen i allerede mottatt document.referrer er fortsatt tilgjengelig hvis den bare inneholder origin.

Ingen elevsvar, navn, fremgang, lyd, bruker-ID-er eller egne events sendes. Ingen statistikkcookies aktiveres. Lokal læringslagring leses ikke. Den separate leverandørnøkkelen `__va_attribution` sjekkes bare for å avstå fra telling hvis en identitet allerede finnes. Leverandøren mottar IP/UA transient ved nettverkskall og oppgir aggregert lagring uten IP-adresser, besøks-hash opptil 24 timer og mulige avledede enhets-/stedsfelt. Dette er ikke løfte om utelukkende EØS-behandling eller en ferdig juridisk vurdering.

Kun eierens prosjektadministratorer skal ha tilgang. Ingen kobling til skole-/elevdata, automatisk rapportdeling eller ny database opprettes. Rapportvindu er ikke slettingsfrist: faktisk retensjon, slettemulighet og leverandør-/avtalegrunnlag må være avklart før produksjonsaktivering. Ikke lov individuell eksport/sletting av hendelser som ikke kan knyttes til person. Aggregerte rapporter kan leses i dashboardet; eventuell eksportfunksjon må bekreftes der. Eier kan stoppe ny innsamling ved å bygge uten flagget og deaktivere Analytics. Allerede lagret leverandørdata følger leverandørens faktiske sletteregler.

Kilder kontrollert 29. oktober: [personvern](https://vercel.com/docs/analytics/privacy-policy), [redigering av hendelser](https://vercel.com/docs/analytics/redacting-sensitive-data), [HTML-integrasjon](https://vercel.com/docs/analytics/quickstart), [pris og rapportvindu](https://vercel.com/docs/analytics/limits-and-pricing). Pro-prisen er oppgitt som USD 0,03/1000 hendelser (USD 0,30 ved 10 000 visninger), underlagt teamets faktiske avtale/kreditt. Ingen Plus-oppgradering skal kjøpes.

## Bygging og aktivering

Vanlig `npm run build:vercel` beholder statistikk av. Eksplisitt aktivert bygg:

```sh
npm run build:app
node scripts/build-vercel-public.mjs --visitor-analytics
```

Bare `public/index.html` får loader og synlig personvernlenke. `public/visitor-analytics.js` og `public/besoksstatistikk.html` tilføyes. Output-index og output-SW får en felles ny build-ID; kildefilene endres ikke av pakking. Kopier ikke bare HTML til drift. Ikke pek nåværende skoleprosjekt mot en ny buildkommando uten separat gjennomgått levering.

Før live aktivering: verifiser faktisk Vercel-prosjekt/team og fakturering, gjennomgå punktene om avtale og retensjon over, aktiver vanlig Web Analytics, bekreft at dokumentert script-endepunkt finnes, bygg og test avgrenset offentlig leveranse. I browser Network skal script og view mangle HTTP Referer og rå query; view skal ha normalisert sideadresse og kun ufølsom origin-henvisning. En syntetisk Facebook-henvisning må mottas i riktig dashboard før statistikk erklæres aktiv. Ingen ekte elev-/Feidekonto brukes. Ikke opprett skoleproduksjon for å få besøksstatistikk.

## Når flytter vi permanent?

Den offentlige øvingssiden trenger ikke vente på Feide, database eller sikkerhetsjournal. Gjør den til neste avgrensede leveranse: en separat statisk Vercel-produksjon, isolert fra skoleplattformens beskyttede staging. Eksisterende skolepreview skal ikke promoteres til offentlig nettsted. Velg en gjennomgått kildeversjon; arbeidsmappen inneholder mange upubliserte endringer som ikke automatisk skal med.

Bevar `https://www.spansk123.no` som kanonisk adresse, og behold apex→www-videresending. Lokal lagring tilhører origin; hostingbytte på samme origin krever ingen fremgangsmigrering. En bruker som har data på en annen origin må eksportere/importere selv. Kontroller eksisterende service-worker-cache ved overgang med samme origin. Ta DNS-status og GitHub-versjon som rollbackgrunnlag. Prøv øving, mobil/desktop, lyd, offline, eksport/import, TLS, cachebytte og rollback før DNS endres. Etter flytting kontrolleres offentlig bygg-ID og live statistikk. Behold GitHub som tilbakeføringsmulighet til dette er bekreftet.

Det er ingen bekreftet flyttedato. Teamtilgang, valgt offentlig leveranse og konkret DNS-levering gjenstår. Spørsmålet om tidspunkt er ikke brukt som tillatelse til å flytte domenet nå.

## Lokal verifikasjon 29. oktober

- `npm run build:app` bestod med eksisterende Node 22.23.3. `node scripts/build-vercel-public.mjs --visitor-analytics` bygget aktiv output; kildebygg-ID er fortsatt `4d98b6d636302723`, aktiv output har `0f42033792149dfb` i både HTML og SW.
- `node --test tests/visitor-analytics.test.mjs tests/server/vercel-runtime.test.mjs`: 12/12 bestod. Inaktiv pakking bevarer HTML byte-for-byte; aktiv pakking isolerer endringene til output og får stabil cache-ID.
- `VERCEL_ANALYTICS_SCRIPT_FIXTURE=/tmp/spansk123-vercel-insights.js node node_modules/@playwright/test/cli.js test tests/visitor-analytics.spec.js --browser chromium --workers=1 --reporter=line`: 3/3 bestod med faktisk script hentet fra `https://vercel.com/_vercel/insights/script.js`. SHA-256: `050e35bf7e6e96590f2a9de114c14ff792806ed28457b3248762944350c0ba4c`. All innsending ble fanget lokalt av Playwright; ingen hendelser ble sendt til Vercel. Mobil/desktop: én normalisert visning, Facebook-origin bevart, ingen rå query eller HTTP Referer; private henvisninger blokkerte scriptlasting. Testen beviser ikke leverandørens lagringspraksis eller dashboardmottak.
- Generert app åpnet i ren Chromium på 390/1280 px: Start og Gloser fungerer, personvernlenken er synlig og siden har ingen horisontal overflow. Fil-URL utløser ikke statistikk.
- Første browserforsøk ble blokkert av sandboxens MachPort-regler; ny kjøring med nødvendig Chromium-tilgang bestod. En testfixture manglet UTF-8 og ble rettet før bestått kjøring. npm-cachebegrensning ble håndtert ved å bruke eksisterende Node-binær direkte, uten å endre systemrettigheter.
- `npm run test:all` bestod, exit 0: 112 vanlige Node-tester, 52 servertester og 577 Chromium-tester, inkludert alle tre nye browserregresjoner. `git diff --check` bestod. Vercel-prosjektlesing gir fortsatt 403; live aktivering er ikke verifisert.
