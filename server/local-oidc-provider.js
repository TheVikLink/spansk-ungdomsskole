import express from 'express';
import { Provider } from 'oidc-provider';

const TEST_ACCOUNTS = Object.freeze({
  'demo-admin': 'Syntetisk skoleadministrator',
  'demo-admin-low': 'Syntetisk administrator med lavt autentiseringsnivå',
  'demo-teacher': 'Syntetisk lærer',
  'demo-teacher-b': 'Syntetisk medlærer',
  'demo-student-a': 'Syntetisk elev A',
  'demo-student-b': 'Syntetisk elev B',
});

export function createLocalOidcProvider({ issuer, publicOrigin = process.env.PUBLIC_ORIGIN || 'http://127.0.0.1:3000', clientId, clientSecret, cookieSecret }) {
  const issuerUrl = new URL(issuer);
  if (issuerUrl.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(issuerUrl.hostname)) {
    throw new Error('The local identity provider must be bound to HTTP loopback');
  }
  if (!clientSecret || !cookieSecret || clientSecret.length < 32 || cookieSecret.length < 32) {
    throw new Error('Local provider secrets must be generated before startup');
  }
  const provider = new Provider(issuer, {
    clients: [{
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: [`${publicOrigin}/auth/callback`],
      post_logout_redirect_uris: [`${publicOrigin}/auth/logout/callback`],
      response_types: ['code'],
      grant_types: ['authorization_code'],
      token_endpoint_auth_method: 'client_secret_basic',
    }],
    cookies: { keys: [cookieSecret] },
    scopes: ['openid', 'userinfo-name'],
    claims: { openid: ['sub', 'acr'], 'userinfo-name': ['name'] },
    pkce: { required: () => true, methods: ['S256'] },
    features: { devInteractions: { enabled: false }, rpInitiatedLogout: { enabled: true } },
    interactions: { url: (_ctx, interaction) => `/interaction/${encodeURIComponent(interaction.uid)}` },
    findAccount: async (_ctx, accountId) => {
      if (!(accountId in TEST_ACCOUNTS)) return undefined;
      return { accountId, async claims() { return { sub: accountId, name: TEST_ACCOUNTS[accountId] }; } };
    },
  });
  provider.on('server_error', (_ctx, error) => console.error('Local OIDC provider protocol error:', error.message));

  const app = express();
  app.disable('x-powered-by');
  app.get('/interaction/:uid', async (req, res, next) => {
    try {
      const details = await provider.interactionDetails(req, res);
      const accountButtons = Object.entries(TEST_ACCOUNTS).map(([id, name]) => `<button name="account" value="${id}">${name}</button>`).join(' ');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
      if (details.prompt.name === 'login') {
        return res.type('html').send(`<!doctype html><html lang="nb"><meta charset="utf-8"><title>Lokal testidentitet</title><h1>Kun lokal OIDC-test</h1><p>Velg en syntetisk testkonto:</p><form method="post" action="/interaction/${encodeURIComponent(req.params.uid)}/login">${accountButtons}</form></html>`);
      }
      if (details.prompt.name === 'consent') {
        const grant = details.grantId
          ? await provider.Grant.find(details.grantId)
          : new provider.Grant({ accountId: details.session.accountId, clientId: details.params.client_id });
        if (details.prompt.details.missingOIDCScope) grant.addOIDCScope(details.prompt.details.missingOIDCScope.join(' '));
        if (details.prompt.details.missingOIDCClaims) grant.addOIDCClaims(details.prompt.details.missingOIDCClaims);
        const grantId = await grant.save();
        await provider.interactionFinished(req, res, { consent: { grantId } }, { mergeWithLastSubmission: true });
        return;
      }
      return res.status(400).type('text').send('Unsupported local test interaction');
    } catch (error) { return next(error); }
  });
  app.post('/interaction/:uid/login', express.urlencoded({ extended: false, limit: '2kb' }), async (req, res, next) => {
    try {
      if (req.get('origin') !== issuer) return res.sendStatus(403);
      const account = req.body.account;
      if (!(account in TEST_ACCOUNTS)) return res.sendStatus(400);
      const details = await provider.interactionDetails(req, res);
      const requestedAcr = details.params.acr_values?.split(/\s+/u).find(Boolean);
      const acr = requestedAcr || (account === 'demo-admin' ? 'urn:mace:feide.no:auth:level:fad08:3' : 'urn:feide:level:low');
      const result = { login: { accountId: account, acr, remember: false, ts: Math.floor(Date.now() / 1000) } };
      await provider.interactionFinished(req, res, result);
      return;
    } catch (error) { return next(error); }
  });
  app.use(provider.callback());
  return { app, provider, accounts: TEST_ACCOUNTS };
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  if (process.env.NODE_ENV === 'production' || process.env.LOCAL_OIDC_TEST_ENABLED !== 'true') throw new Error('Local identity provider is disabled outside explicit local test mode');
  const port = Number(process.env.OIDC_PORT || 3001);
  const issuer = process.env.OIDC_ISSUER || `http://127.0.0.1:${port}`;
  const local = createLocalOidcProvider({ issuer, clientId: process.env.OIDC_CLIENT_ID, clientSecret: process.env.OIDC_CLIENT_SECRET, cookieSecret: process.env.SESSION_SECRET });
  local.app.listen(port, '127.0.0.1', () => console.log(`Local synthetic OIDC provider listening at ${issuer}`));
}
