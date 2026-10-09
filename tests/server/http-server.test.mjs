import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { createSchoolHttpServer } from '../../server/http-server.js';
import { createSchoolApp } from '../../server/app.js';
import { loadConfig } from '../../server/config.js';

test('school HTTP server uses bounded parser and request timeouts', async () => {
  const server = createSchoolHttpServer((_req, res) => res.end('ok'));
  assert.equal(server.maxHeaderSize, 16 * 1024);
  assert.equal(server.headersTimeout, 10_000);
  assert.equal(server.requestTimeout, 30_000);
  assert.equal(server.keepAliveTimeout, 5_000);
});

test('Node HTTP parser rejects ambiguous Transfer-Encoding and Content-Length without routing a second request', async () => {
  const received = [];
  const server = createSchoolHttpServer((req, res) => {
    received.push(req.url);
    res.end('ok');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  let response = '';
  try {
    await new Promise((resolve, reject) => {
      const socket = net.createConnection({ host: '127.0.0.1', port });
      socket.setTimeout(3_000, () => { socket.destroy(); resolve(); });
      socket.on('connect', () => socket.write([
        'POST /first HTTP/1.1', 'Host: localhost', 'Content-Length: 4', 'Transfer-Encoding: chunked', 'Connection: close', '',
        '0', '', 'GET /smuggled HTTP/1.1', 'Host: localhost', '', '',
      ].join('\r\n')));
      socket.on('data', (chunk) => { response += chunk.toString('latin1'); });
      socket.on('error', reject);
      socket.on('close', resolve);
    });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
  assert.match(response, /^HTTP\/1\.1 400\b/u);
  assert.deepEqual(received, [], 'malformed framing must not reach the application or parse a pipelined request');
});

test('production redirects only browser GETs to the configured HTTPS origin and rejects HTTP service requests', async () => {
  const config = loadConfig({
    NODE_ENV: 'production', DATABASE_SSL: 'true',
    DATABASE_URL: 'postgres://app:synthetic@db.example.test:5432/app',
    SECURITY_JOURNAL_DATABASE_URL: 'postgres://journal:synthetic@journal.example.test:5432/journal',
    PUBLIC_ORIGIN: 'https://app.example.test', OIDC_ISSUER: 'https://auth.dataporten.no',
    OIDC_CLIENT_ID: 'synthetic-client', OIDC_CLIENT_SECRET: 'synthetic-production-client-secret',
    SESSION_SECRET: 'synthetic-production-session-secret-123456',
    FEIDE_ADMIN_REQUIRED_ACR: 'urn:synthetic:strong',
  });
  const unavailablePool = { async query() { throw new Error('request reached database unexpectedly'); }, async connect() { throw new Error('request reached database unexpectedly'); } };
  const school = createSchoolApp({ config, appPool: unavailablePool, journalPool: unavailablePool });
  const server = createSchoolHttpServer(school.app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const browser = await fetch(`${origin}/school?from=plain-http`, {
      redirect: 'manual', headers: { host: 'attacker.invalid', 'x-forwarded-host': 'attacker.invalid', 'x-forwarded-proto': 'http' },
    });
    assert.equal(browser.status, 308);
    assert.equal(browser.headers.get('location'), 'https://app.example.test/school?from=plain-http');

    const schemeRelative = await fetch(`${origin}/school?next=//attacker.invalid/path`, {
      redirect: 'manual', headers: { host: 'attacker.invalid', 'x-forwarded-host': 'attacker.invalid', 'x-forwarded-proto': 'http' },
    });
    assert.equal(schemeRelative.status, 308);
    assert.equal(schemeRelative.headers.get('location'), 'https://app.example.test/school?next=//attacker.invalid/path');

    const api = await fetch(`${origin}/api/runtime-mode`, {
      redirect: 'manual', headers: { host: 'attacker.invalid', 'x-forwarded-host': 'attacker.invalid', 'x-forwarded-proto': 'http' },
    });
    assert.equal(api.status, 400);
    assert.equal(api.headers.get('location'), null, 'service endpoints must not transparently redirect HTTP requests');

    const mutation = await fetch(`${origin}/api/account/delete`, {
      method: 'POST', redirect: 'manual', headers: {
        host: 'attacker.invalid', 'x-forwarded-host': 'attacker.invalid', 'x-forwarded-proto': 'http',
        'content-type': 'application/json',
      }, body: JSON.stringify({ confirmation: 'SLETT KONTO' }),
    });
    assert.equal(mutation.status, 400);
    assert.equal(mutation.headers.get('location'), null);

    const trace = await new Promise((resolve, reject) => {
      const request = http.request(`${origin}/api/runtime-mode`, {
        method: 'TRACE', headers: { 'x-forwarded-proto': 'https' },
      }, (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => resolve({ status: response.statusCode, body }));
      });
      request.on('error', reject);
      request.end();
    });
    assert.equal(trace.status, 405);
    assert.deepEqual(JSON.parse(trace.body), { error: 'HTTP TRACE er ikke tillatt.' });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('Vercel runtime leaves explicitly staged static assets to the platform CDN', async () => {
  const config = loadConfig({
    NODE_ENV: 'production', DATABASE_SSL: 'true',
    DATABASE_URL: 'postgres://app:synthetic@db.example.test:5432/app',
    SECURITY_JOURNAL_DATABASE_URL: 'postgres://journal:synthetic@journal.example.test:5432/journal',
    PUBLIC_ORIGIN: 'https://app.example.test', OIDC_ISSUER: 'https://auth.dataporten.no',
    OIDC_CLIENT_ID: 'synthetic-client', OIDC_CLIENT_SECRET: 'synthetic-production-client-secret',
    SESSION_SECRET: 'synthetic-production-session-secret-123456',
    FEIDE_ADMIN_REQUIRED_ACR: 'urn:synthetic:strong',
  });
  const unavailablePool = { async query() { throw new Error('request reached database unexpectedly'); }, async connect() { throw new Error('request reached database unexpectedly'); } };
  const school = createSchoolApp({ config, appPool: unavailablePool, journalPool: unavailablePool });
  const server = createSchoolHttpServer(school.app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/school.js`, {
      headers: { 'x-forwarded-proto': 'https' },
    });
    assert.equal(response.status, 404, 'the function must not act as a fallback static server on Vercel');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
