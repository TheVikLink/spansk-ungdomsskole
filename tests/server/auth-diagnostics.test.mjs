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


test('remaining installed OAuth SDK errors map only to fixed public categories', () => {
  for (const [code, category] of [
    ['OAUTH_WWW_AUTHENTICATE_CHALLENGE', 'authentication_challenge'],
    ['OAUTH_RESPONSE_IS_NOT_CONFORM', 'http_status'],
    ['OAUTH_RESPONSE_IS_NOT_JSON', 'content_type'],
    ['OAUTH_UNSUPPORTED_OPERATION', 'unsupported_operation'],
    ['OAUTH_AUTHORIZATION_RESPONSE_ERROR', 'authorization_response'],
    ['OAUTH_KEY_SELECTION_FAILED', 'signature_key'],
    ['OAUTH_MISSING_SERVER_METADATA', 'server_metadata'],
    ['OAUTH_INVALID_SERVER_METADATA', 'server_metadata'],
    ['OAUTH_HTTP_REQUEST_FORBIDDEN', 'protocol'],
    ['OAUTH_REQUEST_PROTOCOL_FORBIDDEN', 'protocol'],
    ['ERR_INVALID_ARG_TYPE', 'invalid_argument'],
    ['ERR_INVALID_ARG_VALUE', 'invalid_argument'],
    ['OAUTH_PARSE_ERROR', 'invalid_response'],
    ['OAUTH_INVALID_REQUEST', 'invalid_request'],
  ]) {
    const error = Object.freeze({ code, message: 'private', response: { secret: 'private' } });
    assert.deepEqual(authFailureSummary(error, 'token_exchange'), { stage: 'token_exchange', category });
    assert.doesNotMatch(JSON.stringify(authFailureSummary(error, 'token_exchange')), /private|secret|"response":/);
  }
});
