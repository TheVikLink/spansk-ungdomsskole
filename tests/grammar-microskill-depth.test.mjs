import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function extractGrammarTopics(html) {
  const start = html.indexOf('const grammarTopics = {');
  assert.notEqual(start, -1, 'grammarTopics declaration missing in index.html');
  const objStart = html.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let esc = false;
  let objEnd = -1;
  for (let i = objStart; i < html.length; i += 1) {
    const ch = html[i];
    if (quote) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        objEnd = i + 1;
        break;
      }
    }
  }
  assert.ok(objEnd > objStart, 'Could not find end of grammarTopics object');
  return new vm.Script(`(${html.slice(objStart, objEnd)})`).runInContext(vm.createContext({}));
}

test('every grammar topic and microskill has at least 5 complete exercises', () => {
  const html = readFileSync('index.html', 'utf8');
  const topics = extractGrammarTopics(html);
  const bySkill = new Map();

  for (const [topicId, topic] of Object.entries(topics)) {
    const exercises = topic.exercises || [];
    assert.ok(exercises.length >= 5, `Topic ${topicId} has only ${exercises.length} exercises`);
    for (const [index, ex] of exercises.entries()) {
      assert.ok(typeof ex.sentence === 'string' && ex.sentence.trim(), `Missing sentence: ${topicId}[${index}]`);
      assert.ok(typeof ex.hint === 'string' && ex.hint.trim(), `Missing hint: ${topicId}[${index}]`);
      assert.ok(Array.isArray(ex.options) && ex.options.includes(ex.answer), `Answer not in options: ${topicId}[${index}]`);
      if (ex.skillId) {
        if (!bySkill.has(ex.skillId)) bySkill.set(ex.skillId, []);
        bySkill.get(ex.skillId).push(ex);
      }
    }
  }

  for (const [skillId, list] of bySkill.entries()) {
    assert.ok(list.length >= 5, `Microskill ${skillId} has only ${list.length} exercises (expected >= 5)`);
  }
  assert.ok((bySkill.get('a0.existential.hay') || []).length >= 5);
});
