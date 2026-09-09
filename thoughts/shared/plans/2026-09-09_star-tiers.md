# Fire stjernenivåer per tema

Brukeren ønsker bronse, sølv, gull og diamant med prosentgrenser inspirert av den oppgitte KwizIQ-teksten. Status føres i Beads `spansk-ungdomsskole-d66`.

Stjernescore beregnes fra de siste 20 vurderte svarene for hver ferdighet: bronse fra 50 %, sølv fra 75 %, gull fra 90 %, diamant bare når alle svar er riktige. Minst ti svar kreves før første stjerne. Et livslangt gjennomsnitt ville gjort diamant umulig etter én feil; et avgrenset vindu lar nyere øving forbedre resultatet. Gjeldende krav til varierte verbformer beholdes. Dette er andel riktige i registrerte øvingsoppgaver, ikke KwizIQs confidence-modell. Øvingsstyrke 0–5 og adaptiv oppgaveutvelgelse endres ikke.

Nye nivåer vises i quiz-, grammatikk- og verbresultater, med korte temanavn, tydelig forskjellig farge/fasett og tilgjengelig nivånavn. Forklaringen viser antall riktige og antall forsøk. En lukket oversikt forklarer tersklene. Under 50 % eller med for få svar deles ingen ny stjerne ut.

## Lokal datamodell og kompatibilitet

Det eksisterende svarutfallet beholdes som høyst 20 boolske verdier i det valgfrie feltet `learningProgress.skillProgress[id].starResults`. Kun `correct` teller riktig; aksentfeil, nesten, feil og hopp over teller ikke riktig. Ingen rå svartekst, navn, ekstra tidsstempler eller nye identifikatorer lagres. Gamle summer kan ikke rekonstruere denne rekkefølgen: eldre filer uten feltet får tomt grunnlag, som bygges ved nye svar. Normalisering, eksport, import, angre og nullstilling skal bevare eller fjerne feltet sammen med resten av lokal fremgang. Ugyldige felt skal ikke produsere stjerner.

Nivå-ID-er som `star:silver:a0.articles.definite_singular` lagres i den eksisterende listen `spansk123_masteryBadges_v1.badges`. Begge formater er fortsatt schemaVersion 1 med valgfrie utvidelser; gamle filer kan importeres uten tap av tidligere summer og merker. Eldre `mastery:<skill>`-ID-er beholdes uten å gjette et nytt nivå. Gamle merker får ikke en oppdiktet prosent.

Hver ferdighet varsles bare når et høyere nivå enn tidligere er opptjent. Tidligere belønninger beholdes ved senere feil. Ved hopp til diamant vises bare diamant; tidligere høyeste nivå hindrer at lavere nivåer deles ut etterpå. Import forener ID-er og må ikke utløse dobbeltbelønning. Sletting bruker eksisterende nullstilling. Ingen backend, råsvar, navn eller ekstra hendelseslogg innføres.

## Kontroll

Prøv grensene 0/49/50/74/75/89/90/99/100 %, under ti svar, ufullstendig verbgrunnlag, avrunding nær 100, ugyldige tall, oppgradering og tilbakefall. Test eldre og ny sikkerhetskopi i ren nettleser, samt at resultat–teori–tilbake og gjentatt avslutning ikke deler ut på nytt. Kontroller nivånavn, farger, fasetter og forklaring med tastatur på desktop og mobil, bygg appen og kjør samlet testpakke før push til PR 6.
