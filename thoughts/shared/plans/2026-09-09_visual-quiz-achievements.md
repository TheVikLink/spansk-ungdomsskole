# Visuelle stjerner og dager på rad

Brukerens skjermbilde viser at gjentatt «Gode svar på øvde oppgaver» gjør quizresultatet tungt å lese. KwizIQ-skjermbildet brukes som visuell referanse for stjerner og en separat gåfigur. Arbeidsstatus føres i Beads `spansk-ungdomsskole-7vx`.

Resultatet får små grå stjerner med korte temanavn. Hver stjerne kan åpnes med klikk eller tastatur for å lese fullstendig mål og en kort forklaring. Den lange gule tekstboksen fjernes. Dager på rad får en egen grønn sirkel med gåfigur, tall og kort etikett. Forklaringen på hva som teller som en quizdag ligger bak samme type åpning.

Opptjening forblir minst tre forsøk og styrke minst fire av fem, med gjeldende variasjonskrav for verb. Dette er appens eksisterende øvingsmål, ikke en beregnet confidence-prosent. Ingen nye lagringsfelt eller endringer i eksport/import. En utløpt dagrekke vises ikke som aktiv i dag; lagret historikk beholdes.

Verifikasjon: et resultat med fire stjerner, ingen nye stjerner, null svar, flere quizer samme dag, sammenhengende dager og datoavbrudd. Prøv forklaringer med tastatur og klikk ved desktop- og mobilbredde, og kontroller at forklaringene ikke registrerer økten på nytt. Bygg CSS/app, kjør berørte tester og `npm run test:all`, kontroller skjermbilder og oppdater PR 6 sammen med den allerede verifiserte resultattekstrettelsen.
