import { readFileSync, writeFileSync } from 'node:fs';
import { extractAllItems } from '../lib/extract-all-items.mjs';
import { buildGlossaryPairId } from '../lib/curriculum-audit.mjs';
import { buildCygnetSnapshot } from './cygnet-sqlite.mjs';

const dbPath = process.argv[2];
const outputPath = process.argv[3] || 'scripts/audit-sources/snapshots/cygnet.json';
if (!dbPath) throw new Error('Usage: node scripts/audit-sources/build-cygnet-snapshot.mjs <cygnet.db> [output.json]');
const items = extractAllItems(readFileSync('index.html', 'utf8'));
const glossary = items.glossary.map(card => ({ ...card, pairIds: { 'no-es': buildGlossaryPairId(card, 'no-es'), 'es-no': buildGlossaryPairId(card, 'es-no') } }));
const snapshot = buildCygnetSnapshot(dbPath, glossary, { retrievedAt: new Date().toISOString() });
writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Cygnet snapshot written to ${outputPath} (${snapshot.candidates.length} candidates)`);
