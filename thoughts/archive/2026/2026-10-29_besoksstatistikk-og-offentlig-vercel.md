# Besøksstatistikk og offentlig Vercel-overgang

## Mål og avgrensning
Tell besøk og synlige Facebook-henvisninger på offentlig øving, uten læringsdata. Eier bestilte dette 29. oktober. Beads: spansk-ungdomsskole-kq2e. Ingen DNS-endring, skoleproduksjon, Feide-endring eller publisering av øvrige lokale funksjoner inngår automatisk. Arbeidsgrenen har omfattende tidligere lokale endringer.

## Datamodell og personvern
- Vercel Web Analytics; ingen nye npm-avhengigheter, egne hendelser, informasjonskapsler, brukeridentifikasjon eller kobling til skoledata. Bare sidevisning på HTTPS www.spansk123.no eller spansk123.no, sti / eller /index.html. Ikke staging, preview, lokal fil, /school, /auth eller /api.
- Integrasjon legges bare i generert Vercel-public, ikke i kilde-index eller GitHub-bygget. Automatisk lokal aktivering krever eksplisitt byggopsjon, som er av som standard inntil dashboard/utgivelse er avklart.
- Aktiv output får tidlig meta referrer=no-referrer før andre ressurser og loaderen setter samme policy på scriptet. Dermed sendes ikke sidens query i HTTP Referer til script eller intake. Allerede mottatt document.referrer beholdes for kildevurderingen. Dette verifiseres med ekte nettleser og faktisk leverandørscript mot lokalt rutet intake.
- beforeSend tillater bare pageview, returnerer et nytt objekt med type og fast offentlig rot-URL. Alle queryparametere (inkludert fbclid), fragmenter, payload og intern navigasjon fjernes/avvises. Ingen elevsvar, fremgang, lyd eller localStorage-lesing av læringsdata.
- Vercels script leser document.referrer uten et eget sanitiseringshook. Derfor lastes det ikke ved henvisninger med path utover /, query, fragment eller credentials. Ved vanlig cross-origin origin-referrer kan Facebook telles; noen besøk utelates av dette konservative vernet. Ingen forsøk på å gjenfinne skjulte henvisninger. Ikke kall dette nøyaktig antall personer.
- Respekter GPC og Do Not Track, frakoblet nettleser og allerede eksisterende Vercel-identifikasjonslagring (__va_attribution): da lastes ikke leverandørscript. Vercels beforeSend avviser event/identify/group. Ingen enableCookie-kall. Feil i statistikken skal aldri stoppe øving.
- Første sidevisning per dokument; gjentatt kjøring/historikkendringer skal ikke øke tellingen. Ingen kø/ettersending av offline-besøk.
- Synlig kort personverninformasjon og egen offentlig informasjonsside følger bare det aktiverte bygget. Leverandøren mottar teknisk IP/UA ved nettverkskall og kan avlede enhet/omtrentlig sted; Vercel oppgir aggregert statistikk uten lagret IP og 24-timers besøks-hash. Ikke påstå at all behandling skjer i Stockholm eller at cookie-fri betyr automatisk GDPR-avklart.
- Formål: måle samlet rekkevidde og henvisninger. Tilgang: prosjektets administratorer, ikke lærere/elever. Sletting/retensjon: dashboardets rapportvindu er ikke dokumentert slettingsfrist; avklar leverandørens faktiske retensjon/slettemulighet og avtalegrunnlag før produksjonsaktivering. Ingen ny database eller individuell eksport. Eier kan eksportere aggregater fra tilgjengelig dashboardfunksjon; ikke lov funksjon før kontroll. Deaktivering: bygg uten aktivering og slå av Analytics.
- Aktuell prisside: Pro USD 0,03/1000 hendelser (10 000 sidevisninger ≈ USD 0,30); ingen Plus-pakke. Verifiser faktisk plan og fakturering før aktivering, og informer eier om pris. Ingen kjøp/oppgradering.

## Filer og løsning
1. Ny src/visitor-analytics.js med domenebegrensning, beforeSend og kontrollert scriptlasting. Dokumentert standard /_vercel/insights/script.js; endpoint må bekreftes mot dashboardet før aktivering.
2. scripts/build-vercel-public.mjs får eksplisitt visitorAnalytics=false og CLI-flagget --visitor-analytics. Etter npm run build:app er den konkrete aktiverte byggeinngangen node scripts/build-vercel-public.mjs --visitor-analytics; dashboardets buildkommando må eksplisitt velges ved senere aktivering. Aktivt bygg kopierer script og personvernside og legger til referanse/informasjon i output-index. Kilde-index/skole-HTML forblir urørt. Beregn egen output-build-ID over endelig HTML/script/informasjon og oppdater output-index/output-sw sammen, så eksisterende cache skiftes trygt. Kildens build-ID forblir urørt. Dette aktiverer ikke GitHub Pages.
3. tests/visitor-analytics.test.mjs prøver normal/Facebook, sensitive URL/referrer, skole/staging, GPC/DNT, offline, loaderfeil, doble kall og avviste events. Utvid tests/server/vercel-runtime.test.mjs med byggeisolasjon og output-cache-ID.
4. docs/besoksstatistikk.md og statisk informasjonsside: formål, faktisk datastrøm, begrensninger, dashboard siste 24 timer/referrers/Facebook, status og konkret migreringsløp. README lenkes.

## Aksept og verifikasjon
- Inaktive bygg er byte-for-byte uendret; aktivt bygg injiserer bare offentlig index og holder skole-HTML ute. Kildens HTML/SW endres ikke av pakking.
- Tester viser at sensitive innholdsfelt aldri godtas av vår hook; ingen requests ved blokkert kontekst. Test i nettleser med routet script og registrerte requests, både desktop og mobil; dette er lokal integrasjonsverifikasjon, ikke bevis på leverandørens lagring.
- Kjør node --test tests/visitor-analytics.test.mjs tests/server/vercel-runtime.test.mjs, npm run build:app, npm run test:all, git diff --check. Ved feil dokumenteres faktisk feil og ny hypotese; ikke gjenta samme forsøk uten endring.
- Live ferdig krever faktisk teamtilgang, kontrollert enable + testet deploy, nettverks-payload og dashboardmottak. Ingen påstand om aktiv statistikk før dette. Teamtilgang er etterspurt via engangslenke.

## Permanent migrering
Offentlig øving kan flyttes før skoleplattformen er klar. Klargjør separat statisk produksjonsleveranse uten Express/DB/Feide; ikke promoter eksisterende skolepreview. Bevar HTTPS www som kanonisk origin (localStorage og SW tilhører origin), behold apex→www-redirect. Verifiser valgt publisert innhold, export/import, offline/cachebytte, lyd, desktop/mobil, TLS og rollback før DNS. Ta DNS-status og GitHub Pages som tilbakeføringsgrunnlag. Ikke last opp alle urelaterte arbeidsendringer. DNS-flytting er en separat konkret leveransebeslutning. Ingen fast dato påstås før disse kontrollene og tilgang er på plass.

## Gjennomgang/status
Runde 1: én MAJOR (HTTP Referer), én MINOR (konkret bygginngang), REVISE. Begge rettet i planen over. Statistikk er ikke aktivert; DNS og produksjon er uendret.

Runde 2: APPROVED; begge funn FIXED, ingen nye funn. Lokal implementering startet. Første test var rød fordi implementeringsfilen ennå ikke fantes; seks fokuserte enhetstester er nå grønne. Ny sluttverifikasjon følger.

Lokal sluttverifikasjon: build:app og aktiv public-pakking bestod. test:all exit 0 (112 Node, 52 server, 577 Chromium). Separat faktisk leverandørscript mot lokalt rutet intake: 3/3; generert app kontrollert på 390/1280 px. git diff --check bestod. Se docs/besoksstatistikk.md for commands, script-hash og detaljer. Ingen nye avhengigheter, push, deploy, DNS- eller kontoinnstillinger. Saken forblir åpen for faktisk Vercel-tilgang, avklart leverandørretensjon/avtalegrunnlag og live aktivering/mottak; ingen statistikk er aktiv på nettsiden.
