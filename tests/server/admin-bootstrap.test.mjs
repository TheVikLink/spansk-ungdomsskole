import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { bootstrapFirstSchoolAdmin } from '../../server/admin-bootstrap.js';

async function setup() {
  const db = new PGlite();
  await db.exec('CREATE ROLE app_runtime NOLOGIN');
  await db.exec('CREATE ROLE school_owner_provisioner NOLOGIN NOBYPASSRLS');
  await db.exec(await readFile(new URL('../../server/migrations/001_initial.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../../server/migrations/002_school_membership_lifecycle.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../../server/migrations/004_session_auth_level.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../../server/migrations/005_school_owner_tenants.sql', import.meta.url), 'utf8'));
  await db.exec(`
    INSERT INTO school_owner(id,display_name,external_reference,status,verification_reference,verified_by,verified_at)
      VALUES ('50000000-0000-4000-8000-000000000010','Syntetisk skoleeier','synthetic-bootstrap-owner','active','synthetic-only','test-seed',now());
    INSERT INTO school(id,owner_id,feide_org_id,name) VALUES ('50000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000010','bootstrap-org','Syntetisk skole');
    INSERT INTO app_user(id,display_name,status) VALUES ('50000000-0000-4000-8000-000000000002','Syntetisk lærer','pending');
    INSERT INTO feide_identity(issuer,subject,user_id) VALUES ('https://issuer.example.test','synthetic-subject-001','50000000-0000-4000-8000-000000000002');
  `);
  return db;
}

const request = {
  schoolId: '50000000-0000-4000-8000-000000000001',
  issuer: 'https://issuer.example.test',
  subject: 'synthetic-subject-001',
  operatorId: 'school-owner-ops',
  authorizationReference: 'SCHOOL-ACCESS-2026-01',
  confirmation: 'BOOTSTRAP SCHOOL ADMIN 50000000-0000-4000-8000-000000000001',
};

test('first-admin bootstrap requires a verified reference and grants only the exact Feide identity', async () => {
  const db = await setup();
  try {
    const result = await bootstrapFirstSchoolAdmin(db, request);
    assert.deepEqual(result, { schoolId: request.schoolId, status: 'created' });
    assert.deepEqual((await db.query('SELECT role,status FROM school_membership')).rows, [{ role: 'school_admin', status: 'active' }]);
    assert.equal((await db.query("SELECT status FROM app_user WHERE id='50000000-0000-4000-8000-000000000002'")).rows[0].status, 'active');
    assert.equal((await db.query("SELECT count(*)::int AS n FROM school_provisioning_event WHERE authorization_reference=$1 AND operation='first_admin_created'", [request.authorizationReference])).rows[0].n, 1);
  } finally { await db.close(); }
});

test('first-admin bootstrap rejects a missing approval reference without changing membership', async () => {
  const db = await setup();
  try {
    await assert.rejects(bootstrapFirstSchoolAdmin(db, { ...request, authorizationReference: '' }), /authorization reference/i);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM school_membership')).rows[0].n, 0);
  } finally { await db.close(); }
});
