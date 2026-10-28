# Publiseringskontroll 28. oktober 2026

Eierbestilt publisering av den åpne Spansk123-appen, med Madrigal, uttaleskole og kultur. Rapporten dokumenterer kildegrunnlag og kontrollene før publisering. Faktisk produksjonsstatus følger GitHub Pages-distribusjonen og bygg-ID på nettsiden. Facebook-utkastet ligger i docs/markedsforing/facebook-nyheter-2026-10-28.md; det er ikke postet.

Publiseringsgrunnlag: isolert codex/publish-madrigal-pronunciation-culture fra main ceb2b413eab1046cc54a9bceaf13c3955cd550aa. Den opprinnelige utviklingsmappen er bevart. Ingen Feide-, server-, database-, Vercel- eller kontoendringer inngår. Nye main-rettelser i lærerimport, grammatikk og verbforklaringer er bevart ved treveis fletting.

Kulturkatalogens sju opplegg beholder status arbeidsutkast til lærervurdering. 62 Refold-lydfiler med eksisterende tillatelse og kreditering følger uttaleskolen. Bare 21 bilder/kart som brukes av kulturoppleggene følger med.

Publiseringsfeil rettet: kulturark var lenket til ignorert output/pdf, og ett kart var utelatt. Alle 14 PDF-er er bygd fra samme JSON med offentlige lenker til www.spansk123.no og ligger i docs/kultur/pdf. Ingen lokale maskinlenker i PDF-lenkeannotasjonene. Tekst og utkastmerking kontrollert på alle 14; representative førstesider gjengitt for visuell kontroll. Nye tester fanger manglende lokale mål og den tidligere manglende inngangen fra Start. Start har nå Utforsk kultur, med videre vei til sju opplegg og PDF-er ved mobil og desktop.

Verifikasjon før PR: rent npm ci; bygg b96d2988d39f2d88; 108 Node-tester og alle katalog-/innholds-/offlinekontroller består. 35 fokuserte nettlesertester bestod. Den fulle lokale nettleserrunden hadde 593 beståtte og én foreldet forventning til output/pdf-adressen; forventningen ble rettet og kontrollen utvidet med faktisk PDF-nedlasting. Alle 18 berørte kultur-/publiseringstester bestod etter rettingen. Nye tester ble sett feile før lenker/aktiva/inngang ble rettet. Full test:all er også publiseringsport i GitHub CI før fletting. git diff --check består.
