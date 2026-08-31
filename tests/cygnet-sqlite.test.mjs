import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { buildGlossaryPairId } from '../scripts/lib/curriculum-audit.mjs';
import { extractCygnetCandidates } from '../scripts/audit-sources/cygnet-sqlite.mjs';

test('extracts cross-lingual candidates only when Norwegian and Spanish share synset and POS', () => {
  const dir = mkdtempSync('/tmp/cygnet-audit-');
  const db = join(dir, 'fixture.db');
  execFileSync('sqlite3', [db], { input: `
    CREATE TABLE languages(rowid INTEGER PRIMARY KEY, code TEXT);
    CREATE TABLE entries(rowid INTEGER PRIMARY KEY, language_rowid INTEGER, pos TEXT);
    CREATE TABLE forms(rowid INTEGER PRIMARY KEY, entry_rowid INTEGER, form TEXT, normalized_form TEXT);
    CREATE TABLE synsets(rowid INTEGER PRIMARY KEY, ili TEXT, pos TEXT);
    CREATE TABLE senses(rowid INTEGER PRIMARY KEY, entry_rowid INTEGER, synset_rowid INTEGER);
    INSERT INTO languages VALUES (1,'nob'),(2,'spa');
    INSERT INTO entries VALUES (1,1,'VERB'),(2,2,'VERB'),(3,2,'NOUN'),(4,2,'VERB');
    INSERT INTO forms VALUES (1,1,'handle','handle'),(2,2,'comprar','comprar'),(3,3,'compra','compra'),(4,4,'adquirir','adquirir');
    INSERT INTO synsets VALUES (1,'i-shop','VERB'),(2,'i-shop-noun','NOUN');
    INSERT INTO senses VALUES (1,1,1),(2,2,1),(3,3,2),(4,4,1);
  ` });
  const card = { no: 'handle', es: 'comprar', category: 'hverdag' };
  const result = extractCygnetCandidates(db, [card]);
  assert.equal(result.length, 1);
  assert.equal(result[0].pairId, buildGlossaryPairId(card, 'no-es'));
  assert.equal(result[0].candidate, 'adquirir');
  rmSync(dir, { recursive: true, force: true });
});
