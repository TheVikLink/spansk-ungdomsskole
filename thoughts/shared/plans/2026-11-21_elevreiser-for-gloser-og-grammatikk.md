# Elevreiser for gloser og grammatikk

Bestilling og akseptansekriterier følges i Beads `spansk-ungdomsskole-rbec.4.10`. Bruk de eksisterende Playwright-testene, lokale elevprofiler og den syntetiske skolen. Alle svar og all fremgang skal oppstå gjennom elevgrensesnittet.

| Elevreise | Hva testen skal vise |
| --- | --- |
| Standardgloser | Eleven husker fasiten fra kortene, kommer tilbake på senere øvingsdager og når mestring i begge retninger for hver ID i den gjennomgåtte ordlisten. |
| Gloser fra kulturtekstene | Hver tekst åpner sitt eget sett. Eleven ser alle ordene i begge retninger, skriver svarene selv i siste repetisjon og får en ny repetisjonsdato. |
| Grammatikk på egen hånd | Eleven åpner hver publiserte leksjon og øver videre på alle tema. Mestringen er synlig etter omlasting. |
| Grammatikk som lekse | Den syntetiske læreren velger alle oppgavene i hvert tema. Eleven svarer på hver variant og ser fullført lekse etter omlasting. |
| Verbbøying | Eleven lærer bøyningen fra tilbakemeldingen, øver på nytt og får alle ordinære personformer riktig i hver tid for hvert verb. I de avanserte presensutfordringene skriver eleven også personord og øver på vosotros. Økthistorikken bevares. |

Kjør først den enkelte reisen. Kontroller deretter at `npm run test:elevreiser -- --list` finner testene og at de inngår i `npm run test:all`. Antall ord, verb og oppgaver skal følge innholdskatalogene når nye oppføringer publiseres.
