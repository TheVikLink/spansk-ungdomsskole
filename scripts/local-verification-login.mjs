import assert from 'node:assert/strict';

// Exercise the same form_post flow as a browser, using only the local test issuer.
export async function signInLocalBrowser(browser, origin, issuer, accountId) {
  let response = await browser.request('/auth/login');
  assert.equal(response.status, 303);
  let next = new URL(response.headers.get('location'));
  for (let step = 0; step < 12; step += 1) {
    assert.equal(next.origin, issuer);
    response = await browser.request(next);
    if (response.status >= 300 && response.status < 400) {
      next = new URL(response.headers.get('location'), next);
      continue;
    }
    assert.equal(response.status, 200);
    const html = await response.text();
    const form = html.match(/<form\b[^>]*\baction="([^"]+)"[^>]*>([\s\S]*?)<\/form>/iu);
    assert.ok(form, 'Expected a local OIDC form');
    const target = new URL(form[1], issuer);
    const headers = { origin: issuer, 'content-type': 'application/x-www-form-urlencoded' };
    if (target.href === new URL('/auth/callback', origin).href) {
      const fields = new URLSearchParams();
      for (const [, name, value] of form[2].matchAll(/<input\s+type="hidden"\s+name="([^"]+)"\s+value="([^"]*)"\s*\/>/giu)) fields.append(name, value);
      assert.ok(fields.has('code') && fields.has('state'), 'Expected local authorization response fields');
      const result = await browser.request(target, { method: 'POST', headers, body: fields.toString() });
      assert.equal(result.status, 303);
      assert.equal(new URL(result.headers.get('location'), origin).href, new URL('/school', origin).href);
      return;
    }
    assert.equal(target.origin, issuer);
    const login = await browser.request(target, { method: 'POST', headers, body: new URLSearchParams({ account: accountId }) });
    assert.ok(login.status >= 300 && login.status < 400, 'Synthetic OIDC account selection failed');
    next = new URL(login.headers.get('location'), issuer);
  }
  throw new Error('Local OIDC redirect limit reached');
}
