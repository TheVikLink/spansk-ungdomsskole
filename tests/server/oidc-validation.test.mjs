import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { generateKeyPairSync, sign as cryptoSign } from 'node:crypto';
import { createOidcService } from '../../server/oidc-service.js';

function makePair(kid) {
  const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return { privateKey: pair.privateKey, publicJwk: { ...pair.publicKey.export({ format: 'jwk' }), kid, alg: 'RS256', use: 'sig' } };
}

function jwt(payload, pair, signer = pair) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const body = `${encode({ alg: 'RS256', typ: 'JWT', kid: pair.publicJwk.kid })}.${encode(payload)}`;
  return `${body}.${cryptoSign('RSA-SHA256', Buffer.from(body), signer.privateKey).toString('base64url')}`;
}

function makePool() {
  const transactions = new Map();
  return {
    transactions,
    async query(sql, params) {
      if (sql.includes('INSERT INTO oidc_transaction')) {
        transactions.set(params[0].toString('hex'), { expected_state: params[1], expected_nonce: params[2], encrypted_pkce_verifier: params[3], expires_at: params[4], consumed_at: null });
        return { rowCount: 1, rows: [] };
      }
      if (sql.includes('UPDATE oidc_transaction')) {
        const transaction = transactions.get(params[0].toString('hex'));
        if (!transaction || transaction.consumed_at || new Date(transaction.expires_at) <= new Date()) return { rowCount: 0, rows: [] };
        transaction.consumed_at = new Date();
        return { rowCount: 1, rows: [transaction] };
      }
      throw new Error(`Unexpected OIDC test query: ${sql}`);
    },
  };
}

async function startIssuer() {
  const trusted = makePair('trusted-key-1');
  const untrusted = makePair('untrusted-key');
  let active = trusted;
  let fault = null;
  let expectedNonce = null;
  const endpointOverrides = new Map();
  let redirectPath = null;
  let redirectTargetHit = false;
  let issuer;
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, issuer);
    response.setHeader('content-type', 'application/json');
    if (url.pathname === redirectPath) {
      response.writeHead(302, { location: `${issuer}/redirect-target` }).end();
      return;
    }
    if (url.pathname === '/redirect-target') {
      redirectTargetHit = true;
      response.end(JSON.stringify({ unexpected: true }));
      return;
    }
    if (url.pathname === '/.well-known/openid-configuration') {
      response.end(JSON.stringify({
        issuer, authorization_endpoint: endpointOverrides.get('authorization_endpoint') || `${issuer}/authorize`,
        token_endpoint: endpointOverrides.get('token_endpoint') || `${issuer}/token`,
        jwks_uri: endpointOverrides.get('jwks_uri') || `${issuer}/jwks`,
        userinfo_endpoint: endpointOverrides.get('userinfo_endpoint') || `${issuer}/userinfo`,
        end_session_endpoint: endpointOverrides.get('end_session_endpoint') || `${issuer}/logout`,
        response_types_supported: ['code'], grant_types_supported: ['authorization_code'], subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'], token_endpoint_auth_methods_supported: ['client_secret_basic'],
        scopes_supported: ['openid', 'userinfo-name'], code_challenge_methods_supported: ['S256'],
      }));
      return;
    }
    if (url.pathname === '/jwks') {
      response.end(JSON.stringify({ keys: [active.publicJwk] }));
      return;
    }
    if (url.pathname === '/token') {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const form = new URLSearchParams(Buffer.concat(chunks).toString());
      const now = Math.floor(Date.now() / 1000);
      const claims = {
        iss: issuer, sub: 'synthetic-user-oidc-validation', aud: 'synthetic-client', iat: now, exp: now + 300,
        nonce: expectedNonce || form.get('nonce') || 'unused', acr: 'urn:synthetic:high',
      };
      if (fault === 'issuer') claims.iss = `${issuer}/unexpected`;
      if (fault === 'missing-sub') delete claims.sub;
      if (fault === 'audience') claims.aud = 'another-client';
      if (fault === 'azp') { claims.aud = ['synthetic-client', 'another-client']; claims.azp = 'wrong-client'; }
      if (fault === 'nonce') claims.nonce = 'wrong-nonce';
      if (fault === 'expired') claims.exp = now - 30;
      const signer = fault === 'signature' ? untrusted : active;
      const idToken = jwt(claims, active, signer);
      response.end(JSON.stringify({ access_token: 'synthetic-access-token', token_type: 'Bearer', expires_in: 300, id_token: idToken }));
      return;
    }
    if (url.pathname === '/userinfo') {
      response.end(JSON.stringify({
        ...(fault === 'userinfo-missing-sub' ? {} : { sub: fault === 'userinfo-mismatched-sub' ? 'another-synthetic-subject' : 'synthetic-user-oidc-validation' }),
        ...(fault === 'userinfo-missing-name' ? {} : { name: 'Syntetisk testbruker' }),
      }));
      return;
    }
    response.writeHead(404).end(JSON.stringify({ error: 'not_found' }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  issuer = `http://127.0.0.1:${server.address().port}`;
  return {
    issuer,
    setFault(value) { fault = value; },
    setExpectedNonce(value) { expectedNonce = value; },
    setEndpointOverride(name, value) { endpointOverrides.set(name, value); },
    clearEndpointOverrides() { endpointOverrides.clear(); },
    setRedirectPath(value) { redirectPath = value; },
    get redirectTargetHit() { return redirectTargetHit; },
    rotate() { active = makePair('trusted-key-2'); },
    async close() { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); },
  };
}

async function runLogin(provider, pool) {
  const { issuer } = provider;
  const config = {
    mode: 'local-oidc-test', publicOrigin: 'http://127.0.0.1:39999', sessionSecret: 'synthetic-session-secret-for-oidc-tests-only',
    oidc: { issuer, clientId: 'synthetic-client', clientSecret: 'synthetic-client-secret-for-tests' },
  };
  const service = createOidcService(pool, config);
  const started = await service.beginLogin();
  const authorization = new URL(started.url);
  const row = [...pool.transactions.values()].at(-1);
  provider.setExpectedNonce(row.expected_nonce);
  const callbackUrl = `${config.publicOrigin}/auth/callback?code=synthetic-code&state=${encodeURIComponent(authorization.searchParams.get('state'))}`;
  return service.finishLogin({ handle: started.handle, callbackUrl });
}

test('openid-client rejects invalid issuer, audience, signature, nonce and expiration, and refreshes rotated JWKS keys', async () => {
  const provider = await startIssuer();
  try {
    for (const invalid of ['issuer', 'audience', 'azp', 'signature', 'nonce', 'expired']) {
      const pool = makePool();
      provider.setFault(invalid);
      await assert.rejects(runLogin(provider, pool), undefined, `${invalid} ID-token claim/signature must fail closed`);
    }

    provider.setFault(null);
    const pool = makePool();
    const first = await runLogin(provider, pool);
    assert.equal(first.subject, 'synthetic-user-oidc-validation');
    provider.rotate();
    const second = await runLogin(provider, pool);
    assert.equal(second.subject, 'synthetic-user-oidc-validation');
  } finally { await provider.close(); }
});

test('OIDC login rejects a missing subject, a mismatched UserInfo subject, or a missing display name', async () => {
  const provider = await startIssuer();
  try {
    for (const invalid of ['missing-sub', 'userinfo-missing-sub', 'userinfo-mismatched-sub', 'userinfo-missing-name']) {
      provider.setFault(invalid);
      await assert.rejects(runLogin(provider, makePool()), undefined, `${invalid} must fail closed without linking an identity`);
    }
  } finally { await provider.close(); }
});

test('OIDC server-to-server requests reject redirects instead of following them', async () => {
  const provider = await startIssuer();
  try {
    for (const path of ['/.well-known/openid-configuration', '/jwks', '/token', '/userinfo']) {
      provider.setRedirectPath(path);
      await assert.rejects(runLogin(provider, makePool()), undefined, `${path} must fail closed on redirect`);
      assert.equal(provider.redirectTargetHit, false, `${path} redirect target must never be requested`);
    }
  } finally {
    await provider.close();
  }
});

test('OIDC discovery rejects endpoints outside the configured issuer origin before redirect or fetch', async () => {
  const provider = await startIssuer();
  try {
    for (const endpoint of ['authorization_endpoint', 'token_endpoint', 'jwks_uri', 'userinfo_endpoint', 'end_session_endpoint']) {
      provider.setEndpointOverride(endpoint, `https://attacker.invalid/${endpoint}`);
      await assert.rejects(runLogin(provider, makePool()), /OIDC metadata endpoint must use the configured issuer origin/u, endpoint);
      provider.clearEndpointOverrides();
    }
  } finally { await provider.close(); }
});
