import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function listTypographyFiles() {
  if (typeof fs.globSync === 'function') {
    return fs.globSync([
      '*.{html,js,webmanifest}', '{src,server/public}/**/*.{js,html,css}',
      'data/**/*.json', 'server/{activity-catalog.js,content-catalog.json}',
      '{docs,undervisning}/**/*.{html,css,js,txt}', '{docs/kultur,docs/a1}/**/*.md',
      'scripts/build-*.{py,mjs}', 'images/**/*.svg'
    ]);
  }
  const results = [];
  const walk = (dir, match) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = dir === '.' ? entry.name : path.posix.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (dir !== '.' && !entry.name.startsWith('.')) walk(rel, match);
      } else if (match(rel)) {
        results.push(rel);
      }
    }
  };
  walk('.', rel => /^[^/]+\.(?:html|js|webmanifest)$/.test(rel));
  walk('src', rel => /\.(?:js|html|css)$/.test(rel));
  walk('server/public', rel => /\.(?:js|html|css)$/.test(rel));
  walk('data', rel => /\.json$/.test(rel));
  for (const f of ['server/activity-catalog.js', 'server/content-catalog.json']) if (fs.existsSync(f)) results.push(f);
  walk('docs', rel => /\.(?:html|css|js|txt)$/.test(rel));
  walk('undervisning', rel => /\.(?:html|css|js|txt)$/.test(rel));
  walk('docs/kultur', rel => /\.md$/.test(rel));
  walk('docs/a1', rel => /\.md$/.test(rel));
  walk('scripts', rel => /^scripts\/build-[^/]+\.(?:py|mjs)$/.test(rel));
  walk('images', rel => /\.svg$/.test(rel));
  return [...new Set(results)];
}

test('site and printable lesson sources use punctuation other than U+00B7', () => {
  const files = listTypographyFiles();
  assert.ok(files.includes('index.html') && files.includes('server/public/school.html'));
  const forbidden = /\u00b7|&(?:middot|centerdot|#0*183|#x0*b7);|\\(?:u00b7|x[bB]7|u\{0*b7\})/iu;
  const violations = files.filter(file => forbidden.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(violations, [], 'Remove U+00B7 from ' + violations.join(', '));
});
