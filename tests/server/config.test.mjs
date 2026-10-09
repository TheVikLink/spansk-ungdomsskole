import test from 'node:test';
import assert from 'node:assert/strict';
import { rootCertificates } from 'node:tls';
import { loadConfig } from '../../server/config.js';

const safeProductionEnv = {
  NODE_ENV: 'production',
  DATABASE_SSL: 'true',
  DATABASE_URL: 'postgres://app:secret@db:5432/app',
  SECURITY_JOURNAL_DATABASE_URL: 'postgres://journal:secret@journal:5432/journal',
  PUBLIC_ORIGIN: 'https://app.example.test',
  OIDC_ISSUER: 'https://auth.dataporten.no',
  OIDC_CLIENT_ID: 'registered-client',
  OIDC_CLIENT_SECRET: 'server-secret-for-local-test',
  SESSION_SECRET: '0123456789abcdef0123456789abcdef',
  FEIDE_ADMIN_REQUIRED_ACR: 'urn:mace:feide.no:auth:level:fad08:3',
};

test('database CA configuration is optional, separated by pool, and accepts only one CA certificate', () => {
  const appCa = rootCertificates[0];
  const journalCa = rootCertificates[1];
  const config = loadConfig({ ...safeProductionEnv, DATABASE_SSL_CA: appCa, SECURITY_JOURNAL_DATABASE_SSL_CA: journalCa });
  assert.equal(config.databaseCaCertificate, appCa.trim());
  assert.equal(config.journalCaCertificate, journalCa.trim());
  assert.equal(loadConfig(safeProductionEnv).databaseCaCertificate, undefined);
  assert.equal(loadConfig({ ...safeProductionEnv, DATABASE_SSL_CA: '  ' }).databaseCaCertificate, undefined);
  for (const key of ['DATABASE_SSL_CA', 'SECURITY_JOURNAL_DATABASE_SSL_CA']) {
    for (const value of ['private-secret', `${appCa}\n${journalCa}`, `private-secret\n${appCa}`]) {
      assert.throws(() => loadConfig({ ...safeProductionEnv, [key]: value }), { message: `${key} must contain one valid CA certificate in PEM format` });
    }
  }
});

test('production config refuses missing required Feide and session secrets', () => {
  const production = loadConfig(safeProductionEnv);
  assert.equal(production.cookie.name, '__Host-spansk_session');
  assert.equal(production.cookie.secure, true);
  assert.equal(production.cookie.sameSite, 'Lax');
  assert.equal(production.cookie.path, '/');
  for (const key of ['DATABASE_URL', 'OIDC_ISSUER', 'OIDC_CLIENT_ID', 'OIDC_CLIENT_SECRET', 'SESSION_SECRET', 'FEIDE_ADMIN_REQUIRED_ACR']) {
    const env = { ...safeProductionEnv };
    delete env[key];
    assert.throws(() => loadConfig(env), new RegExp(key));
  }
});

test('production config refuses localhost OIDC and insecure origins or cookies', () => {
  assert.throws(() => loadConfig({ ...safeProductionEnv, OIDC_ISSUER: 'http://localhost:3001' }), /LOCAL_OIDC_TEST_ENABLED/);
  assert.throws(() => loadConfig({ ...safeProductionEnv, PUBLIC_ORIGIN: 'http://app.example.test' }), /HTTPS/i);
  assert.throws(() => loadConfig({ ...safeProductionEnv, COOKIE_SECURE: 'false' }), /secure cookie/i);
  assert.throws(() => loadConfig({ ...safeProductionEnv, SECURITY_JOURNAL_DATABASE_URL: safeProductionEnv.DATABASE_URL }), /separate database/i);
  assert.throws(() => loadConfig({ ...safeProductionEnv, DATABASE_SSL: undefined }), /DATABASE_SSL/);
});

test('local test mode must be explicitly enabled and cannot inherit production Feide secrets', () => {
  assert.throws(() => loadConfig({ NODE_ENV: 'development', OIDC_ISSUER: 'http://127.0.0.1:3001' }), /LOCAL_OIDC_TEST_ENABLED/);
  const config = loadConfig({
    NODE_ENV: 'development',
    LOCAL_OIDC_TEST_ENABLED: 'true',
    DATABASE_URL: 'postgres://app:app@127.0.0.1:5432/app',
    SECURITY_JOURNAL_DATABASE_URL: 'postgres://journal:journal@127.0.0.1:5433/journal',
    PUBLIC_ORIGIN: 'http://127.0.0.1:3000',
    OIDC_ISSUER: 'http://127.0.0.1:3001',
    OIDC_CLIENT_ID: 'local-client',
    OIDC_CLIENT_SECRET: 'local-secret-only',
    SESSION_SECRET: 'local-session-secret-only-123456',
  });
  assert.equal(config.mode, 'local-oidc-test');
  assert.equal(config.cookie.secure, false);
  assert.equal(config.cookie.name, 'spansk_session_dev');
});

test('local OIDC test mode cannot expose HTTP cookies or connect to a remote database', () => {
  const localEnv = {
    NODE_ENV: 'development',
    LOCAL_OIDC_TEST_ENABLED: 'true',
    DATABASE_URL: 'postgres://app:app@127.0.0.1:5432/app',
    SECURITY_JOURNAL_DATABASE_URL: 'postgres://journal:journal@127.0.0.1:5433/journal',
    PUBLIC_ORIGIN: 'http://127.0.0.1:3000',
    OIDC_ISSUER: 'http://127.0.0.1:3001',
    OIDC_CLIENT_ID: 'local-client',
    OIDC_CLIENT_SECRET: 'local-secret-only',
    SESSION_SECRET: 'local-session-secret-only-123456',
  };
  assert.throws(() => loadConfig({ ...localEnv, PUBLIC_ORIGIN: 'http://app.example.test' }), /loopback/i);
  assert.throws(() => loadConfig({ ...localEnv, DATABASE_URL: 'postgres://app:secret@db.example.test:5432/app' }), /loopback/i);
});

test('server port is validated before the listener is started', () => {
  const localEnv = {
    NODE_ENV: 'development', LOCAL_OIDC_TEST_ENABLED: 'true',
    DATABASE_URL: 'postgres://app:app@127.0.0.1:5432/app',
    SECURITY_JOURNAL_DATABASE_URL: 'postgres://journal:journal@127.0.0.1:5433/journal',
    PUBLIC_ORIGIN: 'http://127.0.0.1:3000', OIDC_ISSUER: 'http://127.0.0.1:3001',
    OIDC_CLIENT_ID: 'local-client', OIDC_CLIENT_SECRET: 'local-secret-only',
    SESSION_SECRET: 'local-session-secret-only-123456',
  };
  assert.equal(loadConfig({ ...localEnv, PORT: '3012' }).port, 3012);
  for (const port of ['abc', '0', '65536', '1.5']) assert.throws(() => loadConfig({ ...localEnv, PORT: port }), /PORT/);
});
