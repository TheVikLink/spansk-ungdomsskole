import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('index.html', 'utf8');

function appFunction(name) {
  const start = html.indexOf(`        function ${name}(`);
  assert.notEqual(start, -1, `Missing app function: ${name}`);
  const tail = html.slice(start + 1);
  const end = tail.search(/\n        (?:function |const |let |\/\/ ={5})/);
  return end < 0 ? tail : tail.slice(0, end);
}

test('home review counts words once across directions and uses the actual review queue', () => {
  const runtime = vm.createContext({});
  vm.runInContext(html.match(/const LEECH_LAPSE_THRESHOLD = [^;]+;/)[0], runtime);
  for (const name of ['getDirectionData', 'isLeechReviewData', 'isLeechReviewItem', 'getDueCards', 'getVocabularyReviewWordCount']) {
    vm.runInContext(appFunction(name), runtime);
  }
  const due = { repetitions: 2, nextReview: '2020-01-01T00:00:00Z', lapses: 0 };
  const future = { repetitions: 2, nextReview: '2999-01-01T00:00:00Z', lapses: 0 };
  const fresh = { repetitions: 0, nextReview: null, lapses: 0 };
  const cards = [
    { id: 9, noEs: due, esNo: due },
    { id: 42, noEs: future, esNo: due },
    { id: 83, noEs: fresh, esNo: fresh },
    { id: 101, noEs: future, esNo: future },
    { id: 122, noEs: { ...future, lapses: 8 }, esNo: fresh }
  ];
  assert.equal(runtime.getDueCards(cards).length, 4);
  assert.equal(runtime.getVocabularyReviewWordCount(cards), 3);
  assert.equal(runtime.getVocabularyReviewWordCount([]), 0);
  assert.equal(runtime.getVocabularyReviewWordCount([cards[0]]), 1);
  assert.equal(runtime.getVocabularyReviewWordCount([cards[2], cards[3]]), 0);
  cards[0].noEs = future;
  cards[0].esNo = future;
  assert.equal(runtime.getVocabularyReviewWordCount(cards), 2);
});
