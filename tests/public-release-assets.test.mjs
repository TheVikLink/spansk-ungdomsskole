import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}
test('every culture lesson local link and image is present in the public source', () => {
  const missing = new Set();
  for (const file of htmlFiles(path.join(root, 'docs/kultur'))) {
    const html = readFileSync(file, 'utf8');
    for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(?:https?:|data:|mailto:|#)/.test(value)) continue;
      const target = path.resolve(path.dirname(file), decodeURIComponent(value.split(/[?#]/)[0]));
      if (!existsSync(target)) missing.add(`${path.relative(root, file)} → ${value}`);
    }
  }
  assert.deepEqual([...missing], []);
});
test('the public app has no school runtime or Feide sign-in entry', () => {
  const html = readFileSync('index.html', 'utf8');
  assert.match(html, /id="studentNameInput"/);
  assert.match(html, /id="recognitionSentencesBtn"/);
  assert.match(html, /id="recognitionFamiliesBtn"/);
  assert.doesNotMatch(html, /(?:src|href)="(?:[^"\n]*\/)?(?:school\.js|auth\/login)"/);
  for (const file of ['index.js', 'server/index.js', 'vercel.json']) assert.equal(existsSync(file), false, `${file} must stay out of the public release`);
});
