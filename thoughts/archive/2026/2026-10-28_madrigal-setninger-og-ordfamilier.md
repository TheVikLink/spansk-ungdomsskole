# Setningsbygging og ordfamilier i Madrigal-temaet

Beads: spansk-ungdomsskole-tx5e. Gren: codex/madrigal-local.

## Mål og avgrensning

Eleven kan bygge og skrive åtte kuraterte setninger med es/no es og startordene, og bruke en gjennomgang av sju ordfamilier med egne prøveord. Bevar eksisterende ordliste, fremgang, uttaleskole, offline og import/eksport. Ingen lagring av råsvar eller nye mestringsfelt, lyd, kontoer, lekse-/quizintegrasjon eller publisering. Ordfamilier er kontrollerte likhetsmønstre, ikke en generell oversettelsesgenerator.

## Læringsflyt og akseptanse

Temaet får inngangene «Bygg setninger» og «Oppdag ordfamilier». Setningsstart viser es = er og no es = er ikke, og el/la/un/una med et separat undervisningseksempel. Oppgavene viser norsk mening; de fire første bruker omstokket ordbrikker med angre/nullstill, de fire siste skrives. Et valgt hint kan gi ordbrikker også ved skriving og telles separat. Riktig rekkefølge, negasjon og aksenter vurderes; valgfritt sluttpunktum og store bokstaver hindrer ikke riktig svar. Ingen fasit før forsøk, aktivt hint eller «Jeg vet ikke ennå». Dobbeltklikk kan ikke telle to svar. Resultatet er avgrenset til denne runden.

Sju korte sider viser norsk først: -sjon/-ción (med -sión-forbehold), -ist/-ista, -el/-al, -ell/-lig mot -al, -ant/-ent mot -ante/-ente, -isk mot -ico/-ica; siste side er en eksplisitt engelsk -ble-bro. Hver side har forklaring, to eksempler fra de kanoniske temakortene, en begrensning og et annet prøveord som besvares før betydningen vises. Tilbake/neste er tilgjengelig som presentasjonsnavigasjon. Besvarte prøveord beholder sin tilbakemelding ved retur; støtte og antall forsøk oppsummeres ærlig. Ingen universell etymologi eller frekvenspåstand.

Begge aktiviteter bruker eksisterende navigasjonsvern og kommer tilbake til temaet med riktig fokus. De kan ikke overskrive en aktiv økt. Defekte/manglende data gir tilgjengelig retur. Desktop, mobil og tastatur fungerer uten dra-og-slipp; endringer lagres ikke i localStorage.

## Filer og implementeringsrekkefølge

Utvid data/vocabulary-recognition-theme.json med faste setningsoppgaver og familier som refererer kanoniske ID-er. Utvid scripts/sync-vocabulary.mjs med validering av startord, medlemskap, unike oppgave-/familie-ID-er og tydelige språkbroer. Bygg som før inn samme offline-kopi.

Skriv først regresjonstester i tests/recognition-learning.test.mjs og tests/recognition-learning.spec.js. Implementer setningsdelen i index.html, med små rene normaliserings-/vurderingsfunksjoner og midlertidig rundetilstand. Verifiser før ordfamiliesidene implementeres. Legg nødvendig CSS i src/styles/tailwind.css, og beskriv inngangene i README.md. Ingen nye avhengigheter.

## Verifikasjon

Se testene feile før respektive implementasjon. Kjør med Node 22:

    node --test tests/recognition-learning.test.mjs tests/recognition-theme.test.mjs tests/vocabulary-authority.test.mjs
    npm run build:app
    npx playwright test tests/recognition-learning.spec.js tests/recognition-theme.spec.js --browser chromium --workers=2
    npm run check:vocabulary
    npm run test:all
    git diff --check

Kontroller korrekt/feil negasjon, ordrekkefølge, aksent, tomt svar, dobbeltinnsending, gjentatte brikker, tastatur, støtteovergang, retur/avbrudd, korrupte data, offline og uendret lagring. Åpne lokal app på desktop/mobil og vis resultatet. Før Beads til ferdig først når kontrollene faktisk har bestått.

## Brukerfunnet lokal overlapping, 28. oktober

Skjermbildet fra fokusert prøveord viste at inline-etiketten sto helt inntil tekstfeltet. Sidens totale scrollWidth avdekket ikke dette. Feilen følges i Beads 1br0 sammen med tx5e. Etiketter over svarfelt i temaet får egen linje og 12 px avstand. Nye nettlesertester måler hver tekstlinje mot feltets rektangel med minst 6 px klaring, samt lokal innramming og sidebredde ved 320, 390, 768, 1120 og 1280 px. Alle sju familier, oppdagelsesrunden og skrevet setning kontrolleres; en lang etikett med 200 % tekststørrelse prøver linjebryting. Seks tester feilet før rettingen.

Verifikasjonen avdekket også en reell hover-løkke: eksisterende translateY(-2px) flyttet knappen bort fra en peker nær kanten, som slo hover av og på igjen. Rammeprøver viste vekslende hover/transform uten pekerbevegelse; en separat test målte 1,56 px bevegelse og feilet. Bare knappene i gjenkjenningstemaet får stillestående hover. Ingen endring i svarvurdering eller lagring.
