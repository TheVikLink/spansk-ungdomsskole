import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { extractAllItems } from './lib/extract-all-items.mjs';
import { buildGlossaryPairId, classifyCandidate, createDeterministicReport } from './lib/curriculum-audit.mjs';
import { adaptSnapshot, augmentCandidatesWithOrdvev } from './audit-sources/adapters.mjs';

const snapshotDir = resolve(process.argv[2] || 'scripts/audit-sources/snapshots');
const outputPath = resolve(process.argv[3] || 'output/curriculum-audit-report.json');
const ordvevIndexPath = process.argv[4] ? resolve(process.argv[4]) : resolve('scripts/audit-sources/ordvev-index.json');
const html = readFileSync('index.html', 'utf8');
const items = extractAllItems(html);
const glossary = items.glossary.map(card => ({ ...card, pairIds: { 'no-es': buildGlossaryPairId(card, 'no-es'), 'es-no': buildGlossaryPairId(card, 'es-no') } }));
const candidates = [];
const sources = [];

for (const filename of readdirSync(snapshotDir, { withFileTypes: true }).filter(entry => entry.isFile() && entry.name.endsWith('.json')).map(entry => entry.name).sort()) {
  const source = adaptSnapshot(JSON.parse(readFileSync(join(snapshotDir, filename), 'utf8')));
  if (!source.id || !source.license || !source.retrievedAt || !source.sha256) throw new Error(`${filename}: requires id, license, retrievedAt and sha256`);
  sources.push({ id: source.id, license: source.license, retrievedAt: source.retrievedAt, sha256: source.sha256, attribution: source.attribution || null });
  for (const candidate of source.candidates || []) {
    const enriched = { ...candidate, sourceId: source.id, sources: [...new Set([...(candidate.sources || []), source.id])] };
    if (!enriched.status || enriched.status === 'needs_review') enriched.status = classifyCandidate(enriched).status;
    enriched.decisionReason = enriched.status === 'needs_review' ? classifyCandidate(enriched).reason : enriched.decisionReason;
    candidates.push(enriched);
  }
}

const mergedCandidates = new Map();
for (const candidate of candidates) {
  const key = `${candidate.pairId}\u0000${candidate.direction}\u0000${candidate.candidate}`;
  const current = mergedCandidates.get(key);
  if (!current) mergedCandidates.set(key, { ...candidate, sources: [...candidate.sources], evidence: [...candidate.evidence] });
  else {
    current.sources = [...new Set([...current.sources, ...candidate.sources])].sort();
    current.evidence = [...current.evidence, ...candidate.evidence];
  }
}

let auditCandidates = [...mergedCandidates.values()];
if (ordvevIndexPath) {
  const ordvev = JSON.parse(readFileSync(ordvevIndexPath, 'utf8'));
  sources.push({
    id: 'ordvev',
    license: ordvev.license || 'verify-before-snapshot',
    retrievedAt: ordvev.retrievedAt || 'not-recorded',
    sha256: ordvev.sha256,
    attribution: 'Språkbanken, Norsk ordvev'
  });
  auditCandidates = augmentCandidatesWithOrdvev(auditCandidates, glossary, new Map(Object.entries(ordvev.entries || {})));
  auditCandidates = auditCandidates.map(candidate => ({ ...candidate, ...classifyCandidate(candidate) }));
}
const report = createDeterministicReport({ glossary, candidates: auditCandidates, sources });
mkdirSync(resolve(outputPath, '..'), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Curriculum audit report written to ${outputPath}`);
console.log(`  glossary pairs: ${glossary.length}`);
console.log(`  candidates: ${mergedCandidates.size}`);
console.log(`  sources: ${sources.length}`);
