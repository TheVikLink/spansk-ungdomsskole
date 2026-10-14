import assert from 'node:assert/strict';
export class LocalBrowser {
  constructor(origin) { this.origin = origin; this.cookies = new Map(); this.cookieHeaders = new Map(); }

  cookieHeader() { return [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; '); }
  csrf() { return this.cookies.get('spansk_csrf_dev') || ''; }

  async request(url, { method = 'GET', body, headers = {} } = {}) {
    const absolute = new URL(url, this.origin);
    const requestHeaders = { ...headers };
    if (this.cookies.size) requestHeaders.cookie = this.cookieHeader();
    if (body !== undefined && !requestHeaders['content-type']) requestHeaders['content-type'] = 'application/json';
    if (body !== undefined && absolute.origin === this.origin && method !== 'GET' && !requestHeaders.origin) requestHeaders.origin = this.origin;
    const response = await fetch(absolute, { method, headers: requestHeaders, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body), redirect: 'manual', signal: AbortSignal.timeout(5000) });
    for (const line of response.headers.getSetCookie()) {
      const [pair, ...attributes] = line.split(';');
      const separator = pair.indexOf('=');
      if (separator < 0) continue;
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      this.cookieHeaders.set(name, line);
      if (attributes.some((attribute) => /^\s*max-age=0\s*$/iu.test(attribute))) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    return response;
  }

  async json(url, options = {}) {
    const headers = { ...(options.headers || {}), accept: 'application/json' };
    if (options.method && options.method !== 'GET') headers['x-csrf-token'] = decodeURIComponent(this.csrf());
    const response = await this.request(url, { ...options, headers });
    return { status: response.status, body: await response.json() };
  }
}

async function authorizationCallback(browser, issuer, accountId, expectedAcr, level) {
  let response = await browser.request(`${browser.origin}/auth/login${level ? `?level=${level}` : ''}`);
  assert.equal(response.status, 303);
  let next = new URL(response.headers.get('location'));
  assert.equal(next.origin, issuer, 'authorization redirect must target the configured OIDC issuer');
  assert.equal(next.searchParams.get('redirect_uri'), `${browser.origin}/auth/callback`, 'callback target must be fixed to this application origin');
  assert.equal(next.searchParams.get('response_type'), 'code');
  assert.equal(next.searchParams.get('response_mode'), 'form_post', 'Feide callback must keep code and state out of the URL');
  assert.equal(next.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(next.searchParams.get('code_challenge'), 'authorization request must include a PKCE challenge');
  assert.ok(next.searchParams.get('state'), 'authorization request must include state');
  assert.ok(next.searchParams.get('nonce'), 'authorization request must include nonce');
  if (expectedAcr) assert.equal(next.searchParams.get('acr_values'), expectedAcr);
  for (let step = 0; step < 12; step += 1) {
    if (next.origin === browser.origin && next.pathname === '/auth/callback') return { url: next, method: 'GET', body: null, issuer };
    response = await browser.request(next);
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      next = new URL(response.headers.get('location'), next);
      if (next.origin === browser.origin && next.pathname === '/school') return;
      continue;
    }
    const html = await response.text();
    const formAction = html.match(/<form\b[^>]*\baction="([^"]+)"/iu)?.[1];
    if (formAction && new URL(formAction, issuer).origin === browser.origin) {
      const form = html.match(/<form\b[^>]*\baction="([^"]+)"[^>]*>([\s\S]*?)<\/form>/iu);
      const fields = new URLSearchParams();
      for (const [, name, value] of form?.[2].matchAll(/<input\s+type="hidden"\s+name="([^"]+)"\s+value="([^"]*)"\s*\/>/giu) || []) fields.append(name, value);
      return { url: new URL(formAction, issuer), method: 'POST', body: fields.toString(), issuer };
    }
    if (!formAction || new URL(next).origin !== issuer) throw new Error(`Local OIDC interaction did not present a login form (HTTP ${response.status})`);
    const login = await browser.request(new URL(formAction, issuer), {
      method: 'POST', headers: { origin: issuer, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ account: accountId }).toString(),
    });
    if (login.status < 300 || login.status >= 400 || !login.headers.get('location')) throw new Error(`Synthetic OIDC login failed (HTTP ${login.status})`);
    next = new URL(login.headers.get('location'), issuer);
    if (next.origin === browser.origin && next.pathname === '/auth/callback') return { url: next, method: 'GET', body: null, issuer };
  }
  throw new Error('OIDC redirect loop exceeded the local test limit');
}

export async function signIn(browser, issuer, accountId, expectedAcr, level) {
  const callback = await authorizationCallback(browser, issuer, accountId, expectedAcr, level);
  const response = await browser.request(callback.url, { method: callback.method, body: callback.body, headers: callback.method === 'POST' ? { origin: callback.issuer, 'content-type': 'application/x-www-form-urlencoded' } : {} });
  assert.equal(response.status, 303);
  const destination = new URL(response.headers.get('location'), browser.origin);
  assert.equal(destination.pathname, '/school');
  assert.equal(destination.search, '', 'successful callback redirects to a clean URL without OIDC parameters');
  assert.match(response.headers.get('cache-control') || '', /no-store/u, 'OIDC callback response must not be cached');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer', 'callback URL must not be sent as a referrer');
}

