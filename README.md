# 🇪🇸 Spansk på 1-2-3

En gratis, interaktiv læringsapp for spansk på ungdomsskolenivå (A0-A1 CEFR). Bygget for norske elever som bruker læreboken "Spansk på 1-2-3".

**[🚀 Prøv appen](https://theviklink.github.io/spansk-ungdomsskole/)**

![Skjermbilde av appen](screenshot.png)

## ✨ Funksjoner

### 📚 Gloselæring
- **443 gloser** fra Spansk på 1-2-3 pensum
- Spaced repetition (SM-2 algoritme) for effektiv læring
- Lær begge veier: Norsk → Spansk og Spansk → Norsk
- Kategorisert etter tema (familie, mat, dyr, farger, osv.)
- Legg til egne gloser eller importer fra lærer

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

### 👩‍🏫 Klassesystem (for lærere)
- Opprett klasse med delbar kode
- Se elevenes fremgang i sanntid
- Push nye gloser til hele klassen
- Importer gloser fra JSON-fil

## 🛠️ Teknisk oppsett

### Enkel bruk (ingen server)
Last ned `spansk-laering-v3.html` og åpne i nettleser. Alt fungerer med lokal lagring (localStorage).

### Med sky-synkronisering (Supabase)

1. **Opprett Supabase-prosjekt**
   - Gå til [supabase.com](https://supabase.com) og lag et gratis prosjekt
   - Velg EU-region for GDPR-compliance

2. **Kjør database-oppsett**
   - Gå til SQL Editor i Supabase
   - Kjør innholdet fra `supabase-setup.sql`

3. **Oppdater API-nøkler**
   - Finn dine nøkler under Settings → API
   - Erstatt `SUPABASE_URL` og `SUPABASE_ANON_KEY` i HTML-filen

4. **Deploy**
   - GitHub Pages: Push til repo, aktiver Pages i Settings
   - Netlify: Dra og slipp HTML-filen
   - Egen server: Last opp filen

## 📁 Filstruktur

```
├── spansk-laering-v3.html    # Hovedapp (alt-i-ett)
├── supabase-setup.sql        # Database-oppsett
├── eksempel-gloser-laerer.json # Mal for lærer-import
└── README.md
```

## 📥 Importere gloser (for lærere)

Lag en JSON-fil i dette formatet:

```json
{
  "category": "kapittel-5-mat",
  "words": [
    ["eple", "la manzana"],
    ["appelsin", "la naranja"],
    ["banan", "el plátano"]
  ]
}
```

Last opp via "Importer gloser" i lærer-dashboardet.

## ⌨️ Hurtigtaster

| Tast | Funksjon |
|------|----------|
| `Mellomrom` / `Enter` | Snu kort (gloser) |
| `1` | Igjen (feil) |
| `2` | Bra (riktig) |
| `Enter` | Sjekk svar (verb) |
| Hold `a/e/i/o/u/n` | Aksent (á/é/í/ó/ú/ñ) |

## 🔒 Personvern

- Ingen persondata samles inn utover det som lagres i appen
- Elevkoder er anonyme (6 tegn, f.eks. "ABC123")
- All data kan slettes ved å logge ut
- Appen fungerer fullt ut offline

## 🤝 Bidra

Pull requests er velkomne! For store endringer, åpne gjerne en issue først.

### Lokalt utviklingsmiljø
```bash
git clone https://github.com/TheVikLink/spansk-ungdomsskole.git
cd spansk-ungdomsskole
# Åpne spansk-laering-v3.html i nettleser
```

## 📄 Lisens

MIT License - bruk fritt i undervisning!

## 🙏 Kreditt

- Ordliste basert på "Spansk på 1-2-3" pensum
- Spaced repetition basert på SM-2 algoritmen
- Bygget med ❤️ for norske spanskelever

---

**Spørsmål?** Åpne en [issue](https://github.com/TheVikLink/spansk-ungdomsskole/issues) eller kontakt utvikleren.
