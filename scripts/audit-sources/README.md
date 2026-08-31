# Offline curriculum-audit sources

Legg kun inn kildeuttrekk som kan lagres og distribueres under kildens lisens. Hvert snapshot er JSON med:

Kilderegisteret i `source-registry.json` er kun en utviklerreferanse. `verify-before-snapshot` betyr at lisensvilkårene må kontrolleres for den konkrete eksporten før data lagres. Cygnet samler flere underliggende wordnets, så lisens må kontrolleres per datasett.

```json
{
  "id": "source-id",
  "license": "license identifier and terms",
  "attribution": "required attribution",
  "retrievedAt": "2026-08-28T00:00:00.000Z",
  "sha256": "hash of the source payload",
  "candidates": []
}
```

`candidates` er forslag, aldri fasit. De må inneholde `pairId`, `direction`, `candidate` og `status`. Status må være `needs_review`, `approved`, `rejected` eller `false_positive`. Vanlige audit-kjøringer bruker kun lokale snapshots; nettverksbasert oppdatering er en separat utviklerprosess.

Når Ordvev-indeksen finnes, kan den brukes som uavhengig norsk støtte i audit-kjøringen:

```bash
npm run audit:curriculum -- scripts/audit-sources/snapshots output/curriculum-audit-report.json /path/to/ordvev-index.json
```

For en lokal Cygnet SQLite-database kan snapshot bygges med:

```bash
npm run audit:cygnet-snapshot -- /path/to/cygnet.db
```

Parseren matcher `nob` og `spa` via samme ILI/synset og ordklasse. Cygnet-databasen har egne provenance-tabeller; lisens må derfor fortsatt verifiseres for hvert underliggende wordnet før snapshotet committes.

Ordvev-indeksen bygges fra de to tab-separerte filene slik:

```bash
npm run audit:ordvev-index -- /path/to/words.tab /path/to/wordsenses.tab

Legg til hentet-dato som siste argument, for eksempel `2026-08-28`, slik at indeksen får stabil provenance.
```

Wiktionary bygges fra et lagret API-svar (ikke fra elevappen):

```bash
npm run audit:wiktionary-snapshot -- /path/to/wiktionary-response.json
```

API-svaret må inneholde `auditContexts` per side med `pairId` og `direction`. Wiktionary-kandidater får aldri automatisk godkjenning alene.
