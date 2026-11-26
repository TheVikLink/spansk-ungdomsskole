# Besøksstatistikk (Vercel Web Analytics)

Status: oppdatert 26. november 2026.

## Formål og omfang

Spansk på 1-2-3 bruker Vercels HTML-integrasjon av Web Analytics (`window.va` kø + `/_vercel/insights/script.js`) på de offentlige flatene på `https://www.spansk123.no`:

- Øvingsappen på `/` (`index.html`)
- Undervisningsportalen og alle 46 undervisningsoppleggene under `/undervisning/` (`undervisning/analytics.js`, lastet på `/undervisning/index.html`, `<id>/index.html` og `<id>/elev.html`)

Følgende ruter utelukkes alltid både fra lasting og `beforeSend`: `/school`, `/auth/`, `/api/`, samt `localhost`, preview-domener og `file://`.

## Anonyme egendefinerte hendelser (custom events)

I tillegg til anonyme sidevisninger sendes kun tre tillatte hendelser fra `/undervisning/`:

1. `pdf_download` med `{ lesson, file }` når en `.pdf`-lenke på `/undervisning/` klikkes.
2. `audio_play` med `{ lesson, file }` første gang et `<audio>`-element med `.mp3` spilles av på en undervisningsside eller elevside.
3. `license_activate` med `{ type: "demo" | "school" }` ved vellykket `POST /api/license/activate`.

## Dataminimering og personvern

- `beforeSend` normaliserer `event.url` til `origin + pathname` (alle queryparametere som `?kode=`, `?elev=`, `?laerer=`, `?fbclid=` og `#...` fjernes), avviser blokkerte stier og filtrerer hendelser til kun allowlisten over.
- Ingen elevsvar, navn, lokale profiler, fremgangsdata, taleopptak, IP-adresser eller rå lisens-/elevkoder sendes.
- Scriptet `/_vercel/insights/script.js` lastes bare på offentlig HTTPS (`www.spansk123.no` / `spansk123.no`) og hoppes over ved `Global Privacy Control`, `Do Not Track = 1`, offline nettleser eller `__va_attribution` i `localStorage`.
- `sw.js` sender `/_vercel/` utenom offline-cachen slik at verken service worker eller offline-tester påvirkes.
- Public informasjonsside: `/besoksstatistikk.html` (servert fra `src/visitor-analytics-privacy.html` i `server/vercel-app.js`, lenket fra `/` og `/undervisning/index.html`).
- Merk: `src/visitor-analytics.js` og tilhørende `build-vercel-public.mjs` opt-in-flagg holdes uendret slik at eksisterende regresjonstester fortsatt består.

## Tilgang, lagring og styring

- Kun prosjektets administratorer i Vercel har tilgang til aggregert statistikk i Vercel Dashboard -> Analytics.
- Vercel mottar IP-adresse og User-Agent transient ved HTTP-kall til `/_vercel/insights/*` og oppgir aggregert lagring uten IP-adresser og døgnrotert besøks-hash (opptil 24 timer).
- Ved å deaktivere Web Analytics i Vercel Dashboard eller fjerne script-lastingen stopper innsamlingen umiddelbart.
