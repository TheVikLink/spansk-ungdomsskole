# Go-to-market og salg for Spansk på 1-2-3

## Prioritering vedtatt 9. november 2026

Produkteieren bestilte konsentrasjon om første skoleleveranse: nye funksjoner, nye innholdspakker og generell testverktøyutvikling venter. Eksisterende Feide-/lekseflyt i fire områder er leveranseomfanget. [Pilotstatus](../../../docs/feide/pilotskole/pilotstatus.md) beskriver kandidaten og hindrene; Beads rbec.4 er operativ samlesak. [Første skolepakke](../../../docs/salg/forste-skolepakke.md) har ferdig tekst til lærersiden, 90-sekunders demomanus, to lekseeksempler, tilbudsomfang og et synlig prisregnestykke. Dette er lokalt underlag, ikke publisert lærerside, produsert video eller sendt tilbud.

Første kundeinngang er én skole, én ansvarlig spansklærer og høyst to klasser. **En ny pilotskole er ikke krav før salg.** Produkteieren opplyser 9. november at produktet allerede ble utviklet sammen med en egen 9. klasse hen underviste året før, med elevtilbakemeldinger og løpende forbedringer. Det er ikke oppgitt hvilke versjoner/funksjoner som inngikk; ikke utled at dagens Feide/backend eller nyere innhold dermed er prøvd.

Første kunde kan bestille et betalt abonnement når leveransen er klar. Gratis utprøving er valgfri. Introduksjonspris første år er 4 995 kr som arbeidsforslag, tolket som totalpris inkludert eventuell mva; avgiftsbehandling og endelig tilbud avklares. Rektors fullmakt og skoleeiers tjenestegodkjenning avklares for den enkelte kunde. Målgruppen er fortsatt begge skoleslag, men fem lærerprøver eller piloter fra begge skoleslag er ikke lanseringskrav. aua1/oroa/ze78 følger materiell og kunde-/prisarbeid. Eldre obligatoriske pilottrinn i planen overstyres av denne presiseringen; konkrete tekniske, faglige og avtalemessige leveransekrav beholdes.

Supabase-sporet skal ende i beslutning, ikke ubestemt venting: første beslutningspunkt 11. november 2026. Behold allerede valgt lokal journalreplay før eksport som hovedmetode. Kartlegg konkret hvilket eksternt bevis som fortsatt mangler og lever en avgrenset gjennomføringspakke eller begrunnet alternativ. Ikke start nye lokale rammeverk eller bytt hosting uten å vise at den valgte metoden ikke kan oppfylle det nødvendige kravet. Nye leverandøravklaringer skal ikke stoppe demo- og kundearbeidet. Ingen automatisk skyhandling eller risikounntak følger av datoen.

Arbeidsutkast v2, 28. september 2026. Revidert etter produkteierens presisering av målgruppe og hovednytte. Planleggingssak: `spansk-ungdomsskole-kbzy`; første utkast ble levert i `spansk-ungdomsskole-lpbj`.

**Målgruppe:** Hele ungdomsskolen og elever som tar spansk nivå I i videregående. Produktet velges etter faglige behov og forkunnskaper, ikke etter ett klassetrinn.

**Hovedinnsalg:** Gjør det enklere å gi og følge opp spanskleksene. Læreren velger oppgaver, tildeler til klassen og ser elevens fremgang i ordforråd, grammatikk, verbbøying og lytting. Eleven finner leksene ved å logge inn med Feide.

Dette er den besluttede retningen for produktet som skal selges. Feide, sentral leksetildeling og læreroversikt er planlagte funksjoner og skal ikke markedsføres som levert før de er verifisert. [Gjennomførings- og personvernplanen](2026-09-28_feide-lekser-og-laereroversikt.md) er det tekniske grunnlaget.

## 1. Utgangspunkt

Produkteieren kan bruke minst én time hver ukedag på salg og kundeoppfølging, og mer ved behov. Tidligere innlegg i en Facebook-gruppe ga ikke ønsket respons. Uten innlegget, rekkevidden og observerte besøk vet vi ikke om det skyldtes synlighet, budskap, brukeropplevelse eller manglende lærerfunksjoner.

Produkteieren opplever at lærere bruker mye tid på å skrive ut og håndtere lekser. Dette gir en konkret nyttehypotese å undersøke: mindre arbeid med å finne, dele ut og følge opp oppgaver. Vi skal samle eksempler og måle faktisk tidsbruk i pilot, uten å love en bestemt besparelse på forhånd.

Produkteieren har allerede tilgang til å registrere tjenester via Sikt. Feide skal derfor planlegges og bygges som del av lærerproduktet. Skolesamtalene skal forme arbeidsflyten og avklare lokale krav; de avgjør ikke om produktet skal ha Feide.

## 2. Målgruppe, behov og kjøpere

| Segment | Brukssituasjon | Hva som må avklares |
|---|---|---|
| Spansk på ungdomsskolen | Ukentlige lekser, repetisjon, tilpasset øving og læreroppfølging gjennom hele ungdomstrinnet. | Innhold til riktig nivå, elevenes oppstart, kommunens eller privat skoleeiers godkjenning. |
| Spansk nivå I i videregående | Grunnleggende språklæring og repetisjon, med elevgrupper som kan ha ulike forkunnskaper. | Tempo, nivå og oppgavebredde; fylkeskommunens eller privat skoleeiers godkjenning. |

Begge segmentene skal være med fra de første lærersamtalene. Blant de fem foreslåtte pilotskolene bør minst én være videregående og minst én ungdomsskole. Resten velges etter tydelig behov, gjennomføringsvilje og avklart kjøpsvei. En liten pilot er en praktisk avgrensning, ikke en innsnevring av produktets målgruppe.

Læreren er faglig pådriver. Rektor eller annen budsjetteier kan være kjøper. Skoleeier og relevant IT-/personvernfunksjon må involveres i godkjenningen. Lav pris eller en positiv lærer fjerner ikke denne prosessen. [Udirs råd om digital praksis](https://www.udir.no/kvalitet-og-kompetanse/digitalisering-skole/rad-for-god-digital-praksis-og-skjermbruk-i-skolen/).

Dagens A0–A1-merking beskriver eksisterende oppgaver. Den definerer ikke hele produktmarkedet og er ikke dokumentasjon på full dekning av spansk nivå I. Kartlegg innholdsgap mot [kompetansemålene etter nivå I](https://www.udir.no/lk20/fsp01-04/kompetansemaal-og-vurdering/kv965), og vis åpent hvilke områder som faktisk er dekket.

## 3. Posisjonering og differensiering

**Foreslått hovedbudskap:** «Gi spanskleksene digitalt. Se hva elevene har gjort, og hvor de trenger mer øving.»

Demonstrasjonen skal vise én sammenhengende arbeidssituasjon: lærer tildeler → elev øver → lærer følger opp. Antall spill og funksjoner er støtteinformasjon. Innsalget bygger på lærerens arbeidshverdag og elevens øving.

| Alternativ hos skolen | Vår oppgave i salget |
|---|---|
| Lærerens egne ark og utskrifter | Vis en like konkret lekse med enklere tildeling og tilgjengelig oppfølgingsgrunnlag. Mål forskjellen i arbeidstid. |
| Et læreverk som Gente | Vis hvordan øvingen passer til temaet læreren allerede underviser i. Gente dekker flere språkferdigheter og har både bøker og digitale ressurser. [Aschehougs katalog](https://shop.prod.aschehoug.cloud/produktkatalog/gente). |
| En digital tjeneste som Skolen fra Cappelen Damm | Undersøk hvilket behov læreren fortsatt har. Skolen tilbyr allerede innhold, oppgavedeling og læreroppfølging, så disse funksjonene alene er ikke en dokumentert unik fordel. [Leverandørens beskrivelse](https://www.cappelendamm.no/verk/skolen-fra-cappelen-damm-154009). |

Arbeidshypotesen er at en tydelig spanskflyt, relevant innhold og enkel leksehåndtering kan gjøre oss verdifulle. Vi må vise det i konkret bruk. Ingen påstand om at andre løsninger mangler funksjoner uten at det er undersøkt.

SSB oppgir at 54,2 prosent av grunnskoleelevene **med fremmedspråk** valgte spansk i 2025. Dette underbygger relevansen i ungdomsskolen, men tallet gjelder ikke videregående og dokumenterer ikke betalingsvilje. [SSB, oppdatert 20. mai 2026](https://www.ssb.no/utdanning/sprakstatistikk/fremmedsprak/grunnskole-og-videregaende). Start med 30 relevante skoler fra begge segmenter; et nasjonalt inntektsanslag er ikke nødvendig for første salgsrunde.

## 4. Skill dagens produkt fra det nye tilbudet

| Dagens lokale app | Planlagt skoleprodukt |
|---|---|
| Gratis øving uten konto. | Feide-innlogging for lærer og elev. |
| Lokale leksepakker som deles og importeres som filer. | Læreren tildeler til klassen; eleven finner leksen i «Mine lekser». |
| Fremgang og oppsummering på elevens enhet. | Lagrede lekseresultater og autorisert læreroversikt per område. |
| Lytteoppgaver uten lagret fremgang over tid. | Dokumentert lytteprogresjon fra besvarte oppgaver, sammen med øvrige områder. |
| Lokal eksport/import. | Bevar lokal gjenoppretting, og legg til kontrollert kontoeksport og kontolivsløp. |

Dagens app kan brukes i lærersamtaler og faglig utprøving med gjeldende godkjenninger. Den beviser ikke at den nye lekseflyten eller læreroversikten fungerer. Tidlige skisser skal merkes «prototype»; ikke bruk dem som skjermbilder av et ferdig produkt.

## 5. Markedsføringsmateriell og enkel første opplevelse

| Leveranse | Innhold | Arbeidskriterium |
|---|---|---|
| Én lærerside | Målgruppe, lekseproblemet, sammenhengende demonstrasjon, nåværende status og pilotinvitasjon. | En ny lærer kan forklare nytten etter 30 sekunder. |
| En demo på 60–90 sekunder | Tildel en lekse, vis elevens arbeid, åpne læreroversikten. Før implementasjon brukes tydelig merket prototype. | Begge skoletyper forstår brukssituasjonen. Ingen virkelige elevdata. |
| Ett konkret lekseeksempel per segment | Læringsmål, valgte oppgaver, frist, forventet elevinnsats og hva læreren ser. | Læreren kan vurdere relevansen i sin neste undervisningsuke. |
| Ett kort kjøpsgrunnlag | Leverandør, omfang/pris, databehandling, Feide, tilgang, drift og avtaleperiode. | Budsjetteier vet hva som kjøpes og hva som må godkjennes. |

Hovedhandling på en side før produktet er klart: «Avtal en demonstrasjon». Når full flyt er klar: «Prøv en lekse». Elevens startside prioriterer tildelte lekser og ett tydelig neste steg. Lærerens startside prioriterer «Gi lekse» og oppfølging av aktive lekser.

Observer fem lærere mens de prøver første flyt, med representasjon fra begge segmenter. Mål tid til å forstå tilbudet, feilvalg og behov for hjelp. Etter at klassen er satt opp er arbeidsmålet at minst fire av fem tildeler en ny lekse innen tre minutter. Dette er et testmål, ikke en målt produktegenskap. Bevar fri lokal øving og eksisterende eksport/import.

## 6. Feide og produktutvikling

Følg [den tekniske planen](2026-09-28_feide-lekser-og-laereroversikt.md):

1. Bekreft oppsett i eksisterende Sikt-tilgang, testattributter, identitet over tid, driftsleverandør og skoleeiers databehandling.
2. Bygg sikker server, database, Feide og roller med syntetiske brukere fra to skoler.
3. Lever hele leksekjeden for ordforråd, med enkel og sikker klasseoppretting.
4. Ta inn grammatikk, verbbøying og lytting i samme flyt og læreroversikt.
5. Verifiser tilgang, sletting/eksport, drift, mobilbruk og pilot med begge skoletyper.

Feide er innloggingen. Klasseansvar, lekser, lagring og læreroversikt må bygges i produktet. Skoleeier må dessuten aktivere tjenesten for sine brukere. [Feides aktiveringsmodell](https://docs.feide.no/service_providers/manage/access_to_services/activation.html).

Første skoler registreres som utviklings-/pilotpartnere mens arbeidet pågår. Betalt skoleleveranse krever at det avtalte omfanget faktisk er klart. Kalenderen for salg justeres etter utvikling og godkjenning; en fast produksjonsdato er ikke lovet.

## 7. Tilbud og pris

Det primære betalte tilbudet skal være **skoleproduktet med leksetildeling og læreroppfølging**. Introduksjon og støtte hjelper skolen i gang. Den tidligere ideen om hovedsakelig å selge opplegg og støtte rundt gratisappen er erstattet av dette tilbudet.

| Tilbud | Omfang | Prisstatus |
|---|---|---|
| Utviklingspartner | Lærersamtaler, prøving av skisser og tidlig demonstrasjon med syntetiske data. | Gratis, uten elevdata eller automatisk kjøpsplikt. |
| Avgrenset skolepilot | Avtalt klasse og innhold i tre uker, full lærer-/elevflyt, oppstart og evaluering. Krever teknisk og lokal godkjenning. | Foreslått gratis pilot, uten automatisk abonnement. |
| Skoleabonnement | Avtalt skoleomfang, Feide, klasser, digitale lekser og fremgang i de fire områdene, med tydelige støttegrenser. | Aktiv prishypotese 9. november: 4 995 kr i total årspris inkludert eventuell mva, for høyst to klasser i første avtale. Må kostnadsberegnes og prøves mot kjøpere; avgiftsbehandling og endelig pris er ikke avklart. Erstatter agentens tidligere forslag på 9 900 kr. |

Avklar om skolen foretrekker fast skolepris eller pris etter antall spanskelever, og beregn drift, støtte, administrasjon og videre utvikling før pris fastsettes. Begynn med én forståelig prismodell i tilbudene; unngå mange nivåer før vi kjenner behovene.

README omtaler gratis bruk og MIT; rettigheter til kode, innhold og lyd må avklares før kommersielle vilkår. Planen endrer ikke eksisterende rettigheter. Skoleabonnementet gjelder den definerte tjenesten, ikke en uvarslet omgjøring av dagens lokale øving til betalingsprodukt.

Før skriftlig tilbud: leverandør-/fakturaopplysninger, eventuell EHF, mva. og totalpris, periode, fornyelse, omfang, støtte, databehandleravtale, eksport og sletting. Logg salgs- og støttetid; inntekt alene viser ikke om modellen er bærekraftig.

## 8. Kanaler og salgsprosess

Prioriter eksisterende relasjoner og introduksjoner, deretter målrettede skolesamtaler. Et nytt Facebook-innlegg kommer med en konkret leksehistorie og demonstrasjon etter at budskapet er prøvd på lærere. Be gruppens administrator om avklaring når delingsreglene tilsier det.

Kontakt også lærere i spansk nivå I ved videregående skoler fra starten. Der godkjenning ligger hos kommune/fylkeskommune, involver riktig kontakt tidlig. Unngå at en lærer får en pilotoppgave som vedkommende ikke har myndighet til å sette i gang.

| Salgstrinn | Neste bevis |
|---|---|
| Relevant skole | Spansktilbud, relevant behov og avtalt samtale. |
| Behovssamtale | Konkret eksempel på dagens leksearbeid og ønske om å prøve ny flyt. |
| Demonstrasjon | Læreren forstår hva eleven og læreren får ut av løsningen. |
| Kvalifisert pilot | Ansvarlig lærer, godkjenning, teknisk leveranse, utstyr og avtalt dato. |
| Gjennomført pilot | Gjentatt bruk, opplevd nytte og dokumentert tidsbruk/støttebehov. |
| Tilbud | Budsjetteier vurderer konkret omfang, pris og avtale. |
| Kjøp | Autorisert bestilling og betaling registrert separat. |

Spør i samtalen: Hvordan laget og delte du den siste leksen? Hvor mye tid gikk til forberedelse, utskrift, utdeling og kontroll? Hva trenger du å se om elevene for å planlegge neste time? Hvilke av fagområdene er viktigst? Hvilke funksjoner har dere allerede? Hvem godkjenner verktøy og betaling? Hva fungerer ulikt i ungdomsskolen og videregående?

Bruk avtalt oppfølging og relevante institusjonskanaler. Ikke baser rekrutteringen på masseutsendelse til personlige læreradresser. E-postreglene skiller mellom personlige adresser og generelle virksomhetsadresser. [Forbrukertilsynets veiledning](https://www.forbrukertilsynet.no/wp-content/uploads/2018/04/veiledning-om-markedsf%C3%B8ring-via-mail-sms.pdf); søkeresultatet var tilgjengelig ved kildekontrollen, men selve PDF-hentingen tidsavbrøt.

Foreslått annonsebudsjett første måned: 0 kr. Bruk kapasiteten på samtaler, demonstrasjon og pilot. Eksterne kjøp har egne overslag. Etter demonstrasjon: oppsummer avtalt neste handling og dato, følg opp etter omtrent fem arbeidsdager, og avslutt eller avtal ny dato ved neste kontakt. Ingen endeløs purring.

## 9. Mål, arbeidsrytme og de første 90 dagene

Arbeidsmål for kommersielt arbeid: **30 relevante skoler → 12 behovssamtaler → 5 pilotpartnere → 2 betalende skoler etter verifisert leveranse**. Dette er hypoteser, ikke prognoser. Skill mellom partnerinteresse og en faktisk gjennomført elevpilot. Begge segmenter skal være representert i samtalene og pilotgrunnlaget.

| Periode | Kommersielt og produktnært arbeid |
|---|---|
| Uke 1–2 | Fem lærersamtaler/brukstester fra begge segmenter, materiellutkast og konkret lekseprototype. Teknisk fase A starter med eksisterende Sikt-tilgang. |
| Uke 3–6 | Totalt tolv behovssamtaler, demonstrasjon av første sammenhengende testflyt når den er klar, fem mulige pilotpartnere og avklart godkjenningsvei. |
| Uke 7–10 | Prøv ny lærer-/elevflyt med syntetiske data og gjennomfør ekte piloter etter de tekniske/personvernmessige portene. Mål leksearbeid og støttebehov. |
| Uke 11–13 | Evaluer faktisk modenhet, pilotnytte, kostnad og kjøpsvilje. Send tilbud bare for et konkret leverbart omfang. Flytt uferdig produksjons-/salgsarbeid til neste periode med tydelig status. |

Planperioden er 28. september–27. desember 2026; legg møter etter lokale høstferier og avklar eventuelle kjøp før juleferien. Den tekniske planen har et separat utviklingsanslag. Fem timer ukentlig salgsarbeid betyr ikke at hele kontoplattformen kan leveres innen 90 dager med samme kapasitet.

Ukesrytme: mandag kontaktliste/avtaler; tirsdag lærersamtale; onsdag materiell og tilbakemelding på brukerflyt; torsdag demonstrasjon/pilot eller skoleeierdialog; fredag tilbud, oppfølging og vurdering av ukens læring. Én time per dag. Ekstra tid prioriteres til avtalte møter og konkrete hindringer for bruk.

Mål gjentatt bruk, lærerens tidsbruk, elevens vei til riktig lekse, lærerens forståelse av oversikten, feil/støttebehov og beslutningsdato. Minst tre av fem gjennomførte piloter bør bruke løsningen igjen i uke tre. Tersklene er lokale arbeidsmål. Ikke bruk likes eller generell ros som bevis for kjøp eller læringseffekt.

Operative salgssaker følges i Beads på skolenivå med neste handling/dato, behov, kjøpsvei og status. Fortrolige kontaktopplysninger og elevdata skal ikke inn i repoet. Kommersiell analyse bruker anonyme/tilstrekkelig aggregerte pilotoppsummeringer; elevresultatene i produktet er for pedagogisk oppfølging og skal ikke brukes som markedsføringsdata.

## 10. Oppfølging og beslutninger

`aua1` gjelder lærerside, demonstrasjon og enkel lekseflyt. `oroa` gjelder samtaler og kjøpsvei i begge segmenter. `ze78` gjelder skoleabonnement og pris. `brq` er kanonisk personvernmodell; overlappende `nsx` samordnes med denne. Eksisterende pilotporter `y8nr`, `s2qg`, `ee0` og lydkontroll `4or0` gjenbrukes sammen med de nye server-/tilgangstestene.

Ved lav respons: undersøk budskap og kontaktvei. Ved vanskelig oppstart: rett den observerte flyten. Ved lite gjentatt bruk: undersøk lekseinnhold og lærerens behov før mer distribusjon. Ved utsatt kjøp: skill mellom manglende verdi, feil pris og godkjennings-/budsjettprosess. Feide og lærerplattformen forblir produktretningen; omfang og rekkefølge justeres etter erfaring.

## 11. Materiellutkast

Utkastene er ikke publisert eller sendt. Før lansering brukes fremtidsform om funksjoner som ikke er levert.

### Lærerside før pilotlansering

**En enklere måte å gi spanskleksene på**

Spansk på 1-2-3 er for hele ungdomsskolen og spansk nivå I i videregående. Vi utvikler en lærerflyt der du kan tildele øving til klassen og følge elevenes arbeid i ordforråd, grammatikk, verbbøying og lytting. Elevene skal finne leksene sine ved å logge inn med Feide.

Målet er mindre arbeid med utskrifter og utdeling, og et bedre grunnlag for å følge opp elevene. Vi søker lærere fra begge skoleslag som vil prøve flyten og bidra med erfaringer fra egen undervisning.

**Hovedhandling:** Avtal en demonstrasjon.

**Status:** Dagens app tilbyr lokal øving uten konto. Feide, sentrale lekser og læreroversikt er under planlegging og skal prøves før ordinær skoleleveranse.

### Demo på 60–90 sekunder

Vis lærerens valg av klasse og oppgaver, publisering med frist, elevens «Mine lekser», ett elevforsøk og lærerens oppdaterte oversikt. Avslutt med å vise områdene ordforråd, grammatikk, verb og lytting. Bruk bare syntetiske elever. Merk hele demonstrasjonen tydelig som prototype frem til funksjonene finnes.

### Facebook-innlegg

«Underviser du i spansk på ungdomsskolen eller spansk nivå I i videregående?

Hvordan gir og følger du opp lekser i dag? Jeg arbeider med Spansk på 1-2-3 og utvikler en løsning der læreren kan tildele øvingsoppgaver digitalt, eleven logger inn med Feide, og læreren ser gjennomføring og fremgang i ordforråd, grammatikk, verb og lytting.

Målet er å gjøre leksearbeidet enklere, blant annet for lærere som i dag lager og deler ut mange ark. Jeg ønsker å snakke med noen lærere om dagens arbeidsmåte og vise et tidlig forslag. Samtalen tar omtrent 20 minutter. Ta gjerne kontakt hvis du vil bidra.»

### Oppfølging etter samtale

«Takk for praten. Du beskrev [konkret utfordring med dagens lekser]. Neste steg er å vise hvordan [avtalt del av lærer-/elevflyten] kan fungere for din gruppe.

Vi følger opp [dato/handling]. Før en eventuell elevpilot avklarer vi produktets faktiske status, skolens godkjenning, Feide-aktivering og avgrenset omfang. Piloten går ikke automatisk over i et abonnement.»

Fyll bare inn avtalte forhold. Ingen meldinger, registreringer hos Sikt, publisering eller produksjonsendringer er utført som del av denne planen.

## 12. Kulturpakker som konkret inngang, 5. oktober 2026

Produkteieren foreslår komplette, språklig tilgjengelige opplegg om høytider og dagligliv som en lærerinngang. Første avgrensede kandidat er «Jul i Spania og Chile – to land, samme høytid», med original tekst, gloser, aktive oppgaver, tilpasning, 45-minutters lærerveiledning og fasit. Se [kulturplanen](2026-10-05_kulturpakker-som-laererinngang.md) for kilder, konseptprøve og evalueringsopplegg.

Kommunikasjonshypotesen er at et konkret opplegg læreren kan bruke i en kommende time gir en tydeligere inngang til produktet. Dette bygger på produkteierens gjentatte behov og to behovseksempler i et vedlagt skjermbilde; det beviser ikke etterspørsel, betalingsvilje eller årsaken til responsen på tidligere innlegg. Valider faktisk bruk og forberedelsesarbeid før en større katalog.

En ferdig, rettighetsavklart prøvepakke kan få en egen lærerinngang og vise videre ordøving i appen. Samme innhold kan senere presenteres som korte kulturepisoder for selvstendig øving. Dette supplerer skoleproduktet og B2C-hypotesen; læreroppfølging, Feide og personvernportene følger fortsatt den eksisterende planen. Ingen Facebook-innlegg, deling, nye kontoer, priser eller publisering er utført i denne oppfølgingen.
