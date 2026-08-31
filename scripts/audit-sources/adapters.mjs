import { createHash } from 'node:crypto';
import { normalizeAuditText, buildGlossaryPairId } from '../lib/curriculum-audit.mjs';

export const SOURCE_PROFILES = {
  'norsk-ordbank': { languages: ['nob'], role: 'morphology' },
  ordvev: { languages: ['nob'], role: 'semantic' },
  omwn: { languages: ['nob', 'spa'], role: 'cross-lingual-semantic' },
  cygnet: { languages: ['nob', 'spa'], role: 'cross-lingual-semantic' },
  wiktionary: { languages: ['nob', 'spa'], role: 'candidate-only' }
};

export function adaptSnapshot(source) {
  if (!source?.id || !SOURCE_PROFILES[source.id]) throw new Error(`Unsupported audit source: ${source?.id || '(missing id)'}`);
  if (!source.license || !source.retrievedAt) throw new Error(`${source.id}: license and retrievedAt are required`);
  const candidates = (source.entries || source.candidates || []).map((entry, index) => {
    const candidate = {
      pairId: entry.pairId,
      direction: entry.direction,
      candidate: entry.candidate || entry.translation || entry.lemma,
      canonicalMeaningId: entry.canonicalMeaningId || entry.synsetId || entry.conceptId,
      sources: [source.id],
      evidence: entry.evidence || [{
        source: source.id,
        entryId: entry.entryId || entry.id || `${source.id}:${index + 1}`,
        relation: entry.relation || (entry.synsetId || entry.conceptId ? 'same_synset' : 'explicit_translation'),
        partOfSpeechMatch: entry.partOfSpeechMatch,
        unambiguous: entry.unambiguous
      }],
      falsePositive: entry.falsePositive === true,
      status: entry.status
    };
    if (!candidate.pairId || !candidate.direction || !candidate.candidate) throw new Error(`${source.id}: entry ${index + 1} lacks pairId, direction or candidate`);
    return candidate;
  });
  return { ...source, sha256: source.sha256 || createHash('sha256').update(JSON.stringify(source.entries || source.candidates || [])).digest('hex'), candidates: candidates.map(candidate => ({ ...candidate, candidate: normalizeAuditText(candidate.candidate) })) };
}

export function adaptOrdbankLemma(lemma, { pairId, direction = 'es-no', candidate } = {}) {
  if (!lemma || lemma.language !== 'nob' || !lemma.lemma) throw new Error('Ordbank lemma must contain a Bokmål lemma');
  const pos = String(lemma.initial_lexeme_class || '').toLowerCase();
  return {
    pairId,
    direction,
    candidate: candidate || lemma.lemma,
    canonicalMeaningId: lemma.id ? `ordbank:${lemma.id}` : undefined,
    sources: ['norsk-ordbank'],
    evidence: [{
      source: 'norsk-ordbank',
      entryId: String(lemma.id || lemma.lemma),
      relation: 'lexical_attestation',
      partOfSpeech: pos,
      inflections: (lemma.paradigm_info || []).flatMap(paradigm => (paradigm.inflection || []).map(form => form.word_form)).filter(Boolean),
      partOfSpeechMatch: true,
      unambiguous: true
    }]
  };
}

export function parseOrdvevTabs(wordsText, wordSensesText, { onError } = {}) {
  const words = new Map(String(wordsText).trim().split(/\r?\n/u).slice(1).filter(Boolean).map(line => {
    const [id, form, pos] = line.split('\t');
    return [id, { form, pos }];
  }));
  return String(wordSensesText).trim().split(/\r?\n/u).slice(1).filter(Boolean).map(line => {
    const [wordSenseId, wordId, synsetId, register = ''] = line.split('\t');
    const word = words.get(wordId);
    if (!word) {
      onError?.(`Ordvev wordsense ${wordSenseId} references unknown word ${wordId}`);
      return null;
    }
    return { wordSenseId, wordId, synsetId, register, ...word };
  }).filter(Boolean);
}

export function indexOrdvevEntries(entries) {
  const index = new Map();
  for (const entry of entries || []) {
    const key = normalizeAuditText(entry.form);
    if (!index.has(key)) index.set(key, []);
    index.get(key).push({ synsetId: String(entry.synsetId), pos: entry.pos, wordSenseId: String(entry.wordSenseId) });
  }
  return index;
}

export function adaptWiktionaryEntry(entry, { pairId, direction, candidate } = {}) {
  const translations = (entry?.translations || []).filter(item => item?.lang === (direction === 'no-es' ? 'es' : 'nb'));
  const values = translations.map(item => item.word || item.term).filter(Boolean);
  if (!pairId || !direction || values.length === 0) return [];
  return values.map(value => ({
    pairId,
    direction,
    candidate: candidate || value,
    canonicalMeaningId: undefined,
    sources: ['wiktionary'],
    evidence: [{ source: 'wiktionary', entryId: entry.word || entry.id || 'unknown', relation: 'explicit_translation', glosses: entry.senses?.flatMap(sense => sense.glosses || []) || [], partOfSpeechMatch: entry.partOfSpeechMatch, unambiguous: false }]
  }));
}

export function augmentCandidatesWithOrdvev(candidates, glossary, ordvevIndex) {
  return candidates.map(candidate => {
    const card = glossary.find(item => ['no-es', 'es-no'].some(direction => buildGlossaryPairId(item, direction) === candidate.pairId));
    if (!card || !ordvevIndex?.has(normalizeAuditText(card.no))) return candidate;
    const support = ordvevIndex.get(normalizeAuditText(card.no));
    return {
      ...candidate,
      sources: [...new Set([...(candidate.sources || []), 'ordvev'])].sort(),
      evidence: [...(candidate.evidence || []), { source: 'ordvev', entryId: support.map(item => item.wordSenseId).join(','), relation: 'lexical_attestation', synsetIds: support.map(item => item.synsetId), partOfSpeechMatch: true, unambiguous: true }]
    };
  });
}
