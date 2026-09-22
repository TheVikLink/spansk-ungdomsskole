# Start etter fullført nivåtest

Dato: 2026-09-22. Beads: spansk-ungdomsskole-904.

`showPage('home')` skjuler først diagnosepanelet ved fullført test, men
`renderDiagnosisPanel()` viser det igjen med Resultat, nivå og anbefalinger.
Dermed ligger resultatdelen foran de to øvingsvalgene også ved senere besøk.

Etter en besvart, fullført nivåtest skal panelet tømmes og skjules. Den siste
tilbakemeldingen beholdes frem til eleven velger «Gå til Start»; deretter flyttes
tastaturfokus til «Start dagens quiz». Dagens quiz og Repeter gloser blir de to
øverste øvingsvalgene, begge med tydelig handlingsknapp. Den eksisterende tomme
repetisjonskøen har fortsatt deaktivert knapp. Importert fremgang uten nivåtest
beholder muligheten til å ta nivåtest senere.

Diagnosesvar, nivåberegning, adaptiv ruting og eksport/import endres ikke.
Eksisterende UI-tester oppdateres for fullføring, siste tilbakemelding,
tastaturfokus, gjenåpning og retur via navigasjonen ved 390 og 1440 piksler.
Bygg og full verifisering kjøres etter endringen; eventuelle miljøbegrensninger
rapporteres uten å regne blokkerte tester som bestått.

Verifisert 2026-09-22: Agentens 31 målrettede nettlesertester bestod, og
skjermbilder ved 390 og 1440 piksler ble kontrollert. Brukeren kjørte deretter
hele `npm run test:all`: 35 Node-tester, 454 nettlesertester og alle statiske
kontroller bestod for bygg `e28b1b8b7e859476`. Endringen er klar for levering;
commit, push og publisering er ikke bekreftet i denne verifiseringen.
