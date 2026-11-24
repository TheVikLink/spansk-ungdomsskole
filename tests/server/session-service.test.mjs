import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createSessionService, decryptIdToken, encryptIdToken } from '../../server/session-service.js';

test('server sessions are opaque, expire/revoke centrally, and keep logout tokens encrypted', async () => {
  const db = new PGlite();
  const secret = 'local-session-secret-only-123456';
  try {
    await db.exec('CREATE ROLE app_runtime NOLOGIN NOBYPASSRLS');
    await db.exec(await readFile(new URL('../../server/migrations/001_initial.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../server/migrations/004_session_auth_level.sql', import.meta.url), 'utf8'));
    await db.exec(`
      INSERT INTO app_user(id,display_name,status) VALUES ('00000000-0000-0000-0000-000000000001','Syntetisk lærer','active');
      INSERT INTO school(id,feide_org_id,name) VALUES ('10000000-0000-0000-0000-000000000001','test-org','TestskoIe');
      INSERT INTO school_membership(school_id,user_id,role) VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','teacher');
    `);
    const service = createSessionService(db, { sessionSecret: secret });
    const created = await service.create({ userId: '00000000-0000-0000-0000-000000000001', schoolId: '10000000-0000-0000-0000-000000000001', role: 'teacher', idToken: 'signed-oidc-id-token-fixture', acr: 'urn:synthetic:high' });
    assert.equal(created.token.includes('00000000-0000-0000-0000-000000000001'), false);
    const session = await service.resolve(created.token);
    assert.equal(session.displayName, 'Syntetisk lærer');
    assert.equal(session.acr, 'urn:synthetic:high');
    assert.equal(await service.verifyCsrf(session, created.csrfToken), true);
    assert.equal(await service.verifyCsrf(session, 'wrong-token'), false);
    const stored = await db.query('SELECT token_hash,encrypted_id_token FROM app_session');
    assert.equal(stored.rows[0].encrypted_id_token.includes(Buffer.from('signed-oidc-id-token-fixture')), false);
    assert.equal(decryptIdToken(stored.rows[0].encrypted_id_token, secret), 'signed-oidc-id-token-fixture');
    assert.throws(() => decryptIdToken(stored.rows[0].encrypted_id_token, `${secret}wrong`));
    const logout = await service.logout(created.token);
    assert.equal(logout.idToken, 'signed-oidc-id-token-fixture');
    assert.equal(await service.resolve(created.token), null);
    assert.equal((await db.query('SELECT encrypted_id_token FROM app_session')).rows[0].encrypted_id_token, null);
    assert.equal((await db.query('SELECT acr FROM app_session')).rows[0].acr, null);
    assert.equal(await service.logout(created.token), null);
  } finally {
    await db.close();
  }
});

test('ID-token encryption detects ciphertext modification', () => {
  const encrypted = encryptIdToken('synthetic-token', 'local-session-secret-only-123456');
  encrypted[encrypted.length - 1] ^= 1;
  assert.throws(() => decryptIdToken(encrypted, 'local-session-secret-only-123456'));
});

test('teacher sessions expire after 30 minutes without activity', async () => {
  const db = new PGlite();
  try {
    await db.exec('CREATE ROLE app_runtime NOLOGIN NOBYPASSRLS');
    await db.exec(await readFile(new URL('../../server/migrations/001_initial.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../server/migrations/004_session_auth_level.sql', import.meta.url), 'utf8'));
    await db.exec(`
      INSERT INTO app_user(id,display_name,status) VALUES ('00000000-0000-0000-0000-000000000001','Syntetisk lærer','active');
      INSERT INTO school(id,feide_org_id,name) VALUES ('10000000-0000-0000-0000-000000000001','idle-test-org','Testskole');
      INSERT INTO school_membership(school_id,user_id,role) VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','teacher');
    `);
    const service = createSessionService(db, { sessionSecret: 'local-session-secret-only-123456' });
    const created = await service.create({ userId: '00000000-0000-0000-0000-000000000001', schoolId: '10000000-0000-0000-0000-000000000001', role: 'teacher' });
    assert.ok(await service.resolve(created.token));
    await db.query("UPDATE app_session SET last_seen_at=now()-interval '31 minutes'");
    assert.equal(await service.resolve(created.token), null);
  } finally { await db.close(); }
});
