import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildGlossaryPairId,
  normalizeAuditText,
  validateApprovedCandidates,
  createDeterministicReport,
  buildApprovedAlternatives,
  mergeApprovedAlternatives,
  classifyCandidate
} from '../scripts/lib/curriculum-audit.mjs';
import { adaptSnapshot, adaptOrdbankLemma, parseOrdvevTabs, indexOrdvevEntries, adaptWiktionaryEntry, augmentCandidatesWithOrdvev } from '../scripts/audit-sources/adapters.mjs';

test('builds stable IDs from the complete glossary pair and direction', () => {
  assert.equal(buildGlossaryPairId({ no: 'å handle', es: 'comprar', category: 'hverdag' }, 'no-es'), 'å-handle--comprar--hverdag--no-es');
});

test('normalization is deterministic but does not erase ñ or accents', () => {
  assert.equal(normalizeAuditText('  Hacer   caminatas '), 'hacer caminatas');
  assert.equal(normalizeAuditText('niño ágil'), 'niño ágil');
});

test('approved candidates require a concrete pair and preserve canonical answers', () => {
  const glossary = [{ no: 'å handle', es: 'comprar', category: 'hverdag' }];
  const approved = [{ pairId: buildGlossaryPairId(glossary[0], 'no-es'), direction: 'no-es', candidate: 'ir de compras', status: 'approved', canonicalMeaningId: 'shop', sources: ['ordvev'] }];
  assert.deepEqual(validateApprovedCandidates(glossary, approved), { valid: true, errors: [] });
  assert.equal(validateApprovedCandidates(glossary, [{ ...approved[0], pairId: 'wrong' }]).valid, false);
  assert.deepEqual(buildApprovedAlternatives(glossary, approved), {
    'å handle|no-es': [
      { answerId: 'primary', value: 'comprar', canonicalMeaningId: 'shop' },
      { answerId: 'ir_de_compras', value: 'ir de compras', canonicalMeaningId: 'shop' }
    ]
  });
});

test('report output is byte-stable and includes rejected false positives', () => {
  const input = { glossary: [{ no: 'å handle', es: 'comprar', category: 'hverdag' }], candidates: [{ pairId: 'p', direction: 'no-es', candidate: 'tradere', status: 'false_positive', sources: ['wiktionary'] }] };
  const first = createDeterministicReport(input);
  const second = createDeterministicReport(input);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(first.candidates[0].status, 'false_positive');
});

test('automatically approves only independent, unambiguous semantic evidence', () => {
  const evidence = [
    { source: 'omwn', relation: 'same_synset', partOfSpeechMatch: true, unambiguous: true },
    { source: 'ordvev', relation: 'explicit_translation', partOfSpeechMatch: true, unambiguous: true }
  ];
  assert.equal(classifyCandidate({ sources: ['omwn', 'ordvev'], evidence }).status, 'auto_approved');
  assert.equal(classifyCandidate({ sources: ['wiktionary'], evidence: [{ source: 'wiktionary', relation: 'explicit_translation' }] }).status, 'needs_review');
  assert.equal(classifyCandidate({ sources: ['omwn', 'ordvev'], evidence, conflicts: true }).status, 'needs_review');
});

test('adapts supported source snapshots and rejects unknown sources', () => {
  const snapshot = adaptSnapshot({ id: 'omwn', license: 'CC BY', retrievedAt: '2026-08-28', entries: [{ pairId: 'p', direction: 'no-es', candidate: 'comprar', synsetId: 's1' }] });
  assert.equal(snapshot.candidates[0].evidence[0].relation, 'same_synset');
  assert.match(snapshot.sha256, /^[a-f0-9]{64}$/);
  assert.throws(() => adaptSnapshot({ id: 'unknown', license: 'x', retrievedAt: 'today', entries: [] }), /Unsupported audit source/);
});

test('merges generated alternatives without removing existing answers', () => {
  const merged = mergeApprovedAlternatives({ 'å handle|es-no': [{ answerId: 'primary', value: 'å handle' }] }, { 'å handle|es-no': [{ answerId: 'shoppe', value: 'å shoppe', canonicalMeaningId: 'shop' }] });
  assert.deepEqual(merged['å handle|es-no'].map(item => item.value), ['å handle', 'å shoppe']);
});

test('preserves existing canonical metadata during regeneration', () => {
  const merged = mergeApprovedAlternatives({ 'casa|es-no': [{ answerId: 'primary', value: 'hus', canonicalMeaningId: 'existing' }] }, { 'casa|es-no': [{ answerId: 'primary', value: 'hus', canonicalMeaningId: 'generated' }] });
  assert.equal(merged['casa|es-no'][0].canonicalMeaningId, 'existing');
});

test('weak single-source candidates never auto-approve risky examples', () => {
  assert.equal(classifyCandidate({ candidate: 'tradere', sources: ['wiktionary'], evidence: [{ source: 'wiktionary', relation: 'explicit_translation', unambiguous: false }] }).status, 'needs_review');
  assert.equal(classifyCandidate({ candidate: 'vandle', sources: [], evidence: [] }).status, 'auto_rejected');
});

test('does not generate alternatives for an ambiguous glossary key', () => {
  const cards = [{ no: 'gå', es: 'ir', category: 'verb' }, { no: 'gå', es: 'caminar', category: 'verb' }];
  const candidates = cards.map(card => ({ pairId: buildGlossaryPairId(card, 'no-es'), direction: 'no-es', candidate: 'andar', status: 'auto_approved', canonicalMeaningId: 'x', sources: ['omwn', 'ordvev'] }));
  assert.throws(() => buildApprovedAlternatives(cards, candidates), /ambiguous glossary key/);
});

test('adapts Ordbank Bokmål lemma data as lexical evidence, not translation evidence', () => {
  const result = adaptOrdbankLemma({ id: 234, lemma: 'kattedyr', language: 'nob', initial_lexeme_class: 'NOUN', paradigm_info: [{ inflection: [{ word_form: 'kattedyr' }, { word_form: 'kattedyret' }] }] }, { pairId: 'p', candidate: 'kattedyr' });
  assert.equal(result.evidence[0].relation, 'lexical_attestation');
  assert.deepEqual(result.evidence[0].inflections, ['kattedyr', 'kattedyret']);
  assert.throws(() => adaptOrdbankLemma({ lemma: 'gato', language: 'spa' }), /Bokmål/);
});

test('parses Norsk ordvev words and wordsenses into synset evidence', () => {
  const entries = parseOrdvevTabs('id\tform_nb\tpos\n1\thandle\tVerb\n2\tshoppe\tVerb\n', 'wordsense_id\tword_id\tsynset_id\tregister\n1\t1\t500\t\n2\t2\t500\t\n');
  assert.deepEqual(entries.map(entry => [entry.form, entry.synsetId]), [['handle', '500'], ['shoppe', '500']]);
});

test('indexes Ordvev senses by normalized Norwegian lemma', () => {
  const index = indexOrdvevEntries([{ form: 'Handle', pos: 'Verb', synsetId: '500', wordSenseId: '1' }]);
  assert.deepEqual(index.get('handle'), [{ synsetId: '500', pos: 'Verb', wordSenseId: '1' }]);
});

test('adapts Wiktionary translations as non-automatic candidate evidence', () => {
  const result = adaptWiktionaryEntry({ word: 'handle', senses: [{ glosses: ['to shop'] }], translations: [{ lang: 'es', word: 'comprar' }] }, { pairId: 'p', direction: 'no-es' });
  assert.equal(result[0].candidate, 'comprar');
  assert.equal(result[0].evidence[0].unambiguous, false);
  assert.equal(classifyCandidate(result[0]).status, 'needs_review');
});

test('augments a Cygnet candidate with independent Ordvev lexical support', () => {
  const candidate = { pairId: 'handle--comprar--hverdag--no-es', sources: ['cygnet'], evidence: [{ source: 'cygnet', relation: 'same_synset' }] };
  const result = augmentCandidatesWithOrdvev([candidate], [{ no: 'handle', es: 'comprar', category: 'hverdag' }], new Map([['handle', [{ wordSenseId: '1', synsetId: '500' }]]]));
  assert.deepEqual(result[0].sources, ['cygnet', 'ordvev']);
  assert.equal(result[0].evidence[1].relation, 'lexical_attestation');
});

test('recording feedback has explicit vocabulary answer coverage', () => {
  const app = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const expected of [
    "'jeg blir irritert av|es-no'",
    "'å ha på seg|es-no'",
    "'sykepleier|no-es'",
    "'Bursdagen min er 7. juli|no-es'"
  ]) assert.ok(app.includes(expected) || app.includes(expected.replaceAll("'", '"')), `missing ${expected}`);
  assert.match(app, /filter\(isVocabularyCardEligible\)/);
});

test('all occupation cards use the shared gender-variant generator', () => {
  const app = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(app, /function getOccupationGenderVariants\(card, primaryAnswer\)/);
  assert.match(app, /getOccupationGenderVariants\(card, primaryAnswer\)/);
  assert.match(app, /profesor.*profesora/);
  assert.match(app, /dentista/);
});
