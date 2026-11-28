---
name: spansk123-word-audio
description: >-
  Use when exporting word lists for Luvvoice (es-ES), splitting downloaded batch MP3s
  with ffmpeg silence detection, or registering/syncing static single-word audio in
  data/approved-word-audio.json and index.html.
---

# Spansk på 1-2-3 – statisk ordlyd (`es-ES`)

Arbeidsflyt for forhåndsgenererte enkeltord-opptak (Luvvoice web-UI i standard europeisk spansk `es-ES`). Aldri bruk nettleser- eller OS-TTS (`speechSynthesis`, `say`), og endre aldri de 62 Refold-opptakene eller `data/pronunciation-audio-manifest.json`.

## Steg

1. **Eksporter tekstbolker fra kanonisk gloseliste (`data/vocabulary-canonical-review.json`):**
   - Bruk `npm run export:word-audio-batches` for standard eksport (100 ord i bolker på 50), eller tilpass med `--limit`, `--batch-size`, `--start-batch` og `--prefix`.
   - Behold artikkel (`el`/`la`) i teksten slik at uttalen matcher glosekortene. Skriptet avslutter linjer uten tegn med punktum (`.`) og bruker tomt linjeskift (`\n\n`) mellom ord for stabil stillhetsdeteksjon.
   - Eksportskriptet hopper automatisk over ord som allerede er registrert i `data/approved-word-audio.json` (inkludert normaliserte duplikater).

2. **Verifiser nedlastede MP3-filer mot `output/word-audio-batches/manifest.json` før klipping:**
   - **Stol aldri på filnavn eller nedlastingsrekkefølge i `~/Downloads`** (flere bolker lastes ofte ned i vilkårlig eller omvendt rekkefølge).
   - Kjør tørrkjøring (`--dry-run`) og sjekk både eksakt antall stille-separerte segmenter og lengdekorrelasjon mellom talesegmentenes varighet og `item.spansk.length` når flere bolker har likt ordantall (f.eks. 100 og 100).

3. **Klipp, normaliser og registrer:**
   ```bash
   node scripts/split-word-audio-batch.mjs --input ~/Downloads/<fil>.mp3 --batch <batchId>
   ```
   - Skriptet bruker `ffmpeg silencedetect` + `loudnorm=I=-16:TP=-1.5:LRA=11`, legger filene under `audio/ord/<ascii-slug>.mp3`, oppdaterer `data/approved-word-audio.json` (uten å røre `refold-v1`) og synkroniserer `APPROVED_WORD_AUDIO_OVERRIDES` i `index.html`.
   - Kontroller varighet med `ffprobe` på representative klipp (> 0,2s).

4. **Spor nye filer for `tests/audio-paths.test.mjs` og verifiser:**
   - Kjør `git add -N audio/ord` før du tester, siden `tests/audio-paths.test.mjs` kontrollerer `data/approved-word-audio.json` mot `git ls-files -z -- audio/`.
   - Kjør `npm run build:app && npm run check:fast` og Playwright-testene `tests/audit-followups.spec.js` og `tests/tts.spec.js`.
   - Merk at `scripts/check-content-quality.mjs` normaliserer bort ASCII-stier av typen `audio/ord/<slug>.mp3` slik at aktsentfrie filnavn (f.eks. `veintiseis.mp3`) ikke utløser aksentfeil mens visningstekst fortsatt sjekkes.
