# Salgsstrategi og Go-To-Market-plan – Spansk på 1-2-3

Dato: 24. november 2026
Leverandør: Oversikt AS (org.nr. 930 687 758)
Kontaktperson: Ole Henrik Vik (olevik91@gmail.com)

## 1. Bør Spansk på 1-2-3 fortsatt være et åpent, gratis produkt?

**Kort svar: Nei, ikke i sin helhet.** Å gi bort hele produktet gratis uten konto gjør at skoler aldri har noen økonomisk grunn til å kjøpe lisens, samtidig som et rent «alt eller ingenting»-stengsel før første klikk gjør det vanskelig å vinne lærerens tillit raskt.

Anbefalt modell er **Smart Freemium Demo** som leder rett til betalte skole- og kommuneavtaler:

1. **Hva som forblir åpent som gratis smakebit (ingen konto, null friksjon):**
   - **Spansk du kjenner igjen (startutvalg på 18 ord og ordfamilier):** Viser på 60 sekunder hvordan eleven oppdager spansk uten å kunne noe fra før.
   - **Én eller to åpne undervisningstimer (for eksempel Tall og Hilsener) komplett med A/B-partnerkort (PDF):** Læreren kan prøve en hel 45-minutters time i klasserommet i morgen uten å vente på IT-avdeling eller innkjøp.
   - **Én åpen glosekategori og én kort grammatikkøvelse + Dagens smakebit-quiz:** Gir lærer og rektor en ekte prøve av SM-2-repetisjon, aksenttaster (hold inne a/e/i/o/u/n eller ?/!) og skriveøving.
2. **Hva som flyttes bak skole- eller kommunelisens (betalt produkt):**
   - Alle **46 komplette 45-minutters undervisningstimer** med tilhørende utskrivbare A/B-partnerkort (PDF), skriveoppgaver og lyttemanus.
   - Hele glosebasen (**591 gjennomgåtte gloser** på tvers av alle kategorier), alle **34 verb i tre tider**, alle **10 grammatikktemaer og 8 korte grammatikkleksjoner**, full **Brainmap (64 mikroferdigheter)**, alle **7 kulturpakker** (Jul i Spania og Chile og seks Mundo AM-opplegg), **Uttaleskolen (31 lydkort, 62 opptak)** og alle **lytte- og diktathistorier**.
   - **Feide-innlogging, 1-klikks leksetildeling direkte fra undervisningstimen, «Fra læreren» øverst i elevens læringsfeed, skrivesvar vurdert i serverminnet (uten lagring av råtekst) og samlet læreroversikt.**

**Viktig merknad om overgang:** Gratisappen har historisk lovet at lagret fremgang ikke slettes ved oppdatering og kan eksporteres som JSON. Før en betalingsmur aktiveres i kode, skal eksisterende brukere få tydelig varsel på startsiden og mulighet til å eksportere egen fremgang (JSON), slik at ingen mister opparbeidet øving.

---

## 2. Raskeste vei til inntekter: Trelags kommersiell pakkemodell

Den største fellen i norsk EdTech er å tro at man må ha en ferdig kommunal databehandleravtale (DBA), DPIA og Feide-godkjenning før den første kronen kan tjenes. En kommuneprosess tar ofte 4 til 12 uker. Derfor bør du selge på **to spor parallelt**: ett spor med **null elevdata** (som kan faktureres denne uken) og ett fullt Feide-spor.

| Pakke | Pris (forslag per år) | Hva skolen får | Personvern og innkjøpsvei |
| --- | --- | --- | --- |
| **Pakke 1: Undervisningspakken (Raskest til kontanter)** | **3 490 kr per skole per år** (inntil 6 klasser) | Full lærertilgang til alle **46 ferdige 45-minutters timer**, utskrivbare **A/B-partnerkort (PDF)**, kulturpakker, lyttemanus og lærerkode for lokal klasseromsøving på skolens egne enheter uten sentrale elevkontoer. | **Null sentrale elevdata.** Krever ikke Feide, ikke DPIA og ikke kommunal DBA. Rektor eller avdelingsleder kan bestille direkte på skolens læremiddelbudsjett og få faktura (EHF). |
| **Pakke 2: Komplett Skolepakke med Feide** | **4 995 kr første år** (introduksjonspris ved årsbestilling; ordinær pris **7 900 kr per skole per år** etter år 1) | Alt i Pakke 1, pluss **Feide-innlogging**, klasseinvitasjon med kopierbar lenke og batch-godkjenning, **1-klikks leksetildeling fra undervisningstimene**, «Fra læreren» i elevens læringsfeed, flervalg og skrivesvar (vurdert i minnet uten råtekstlagring), og **læreroversikt** per elev, oppgave og fagområde. | Krever signert **Skoleavtale, DBA (bilag A–D), skoleeiers DPIA og godkjent Feide-aktivering**. Komplett 6-dokumenters avtalepakke ligger klar til overlevering i Google Drive. |
| **Pakke 3: Kommune- og fylkespakke** | **19 900 kr per år** for inntil 5 skoler (deretter **3 900 kr per ekstra skole**) | Full Komplett Skolepakke (Pakke 2) for alle ungdomsskoler og videregående skoler (spansk nivå I) under samme skoleeier. | Én sentral DBA og DPIA dekker hele kommunen eller fylkeskommunen. Gir rask skalering fra 5 til 15 skoler per avtale. |

### Prisingsgrep som gir raskere kontantstrøm
- **Bytt ut «2 måneder gratis uforpliktende pilot» med «30 dagers fornøydgaranti på årsbestilling»:** Gratis piloter uten forpliktelse spiser opp oppstartstiden din uten å gi inntekter. Med «Bestill for 4 995 kr første år med 30 dagers full angrerett etter oppstart» får du faktisk bestilling og budsjettvedtak med én gang.
- **Løft normalprisen etter de første 5–10 referanseskolene:** 4 995 kr er en bevisst lav introduksjonspris for å få første skoler raskt i gang. Ved 7 900 kr (eller 19 900 kr per kommune) blir enhetsøkonomien solid også når man regner inn support, onboarding og eventuell mva-registrering senere.

---

## 3. Operativ 30-dagers lanseringsplan (Uke 1 til 4)

### Uke 1: Gjør produktet og avtalepakken sendeklar
1. **Avklar de siste tre driftskontrollene for Feide-produksjon** (sporing i `spansk-ungdomsskole-rbec.4`):
   - Oppgrader staging/produksjonsdatabaser i Supabase til **PostgreSQL 17.12** etter verifisert logisk sikkerhetskopi (i tråd med vedtatt Valg 2B-runbook).
   - Aktiver permanent retensjonsjobb og varsling i produksjon.
   - Ferdigstill manuell gjennomlytting av de gjenstående fire lyttehistoriene (Carmen, Mateo, Inés, Diego) mot manus (`spansk-ungdomsskole-4or0`).
2. **Last opp og del den samlede markeds- og DBA-pakken** fra Google Drive (`Spansk123`).
3. **Spill inn én 75-sekunders produktvideo** som viser den faktiske arbeidsflyten fra Move 4:
   - Velge en 45-minutters undervisningstime (med utskrivbare A/B-kort) -> trykke «Gi temaet som digital skolelekse (Feide)» -> elev ser «Fra læreren» på startsiden og skriver spansk svar med innebygde aksentknapper -> læreren ser resultatene rett i oversikten.

### Uke 2: Direkte salg til spansklærere og rektorer (mål: 30 henvendelser)
- **Kanal 1 (Raskest effekt):** Send personlig e-post (Mal 1 og Mal 2 fra markedsføringspakken) til **30 spansklærere og avdelingsledere/rektorer** på ungdomsskoler og videregående skoler i Norge.
- **Kanal 2:** Publiser innlegget i norske Facebook-grupper for spansklærere (for eksempel *Spansklærere i Norge*) og på LinkedIn, med én konkret invitasjon: *«Last ned gratis prøve på 45-minutters spansktime med samtalekort, eller bestill hele pakken til skolen.»*
- **Mål for uke 2:** Book 8 til 10 korte **15-minutters live-demoer**.

### Uke 3: Lukk de første betalte Undervisningspakkene + start 2–3 kommune-DBA-løp
- **For lærere som vil bruke timene med én gang:** Selg **Pakke 1 (Undervisningspakken, 3 490 kr/år)**. Send ordrebekreftelse og faktura umiddelbart uten å vente på Feide.
- **For lærere/rektorer som ønsker Feide og lekseoppfølging:** Send hele **Kommune og Databehandleravtale**-mappen (6 ferdige dokumenter) direkte til rektor, IT-ansvarlig eller personvernombud samme dag som demoen.
- **Be om innføring til kommunens fagnettverk:** Spør hver interessert lærer: *«Er det andre ungdomsskoler i kommunen som har spansk? Vi kan legge opp én felles kommuneavtale så alle skolene får det med én DBA.»*

### Uke 4: Gjennomfør første skoleaktivering og innfør Freemium-port i koden
- Når de første kundebestillingene er signert, aktiver **Smart Freemium Demo** i appen (åpner utvalgte smakebiter uten innlogging, mens resten krever skole-/lærertilgang eller aktiv skolelisens via Feide), med tydelig eksportvarsel til eventuelle eksisterende brukere.
- Gjennomfør 45-minutters digitalt oppstartsmøte med første betalte skole og samle én kort anonymisert kundehistorie («Tid spart per uke») til neste runde utsendelser.

---

## 4. Teknisk sjekkliste før kodeendring til betalt tilgang

Når du gir grønt lys for å stramme inn gratistilgangen i selve appen, bør endringen følge tre enkle regler:
1. **Ikke ødelegg eksport og gjenoppretting:** Alle brukere som har lagret lokal fremgang (`spansk123Data_v4`, `spansk123_practiceHistory`, `spansk123_learningProgress_v1`) må alltid kunne eksportere JSON-sikkerhetskopi fra startsiden og innstillinger.
2. **Hold demoen knivskarp:** Ikke vis en død «403 Ingen tilgang»-vegg. La hvem som helst klikke **Start**, prøve *Spansk du kjenner igjen* (18 ord), én åpen undervisningstime med A/B-kort og én runde i læringsfeeden før en ryddig «Lås opp hele Spansk på 1-2-3 for skolen din»-visning vises.
3. **Fakturerings- og tilgangsmodell:**
   - **Pakke 1 (Undervisningspakken):** Enkel lærerkode eller innlogging med tilgangsnøkkel per skole for de 46 undervisningstimene og klasseromsvisning.
   - **Pakke 2 og 3 (Feide-skolepakke):** Aktivert skole i `school`-tabellen etter signert skoleavtale, DBA og fullført aktiveringsprotokoll (`skoleaktivering.md`).
