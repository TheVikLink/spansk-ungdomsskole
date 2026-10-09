import test from 'node:test';
import assert from 'node:assert/strict';
import { markAuthFailure, authFailureSummary } from '../../server/auth-diagnostics.js';

test('auth diagnostics preserve the original error but expose only closed stage/category values', () => {
  const secret = 'private-code-token-state-name';
  const original = Object.freeze(Object.assign(new Error(secret), {
    code: 'OAUTH_RESPONSE_BODY_ERROR', cause: { error: 'invalid_client', error_description: secret },
    request: { body: secret },
  }));
  assert.equal(markAuthFailure(original, 'token_exchange'), original);
  assert.deepEqual(authFailureSummary(original, 'callback_form'), {
    stage: 'token_exchange', category: 'client_authentication',
  });
  assert.doesNotMatch(JSON.stringify(authFailureSummary(original)), /private|invalid_client|cause|request/);
});

test('unknown input, injected stages/codes and accessors cannot enter or break diagnostic output', () => {
  const hostile = { get code() { throw new Error('private'); }, get cause() { throw new Error('private'); } };
  for (const error of [hostile, new Error('private'), 'private', null, { code: 'private', cause: { error: 'private' } }]) {
    markAuthFailure(error, 'private-stage');
    assert.deepEqual(authFailureSummary(error, 'private-fallback'), { stage: 'unknown', category: 'unknown' });
  }
});

test('an unmarked database failure uses only the explicit callback stage and fixed database category', () => {
  assert.deepEqual(authFailureSummary({ code: '42501', message: 'private SQL' }, 'identity_link'), {
    stage: 'identity_link', category: 'database',
  });
});

test('the installed OIDC library timeout and timestamp errors have fixed diagnostic categories', () => {
  assert.equal(authFailureSummary({ code: 'OAUTH_TIMEOUT' }, 'token_exchange').category, 'network');
  assert.equal(authFailureSummary({ code: 'OAUTH_JWT_TIMESTAMP_CHECK_FAILED' }, 'token_exchange').category, 'claims');
});
