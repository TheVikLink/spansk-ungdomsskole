# Lytteforståelse og diktat – avgrenset release-audit

Beads: `spansk-ungdomsskole-paas`. Arbeidsmappen har omfattende eksisterende endringer; auditten bevarer disse. Ingen commit, publisering, lydgenerering eller endring av eksisterende lydfiler.

## Grunnlag og avgrensning

Les AGENTS.md, README, de to lydkatalogene og avspillingsflytene, dictation.spec.js, report-dictation.spec.js og offline-hjelperne. Kontroller alle fem lyttehistorier mot manus, svaralternativer og norske forklaringer; sammenlign de fire nye manusene med Google-dokumentet. Verifiser filkoblinger og varighet teknisk. Skill denne evidensen fra menneskelig godkjenning av opptak, uttale og nivå.

## Fremgangsmåte

Dokumenter feil med fokuserte Playwright-regresjoner før retting. Undersøk særlig nedlasting uten nett, lydfeil/gjenoppretting, overlappende aktiviteter og den gamle lyttefunksjonen som gjenbruker diktatinnhold. Rett bare disse avgrensede problemene og dokumenterte tekst-/metadataproblemer. Bevar lagringsformatene.

Kjør bygg, dictation.spec.js med Chromium/én worker, nye regresjoner og test:all. Kontroller desktop og mobil visuelt, at ingen elevdata sendes, og import/eksport med eksisterende tester. Før sluttresultater og eventuell lyd-/nivågodkjenning i Beads og en statisk auditrapport; denne planen er ikke en parallell oppgaveliste.
