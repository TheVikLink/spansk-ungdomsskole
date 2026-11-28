# Første skoleleveranse – status 9. november 2026

## Første Feide-pilot, 24. november 2026

**Hold skoleinvitasjonen tilbake.** Den [ferdige arbeidskopien av invitasjonen og lærerveiledningen](https://docs.google.com/document/d/1YWyFaiiw8Iq4SiNcU2MtsGq1KI_DWJH9kwzNP4aoURc/edit) og [tilbudet](../../salg/tilbud-forste-skole.md) gir første skole to måneder gratis fra bekreftet aktivering, deretter valgfri videreføring for 4 995 kr per skole per år. Piloten omfatter alt eksisterende spanskinnhold. Den korte artikkeløvelsen er et forslag til første time.

Produksjonsdatabasen hadde null skoler ved lesende kontroll 24. november. Den 27. november besluttet produkteieren å slette de to tomme produksjonsprosjektene i Supabase (`Spansk123` / `ncrxkjkgcbiugwhmyrds` og `Spansk123 security journal` / `ulxalecuqjyezqruwtsd`) for å spare kostnader inntil første kundeskole signerer; begge stagingdatabasene beholdes, og nye produksjonsdatabaser på PostgreSQL 17.12 opprettes før første skoleaktivering. Begge stagingdatabasene ble 27. november oppgradert fra PostgreSQL 17.6.1.171 til `17.12.0.002` og bekreftet friske med alle migreringer, 23 kildehasher, Security Advisor uten feil/advarsler og `/healthz` `{"status":"ok","securityJournal":"ok"}` mot staging-appen. Den 28. november ble det utdaterte testprosjektet `spansk123-school-retention-production` slettet fra Vercel, Healthchecks-monitoren `Spansk123 STAGING – globale innloggingsøkter` kontrollert `UP` etter PG 17.12-oppgraderingen, minstetilgangsretensjon og DB-først-stopp bekreftet på PG `17.12`, og et passivt standby-stagingprosjekt (`spansk123-school-retention-staging`, `enabled:false`, `crons:[]`) satt opp uten databasecredentials. Anonyme forespørsler til skole.spansk123.no og øktendepunktet ble sendt til Vercel-innlogging. Returmottaket svarte 405 på GET som forventet. Den [beskyttede produksjonsprøven](../../../thoughts/shared/plans/2026-11-19_feide-produksjon-og-restoreproeve.md) 19. november bekreftet Feide-retur og utlogging med syntetisk konto uten skole. Hele lærer- og elevflyten er tidligere prøvd i staging.

Før invitasjonen kan sendes, gjenstår gjenoppretting og patch i isolert skymiljø, avklaring av varig produksjonsdrift, [leverandøravklaringer](../leverandor-og-fristbilag.md), faglig gjennomgang av eksisterende innhold og lyd der den fortsatt mangler og [ordinær Feide-prøve på produksjonsdomenet](../produksjonsleveranse.md). Syntetisk sletting og varsling er dokumentert i produksjon 16.–17. november. Produksjonskontroll 24. november viser null retensjonspolicyer, null kjørende retensjonsjobber og null innloggingsroller for skoleworkeren. Se [driftsprøvene](../skoleworker-aktivering.md#scheduler-feilprøve-og-varig-friskmelding). Skolens egne avtaler og aktivering følger når en skole takker ja. Beslutning og kvitteringer føres i rbec.4.

## Teknisk status — 12. november 2026

Samordnet kandidat ecd63b92 med minimal pakkefiks er nå faktisk prøvd i staging: dpl_9bN6ms4U6pN9rQ13VYFr4J3U4CEw, appbygg fcdf97b55d8da417, appmigrering012/journal006 og23kildebindinger. Full lokal kandidatgate112+112+613bestod tidligere samme dag; ferske sikkerhetsnærtester12/12. Eiergodkjent domeneunntak bare for app.spansk123.no lar ordinær Feide form_post passere. Prosjektets Vercel-vern og kanonisk Preview-beskyttelse beholdes; skolesiden er offentlig, skoledata krever appens Feide/MFA/medlemskap.32cookieløse tilgangskontroller bestod.

Ny privat Safari-MFA-lærerinnlogging uten cookieinngrep, fire nye korte syntetiske lekser, separat elevinnlogging, lagringskvitteringer, feil→retting, komplett lyd, reload og lærerfremgang1/1i alle fireområder samt begge app-/Feidelogout er verifisert. Eksisterende syntetisk klasse/roller ble brukt; ingen ny skole eller ekte bruker aktivert. [Rapport og tilbakeføring](../../../output/external-staging-control-2026-11-12/README.md). Hosted rårestore/patch, faktisk varig driftsaktivering og kundeavtale/produksjonsleveranse gjenstår. Eldre daterte kandidat-/stagingopplysninger nedenfor er historikk og overstyres av denne statusen.

Produkteieren har bestilt funksjonsfrys og konsentrasjon om første skoleleveranse. **Kandidaten er under lokal verifikasjon, ikke frigitt for elevdata.** Beads `spansk-ungdomsskole-rbec.4` er operativ samlesak; tabellen nedenfor avgrenser leveransen og erstatter ikke oppgavestatus der.

## Klasseromserfaring og endret salgskrav

Produkteieren opplyser 9. november at produktet ble utviklet i samarbeid med en egen 9. klasse hen underviste året før, gjennom elevtilbakemeldinger og løpende forbedringer. Dette er lærerledet klasseromserfaring; produktet starter ikke uten erfaring fra elevbruk. Det er ikke oppgitt hvilke versjoner/funksjoner som var brukt. Vi tilskriver derfor ikke dagens Feide-/backendflyt eller nyere innhold samme prøving, og hevder ikke målt læringseffekt.

**Ny pilotskole er ikke et lanserings- eller salgskrav.** Obligatorisk gratispilot, fem lærerprøver og krav om nye piloter fra begge skoleslag utgår som forutsetninger. Første skole kan være betalende kunde når leveransen er klar. Skoleavtaler og godkjenning før aktivering, teknisk verifikasjon og kontroll av konkret nytt/ukontrollert innhold gjelder fortsatt. Historiske pilotforslag nedenfor leses med denne overstyringen.

## Avgrenset kandidat

Første betalte skoleleveranse: én skole, en navngitt kontaktlærer og inntil seks klasser, etter eierens korrigering9.november. Introduksjonspris første år 4 995 kr som arbeidsforslag; eventuell gratis utprøving er valgfri. Eksisterende kjede: Feide → klasseinvitasjon/godkjenning → lærer tildeler → elev øver → lærer følger opp. Ordforråd, grammatikk, verb og lytting beholdes som avtalt omfang; ingen ny innholdspakke eller funksjon er nødvendig. Faglig kontroll av valgt lyd/innhold gjenstår.

Lokal grunnapp og eksport/import skal fungere videre. Gjeldende HTML/service-worker-bygg er `4d98b6d636302723` over git-HEAD `d45fbfd`; arbeidskopien inneholder mange tidligere endringer og er ikke en isolert, committet releasekandidat. Bygg-ID gjelder grunnappen, ikke et komplett fingeravtrykk av skolebackend. Eksakt filutvalg, full test og stagingkandidat må avklares i y8nr/rbec.4 før produksjonslevering.

## Hva bevisene faktisk sier

- **Historisk ekstern prøve:** ekte Feide-retur/sterk lærerinnlogging/admin-MFA/logout, fire lekseområder og minimerte resultater er dokumentert med testkontoer i oktober. Se tabellen fra 15. oktober nedenfor. Dette er ikke en ny kontroll av staging 9. november.
- **Fersk lokal prøve 9. november:** `node --test tests/server/school-flow.e2e.test.mjs`, Node 22.23.2, bestod 1/1. Reell lokal HTTP/OIDC-kjede med to isolerte PGlite-databaser, klasseinvitasjon, fire lekseområder og lagrede resultater. Ikke nettleser-, native PostgreSQL- eller ekstern Feide-bevis.
- **Inn-/utlogging rettet i arbeidsgrenen:** eksisterende senere stagingrettelser for lokal Lax-cookie, same-origin referrer bare på skoleflaten, oppdatert CSRF-felt ved innsending og eksplisitt Feide-utloggingslenke er samordnet i arbeidskopien. Ingen produksjonscookie eller Origin-/CSRF-kontroll er svekket. 10målrettede Chromium-prøver består: vanlig login/klasseoppretting, lokalt/providerlogout, kontobytte, mobil/desktop, feilOrigin/CSRF, gammeløktavslag, tapt kvittering og avbrutt logout med ubekreftet elevsvar. Fersk build:app og ubrutt test:all for den samordnede sluttkandidaten bestod:112generelleNode,53skole-/server og582Chromium,exit0. Tidligere JSON-variant er erstattet. Ingen ny deploy.
- **Drift kontrollert lesende:** global authstagingjobb kjører faktisk (607kjøringer,siste9.11kl15:40Oslo ved nyeste kontroll).0aktive skolepolicyer; skolevis drift/avtalt retensjon er separat og ikke aktivert. Se [drift](../drift-og-beredskap.md).
- **Database:** begge stagingprosjekter bekreftet17.6.1.171 og0AdvisorERROR/WARN. Den lesende kompatibilitetskontrollen er kjørt; [gjenoppretting/oppgradering](../gjenoppretting-og-oppgradering.md) viser resultater og den fortsatt uferdige eksterne integrasjonen. Ingen patch/skyrestore startet.
- **Dokumentpakke:** [salgsavslutning](../salgsavslutning.md) samler skoleavtale, DBAA–D, personvern, sikkerhet, drift og aktivering. Ole Henrik Vik er eierbekreftet ansvarlig/signaturkontakt. Retensjonsforslag, hverdagsstøtte/to arbeidsdager og privat hendelsestelefon hele døgnet er eierbekreftet. Ingen reserve er navngitt; kundespesifikke vilkår og faktisk bemanning ved fravær avklares før aktivering.


Skoleopphørskandidaten9.november er prøvd med separat journal og native PostgreSQL17.11: stans → eksport → auditrydding med bevart læringsdata → endelig purge, andre skoler/delte brukere bevart. Ny jobbpakke er inaktiv; nye SQLmigreringer er ikke eksternt installert. Se [leveransepakken](../../../output/school-operations-and-sales-2026-11-09/README.md) og [dagens policy-/kontaktark](pilotpolicy-og-kontakter.md). Disse bevisene er fra en egen kodegren og erstatter ikke samordnet staginggate for endelig release.

## Samlet avgrensning av leveransehindrene

| Eksisterende Beads | Ansvar | Neste konkrete resultat som trengs |
| --- | --- | --- |
| ya9r (`ya9r.11` lukket 24.11 ved Valg 2B) | Produkteier utfører i Supabase; Codex støtter | Manuell logisk restore-runbook med lokal `verifyRestoredSchoolDatabase` er vedtatt og verifisert mot PostgreSQL 17.12 (24. november). Skreddersydd automatisert sky-restore-transport (`ya9r.11`) utgår. Gjenstående handling i `ya9r`: ta verifisert logisk dump og oppgrader stagingdatabasene til 17.12 i Supabase-panelet. |
| twkq | Codex + produkteier/skoleeier | Etabler og prøv varig retensjon, varsling, ansvar/håndtering ved fravær og sikker eksportlevering med skoleeiers instruks. Lokal stans-/eksport-/slettekandidat og inaktiv skoleworker er nå klargjort; faktisk aktivering gjenstår. Tidligere engangstest er ikke varig drift. |
| zq9b | Produkteier + skoleeier | Ferdig avtale-/personvernunderlag og bekreftet riktig avtalepart, kontakter og skoleeiergodkjenning før den første kundeskolen aktiveres. Ingen separat pilotskole kreves før salg. Ikke samle elevlister under rekruttering. |
| y8nr / 1pqd / 4or0 / ee0 | Codex for teknisk kandidat; lærer/skole for faglig og fysisk prøve | Én avgrenset kandidat med grønn testgate, håndterte relevante sikkerhetsfunn, kontrollert innhold/lyd og skoleutstyr. Ikke fullfør alle forbedringsønsker som vilkår for demo. |
| zcnf | Codex | Lokal retting og10nærtester består. Sluttgate/review skal knyttes til den endelige native flyten; faktisk levering/stagingkontroll er separat. |
| rbec.4 / oku4 | Codex klargjør; produkteier bestiller levering | Samlet restliste, firetrinns modernisering (`oku4`), faktisk stagingprøve av eksakt kandidat og separat produksjonslevering når forutsetningene er oppfylt. Ingen ny pedagogisk skolepilot er påkrevd før salg; faktisk kundeoppstart følger avtalte vilkår. |

## Supabase: beslutning 24. november 2026 (Valg 2B – manuell logisk runbook)

SU-508992 har et dokumentert teknisk svar **21. oktober**: kunden kan ikke stenge bestemte reserverte leverandørroller som en helautomatisert rårestoremetode krevde. [Svarreferat](../../../output/logical-restore-2026-10-20/support-response-2026-10-21.md).

**Eierbeslutning 24. november 2026 (Valg 2B):** Vi beholder eksisterende to-database-runtime (`appPool` + `journalPool`), avslutter utviklingen av skreddersydd automatisert sky-restore-transport (`ya9r.11`), og bruker den [manuelle logiske gjenopprettingsrutinen med `verifyRestoredSchoolDatabase`](../gjenoppretting-og-oppgradering.md) som ble verifisert mot PostgreSQL 17.12 i både lokal instans og Supabase 24. november 2026. Demo, lærersamtaler og prisavklaring går parallelt.

[Lokalt demo- og tilbudsunderlag](../../salg/forste-skolepakke.md) har lærersidetekst, 90-sekunders manus, to lekseeksempler, forslag til pilot/abonnement og eksplisitte prisantakelser. Ikke publisert, sendt eller prøvd med lærere.

---

## Historisk pilotstatus – 15. oktober 2026

**Klar for pilotdialog og teknisk demonstrasjon med syntetiske brukere. Ikke klar for reelle elevdata.** Ingen navngitt skoleeier, signert skoleavtale eller produksjonsaktivering foreligger. Beads er kilde for live arbeid; dette er et datert evidens- og beslutningsunderlag.

## Bestått og ferdig dokumentert

| Område | Faktisk bevis | Praktisk grense |
| --- | --- | --- |
| Feide og roller | Ekte Feide-retur/navn/logout, admin-MFA og sterk lærerinnlogging med nekt av svak økt | Offentlige syntetiske testkontoer; skolemyndighet gis fortsatt av skoleeier, ikke av Feide-navn |
| Lærer/elev og fire lekseområder | Invitasjon, lærerens godkjenning, oppgaver, feil/retting, kvittering/reload og lærerfremgang | Skoleutstyr, faglig lærervurdering og faktisk elevpilot er ikke utført |
| UI-rettinger | Status uten reload, én Neste-knapp og direkte utlogging; mobil390 | Ikke full tilgjengelighetsgodkjenning |
| Rettigheter og skoleavvikling | Skoleeksport og journalført sletting av én disponibel skole; andre skoler/delte identiteter bevart | Sikker levering til faktisk skoleeier, globale sikkerhetsdata og kopier må inngå i instruks |
| Tidsstyring og alarm | Syv ekte minuttcron-kjøringer; journalfeil hindret sletting; recovery og manglende-kjøring ga mottatte e-poster | Fixtureavgrenset testjobb er avsluttet, alle tilganger stengt og monitor pauset; ingen varig drift |
| Lokal regresjon | Node22 fullgate47 generelle tester, 111 server-/skoletester og 483 Chromium-tester bestått; separate nativePG-kontroller | Fem valgfrie tester hoppet over i standardporten; ikke alle miljøer eller full sikkerhetssertifisering |

Evidens: [Feide/lekser](../../../output/feide-ekstern-lekse-2026-10-13/README.md), [UI](../../../output/skole-ui-retting-2026-10-13/README.md), [eksport/sletting/sterk lærer](../../../output/pilot-ops-2026-10-14/README.md), [cron/e-post](../../../output/retention-cron-2026-10-15/README.md). Appalias app.spansk123.no er beskyttet staging på dpl_JDFreRwe8D3SZCiqGRd3S62ui3qw, app37220f1/arn1. Det er ikke skolens produksjonsmiljø.

## Historiske restporter fra15.oktober — les dagens avgrensning over

| Port og Beads | Hva mangler | Hvem må bidra |
| --- | --- | --- |
| Databasepatch og isolert leverandørrestore (ya9r/twkq/rbec.4) | Begge databaser er fortsatt17.6.1.171;17.11.0.003 tilbys. Fysiske backups er sett, men isolert fysisk restore med nyere journal, sperret tilgang fra oppstart og målte RPO/RTO er ikke bestått. | Oversikt kan utføre etter konkret valgt metode, kostnadsramme/tilgang og vedlikeholdsvindu; leverandøravklaring hvis oppstartsisolasjon mangler |
| Full livsløpsdekning og varig drift (fuoa/twkq) | Global OIDC-/pendingopprydding er installert privat hos migreringseieren og bestod avgrenset ekstern engangstest15.10. Ingen varig global jobb er aktivert. Ny jobb er lokalt klargjort/testet med eiergodkjenning, men kostnadsporten står åpen; se [driftspakke](../../../output/global-auth-permanent-2026-10-15/README.md). Se [testkvittering](../../../output/global-auth-staging-2026-10-15/README.md). Skolejobben har fortsatt bare skoleavgrenset kapasitet. Journal/restreferanser/alle kopityper og plattformlogger må ha vedtatt og gjennomførbar frist. Varig jobb, varsling, bemanning/reserve og sikker eksportlevering må innføres. | Oversikt utvikler/tester; eier og skoleeier vedtar frister, dekning og instruks. Testens1-dags testpolicy skal ikke brukes som pilotstandard |
| Leverandører og avtaler (zq9b/brq) | Faktiske avtaleversjoner, underleverandør-/land-/support-/logg-/backupbilag og eventuelle overføringer. Leverandørenes generelle DPAer erstatter ikke konto-/prosjektbevis. | Oversikt og aktuelle leverandører; skoleeier godkjenner |
| Pilotskole og ansvar (zq9b/rbec.4) | Navngitt skoleeier/skole/Feide-org, ansvarlig lærer, omfang og periode. Skoleeierens DPIA/grunnlag/PVO-råd, signerte pilot-/databehandleravtaler. Oversikts signatar/fullmakt, beredskapsansvarlig/reserve og faktisk dekning er ikke oppgitt. Bekreftet e-post er olevik91@gmail.com. | Produkteier/skoleeier. Ikke del elevlister eller Feide-subject i innledende kontakt |
| Produksjon og skoleprøve (rbec.4/1pqd/4or0) | Separat produksjonslevering, feil-/tilgangsmatrise og vanlig innlogging uten manuelle cookieinngrep. Gjenværende sikkerhets-/tilgjengelighetskontroller, skoleutstyr/skjermleser/zoom og faglig lyd-/innholdsgodkjenning. Deretter navngitt skoleaktivering. | Oversikt kan forberede teknisk; reell levering/tilgang trenger uttrykkelig instruks. Lærer/skole medvirker ved pedagogisk og fysisk prøve |

Ikke alle åpne ASVS-funn er nødvendigvis pilotblokkeringer, men relevans, risikoaksept og tiltak må vurderes. ASVS-dokumentet er en egenvurdering med 183 kartlagte L2-krav, ikke en sertifisering. Syntetisk mobiltest beviser ikke WCAG-oppfyllelse eller undervisningskvalitet.

## Gjort uten nye opplysninger eller godkjenning15. oktober

Utdaterte påstander i personverninformasjon, DBA, aktiveringsprotokoll, DPIA-underlag, pilotpolicy, drifts- og loggdokumentasjon er avstemt mot de siste kvitteringene. Bekreftet e-post er beholdt; signatar, frister og skoledata er ikke gjettet. Readonly kontroll fant friske prosjekter, faktisk backuphistorikk og tilgjengelig patch; avgrenset kompatibilitetskontroll ga0 logiske slots,0 bruker-reg*-kolonner og0 md5-passord på de navngitte runtimekontoene. Ingen hashes/passord ble hentet ut, ingen konto ble åpnet.

[Driftsprøven](../../../thoughts/shared/plans/2026-10-15_pilot-restporter-og-driftsprove.md) er klargjort og kritisk gjennomgått. Den beskriver gjenværende forutsetninger og stoppunkter, ikke en ferdig autorisert bestilling. Særlig må en fysisk klone være sperret fra første oppstart; en etterfølgende kontosperring er utilstrekkelig. Ingen kjøp, klone, vedlikehold, signering, portalpublisering eller permanent drift er utført.

En [frosset lokal dokumentpakke](../../../output/pilotberedskap-2026-10-15/README.md) gir versjon/hash og faktisk bevis for denne revisjonen. Den kan gjennomgås nå, men er ikke en signert avtale. Skolespesifikke felter fylles først når rette parter og beslutninger foreligger.
