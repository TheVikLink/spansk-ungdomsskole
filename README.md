# 🇪🇸 Spansk på 1-2-3

En gratis, interaktiv læringsapp for spansk på ungdomsskolenivå (A0-A1 CEFR). Bygget for norske elever og kan brukes uten innlogging.

**[🚀 Prøv appen](https://theviklink.github.io/spansk-ungdomsskole/)**

Status 18. september 2026: den lokale tekniske releaseporten er bestått; faglig lærerkontroll, fysisk skoleutstyr og moderert elevpilot gjenstår. Se [gjeldende verifikasjon og avgrensning](docs/release-verification-2026-09-18.md). Rettelsene er ikke publisert, og den offentlige lenkens nåværende bygg er ikke verifisert i denne leveransen.

## ✨ Funksjoner

### 📚 Gloselæring
- **Over 500 gloser** på ungdomsskolenivå
- Repetisjon over tid med SM-2-algoritmen
- Lær begge veier: Norsk → Spansk og Spansk → Norsk
- Kategorisert etter tema (familie, mat, dyr, farger, osv.)
- Importer gloser fra JSON-fil

### 🏃 Verbøving
- 34 spanske verb
- Tre tider: Presens, Futuro (ir a + infinitiv), Presens perfektum
- Fullstendig bøyingstabell ved feil svar
- Hint-funksjon

### 📖 Grammatikk
- 10 grammatikktemaer med målrettet øving, blant annet:
  - Artikler (el/la/un/una)
  - Adjektivsamsvar
  - Ser vs Estar
  - Gustar
  - Refleksive verb
  - Pekende adjektiv
  - Eiendomsord
- Teori vises automatisk ved behov
- Åtte korte grammatikkleksjoner med vei fra resultat til forklaring og ny øving
- Resultater beskriver besvarte oppgaver; de er ikke en validert mestringsvurdering

### 🧠 Brainmap
- Visuell oversikt over A0- og A1-mikroskills og ordforråd
- Mikroskills er gruppert etter nivå og språkområde
- Fargekoding: grå (ikke startet), rød (trenger øving), gul (på vei), grønn/gull (gode/sterke svar på øvde oppgaver)
- Ferdigheter uten ferdig øvingsrute vises åpent som planlagt innhold og skjules ikke som om de var mestret
- Katalogen har 64 ferdigheter: 37 med relevant øvingsrute og 27 planlagte. Dette er ikke et komplett A0–A1-kurs.
- Eksisterende lokal progresjon og eksport/import beholdes når Brainmap-katalogen utvides

### 📝 Ukeslekse
- Sporer øvingsdager automatisk
- Lager lokal lekseoppsummering uten å sende data
- Standardmål: øv to dager per uke; dagens oppsummering er tilgjengelig fra første dag
- Læreren kan lage og dele en lokal leksepakke med gloser, verbgrupper, flere grammatikktemaer og tidsmål

## 🔒 Personvern

- **Ingen data sendes til skyen i standardoppsettet** - all fremgang lagres lokalt i nettleseren
- Ingen innlogging eller brukerkontoer
- Elevene kan eksportere/importere fremgang som JSON-fil
- Ukeslekse viser en lokal oppsummering som kan skrives ut eller lagres som PDF. Det finnes ingen ekstern innlevering i pilotversjonen.
- Elever blir ikke lagt inn i en felles klasse, og standardversjonen har ingen sentral lærerinnboks.
- Personvernoppsettet er laget for en lokal pilot. Feide, skolekontoer og eventuell sentral datalagring krever en egen data- og personvernmodell.

### Lokal fremgang, avbrudd og sikkerhetskopi

Elevkoden er en lokal etikett, ikke en konto. Samme kode i en annen nettleser gir ikke tilgang til tidligere arbeid. Last ned fremgang fra Lekse-fanen før enhetsbytte eller sletting, finn JSON-filen og importer den i den nye nettleseren. Filen inneholder kode/kallenavn, fremgang, øvingshistorikk, aktiv leksepakke og de lagrede svarene fra nivåtesten. Del den bare med noen du stoler på.

Besvarte gloser, verb, grammatikk og quizoppgaver lagres fortløpende. Ved omlasting avsluttes en uferdig økt som avbrutt; appen viser hvor mange svar som er bevart. Oppgaver som ikke er besvart, telles ikke. En ny økt starter med en ny oppgaverekke. «Angre» i gloser tilbakefører både kortfremgang og øktens opptelling.

Historikken bruker fortsatt `spansk123_practiceHistory` og fremgangseksport `spansk123_export_v1`. Nye poster har valgfrie lokale økt- og pakkereferanser (`sessionId`, `assignmentId`) og status (`inProgress`, `interrupted`), i tillegg til eksisterende dato, aktivitet, antall, riktige svar og tid. Referansene hindrer dobbeltelling og skiller leksepakker; de identifiserer ikke elever og sendes ikke ut. Ingen nye fritekstsvar eller lydopptak legges til historikken. Økten dateres på første besvarte oppgave etter lokal kalender. Historikken beholder de siste 30 dagene ved ny registrering; den samlede læringsfremgangen beholdes. Eksport/import og «Slett all data» omfatter disse feltene.

Pakkens tidsmål teller bare økter startet med pakkens egne knapper, fra importdatoen. Ukens pakkedager telles separat fra all øving. Rapporten viser pakkens egne antall ved siden av den generelle oversikten. Eldre historikk uten pakketilknytning beholdes som generell øving. Tid er medgått økttid og kan inkludere pauser; den dokumenterer ikke konsentrasjon. Null svar gir ingen øvingstid. Hver nylaget leksepakke har egen ID; ny import av samme fil beholder tilknytningen.

### 📢 Tilbakemeldinger på oppgaver

Elever kan melde inn når de mener et svar er feilvurdert ved å klikke «Jeg mener svaret mitt er riktig» etter feil svar. Innspillet lagres **bare lokalt** på enheten.

- **Anonym som standard** – eleven må aktivt velge å signere med elevkode.
- **Lærer kan eksportere** alle innspill som JSON-fil fra Innstillinger → Tilbakemeldinger.
- **Send JSON-filen til utvikler** for gjennomgang og oppdatering av ordlisten.
- Ingen data sendes automatisk til noen server.
- Advarsel i dialogen: «Skriv ikke navn på andre elever.»
- Innspill endrer ikke poengsummen automatisk. Eleven må vise innspillet til læreren.
- Innspill følger **ikke** med i vanlig fremgangseksport. Eksporter dem separat før nettleserdata slettes, og gjennomgå elevsvar/forklaringer før deling.

## 🎒 Skolestartpilot

Målet for første pilot er å gi spansklærere et lavterskel supplement til undervisningen uten innlogging, elevkontoer eller sentral datalagring.

- Gratis pilot i 2-4 uker for utvalgte lærere/skoler
- Foreslått tidlig skolelisens etter pilot: 3 000-4 000 kr per skole per år
- Best egnet for gloser, repetisjon, verb, grammatikk og korte øvingsøkter i eller mellom timer
- Feide, lærerinnlogging og skole-/kommuneadministrasjon vurderes som en senere fase etter egen personvern- og datamodell

Begynn med faglig lærerkontroll og en kort demonstrasjon eller liten, moderert prøve. Se [PILOT.md](PILOT.md) for ett konkret 20-minutters opplegg, reserveplan og spørsmål før eventuell selvstendig helklassebruk. Ingen slik elevpilot er gjennomført som del av den tekniske rettingen.

## 🛠️ Oppsett for lærere

### 1. Bruk standard lokal pilotflyt

Før en demonstrasjon kontrollerer læreren valgt innhold og versjonsmerket. Den offentlige lenken oppdateres først ved en egen publisering; en lokal retting eller PR endrer ikke den publiserte appen. Elevene skriver elevkode eller fornavn, øver lokalt og kan laste ned fremgang som JSON-fil. Leksefanen viser en lokal oppsummering, men sender ingenting.

Standardversjonen har ikke en felles klasse som elevene blir meldt inn i. Hvis en lærer vil bruke egne gloser, deler læreren en JSON-fil basert på `eksempel-gloser-laerer.json`, og eleven importerer filen lokalt i appen.

### 2. Deploy

Kjør `npm run build:app` og `npm run check:offline-build` før levering. Publiser `index.html`, `dist/tailwind.css`, `sw.js`, `manifest.webmanifest`, `PILOT.md` og de tilhørende `audio/diktat/`- og `audio/lyttehistorier/`-mappene sammen på GitHub Pages, Netlify eller skolens HTTPS-server. Bare HTML-filen er ikke tilstrekkelig. Bevar relative stier, aksenter og mellomrom i lydfilnavn. Lokal åpning av HTML-filen fungerer med CSS- og lydmappene ved siden av, men installasjon og nettleserens offline-cache krever HTTPS eller localhost.

Byggkommandoen gir HTML og service worker samme innholdsstyrte versjon. Etter oppdatering får en åpen app beskjed om at en ny versjon er klar. Eleven avslutter økten og velger «Last inn oppdateringen»; aktivt svar tømmes ikke automatisk. En eldre v4-installasjon kan trenge én ekstra omlasting etter at den nye service workeren er hentet. Fremgang ligger i lokal lagring og slettes ikke ved oppdatering.

### Lyd uten nett

All lyd skal være ferdige opptak som produkteieren har laget og levert. Appen bruker aldri tekst-til-tale, verken fra nettleseren, operativsystemet eller en skytjeneste. Manglende eller uspillbar lyd gir en tydelig beskjed, ikke syntetisk erstatningslyd. Gloser og blandet quiz har foreløpig ikke egne opptak og viser derfor «Lydopptak er ikke tilgjengelig for denne oppgaven» ved spansk tekst.

Appskallet lagres separat fra lyd. Åpne en historie i Lytteøvelser på nett og velg «Last ned lyd til bruk uten nett». Vent på bekreftelsen om at hele historien er lastet ned. Test deretter uten nett på samme enhet. Deler som mangler eller en avbrutt nedlasting gir en tydelig beskjed; Start/Sjekk svar venter på tilgjengelig lyd. Nettleseren kan slette cache ved plassmangel, så sjekk før timen.

Diktat viser hvor mange deler eleven faktisk skrev et svar til og hvor mange som stemte med fasiten. Tom gjennomgang gir ikke fullføringsregistrering. Bare historie-ID og lokal fullføringsdato lagres når alle deler er forsøkt; ny gjennomføring på en annen dag bevares uten doble datoer ved import. Elevteksten og avspilt lyd lagres ikke som elevdata. Fysisk lydkvalitet og uttale må fortsatt prøves med lærer og elever.

Lyttehistorier er en egen innholdstype, adskilt fra diktat, med egne manus og lydfiler under `audio/lyttehistorier/`. Fem historier er teknisk tilgjengelige: Leo i Sevilla (A1, 68 sekunder), Carmen i Madrid (A0, 36 sekunder), Mateo i Puebla (A0, 39 sekunder), Inés i Valparaíso (A1, 31 sekunder) og Diego i Cartagena (A1, 32 sekunder). Inés og Diego er omskrevet til presens og bruker nå egne, nye MP3-opptak. De gamle WAV-filene er bevart, men ikke koblet til disse oppgavene. [Oppdaterte manus, oversettelser og fasit](LYTTEHISTORIER-PRESENS.md) ligger lokalt og er samordnet med Google-dokumentet «Lytteforståelse historier» i mappen «Spansk nettside».

Hver historie har tre lokale flervalgsoppgaver med blandet rekkefølge på svaralternativene. Eleven må starte avspillingen og svare på alle spørsmålene før spansk transkripsjon eller norsk oversettelse kan åpnes. Eleven kan spille historien flere ganger før spørsmålene; appen kontrollerer ikke at hele opptaket er hørt. Svar, resultat og lydbruk ligger bare i minnet og lagres ikke i fremgang, eksport eller historikk. Last ned en tilgjengelig historie på nett før den skal brukes uten nett.

Nivåmerkene er foreløpige, ikke en lærergodkjenning. Før elevpilot må en spansklærer lytte til de tilgjengelige lyttehistoriene og fem diktater på skoleutstyret, sammenligne opptakene med manus og kontrollere uttale, pauser, tempo og spørsmål. Carmen er den korte A0-historien, men også hun og Mateo kan kreve støtte. Inés og Diego bruker nå presens og enklere setninger; de nye MP3-opptakene er teknisk spillbare, men må kontrolleres mot manus og vurderes for klassen. Beregnet tempo på omtrent 179 og 183 ord per minutt gjør dette særlig viktig. Teknisk kontroll av filkobling og avspilling dokumenterer ikke at opptaket følger manuset. Se [gjeldende releaseverifikasjon](docs/release-verification-2026-09-18.md), [historisk lytteaudit](thoughts/shared/plans/2026-09-15_listening-release-audit-report.md) og Beads `spansk-ungdomsskole-4or0` for den åpne lærerkontrollen.

## 📚 Innhold og rettigheter

Ikke importer eller del skannede læreboksider, uttrukket forlagsinnhold eller annet materiale du ikke har rettigheter til. Kapittelimporten er ment for lærerens egne ordlister og manuelt godkjent innhold.

### Utvikleraudit av svarvarianter

`npm run check:content-accuracy` kjører 13 mekaniske kontroller og, når referansekorpuset finnes, tre konsistenskontroller for synonymer og foreldreløse korpusoppføringer. ñ-kontrollen er målrettet mot kjente feilformer i norsk betydningskontekst, ikke generell stavekontroll. Korpuset bygger i stor grad på samme ordliste. Grønt resultat bekrefter derfor ikke all idiomatikk eller gyldigheten til alle distraktorer; kommandoen opplyser alltid at denne faglige gjennomgangen ikke er utført. Mutasjonstester inngår i `npm run test:all`.

Repoet har en offline audit-pipeline for å finne mulige norske/spanske svarvarianter. Kildeuttrekk legges i `scripts/audit-sources/snapshots/` bare når lisensen tillater lokal lagring, og må ha provenance, lisens og hash. Kildene brukes kun til forslag; en utvikler/lærer må sette `status` til `approved` før en variant kan legges i appens svaralternativer. `tradere` og lignende kandidater skal derfor kunne stå som `false_positive` uten å påvirke elevfasiten.

**[`data/vocabulary-canonical-review.json`](data/vocabulary-canonical-review.json) er den autoritative fasiten for standardgloser og godkjente svar.** Rediger `norsk`, `spansk`, `kategori` og svarlistene `svar.es-no`/`svar.no-es` der. Behold en oppførings `id` ved tekstrettelser, og bruk en ny, unik ID for nye ord. Kjør `npm run build:app`: byggingen leser alltid review-filen først og genererer `data/vocabulary-canonical.json`, ordlisten, svaralternativene og nivåtestens glosefasit i `index.html`. Ingen manuell kopiering mellom JSON-filene er nødvendig. Den genererte canonical-filen og de innebygde glosetabellene skal ikke redigeres separat.

`npm run check:vocabulary` kontrollerer uten å skrive at alle genererte data følger review-filen. Den inngår først i `npm run test:all` og CI, slik at en glemt generering oppdages. En fjernet oppføring som fortsatt er referert av nivåtestens ordkatalog stopper byggingen med beskjed om hvilken referanse som må fjernes eller erstattes. Standardgloser bruker bare svar som står i review-filen; automatisk gjettede bøyninger legges ikke til. Gloseøving, Dagens quiz og Lingo Links deler samme svarvurdering. Egne og lærerimporterte gloser beholder sin egen fasit. Verb-, grammatikk- og lytteoppgaver har egne oppgavekataloger.

Standardkort får en stabil `canonicalId` uten å endre elevens kort-ID eller fremgang. Når et slikt ord fjernes, arkiveres kortet utenfor øvingen, men beholdes i samme lokale lagringsarray og i vanlig sikkerhetskopi. Den tidligere standardglosen «sjokoladedrikk / el Cola Cao» gjenkjennes også fra gamle sikkerhetskopier uten `canonicalId`. Egne/lærerimporterte ord beholdes. Arkiverte ID-er gjenbrukes ikke; et ord som gjeninnføres med samme canonical-ID får sin lagrede fremgang tilbake. Ukjente, umerkede gloser slettes ikke ved gjetning.

Review-filen ble lærergjennomgått 2026-09-09: blant annet rettelse av «allehelgensdagen» til «el Día de Todos los Santos», «loft» til «el ático», personlig «a» i «visitar a mi abuela», ny kategori «Mat og drikke», og fjerning av de 15 verbbøying-kortene (verbbøying øves via verbmodulen).

Kjør lokal rapport med `npm run audit:curriculum`. `npm run audit:approved` eksporterer forslag til gjennomgang; ønskede svar legges i review-filen før bygging. De eldre kommandoene `npm run audit:apply -- --apply` og `npm run generate:vocabulary-canonical` synkroniserer nå også fra review-filen og kan ikke hente tilbake svar fra en eldre nettside eller auditrapport. Vanlig audit har ingen nettverkskall. Kilderegisteret og oppdatering av snapshots er en separat utviklerprosess.

Etter bygging og tester må den verifiserte endringen committes og leveres til GitHub Pages-grenen `main`. Push til en arbeidsgren oppdaterer ikke nettsiden. Kontroller publisert bygg-ID og fasit etter publisering.

## 📁 Filstruktur

```
├── index.html              # Hovedapp (alt-i-ett)
├── eksempel-gloser-laerer.json # Mal for lærerimport
├── manifest.webmanifest    # PWA-metadata
├── sw.js                   # Lokal/offline cache
├── dist/tailwind.css        # Bygd stilark
├── audio/diktat/            # Diktatlyd med opprinnelige filnavn
├── audio/lyttehistorier/    # Selvstendige lyttehistorier
├── PILOT.md                # Første 20 minutter og menneskelig prøve
└── README.md
```

## 📥 Importere fremgang

Elever kan importere fremgang fra:
- ✅ Denne appen (eksportert JSON)
- ✅ Gammel "Spansk Gloselæring"-app (appVersion: spansk_v1)

**Slik gjør du:**
1. I gammel app: Eksporter fremgang → Last ned JSON
2. I ny app: Startskjerm eller Lekse-fanen → "Importer fremgang"
3. Velg filen → Ferdig!

## ⌨️ Hurtigtaster

| Tast | Funksjon |
|------|----------|
| `Mellomrom` / `Enter` | Snu kort (gloser) |
| `1` | Igjen (feil) |
| `2` | Bra (riktig) |
| `Enter` | Sjekk svar (verb) |
| Hold `a/e/i/o/u/n` | Aksent (á/é/í/ó/ú/ñ) |
| Hold `?` / `!` | Spansk tegn (¿/¡) |

## ❓ FAQ

**Q: Hva skjer hvis eleven bytter nettleser/enhet?**  
A: De må eksportere fremgang fra gammel enhet og importere på ny.

**Q: Kan eleven bruke appen på mobil?**  
A: Ja! Appen fungerer på mobil. Fremgang lagres per nettleser.

**Q: Hva hvis eleven sletter nettleserdata?**  
A: Fremgangen forsvinner. Oppfordre til jevnlig eksport.

## 🤝 Bidra

Pull requests er velkomne! For store endringer, åpne gjerne en issue først.

## 📄 Lisens

MIT License - bruk fritt i undervisning!

## 🙏 Kreditt

- Spaced repetition basert på SM-2 algoritmen
- Bygget for norske spanskelever

---

**Spørsmål?** Åpne en [issue](https://github.com/TheVikLink/spansk-ungdomsskole/issues)

### Første undervisningsøkt og dagens oppsummering

Start viser Dagens quiz og «Repeter gloser», med antall ord som er klare for repetisjon. Hvert ord telles én gang selv om begge øvingsretninger er klare. «Start repetisjon» åpner opptil 50 oppgaver fra repetisjonskøen, på tvers av kategorier. Når køen er tom, er knappen deaktivert. Hovedknappen for quizen starter nivåtesten hvis den ikke er gjennomført.

Lærerintroduksjonen vises ikke lenger på velkomstsiden eller Start. Artikkelforklaringen (el/la/los/las) finnes under Grammatikk. [PILOT.md](PILOT.md) beskriver fortsatt mål, støtte, utfordring og avslutning for lærerens utprøving.

Lekser → «Vis dagens oppsummering» fungerer fra første dag. Ukemålet sperrer ikke visning. Rapporten åpnes lokalt uten automatisk utskrift eller innsending; eleven velger selv utskrift/PDF ved behov. Start viser dagens besvarte gloser, verb, grammatikk og blandet quiz samt ferdig forsøkt diktat.

### Målrettet øving og spillstøtte

Vanlig verbtrening oppdaterer ferdighetskartet for de relevante presensmålene. Isolert bøying av modalverb dokumenterer ikke bruk sammen med infinitiv, og fremtidsformer teller ikke som presens. Regelrette grupper trenger riktige svar på minst seks ulike former, minst to verb og tre personer før de kan gi et sterkt kartresultat eller oppgavemerke. Dette er en forsiktig produktregel, ikke en validert mestringsterskel. Gamle sikkerhetskopier mangler dette variasjonsgrunnlaget og gir ikke automatisk et bredt verbmerke.

Nye stjerner vises med korte temanavn på quiz-, grammatikk- og verbresultater: **bronse fra 50 %, sølv fra 75 %, gull fra 90 % og diamant ved 100 %**. Scoren er andelen riktige blant de siste 20 vurderte svarene i temaet, med minst ti svar før en stjerne. Variasjonskravene for verb gjelder i tillegg. Diamant krever at alle svar i dette vinduet er riktige; gamle feil kan erstattes av nyere øving. Aksentfeil og nesten riktige svar teller ikke som riktige i stjernescore. Dette er et øvingsresultat, ikke KwizIQs confidence-modell eller en validert mestringsprosent.

Klikk på en stjerne, eller bruk Tab og Enter, for å se mål og svargrunnlag. «Om stjernene» viser skalaen. Bare nye eller høyere nivåer varsles; opptjente belønninger beholdes ved senere feil. Gamle grå merker beholdes som tidligere merker uten å tilordnes en oppdiktet prosent. Et separat grønt merke med gåfigur viser sammenhengende dager med minst én fullført quiz. Flere quizer samme dag øker ikke antall dager, og rekken vises som inaktiv når en hel dag hoppes over. Forklaringen kan åpnes fra merket.

Det valgfrie feltet `learningProgress.skillProgress[id].starResults` inneholder høyst 20 boolske riktig/feil-verdier. Ingen svartekst, nye tidsstempler eller personopplysninger legges til. Feltet følger eksisterende lokale lagring, eksport/import og sletting. Eldre filer uten feltet beholder summer og tidligere merker; stjernegrunnlaget bygges fra nye svar. Nivå-ID-er som `star:gold:<skillId>` lagres i samme liste som tidligere `mastery:<skillId>`-merker, med samme schemaVersion 1. Gamle ID-er slettes ikke, og gjentatt import gir ikke nye kopier av belønningene.

Den eksisterende lokale `learningProgress.skillProgress` kan ha `verbForms`, en begrenset liste med oppgavereferanser som `hablar:0`. Ingen råsvar lagres i feltet. Det følger fremgangseksport/import og slettes med fremgangen. En feil på formen fjerner den fra listen over riktige former. Målrettede runder unngår allerede valgte former så lenge det finnes nye i samme sidebesøk; dette utvalgsminnet forsvinner ved omlasting. Støttet øving ber om verbformen, mens sterke tidligere svar gir en runde med personord og verbform.

Lingo Links tilbyr fire starttemaer, lærerens valg av fire temaer eller bare tidligere øvde ord. Et for lite utvalg gir beskjed uten å fylle på med ukjente ord. Etter et gruppeforsøk kan eleven vise betydningen av de fire ordene. Etter brettet følger to ord som skal skrives uten brettet. Setningspuslespillet tilbyr en forklart plassering etter et forsøk. Disse spillenes svar og etteroppgaver lagres bare i minnet mens aktiviteten er åpen.

### Samlet verifikasjon

`npm run build:app` bygger CSS og felles versjonsmerke. `npm run test:all` kontrollerer innhold, kataloger, leksjoner og offline-bygg og kjører alle lokale nettleserregresjoner, inkludert `report-*.spec.js`. De tre manuelle auditopptakene/deploy-probene kjøres separat; offentlig versjon testes først etter autorisert publisering.
