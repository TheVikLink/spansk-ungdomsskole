# 🇪🇸 Spansk på 1-2-3

En gratis, interaktiv læringsapp for spansk på ungdomsskolenivå (A0-A1 CEFR). Bygget for norske elever og kan brukes uten innlogging.

**[🚀 Prøv appen](https://theviklink.github.io/spansk-ungdomsskole/)**

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
- 9 grammatikktemaer med målrettet øving, blant annet:
  - Artikler (el/la/un/una)
  - Adjektivsamsvar
  - Ser vs Estar
  - Gustar
  - Refleksive verb
  - Pekende adjektiv
  - Eiendomsord
- Teori vises automatisk ved behov
- Sju korte grammatikkleksjoner med vei fra resultat til forklaring og ny øving
- Resultater beskriver besvarte oppgaver; de er ikke en validert mestringsvurdering

### 🧠 Brainmap
- Visuell oversikt over A0- og A1-mikroskills og ordforråd
- Mikroskills er gruppert etter nivå og språkområde
- Fargekoding: grå (ikke startet), rød (trenger øving), gul (på vei), grønn/gull (gode/sterke svar på øvde oppgaver)
- Ferdigheter uten ferdig øvingsrute vises åpent som planlagt innhold og skjules ikke som om de var mestret
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

Kjør `npm run build:app` og `npm run check:offline-build` før levering. Publiser `index.html`, `dist/tailwind.css`, `sw.js`, `manifest.webmanifest`, `PILOT.md` og de tilhørende `audio/diktat/`-mappene sammen på GitHub Pages, Netlify eller skolens HTTPS-server. Bare HTML-filen er ikke tilstrekkelig. Bevar relative stier, aksenter og mellomrom i lydfilnavn. Lokal åpning av HTML-filen fungerer med CSS- og lydmappene ved siden av, men installasjon og nettleserens offline-cache krever HTTPS eller localhost.

Byggkommandoen gir HTML og service worker samme innholdsstyrte versjon. Etter oppdatering får en åpen app beskjed om at en ny versjon er klar. Eleven avslutter økten og velger «Last inn oppdateringen»; aktivt svar tømmes ikke automatisk. En eldre v4-installasjon kan trenge én ekstra omlasting etter at den nye service workeren er hentet. Fremgang ligger i lokal lagring og slettes ikke ved oppdatering.

### Lyd uten nett

Appskallet lagres separat fra lyd. Åpne en historie i Lytteøvelser på nett og velg «Last ned lyd til bruk uten nett». Vent på bekreftelsen om at hele historien er lastet ned. Test deretter uten nett på samme enhet. Deler som mangler eller en avbrutt nedlasting gir en tydelig beskjed; Start/Sjekk svar venter på tilgjengelig lyd. Nettleseren kan slette cache ved plassmangel, så sjekk før timen.

Diktat viser hvor mange deler eleven faktisk skrev et svar til og hvor mange som stemte med fasiten. Tom gjennomgang gir ikke fullføringsregistrering. Bare historie-ID og lokal fullføringsdato lagres når alle deler er forsøkt; ny gjennomføring på en annen dag bevares uten doble datoer ved import. Elevteksten og avspilt lyd lagres ikke som elevdata. Fysisk lydkvalitet og uttale må fortsatt prøves med lærer og elever.

## 📚 Innhold og rettigheter

Ikke importer eller del skannede læreboksider, uttrukket forlagsinnhold eller annet materiale du ikke har rettigheter til. Kapittelimporten er ment for lærerens egne ordlister og manuelt godkjent innhold.

### Utvikleraudit av svarvarianter

Repoet har en offline audit-pipeline for å finne mulige norske/spanske svarvarianter. Kildeuttrekk legges i `scripts/audit-sources/snapshots/` bare når lisensen tillater lokal lagring, og må ha provenance, lisens og hash. Kildene brukes kun til forslag; en utvikler/lærer må sette `status` til `approved` før en variant kan legges i appens svaralternativer. `tradere` og lignende kandidater skal derfor kunne stå som `false_positive` uten å påvirke elevfasiten.

Hele ordlisten og fasiten for begge retninger føres i [`data/vocabulary-canonical.json`](data/vocabulary-canonical.json). Rediger `norsk`, `spansk`, `kategori` eller svarlistene `svar.es-no`/`svar.no-es` direkte. Kjør deretter `npm run audit:apply -- output/curriculum-audit-report.json --apply` for å oppdatere `index.html`.

Kjør lokal rapport med `npm run audit:curriculum`. Etter automatisk klassifisering kan godkjente kandidater eksporteres med `npm run audit:approved` og legges inn med `npm run audit:apply -- --apply`. Kommandoen bruker kun `auto_approved`/`approved`, og bevarer eksisterende canonical answers. Vanlig audit har ingen nettverkskall. Kilderegisteret og nettverksbasert oppdatering av snapshots er en separat utviklerprosess og skal ikke kjøres fra elevens nettleser.

## 📁 Filstruktur

```
├── index.html              # Hovedapp (alt-i-ett)
├── eksempel-gloser-laerer.json # Mal for lærerimport
├── manifest.webmanifest    # PWA-metadata
├── sw.js                   # Lokal/offline cache
├── dist/tailwind.css        # Bygd stilark
├── audio/diktat/            # Lydfiler med opprinnelige filnavn
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

Velkomstsiden og Start har «For læreren: første 20 minutter», med direkte vei til bestemte artikler (el/la/los/las). [PILOT.md](PILOT.md) beskriver mål, støtte, utfordring og avslutning. Hovedknappen starter nivåtesten hvis den ikke er gjennomført.

Lekser → «Vis dagens oppsummering» fungerer fra første dag. Ukemålet sperrer ikke visning. Rapporten åpnes lokalt uten automatisk utskrift eller innsending; eleven velger selv utskrift/PDF ved behov. Start viser dagens besvarte gloser, verb, grammatikk og blandet quiz samt ferdig forsøkt diktat.

### Målrettet øving og spillstøtte

Vanlig verbtrening oppdaterer ferdighetskartet for de relevante presensmålene. Isolert bøying av modalverb dokumenterer ikke bruk sammen med infinitiv, og fremtidsformer teller ikke som presens. Regelrette grupper trenger riktige svar på minst seks ulike former, minst to verb og tre personer før de kan gi et sterkt kartresultat eller oppgavemerke. Dette er en forsiktig produktregel, ikke en validert mestringsterskel. Gamle sikkerhetskopier mangler dette variasjonsgrunnlaget og gir ikke automatisk et bredt verbmerke.

Nye oppgavemerker vises som grå stjerner med korte temanavn på quizresultatet. Klikk på en stjerne, eller bruk Tab og Enter, for å lese hele målet. Opptjening følger fortsatt minst tre forsøk og øvingsstyrke minst fire av fem, samt variasjonskravene for verb. Stjernene er historiske belønninger for øving; styrken er ikke en beregnet confidence-prosent. Tidligere opptjente merke-ID-er og eksport/import beholdes. Et separat grønt merke med gåfigur viser sammenhengende dager med minst én fullført quiz. Flere quizer samme dag øker ikke antall dager, og rekken vises som inaktiv når en hel dag hoppes over. Forklaringen kan åpnes fra merket.

Den eksisterende lokale `learningProgress.skillProgress` kan ha `verbForms`, en begrenset liste med oppgavereferanser som `hablar:0`. Ingen råsvar lagres i feltet. Det følger fremgangseksport/import og slettes med fremgangen. En feil på formen fjerner den fra listen over riktige former. Målrettede runder unngår allerede valgte former så lenge det finnes nye i samme sidebesøk; dette utvalgsminnet forsvinner ved omlasting. Støttet øving ber om verbformen, mens sterke tidligere svar gir en runde med personord og verbform.

Lingo Links tilbyr fire starttemaer, lærerens valg av fire temaer eller bare tidligere øvde ord. Et for lite utvalg gir beskjed uten å fylle på med ukjente ord. Etter et gruppeforsøk kan eleven vise betydningen av de fire ordene. Etter brettet følger to ord som skal skrives uten brettet. Setningspuslespillet tilbyr en forklart plassering etter et forsøk. Disse spillenes svar og etteroppgaver lagres bare i minnet mens aktiviteten er åpen.

### Samlet verifikasjon

`npm run build:app` bygger CSS og felles versjonsmerke. `npm run test:all` kontrollerer innhold, kataloger, leksjoner og offline-bygg og kjører alle lokale nettleserregresjoner, inkludert `report-*.spec.js`. De tre manuelle auditopptakene/deploy-probene kjøres separat; offentlig versjon testes først etter autorisert publisering.
