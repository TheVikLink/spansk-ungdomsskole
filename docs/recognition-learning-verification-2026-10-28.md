# Madrigal-modus: setningsbygging, ordfamilier og lokal layout

Lokal leveranse 28. oktober 2026. Ingen publisering eller endring i elevlagring.

## Funksjon

Temaet «Spansk du kjenner igjen» har nå «Bygg setninger» og «Oppdag ordfamilier». Åtte faste setninger bruker startutvalget og småordene es/no/un/una. Fire oppgaver har omstokkede ordbrikker, fire har skriving; eleven kan velge støtte. Ordrekkefølge, negasjon og aksenter vurderes. Store bokstaver, normalisert Unicode og valgfritt sluttpunktum godtas.

Sju sider viser utvalgte likheter: -sjon/-ción, -ist/-ista, -el/-al, -ell/-lig/-al, -ant/-ent, -isk/-ico og en uttrykkelig engelsk -ble-bro. Hver side har to eksempler, en begrensning og et annet prøveord. Presentasjonen kan navigeres uten svar; oppsummeringen oppgir antall besvarte prøveord og støtte. Likhetene beskrives som spor i det valgte ordutvalget, ikke som universelle oversettingsregler. Kildene er temaets data og den tidligere faglige gjennomgangen; maskinelle kontroller erstatter ikke uavhengig språklærerreview (Beads efn8).

Rundene bruker midlertidig minne. De skriver ikke svar eller resultater til localStorage og gir ikke stjerner eller endrede repetisjonsdatoer. Vanlig gloseøving fortsetter å dele fremgang med de kanoniske kortene.

## Layoutfeil fra brukerskjermbildet

Inline-etiketten «Hva betyr ordet på norsk?» sto uten avstand til tekstfeltet. Etiketter i temaets svarfelt står nå på egen linje med 12 px avstand. Nye tester måler tekstlinjer mot fokusert felt og krever minst 6 px klaring. De kontrollerer alle sju familier, oppdagelsesfeltet og skrevet setning ved 320, 390, 768, 1120 og 1280 px, samt lang etikett med doblet tekststørrelse. Alle seks layouttester feilet før rettingen og består etterpå.

En separat hover-test fanget en eksisterende bevegelsesløkke ved knappekanten (1,56 px målt bevegelse). Knappene i temaet beveger seg ikke lenger ved hover. Farge og skygge beholdes. Dette retter også de ustabile klikkene som ble avdekket under verifikasjonen.

## Verifikasjon

Testene dekker katalogreferanser, feil data, negasjon, ordrekkefølge, aksenter, tomme svar, dobbeltinnsending, støtte, navigasjon, tastatur, offline og uendret lokal lagring.

Node 22. Bygg og alle katalog-/innholds-/offlinekontroller består; offline-bygg 4d98b6d636302723. Alle 106 vanlige Node-tester og 52 servertester består. `npm run test:all` ble kjørt, men den parallelle serverdelen traff 60-sekundersgrensen i en eksisterende innloggings-/leksetest under høy samtidig maskinbelastning. Serverdelen ble derfor kjørt med `node --test --test-concurrency=1 tests/server/*.test.mjs`, uten endret kode eller økte tidsgrenser. Samme test bestod på 9,5 sekunder; hele serverdelen bestod på 142 sekunder. Resterende porter kjøres separat, med samme kommandoer som i `test:all`.

Alle 574 nettlesertester består (3,6 minutter), inkludert de sju nye geometriske regresjonstestene. Totalt 732 tester består når serverdelen kjøres sekvensielt. `git diff --check` består. Loggene fra bygg, innledende fullkontroll, sekvensiell serverdel og full nettleserdel ligger i `output/madrigal-learning-2026-10-28/`.

Skjermbilder fra fokusert felt ligger i `output/madrigal-learning-2026-10-28/focused-field-desktop.png` og `focused-field-mobile.png`. Den lokale nettleseren er oppdatert til siste bygg og står på ordfamilie 1 med fokusert tekstfelt. Ingen uløste feil i denne flyten er påvist; uavhengig språklærervurdering er fortsatt en separat oppfølging.
