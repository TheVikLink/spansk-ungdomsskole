# Oppfølging av aktive skolelekser

Oppdraget følger spansk-ungdomsskole-rbec.4.16. Læreren velger klasse og ser siste 7 eller 30 døgn, med siste 7 som startvalg. Tell én besvarelse per elev, lekse og oppgave i perioden. Vis siste resultat og oppgavetekst fra den publiserte versjonen. Vis manglende svar som manglende grunnlag. Vis klassens oppfølgingsbehov og gi innsyn i den enkelte elevens svarutfall. Lekser som avsluttes, forsvinner fra denne oversikten.

## Data og tilgang

Formålet er lærerens formative oppfølging av tildelte lekser. Gjenbruk elevens visningsnavn, klassemedlemskap, mottakertilgang, oppgave-ID, utfall og eksisterende servertidspunkt. Beregn perioden på serveren. Klienten trenger oppgavetekst, utfall og avledede antall. Klientens svartekst, eksakte tidspunkter, lokal egenøving og tidsbruk inngår ikke. Dagens journal- og klassekontroll gjelder før opplysninger eller avledede klasseverdier vises. En eldre lekse med manglende eller ugyldig oppgaveversjon kan bidra med observerte antall uten tilknyttet tekst.

Oversikten vises i lærerens innloggede økt. Ingen nye lagrede opplysninger, informasjonskapsler, logger eller datamottakere. Eksisterende elev- og skoleeksport dekker grunnlagsdata. Sletting, tilbakekalling og oppbevaring følger grunnlaget, uten en separat statistikkopi. Klassens summer omfatter elever med aktiv tilgang og tildelte aktive lekser. Resultater per oppgave gir grunnlag for samtale og ny øving, ikke en vurdering av elevens samlede ferdigheter.

## Verifikasjon

Prøv rullerende perioder, gjentatte forsøk, riktig, feil, manglende svar, eldre innhold og tilgangsavgrensning i eksisterende skoleregresjon. Kontroller periodebytte, elevdetaljer og mobilbredde med syntetiske elever. Kjør skoleprøvene med isolert PostgreSQL og eksisterende leveransetester.
