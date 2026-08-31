import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { normalizeAuditText, buildGlossaryPairId } from '../lib/curriculum-audit.mjs';

function sqliteJson(dbPath, sql) {
  const output = execFileSync('sqlite3', ['-json', dbPath, sql], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return output.trim() ? JSON.parse(output) : [];
}

function sqlQuote(value) { return `'${String(value).replaceAll("'", "''")}'`; }

export function extractCygnetCandidates(dbPath, glossary) {
  const terms = [...new Set((glossary || []).flatMap(card => [card.no, card.es.replace(/^(el|la)\s+/i, '')].map(normalizeAuditText)))];
  if (terms.length === 0) return [];
  const termSql = terms.map(sqlQuote).join(',');
  const sourceRows = sqliteJson(dbPath, `SELECT f.form, f.normalized_form, e.pos, sy.ili, l.code AS language FROM forms f JOIN entries e ON f.entry_rowid=e.rowid JOIN languages l ON e.language_rowid=l.rowid JOIN senses s ON s.entry_rowid=e.rowid JOIN synsets sy ON s.synset_rowid=sy.rowid WHERE l.code IN ('nb','nob','es','spa') AND (f.normalized_form IN (${termSql}) OR lower(f.form) IN (${termSql}))`);
  const ilis = [...new Set(sourceRows.map(row => row.ili).filter(Boolean))];
  if (ilis.length === 0) return [];
  const iliSql = ilis.map(sqlQuote).join(',');
  const targetRows = sqliteJson(dbPath, `SELECT f.form, e.pos, sy.ili, l.code AS language FROM forms f JOIN entries e ON f.entry_rowid=e.rowid JOIN languages l ON e.language_rowid=l.rowid JOIN senses s ON s.entry_rowid=e.rowid JOIN synsets sy ON s.synset_rowid=sy.rowid WHERE l.code IN ('nob','spa') AND sy.ili IN (${iliSql})`);
  const rows = [...sourceRows, ...targetRows];
  const byLanguageForm = new Map();
  for (const row of rows) {
    const key = `${row.language}\u0000${normalizeAuditText(row.normalized_form || row.form)}`;
    if (!byLanguageForm.has(key)) byLanguageForm.set(key, []);
    byLanguageForm.get(key).push(row);
  }
  const byIliPos = new Map();
  for (const row of rows) {
    const key = `${row.ili}\u0000${row.pos}`;
    if (!byIliPos.has(key)) byIliPos.set(key, {});
    if (!byIliPos.get(key)[row.language]) byIliPos.get(key)[row.language] = new Set();
    byIliPos.get(key)[row.language].add(row.form);
  }
  const candidates = [];
  const canonicalByDirection = {
    'no-es': new Map(glossary.map(card => [normalizeAuditText(card.es.replace(/^(el|la)\s+/i, '')), card])),
    'es-no': new Map(glossary.map(card => [normalizeAuditText(card.no), card]))
  };
  for (const card of glossary) {
    const directions = [
      { direction: 'no-es', sourceLanguages: ['nb', 'nob'], targetLanguages: ['es', 'spa'], value: card.no },
      { direction: 'es-no', sourceLanguages: ['es', 'spa'], targetLanguages: ['nb', 'nob'], value: card.es.replace(/^(el|la)\s+/i, '') }
    ];
    for (const { direction, sourceLanguages, targetLanguages, value } of directions) {
      const senses = sourceLanguages.flatMap(sourceLanguage => byLanguageForm.get(`${sourceLanguage}\u0000${normalizeAuditText(value)}`) || []);
      const seen = new Set();
      for (const sense of senses) {
        const group = byIliPos.get(`${sense.ili}\u0000${sense.pos}`);
        for (const targetLanguage of targetLanguages) for (const candidate of group?.[targetLanguage] || []) {
          const normalized = normalizeAuditText(candidate);
          if (!normalized || normalized === normalizeAuditText(direction === 'no-es' ? card.es : card.no) || seen.has(normalized)) continue;
          seen.add(normalized);
          const collision = canonicalByDirection[direction].get(normalized);
          candidates.push({
            pairId: buildGlossaryPairId(card, direction),
            direction,
            candidate,
            canonicalMeaningId: `cygnet:${sense.ili}`,
            sources: ['cygnet'],
            falsePositive: Boolean(collision && collision !== card),
            evidence: [{ source: 'cygnet', entryId: `${sense.ili}:${sense.pos}`, relation: collision && collision !== card ? 'contradiction' : 'same_synset', synsetId: sense.ili, partOfSpeechMatch: true, unambiguous: !collision || collision === card }]
          });
        }
      }
    }
  }
  return candidates;
}

export function buildCygnetSnapshot(dbPath, glossary, metadata = {}) {
  const candidates = extractCygnetCandidates(dbPath, glossary);
  const payload = JSON.stringify(candidates);
  return {
    id: 'cygnet',
    license: metadata.license || 'verify-per-source-dataset',
    attribution: metadata.attribution || 'Cygnet and contributing wordnets; see provenance database',
    retrievedAt: metadata.retrievedAt || new Date().toISOString(),
    sha256: createHash('sha256').update(payload).digest('hex'),
    candidates
  };
}
