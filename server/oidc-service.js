import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import * as oidc from 'openid-client';
import { decryptIdToken, encryptIdToken } from './session-service.js';

const hash = (value) => createHash('sha256').update(value).digest();
const AUTH_CALLBACK = '/auth/callback';
const LOGOUT_CALLBACK = '/auth/logout/callback';
const OIDC_ENDPOINTS = Object.freeze(['authorization_endpoint', 'token_endpoint', 'jwks_uri', 'userinfo_endpoint', 'end_session_endpoint']);

function validateDiscoveredEndpoints(client, config) {
  const issuer = new URL(config.oidc.issuer);
  const metadata = client.serverMetadata();
  for (const name of OIDC_ENDPOINTS) {
    const value = metadata[name];
    if (value === undefined) continue;
    let endpoint;
    try { endpoint = new URL(value); } catch { throw new Error(`Invalid OIDC metadata endpoint: ${name}`); }
    const secureProtocol = config.mode === 'local-oidc-test' ? endpoint.protocol === 'http:' : endpoint.protocol === 'https:';
    if (!secureProtocol || endpoint.origin !== issuer.origin || endpoint.username || endpoint.password || endpoint.hash) {
      throw new Error('OIDC metadata endpoint must use the configured issuer origin');
    }
  }
  return client;
}

export function createOidcService(pool, config, { random = randomBytes, clockTolerance = 5 } = {}) {
  let configurationPromise;
  const configuration = () => {
    configurationPromise ??= oidc.discovery(
      new URL(config.oidc.issuer),
      config.oidc.clientId,
      config.oidc.clientSecret,
      oidc.ClientSecretBasic(config.oidc.clientSecret),
      {
        [oidc.clockTolerance]: clockTolerance,
        execute: [
          oidc.enableNonRepudiationChecks,
          ...(config.mode === 'local-oidc-test' ? [oidc.allowInsecureRequests] : []),
        ],
      },
    ).then((client) => validateDiscoveredEndpoints(client, config));
    return configurationPromise;
  };

  return {
    async beginLogin({ requestedAcr = null } = {}) {
      const client = await configuration();
      const handle = random(32).toString('base64url');
      const state = oidc.randomState();
      const nonce = oidc.randomNonce();
      const verifier = oidc.randomPKCECodeVerifier();
      const challenge = await oidc.calculatePKCECodeChallenge(verifier);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await pool.query(
        `INSERT INTO oidc_transaction(handle_hash,expected_state,expected_nonce,encrypted_pkce_verifier,kind,expires_at)
         VALUES($1,$2,$3,$4,'login',$5)`,
        [hash(handle), state, nonce, encryptIdToken(verifier, config.sessionSecret, random), expiresAt],
      );
      const url = oidc.buildAuthorizationUrl(client, {
        redirect_uri: `${config.publicOrigin}${AUTH_CALLBACK}`,
        response_type: 'code',
        response_mode: 'form_post',
        scope: 'openid userinfo-name',
        ...(requestedAcr ? { acr_values: requestedAcr } : {}),
        state,
        nonce,
        ...(requestedAcr ? { prompt: 'login' } : {}),
        code_challenge: challenge,
        code_challenge_method: 'S256',
      });
      return { handle, url };
    },

    async finishLogin({ handle, callbackUrl }) {
      if (typeof handle !== 'string' || handle.length > 100) throw new Error('Missing login transaction');
      const claimed = await pool.query(
        `UPDATE oidc_transaction SET consumed_at=now()
         WHERE handle_hash=$1 AND kind='login' AND consumed_at IS NULL AND expires_at>now()
         RETURNING expected_state,expected_nonce,encrypted_pkce_verifier`,
        [hash(handle)],
      );
      if (claimed.rowCount !== 1) throw new Error('Login transaction is missing, expired or already used');
      const transaction = claimed.rows[0];
      const client = await configuration();
      const tokens = await oidc.authorizationCodeGrant(client, new URL(callbackUrl), {
        pkceCodeVerifier: decryptIdToken(transaction.encrypted_pkce_verifier, config.sessionSecret),
        expectedState: transaction.expected_state,
        expectedNonce: transaction.expected_nonce,
      });
      const claims = tokens.claims();
      if (!claims?.sub || typeof claims.sub !== 'string' || claims.iss !== config.oidc.issuer) throw new Error('OIDC identity claims are incomplete');
      const userInfo = await oidc.fetchUserInfo(client, tokens.access_token, claims.sub);
      const displayName = typeof userInfo.name === 'string' ? userInfo.name.trim() : '';
      if (userInfo.sub !== claims.sub || !displayName || displayName.length > 120) throw new Error('Required Feide display-name claim is missing or inconsistent');
      return { issuer: claims.iss, subject: claims.sub, displayName, idToken: tokens.id_token, claims: { acr: claims.acr ?? null } };
    },

    async beginLogout(idToken) {
      if (!idToken) return { url: null, state: null };
      const client = await configuration();
      const metadata = client.serverMetadata();
      if (!metadata.end_session_endpoint) return { url: null, state: null };
      const state = oidc.randomState();
      const logoutUrl = oidc.buildEndSessionUrl(client, {
        id_token_hint: idToken,
        post_logout_redirect_uri: `${config.publicOrigin}${LOGOUT_CALLBACK}`,
        state,
      });
      return { url: logoutUrl, state };
    },

    async logoutStateMatches(expected, supplied) {
      if (typeof expected !== 'string' || typeof supplied !== 'string') return false;
      const a = Buffer.from(expected);
      const b = Buffer.from(supplied);
      return a.length === b.length && timingSafeEqual(a, b);
    },
  };
}
