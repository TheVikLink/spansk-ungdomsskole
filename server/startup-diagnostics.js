// Only these fixed labels may reach operational logs. Driver errors can carry
// passwords, connection URLs and SQL details in their messages and properties.
const missingKeys = new Set([
  'OIDC_ISSUER', 'PUBLIC_ORIGIN', 'DATABASE_URL', 'SECURITY_JOURNAL_DATABASE_URL',
  'OIDC_CLIENT_ID', 'OIDC_CLIENT_SECRET', 'SESSION_SECRET',
]);

const configFailures = new Map([
  ['SESSION_SECRET must be at least 32 characters', 'CONFIG_SESSION_SECRET_INVALID'],
  ['OIDC_CLIENT_SECRET must be a non-placeholder secret', 'CONFIG_OIDC_CLIENT_SECRET_INVALID'],
  ['OIDC_ISSUER must be a valid absolute URL', 'CONFIG_ISSUER_INVALID'],
  ['OIDC_ISSUER and PUBLIC_ORIGIN must be valid absolute URLs', 'CONFIG_URL_INVALID'],
  ['DATABASE_URL must use PostgreSQL', 'CONFIG_APP_DATABASE_URL_INVALID'],
  ['SECURITY_JOURNAL_DATABASE_URL must use PostgreSQL', 'CONFIG_JOURNAL_DATABASE_URL_INVALID'],
  ['Security journal must use a separate database connection', 'CONFIG_DATABASES_NOT_SEPARATE'],
  ['Production requires DATABASE_SSL=true for both PostgreSQL connections', 'CONFIG_DATABASE_SSL_REQUIRED'],
  ['Feide mode requires FEIDE_ADMIN_REQUIRED_ACR for privileged school administration', 'CONFIG_ADMIN_ACR_REQUIRED'],
  ['Production and Feide mode require the registered Feide issuer', 'CONFIG_ISSUER_INVALID'],
  ['PUBLIC_ORIGIN must use HTTPS in production', 'CONFIG_ORIGIN_HTTPS_REQUIRED'],
  ['Required database migrations are missing', 'DATABASE_MIGRATIONS_MISSING'],
  ['DATABASE_SSL_CA must contain one valid CA certificate in PEM format', 'CONFIG_APP_DATABASE_CA_INVALID'],
  ['SECURITY_JOURNAL_DATABASE_SSL_CA must contain one valid CA certificate in PEM format', 'CONFIG_JOURNAL_DATABASE_CA_INVALID'],
]);

const driverFailures = new Map([
  ['ERR_INVALID_URL', 'CONFIG_URL_INVALID'],
  ['28P01', 'DATABASE_AUTH_FAILED'],
  ['28000', 'DATABASE_AUTH_FAILED'],
  ['42501', 'DATABASE_PERMISSION_DENIED'],
  ['42P01', 'DATABASE_RELATION_MISSING'],
  ['3D000', 'DATABASE_NOT_FOUND'],
  ['ECONNREFUSED', 'DATABASE_CONNECTION_REFUSED'],
  ['ETIMEDOUT', 'DATABASE_CONNECTION_TIMEOUT'],
  ['ENOTFOUND', 'DATABASE_DNS_FAILED'],
  ['SELF_SIGNED_CERT_IN_CHAIN', 'DATABASE_TLS_UNTRUSTED'],
  ['DEPTH_ZERO_SELF_SIGNED_CERT', 'DATABASE_TLS_UNTRUSTED'],
  ['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'DATABASE_TLS_UNTRUSTED'],
  ['CERT_HAS_EXPIRED', 'DATABASE_TLS_EXPIRED'],
]);

export class DatabaseStartupError extends Error {
  constructor(target, cause) {
    super('Database initialization failed', { cause });
    this.target = target;
  }
}

function failureCode(error) {
  const missing = typeof error?.message === 'string'
    ? /^Missing required configuration: ([A-Z_]+)$/.exec(error.message)?.[1]
    : undefined;
  if (missingKeys.has(missing)) return `CONFIG_MISSING_${missing}`;
  return configFailures.get(error?.message) || driverFailures.get(error?.code) || 'RUNTIME_INIT_FAILED';
}

export function startupFailureCode(error) {
  if (error instanceof DatabaseStartupError) {
    if (!['APP', 'JOURNAL'].includes(error.target)) return 'RUNTIME_INIT_FAILED';
    return `${error.target}_${failureCode(error.cause)}`;
  }
  return failureCode(error);
}
