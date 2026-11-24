# Teknisk underlag til skoleeiers DPIA

Versjon 12. november 2026. **Utfylt teknisk bistand, ikke gjennomført DPIA eller godkjent restrisiko.** Skoleeier skal vurdere faktisk skole, brukergrupper, leverandører og drift med personvernombudets råd. En eksisterende DPIA må dokumentert dekke denne behandlingen og oppdateres ved avvik.

Læreroversikten evaluerer identifiserbare elevers øving. Vi legger derfor til grunn at [Datatilsynets obligatoriske kategori for evaluering av læring og mestring i skolen](https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/vurdering-av-personvernkonsekvenser/nar-ma-man-gjennomfore-en-vurdering-av-personvernkonsekvenser/) gjelder. En liten pilot uten karaktersetting er ikke tilstrekkelig grunn til å utelate vurderingen.

## Beskrivelse og nødvendighet

Formålet er tildelt spanskøving og formativ oversikt, ikke karaktervedtak. Tilbudsforslaget gjelder én skole og inntil seks klasser. Skoleeier fastsetter faktisk elevantall, periode og omfang; ny pedagogisk pilot er ikke et kjøpskrav. Feide leverer navn/issuer/subject; appen bruker intern UUID, avtalte roller og skole-/klassemedlemskap. Godkjente lærere tildeler innholdsversjon og mottakere. Valgt svaralternativ sendes til retting; læringshendelsen lagrer utfall, forsøk, oppgavereferanse, økt og tid, ikke råsvar/lyd/fritekst. Hintfeltet er 0 i dagens flyt. Apphosting og databaser behandler dessuten nødvendige forbindelses-/sikkerhetsdata; journal sikrer tilbakekall etter restore.

Skoleeier fyller inn behandlingsgrunnlag/supplerende lov, faktisk alder/antall, obligatorisk eller valgfri bruk, alternative undervisningsmåter, begrunnelse for navn og forsøk/tid, behov for lærerinnsyn og hvordan elev/foresatt-perspektivet er innhentet. Vurder om mindre identifiserende løsning dekker formålet. Beskriv også rettighetsbistand, slettefrister, leverandørens metadata/land/sekundærbruk og konkrete overføringsgarantier.

## Risikoscenarier til konkret vurdering

| Risiko for eleven | Tiltak/bevis som finnes | Hva skolen og Oversikt må avklare før start |
|---|---|---|
| Uvedkommende får navngitte resultater | Skole-/klasse-/mottakerkontroll, journal og lærer-/administrator-ACR; lokal regresjon og ekstern syntetisk kjede. | Sterk lærerinnlogging bestod14.oktober. Produksjonsmiljøets relevante tilgangsmatrise og drifts-/supporttilganger gjenstår. |
| Feil person får skole-/lærerrolle | Ukjent Feide-konto får pending, separate engangskoder, godkjenning; ingen automatisk rolle fra navn. | Verifisert fullmakt/førsteadmin, sikre invitasjonskanaler, skoleeiers faktisk Feide-identitet/livsløp. |
| Resultater mistolkes eller brukes til rangering | Formativ tekst; fire avgrensede fagområder, ingen automatisk karakter. | Læreropplæring, retting av feil, elevinnsyn, faktisk bruk og informert alternativ. |
| Skolen lagrer mer/lengre enn nødvendig | Råsvar og audio utelatt fra hendelser; skoleeksport/avvikling og avgrenset cron-/alarmtest bestod14.–15.oktober. | Vedtatt policy og ekstern dekning av alle kategorier, særlig globale OIDC-/pendingposter, journal og kopier. Skolejobben dekker også åpne/fristløse lekser, men testet omfang er avgrenset. |
| Restore gjenåpner slettet data/tilgang | Separat journal og lokal replay-test. | Isolert leverandørrestore, kopihorisont, journal-/restopprydding og målt RPO/RTO. |
| Leverandørens logger/support/sekundærbruk eksponerer data | Appen unngår rådata i logger; form_post callback. | Faktiske plattformfelter, interne frister, land, egne behandlingsformål og overføringsvurdering. Stockholm alene løser ikke dette. |
| Delt enhet eller lokal eksport eksponerer opplysninger | Logout prøvd; skole-API skal ikke caches; lokal øving separat. | Skoleutstyrets rutiner, ren profil/ny bruker, sikker eksportlevering og sletting av nedlastede filer. |
| Bruker hindres av tilgjengelighet/innlogging | Mobilkontroll og native kontroller; fri øving finnes. | Skjermleser/zoom/lyd og avtalte alternativer; ordinær callback uten cookieinngrep er prøvd 12. november; bekreft samme flyt i faktisk skolemiljø. |

Dette er scenarioer, ikke ferdige sannsynlighets-/konsekvenspoeng. Skoleeier registrerer for hvert scenario iboende risiko, tiltak/eier/frister, bevis og gjenværende risiko for de registrertes rettigheter. Leverandørens egen sikkerhetsaudit erstatter ikke DPIA.

## Skoleeiers konklusjon

[DPIA-referanse/versjon/dato og vurdering av nødvendighet/proporsjonalitet]. [Personvernombudets råd og håndtering av råd]. [Registrerte/foresatte eller representanter konsultert der passende, ellers begrunnelse]. [Besluttede tiltak og gjenstående risiko]. [Godkjenner med myndighet]. Ved høy risiko som tiltakene ikke reduserer tilstrekkelig, gjennomføres nødvendig forhåndsdrøftelse med Datatilsynet før behandlingen starter. Dette dokumentet har ingen forhåndsutfylt godkjenning.
