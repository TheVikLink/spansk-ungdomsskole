# 🇪🇸 Spansk på 1-2-3

En gratis, interaktiv læringsapp for spansk på ungdomsskolenivå (A0-A1 CEFR). Bygget for norske elever og kan brukes uten innlogging.

**[🚀 Prøv appen](https://theviklink.github.io/spansk-ungdomsskole/)**

## ✨ Funksjoner

### 📚 Gloselæring
- **443 gloser** på ungdomsskolenivå
- Spaced repetition (SM-2 algoritme) for effektiv læring
- Lær begge veier: Norsk → Spansk og Spansk → Norsk
- Kategorisert etter tema (familie, mat, dyr, farger, osv.)
- Importer gloser fra JSON-fil

### 🏃 Verbøving
- 20+ vanlige spanske verb
- Tre tider: Presens, Futuro (ir a + infinitiv), Presens perfektum
- Fullstendig bøyingstabell ved feil svar
- Hint-funksjon

### 📖 Grammatikk
- 7 grammatikktemaer med adaptive øvelser:
  - Artikler (el/la/un/una)
  - Adjektivsamsvar
  - Ser vs Estar
  - Gustar
  - Refleksive verb
  - Pekende adjektiv
  - Eiendomsord
- Teori vises automatisk ved behov
- Mestringsbadges ved 80%+ korrekt

### 🧠 Brainmap
- Visuell oversikt over all læring
- Fargekoding: grønn (mestret), gul (i læring), grå (ny)

### 📝 Ukeslekse
- Sporer øvingsdager automatisk
- Lager lokal lekseoppsummering uten å sende data
- Krav: Øv minst 2 dager per uke
- Spesifikke gloser kan deles med elever som lærerimport, og en tydeligere leksepakke-flyt er planlagt før bred skolepilot

## 🔒 Personvern

- **Ingen data sendes til skyen i standardoppsettet** - all fremgang lagres lokalt i nettleseren
- Ingen innlogging eller brukerkontoer
- Elevene kan eksportere/importere fremgang som JSON-fil
- Ukeslekse viser en lokal oppsummering som kan skrives ut eller lagres som PDF. Det finnes ingen ekstern innlevering i pilotversjonen.
- Elever blir ikke lagt inn i en felles klasse, og standardversjonen har ingen sentral lærerinnboks.
- Personvernoppsettet er laget for en lokal pilot. Feide, skolekontoer og eventuell sentral datalagring krever en egen data- og personvernmodell.

### 📢 Tilbakemeldinger på oppgaver

Elever kan melde inn når de mener et svar er feilvurdert ved å klikke «Jeg mener svaret mitt er riktig» etter feil svar. Innspillet lagres **bare lokalt** på enheten.

- **Anonym som standard** – eleven må aktivt velge å signere med elevkode.
- **Lærer kan eksportere** alle innspill som JSON-fil fra Innstillinger → Tilbakemeldinger.
- **Send JSON-filen til utvikler** for gjennomgang og oppdatering av ordlisten.
- Ingen data sendes automatisk til noen server.
- Advarsel i dialogen: «Skriv ikke navn på andre elever.»

## 🎒 Skolestartpilot

Målet for første pilot er å gi spansklærere et lavterskel supplement til undervisningen uten innlogging, elevkontoer eller sentral datalagring.

- Gratis pilot i 2-4 uker for utvalgte lærere/skoler
- Foreslått tidlig skolelisens etter pilot: 3 000-4 000 kr per skole per år
- Best egnet for gloser, repetisjon, verb, grammatikk og korte øvingsøkter i eller mellom timer
- Feide, lærerinnlogging og skole-/kommuneadministrasjon vurderes som en senere fase etter egen personvern- og datamodell

Se [PILOT.md](PILOT.md) for ferdig lærerpitch, tre pilotaktiviteter, personvernforklaring, evalueringsspørsmål og pilotens suksesskriterier.

## 🛠️ Oppsett for lærere

### 1. Bruk standard lokal pilotflyt

For demo og første klassepilot trenger du bare GitHub Pages-lenken. Elevene skriver elevkode eller fornavn, øver lokalt og kan laste ned fremgang som JSON-fil. Leksefanen viser en lokal oppsummering, men sender ingenting.

Standardversjonen har ikke en felles klasse som elevene blir meldt inn i. Hvis en lærer vil bruke egne gloser, deler læreren en JSON-fil basert på `eksempel-gloser-laerer.json`, og eleven importerer filen lokalt i appen.

### 2. Deploy

Last opp `index.html` til GitHub Pages, Netlify, eller skolens server.

## 📚 Innhold og rettigheter

Ikke importer eller del skannede læreboksider, uttrukket forlagsinnhold eller annet materiale du ikke har rettigheter til. Kapittelimporten er ment for lærerens egne ordlister og manuelt godkjent innhold.

## 📁 Filstruktur

```
├── index.html              # Hovedapp (alt-i-ett)
├── eksempel-gloser-laerer.json # Mal for lærerimport
├── manifest.webmanifest    # PWA-metadata
├── sw.js                   # Lokal/offline cache
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
