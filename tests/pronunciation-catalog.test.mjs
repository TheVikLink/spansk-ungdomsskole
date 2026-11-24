import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { validatePronunciation } from '../scripts/sync-pronunciation.mjs';

test('Refold package preserves the 62 original word and sentence recordings and binds each to its source role', () => {
  assert.ok(existsSync('data/pronunciation-refold.json'), 'pronunciation catalog must exist');
  const catalog = JSON.parse(readFileSync('data/pronunciation-refold.json'));
  const manifest = JSON.parse(readFileSync('data/pronunciation-audio-manifest.json'));
  const source = JSON.parse(readFileSync('docs/uttale/refold-kartlegging-2026-10-07.json'));
  assert.equal(catalog.items.length, 31);
  assert.equal(manifest.files.length, 62);
  assert.equal(new Set(manifest.files.map(f => f.path)).size, 62);
  for (const file of manifest.files) {
    const original = source.audio.find(a => file.path.endsWith('/' + a.file));
    assert.ok(original);
    const bytes = readFileSync(file.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), original.sha256);
    assert.equal(file.sha256, original.sha256);
    assert.equal(file.bytes, bytes.length);
  }
  for (const item of catalog.items) {
    assert.ok(!Object.hasOwn(item, 'ipa'));
    assert.ok(!Object.hasOwn(item.audio, 'letter'));
    for (const role of ['word', 'sentence']) {
      assert.equal(item.audio[role], `audio/uttale/refold-v1/ESPhoneticWritingSystem_${item.sourceIndex}_${role}.mp3`);
    }
  }
  const check = spawnSync(process.execPath, ['scripts/sync-pronunciation.mjs', '--check'], { encoding: 'utf8' });
  assert.equal(check.status, 0, check.stdout + check.stderr);
});

test('catalog checks reject missing, replaced and misbound audio, unsafe paths and duplicate coverage', () => {
  const original = JSON.parse(readFileSync('data/pronunciation-refold.json'));
  const manifest = JSON.parse(readFileSync('data/pronunciation-audio-manifest.json'));
  assert.throws(() => validatePronunciation(original, manifest, () => Buffer.from('changed')), /avviker/);
  for (const mutate of [
    c => c.items[0].audio.word = c.items[1].audio.word,
    c => c.groups[0].itemIds[0] = c.groups[0].itemIds[1],
    c => c.items[0].explanation = '',
  ]) {
    const copy = structuredClone(original); mutate(copy);
    assert.throws(() => validatePronunciation(copy, manifest));
  }
  const copy = structuredClone(manifest); copy.files[0].path = '../private.mp3';
  assert.throws(() => validatePronunciation(original, copy), /Ugyldig lydsti/);
});

test('pronunciation focus marks actual graphemes without changing the spoken source text', () => {
  const catalog = JSON.parse(readFileSync('data/pronunciation-refold.json'));
  const manifest = JSON.parse(readFileSync('data/pronunciation-audio-manifest.json'));
  for (const item of catalog.items) {
    for (const role of ['word', 'sentence']) {
      assert.ok(Array.isArray(item.focus?.[role]) && item.focus[role].length > 0, item.id + '/' + role);
      assert.ok(item.focus[role].every(([start, end]) => start >= 0 && end > start && end <= item[role].length));
    }
  }
  catalog.items[0].focus.word = [[0, 9000]];
  assert.throws(() => validatePronunciation(catalog, manifest), /markering/);
});


test('the pronunciation catalog has no guess-the-vowel or rule quiz stage', () => {
  const catalog = JSON.parse(readFileSync('data/pronunciation-refold.json'));
  assert.ok(catalog.items.every(item => !Object.hasOwn(item, 'question')));
});
