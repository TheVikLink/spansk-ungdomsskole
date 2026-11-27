import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer } from 'node:http';
import { copyFile, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';

test('Vercel config uses root Express discovery and sets the static output and function region', async () => {
  const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));
  assert.equal(config.framework, 'express');
  assert.deepEqual(config.regions, ['arn1']);
  assert.equal(config.functions, undefined, 'root Express discovery must not be overridden by legacy api/ function matching');
  assert.match(await readFile(new URL('../../index.js', import.meta.url), 'utf8'), /from\s*['"]express['"]/u);

  const cacheHeadersBySource = new Map(
    (config.headers || []).map((entry) => [
      entry.source,
      entry.headers?.find((header) => header.key === 'Cache-Control')?.value,
    ]),
  );
  for (const source of [
    '/undervisning',
    '/undervisning/',
    '/undervisning/index.html',
    '/undervisning/pakke.js',
    '/undervisning/time.css',
    '/undervisning/writing.js',
    '/undervisning/teacher.js',
    '/undervisning/analytics.js',
  ]) {
    assert.equal(
      cacheHeadersBySource.get(source),
      'public, max-age=0, must-revalidate',
      `expected must-revalidate Cache-Control header for ${source}`,
    );
  }
});

test('.vercelignore excludes stray PDFs while keeping undervisning partnerkort and arbeidsark PDFs', async () => {
  const lines = (await readFile(new URL('../../.vercelignore', import.meta.url), 'utf8'))
    .split(/\r?\n/u)
    .map((line) => line.trim());
  const pdfRuleIndex = lines.indexOf('*.pdf');
  const partnerkortIndex = lines.indexOf('!undervisning/*/partnerkort.pdf');
  const partnerkortAIndex = lines.indexOf('!undervisning/*/partnerkort-a.pdf');
  const partnerkortBIndex = lines.indexOf('!undervisning/*/partnerkort-b.pdf');
  const arbeidsarkIndex = lines.indexOf('!undervisning/*/arbeidsark.pdf');

  assert.notEqual(pdfRuleIndex, -1, 'expected .vercelignore to exclude *.pdf');
  assert.ok(partnerkortIndex > pdfRuleIndex, 'expected !undervisning/*/partnerkort.pdf after *.pdf');
  assert.ok(partnerkortAIndex > pdfRuleIndex, 'expected !undervisning/*/partnerkort-a.pdf after *.pdf');
  assert.ok(partnerkortBIndex > pdfRuleIndex, 'expected !undervisning/*/partnerkort-b.pdf after *.pdf');
  assert.ok(arbeidsarkIndex > pdfRuleIndex, 'expected !undervisning/*/arbeidsark.pdf after *.pdf');
});

async function withServer(app, run) {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    const closing = new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    server.closeAllConnections?.();
    await closing;
  }
}

test('Vercel Express adapter lazily initializes the runtime once and reuses it for warm requests', async () => {
  const { createLazyFunctionApp } = await import('../../server/vercel-app.js');
  let initializeCount = 0;
  const runtime = express();
  runtime.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
  const app = createLazyFunctionApp(async () => {
    initializeCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return { app: runtime };
  });

  await withServer(app, async (origin) => {
    const home = await fetch(origin, { redirect: 'manual' });
    assert.equal(home.status, 200);
    assert.equal(home.headers.get('cache-control'), 'public, max-age=0, must-revalidate');
    assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(home.headers.get('referrer-policy'), 'same-origin');
    assert.match(home.headers.get('content-security-policy') || '', /default-src 'none'/u);
    assert.match(home.headers.get('content-type') || '', /^text\/html/u);
    assert.match(await home.text(), /Spansk på 1-2-3/u);
    assert.equal(initializeCount, 0, 'the no-login homepage must not require the school database');
    const responses = await Promise.all([fetch(`${origin}/healthz`), fetch(`${origin}/healthz`), fetch(`${origin}/healthz`)]);
    assert.deepEqual(responses.map((response) => response.status), [200, 200, 200]);
    assert.deepEqual(await Promise.all(responses.map((response) => response.json())), [
      { status: 'ok' }, { status: 'ok' }, { status: 'ok' },
    ]);
    assert.equal(initializeCount, 1);
  });
});

test('Vercel Express adapter logs a safe startup code, returns no-store 503 and retries', async (t) => {
  const { createLazyFunctionApp } = await import('../../server/vercel-app.js');
  const log = t.mock.method(console, 'error', () => {});
  let initializeCount = 0;
  const runtime = express();
  runtime.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
  const app = createLazyFunctionApp(async () => {
    initializeCount += 1;
    if (initializeCount === 1) throw new Error('postgres://private-secret');
    return { app: runtime };
  });

  await withServer(app, async (origin) => {
    const failed = await fetch(`${origin}/healthz`);
    assert.equal(failed.status, 503);
    assert.equal(failed.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await failed.json(), { error: 'Tjenesten er midlertidig utilgjengelig' });
    assert.deepEqual(log.mock.calls.map((call) => call.arguments), [['School runtime initialization failed: RUNTIME_INIT_FAILED']]);
    const recovered = await fetch(`${origin}/healthz`);
    assert.equal(recovered.status, 200);
    assert.equal(initializeCount, 2);
    assert.equal(log.mock.callCount(), 1);
  });
});

test('startup diagnostics classify actual config failures and never expose arbitrary error content', async () => {
  const { startupFailureCode } = await import('../../server/startup-diagnostics.js');
  const { loadConfig } = await import('../../server/config.js');
  let missingIssuer;
  try { loadConfig({}); } catch (error) { missingIssuer = error; }
  assert.equal(startupFailureCode(missingIssuer), 'CONFIG_MISSING_OIDC_ISSUER');
  assert.equal(startupFailureCode(new Error('SESSION_SECRET must be at least 32 characters')), 'CONFIG_SESSION_SECRET_INVALID');
  assert.equal(startupFailureCode(Object.assign(new Error('postgres://user:private-secret@host'), { code: '28P01', detail: 'private-secret' })), 'DATABASE_AUTH_FAILED');
  assert.equal(startupFailureCode(Object.assign(new Error('private-secret'), { code: 'SELF_SIGNED_CERT_IN_CHAIN' })), 'DATABASE_TLS_UNTRUSTED');
  assert.equal(startupFailureCode(Object.assign(new Error('private-secret'), { code: 'ERR_INVALID_URL', input: 'private-secret' })), 'CONFIG_URL_INVALID');
  for (const error of [null, 'private-secret', new Error('Missing required configuration: private-secret'), { code: 'private-secret', stack: 'private-secret' }, new Error('postgres://private-secret')]) {
    assert.equal(startupFailureCode(error), 'RUNTIME_INIT_FAILED');
  }
});

test('database startup diagnostics identify the failing pool without exposing driver details', async () => {
  const { DatabaseStartupError, startupFailureCode } = await import('../../server/startup-diagnostics.js');
  const cause = Object.assign(new Error('postgres://runtime:private-secret@host'), { code: '28P01', detail: 'private-secret' });
  for (const target of ['APP', 'JOURNAL']) {
    assert.equal(startupFailureCode(new DatabaseStartupError(target, cause)), `${target}_DATABASE_AUTH_FAILED`);
    assert.equal(startupFailureCode(new DatabaseStartupError(target, new Error('private-secret'))), `${target}_RUNTIME_INIT_FAILED`);
  }
  assert.equal(startupFailureCode(new DatabaseStartupError('private-secret', cause)), 'RUNTIME_INIT_FAILED');
});

test('Vercel public build stages only the explicit public assets and keeps private school HTML out of the CDN directory', async () => {
  const { buildVercelPublic } = await import('../../scripts/build-vercel-public.mjs');
  const root = await mkdtemp(path.join(os.tmpdir(), 'spansk-vercel-build-'));
  const output = path.join(root, 'public-output');
  const put = async (relative, text = relative) => {
    const target = path.join(root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, text);
  };
  try {
    await Promise.all([
      put('index.html', '<h1>Local app</h1>'), put('manifest.webmanifest', '{}'), put('sw.js', 'self.test = true;'),
      put('undervisning/index.html', 'Katalog'), put('dist/tailwind.css', 'body {}'), put('audio/listening/test.wav', 'audio'),
      put('audio/.DS_Store', 'desktop metadata'),
      put('server/public/school.js', 'school client'), put('server/public/school.css', 'school styles'),
      put('server/public/school.html', 'private no-store shell'), put('server/content-media/abc.wav', 'immutable content audio'),
      put('server/content-catalog.json', '{"private":"do not publish"}'), put('README.md', 'internal'),
      put('Certificate of incorporation .pdf', 'private business document'), put('.env', 'secret'),
      put('googleda8e06f12dba466d.html', 'verification'),
    ]);

    await buildVercelPublic({ rootDir: root, outputDir: output });
    const files = async (dir, prefix = '') => {
      const nested = await Promise.all((await readdir(dir, { withFileTypes: true })).map((entry) =>
        entry.isDirectory() ? files(path.join(dir, entry.name), `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`]));
      return nested.flat();
    };
    const staged = (await files(output)).sort();
    assert.deepEqual(staged, [
      'audio/listening/test.wav', 'audio/school-content/abc.wav', 'dist/tailwind.css',
      'googleda8e06f12dba466d.html', 'index.html', 'manifest.webmanifest', 'school.css', 'school.js', 'sw.js', 'undervisning/index.html',
    ]);
    assert.equal(await readFile(path.join(output, 'index.html'), 'utf8'), '<h1>Local app</h1>');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('build-culture-preview skips docs/kultur previews on Vercel when docs/ is excluded, while --check still enforces docs/', async () => {
  const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
  const scriptPath = path.join(repoRoot, 'scripts/build-culture-preview.mjs');
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'spansk-vercel-culture-'));
  try {
    await Promise.all([
      symlink(path.join(repoRoot, 'data'), path.join(tempDir, 'data')),
      symlink(path.join(repoRoot, 'images'), path.join(tempDir, 'images')),
      copyFile(path.join(repoRoot, 'index.html'), path.join(tempDir, 'index.html')),
    ]);

    const vercelBuild = spawnSync(process.execPath, [scriptPath], {
      cwd: tempDir,
      env: { ...process.env, VERCEL: '1' },
      encoding: 'utf8',
    });
    assert.equal(vercelBuild.status, 0, vercelBuild.stderr);
    assert.match(vercelBuild.stdout, /docs\/kultur previews skipped/u);
    const entries = await readdir(tempDir);
    assert.equal(entries.includes('docs'), false, 'docs/ must not be created when skipped on Vercel');

    const checkRun = spawnSync(process.execPath, [scriptPath, '--check'], {
      cwd: tempDir,
      env: { ...process.env, VERCEL: '1' },
      encoding: 'utf8',
    });
    assert.notEqual(checkRun.status, 0, '--check must fail when docs/kultur/ is missing');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('Vercel Express adapter serves allowlisted public student assets without loading the school database and keeps private files isolated', async () => {
  const { createLazyFunctionApp } = await import('../../server/vercel-app.js');
  let initializeCount = 0;
  const runtime = express();
  runtime.use((_req, res) => res.status(404).json({ error: 'Not found in school runtime' }));
  const app = createLazyFunctionApp(async () => {
    initializeCount += 1;
    return { app: runtime };
  });

  await withServer(app, async (origin) => {
    const publicAssets = [
      ['/', 'public, max-age=0, must-revalidate'],
      ['/index.html', 'public, max-age=0, must-revalidate'],
      ['/dist/tailwind.css', 'public, max-age=0, must-revalidate'],
      ['/sw.js', 'public, max-age=0, must-revalidate'],
      ['/manifest.webmanifest', 'public, max-age=0, must-revalidate'],
      ['/school.js', 'public, max-age=0, must-revalidate'],
      ['/school.css', 'public, max-age=0, must-revalidate'],
      ['/besoksstatistikk.html', 'public, max-age=0, must-revalidate'],
      ['/favicon.ico', 'public, max-age=86400'],
      ['/audio/uttale/refold-v1/ESPhoneticWritingSystem_1_word.mp3', 'public, max-age=86400, immutable'],
    ];

    for (const [assetPath, expectedCacheControl] of publicAssets) {
      const response = await fetch(`${origin}${assetPath}`, { redirect: 'manual' });
      assert.equal(response.status, 200, `expected 200 for ${assetPath}`);
      assert.equal(response.headers.get('cache-control'), expectedCacheControl, `expected Cache-Control for ${assetPath}`);
      await response.arrayBuffer();
    }
    assert.equal(initializeCount, 0, 'serving allowlisted public assets must not initialize the school runtime');

    const missingAudio = await fetch(`${origin}/audio/does-not-exist.mp3`);
    assert.equal(missingAudio.status, 404);
    await missingAudio.arrayBuffer();
    assert.equal(initializeCount, 0, 'missing audio must return 404 without initializing the school runtime');

    const cultureRedirect = await fetch(`${origin}/docs/kultur/jul-spania-chile/index.html`, { redirect: 'manual' });
    assert.equal(cultureRedirect.status, 302);
    assert.equal(cultureRedirect.headers.get('location'), '/undervisning/jul-spania-chile/elev.html');
    assert.equal(initializeCount, 0, 'redirecting docs/kultur links must not initialize the school runtime');

    for (const privatePath of ['/server/public/school.html', '/server/content-catalog.json']) {
      const response = await fetch(`${origin}${privatePath}`);
      assert.equal(response.status, 404, `expected private path ${privatePath} to fall through to runtime 404`);
      assert.deepEqual(await response.json(), { error: 'Not found in school runtime' });
    }
    assert.equal(initializeCount, 1);
  });
});

test('service worker never fulfills navigate requests with a cached redirected response', async () => {
  const swSource = await readFile(new URL('../../sw.js', import.meta.url), 'utf8');
  assert.match(
    swSource,
    /if\s*\(\s*cached\s*&&\s*!\(\s*request\.mode\s*===\s*['"]navigate['"]\s*&&\s*cached\.redirected\s*\)\s*\)\s*return\s+cached;/u,
    'expected sw.js to guard against returning cached redirected responses on navigate requests',
  );
});

test('Vercel Express adapter serves Norwegian Feide school info page on GET /school when school runtime config is missing', async (t) => {
  const { createLazyFunctionApp } = await import('../../server/vercel-app.js');
  const { loadConfig } = await import('../../server/config.js');
  const log = t.mock.method(console, 'error', () => {});
  const app = createLazyFunctionApp(async () => {
    loadConfig({});
  });

  await withServer(app, async (origin) => {
    for (const targetPath of [
      '/school',
      '/school/',
      '/school?activity=vocabulary.tall.v1&title=%3Cscript%3Ealert(1)%3C%2Fscript%3E',
    ]) {
      const response = await fetch(`${origin}${targetPath}`);
      assert.equal(response.status, 200, `expected 200 HTML info page on ${targetPath}`);
      assert.match(response.headers.get('content-type') || '', /^text\/html/u);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(response.headers.get('referrer-policy'), 'same-origin');
      assert.equal(response.headers.get('x-frame-options'), 'DENY');
      assert.match(response.headers.get('content-security-policy') || '', /style-src 'self'; img-src 'self' data:/u);
      const html = await response.text();
      assert.match(html, /Skolepakke med Feide/u);
      assert.match(html, /rel="icon"/u);
      assert.match(html, /mailto:ole@spansk123\.no/u);
      assert.equal(html.includes('\u00b7'), false, 'school info HTML must not contain middle dot U+00B7');
      assert.equal(html.includes('<script>'), false, 'query parameters must never be reflected into HTML');
    }

    const health = await fetch(`${origin}/healthz`);
    assert.equal(health.status, 503);
    assert.deepEqual(await health.json(), { error: 'Tjenesten er midlertidig utilgjengelig' });
    assert.equal(log.mock.calls[0]?.arguments?.[0], 'School runtime initialization failed: CONFIG_MISSING_OIDC_ISSUER');

    // Allowlisted lesson context on /school shows safe Norwegian banner without reflecting untrusted input
    const lessonInfoRes = await fetch(`${origin}/school?activity=vocabulary.tall.v1&title=Hvor%20mange%20billetter%3F`);
    assert.equal(lessonInfoRes.status, 200);
    const lessonInfoHtml = await lessonInfoRes.text();
    assert.match(lessonInfoHtml, /Du valgte «Hvor mange billetter\?» som digital Feide-lekse\./u);
    assert.match(lessonInfoHtml, /eks\. mva\./u);

    // Friendly redirects for common short paths
    for (const [shortPath, target] of [
      ['/skole', '/school'],
      ['/school.html', '/school'],
      ['/besoksstatistikk', '/besoksstatistikk.html'],
      ['/personvern', '/privacy'],
      ['/personvern.html', '/privacy'],
    ]) {
      const redirectRes = await fetch(`${origin}${shortPath}`, { redirect: 'manual' });
      assert.equal(redirectRes.status, 301, `expected 301 for ${shortPath}`);
      assert.equal(redirectRes.headers.get('location'), target);
    }

    // Unknown top-level paths return 404 (not 503) when school runtime config is missing
    const unknownHtmlRes = await fetch(`${origin}/finnes-ikke`, { headers: { Accept: 'text/html' } });
    assert.equal(unknownHtmlRes.status, 404);
    assert.match(unknownHtmlRes.headers.get('content-type') || '', /^text\/html/u);
    assert.match(await unknownHtmlRes.text(), /Fant ikke siden/u);
  });
});

test('Vercel Express adapter keeps 503 on GET /school for non-config runtime failures and serves real runtime when configured', async (t) => {
  const { createLazyFunctionApp } = await import('../../server/vercel-app.js');
  t.mock.method(console, 'error', () => {});

  const failingApp = createLazyFunctionApp(async () => {
    throw new Error('postgres://private-secret');
  });
  await withServer(failingApp, async (origin) => {
    const response = await fetch(`${origin}/school`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'Tjenesten er midlertidig utilgjengelig' });
  });

  const runtime = express();
  runtime.get('/school', (_req, res) => res.status(200).type('html').send('<h1>Ekstern Feide-innlogging</h1>'));
  const configuredApp = createLazyFunctionApp(async () => ({ app: runtime }));
  await withServer(configuredApp, async (origin) => {
    const response = await fetch(`${origin}/school`);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '<h1>Ekstern Feide-innlogging</h1>');
  });
});

test('Vercel Express adapter supports Markdown content negotiation, agent-friendly 404s, discovery files, and trust anchors without loading the school runtime', async (t) => {
  const { createLazyFunctionApp } = await import('../../server/vercel-app.js');
  const { loadConfig } = await import('../../server/config.js');
  const { prefersMarkdown } = await import('../../server/agent-readiness.js');
  const { FREE_SAMPLE_LESSON_IDS } = await import('../../src/domain/school-license.js');

  assert.equal(prefersMarkdown({ headers: { accept: 'text/markdown' } }), true);
  assert.equal(prefersMarkdown({ headers: { accept: 'text/markdown, text/html;q=0.9' } }), true);
  assert.equal(prefersMarkdown({ headers: { accept: 'text/html, text/markdown;q=0.5' } }), false);
  assert.equal(prefersMarkdown({ headers: { accept: 'text/markdown;q=0' } }), false);
  assert.equal(prefersMarkdown({ headers: { accept: '*/*' } }), false);
  assert.equal(prefersMarkdown({ headers: {} }), false);

  t.mock.method(console, 'error', () => {});
  let initializeCount = 0;
  const app = createLazyFunctionApp(async () => {
    initializeCount += 1;
    loadConfig({});
  });

  await withServer(app, async (origin) => {
    // 1. Homepage Markdown negotiation & Vary: Accept
    for (const target of ['/', '/index.html']) {
      const mdRes = await fetch(`${origin}${target}`, { headers: { Accept: 'text/markdown' } });
      assert.equal(mdRes.status, 200);
      assert.match(mdRes.headers.get('content-type') || '', /^text\/markdown/u);
      assert.match(mdRes.headers.get('vary') || '', /\bAccept\b/i);
      const mdBody = await mdRes.text();
      assert.match(mdBody, /^# Spansk på 1-2-3/u);
      assert.match(mdBody, /\/llms\.txt/u);
      assert.equal(mdBody.includes('\u00b7'), false);

      const htmlRes = await fetch(`${origin}${target}`, { headers: { Accept: 'text/html' } });
      assert.equal(htmlRes.status, 200);
      assert.match(htmlRes.headers.get('content-type') || '', /^text\/html/u);
      assert.match(htmlRes.headers.get('vary') || '', /\bAccept\b/i);
      const htmlBody = await htmlRes.text();
      assert.match(htmlBody, /<link rel="canonical" href="https:\/\/www\.spansk123\.no\/">/u);
      assert.match(htmlBody, /<meta property="og:image" content="https:\/\/www\.spansk123\.no\/og-image\.png">/u);
      assert.match(htmlBody, /<meta property="og:type" content="website">/u);
      const ldMatch = htmlBody.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/u);
      assert.ok(ldMatch, 'expected JSON-LD script block on homepage');
      const ldJson = JSON.parse(ldMatch[1]);
      const org = ldJson['@graph'].find((node) => node['@type'] === 'Organization');
      const softApp = ldJson['@graph'].find((node) => node['@type'] === 'SoftwareApplication');
      assert.ok(org?.contactPoint?.length > 0 && org.contactPoint[0].email === 'ole@spansk123.no');
      assert.equal(org?.address?.['@type'], 'PostalAddress');
      assert.equal(org?.address?.postalCode, '5151');
      assert.equal(softApp?.name, 'Spansk på 1-2-3');
    }

    // 2. Discovery & media endpoints without initializing school runtime
    const llmsRes = await fetch(`${origin}/llms.txt`);
    assert.equal(llmsRes.status, 200);
    const llmsBody = await llmsRes.text();
    assert.match(llmsBody, /## When to use Spansk på 1-2-3/u);
    assert.match(llmsBody, /https:\/\/www\.spansk123\.no/u);
    assert.match(llmsBody, /ole@spansk123\.no/u);
    assert.equal(llmsBody.includes('\u00b7'), false);

    const sitemapRes = await fetch(`${origin}/sitemap.xml`);
    assert.equal(sitemapRes.status, 200);
    assert.match(sitemapRes.headers.get('content-type') || '', /application\/xml/u);
    const sitemapBody = await sitemapRes.text();
    assert.match(sitemapBody, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/u);
    assert.match(sitemapBody, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/u);
    for (const expectedUrl of [
      'https://www.spansk123.no/',
      'https://www.spansk123.no/undervisning/',
      'https://www.spansk123.no/school',
      'https://www.spansk123.no/about',
      'https://www.spansk123.no/contact',
      'https://www.spansk123.no/privacy',
      ...FREE_SAMPLE_LESSON_IDS.map((id) => `https://www.spansk123.no/undervisning/${id}/index.html`),
    ]) {
      assert.ok(sitemapBody.includes(`<loc>${expectedUrl}</loc>`), `expected ${expectedUrl} in sitemap.xml`);
    }

    const robotsRes = await fetch(`${origin}/robots.txt`);
    assert.equal(robotsRes.status, 200);
    const robotsBody = await robotsRes.text();
    assert.match(robotsBody, /Sitemap: https:\/\/www\.spansk123\.no\/sitemap\.xml/u);
    assert.match(robotsBody, /Disallow: \/api\//u);

    const ogRes = await fetch(`${origin}/og-image.png`);
    assert.equal(ogRes.status, 200);
    assert.match(ogRes.headers.get('content-type') || '', /^image\/png/u);
    const ogBuf = Buffer.from(await ogRes.arrayBuffer());
    assert.deepEqual([...ogBuf.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47]);

    // 3. Trust anchor pages (/about, /contact, /privacy)
    for (const trustPath of ['/about', '/contact', '/privacy']) {
      const htmlRes = await fetch(`${origin}${trustPath}`, { headers: { Accept: 'text/html' } });
      assert.equal(htmlRes.status, 200, `expected 200 for ${trustPath}`);
      assert.match(htmlRes.headers.get('content-type') || '', /^text\/html/u);
      assert.match(htmlRes.headers.get('vary') || '', /\bAccept\b/i);
      const html = await htmlRes.text();
      assert.equal(html.includes('\u00b7'), false);
      const stripped = html.replace(/<[^>]+>/gu, ' ').replace(/\s+/gu, ' ').trim();
      assert.ok(stripped.length >= 500, `expected >= 500 chars on ${trustPath}, got ${stripped.length}`);

      const mdRes = await fetch(`${origin}${trustPath}`, { headers: { Accept: 'text/markdown' } });
      assert.equal(mdRes.status, 200);
      assert.match(mdRes.headers.get('content-type') || '', /^text\/markdown/u);
      assert.ok((await mdRes.text()).length >= 500);
    }

    assert.equal(initializeCount, 0, 'public discovery and trust-anchor routes must not initialize school runtime');

    // 4. Agent-friendly 404s across Markdown, HTML, and JSON
    const md404 = await fetch(`${origin}/__ora-404-probe-test`, { headers: { Accept: 'text/markdown' } });
    assert.equal(md404.status, 404);
    assert.match(md404.headers.get('content-type') || '', /^text\/markdown/u);
    assert.match(md404.headers.get('vary') || '', /\bAccept\b/i);
    const md404Body = await md404.text();
    assert.ok(md404Body.length >= 20);
    assert.match(md404Body, /\/llms\.txt/u);
    assert.match(md404Body, /\/sitemap\.xml/u);
    assert.equal(md404Body.includes('\u00b7'), false);

    const html404 = await fetch(`${origin}/__ora-404-probe-test`, { headers: { Accept: 'text/html' } });
    assert.equal(html404.status, 404);
    assert.match(html404.headers.get('content-type') || '', /^text\/html/u);
    assert.match(html404.headers.get('vary') || '', /\bAccept\b/i);

    const json404 = await fetch(`${origin}/__ora-404-probe-test`, { headers: { Accept: 'application/json' } });
    assert.equal(json404.status, 404);
    assert.match(json404.headers.get('content-type') || '', /^application\/json/u);
    assert.match(json404.headers.get('vary') || '', /\bAccept\b/i);
  });
});

test('School Express app returns Markdown 404 for non-API routes when Accept: text/markdown is sent', async () => {
  const { createSchoolApp } = await import('../../server/app.js');
  const { loadConfig } = await import('../../server/config.js');
  const config = loadConfig({
    NODE_ENV: 'production', DATABASE_SSL: 'true',
    DATABASE_URL: 'postgres://app:synthetic@db.example.test:5432/app',
    SECURITY_JOURNAL_DATABASE_URL: 'postgres://journal:synthetic@journal.example.test:5432/journal',
    PUBLIC_ORIGIN: 'https://app.example.test', OIDC_ISSUER: 'https://auth.dataporten.no',
    OIDC_CLIENT_ID: 'synthetic-client', OIDC_CLIENT_SECRET: 'synthetic-production-client-secret',
    SESSION_SECRET: 'synthetic-production-session-secret-123456',
    FEIDE_ADMIN_REQUIRED_ACR: 'urn:synthetic:strong',
  });
  const pool = { async query() { throw new Error('unexpected query'); }, async connect() { throw new Error('unexpected connect'); } };
  const { app } = createSchoolApp({ config, appPool: pool, journalPool: pool });

  await withServer(app, async (origin) => {
    const md404 = await fetch(`${origin}/__ora-404-probe-test`, {
      headers: { Accept: 'text/markdown', 'x-forwarded-proto': 'https' },
    });
    assert.equal(md404.status, 404);
    assert.match(md404.headers.get('content-type') || '', /^text\/markdown/u);
    assert.match(md404.headers.get('vary') || '', /\bAccept\b/i);
    assert.match(await md404.text(), /\/llms\.txt/u);

    const api404 = await fetch(`${origin}/api/does-not-exist`, {
      headers: { Accept: 'text/markdown', 'x-forwarded-proto': 'https' },
    });
    assert.equal(api404.status, 404);
    assert.match(api404.headers.get('content-type') || '', /^application\/json/u);
  });
});
