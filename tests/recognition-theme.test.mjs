import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateRecognitionTheme, renderRecognitionTheme } from '../scripts/sync-vocabulary.mjs';

const theme = JSON.parse(readFileSync('data/vocabulary-recognition-theme.json'));
const review = JSON.parse(readFileSync('data/vocabulary-canonical-review.json'));
const html = readFileSync('index.html', 'utf8');

test('gender-neutral Norwegian prompts accept reviewed feminine person and adjective forms', () => {
  const cases = {
    'vocab-0547': ['la turista'],
    'vocab-0548': ['la artista'],
    'vocab-0549': ['la actriz', 'actriz'],
    'vocab-0550': ['la doctora', 'doctora'],
    'vocab-0551': ['la estudiante'],
    'vocab-0583': ['moderna'],
    'vocab-0584': ['fantástica'],
    'vocab-0585': ['romántica'],
    'vocab-0586': ['práctica'],
    'vocab-0589': ['generosa'],
    'vocab-0590': ['curiosa'],
    'vocab-0591': ['famosa']
  };
  for (const [id, answers] of Object.entries(cases)) {
    const entry = review.entries.find(entry => entry.id === id);
    for (const answer of answers) assert.ok(entry.svar['no-es'].includes(answer), `${id} must accept ${answer}`);
  }
  assert.ok(!review.entries.find(entry => entry.id === 'vocab-0551').svar['no-es'].includes('la estudianta'));
});

test('the selected meanings distinguish society and music from personality and talent', () => {
  const social = review.entries.find(entry => entry.id === 'vocab-0575');
  const musical = review.entries.find(entry => entry.id === 'vocab-0577');
  assert.equal(social.norsk, 'sosial (om samfunnet)');
  assert.ok(social.svar['es-no'].includes('samfunnsmessig'));
  assert.ok(!social.svar['no-es'].includes('sociable'));
  assert.equal(musical.norsk, 'musikalsk (som gjelder musikk)');
  assert.ok(musical.svar['es-no'].includes('som gjelder musikk'));
  assert.ok(!musical.svar['es-no'].includes('musikalsk begavet'));
  const bridge = id => theme.members.find(member => member.vocabularyId === id);
  assert.match(bridge(social.id).noteNb, /sociable/);
  assert.match(bridge(musical.id).noteNb, /musikk/);
  assert.equal(bridge('vocab-0549').bridgeNb, '');
});

test('valid Norwegian bridges and ordinary noun answers are not marked wrong', () => {
  const cases = {
    'vocab-0318': ['klasse', 'klassen'],
    'vocab-0564': ['konversasjon', 'konversasjonen'],
    'vocab-0501': ['jogurt', 'jogurten'],
    'vocab-0536': ['fotografi', 'fotografiet'],
    'vocab-0581': ['horribel'],
    'vocab-0523': ['hotellet']
  };
  for (const [id, answers] of Object.entries(cases)) {
    const entry = review.entries.find(entry => entry.id === id);
    for (const answer of answers) assert.ok(entry.svar['es-no'].includes(answer), `${id} must accept ${answer}`);
  }
  assert.ok(review.entries.find(entry => entry.id === 'vocab-0492').svar['no-es'].includes('pasta'));
  assert.ok(review.entries.find(entry => entry.id === 'vocab-0528').svar['no-es'].includes('el radio'));
});

test('theme references canonical answers and generates an offline-safe inline copy', () => {
  assert.equal(validateRecognitionTheme(theme, review), theme);
  const output = renderRecognitionTheme(html, theme, review);
  const inline = JSON.parse(output.match(/id="recognition-theme-data">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(inline, theme);
  assert.equal(renderRecognitionTheme(output, theme, review), output);
  assert.ok(theme.members.length >= 60);
  assert.ok(theme.starterIds.length >= 15);
});

for (const [name, mutate] of [
  ['missing word', t => { t.members[0].vocabularyId = 'missing'; }],
  ['duplicate member', t => t.members.push(t.members[0])],
  ['unknown starter', t => t.starterIds.push('missing')],
  ['duplicate starter', t => t.starterIds.push(t.starterIds[0])],
  ['no bridge', t => { t.members[0].bridgeNb = ''; t.members[0].bridgeEn = ''; }],
  ['empty start selection', t => { t.starterIds = []; }],
  ['wrong version', t => { t.schemaVersion = 2; }],
  ['invalid review status', t => { t.members[0].reviewStatus = 'unchecked'; }]
]) {
  test(`build rejects ${name}`, () => {
    const changed = structuredClone(theme); mutate(changed);
    assert.throws(() => validateRecognitionTheme(changed, review));
  });
}

test('embedded bridge text cannot close the script element', () => {
  const changed = structuredClone(theme);
  changed.members[0].noteNb = '</script><img src=x onerror=alert(1)>';
  const output = renderRecognitionTheme(html, changed, review);
  const raw = output.match(/id="recognition-theme-data">([\s\S]*?)<\/script>/)[1];
  assert.ok(!raw.includes('<'));
  assert.equal(JSON.parse(raw).members[0].noteNb, changed.members[0].noteNb);
});
