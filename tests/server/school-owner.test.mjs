import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createRevocationJournal } from '../../server/revocation-journal.js';
import { blockSchoolOwner } from '../../server/school-owner.js';

function asPool(db) {
  return { query: db.query.bind(db), async connect() { return { query: db.query.bind(db), release() {} }; } };
}

test('legacy schools fail closed until owner verification activates them', async () => {
  const db = new PGlite();
  const journalDb = new PGlite();
  try {
    await db.exec('CREATE ROLE app_runtime NOLOGIN NOBYPASSRLS');
    await db.exec('CREATE ROLE school_owner_provisioner NOLOGIN NOBYPASSRLS');
    await db.exec(await readFile(new URL('../../server/migrations/001_initial.sql', import.meta.url), 'utf8'));
    const schoolIds = [
      '71000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000002',
      '71000000-0000-4000-8000-000000000003',
    ];
    for (let index = 0; index < schoolIds.length; index += 1) {
      await db.query('INSERT INTO school(id,feide_org_id,name) VALUES($1,$2,$3)', [schoolIds[index], `legacy-feide-org-${index}`, `Uavklart gammel skole ${index}`]);
    }
    await db.exec(await readFile(new URL('../../server/migrations/002_school_membership_lifecycle.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../server/migrations/003_account_deletion.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../server/migrations/004_session_auth_level.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../../server/migrations/005_school_owner_tenants.sql', import.meta.url), 'utf8'));
    await journalDb.exec(await readFile(new URL('../../server/journal-migrations/001_revocations.sql', import.meta.url), 'utf8'));
    await journalDb.exec(await readFile(new URL('../../server/journal-migrations/002_account_deletion.sql', import.meta.url), 'utf8'));

    const inactiveOwner = await db.query("INSERT INTO school_owner(display_name,external_reference,status) VALUES('Syntetisk ventende eier','synthetic-owner-pending','pending') RETURNING id");
    await db.exec('SET ROLE school_owner_provisioner');
    const inactiveGrants = await db.query('SELECT * FROM app_lock_school_owner_access_grants($1)', [inactiveOwner.rows[0].id]);
    assert.deepEqual(inactiveGrants.rows, [{ owner_status: 'pending', school_id: null, access_grant_id: null }]);
    await db.exec('RESET ROLE');

    const migrated = await db.query(`SELECT s.status,s.owner_id,o.status AS owner_status,o.external_reference
      FROM school s JOIN school_owner o ON o.id=s.owner_id WHERE s.id=$1`, [schoolIds[0]]);
    assert.equal(migrated.rows[0].status, 'blocked');
    assert.equal(migrated.rows[0].owner_status, 'pending');
    assert.match(migrated.rows[0].external_reference, /^migration-unverified:/u);
    await assert.rejects(db.query("UPDATE school SET status='active' WHERE id=$1", [schoolIds[0]]), { code: '23514' });

    const provisioned = await db.query('SELECT app_provision_school_owner($1,$2,$3,$4,$5::uuid[]) AS owner_id', [
      'Syntetisk kommune A', 'synthetic-owner-710-a', 'test-operator', 'TEST/owner-approval-710-a', schoolIds.slice(0, 2),
    ]);
    const ownerId = provisioned.rows[0].owner_id;
    const otherOwner = await db.query('SELECT app_provision_school_owner($1,$2,$3,$4,$5::uuid[]) AS owner_id', [
      'Syntetisk kommune B', 'synthetic-owner-710-b', 'test-operator', 'TEST/owner-approval-710-b', [schoolIds[2]],
    ]);
    const activated = await db.query('SELECT id,owner_id,status FROM school ORDER BY id');
    assert.deepEqual(activated.rows, [
      { id: schoolIds[0], owner_id: ownerId, status: 'active' },
      { id: schoolIds[1], owner_id: ownerId, status: 'active' },
      { id: schoolIds[2], owner_id: otherOwner.rows[0].owner_id, status: 'active' },
    ]);

    const userId = '71000000-0000-4000-8000-000000000010';
    await db.query("INSERT INTO app_user(id,display_name,status) VALUES($1,'Syntetisk lærer','active')", [userId]);
    await db.query("INSERT INTO school_membership(school_id,user_id,role,status) VALUES($1,$2,'teacher','active')", [schoolIds[0], userId]);
    const tokenHash = Buffer.from('aa', 'hex');
    const csrfHash = Buffer.from('bb', 'hex');
    await db.query('SELECT app_create_session($1::bytea,$2::uuid,$3::uuid,$4::text,$5::bytea,$6::bytea,$7::timestamptz,$8::text)', [tokenHash,userId,schoolIds[0],'teacher',csrfHash,null,new Date(Date.now()+60_000),null]);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM app_resolve_session($1,$2)', [tokenHash,new Date()])).rows[0].n, 1);

    await db.exec('SET ROLE app_runtime');
    await assert.rejects(db.query('SELECT * FROM school_owner'), { code: '42501' });
    await assert.rejects(db.query("SELECT app_block_school_owner($1,'test-operator','TEST/owner-block-710')", [ownerId]), { code: '42501' });
    await db.exec('RESET ROLE');
    await db.exec('SET ROLE school_owner_provisioner');
    assert.equal((await db.query('SELECT count(*)::int AS n FROM app_owner_school_access_grants($1)', [ownerId])).rows[0].n, 2);
    await assert.rejects(db.query('SELECT * FROM school_owner'), { code: '42501' });
    await db.exec('RESET ROLE');
    const journal = createRevocationJournal(asPool(journalDb));
    const firstSchoolGrant = (await db.query('SELECT access_grant_id FROM school WHERE id=$1', [schoolIds[0]])).rows[0].access_grant_id;
    const orderedPool = {
      connect: async () => ({
        async query(sql, params) {
          if (sql.includes('app_lock_school_owner_access_grants')) assert.match(sql, /FOR UPDATE|app_lock_school_owner_access_grants/);
          if (sql.includes('app_block_school_owner')) assert.equal(await journal.isRevoked(firstSchoolGrant), true, 'school block is written to the separate journal before database access closes');
          return db.query(sql, params);
        },
        release() {},
      }),
    };
    assert.deepEqual(await blockSchoolOwner(orderedPool, journal, {
      ownerId, operatorId: 'test-operator', authorizationReference: 'TEST/owner-block-710',
    }), { blocked: true, schools: 2 });
    const afterBlock = await db.query('SELECT id,status FROM school ORDER BY id');
    assert.deepEqual(afterBlock.rows, [
      { id: schoolIds[0], status: 'blocked' }, { id: schoolIds[1], status: 'blocked' }, { id: schoolIds[2], status: 'active' },
    ]);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM app_resolve_session($1,$2)', [tokenHash,new Date()])).rows[0].n, 0);
    assert.equal((await db.query('SELECT count(*)::int AS count FROM school_owner_lifecycle_event WHERE owner_id=$1', [ownerId])).rows[0].count, 4);
    assert.equal(await journal.isRevoked(firstSchoolGrant), true);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM school_membership WHERE school_id=ANY($1::uuid[]) AND status='active'", [schoolIds.slice(0,2)])).rows[0].n, 0);
    await assert.rejects(db.query('DELETE FROM school_owner_lifecycle_event WHERE owner_id=$1', [ownerId]), { code: '55000' });
  } finally { await Promise.all([db.close(),journalDb.close()]); }
});
