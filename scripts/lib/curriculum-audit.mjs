import { createHash } from 'node:crypto';

const REVIEW_STATUSES = new Set(['needs_review', 'approved', 'auto_approved', 'rejected', 'auto_rejected', 'false_positive']);
const DIRECTIONS = new Set(['no-es', 'es-no']);

export function normalizeAuditText(value) {
  return String(value ?? '').normalize('NFC').trim().toLocaleLowerCase('nb-NO').replace(/\s+/gu, ' ');
}

export function buildGlossaryPairId(card, direction) {
  if (!card || !DIRECTIONS.has(direction)) throw new Error('Glossary pair and direction are required');
  const slug = value => normalizeAuditText(value).replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/gu, '');
  return `${slug(card.no)}--${slug(card.es)}--${slug(card.category || 'uncategorized')}--${direction}`;
}

export function validateApprovedCandidates(glossary, candidates) {
  const errors = [];
  const cardsById = new Map();
  for (const card of glossary || []) {
    for (const direction of DIRECTIONS) cardsById.set(buildGlossaryPairId(card, direction), { card, direction });
  }
  for (const candidate of candidates || []) {
    if (!REVIEW_STATUSES.has(candidate.status)) errors.push(`invalid review status: ${candidate.status}`);
    const pair = cardsById.get(candidate.pairId);
    if (!pair) { errors.push(`unknown glossary pair: ${candidate.pairId}`); continue; }
    if (candidate.direction !== pair.direction) errors.push(`direction mismatch: ${candidate.pairId}`);
    if (!String(candidate.candidate || '').trim()) errors.push(`empty candidate: ${candidate.pairId}`);
    if (['approved', 'auto_approved'].includes(candidate.status) && !String(candidate.canonicalMeaningId || '').trim()) errors.push(`approved candidate missing canonicalMeaningId: ${candidate.pairId}`);
    if (['approved', 'auto_approved'].includes(candidate.status) && (!Array.isArray(candidate.sources) || candidate.sources.length === 0)) errors.push(`approved candidate missing source evidence: ${candidate.pairId}`);
  }
  return { valid: errors.length === 0, errors };
}

export function classifyCandidate(candidate) {
  const evidence = Array.isArray(candidate?.evidence) ? candidate.evidence : [];
  const sources = new Set(candidate?.sources || evidence.map(item => item.source));
  const semanticMatches = evidence.filter(item => item.relation === 'same_synset' || item.relation === 'explicit_translation');
  const hasStrongSemanticMatch = semanticMatches.some(item => item.source === 'omwn' || item.source === 'cygnet');
  const hasIndependentNorwegianSupport = sources.has('ordvev') || sources.has('norsk-ordbank');
  const hasPosMatch = evidence.every(item => item.partOfSpeechMatch !== false);
  const isUnambiguous = evidence.length > 0 && evidence.every(item => item.unambiguous !== false) && candidate.conflicts !== true;
  if (candidate.falsePositive === true || evidence.some(item => item.relation === 'contradiction')) return { status: 'false_positive', reason: 'source evidence contradicts the proposed meaning' };
  if (hasStrongSemanticMatch && hasIndependentNorwegianSupport && hasPosMatch && isUnambiguous) return { status: 'auto_approved', reason: 'independent semantic, Norwegian and word-class evidence agree' };
  if (semanticMatches.length === 0) return { status: 'auto_rejected', reason: 'no semantic translation evidence' };
  return { status: 'needs_review', reason: 'evidence is incomplete, ambiguous or not independently corroborated' };
}

export function createDeterministicReport({ glossary = [], candidates = [], sources = [] }) {
  const sorted = [...candidates].map(candidate => ({
    ...candidate,
    candidate: String(candidate.candidate || '').trim(),
    normalizedCandidate: normalizeAuditText(candidate.candidate),
    sources: [...new Set(candidate.sources || [])].sort()
  })).sort((a, b) => `${a.pairId}\u0000${a.direction}\u0000${a.normalizedCandidate}`.localeCompare(`${b.pairId}\u0000${b.direction}\u0000${b.normalizedCandidate}`, 'nb'));
  const manifest = [...sources].map(source => ({ ...source })).sort((a, b) => String(a.id).localeCompare(String(b.id), 'en'));
  const payload = { schemaVersion: 1, glossaryCount: glossary.length, sources: manifest, candidates: sorted };
  payload.inputHash = createHash('sha256').update(JSON.stringify({ glossary, sources: manifest })).digest('hex');
  return payload;
}

export function buildApprovedAlternatives(glossary, candidates) {
  const validation = validateApprovedCandidates(glossary, candidates);
  if (!validation.valid) throw new Error(validation.errors.join('; '));
  const result = {};
  const cardsByKey = new Map();
  for (const candidate of candidates.filter(item => ['approved', 'auto_approved'].includes(item.status))) {
    const card = glossary.find(item => buildGlossaryPairId(item, candidate.direction) === candidate.pairId);
    const key = `${candidate.direction === 'no-es' ? card.no : card.no}|${candidate.direction}`;
    const priorCard = cardsByKey.get(key);
    if (priorCard && normalizeAuditText(priorCard.es) !== normalizeAuditText(card.es)) throw new Error(`ambiguous glossary key cannot receive generated alternatives: ${key}`);
    cardsByKey.set(key, card);
    if (!result[key]) {
      const canonical = candidate.direction === 'no-es' ? card.es : card.no;
      result[key] = [{ answerId: 'primary', value: canonical, canonicalMeaningId: candidate.canonicalMeaningId }];
    }
    result[key].push({ answerId: candidate.answerId || normalizeAuditText(candidate.candidate).replace(/[^\p{L}\p{N}]+/gu, '_'), value: candidate.candidate, canonicalMeaningId: candidate.canonicalMeaningId });
  }
  for (const values of Object.values(result)) values.sort((a, b) => a.value.localeCompare(b.value, 'nb'));
  return result;
}

export function mergeApprovedAlternatives(existing, generated) {
  const merged = structuredClone(existing || {});
  for (const [key, values] of Object.entries(generated || {})) {
    const byValue = new Map((merged[key] || []).map(value => [normalizeAuditText(value.value), value]));
    for (const value of values) {
      const normalized = normalizeAuditText(value.value);
      if (!byValue.has(normalized)) byValue.set(normalized, value);
    }
    merged[key] = [...byValue.values()].sort((a, b) => a.value.localeCompare(b.value, 'nb'));
  }
  return Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b, 'nb')));
}
