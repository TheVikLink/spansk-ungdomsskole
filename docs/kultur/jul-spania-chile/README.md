# Jul i Spania og Chile – lokal undervisningsprøve

Arbeidsutkast, revidert 7. oktober 2026 med ni UX-korrigeringer etter produkteierens tilbakemelding. De to originale spanske tekstene har 239 ord (Spania) og 234 ord (Chile), hver i seks avsnitt. Landene har ulike fiktive familier i de genererte bildene. Bildene er revidert til et nøkternt fotografisk uttrykk, med måltidet i fokus og familiemedlemmene opptatt med å servere. [Fotoprotokollen](../fotografiske-bilder.md) dokumenterer gjeldende motiver; tidligere maleriske familieportretter er historiske. Klasseflyten er lesing høyt og muntlig oversettelse i par, spørsmål, sammenligning og gloseøving. Lærerens forslag varer 45 minutter; språk-, kultur- og nivågjennomgang samt klasseromsprøve gjenstår.

Åpne [elevøkten](index.html) eller [lærerveiledningen](laerer.html). I begge landseksjonene ligger teksten i en sentrert kolonne på maksimalt 70ch under bildet. «Start lesingen» og «Les · Spørsmål · Samtale · Gloser» knytter delene sammen; spørsmålene har retur til riktig landstekst. Tekstordlistene og ordlistepilene er fjernet fra nettsiden; eleven bruker ordoppslag direkte i teksten.

Produkteieren har valgt denne reviderte pakken som utgangspunkt for kommende kulturopplegg. [Malen for kulturopplegg](../mal-for-kulturopplegg.md) dokumenterer arbeidsformen som skal gjenbrukes i blant annet Mundo AM, Semana Santa og historieopplegg. Den bruker dagens lesevisning og oppgavetyper; de tidlige konseptvariantene er ikke mal for nye pakker.

Understrekede ord og uttrykk i teksten gir norsk oversettelse ved pek, tastaturfokus eller trykk. Klikk/trykk holder forklaringen åpen; nytt trykk, utenfortrykk, Escape eller «Lukk» lukker den. Forklaringen ligger ved ordet og holdes innenfor skjermen. Hele uttrykk prioriteres fremfor enkeltord. De 27 eksplisitte tekstformene i `readingGlossary[].textForms` har kontekstoversettelser der tekstformen skiller seg fra grunnformen med artikkel. Alle avsnitt og de 95 oversettelsene er bevart i datakilden som grunnlag for ordoppslag og papirordlister.

Bildeordene finnes fortsatt i de nummererte ordpunktene, med pek, tastatur og trykk. Bare hvis et bilde mangler, vises en nummerert tekstliste som alternativ. Den tidligere støttevelgeren er fjernet. Dagens ordavslutning leder først til Gloser og har en lukket «Se de ti ordene»-utvidelse; papirversjonen viser full ordtabell. Ordoppslag gjør ingen nettforespørsel eller lagring. Uten JavaScript er hele teksten og lenken til elev-PDF tilgjengelig. Utskrift viser tekstene og skjuler den interaktive forklaringsboksen.

Alle fire forståelsesspørsmål har tre svaralternativer og ett riktig svar. Det nye Chile-spørsmålet er «Hva gjør noen familier i Chile ved midnatt?»; riktig svar er «Abren los regalos.» Spørsmålet om Nochebuena er beholdt. Samtalespørsmålene ligger i sammenligningsdelen. Lærerfasit og tidsplan følger de fire avkrysningsspørsmålene, og seksjonen «Vurdering før elevbruk» er fjernet fra veiledningen.

Gjeldende PDF-er:

- [Elevark med tekst, ordlister og oppgaver – 6 sider](../../../output/pdf/jul-spania-chile-elev.pdf)
- [Lærerveiledning og fasit – 3 sider](../../../output/pdf/jul-spania-chile-laererveiledning.pdf)

PDF-ene har samme spørsmål og fasit som nettsiden. Elevarket har avkrysningsbokser; den tidligere statusseksjonen er fjernet fra lærer-PDF-en. PDF-ordlistene beholdes til papirbruk, hvor det ikke finnes interaktive ordoppslag. De tidligere filene `jul-spania-chile-elev-med-stotte.pdf` og `jul-spania-chile-elev-mindre-stotte.pdf` er historiske og skal ikke brukes som dagens elevark. Den eldre konseptprøven `docs/kultur/navidad-espana-chile-konseptproeve.md` er også historisk.

## Valgfrie julegloser

«Lær juleglosene» åpner hovedappen med settet **Jul i Spania og Chile**. Settet kan også velges under Gloser → kategorier → Valgfrie tema fra tekster. De ti nøkkelordene øves i den eksisterende gloseflyten. Oversettelsene i teksten er ekstra hjelp til lesingen.

Tre standardord gjenbruker eksisterende kort, fremgang og kanonisk fasit. Sju nye temaord opprettes først når eleven velger juletemaet. «Velg alle» gjelder vanlige kategorier; temaet velges separat. Nye temaord endrer ikke standardordlisten eller skolens øvingskatalog. Repetisjon på Start kan senere ta med ord eleven faktisk har øvd på.

Omstart og kategorivalg beholder riktig sett. Når alle ordene er planlagt senere, vises neste repetisjonsdato og en egen knapp for ekstraøving uten å endre planen. Knappen «Tilbake til teksten» går til første leseoverskrift og spør før en aktiv økt avsluttes. Ukjent pakkelenke gir en tydelig melding. Førstegangsbruk viser valgt opplegg og forklarer lokal profil i appens vanlige velkomst. Kontekstvisningen oppretter ingen kort eller ekstra lagring før eleven starter; ingen konto opprettes.

Glosefremgang lagres i eksisterende `spansk123Data_v4` og følger vanlig eksport/import. Temaord har `cultureSetId` og `cultureTermId` som stabile pakkereferanser; kort-ID-en bruker appens eksisterende allocator. Eksportversjonen er fortsatt `spansk123_export_v1`. Lesesvar lagres eller sendes ikke. Ingen ny lokal lagringsnøkkel, elevinnsending, lyd, mikrofon, analyse eller backend er lagt til.

## Kilder, bygg og kontroll

Innholdskilden er `data/culture-packages.json`. Elev-/lærer-HTML, PDF-er og hovedappens avgrensede glosedata bygges fra samme fil. Standardfasiten for de tre eksisterende ordene hentes fra den kanoniske ordkilden; temaordets egne svarvarianter står i kultur-JSON. [Bildeprotokollen](../genererte-bilder-jul-spania-chile.md) dokumenterer illustrasjoner og eksakte prompter. Kartgrunnlag finnes i `data/maps/README.md`.

Kjør med prosjektets Node 22-runtime:

```sh
npm run sync:culture
npm run check:culture
node --test tests/culture-packages.test.mjs
npx playwright test tests/culture-christmas-flow.spec.js tests/culture-vocabulary.spec.js --browser chromium --workers=1
npm run build:app
npm run test:all
```

PDF-byggeren bruker ReportLab og innebygde Noto Sans-fonter:

```sh
culture_python="/Users/olehenrikvik/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"
culture_font_dir="/Users/olehenrikvik/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype"
"$culture_python" scripts/build-culture-pdfs.py \
  --font-dir "$culture_font_dir" --site-base-url http://127.0.0.1:8768/ \
  --output-dir output/pdf --pack jul-spania-chile
```

## Historisk kontroll, 6. oktober 2026

Alle ni sider i de to daværende PDF-ene er visuelt undersøkt etter denne revisjonen. Tekstkontroll bekrefter begge fullstendige lesetekster, alle 95 leseord/uttrykk, fire spørsmål med tolv svaralternativer og separat oppdatert lærerfasit. Papirordlistenes fire kolonner leses separat i tekstkontrollen for å unngå sammenblanding av linjer. Innholdets status er fortsatt `draft/pending`. Nærtestene dekker lesebredde, listefravær, alle fire spørsmål, ordoppslag, bildeord, lærerfasit, utskrift, valgfri kategori, naturlige svarvarianter, omstart, returdato, ekstraøving, ukjente lenker, avbrutt navigasjon, eksport/import og direkte lokal HTML uten nett.

Verifisert 6. oktober 2026 etter denne revisjonen med Node 22.23.3: `npm run build:app`, 16 kultur-enhetstester og 23 nettlesertester for kultur/Gloser bestod. En lukket oversettelsesboks kunne åpne et annet ord bak boksen uten at musepekeren flyttet seg; dette er rettet, og lukketesten bestod seks gjentakelser. Den siste separate `npm run test:browser` bestod alle 487 Chromium-tester. Kulturpakken og hovedappen er synkronisert; offline-bygg-ID er `2a9d5f0a41edbca2`. Elevøkten er kontrollert manuelt på desktop og ved 390 piksler, med full tekstbredde under bildene, ingen tekstordliste/piler, fire avkrysningsspørsmål og fungerende ordoppslag uten sidelengs scrolling. Lærerveiledningen er kontrollert med oppdatert fasit og uten den fjernede vurderingsseksjonen. Skjermbilder ligger i `output/culture-preview/jul-full-tekstbredde-desktop.jpg`, `jul-full-tekstbredde-mobil.jpg` og `jul-fire-avkrysningssporsmaal.jpg`. Versjonerte CSS-/JS-lenker henter gjeldende nettressurser; en manglende skriptfil kan heller ikke sende lesesvaret som en sideforespørsel. `check:culture` og `git diff --check` bestod.

Den samlede `npm run test:all` er kjørt, men denne revisjonen har ikke én sammenhengende grønn kjøring. Etter rettingen av oversettelsesboksen bestod alle 63 generelle Node-tester og 52 skole-/servertester; åtte lyd-/offline-tester feilet fordi en eksisterende lydfil manglet i arbeidsmappen. Originalfilen ble gjenopprettet byteidentisk fra Git, og alle åtte bestod separat. Neste samlede kjøring bestod de 63 Node-testene, men skoleinnloggingstesten nådde sin 60-sekundersgrense under parallell kjøring. Den samme testen bestod alene på 9,2 sekunder. Den avsluttende komplette nettleserkjøringen bestod alle 487 tester med originalfilen på plass. Ingen skolekode eller testfrister er endret for å omgå tidsavbruddet.

## UX-korrigeringer og kontroll, 7. oktober 2026

Nytt radiovalg nullstiller gammel respons og skjuler hint/forklaring til eleven sjekker igjen. Navigasjon, lesebredde, katalogmetadata, digital ordavslutning og velkomstkontekst følger den oppdaterte kulturmalen. Produktmerket går til hovedappen, «Kultur» til katalogen og Gloser-retur til Spania-tekstens overskrift.

Begge PDF-er er bygget på nytt med synlige, klikkbare elev-/gloselenker og faktisk byggedato. De har fortsatt seks og tre sider. Basisadressen over er lokal, og arkene er merket «Lokalt arbeidsutkast – nettlenkene virker bare på denne maskinen.» Før offentlig deling må arkene bygges med den godkjente publiseringsadressen og lenkemålene verifiseres.

Fersk `npm run build:app` og sammenhengende `npm run test:all` bestod: 73 Node-tester, 52 servertester og 528 Chromium-tester (653 totalt). Kulturutvalget bestod 26 innholdstester og 64 nettlesertester. Fire separate Python-tester kontrollerte PDF-URL-er, negativ validering og bevart innhold. Alle 51 sider i de 14 gjeldende PDF-ene er visuelt kontrollert; faktiske elev-/gloselenker i jule- og Peru-elevarkene er klikket fra macOS Forhåndsvisning og åpnet riktig pakke/sett i Chrome. Se [implementeringsrapporten med etterbilder og PDF-er](../../reviews/2026-10-07_kultur-ux-implementering.md) for kontrollens omfang og begrensninger. Beads: `spansk-ungdomsskole-jx33` og `spansk-ungdomsskole-o6gw`.

## Videre arbeid

Ingenting er publisert. Faglig behandling følges i Beads `spansk-ungdomsskole-tc0b.2`, glose-/oppgaverevisjonen i `spansk-ungdomsskole-tc0b.8`, ordstøtte direkte i teksten i `spansk-ungdomsskole-5tb3` og denne oppryddingen i `spansk-ungdomsskole-w83j`. Hovedappens fremtidige Kultur-flate, godkjent publiseringspakke, HTTP-caching av lese-/bildefilene og klasseromsprøve følger den eksisterende juleplanen. Samlet testkjøring må også være grønn før en senere publisering. [Revisjonsplanen](../../../thoughts/shared/plans/2026-10-06_julepakke-spraak-ordliste-og-valgfrie-gloser.md) beskriver den lokale gloserbroen; [ordstøtteplanen](../../../thoughts/shared/plans/2026-10-06_juletekster-med-ordstoette-i-teksten.md) beskriver ordoppslagene, og [planen for denne oppryddingen](../../../thoughts/shared/plans/2026-10-06_julepakke-full-bredde-og-fire-flervalg.md) beskriver full tekstbredde og fire avkrysningsspørsmål.
