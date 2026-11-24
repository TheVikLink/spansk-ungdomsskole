import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimit } from '../../server/rate-limit.js';

function invoke(limiter, { ip = '192.0.2.1', path = '/api/classes/one', route = { path: '/api/classes/:classId' }, baseUrl = '' } = {}) {
  let response;
  let continued = false;
  const res = {
    status(code) { response = { status: code }; return this; },
    json(body) { response = { ...response, body }; return this; },
  };
  limiter({ ip, path, route, baseUrl }, res, () => { continued = true; });
  return { response, continued };
}

test('rate limit keys bind identifiers to the registered route pattern', () => {
  const limiter = createRateLimit({ limit: 2, windowMs: 60_000, now: () => 1_000 });
  assert.equal(invoke(limiter, { path: '/api/classes/one' }).continued, true);
  assert.equal(invoke(limiter, { path: '/api/classes/two' }).continued, true);
  const rejected = invoke(limiter, { path: '/api/classes/three' });
  assert.equal(rejected.continued, false);
  assert.deepEqual(rejected.response, { status: 429, body: { error: 'For mange forsøk. Vent litt og prøv igjen.' } });
});

test('IP-wide rate limit shares one bucket across unrelated routes', () => {
  const limiter = createRateLimit({ limit: 1, windowMs: 60_000, scope: 'ip', now: () => 1_000 });
  assert.equal(invoke(limiter, { route: { path: '/api/classes' } }).continued, true);
  assert.equal(invoke(limiter, { route: { path: '/api/assignments' } }).continued, false);
  assert.equal(invoke(limiter, { ip: '192.0.2.2', route: { path: '/api/assignments' } }).continued, true);
});

test('rate-limit buckets expire and new sources cannot grow memory past the configured cap', () => {
  let now = 1_000;
  const limiter = createRateLimit({ limit: 1, windowMs: 100, maxBuckets: 1, now: () => now });
  assert.equal(invoke(limiter).continued, true);
  assert.equal(invoke(limiter, { ip: '192.0.2.2' }).continued, false);
  now += 101;
  assert.equal(invoke(limiter, { ip: '192.0.2.2' }).continued, true);
});
