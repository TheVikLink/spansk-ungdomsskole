# Uavhengig kontroll av de sju læringsforbedringene

6. oktober 2026. Kontrollsak: `spansk-ungdomsskole-ny1l`.

**Status etter retting og levering:** Begge funnene nedenfor er rettet og publisert via [PR #11](https://github.com/TheVikLink/spansk-ungdomsskole/pull/11). Arbeidscommit `200672f` er squash-flettet til `main` som `ceb2b41`. Nytt bygg: `fc18a0795a6faaa3`. Fersk full verifikasjon: 47 Node- og 482 Chromium-tester, i tillegg 26 WebKit-tester. En ren nettleser ved mobilbredde bekreftet publisert bygg, korrekt Bindeord-import uten ekstra kort, lokal backupgjenoppretting og øvingsstart. HTML og service worker på spansk123.no har samme nye bygg-ID. Denne rapportens øvrige tekst beskriver den opprinnelige gjennomgangen før retting.

**Konklusjon:** Endringene er avgrensede og godt testet, men to konkrete feil bør rettes før publisering. Den eksisterende suiten er grønn; den dekker ikke disse tilfellene. Dette er en gjennomgang, ikke en retting eller publiseringsgodkjenning.

Gjennomgått arbeidsmappe: `/Users/olehenrikvik/.codex/worktrees/small-learning-improvements/spansk-ungdomsskole`, gren `codex/small-learning-improvements`, HEAD `f57ca19d`. Implementasjonen er ukommittert. App, CSS og service worker har samme SHA-256 i arbeidsmappen og den bygde testkopien. Bygg-ID: `f90265858275c468`. Appkoden og den opprinnelige leveranserapporten er ikke endret under gjennomgangen.

## Funn

### P2: Importmeldingen teller feil når ord har alternative oversettelser

Ny kode: `index.html:16242–16249`, særlig `count - result.importedWords` og retur ved null tilgjengelige kort. Oppfølging: `spansk-ungdomsskole-ojzi`.

En faktisk leksefil ble lastet ned fra lærerens «Bindeord» og importert i en separat, ren elevprofil på 390 px. Eleven hadde alle 22 pakkekort fra før. Importen opprettet fem ekstra kort; alle 22 opprinnelige kort var fortsatt tilgjengelige i pakken. Den nye meldingen viste likevel **17 eksisterende gloser**, fordi fem ble trukket fra de 22 tilgjengelige. Kortantallet økte fra 522 til 527.

Årsaken er at eksisterende `analyzeTeacherWordImport` splitter oversettelser med ` / `, mens `resolveAssignmentVocabularyCards` finner usplittede par. Ekstra kort er dermed ikke nødvendigvis del av utvalget som meldingen teller. Dette importproblemet fantes før endringen; den nye meldingsberegningen bygger på en antakelse som ikke gjelder for det eksisterende importformatet.

Alle standardkategorier ble kontrollert fra samme rene kortgrunnlag:

| Kategori | Kort i pakken, alle eksisterte | Ekstra kort ved import | Meldingen sier eksisterende |
| --- | ---: | ---: | ---: |
| Vær | 17 | 2 | 15 |
| Personlighet | 14 | 2 | 12 |
| Tidsuttrykk | 16 | 2 | 14 |
| Fag | 8 | 2 | 6 |
| Møbler | 18 | 2 | 16 |
| Gustar | 9 | 2 | 7 |
| Bindeord | 22 | 5 | 17 |
| Mat og drikke | 58 | 2 | 56 |

En ny ekstern pakkerad med `norsk: "å gå / å dra"`, `spansk: "ir"` og egen kategori opprettet to kort, men ga **null tilgjengelige gloser i pakken**. Den nye importmeldingen sa bare at pakken var importert. Den skjuler dermed en viktig feiltilstand. Pakker helt uten gloser, for eksempel bare verb, skal fortsatt behandles som gyldige.

Anbefalt retting: samordne håndteringen av alternativer i import og oppslag, beregn nye/eksisterende ut fra de faktisk tilgjengelige pakkekortene, og varsle når en pakke forventer gloser som ikke kan startes. Legg til regresjoner med faktisk filoverlevering, alle standardkategorier og nye alternativer. Ikke endre eksisterende fremgang eller kanoniske svar som en snarvei.

### P2: Nye feilmeldinger har for svak kontrast

Ny kode: `index.html:506`, `:515` og `:524`. Oppfølging: `spansk-ungdomsskole-bd4o`.

`builderVocabError`, `builderVerbError` og `builderGrammarError` bruker `text-amber-500` på leksebyggerens lyse bakgrunn. Chromium ga tekst RGB **254, 154, 0**, bakgrunn RGB **249, 250, 251** og skriftstørrelse **14 px**. Beregnet kontrast er **2,043:1**. Dette er under minimum **4,5:1** for vanlig tekst i [WCAG 2.2, kontrastkravet](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

Dette rammer meldinger som læreren trenger for å forstå hvorfor pakken ikke kan eksporteres. De nye ARIA-koblingene og fokushåndteringen er nyttige, men løser ikke lesbarheten. Bruk en mørkere eksisterende feilmeldingsfarge og kontroller alle tre seksjoner og den samlede statusmeldingen.

## Fersk verifikasjon

En midlertidig kopi ble laget av de aktuelle sporede og nye filene, med arbeidsmappens eksisterende avhengigheter. Ingen nye avhengigheter ble installert. Originalarbeidsmappen ble ikke bygget eller skrevet til.

- `npm run build:app`: kode 0, samme bygg-ID som leveranserapporten.
- Alle katalog-, innholds-, ordforråds-, grammatikk-, Tailwind- og offline-kontroller i `test:all`: bestått.
- Node-testene i `test:all`: **47/47 bestått**.
- `npm run test:browser`: kode 0, **476/476 Chromium-tester bestått**.
- De relevante forbedringstestene i WebKit: kode 0, **20/20 bestått**. Utklippstavletesten som krever Chromium-tillatelser ble utelatt i denne kjøringen; den bestod i Chromium.
- Fem ekstra diagnostiske kontroller: full katalogoverlevering, egendefinerte importrader, avbryt/bekreft fanebytte under avspilling, flere grammatikktemaer i instruksen og manglende utklippstavle-API. Målingene og observasjonene ble samlet uten feil i kontrollskriptene.
- To nye forventningsbaserte regresjoner feilet på nøyaktig de to funnene: 22 eksisterende Bindeord-kort i importmeldingen og kontrast minst 4,5:1.
- `git diff --check` i den gjennomgåtte arbeidsmappen: kode 0.
- Skjermbilder av mobil lyttespiller, elevinstruks og valideringsfeil ble undersøkt visuelt.

Den første testkopien manglet Git-indeksen som lydfiltesten bruker til kontroll av nøyaktige filnavn. Etter at originalens lydstiindeks ble lagt til lokalt, bestod Node-testene. Chromium var først blokkert av macOS-sandboxen; nettlesersuiten ble deretter kjørt med nødvendig lokal prosesstilgang. Dette var problemer i kontrolloppsettet. `test:all` ble derfor verifisert som kontroller/Node og nettlesersuite i separate vellykkede deler, ikke som én avsluttet kode-0-kjøring.

Varige kontrollogger og de to reproduksjonsprøvene finnes i `docs/reviews/small-learning-improvements-2026-10-06/`. Prøvene er arkiverte kontrollfiler og inngår ikke i prosjektets standard testkjøring. For ny kjøring kopieres `.spec.js.txt`-filene til `tests/` i en testkopi av den gjennomgåtte arbeidsmappen, og `.txt` fjernes fra filnavnene.

## Vurdering av resten

Lydavspilling bevarer valgt og innsendt svar, stopper ved neste spørsmål, avslutning og bekreftet fanebytte, og bevarer økten når fanebyttet avbrytes. Den nye spilleren har egen feil-/prøv-igjen-håndtering og bruker eksisterende opptak. Offline-avspilling av fem historier er dekket av den grønne suiten.

Begge grammatikkknappene starter samme filtrerte øving. Pronomenstøtten bruker eksisterende norsk betydning uten endret bøying eller vurdering. Repetisjonsdatoen følger dagens faktiske køgrense ved lokal midnatt, også ved sommertid, uten endret planlegging eller eksportformat. Elevinstruksen samsvarer med startknappene, også med flere grammatikktemaer, og har manuell kopieringsvei når utklippstavle-API mangler.

Ingen nye avhengigheter, backend, analytics, lydgenerering eller endring i backup-/assignment-v1-formatet inngår i diffen. Den kanoniske ordkilden er uendret.

Fysiske iOS-/Android-enheter, skjermleserens tale og læringseffekt er fortsatt uverifisert. Lokal WebKit ved mobilbredde er ekstra nettleserevidens, ikke en fysisk iPhone-test. Ingenting er flettet, pushet eller publisert.
