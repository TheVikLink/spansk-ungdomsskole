import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as sync from '../scripts/sync-vocabulary.mjs';

const theme = JSON.parse(readFileSync('data/vocabulary-recognition-theme.json'));
const review = JSON.parse(readFileSync('data/vocabulary-canonical-review.json'));

test('sentence activities use only starter words and taught function words', () => {
  assert.equal(typeof sync.validateRecognitionLearning, 'function');
  assert.equal(sync.validateRecognitionLearning(theme, review), theme);
  assert.equal(theme.sentences.length, 8);
  assert.deepEqual(theme.sentences.map(item => item.mode), ['tiles', 'tiles', 'tiles', 'tiles', 'typed', 'typed', 'typed', 'typed']);
  assert.ok(theme.sentences.some(item => item.tokens.includes('no')));
  assert.ok(theme.sentences.some(item => !item.tokens.includes('no')));
});

for (const [name, mutate] of [
  ['unknown word', t => { t.sentences[0].wordIds[0] = 'missing'; }],
  ['word outside starter selection', t => { t.sentences[0].wordIds.push('vocab-0584'); }],
  ['unreferenced Spanish word', t => { t.sentences[0].tokens.push('verde'); }],
  ['misplaced negation', t => { t.sentences[0].tokens.push('no'); }],
  ['duplicate exercise ID', t => { t.sentences[1].id = t.sentences[0].id; }],
  ['missing Norwegian prompt', t => { t.sentences[0].promptNb = ''; }],
  ['invalid mode', t => { t.sentences[0].mode = 'automatic'; }]
]) {
  test(`build rejects sentence with ${name}`, () => {
    const changed = structuredClone(theme); mutate(changed);
    assert.throws(() => sync.validateRecognitionLearning(changed, review));
  });
}

test('families distinguish Norwegian examples from English bridges and hold out each probe', () => {
  assert.equal(theme.families?.length, 7);
  assert.equal(sync.validateRecognitionLearning(theme, review), theme);
  for (const family of theme.families) {
    assert.ok(family.examples.length >= 2);
    assert.ok(!family.examples.some(example => example.vocabularyId === family.probeId));
    assert.ok(family.cautionNb.trim());
  }
  const english = theme.families.find(family => family.id === 'family-ble');
  assert.match(english.title, /Engelsk/);
  assert.ok(english.examples.every(example => example.language === 'en'));
});

for (const [name, mutate] of [
  ['unknown family example', t => { t.families[0].examples[0].vocabularyId = 'missing'; }],
  ['probe revealed as example', t => { t.families[0].probeId = t.families[0].examples[0].vocabularyId; }],
  ['unlabelled English bridge', t => { t.families[0].examples[0] = { vocabularyId: 'vocab-0531', language: 'nb' }; }],
  ['missing caution', t => { t.families[0].cautionNb = ''; }],
  ['duplicate family ID', t => { t.families[1].id = t.families[0].id; }]
]) {
  test(`build rejects ${name}`, () => {
    const changed = structuredClone(theme); mutate(changed);
    assert.throws(() => sync.validateRecognitionLearning(changed, review));
  });
}
