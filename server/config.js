import { X509Certificate } from 'node:crypto';

const FEIDE_ISSUER = 'https://auth.dataporten.no';
export const FEIDE_MFA_ACR = 'urn:mace:feide.no:auth:level:fad08:3';

function required(env, key) {
  const value = env[key]?.trim();
  if (!value) throw new Error(`Missing required configuration: ${key}`);
  return value;
}

function isLoopback(url) {
  return ['localhost', '127.0.0.1', '::1'].includes(url.hostname.replace(/^\[|\]$/g, ''));
}

function optionalCaCertificate(env, key) {
  const value = env[key]?.trim();
  if (!value) return undefined;
  try {
    if (!/^-----BEGIN CERTIFICATE-----\r?\n[A-Za-z0-9+/=\r\n]+-----END CERTIFICATE-----$/.test(value)
      || !new X509Certificate(value).ca) throw new Error('Invalid CA');
  } catch {
    throw new Error(`${key} must contain one valid CA certificate in PEM format`);
  }
  return value;
}

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const production = nodeEnv === 'production';
  const localOidcTest = env.LOCAL_OIDC_TEST_ENABLED === 'true';
  const issuer = required(env, 'OIDC_ISSUER').replace(/\/$/, '');
  let initialIssuer;
  try {
    initialIssuer = new URL(issuer);
  } catch {
    throw new Error('OIDC_ISSUER must be a valid absolute URL');
  }
  if (!localOidcTest && initialIssuer.protocol === 'http:' && isLoopback(initialIssuer)) {
    throw new Error('Local OIDC issuer requires LOCAL_OIDC_TEST_ENABLED=true');
  }
  const publicOrigin = required(env, 'PUBLIC_ORIGIN');
  const databaseUrl = required(env, 'DATABASE_URL');
  const journalDatabaseUrl = required(env, 'SECURITY_JOURNAL_DATABASE_URL');
  const clientId = required(env, 'OIDC_CLIENT_ID');
  const clientSecret = required(env, 'OIDC_CLIENT_SECRET');
  const sessionSecret = required(env, 'SESSION_SECRET');
  const adminRequiredAcr = env.FEIDE_ADMIN_REQUIRED_ACR?.trim() || null;
  const teacherRequiredAcr = env.FEIDE_TEACHER_REQUIRED_ACR?.trim() || null;
  if (!localOidcTest && !adminRequiredAcr) throw new Error('Feide mode requires FEIDE_ADMIN_REQUIRED_ACR for privileged school administration');
  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535');

  let issuerUrl;
  let originUrl;
  try {
    issuerUrl = new URL(issuer);
    originUrl = new URL(publicOrigin);
  } catch {
    throw new Error('OIDC_ISSUER and PUBLIC_ORIGIN must be valid absolute URLs');
  }

  if (sessionSecret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  if (clientSecret.length < 16 || /example|changeme|placeholder/i.test(clientSecret)) {
    throw new Error('OIDC_CLIENT_SECRET must be a non-placeholder secret');
  }
  const database = new URL(databaseUrl);
  const journalDatabase = new URL(journalDatabaseUrl);
  if (!['postgres:', 'postgresql:'].includes(database.protocol)) throw new Error('DATABASE_URL must use PostgreSQL');
  if (!['postgres:', 'postgresql:'].includes(journalDatabase.protocol)) throw new Error('SECURITY_JOURNAL_DATABASE_URL must use PostgreSQL');
  if (databaseUrl === journalDatabaseUrl) throw new Error('Security journal must use a separate database connection');

  if (localOidcTest) {
    if (production) throw new Error('LOCAL_OIDC_TEST_ENABLED cannot be used in production');
    if (issuerUrl.protocol !== 'http:' || !isLoopback(issuerUrl)) {
      throw new Error('Local OIDC test issuer must use HTTP on loopback');
    }
    if (originUrl.protocol !== 'http:' || !isLoopback(originUrl)) {
      throw new Error('Local OIDC test app origin must use HTTP on loopback');
    }
    if (!isLoopback(new URL(databaseUrl))) {
      throw new Error('Local OIDC test database must use a loopback host');
    }
    if (!isLoopback(journalDatabase)) throw new Error('Local OIDC test journal database must use a loopback host');
    if (env.COOKIE_SECURE === 'true') throw new Error('Local HTTP test mode cannot set a secure cookie');
  } else {
    if (issuer !== FEIDE_ISSUER) throw new Error('Production and Feide mode require the registered Feide issuer');
    if (issuerUrl.protocol !== 'https:') throw new Error('OIDC issuer must use HTTPS');
    if (!production && env.COOKIE_SECURE === 'false' && !isLoopback(originUrl)) {
      throw new Error('Insecure cookies are only allowed on a loopback origin');
    }
  }

  if (production) {
    if (issuer !== FEIDE_ISSUER) throw new Error('Production cannot use a test issuer');
    if (originUrl.protocol !== 'https:') throw new Error('PUBLIC_ORIGIN must use HTTPS in production');
    if (env.DATABASE_SSL !== 'true') throw new Error('Production requires DATABASE_SSL=true for both PostgreSQL connections');
    if (env.COOKIE_SECURE === 'false') throw new Error('Production requires a secure cookie');
    if (env.LOCAL_OIDC_TEST_ENABLED !== undefined) {
      throw new Error('LOCAL_OIDC_TEST_ENABLED must not be set in production');
    }
  }

  return Object.freeze({
    mode: localOidcTest ? 'local-oidc-test' : (production ? 'production' : 'feide'),
    nodeEnv,
    port,
    host: env.HOST || (production ? '0.0.0.0' : '127.0.0.1'),
    databaseUrl,
    journalDatabaseUrl,
    databaseSsl: !localOidcTest && env.DATABASE_SSL === 'true',
    databaseCaCertificate: optionalCaCertificate(env, 'DATABASE_SSL_CA'),
    journalCaCertificate: optionalCaCertificate(env, 'SECURITY_JOURNAL_DATABASE_SSL_CA'),
    publicOrigin: originUrl.origin,
    oidc: Object.freeze({ issuer, clientId, clientSecret }),
    adminRequiredAcr,
    teacherRequiredAcr,
    sessionSecret,
    cookie: Object.freeze({ name: localOidcTest ? 'spansk_session_dev' : '__Host-spansk_session', secure: !localOidcTest, sameSite: 'Lax', path: '/' }),
    trustedProxyHops: production ? 1 : 0,
  });
}
