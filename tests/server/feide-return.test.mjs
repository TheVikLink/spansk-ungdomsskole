import test from 'node:test';
import assert from 'node:assert/strict';
import relay from '../../deploy/feide-return/api/feide-return.mjs';
import { feideOrigin, returnUrl, schoolOrigin } from '../../deploy/feide-return/return-config.mjs';

function request(body, origin = feideOrigin, url = returnUrl) {
  return new Request(url, {
    method: 'POST',
    headers: { origin, 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
}

test('the Feide relay forwards only a valid form to the fixed school endpoint', async () => {
  const code = 'test"><script>alert(1)</script>&';
  const reply = await relay.fetch(request(new URLSearchParams({ code, state: 'one-use', iss: feideOrigin })));
  assert.equal(reply.status, 200);
  assert.equal(reply.headers.get('set-cookie'), null);
  assert.match(reply.headers.get('cache-control'), /no-store/);
  assert.equal(reply.headers.get('referrer-policy'), 'strict-origin');
  const html = await reply.text();
  assert.ok(html.includes(`method="post" action="${schoolOrigin}/auth/callback"`));
  assert.ok(html.includes('test&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;&amp;'));
  assert.ok(!html.includes(code));
  const nonce = /<script nonce="([^"]+)">/u.exec(html)?.[1];
  assert.ok(nonce);
  assert.ok(reply.headers.get('content-security-policy').includes(`'nonce-${nonce}'`));
});

test('the relay rejects unrelated routes, foreign origins, and invalid forms without reflecting input', async () => {
  const valid = 'code=synthetic&state=test';
  const invalidRequests = [
    [new Request(returnUrl), 405],
    [request(valid, feideOrigin, `${returnUrl}?code=bad`), 404],
    [request(valid, feideOrigin, `${schoolOrigin}/school`), 404],
    [request(valid, 'https://other.example'), 403],
    [request(valid, 'null'), 403],
    [new Request(returnUrl, { method: 'POST', headers: { origin: feideOrigin }, body: valid }), 415],
    [request(`${valid}&state=again`), 400],
    [request(`${valid}&redirect_uri=https://other.example`), 400],
    [request(`${valid}&iss=https://other.example`), 400],
    [request(`${valid}&error=denied`), 400],
    [request('code=synthetic'), 400],
    [request(`code=${'x'.repeat(2048)}&state=test`), 400],
  ];
  for (const [incoming, expected] of invalidRequests) {
    const reply = await relay.fetch(incoming);
    assert.equal(reply.status, expected);
    assert.equal(reply.headers.get('location'), null);
    assert.doesNotMatch(await reply.text(), /synthetic|other\.example|action=/u);
  }
});
