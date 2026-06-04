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
- Kan kobles til et læreradministrert Google Forms-skjema hvis skolen/læreren har gjort en egen personvernvurdering
- Krav: Øv minst 2 dager (ons-søn) per uke

## 🔒 Personvern

- **Ingen data sendes til skyen i standardoppsettet** - all fremgang lagres lokalt i nettleseren
- Ingen innlogging eller brukerkontoer
- Elevene kan eksportere/importere fremgang som JSON-fil
- Ukeslekse viser en lokal oppsummering som standard. Ekstern innlevering må konfigureres eksplisitt av lærer/skole.
- GDPR-vennlig for norske skoler

## 🛠️ Oppsett for lærere

### 1. Bruk standard lokal pilotflyt

For demo og første klassepilot trenger du bare GitHub Pages-lenken. Elevene skriver elevkode eller fornavn, øver lokalt og kan laste ned fremgang som JSON-fil. Leksefanen viser en lokal oppsummering, men sender ingenting.

### 2. Valgfritt: Koble til ekstern innlevering

Standardoppsettet sender ikke lekseinnleveringer. Hvis skolen vil bruke Google Forms eller et annet system, må læreren/skolen først lage et godkjent skjema og kopiere URL og felt-ID-er derfra.

Før dette brukes med elever, dokumenter hva som sendes, hvorfor, hvem som har tilgang, sletting/retensjon og hvordan elever kan få eksportert data.

### 3. Oppdater appen

Erstatt disse linjene i `index.html`:

```javascript
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/DIN_FORM_ID/viewform';
const FORM_ENTRY_NAME = 'entry.XXXXXX';
const FORM_ENTRY_DATE = 'entry.XXXXXX';
const FORM_ENTRY_DAYS = 'entry.XXXXXX';
const FORM_ENTRY_WORDS = 'entry.XXXXXX';
const FORM_ENTRY_ACCURACY = 'entry.XXXXXX';
```

### 4. Deploy

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

## 📊 For lærere: Se innleveringer

Standardoppsettet sender ikke innleveringer. Hvis du har konfigurert et valgfritt Google Forms-oppsett, finner du innleveringer i lærerens Google-regneark.

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
