import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { linkFeideIdentity, redeemSchoolInvite } from '../../server/identity-service.js';
import { createSessionService, hashSessionToken } from '../../server/session-service.js';
import { createRevocationJournal } from '../../server/revocation-journal.js';

const secret = 'synthetic-student-invitation-session-secret';
const hash = (value) => createHash('sha256').update(value).digest();

async function createAppTestDatabase() {
  if (process.env.SPANSK_INVITATION_POSTGRES_TEST !== '1') return new PGlite();
  const url = new URL(process.env.MIGRATION_DATABASE_URL || '');
  if (!['127.0.0.1','localhost'].includes(url.hostname) || url.pathname !== '/spansk_school' || process.env.NODE_ENV === 'production') {
    throw new Error('PostgreSQL invitation verification requires the local synthetic spansk_school database');
  }
  const adminPool = new pg.Pool({connectionString:url.href,max:1});
  const name = `spansk_invite_test_${randomUUID().replaceAll('-','')}`;
  let pool;
  try {
    await adminPool.query(`CREATE DATABASE ${name}`);
    url.pathname = `/${name}`;
    pool = new pg.Pool({connectionString:url.href,max:3,options:"-c statement_timeout=10000 -c lock_timeout=5000"});
    return {
      query:pool.query.bind(pool), exec:pool.query.bind(pool), connect:pool.connect.bind(pool), postgres:true,
      async close() {
        try { await pool.end(); await adminPool.query(`DROP DATABASE ${name}`); }
        finally { await adminPool.end(); }
      },
    };
  } catch (error) {
    if (pool) await pool.end();
    await adminPool.end();
    throw error;
  }
}

// Use the real restricted runtime role inside each transaction. SET LOCAL
// prevents a pooled connection from leaking the role to owner-only fixtures.
function runtimePool(db) {
  return { async connect() {
    const client=db.connect ? await db.connect() : {query:db.query.bind(db),release(){}};
    return {
      async query(sql,values) {
        const result=await client.query(sql,values);
        if(sql==='BEGIN') await client.query('SET LOCAL ROLE app_runtime');
        return result;
      },
      release(){client.release();},
    };
  }};
}

test('school invitations preserve role, authorization and single-use across the additive migration', async (t) => {
  const db = await createAppTestDatabase();
  const journalDb = new PGlite();
  const owner = randomUUID(), school = randomUUID(), admin = randomUUID();
  try {
    if (!db.postgres) await db.exec('CREATE ROLE app_runtime NOLOGIN NOBYPASSRLS; CREATE ROLE school_owner_provisioner NOLOGIN NOBYPASSRLS;');
    else assert.equal((await db.query("SELECT count(*)::int n FROM pg_roles WHERE rolname IN ('app_runtime','school_owner_provisioner') AND NOT rolbypassrls AND NOT rolsuper")).rows[0].n,2);
    for (const name of ['001_initial','002_school_membership_lifecycle','003_account_deletion','004_session_auth_level','005_school_owner_tenants','006_assignment_content_snapshots','007_runtime_migration_privileges','008_pin_provisioning_trigger_search_path']) {
      await db.exec(await readFile(new URL(`../../server/migrations/${name}.sql`, import.meta.url), 'utf8'));
    }
    for (const name of ['001_revocations','002_account_deletion']) {
      await journalDb.exec(await readFile(new URL(`../../server/journal-migrations/${name}.sql`, import.meta.url), 'utf8'));
    }
    await db.query("INSERT INTO school_owner(id,display_name,external_reference,status,verification_reference,verified_by,verified_at) VALUES($1,'Synthetic owner',$2,'active','synthetic-only','test',now())", [owner, randomUUID()]);
    await db.query("INSERT INTO school(id,owner_id,feide_org_id,name) VALUES($1,$2,$3,'Synthetic school')", [school,owner,randomUUID()]);
    await db.query("INSERT INTO app_user(id,display_name,status) VALUES($1,'Synthetic admin','active')", [admin]);
    await db.query("INSERT INTO school_membership(school_id,user_id,role) VALUES($1,$2,'school_admin')", [school,admin]);
    const legacyCode = randomBytes(24).toString('base64url');
    await db.query("INSERT INTO school_invite(school_id,token_hash,created_by,expires_at) VALUES($1,$2,$3,now()+interval '1 day')", [school,hash(legacyCode),admin]);
    const functionPrivileges = () => db.query("SELECT oid::regprocedure::text AS fn,proowner,proacl FROM pg_proc WHERE proname IN ('app_lookup_school_invite','app_redeem_school_invite') ORDER BY proname");
    const before = (await functionPrivileges()).rows;
    await db.exec(await readFile(new URL('../../server/migrations/009_student_school_invitations.sql', import.meta.url),'utf8'));
    assert.deepEqual((await functionPrivileges()).rows,before,'function owner and ACLs must not widen');
    assert.equal((await db.query('SELECT member_role FROM school_invite')).rows[0].member_role,'teacher');
    const journal=createRevocationJournal(journalDb), sessions=createSessionService(db,{sessionSecret:secret});
    const runtime=runtimePool(db);
    async function identity() {
      const user=await linkFeideIdentity(db,{issuer:'https://synthetic.example.test',subject:randomUUID(),displayName:'Synthetic pending user'});
      const session=await sessions.create({userId:user.userId,schoolId:null,role:'pending',idToken:'synthetic-id-token'});
      return {user,session,args:{userId:user.userId,sessionTokenHash:hashSessionToken(session.token),sessionSecret:secret}};
    }
    async function invitation(role,createdBy=admin,targetSchool=school) {
      const code=randomBytes(24).toString('base64url');
      const result=await db.query("INSERT INTO school_invite(school_id,token_hash,created_by,expires_at,member_role) VALUES($1,$2,$3,now()+interval '1 day',$4) RETURNING id",[targetSchool,hash(code),createdBy,role]);
      return {code,id:result.rows[0].id};
    }
    await t.test('existing teacher code retains its role through the new runtime',async()=>{
      const {args}=await identity();
      assert.equal((await redeemSchoolInvite(runtime,journal,{...args,code:legacyCode})).role,'teacher');
    });
    await t.test('old runtime refuses both roles and PUBLIC cannot execute v2',async()=>{
      const acl=await db.query("SELECT EXISTS(SELECT 1 FROM pg_proc p CROSS JOIN LATERAL aclexplode(p.proacl) a WHERE p.proname='app_redeem_school_invite_v2' AND a.grantee=0 AND a.privilege_type='EXECUTE') AS public_execute");
      assert.equal(acl.rows[0].public_execute,false);
      for(const role of ['student','teacher']) {
        const {args}=await identity(),invite=await invitation(role);
        assert.equal((await db.query('SELECT app_lookup_school_invite($1,$2,$3) id',[hash(invite.code),args.userId,args.sessionTokenHash])).rows[0].id,null);
        await assert.rejects(db.query('SELECT * FROM app_redeem_school_invite($1,$2,$3)',[hash(invite.code),args.userId,args.sessionTokenHash]),{code:'28000'});
        assert.equal((await db.query('SELECT used_at FROM school_invite WHERE id=$1',[invite.id])).rows[0].used_at,null);
      }
    });
    await t.test('runtime has no direct identity, session or foreign-school visibility',async()=>{
      // Match the production table grants; RLS still denies internal tables.
      await db.exec('GRANT SELECT,INSERT,UPDATE,DELETE ON feide_identity,app_session,school_invite,school_membership TO app_runtime');
      const client=await runtime.connect();
      try {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.user_id',$1,true),set_config('app.school_id',$2,true),set_config('app.role','student',true)",[randomUUID(),randomUUID()]);
        for(const table of ['feide_identity','app_session','school_invite','school_membership']) assert.equal((await client.query(`SELECT * FROM ${table}`)).rows.length,0,table);
        await assert.rejects(client.query("INSERT INTO school_invite(school_id,token_hash,created_by,expires_at,member_role) VALUES($1,$2,$3,now()+interval '1 day','student')",[school,randomBytes(32),admin]),{code:'42501'});
      } finally { await client.query('ROLLBACK'); client.release(); }
    });
    await t.test('new student code creates only student membership and no class or homework access',async()=>{
      const {args,user,session}=await identity(), invite=await invitation('student');
      assert.equal((await redeemSchoolInvite(runtime,journal,{...args,code:invite.code})).role,'student');
      assert.deepEqual((await db.query('SELECT role,status FROM school_membership WHERE user_id=$1',[user.userId])).rows,[{role:'student',status:'active'}]);
      assert.equal((await db.query('SELECT count(*)::int n FROM class_membership WHERE user_id=$1',[user.userId])).rows[0].n,0);
      assert.equal(await sessions.resolve(session.token),null,'pending session is revoked on redemption');
      assert.equal(await journal.isRevoked(invite.id),true);
      await assert.rejects(redeemSchoolInvite(runtime,journal,{...args,code:invite.code}));
      // Simulate an app-only restore before redemption; the independent journal wins.
      await db.query('DELETE FROM school_membership WHERE user_id=$1',[user.userId]);
      await db.query("UPDATE app_user SET status='pending' WHERE id=$1",[user.userId]);
      await db.query('UPDATE school_invite SET used_at=NULL WHERE id=$1',[invite.id]);
      const restored=await sessions.create({userId:user.userId,schoolId:null,role:'pending',idToken:'synthetic-restored'});
      await assert.rejects(redeemSchoolInvite(runtime,journal,{...args,sessionTokenHash:hashSessionToken(restored.token),code:invite.code}),{code:'INVITE_INVALID'});
      assert.equal((await db.query('SELECT count(*)::int n FROM school_membership WHERE user_id=$1',[user.userId])).rows[0].n,0);
    });
    await t.test('database rejects admin and unknown invitation roles',async()=>{
      for(const role of ['school_admin','pending','anything']) await assert.rejects(invitation(role),{code:'23514'});
    });
    for(const role of ['student','teacher']) {
      await t.test(`${role}: journal-only issuer revocation blocks redemption and preserves invitation`,async()=>{
        const {args,user}=await identity(),invite=await invitation(role);
        const revokedGrant=(await db.query('SELECT grant_id FROM school_membership WHERE school_id=$1 AND user_id=$2',[school,admin])).rows[0].grant_id;
        await journal.revoke(revokedGrant,'school_membership_removed');
        await assert.rejects(redeemSchoolInvite(runtime,journal,{...args,code:invite.code}),{code:'INVITE_INVALID'});
        assert.equal((await db.query('SELECT count(*)::int n FROM school_membership WHERE user_id=$1',[user.userId])).rows[0].n,0);
        assert.equal((await db.query('SELECT used_at FROM school_invite WHERE id=$1',[invite.id])).rows[0].used_at,null);
        // A new synthetic grant isolates the next test; production never revives revoked grants.
        await db.query('UPDATE school_membership SET grant_id=$1 WHERE school_id=$2 AND user_id=$3',[randomUUID(),school,admin]);
      });
      await t.test(`${role}: revoked membership and inactive issuer fail v2 redemption`,async()=>{
        const {args,user}=await identity(),invite=await invitation(role);
        await db.query("INSERT INTO school_membership(school_id,user_id,role,status) VALUES($1,$2,'student','revoked')",[school,user.userId]);
        assert.equal((await db.query('SELECT app_lookup_school_invite($1,$2,$3) id',[hash(invite.code),args.userId,args.sessionTokenHash])).rows[0].id,null);
        await assert.rejects(redeemSchoolInvite(runtime,journal,{...args,code:invite.code}),{code:'INVITE_INVALID'});
        assert.deepEqual((await db.query('SELECT role,status FROM school_membership WHERE user_id=$1',[user.userId])).rows,[{role:'student',status:'revoked'}]);
        await db.query('DELETE FROM school_membership WHERE user_id=$1',[user.userId]);
        for(const change of ["UPDATE school_membership SET status='revoked' WHERE user_id=$1","UPDATE app_user SET status='blocked' WHERE id=$1"]) {
          await db.query(change,[admin]);
          assert.equal((await db.query('SELECT app_lookup_school_invite($1,$2,$3) id',[hash(invite.code),args.userId,args.sessionTokenHash])).rows[0].id,null);
          await assert.rejects(redeemSchoolInvite(runtime,journal,{...args,code:invite.code}),{code:'INVITE_INVALID'});
          await db.query("UPDATE school_membership SET status='active' WHERE user_id=$1",[admin]);
          await db.query("UPDATE app_user SET status='active' WHERE id=$1",[admin]);
        }
        assert.equal((await db.query('SELECT used_at FROM school_invite WHERE id=$1',[invite.id])).rows[0].used_at,null);
      });
      for(const subject of ['school','issuer_account','recipient_account']) {
        await t.test(`${role}: journal-only ${subject} revocation rolls back every local change`,async()=>{
          const issuer=randomUUID();
          await db.query("INSERT INTO app_user(id,display_name,status) VALUES($1,'Synthetic issuer','active')",[issuer]);
          await db.query("INSERT INTO school_membership(school_id,user_id,role) VALUES($1,$2,'school_admin')",[school,issuer]);
          const {args,user,session}=await identity(),invite=await invitation(role,issuer);
          const schoolGrant=(await db.query('SELECT access_grant_id FROM school WHERE id=$1',[school])).rows[0].access_grant_id;
          const subjectId=subject==='school' ? schoolGrant : subject==='issuer_account' ? issuer : user.userId;
          await journal.revoke(subjectId,subject==='school'?'school_blocked':'user_deleted');
          try {
            await assert.rejects(redeemSchoolInvite(runtime,journal,{...args,code:invite.code}),{code:'INVITE_INVALID'});
            assert.equal((await db.query('SELECT count(*)::int n FROM school_membership WHERE user_id=$1',[user.userId])).rows[0].n,0);
            assert.equal((await db.query('SELECT used_at FROM school_invite WHERE id=$1',[invite.id])).rows[0].used_at,null);
            assert.equal((await db.query('SELECT status FROM app_user WHERE id=$1',[user.userId])).rows[0].status,'pending');
            assert.ok(await sessions.resolve(session.token));
            assert.equal(await journal.isRevoked(invite.id),false);
          } finally {
            if(subject==='school') await db.query('UPDATE school SET access_grant_id=$1 WHERE id=$2',[randomUUID(),school]);
          }
        });
      }
      await t.test(`${role}: journal failure cannot commit membership or consume the session`,async()=>{
        const {args,user,session}=await identity(),invite=await invitation(role);
        const failingJournal={isRevoked:journal.isRevoked.bind(journal),async revoke(){throw new Error('Synthetic journal outage');}};
        await assert.rejects(redeemSchoolInvite(runtime,failingJournal,{...args,code:invite.code}),/Synthetic journal outage/);
        assert.equal((await db.query('SELECT count(*)::int n FROM school_membership WHERE user_id=$1',[user.userId])).rows[0].n,0);
        assert.equal((await db.query('SELECT used_at FROM school_invite WHERE id=$1',[invite.id])).rows[0].used_at,null);
        assert.ok(await sessions.resolve(session.token));
        assert.equal(await journal.isRevoked(invite.id),false);
        assert.equal((await redeemSchoolInvite(runtime,journal,{...args,code:invite.code})).role,role);
      });
      await t.test(`${role}: expired and journal-revoked invitation gives no membership`,async()=>{
        for(const condition of ['expired','revoked']) {
          const {args,user}=await identity(),invite=await invitation(role);
          if(condition==='expired') await db.query("UPDATE school_invite SET expires_at=now()-interval '1 second' WHERE id=$1",[invite.id]);
          else await journal.revoke(invite.id,'school_invitation_revoked');
          await assert.rejects(redeemSchoolInvite(runtime,journal,{...args,code:invite.code}),{code:'INVITE_INVALID'});
          assert.equal((await db.query('SELECT count(*)::int n FROM school_membership WHERE user_id=$1',[user.userId])).rows[0].n,0);
        }
      });
    }
    await t.test('cross-school invitations serialize without a user-lock cycle',{skip:!db.postgres},async()=>{
      const schoolB=randomUUID(),adminB=randomUUID();
      await db.query("INSERT INTO school(id,owner_id,feide_org_id,name) VALUES($1,$2,$3,'Synthetic second school')",[schoolB,owner,randomUUID()]);
      await db.query("INSERT INTO app_user(id,display_name,status) VALUES($1,'Synthetic second admin','active')",[adminB]);
      await db.query("INSERT INTO school_membership(school_id,user_id,role) VALUES($1,$2,'school_admin')",[schoolB,adminB]);
      const sessionA=await sessions.create({userId:admin,schoolId:null,role:'select_school',idToken:'synthetic-A'});
      const sessionB=await sessions.create({userId:adminB,schoolId:null,role:'select_school',idToken:'synthetic-B'});
      const inviteA=await invitation('student'),inviteB=await invitation('teacher',adminB,schoolB);
      // Start both on independent PostgreSQL connections. The journal pause
      // holds the first transaction's user locks while the other contends.
      let reachedJournal;
      const firstAtJournal=new Promise(resolve=>{reachedJournal=resolve;});
      let releaseJournal;
      const release=new Promise(resolve=>{releaseJournal=resolve;});
      let first=true;
      const pausedJournal={...journal,async isRevoked(id){if(first){first=false;reachedJournal();await release;}return journal.isRevoked(id);}};
      const a=redeemSchoolInvite(runtime,pausedJournal,{userId:adminB,code:inviteA.code,sessionTokenHash:hashSessionToken(sessionB.token),sessionSecret:secret});
      await firstAtJournal;
      const b=redeemSchoolInvite(runtime,journal,{userId:admin,code:inviteB.code,sessionTokenHash:hashSessionToken(sessionA.token),sessionSecret:secret});
      b.catch(()=>{});
      let observedLock=false;
      try {
        for(let attempt=0;attempt<80;attempt++) {
          const waiting=await db.query("SELECT count(*)::int n FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid() AND wait_event_type='Lock' AND query LIKE 'SELECT * FROM app_redeem_school_invite_v2%'");
          if(waiting.rows[0].n>0){observedLock=true;break;}
          await new Promise(resolve=>setTimeout(resolve,25));
        }
      } finally {releaseJournal();}
      const results=await Promise.all([a,b]);
      assert.equal(observedLock,true,'the second real connection must contend while the first holds its transaction');
      assert.deepEqual(results.map(r=>r.role),['student','teacher']);
    });
  } finally {await Promise.all([db.close(),journalDb.close()]);}
});
