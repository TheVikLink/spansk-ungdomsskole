import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('review shortcuts require a revealed answer before choosing Bra or Igjen', () => {
  const html = readFileSync('index.html', 'utf8');
  const start = html.indexOf('        function getVocabularyShortcutAction(');
  assert.notEqual(start, -1, 'Missing vocabulary shortcut decision function');
  const tail = html.slice(start + 1);
  const end = tail.indexOf('\n        function ');
  const runtime = vm.createContext({});
  vm.runInContext(tail.slice(0, end), runtime);
  const action = (key, answerVisible, extra = {}, mode = 'flip') =>
    runtime.getVocabularyShortcutAction({ key, ...extra }, answerVisible, mode);

  assert.equal(action(' ', false), 'flip');
  assert.equal(action('Enter', false), 'flip');
  assert.equal(action('1', false), null);
  assert.equal(action('2', false), null);
  assert.equal(action(' ', true), 'good');
  assert.equal(action('1', true), 'good');
  assert.equal(action('2', true), 'again');
  assert.equal(action('Enter', true), null);
  for (const key of [' ', '1', '2']) {
    for (const modifier of ['ctrlKey', 'metaKey', 'altKey', 'shiftKey', 'isComposing']) {
      assert.equal(action(key, true, { [modifier]: true }), null, `${modifier}+${key}`);
    }
    assert.equal(action(key, true, {}, 'typed'), null);
    assert.equal(action(key, true, {}, 'select'), null);
  }
});
