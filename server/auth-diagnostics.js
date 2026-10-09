// Login failures expose only fixed operational labels, never provider/request data.
const stages = new Set([
  'callback_form', 'login_transaction', 'oidc_configuration', 'token_exchange',
  'identity_claims', 'userinfo', 'display_name', 'identity_link',
  'school_access', 'journal_access', 'session',
]);
const marked = new WeakMap();
const categories = new Map([
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
  ['OAUTH_INVALID_RESPONSE', 'invalid_response'],
  ['OAUTH_RESPONSE_BODY_ERROR', 'invalid_response'],
  ['OAUTH_JWT_CLAIM_COMPARISON_FAILED', 'claims'],
  ['OAUTH_JWT_TIMESTAMP_CHECK_FAILED', 'claims'],
  ['OAUTH_JSON_ATTRIBUTE_COMPARISON_FAILED', 'claims'],
  ['ERR_JWT_CLAIM_VALIDATION_FAILED', 'claims'],
  ['ERR_JWT_EXPIRED', 'claims'],
  ['ERR_JWS_SIGNATURE_VERIFICATION_FAILED', 'claims'],
  ['ECONNRESET', 'network'], ['ECONNREFUSED', 'network'], ['ETIMEDOUT', 'network'],
  ['ENOTFOUND', 'network'], ['UND_ERR_CONNECT_TIMEOUT', 'network'], ['OAUTH_TIMEOUT', 'network'],
  ['42501', 'database'], ['42P01', 'database'], ['42703', 'database'],
  ['42702', 'database'], ['23505', 'database'], ['28P01', 'database'],
]);
const objectLike = (value) => value !== null && ['object', 'function'].includes(typeof value);
function ownValue(value, name) {
  if (!objectLike(value)) return undefined;
  try { return Object.getOwnPropertyDescriptor(value, name)?.value; } catch { return undefined; }
}

export function markAuthFailure(error, stage) {
  if (objectLike(error) && stages.has(stage) && !marked.has(error)) marked.set(error, stage);
  return error;
}

export function authFailureSummary(error, fallbackStage) {
  const stage = (objectLike(error) ? marked.get(error) : undefined)
    || (stages.has(fallbackStage) ? fallbackStage : 'unknown');
  const cause = ownValue(error, 'cause');
  // Only exact recognized values are classified; no cause or error is serialized.
  const providerError = ownValue(error, 'error') || ownValue(cause, 'error');
  const category = providerError === 'invalid_client' ? 'client_authentication'
    : categories.get(ownValue(error, 'code')) || categories.get(ownValue(cause, 'code')) || 'unknown';
  return { stage, category };
}
