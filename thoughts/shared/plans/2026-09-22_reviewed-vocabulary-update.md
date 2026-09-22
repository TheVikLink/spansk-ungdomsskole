# Bygg inn lærerens siste gloseredigeringer

Beads: spansk-ungdomsskole-905.

Bruk `data/vocabulary-canonical-review.json` som eneste kilde og kjør den eksisterende byggekommandoen for kompatibilitetskopien, appens gloser/fasit og offline-versjon. Behold stabile ord-ID-er og den allerede innlagte favicon-endringen. Ingen publisering inngår.

Brukeren bekreftet 22. september at «pommes friten» skal beholdes som godkjent svar. Tilpass den gamle avvisningstesten til denne beslutningen. Tester for aksept og aksenter skal bruke godkjente svar, siden visningstekst med parenteser eller skråstrek ikke nødvendigvis er et godkjent svar etter gjennomgangen.

Kontroller synkronisering, fasit i begge retninger og bevaring av progresjon med eksisterende tester. Kjør bygge- og innholdskontroller samt `npm run test:all`; rapporter nettleserbegrensninger separat fra faktiske testfeil.
