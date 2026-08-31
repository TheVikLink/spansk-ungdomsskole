import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { adaptWiktionaryEntry } from './adapters.mjs';

const inputPath = process.argv[2];
const outputPath = process.argv[3] || 'scripts/audit-sources/snapshots/wiktionary.json';
if (!inputPath) throw new Error('Usage: node scripts/audit-sources/build-wiktionary-snapshot.mjs <saved-api-response.json> [output.json]');
const input = JSON.parse(readFileSync(inputPath, 'utf8'));
const pages = Array.isArray(input) ? input : Object.values(input.pages || input.query?.pages || {});
const candidates = pages.flatMap(page => (page.auditContexts || []).flatMap(context => adaptWiktionaryEntry(page, context)));
const payload = JSON.stringify(candidates);
writeFileSync(outputPath, `${JSON.stringify({ schemaVersion: 1, id: 'wiktionary', license: 'CC-BY-SA-4.0', attribution: 'Wiktionary contributors', retrievedAt: input.retrievedAt || 'recorded-input', sha256: createHash('sha256').update(payload).digest('hex'), candidates }, null, 2)}\n`);
console.log(`Wiktionary snapshot written to ${outputPath} (${candidates.length} candidates)`);
