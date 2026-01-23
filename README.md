# 🇪🇸 Spansk på 1-2-3

En gratis, interaktiv læringsapp for spansk på ungdomsskolenivå (A0-A1 CEFR). Bygget for norske elever som bruker læreboken "Spansk på 1-2-3".

**[🚀 Prøv appen](https://theviklink.github.io/spansk-ungdomsskole/)**

## ✨ Funksjoner

### 📚 Gloselæring
- **443 gloser** fra Spansk på 1-2-3 pensum
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
- Lever ukeslekse via Google Forms
- Krav: Øv minst 2 dager (ons-søn) per uke

## 🔒 Personvern

- **Ingen data sendes til skyen** - all fremgang lagres lokalt i nettleseren
- Ingen innlogging eller brukerkontoer
- Elevene kan eksportere/importere fremgang som JSON-fil
- GDPR-vennlig for norske skoler

## 🛠️ Oppsett for lærere

### 1. Sett opp ukeslekse-system

1. Gå til [script.google.com](https://script.google.com)
2. Opprett nytt prosjekt og lim inn innholdet fra `ukeslekse-setup.gs`
3. Kjør funksjonen `createHomeworkSystem`
4. Godkjenn tillatelser
5. Kopier entry IDs fra loggen (Vis → Logger)

### 2. Oppdater appen

Erstatt disse linjene i `index.html` (rundt linje 1917):

```javascript
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/DIN_FORM_ID/viewform';
const FORM_ENTRY_NAME = 'entry.XXXXXX';
const FORM_ENTRY_DATE = 'entry.XXXXXX';
const FORM_ENTRY_DAYS = 'entry.XXXXXX';
const FORM_ENTRY_WORDS = 'entry.XXXXXX';
const FORM_ENTRY_ACCURACY = 'entry.XXXXXX';
```

### 3. Deploy

Last opp `index.html` til GitHub Pages, Netlify, eller skolens server.

## 📁 Filstruktur

```
├── index.html              # Hovedapp (alt-i-ett)
├── ukeslekse-setup.gs      # Google Apps Script for leksesystem
├── eksempel-gloser.json    # Mal for glose-import
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

Etter oppsett finner du alle ukeslekse-innleveringer i Google-regnearket.

**Bonusfunksjoner i Apps Script:**
- `checkMissingSubmissions()` - Se hvem som ikke har levert
- `setupWeeklyReminder()` - Få ukentlig e-post med oversikt

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

- Ordliste basert på "Spansk på 1-2-3" pensum
- Spaced repetition basert på SM-2 algoritmen
- Bygget med ❤️ for norske spanskelever

---

**Spørsmål?** Åpne en [issue](https://github.com/TheVikLink/spansk-ungdomsskole/issues)
