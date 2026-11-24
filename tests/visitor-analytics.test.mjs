import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildVercelPublic } from '../scripts/build-vercel-public.mjs';

const source = await readFile(new URL('../src/visitor-analytics.js', import.meta.url), 'utf8');
function run({ url = 'https://www.spansk123.no/?fbclid=private#private', referrer = '', navigator = {}, stored = null, storageThrows = false } = {}) {
  const scripts = [];
  const context = vm.createContext({ URL, window: {}, location: new URL(url), navigator,
    localStorage: { getItem(key) { assert.equal(key, '__va_attribution'); if (storageThrows) throw Error('blocked'); return stored; } },
    document: { referrer, createElement: () => ({}), head: { appendChild: script => scripts.push(script) } },
  });
  vm.runInContext(source, context);
  return { context, scripts, hook: context.window.vaq?.[0]?.[1] };
}

test('loads only on public HTTPS entry and sanitizes the one permitted pageview', () => {
  const { context, scripts, hook } = run({ referrer: 'https://www.facebook.com/' });
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, '/_vercel/insights/script.js');
  assert.equal(scripts[0].referrerPolicy, 'no-referrer');
  const event = hook({ type: 'pageview', url: 'https://www.spansk123.no/?token=secret#answer', payload: { answer: 'private' } });
  assert.equal(JSON.stringify(event), JSON.stringify({ type: 'pageview', url: 'https://www.spansk123.no/' }));
  assert.equal(hook({ type: 'pageview', url: 'https://www.spansk123.no/' }), null);
  vm.runInContext(source, context);
  assert.equal(scripts.length, 1);
});

test('rejects custom events and private routes without consuming the permitted view', () => {
  const { hook } = run();
  for (const event of [null, {}, { type: 'event', payload: { name: 'identify' } },
    ...['/school', '/auth/callback', '/api/session', '/student/private'].map(path => ({ type: 'pageview', url: `https://www.spansk123.no${path}` })),
    { type: 'pageview', url: 'https://evil.test/' }, { type: 'pageview', url: 'invalid' },
  ]) assert.equal(hook(event), null);
  assert.ok(hook({ type: 'pageview', url: 'https://www.spansk123.no/index.html?answer=secret' }));
});

test('does not load on school/staging/local/HTTP/lookalike hosts', () => {
  for (const url of ['https://app.spansk123.no/', 'https://spansk123.vercel.app/', 'https://www.spansk123.no.evil.test/',
    'http://www.spansk123.no/', 'file:///tmp/index.html', 'http://localhost/', 'https://www.spansk123.no/school',
    'https://www.spansk123.no/auth/callback', 'https://www.spansk123.no/api/session']) {
    assert.equal(run({ url }).scripts.length, 0, url);
  }
  assert.equal(run({ url: 'https://spansk123.no/index.html' }).scripts.length, 1);
});

test('respects privacy signals, offline, unavailable storage and existing identity attribution', () => {
  for (const navigator of [{ globalPrivacyControl: true }, { doNotTrack: '1' }, { onLine: false }]) {
    assert.equal(run({ navigator }).scripts.length, 0);
  }
  assert.equal(run({ stored: '{"userId":"private"}' }).scripts.length, 0);
  assert.equal(run({ storageThrows: true }).scripts.length, 0);
});

test('does not expose sensitive referrer paths, parameters, fragments or credentials', () => {
  for (const referrer of ['https://school.test/student/name', 'https://facebook.com/?token=private',
    'https://facebook.com/#private', 'https://private:secret@facebook.com/', 'not a URL', 'file:///private']) {
    assert.equal(run({ referrer }).scripts.length, 0, referrer);
  }
  for (const referrer of ['', 'https://www.facebook.com/', 'https://m.facebook.com/', 'https://l.facebook.com/', 'https://example.org/']) {
    assert.equal(run({ referrer }).scripts.length, 1, referrer);
  }
});

test('opt-in build adds early network policy and changes only the output cache identity', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'spansk-analytics-build-'));
  const html = '<!doctype html><html><head><meta name="app-build" content="original"></head><body>Øving</body></html>';
  const worker = "const APP_BUILD = 'original';";
  const put = async (file, content) => {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), content);
  };
  try {
    await Promise.all([
      put('index.html', html), put('sw.js', worker), put('dist/tailwind.css', ''), put('manifest.webmanifest', '{}'),
      put('undervisning/index.html', ''), put('audio/test.mp3', ''), put('server/public/school.js', ''), put('server/public/school.css', ''),
      put('server/content-media/test.mp3', ''), put('src/visitor-analytics.js', source),
      put('src/visitor-analytics-privacy.html', '<h1>Personvern</h1>'),
    ]);
    const output = path.join(root, 'public');
    await buildVercelPublic({ rootDir: root, visitorAnalytics: true });
    const result = await readFile(path.join(output, 'index.html'), 'utf8');
    assert.match(result, /<head>\n    <meta name="referrer" content="no-referrer">/);
    assert.match(result, /src="\/visitor-analytics.js" referrerpolicy="no-referrer"/);
    assert.match(result, /href="\/besoksstatistikk.html"/);
    const id = result.match(/name="app-build" content="([^"]*)"/)[1];
    assert.notEqual(id, 'original');
    assert.equal(await readFile(path.join(output, 'sw.js'), 'utf8'), `const APP_BUILD = '${id}';`);
    assert.equal(await readFile(path.join(root, 'index.html'), 'utf8'), html);
    assert.equal(await readFile(path.join(root, 'sw.js'), 'utf8'), worker);
    await buildVercelPublic({ rootDir: root, visitorAnalytics: true });
    assert.equal(await readFile(path.join(output, 'index.html'), 'utf8'), result, 'repeated builds must be stable');
    await buildVercelPublic({ rootDir: root });
    assert.equal(await readFile(path.join(output, 'index.html'), 'utf8'), html);
    await assert.rejects(readFile(path.join(output, 'visitor-analytics.js')), { code: 'ENOENT' });
    await assert.rejects(readFile(path.join(output, 'besoksstatistikk.html')), { code: 'ENOENT' });
  } finally { await rm(root, { recursive: true, force: true }); }
});
