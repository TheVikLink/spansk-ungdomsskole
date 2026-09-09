# Rettelser og verifikasjon etter brukertesten

Utgangspunkt: rapporten `brukertest-2026-09-08.md` og arbeidskopien med SHA-256 `5488be14fd5d2ac4168619a11b867595339e324f1e08efa0d076ccfbb022d104`. Brukeren autoriserte 9. september retting, commits, push og PR. Dette dokumentet samler bevis; Beads styrer oppgavestatus.

## Utgangspunktet er bevart

Den eksisterende appen, grammatikkleksjonene, Lingo Links, relevante tester og rapporten er bevart i commit `49bbbcf`. Rapportens 89 tester ble kjørt på nytt: **89 bestod**. Innholdskontrollen bestod 16 kontroller, og leksjonskontrollen bestod for sju leksjoner. Urelaterte lokale filer ble ikke lagt til.

## F03/F04: svaraksept og nivåtest

Quizbyggeren brukte lagringsretning (`noToEs`/`esToNo`) når svarhjelperen krevde øvingsretning (`no-es`/`es-no`). Den bruker nå riktig grensesnitt. En katalogtest går gjennom begge retninger og alle registrerte varianter; elevtesten svarer «å drikke» gjennom en faktisk bygget quiz ved 1440 og 390 px. Negative kontroller avviser endret betydning og ñ-forveksling.

Nivåtesten viser instruksjon, original spansk oppgave og norsk betydning sammen, også når svaret gjennomgås. «mora» og «Yo me llamo Ana» er eksplisitte svaralternativer; oppgavenes innholdsversjon er økt. Bøyningsoppgavene viser verb og pronomen, slik at det er klart at en verbform etterspørres. Resultatet omtales som et foreløpig øvingsforslag.

Kildesjekk utført av Codex, **ikke spansklærergodkjenning**:

- [Språkrådet om mor/mora og eiendomsuttrykk](https://sprakradet.no/spraksporsmal-og-svar/far-min-mor-mi-fader-var-og-sa-videre/) og [Bokmålsordboka: mor](https://ordbokene.no/nno/bm/mor) støtter bokmålsvarianten.
- [ASELE-artikkel hos Instituto Cervantes, side 891](https://cvc.cervantes.es/ensenanza/biblioteca_ele/asele/pdf/15/15_0887.pdf) beskriver eksplisitt og utelatt subjektpronomen og gir et eksempel med «yo me llamo». Tillegget endrer ikke verbets person eller navnets betydning.

Testene ble observert røde før retting: mistede svarvarianter i quizbyggeren, skjult gustar-instruksjon og begge avviste diagnosevarianter. Etter retting bestod **50 tester** i `report-answer-fairness`, `answer-acceptance-fuzz`, `adaptive-quiz` og `diagnosis-flow`; `check:diagnosis-catalog` bestod også.

Et hull i eldre glosetester ble samtidig rettet: ordlisten må lastes før katalogløkkene kjøres, og hovedtesten krever over 500 faktiske kort. En tom liste kan ikke lenger gi falskt grønt resultat i denne kontrollen.

## Menneskelig sluttkontroll

Beads `spansk-ungdomsskole-ee0` samler lærerens faglige kontroll, moderert elevpilot, fysisk mobil/lyd og bruk over flere uker. Dette er ikke gjennomført av automatiske tester. Ingen publisering eller faktisk elevstudie inngår i rettingsmandatet.
