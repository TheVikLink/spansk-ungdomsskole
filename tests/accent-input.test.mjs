import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('index.html', 'utf8');
function functionSource(name) {
  const start = source.indexOf(`        function ${name}(`);
  const tail = source.slice(start + 1);
  return tail.slice(0, tail.search(/\n        (?:function |const |let |\/\/ ={5})/));
}

function field() {
  const listeners = new Map();
  const timers = new Map();
  let sequence = 0;
  const input = {
    value: '', dataset: {}, selectionStart: 0, selectionEnd: 0, scrollLeft: 0, scrollWidth: 700,
    tagName: 'INPUT', disabled: false, readOnly: false,
    addEventListener(name, callback) { listeners.set(name, callback); },
    dispatchEvent() {},
    setRangeText(value, start, end, mode) {
      this.value = this.value.slice(0, start) + value + this.value.slice(end);
      if (mode === 'end') this.selectionStart = this.selectionEnd = start + value.length;
    }
  };
  const runtime = vm.createContext({
    Event, InputEvent: Event,
    setTimeout(callback) { timers.set(++sequence, callback); return sequence; },
    clearTimeout(id) { timers.delete(id); }
  });
  vm.runInContext(source.match(/const accentMap = \{[\s\S]*?\n        \};/)[0], runtime);
  for (const name of ['insertCharacter', 'setupAccentInput']) vm.runInContext(functionSource(name), runtime);
  runtime.setupAccentInput(input);
  return {
    input,
    event(type, options = {}) {
      const event = { preventDefault() {}, stopImmediatePropagation() {}, ...options };
      listeners.get(type)?.(event);
    },
    hold() { for (const [id, callback] of [...timers]) { timers.delete(id); callback(); } }
  };
}

test('Shift plus held question/exclamation keys inserts inverted punctuation', () => {
  for (const [key, code, expected] of [['?', 'Minus', '¿'], ['!', 'Digit1', '¡']]) {
    const f = field();
    f.event('keydown', { key, code, shiftKey: true });
    assert.equal(f.input.value, key);
    f.hold();
    assert.equal(f.input.value, expected);
    assert.equal(f.input.selectionStart, 1);
  }
});

test('a quick punctuation press stays ordinary even when Shift is released first', () => {
  const f = field();
  f.event('keydown', { key: '?', code: 'Minus', shiftKey: true });
  f.event('keyup', { key: 'Shift', code: 'ShiftLeft' });
  f.event('keyup', { key: '+', code: 'Minus' });
  f.hold();
  assert.equal(f.input.value, '?');
});

test('long press preserves the caret after following letters and scrolls to the visible end', () => {
  const f = field();
  f.input.value = 'Esta es una frase muy larga '; // position is after the existing sentence
  f.input.selectionStart = f.input.selectionEnd = f.input.value.length;
  f.event('keydown', { key: 'e', code: 'KeyE' });
  f.event('keydown', { key: 'n', code: 'KeyN' });
  f.event('keyup', { key: 'n', code: 'KeyN' });
  f.hold();
  assert.ok(f.input.value.endsWith('én'));
  assert.equal(f.input.selectionStart, f.input.value.length);
  assert.equal(f.input.selectionEnd, f.input.value.length);
  assert.equal(f.input.scrollLeft, f.input.scrollWidth);
});

test('blur cancels a pending conversion and modifiers/read-only fields are untouched', () => {
  const f = field();
  f.event('keydown', { key: '?', code: 'Minus', shiftKey: true });
  f.event('blur');
  f.hold();
  assert.equal(f.input.value, '?');
  for (const modifier of ['ctrlKey', 'metaKey', 'altKey', 'isComposing']) {
    f.event('keydown', { key: 'a', [modifier]: true });
  }
  f.input.readOnly = true;
  f.event('keydown', { key: 'a' });
  assert.equal(f.input.value, '?');
});

test('holding a shifted letter preserves normal uppercase and editing in the middle retains its caret', () => {
  const f = field();
  f.event('keydown', { key: 'E', code: 'KeyE', shiftKey: true });
  f.hold();
  assert.equal(f.input.value, 'E');
  f.input.value = 'dos palabras';
  f.input.selectionStart = f.input.selectionEnd = 3;
  f.input.scrollLeft = 0;
  f.event('keydown', { key: 'e', code: 'KeyE' });
  f.hold();
  assert.equal(f.input.value, 'dosé palabras');
  assert.equal(f.input.selectionStart, 4);
  assert.equal(f.input.scrollLeft, 0);
});
