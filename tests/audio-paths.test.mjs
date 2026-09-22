import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';

const html = readFileSync('index.html', 'utf8');
const runtime = vm.createContext({ URL, location: { href: 'https://example.test/classroom/' } });
const catalogStart = html.indexOf('        const DICTATION_STORIES = ');
const catalogEnd = html.indexOf('        let dictationState = ', catalogStart);
assert.ok(catalogStart >= 0 && catalogEnd > catalogStart, 'Audio catalogs must be present');
vm.runInContext(html.slice(catalogStart, catalogEnd), runtime);

for (const name of ['dictationAudioUrl', 'listeningAudioUrl', 'getDictationAudioUrls']) {
  const start = html.indexOf(`        function ${name}(`);
  assert.notEqual(start, -1, `Missing app function: ${name}`);
  const tail = html.slice(start + 1);
  const end = tail.search(/\n        (?:async function |function |const |let |\/\/ ={5})/);
  vm.runInContext(end < 0 ? tail : tail.slice(0, end), runtime);
}

test('every listening and dictation URL matches an exact tracked filename on case-sensitive systems', () => {
  // macOS file lookup can hide both case and Unicode differences. Compare with
  // Git's exact paths, which are the filenames checked out by Linux CI/Pages.
  const tracked = new Set(execFileSync('git', ['ls-files', '-z', '--', 'audio/'], { encoding: 'utf8' }).split('\0').filter(Boolean));
  const urls = vm.runInContext(`[
    ...LISTENING_STORIES.filter(story => story.fullAudio).map(story => listeningAudioUrl(story)),
    ...DICTATION_STORIES.filter(story => story.audioDir).flatMap(story => getDictationAudioUrls(story))
  ]`, runtime);
  assert.ok(urls.length > 0, 'No audio URLs found');
  const missing = [];
  for (const url of urls) {
    const path = decodeURIComponent(new URL(url, runtime.location.href).pathname.slice('/classroom/'.length));
    if (!tracked.has(path)) missing.push(path);
  }
  assert.deepEqual(missing, [], 'App audio URLs must match Git filenames exactly, including Unicode composition');
});
