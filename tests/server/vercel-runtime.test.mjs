import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('Vercel config uses root Express discovery and sets the static output and function region', async () => {
  const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));
  assert.equal(config.framework, 'express');
  assert.deepEqual(config.regions, ['arn1']);
  assert.equal(config.functions, undefined, 'root Express discovery must not be overridden by legacy api/ function matching');
  assert.match(await readFile(new URL('../../index.js', import.meta.url), 'utf8'), /from\s*['"]express['"]/u);
});

async function withServer(app, run) {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
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
    assert.equal(home.status, 302);
    assert.equal(home.headers.get('location'), '/index.html');
    assert.equal(home.headers.get('cache-control'), 'public, max-age=0, must-revalidate');
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
      put('dist/tailwind.css', 'body {}'), put('audio/listening/test.wav', 'audio'),
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
      'googleda8e06f12dba466d.html', 'index.html', 'manifest.webmanifest', 'school.css', 'school.js', 'sw.js',
    ]);
    assert.equal(await readFile(path.join(output, 'index.html'), 'utf8'), '<h1>Local app</h1>');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
