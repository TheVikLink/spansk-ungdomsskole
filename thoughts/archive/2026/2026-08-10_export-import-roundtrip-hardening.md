# Export/import round-trip og spansk_v1-migrering: hardening

## Mål

Bevare den tapsfrie round-trip- og migreringsflyten, samtidig som ugyldige JSON-toppnivåer og ugyldig vocabData avvises uten krasj eller korrupsjon av lokal lagring.

## Kontrakt

- Gyldig spansk123_export_v1, spansk123_v4, spansk_v1, spanskSRData-dump og raw array beholder eksisterende resultat og lagringsformat.
- importProgressData(null), undefined og primitive JSON-verdier returnerer:
  - imported: false
  - format: unknown
  - message: Ukjent filformat
- En current-export payload skriver bare vocabData når vocabData er en array.
- Ugyldig vocabData skal ikke overskrive eksisterende spansk123Data_v4.
- Andre gyldige felt i samme current-export payload kan fortsatt importeres.

## Implementasjon

1. Legg guard først i importProgressData.
2. Endre current-export-grenen fra truthiness-sjekk til Array.isArray-sjekk.
3. Utvid import/export-testene med null-payload og malformed non-array vocabData.
4. Kjør fokustest og full regresjon.
5. Lukk og sync Beads-oppgaven etter verifikasjon.

## Berørte filer

- index.html
- tests/import-export-compat.spec.js
- thoughts/shared/plans/2026-08-10_export-import-roundtrip-hardening.md

## Verifikasjon

- npm run test:import-export
- npm run check:content
- npm run check:learning-catalog
- npm run check:tailwind
- npm run test:all
- git diff --check

