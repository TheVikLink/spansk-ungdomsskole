import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

async function core() {
  assert.ok(existsSync('src/pronunciation-core.js'), 'pronunciation core must exist');
  await import('../src/pronunciation-core.js');
  return globalThis.PronunciationCore;
}
const entry = (itemId = 'refold-es-01', contentVersion = 1, practicedOn = '2026-10-07') => ({ itemId, contentVersion, practicedOn });
const progress = (practiced = [entry()]) => ({ schemaVersion: 1, catalogVersion: 1, practiced });

test('pronunciation import only accepts bounded metadata, never raw sound or unknown schemas', async () => {
  const c = await core();
  assert.deepEqual(c.validateProgress(progress()), progress());
  for (const value of [
    { ...progress(), audio: 'data:audio/webm;base64,voice' },
    { ...progress(), schemaVersion: 2 },
    progress([{ ...entry(), transcript: 'personal words' }]),
    progress([entry('refold-es-99')]), progress([entry(['refold-es-01'])]), progress([entry('refold-es-01', 1, '2026-02-30')]),
    progress(Array.from({ length: 156 }, () => entry())),
    progress(Array.from({ length: 6 }, (_, i) => entry('refold-es-01', i + 1))),
  ]) assert.throws(() => c.validateProgress(value));
  const existing = progress();
  assert.throws(() => c.mergeProgress(existing, { ...progress(), schemaVersion: 2 }));
  assert.deepEqual(existing, progress());
});

test('short sessions offer new items, then older practice, and preserve dated/versioned exports', async () => {
  const c = await core();
  const catalog = JSON.parse(readFileSync('data/pronunciation-refold.json'));
  const practiced = progress([entry(), entry('refold-es-02')]);
  assert.equal(typeof c.selectSession, 'function');
  assert.deepEqual(c.selectSession(catalog.groups[0], catalog.items, practiced).map(i => i.id), ['refold-es-03', 'refold-es-04', 'refold-es-01']);
  const merged = c.mergeProgress(practiced, progress([entry('refold-es-01', 1, '2026-10-08'), entry('refold-es-01', 2)]));
  assert.equal(merged.practiced.length, 3);
  assert.equal(merged.practiced[0].practicedOn, '2026-10-08');
  assert.deepEqual(c.validateProgress(JSON.parse(JSON.stringify(merged))), merged);
  const future = { ...progress(), catalogVersion: 2 };
  assert.equal(c.mergeProgress(practiced, future).catalogVersion, 2);
  assert.throws(() => c.mergeProgress(progress([1,2,3].map(v => entry('refold-es-01', v))), progress([4,5,6].map(v => entry('refold-es-01', v)))));
});
