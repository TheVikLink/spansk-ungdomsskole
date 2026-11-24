# Skolepolicy og Oversikts kontaktark

Avstemt 12. november 2026. Leverandørens forslag er bekreftet av Ole Henrik Vik. Skoleeier skal bekrefte instruksen før aktivering. Lokal klargjøring er ikke innført produksjonsdrift. Dette arket utfyller DBA bilag C/D.

## Omfang og frister

Første skole kan være betalende kunde. Tilbudsforslaget omfatter én skole og inntil seks klasser. Ingen ny pedagogisk pilot er påkrevd. Det tidligere forslaget om to klasser i åtte uker var et pilotforslag og gjelder ikke som salgsgrense.

| Kategori | Bekreftet leverandørforslag | Faktisk gjennomføring |
|---|---|---|
| Lekser og læringshendelser | Beholdes i avtaleperioden. Tilgang stenges ved opphør; kunden får 30 dager til eksport. Skolens læringsdata slettes fra aktiv drift senest da, tidligere etter dokumentert instruks. | Ny lokal kandidat skiller skoleavgrenset stans, autorisert eksport og endelig sletting. `learning_keep_until` verner avtale-/eksportperioden. Blokkert skoles læringsdata velges aldri av bakgrunnsjobben. Full sletting er en separat operatøroppgave med frist og ansvar, ikke en automatisk effekt av denne jobben. App 012/journal 006 og 23 kildebindinger er nå eksternt kontrollert; kundepolicy/skoleworker er ikke aktivert. |
| Medlemskap og identiteter | Skoletilgang tilbakekalles straks ved opphør. Skolens medlemskapsrader slettes senest 30 dager etter opphør. | Stans beholder radene for eksport. Endelig skolepurge fjerner dem. Delte identiteter/andre skoler skal beholdes; global kontosletting er ikke skoleavvikling. Globale identitets- og journalreferanser har egne dokumenterte frister. |
| Appens sikkerhetslogger | 30 dager fra hendelsen, med særskilt dokumentert og avgrenset bevaring ved pågående hendelse. | Skoleavgrenset opprydding virker også under eksportvinduet. Policy, kjøreplan og alarm må aktiveres og prøves separat. Plattform-/supportlogger omfattes ikke automatisk av appens frist. |
| Økter og invitasjoner | Fysisk opprydding daglig etter utløp/tilbakekall/bruk. Teknisk appøkt maks 8 timer, OIDC maks 5 minutter og invitasjon maks 7 dager. | Separat global stagingjobb er aktiv; den er ikke skolens retensjonsjobb. Ny skoleworker leveres inaktiv, uten cron eller nye credentials. |
| Backup | Bare frister som faktisk kan dokumenteres og avtales. Gjenopprettede kopier skal ikke åpne slettet data eller tilbakekalt tilgang. | Avtal faktisk leverandør-/operatørkopiutløp, behandlingsland og gjenoppretting. Hosted restore/patch gjenstår. Ikke viderefør eldre forslag om 30 dagers backupfrist som en garanti. |
| Sikkerhetsjournal/restreferanser | Minimale sperre-/slettereferanser må verne mot gjenåpning fra gamle kopier; fristen må være dokumenterbar. | Append-only runtime kan ikke rydde journalen. Eldre 90-dagersmål er ikke bekreftet. Egen sikker opprydding og kopiutløp må dokumenteres før fristen avtales. |
| Slettebekreftelse | Aktiv drift bekreftes slettet innen 30 dager; endelig bekreftelse oppgir faktisk kopi-/journalstatus. | Oppgi systemer, tidspunkt, restdata, hjemmel og frister. Ikke kall kontotombstone anonym. |

Ingen oppetids-, RPO- eller RTO-garanti er vedtatt. Tidligere pilotmål om RPO 24 timer/RTO én arbeidsdag er historiske forslag, ikke avtaleløfter.

## Kontakt og bemanning

| Felt | Bekreftet verdi | Kilde |
|---|---|---|
| Signatar, systemeier, drift og personvern | Ole Henrik Vik, eier og daglig leder | Produkteier 9.11.2026 |
| Teknisk støtte og rettighetskontakt | [olevik91@gmail.com](mailto:olevik91@gmail.com), hverdager; første svar innen to arbeidsdager | Produkteier 9.11.2026 |
| Sikkerhetshendelser | Privat telefon som kan kontaktes hele døgnet, utleveres direkte til kundens hendelseskontakt; samme e-post | Produkteier 9.11.2026 |
| Reserve | Ingen navngitt reserve oppgitt. Dette er en bemanningsbegrensning, ikke dokumentert døgnbemanning eller garantert umiddelbar respons. | Avgrensning av faktisk oppgitt bemanning |
| Kundens behandlingsansvarlige, instruksjonskontakt og personvernombud | Fylles sammen med skoleeier før aktivering | Kundespesifikt |
| Opphør og slettefrist | Avtal konkret opphørsdato, eksportfrist og ansvarlig Ole Henrik Vik. Skoleeier bekrefter instruksen. | Kundespesifikt |

To arbeidsdager gjelder vanlig støtte og utsetter ikke varsel om mulig personopplysningsbrudd uten ugrunnet opphold. Avtal faktisk eskalering og håndtering ved fravær; ikke lov en reserve som ikke finnes. Privat telefonnummer er bare lagret i ignorert kontaktfil med modus 0600, ikke i denne pakken eller monitoren.

En daglig jobb med audit_days=30 er ikke bevis for fysisk sletting senest 30 dager etter hendelsen. Operativ terskel, tidsplan og feilhåndtering må ha sikkerhetsmargin innen den bekreftede instruksen. Avtalens frist forlenges ikke for å passe en jobbs kjøreplan. Se [leverandør- og fristbilaget](../leverandor-og-fristbilag.md).
