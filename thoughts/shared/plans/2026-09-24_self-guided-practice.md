# Selvstyrt øving og adaptiv verbstart

## Mål

Gjør det enklere for en norsk ungdomsskoleelev å velge en passende oppgave og starte en lokal, anbefalt verbøkt som bygger på dokumentert øving.

## Utenfor scope

- Ingen kontoer, nettverkstrafikk, analyser eller nye personopplysninger.
- Ingen endring av eksportformat uten kompatibilitetstest.
- Ingen automatisk låsing: eleven skal alltid kunne velge verb og tid selv.

## Akseptansekriterier

- Hvert startkort forklarer kort hva eleven kan gjøre.
- Glosemodusene forklarer forskjellen, og én kan anbefales uten å skjule de andre.
- Anbefalt verbøkt starter med vanlige `-ar`-verb for tom profil og velger dokumentert svake/tilgjengelige fokus senere.
- Hyppige uregelrette verb introduseres eksplisitt og forsiktig, uten å gjøre progresjonen lineær eller ugjennomsiktig.
- Mobilnavigasjon beholder kompakt layout og gjør sekundære områder oppdagbare.
- Fokuserte tester går rødt før hver ny funksjon og grønt etter implementasjon; full testpakke kjøres før levering.

## Filer

- `index.html` — sideinnhold, lokal anbefalingslogikk og elevtekst.
- `src/styles/tailwind.css` — kort, anbefalingsmarkør og mobilpresentasjon.
- `tests/*.spec.js` / relevante enhetstester — lokale anbefalingsregler og elevflyter.

## Arbeidsrekkefølge

1. Kartlegg dagens lagrede verbfremgang, verbfokus og relevante tester.
2. Dokumenter den pedagogiske anbefalingsregelen og lukk beslutningsbeaden.
3. Skriv og kjør en feilende test for tom profil → anbefalt `-ar`-økt; implementer minste rene anbefalingsfunksjon.
4. Utvid test og funksjon for svak/mestrende lokal fremgang samt forklarende CTA; verifiser import/eksport-kompatibilitet.
5. Skriv og kjør feilende UI-tester for forklarte startkort, gloseanbefaling og mobiloppdagbarhet; implementer én flyt om gangen.
6. Kjør bygg, fokuserte tester, full testpakke og lokal desktop-/390 px-kontroll. Lukk og synkroniser Beads.
