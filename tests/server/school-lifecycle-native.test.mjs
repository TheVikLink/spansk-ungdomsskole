import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {randomBytes} from 'node:crypto';
import {createLifecycleFixture} from './helpers/school-lifecycle-fixture.mjs';
import {deleteSchool} from '../../server/school-lifecycle.js';
const A='10000000-0000-4000-8000-000000000001',B='10000000-0000-4000-8000-000000000002',U='00000000-0000-4000-8000-000000000001';
const url=process.env.PILOT_NATIVE_DATABASE_URL;
async function fixture(){
 const parsed=new URL(url);assert.ok(['localhost','127.0.0.1'].includes(parsed.hostname),'native tests must be local');
 const admin=new pg.Pool({connectionString:url});const name='pilot_ops_test_'+randomBytes(6).toString('hex');
 await admin.query(`CREATE DATABASE "${name}"`);parsed.pathname='/'+name;
 const pool=new pg.Pool({connectionString:parsed.toString(),max:6,statement_timeout:10000});
 pool.exec=async(sql)=>pool.query(sql);pool.close=async()=>{await pool.end();await admin.query(`DROP DATABASE "${name}" WITH(FORCE)`);await admin.end();};
 return createLifecycleFixture(pool);
}
async function waitBlocked(db,pid){
 const end=Date.now()+3000;
 while(Date.now()<end){const q=await db.query('SELECT cardinality(pg_blocking_pids($1))::int n',[pid]);if(q.rows[0]?.n>0)return;await new Promise(r=>setTimeout(r,20));}
 throw Error('Expected concurrent transaction to wait on a database lock');
}
test('native PG rejects an already-authorized write after school deletion and refuses deletion while a writer holds the barrier',{skip:!url},async()=>{
 const {db,pool}=await fixture();let writer;
 try{
  writer=await pool.connect();await writer.query('BEGIN');
  assert.equal((await writer.query('SELECT status FROM school WHERE id=$1',[A])).rows[0].status,'active');
  await deleteSchool(pool,{schoolId:A,authorizationReference:'synthetic-delete',apply:true,journal:{async deleteSchool(){}}});
  await assert.rejects(writer.query("INSERT INTO school_class(school_id,name,school_year) VALUES($1,'Late write','2026')",[A]),/inactive/);
  await writer.query('ROLLBACK');
  await writer.query('BEGIN');await writer.query("INSERT INTO school_class(school_id,name,school_year) VALUES($1,'Pending write','2026')",[B]);
  await db.query("INSERT INTO school_ops.authorization VALUES($1,'synthetic-delete-b','delete','local-test',now()+interval '1 hour')",[B]);
  let journalCalled=false;
  await assert.rejects(deleteSchool(pool,{schoolId:B,authorizationReference:'synthetic-delete-b',apply:true,journal:{async deleteSchool(){journalCalled=true;}}}),/busy/);
  assert.equal(journalCalled,false);await writer.query('ROLLBACK');
 }finally{writer?.release();await db.close();}
});
test('native PG school invitation vs account deletion revalidates before journaling in both lock orders',{skip:!url},async()=>{
 const {db,pool}=await fixture();let first,second;
 const target='00000000-0000-4000-8000-000000000002';const code=randomBytes(32),token=randomBytes(32),csrf=randomBytes(32);
 try{
  await db.query("UPDATE school_membership SET role='school_admin' WHERE school_id=$1 AND user_id=$2",[A,U]);
  await db.query("INSERT INTO app_user(id,display_name,status) VALUES($1,'Syntetisk pending','pending')",[target]);
  await db.query("INSERT INTO school_invite(school_id,token_hash,created_by,expires_at,member_role) VALUES($1,$2,$3,now()+interval '1 hour','teacher')",[A,code,U]);
  await db.query("SELECT app_create_session($1,$2,NULL,'pending',$3,NULL,now()+interval '1 hour',NULL)",[token,target,csrf]);
  first=await pool.connect();second=await pool.connect();
  await first.query('BEGIN');await first.query('SELECT app_redeem_school_invite_v2($1,$2,$3)',[code,target,token]);
  await second.query('BEGIN');await second.query("SELECT set_config('app.user_id',$1,true)",[target]);
  const pid=(await second.query('SELECT pg_backend_pid() pid')).rows[0].pid;
  const blocked=second.query('SELECT app_prepare_own_account_deletion($1)',[target]);blocked.catch(()=>{});
  await waitBlocked(db,pid);await first.query('COMMIT');
  await assert.rejects(blocked,/membership changed/);await second.query('ROLLBACK');
  // Reverse order with a new pending identity; deletion prepares before invite.
  const target2='00000000-0000-4000-8000-000000000003',code2=randomBytes(32),token2=randomBytes(32);
  await db.query("INSERT INTO app_user(id,display_name,status) VALUES($1,'Syntetisk pending 2','pending')",[target2]);
  await db.query("INSERT INTO school_invite(school_id,token_hash,created_by,expires_at,member_role) VALUES($1,$2,$3,now()+interval '1 hour','teacher')",[A,code2,U]);
  await db.query("SELECT app_create_session($1,$2,NULL,'pending',$3,NULL,now()+interval '1 hour',NULL)",[token2,target2,csrf]);
  await first.query('BEGIN');await first.query("SELECT set_config('app.user_id',$1,true)",[target2]);await first.query('SELECT app_prepare_own_account_deletion($1)',[target2]);
  await second.query('BEGIN');const invite=second.query('SELECT app_redeem_school_invite_v2($1,$2,$3)',[code2,target2,token2]);invite.catch(()=>{});
  await waitBlocked(db,pid);await first.query('SELECT app_delete_own_account($1)',[target2]);await first.query('COMMIT');
  await assert.rejects(invite,/active.*session|pending|Feide/i);await second.query('ROLLBACK');
 }finally{if(first){await first.query('ROLLBACK').catch(()=>{});first.release();}if(second){await second.query('ROLLBACK').catch(()=>{});second.release();}await db.close();}
});

test('native PG supports ordinary parallel writes and locks every retention child before journal, applying only the original batch',{skip:!url},async()=>{
 const {db,pool}=await fixture();let writer;
 const token=randomBytes(32),csrf=randomBytes(32),id='30000000-0000-4000-8000-000000000001';
 try{
  writer=await pool.connect();await writer.query('BEGIN');await writer.query("INSERT INTO school_class(school_id,name,school_year) VALUES($1,'Concurrent 1','2026')",[A]);
  await pool.query("INSERT INTO school_class(school_id,name,school_year) VALUES($1,'Concurrent 2','2026')",[A]);
  await writer.query('ROLLBACK');
  await db.query("INSERT INTO school_ops.retention_policy(school_id,version,reference,learning_days,audit_days,expires_at) VALUES($1,1,'synthetic-policy',30,30,now()+interval '1 day')",[A]);
  await db.query("INSERT INTO assignment(id,school_id,class_id,created_by,area,content_id,content_version,question_limit,title,created_at) VALUES($1,$2,'20000000-0000-4000-8000-000000000001',$3,'vocabulary','vocab.basic','1',1,'Syntetisk expired','2025-01-01')",[id,A,U]);
  await db.query("INSERT INTO assignment_recipient(school_id,assignment_id,student_id) VALUES($1,$2,$3)",[A,id,U]);
  await db.query("INSERT INTO app_session(token_hash,user_id,school_id,role,csrf_hash,expires_at) VALUES($1,$2,$3,'teacher',$4,'2999-01-01')",[token,U,A,csrf]);
  const {cleanupSchool}=await import('../../server/school-retention-operations.js');
  await writer.query('BEGIN');await writer.query('SELECT 1 FROM assignment_recipient WHERE assignment_id=$1 FOR UPDATE',[id]);
  let journalCalled=false;
  await assert.rejects(cleanupSchool(pool,{schoolId:A,policyVersion:1,apply:true,journal:{async revokeAssignments(){journalCalled=true;}}}),/lock|obtain/i);
  assert.equal(journalCalled,false);await writer.query('ROLLBACK');
  const applied=await cleanupSchool(pool,{schoolId:A,policyVersion:1,apply:true,journal:{async revokeAssignments(ids){assert.deepEqual(ids,[id]);await pool.query('UPDATE app_session SET revoked_at=now(),encrypted_id_token=NULL,acr=NULL WHERE token_hash=$1',[token]);}}});
  assert.equal(applied.deletedAssignments,1);assert.equal(applied.deletedSessions,0);
  assert.equal((await db.query('SELECT count(*)::int n FROM app_session')).rows[0].n,1);
  const repeated=await cleanupSchool(pool,{schoolId:A,policyVersion:1,apply:true,journal:{async revokeAssignments(ids){assert.equal(ids.length,0);}}});
  assert.equal(repeated.deletedSessions,1);
 }finally{if(writer){await writer.query('ROLLBACK').catch(()=>{});writer.release();}await db.close();}
});
