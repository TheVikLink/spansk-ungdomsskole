# Pilot readiness audit

## Gjeldende status — 18. september 2026

Lokal teknisk releaseport er bestått på bygg `9028eaf8e4ba8273`: 446 nettlesertester med både én og to workere, 25 Node-tester og alle innholds-/byggkontroller. Offline-lydfeilen funnet under sluttkontrollen er rettet og gjentatt verifisert. Se [gjeldende releaseverifikasjon](docs/release-verification-2026-09-18.md) for eksakte kjøringer, feil underveis og avgrensning.

Dette er ikke en generell godkjenning for selvstendig helklassebruk. Lærerkontroll av innhold/opptak på fysisk skoleutstyr (`4or0`) og moderert elevpilot (`ee0`) gjenstår. Bruk [PILOT.md](PILOT.md) for neste menneskelige kontroll. Ingen publisering eller verifikasjon av dagens offentlige bygg inngår.

## Historisk audit — før 18. september 2026

Resten av dokumentet er bevart fra den tidligere, udaterte auditversjonen. Dens testtall, skippede offline-test og konklusjon er historisk evidens, ikke gjeldende releasegrunnlag.

### Tidligere konklusjon: klar for begrenset pilot med kjente oppfølgingspunkter

Denne sjekken gjelder den lokale, no-login pilotflyten. Den er ikke en effektstudie og erstatter ikke observasjon med ekte elever og lærer.

## Verifisert automatisk

- Ny elev starter med diagnoseflyt.
- Importert fremgang kan gjenopprette elevflyten uten ny diagnose.
- Kjernevisninger fungerer på mobil og desktop uten horisontal overflow.
- Standard lekseflyt holder data lokalt og åpner ingen ekstern innlevering.
- PWA-metadata, service-worker-registrering, tilgjengelighet og lokale tekstfelt er verifisert.
- OCR-/kapittelimport splitter alternative ord og synkroniserer fremgang mellom duplikater.
- Lærerens assignment-pakke kan importeres, brukes, eksporteres og importeres igjen uten duplikater.
- Fremgangseksport støtter både dagens og eldre formater.

## Testevidens

- `npm run test:pilot-audit`: 4 passerte
- `npm run test:pwa-ui`: 6 passerte, 1 miljøavhengig offline-test skippet
- `npm run test:chapter-text-import`: 3 passerte
- `npm run test:assignment-package`: 13 passerte
- `npm run test:import-export`: 9 passerte

## Manuell pilotsjekk som gjenstår

Lærer og elev bør teste dette i faktisk nettleser og på faktiske enheter:

1. Installer appen som PWA, slå av nett etter første lasting, og bekreft at en ny økt fortsatt åpner.
2. Gjennomfør én adaptiv gloselæringsøkt og kontroller at vanskelige ord kommer tilbake senere.
3. Gjennomfør blandet quiz med minst ett skrivefelt, ett nedtrekk og ett flervalg.
4. Test verb og grammatikk på mobil med tastatur.
5. Importer en lærerfil med alternative norske og spanske former.
6. Eksporter fremgang, slett nettleserdata i testprofilen, og importer fremgangen igjen.
7. Be elevene melde fra når et språklig riktig svar blir avvist.

## Kjente oppfølgingspunkter

- Grammatikken er funksjonell, men teoriinnholdet bør senere gjøres mer trinnvis og mindre teksttungt.
- Prepo Invaders kan få bedre forklaring av romlige preposisjoner før start.
- Offline-testen krever en ekte HTTPS-server/PWA-kontekst og er derfor ikke fullverifisert i den lokale filtestkjøringen.
- Ingen konto, Feide, skylagring eller sentral læreradministrasjon skal innføres som del av denne piloten.
