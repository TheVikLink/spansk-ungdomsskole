import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { extractGlossary, extractVocabularyAnswerAlternatives } from '../scripts/lib/extract-all-items.mjs';
import { renderVocabulary } from '../scripts/sync-vocabulary.mjs';
import { extractDiagnosisCatalog } from '../scripts/lib/extract-inline-catalog.mjs';

const html = readFileSync('index.html', 'utf8');
const review = JSON.parse(readFileSync('data/vocabulary-canonical-review.json', 'utf8'));
const applyScript = path.resolve('scripts/apply-approved-alternatives.mjs');

function appFunction(source, name) {
  const start = source.indexOf(`        function ${name}(`);
  if (start < 0) return '';
  const tail = source.slice(start + 1);
  const next = tail.search(/\n        (?:function |const |let |\/\/ ={5})/);
  return next < 0 ? tail : tail.slice(0, next);
}

function answerRuntime(source, sourceReview = review) {
  const context = vm.createContext({
    glossary: extractGlossary(source),
    vocabularyCanonicalIds: sourceReview.entries.map(entry => entry.id),
    vocabularyAnswerAlternatives: extractVocabularyAnswerAlternatives(source),
    norwegianNounDefiniteForms: {}
  });
  for (const name of ['getVocabularyCanonicalId', 'getVocabularyAcceptedAnswers', 'getNorwegianNounDefiniteForms']) {
    vm.runInContext(appFunction(source, name), context);
  }
  vm.runInContext(source.match(/const getDiagnosisAnswerValue = [^\n]+/)[0], context);
  context.diagnosisQuestionCatalog = extractDiagnosisCatalog(source);
  context.grammarTopics = {};
  for (const name of ['normalizeAnswerText', 'normalizeAccentVariant', 'evaluateDiagnosisAnswer', 'isTypedVocabAnswerCorrect', 'getMixedQuizCandidateCell', 'buildGrammarSkillCandidates', 'buildMixedQuizCandidates']) {
    vm.runInContext(appFunction(source, name), context);
  }
  return context;
}

function storageRuntime(source, sourceReview = review) {
  const runtime = answerRuntime(source, sourceReview);
  const values = new Map();
  Object.assign(runtime, {
    cards: [], archivedVocabularyCards: [],
    SM2: { defaultEaseFactor: 2.5 },
    localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) },
    readStoredJson: (key, fallback) => values.has(key) ? JSON.parse(values.get(key)) : fallback
  });
  for (const name of ['normalizeLegacyCategory', 'normalizeCard', 'isVocabularyCardEligible', 'loadData', 'mergeNewVocabulary', 'saveData', 'getNextAvailableCardId']) {
    vm.runInContext(appFunction(source, name), runtime);
  }
  return runtime;
}

function fixture(run) {
  const directory = mkdtempSync(path.join(tmpdir(), 'spansk-vocabulary-authority-'));
  try {
    mkdirSync(path.join(directory, 'data'));
    writeFileSync(path.join(directory, 'index.html'), html);
    writeFileSync(path.join(directory, 'data/vocabulary-canonical-review.json'), JSON.stringify(review));
    writeFileSync(path.join(directory, 'data/vocabulary-canonical.json'), JSON.stringify(review));
    return run(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function command(directory, script, ...args) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: directory, encoding: 'utf8' });
  assert.ifError(result.error);
  return { status: result.status, output: result.stdout + result.stderr };
}

test('the existing apply command reads review edits and removals instead of the stale canonical copy', () => fixture(directory => {
  const edited = structuredClone(review);
  const removed = edited.entries.shift();
  const expression = edited.entries.find(entry => entry.norsk === 'jeg skal snakke om');
  expression.svar['no-es'] = ['voy a hablar de'];
  expression.spansk = 'voy a hablar de';
  writeFileSync(path.join(directory, 'data/vocabulary-canonical-review.json'), JSON.stringify(edited));
  const result = command(directory, applyScript, '--apply', '--replace');
  assert.equal(result.status, 0, result.output);
  const built = readFileSync(path.join(directory, 'index.html'), 'utf8');
  assert.equal(extractGlossary(built).some(([no, es]) => no === removed.norsk && es === removed.spansk), false);
  assert.deepEqual(extractVocabularyAnswerAlternatives(built)['jeg skal snakke om|no-es'].map(answer => answer.value), ['voy a hablar de']);
  assert.deepEqual(JSON.parse(readFileSync(path.join(directory, 'data/vocabulary-canonical.json'))).entries, edited.entries);
}));

test('every standard card uses exactly its reviewed answers in both directions', () => {
  const source = renderVocabulary(html, review);
  const runtime = answerRuntime(source);
  for (const entry of review.entries) {
    const card = { no: entry.norsk, es: entry.spansk, category: entry.kategori };
    for (const direction of ['es-no', 'no-es']) {
      const actual = runtime.getVocabularyAcceptedAnswers(card, direction, direction === 'no-es' ? card.es : card.no);
      assert.deepEqual(Array.from(actual, answer => answer.value), entry.svar[direction], `${entry.id} ${direction}`);
    }
  }
});

test('the level test and mixed-quiz catalog use reviewed answers for their vocabulary questions', () => {
  const edited = structuredClone(review);
  const mother = edited.entries.find(entry => entry.spansk === 'la madre');
  mother.svar['es-no'] = ['mor'];
  const source = renderVocabulary(html, edited);
  const question = extractDiagnosisCatalog(source).find(question => question.targetId === 'core.madre');
  assert.deepEqual(question.acceptedAnswers.map(answer => answer.value), ['mor']);
});

test('vocabulary answer labels and feedback always show an accepted reviewed answer', () => {
  const source = renderVocabulary(html, review);
  const runtime = answerRuntime(source);
  vm.runInContext(appFunction(source, 'getExpectedAnswerText'), runtime);
  for (const entry of review.entries) {
    const card = { no: entry.norsk, es: entry.spansk, category: entry.kategori };
    for (const direction of ['es-no', 'no-es']) {
      const displayed = runtime.getExpectedAnswerText({ card, direction });
      assert.ok(entry.svar[direction].includes(displayed), `${entry.id} ${direction}: ${displayed}`);
    }
  }
  const customCard = { no: 'mitt ord', es: 'mi palabra', isCustom: true };
  assert.equal(runtime.getExpectedAnswerText({ card: customCard, direction: 'no-es' }), 'mi palabra');
});

test('standard card backs resolve stale labels by ID and preserve the exact reviewed answer', () => {
  const edited = structuredClone(review);
  const entry = edited.entries.find(entry => entry.norsk === 'Russland');
  entry.svar['es-no'] = ['Russland (land)'];
  const source = renderVocabulary(html, edited);
  const runtime = answerRuntime(source, edited);
  for (const name of ['getExpectedAnswerText', 'getDisplayAnswerText']) vm.runInContext(appFunction(source, name), runtime);
  const card = { canonicalId: entry.id, no: 'Russland på spansk', es: 'Rusia' };
  assert.equal(runtime.getDisplayAnswerText({ card, direction: 'es-no' }), 'Russland (land)');
  assert.equal(runtime.getExpectedAnswerText({ card: { ...card, isCustom: true }, direction: 'es-no' }), 'Russland på spansk');
});

test('confirmed historical country and number cards migrate without losing progress or changing custom words', () => {
  const runtime = storageRuntime(renderVocabulary(html, review));
  const legacy = [
    { no: 'Russland på spansk', es: 'Rusia', canonicalId: 'vocab-0075' },
    { no: 'Sveits (spansk)', es: 'Suiza', canonicalId: 'vocab-0087' },
    { no: '500 på spansk', es: 'quinientos', canonicalId: 'vocab-0043' }
  ];
  const oldCards = legacy.map(({ canonicalId, ...labels }, index) => ({
    id: 9000 + index, ...labels, reviews: 9, correct: 7,
    noEs: { repetitions: 4, interval: 12, nextReview: '2026-10-01' },
    esNo: { repetitions: 2, interval: 6, nextReview: '2026-09-28' }
  }));
  const ownCards = [{ ...oldCards[0], id: 9100, isCustom: true }, { ...oldCards[0], id: 9101, assignmentId: 'teacher-1' }];
  runtime.loadData();
  const currentCards = JSON.parse(runtime.localStorage.getItem('spansk123Data_v4'));
  const backup = JSON.stringify([...oldCards, ...ownCards, ...currentCards]);
  runtime.localStorage.setItem('spansk123Data_v4', backup);
  runtime.loadData();
  for (const [index, entry] of legacy.entries()) {
    const matches = runtime.cards.filter(card => card.canonicalId === entry.canonicalId && !card.isCustom && !card.assignmentId);
    assert.equal(matches.length, 1);
    const [card] = matches;
    assert.equal(card.id, oldCards[index].id);
    assert.equal(card.no, review.entries.find(row => row.id === entry.canonicalId).norsk);
    assert.equal(card.reviews, 9);
    assert.equal(card.correct, 7);
    for (const direction of ['noEs', 'esNo']) {
      for (const key of ['repetitions', 'interval', 'nextReview']) assert.equal(card[direction][key], oldCards[index][direction][key]);
    }
  }
  for (const own of ownCards) assert.equal(runtime.cards.find(card => card.id === own.id).no, own.no);
  const exported = runtime.localStorage.getItem('spansk123Data_v4');
  runtime.loadData();
  assert.equal(runtime.localStorage.getItem('spansk123Data_v4'), exported);
  const fresh = storageRuntime(renderVocabulary(html, review));
  fresh.localStorage.setItem('spansk123Data_v4', exported);
  fresh.loadData();
  assert.equal(fresh.localStorage.getItem('spansk123Data_v4'), exported);
  const removed = structuredClone(review);
  removed.entries = removed.entries.filter(entry => entry.id !== legacy[0].canonicalId);
  const withoutRussia = storageRuntime(renderVocabulary(html, removed), removed);
  withoutRussia.localStorage.setItem('spansk123Data_v4', backup);
  withoutRussia.loadData();
  assert.equal(withoutRussia.cards.some(card => card.id === oldCards[0].id), false);
  assert.equal(withoutRussia.archivedVocabularyCards.find(card => card.id === oldCards[0].id).reviews, 9);
});

function cardRuntime() {
  const runtime = storageRuntime(renderVocabulary(html, review));
  for (const name of ['getExpectedAnswerText', 'getDisplayAnswerText', 'getPromptBaseText', 'normalizeTypedAnswer', 'getVocabPromptText', 'mixedQuizSeedScore', 'getVocabularySelectOptions']) {
    vm.runInContext(appFunction(html, name), runtime);
  }
  runtime.loadData();
  return runtime;
}

test('ambiguous greeting hints distinguish the answer words and ignore identical answers', () => {
  const runtime = cardRuntime();
  const pool = ['god morgen', 'god dag'].map(no => runtime.cards.find(card => card.no === no));
  assert.equal(runtime.getVocabPromptText({ card: pool[0], direction: 'es-no' }, pool), 'buenos días (m)');
  assert.equal(runtime.getVocabPromptText({ card: pool[1], direction: 'es-no' }, pool), 'buenos días (d)');
  assert.equal(runtime.getVocabPromptText({ card: pool[0], direction: 'es-no' }, [pool[0], { ...pool[0], id: 999 }]), 'buenos días');
});

test('number select options use close reviewed numbers in both directions and vary the correct position', () => {
  const runtime = cardRuntime();
  const positions = new Set();
  for (const no of ['17', '18', '19', '20', '26']) {
    const card = runtime.cards.find(card => card.no === no && card.category === 'tall');
    for (const direction of ['no-es', 'es-no']) {
      const options = runtime.getVocabularySelectOptions({ card, direction });
      assert.equal(options.length, 4);
      assert.equal(options.filter(option => option.correct).length, 1);
      for (const option of options) {
        const entry = review.entries.find(entry => entry.kategori === 'tall' && entry.svar[direction][0] === option.label);
        assert.ok(entry, option.label);
        assert.ok(Math.abs(Number(entry.norsk) - Number(no)) <= 10, `${no}: ${option.label}`);
        if (no === '26') assert.ok(!['11', '12', '13'].includes(entry.norsk), option.label);
      }
      positions.add(options.findIndex(option => option.correct));
      assert.equal(JSON.stringify(runtime.getVocabularySelectOptions({ card, direction }, [...runtime.cards].reverse())), JSON.stringify(options));
    }
  }
  assert.ok(positions.size > 1);
});

test('select options exclude accepted alternatives and unrelated categories; sparse pools use recall', () => {
  const runtime = cardRuntime();
  const card = runtime.cards.find(card => card.no === 'god morgen');
  const options = runtime.getVocabularySelectOptions({ card, direction: 'es-no' });
  assert.equal(options.some(option => !option.correct && option.label === 'god dag'), false);
  for (const option of options) assert.ok(review.entries.some(entry => entry.kategori === card.category && entry.svar['es-no'][0] === option.label));
  const sparsePool = [card, { id: 9990, no: 'galakse', es: 'galaxia', category: 'astronomi' }];
  assert.equal(runtime.getVocabularySelectOptions({ card, direction: 'es-no' }, sparsePool).length, 0);
});

test('removed standard cards leave practice but survive reload and the existing backup payload', () => {
  const runtime = storageRuntime(renderVocabulary(html, review));
  const oldCard = { id: 9998, no: 'sjokoladedrikk', es: 'el Cola Cao', category: 'kapittel 7: gloser', reviews: 7, correct: 6, noEs: { repetitions: 4 }, esNo: { repetitions: 3 } };
  const customCard = { ...oldCard, id: 9999, isCustom: true, category: 'Mine ord' };
  runtime.localStorage.setItem('spansk123Data_v4', JSON.stringify([oldCard, customCard]));
  runtime.loadData();
  assert.equal(runtime.cards.some(card => card.id === oldCard.id), false);
  assert.equal(runtime.cards.some(card => card.id === customCard.id), true);
  const saved = JSON.parse(runtime.localStorage.getItem('spansk123Data_v4'));
  assert.equal(saved.find(card => card.id === oldCard.id).noEs.repetitions, 4);
  runtime.loadData();
  assert.equal(runtime.cards.some(card => card.id === oldCard.id), false);
  assert.deepEqual(JSON.parse(runtime.localStorage.getItem('spansk123Data_v4')), saved);
  assert.ok(runtime.getNextAvailableCardId() > customCard.id);
});

test('later review removals, renames and reinstatements preserve stable card progress across backup import', () => {
  const first = storageRuntime(renderVocabulary(html, review));
  first.loadData();
  first.cards[0].noEs.repetitions = 8;
  first.cards[1].esNo.repetitions = 5;
  first.saveData();
  const oldBackup = first.localStorage.getItem('spansk123Data_v4');
  const edited = structuredClone(review);
  const removed = edited.entries.shift();
  edited.entries[0].norsk = 'to (tall)';
  edited.entries[0].svar['es-no'] = ['to (tall)', 'to', '2'];
  const updated = storageRuntime(renderVocabulary(html, edited), edited);
  updated.localStorage.setItem('spansk123Data_v4', oldBackup);
  updated.loadData();
  assert.equal(updated.cards.some(card => card.canonicalId === removed.id), false);
  assert.equal(updated.cards.find(card => card.canonicalId === edited.entries[0].id).no, 'to (tall)');
  assert.equal(updated.cards.find(card => card.canonicalId === edited.entries[0].id).esNo.repetitions, 5);
  const restored = storageRuntime(renderVocabulary(html, review));
  restored.localStorage.setItem('spansk123Data_v4', updated.localStorage.getItem('spansk123Data_v4'));
  restored.loadData();
  assert.equal(restored.cards.find(card => card.canonicalId === removed.id).noEs.repetitions, 8);
  assert.equal(new Set(restored.cards.map(card => card.id)).size, restored.cards.length);
});

test('custom words never inherit an unrelated standard answer through the Norwegian prompt', () => {
  const runtime = answerRuntime(renderVocabulary(html, review));
  const card = { no: 'hus', es: 'edificio', isCustom: true };
  assert.deepEqual(Array.from(runtime.getVocabularyAcceptedAnswers(card, 'no-es', card.es), answer => answer.value), ['edificio']);
});

test('real quiz candidates retain every reviewed answer, including both ways to say voy a hablar', () => {
  const runtime = storageRuntime(renderVocabulary(html, review));
  runtime.loadData();
  const candidates = runtime.buildMixedQuizCandidates({ cards: runtime.cards, skillsCatalog: { skills: [], words: [] }, learningProgress: {}, diagnosis: { answers: [] } });
  assert.equal(candidates.length, review.entries.length * 2);
  for (const card of runtime.cards) {
    const entry = review.entries.find(entry => entry.id === card.canonicalId);
    for (const [direction, label] of [['noToEs', 'no-es'], ['esToNo', 'es-no']]) {
      const question = candidates.find(candidate => candidate.questionId === `mixed.vocab.${card.id}.${direction}`);
      assert.deepEqual(Array.from(question.acceptedAnswers, answer => answer.value), entry.svar[label]);
      for (const answer of entry.svar[label]) assert.equal(runtime.evaluateDiagnosisAnswer(question, answer).correct, true, `${entry.id}: ${answer}`);
    }
  }
  const expression = candidates.find(candidate => candidate.prompt === 'jeg skal snakke om');
  for (const answer of ['voy a hablar de', 'voy a hablar sobre']) {
    assert.equal(runtime.evaluateDiagnosisAnswer(expression, answer).correct, true);
    assert.equal(runtime.isTypedVocabAnswerCorrect(answer, 'voy a hablar sobre', expression.acceptedAnswers.map(item => item.value)).correct, true);
  }
  assert.equal(runtime.evaluateDiagnosisAnswer(expression, 'vas a hablar de').correct, false);
  assert.equal(candidates.some(candidate => /cola cao/i.test(candidate.prompt)), false);
});

test('check mode detects stale derived files without overwriting them, and synchronization is idempotent', () => fixture(directory => {
  const script = path.resolve('scripts/sync-vocabulary.mjs');
  const initial = readFileSync(path.join(directory, 'index.html'), 'utf8');
  assert.equal(command(directory, script, '--check').status, 1);
  assert.equal(readFileSync(path.join(directory, 'index.html'), 'utf8'), initial);
  assert.equal(command(directory, script).status, 0);
  const built = readFileSync(path.join(directory, 'index.html'), 'utf8');
  assert.equal(command(directory, script).status, 0);
  assert.equal(readFileSync(path.join(directory, 'index.html'), 'utf8'), built);
  assert.equal(command(directory, script, '--check').status, 0);
}));

test('invalid review data cannot partially overwrite either output', () => fixture(directory => {
  const script = path.resolve('scripts/sync-vocabulary.mjs');
  const before = ['index.html', 'data/vocabulary-canonical.json'].map(filename => readFileSync(path.join(directory, filename), 'utf8'));
  for (const mutation of [
    data => { data.entries[1].id = data.entries[0].id; },
    data => { data.entries[0].svar['no-es'] = []; },
    data => { data.entries = []; },
    data => { data.entries = data.entries.filter(entry => entry.id !== 'vocab-0064'); }
  ]) {
    const edited = structuredClone(review);
    mutation(edited);
    writeFileSync(path.join(directory, 'data/vocabulary-canonical-review.json'), JSON.stringify(edited));
    assert.equal(command(directory, script).status, 1);
    assert.deepEqual(['index.html', 'data/vocabulary-canonical.json'].map(filename => readFileSync(path.join(directory, filename), 'utf8')), before);
  }
}));
