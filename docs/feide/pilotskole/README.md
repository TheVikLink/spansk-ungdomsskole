# Underlag til første pilotskole

Oppdatert 15. oktober 2026. **Klart for samtale og skoleeiers gjennomgang; ikke klart for reelle elevdata ennå.** Vi har ingen navngitt pilotskole eller signert skoleeieravtale. Ingen dokumenter er signert, publisert eller lagt i Feide/Drive gjennom denne leveransen.

## Leserekkefølge for skoleeier

1. [Pilotavtale](pilotavtale.md): konkret omfang, periode, prisfelt, støtte, avbrudd og avslutning.
2. [Personverninformasjon](../personverninformasjon.md): kort elevtekst og full informasjon til skolens utfylling/publisering.
3. [Databehandleravtale A–D](../databehandleravtale.md): instruks, data, tilgang, leverandører, frister og signering.
4. [Teknisk DPIA-underlag](dpia-underlag.md): databruk og konkrete scenarioer til skoleeiers gjennomførte vurdering.
5. [Pilotpolicy og kontaktark](pilotpolicy-og-kontakter.md): foreslåtte avgrensninger, konkrete slettefrister og felter til avtalebilagene.
6. [Skoleaktivering](../skoleaktivering.md): ansvar, oppstartsporter, Feide/app, første lekse og avslutning.

Første betalte skolepakke foreslås nå for én skole og inntil seks klasser. Eldre anbefaling om to klasser/åtteukerspilot er historisk og er ikke et salgskrav. Første møte trenger skoleeiers navn/org.nr., skolen/Feide-organisasjonen, avtaleansvarlig, Feide-administrator og personvernombud. Ikke send elevlister eller private Feide-identifikatorer som del av innledende kontakt.

## Hva er dokumentert?

[Samlet pilotstatus15.10](pilotstatus.md) skiller bestått syntetisk staging fra gjenværende beslutninger og driftsporter. Beads er fortsatt kilde for live oppfølging.

Ekstern syntetisk Feide-login, administrator-MFA, skole-/klasseinvitasjoner, ordforråd/grammatikk/verb/lytting, resultatkvittering, elev-/læreroversikt og logout bestod 13. oktober. UI-rettingene ligger i beskyttet staging; ny lokal fullport har 483 beståtte nettleserregresjoner. Dette er teknisk funksjonsbevis for syntetisk staging, ikke garanti for drift eller læringseffekt. Evidens: [UI-retest](../../../output/skole-ui-retting-2026-10-13/README.md) og [fire fagområder](../../../output/feide-ekstern-lekse-2026-10-13/README.md).

Sterk lærerinnlogging, full skoleeksport og journalført skolevis avvikling er i tillegg verifisert14.oktober. Minuttcron, journalfeil med bevart oppgave, gjenoppretting og faktisk mottatt e-post ved feil og manglende kjøring bestod15.oktober. Testjobben er stengt og monitoren pauset. Se [pilotdrift](../../../output/pilot-ops-2026-10-14/README.md) og [cron-/alarmkvitteringen](../../../output/retention-cron-2026-10-15/README.md). Dette beviser ikke permanent opprydding av alle datakategorier eller leverandørbackup-restore.

## Hva må på plass for å ta imot skolen?

Oversikt må bekrefte kontakter/signaturfullmakt, bemannet hendelseshåndtering, leverandør-/overføringsbilag og ferdig driftsaksept: isolert leverandørbackup-restore, databasepatch, konkret retensjonsdekning for globale innloggingstransaksjoner/journal/kopier, bemannet varig overvåking og vanlig produksjonsinnlogging uten cookieinngrep. De beståtte funksjons-/stagingtestene ovenfor gjentas bare ved ny feilevidens eller relevant endring. Planlagt Stockholm-region alene er ikke fullstendig EØS-behandling. [Driftsunderlaget](../drift-og-beredskap.md) og Beads (46kf for sterk lærerinnlogging, twkq for retensjon/skoleavvikling, ya9r for databasepatch og rbec.4 for samlet driftsport) er oppfølgingsgrunnlaget; foreslåtte frister er ikke implementerte garantier.

Skoleeier må identifiseres, beslutte grunnlag/nødvendighet, ha gjennomført DPIA for faktisk behandling med personvernombudets råd, godkjenne leverandører/frister/informasjon og signere avtalene. Produksjonslevering og første reelle skoleaktivering krever deretter en egen uttrykkelig instruks og godkjent protokoll. Dagens app.spansk123.no er fortsatt staging med offentlige testkontoer og skal ikke brukes til reelle skoledata.

## Ferdig utfylling og signeringspakke

Bekreft Oversikts kontaktark først. Fyll skoleopplysningene én gang i DBA D; bruk samme parter, periode, kontaktpunkter, frister og miljø i de øvrige dokumentene. Avklar eventuelle avvik fra pilotpolicyen, med faktisk teknisk dekning. Ingen hakeparenteser eller uavklarte leverandørlister står igjen i den endelige elevinformasjonen eller signerte avtalen.

Frys de godkjente filene/vedleggene med versjon, dato og SHA-256 i signeringsprotokollen. Dokumenter hvem som godkjente, hvor signert avtale og DPIA lagres med begrenset tilgang, og elevinformasjonens offentlige URL/kanal. Eldre versjon fra 8. oktober er historikk; denne pakken og senere konkret skolegodkjent revisjon er kildegrunnlaget. Live oppgaver føres i Beads, ikke en parallell sjekkliste her.
