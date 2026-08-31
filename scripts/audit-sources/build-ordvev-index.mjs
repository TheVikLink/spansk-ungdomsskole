import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parseOrdvevTabs, indexOrdvevEntries } from './adapters.mjs';

const wordsPath = process.argv[2];
const sensesPath = process.argv[3];
const outputPath = process.argv[4] || 'output/ordvev-index.json';
const retrievedAt = process.argv[5];
if (!wordsPath || !sensesPath) throw new Error('Usage: node scripts/audit-sources/build-ordvev-index.mjs <words.tab> <wordsenses.tab> [output.json]');
if (!retrievedAt) throw new Error('A stable retrievedAt date is required, e.g. 2026-08-28');
const entries = parseOrdvevTabs(readFileSync(wordsPath, 'utf8'), readFileSync(sensesPath, 'utf8'));
const index = Object.fromEntries([...indexOrdvevEntries(entries)].map(([word, values]) => [word, values.sort((a, b) => a.synsetId.localeCompare(b.synsetId))]));
const payload = JSON.stringify(index);
writeFileSync(outputPath, `${JSON.stringify({ schemaVersion: 1, source: 'ordvev', license: 'CC-BY-4.0', retrievedAt, attribution: 'Språkbanken, Norsk ordvev', sha256: createHash('sha256').update(payload).digest('hex'), entries: index }, null, 2)}\n`);
console.log(`Ordvev index written to ${outputPath} (${Object.keys(index).length} lemmas)`);
