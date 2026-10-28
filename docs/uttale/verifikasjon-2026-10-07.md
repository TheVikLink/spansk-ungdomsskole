# Uttaleskolen: gjeldende lokal verifikasjon 7. oktober 2026

Gjeldende bygg: `7fc40995f2712bd0`, gren `codex/uttaleskole-refold`. Dette erstatter flyten i det første bygget `320c438845e6c18e`. Ingen commit, push eller publisering.

## Forenkling etter eierens utprøving

Vokalgjetting, regelquiz, quizscore og bekreftelsene som skjulte avspillingen er fjernet. Hvert lydkort viser kort forklaring, ord og setning på samme side. «Hør ordet» og «Hør setningen» spiller direkte med ett trykk. Forrige/Neste ligger fast nederst, og nytt kort åpnes fra toppen. Opptaksfeltet er valgfritt og lukket i utgangspunktet. Oversikten viser én foreslått start og åpner andre temaer ved behov. Faste handlinger per vokalkort er redusert fra 13 til 3: hør ord, hør setning, neste/fullfør. Repetisjon, betydning og egenopptak kan brukes etter behov.

All elevrettet lydskrift og de 31 separate bokstavopptakene er fjernet. De 62 ord-/setningsmodellene beholdes uendret. «Finn en lyd» har kortere navn. En meny over alle 31 lydene nederst åpner en ett-kortsøkt på valgt lyd. Åpning av opptaksfeltet ruller hele forklaringen og kontrollene inn i visningen uten å starte mikrofonen.

## Utført kontroll

`npm run build:app`, `npm run check:pronunciation` og bytekontroll av public-pakken bestod med Node 22.23.3. `npm run test:all` bestod 79 enhets-/katalogtester, 52 servertester og 544 av 545 Chromium-tester. Én opptakstest fikk tidsavbrudd etter fem sekunder mens den ventet på den syntetiske mikrofonen. Denne kontrollen har nå 15 sekunders ventetid. Ny målrettet kjøring bestod alle 17 uttaletestene på 36,5 sekunder, inkludert den berørte mikrofontesten. Resultatet dokumenteres i [uttaletestloggen](../../output/uttale/uttale-focused-node22.log). [Samlet lokal testlogg](../../output/uttale/test-all-node22.log) viser tidsavbruddet og skal ikke tolkes som helt grønn kjøring.

Første samlede kjøring avdekket også en test som leste cachen før asynkron opprydding var ferdig. Kontrollen venter nå på fullført nedlasting, og offline-testene bestod i den neste samlede kjøringen.

Katalogen har 31 lydtemaer, 62 originale ord-/setningsopptak og ingen quizfelt. Samtlige lydhash er kontrollert både i kilden og lokal public-pakke. HTML i public-pakken er identisk med gjeldende kilde. Lydfilene ble dekodet uten feil under kildekartleggingen.

Nye flyttester kontrollerer en komplett tre-kortsøkt uten mikrofon, ett-trykksavspilling, fravær av quiz/reveal, synlig navigasjon på mobil, fokus/rulleposisjon ved kortbytte, tilbakeknapp uten dobbelttelling, gammel og ny import/eksport, kvotefeil og ugyldige data uten overskriving. Manglende lyd vises ved den aktuelle modellen og gir ingen falsk fremgang. Oppslag registrerer ingen øving. Alle 62 modellfiler virker etter nedlasting og omlasting uten nett, med hashkontroll og byteområder; skadet/slettet cache og avbrutt nedlasting kan gjenopprettes.

MediaRecorder er prøvd med en syntetisk mikrofon: spor stoppes før lytting, egen lyd spilles lokalt, ingen lyd skrives i localStorage eller eksport og ingen ikke-GET-kall sendes. Avslag, sen tillatelse, sen avspillingsfeil, 15-sekundersgrense, mer enn 1 MB, skjult side og reset håndteres. Lukking av opptaksfelt eller bytte av kort rydder lyd og objekt-URL. Nye tester kontrollerer fullt synlig opptaksfelt ved 390/1280 piksler, én valgt lyd i en egen økt og at gamle letter-opptak fjernes fra offlinecachen etter fullført nedlasting. Ingen ekte elevstemmer er brukt.

Manuell prøve i Codex-nettleseren ved 390/1280 piksler bekreftet direkte avspilling, tydelige modellknapper, ord og setning på samme kort, tastaturavspilling og fast navigasjon. Git-diff, whitespace og lokale dokumentlenker kontrolleres ved handoff. Se [gjeldende lærerbeskrivelse](laererveiledning.md) og [planen for enklere flyt](../../thoughts/shared/plans/2026-10-07_uttaleskole-enklere-flyt.md).

## Praktisk avgrensning

Tekniske tester bekrefter funksjon og opprydding. Menneskelig gjennomlytting mot tekstene, faktisk skoleutstyr, Safari/iPad, 200 % nettleserzoom og klasseprøve følges fortsatt i Beads `spansk-ungdomsskole-lamg.1`. Produksjonsheadere er ikke prøvd i denne lokale revisjonen. Dette er ingen attest på uttalekvalitet eller dokumentert læringseffekt. Se [faglig gjennomgang](faglig-gjennomgang.md).
