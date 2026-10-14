import test from 'node:test';
import assert from 'node:assert/strict';
import { createLifecycleFixture as fixture } from './helpers/school-lifecycle-fixture.mjs';
import { readFile, readdir } from 'node:fs/promises';
import { exportSchool, deleteSchool } from '../../server/school-lifecycle.js';
const A='10000000-0000-4000-8000-000000000001',B='10000000-0000-4000-8000-000000000002';
const U='00000000-0000-4000-8000-000000000001';
test('school export is complete for the authorized tenant and excludes identities and secrets',async()=>{
 const {db,pool}=await fixture();try{
  const data=await exportSchool(pool,{schoolId:A,authorizationReference:'synthetic-export'});
  assert.equal(data.school.id,A);assert.equal(data.users.length,1);assert.equal(data.classes.length,1);
  assert.equal(data.memberships.length,1);assert.equal(data.classes[0].name,'A-klassen');
  assert.doesNotMatch(JSON.stringify(data),/B-klassen|synthetic-b|token_hash|subject|encrypted_id_token|csrf_hash/);
  await assert.rejects(exportSchool(pool,{schoolId:B,authorizationReference:'synthetic-export'}),/authorization/i);
  await db.exec('SET ROLE app_runtime');
  await assert.rejects(exportSchool(pool,{schoolId:A,authorizationReference:'synthetic-export'}),/permission/i);
 }finally{await db.close();}
});
test('school deletion defaults to rollback preview, journals before commit and preserves shared users and other tenants',async()=>{
 const {db,pool}=await fixture();try{
  const journalCalls=[];const journal={async deleteSchool(schoolId,grantId){journalCalls.push({schoolId,grantId});}};
  assert.equal((await deleteSchool(pool,{schoolId:A,authorizationReference:'synthetic-delete'})).applied,false);
  assert.equal((await db.query('SELECT count(*)::int n FROM school_class')).rows[0].n,2);
  await assert.rejects(deleteSchool(pool,{schoolId:A,authorizationReference:'synthetic-delete',apply:true,journal:{async deleteSchool(){throw Error('journal unavailable');}}}),/journal unavailable/);
  assert.equal((await db.query('SELECT status FROM school WHERE id=$1',[A])).rows[0].status,'active');
  await deleteSchool(pool,{schoolId:A,authorizationReference:'synthetic-delete',apply:true,journal});
  assert.equal(journalCalls.length,1);
  await assert.rejects(exportSchool(pool,{schoolId:A,authorizationReference:'synthetic-export'}),/Deleted school/);
  assert.equal((await db.query('SELECT status FROM school WHERE id=$1',[A])).rows[0].status,'deleted');
  assert.equal((await db.query('SELECT count(*)::int n FROM school_membership WHERE school_id=$1',[A])).rows[0].n,0);
  assert.equal((await db.query('SELECT count(*)::int n FROM school_class WHERE school_id=$1',[B])).rows[0].n,1);
  assert.equal((await db.query('SELECT status FROM app_user WHERE id=$1',[U])).rows[0].status,'active');
  await assert.rejects(db.query("UPDATE school SET status='active' WHERE id=$1",[A]),/deleted|avviklet/i);
  await assert.rejects(db.query("INSERT INTO school_class(school_id,name,school_year) VALUES($1,'After deletion','2026')",[A]),/inactive|active/i);
  await deleteSchool(pool,{schoolId:A,authorizationReference:'synthetic-delete',apply:true,journal});
 }finally{await db.close();}
});

test('restoring an older school snapshot replays stable school deletion, and unknown journal events fail closed',async()=>{
 const {db,pool}=await fixture();try{
  const {verifyRestoredSchoolDatabase}=await import('../../server/recovery.js');
  const entries=[{id:'1',grant_id:'10000000-0000-4000-8000-000000000099',subject_id:A,reason:'school_deleted'}];
  const journal={async checkpoint(){return {sequence:'1',entries:'1'};},async entriesThrough(){return entries;}};
  await db.query('UPDATE school SET access_grant_id=$1 WHERE id=$2',['10000000-0000-4000-8000-000000000098',A]);
  await verifyRestoredSchoolDatabase({pool,journal,snapshotCheckpoint:{sequence:'0',entries:'0'}});
  assert.equal((await db.query('SELECT status FROM school WHERE id=$1',[A])).rows[0].status,'deleted');
  assert.equal((await db.query('SELECT count(*)::int n FROM school_class WHERE school_id=$1',[A])).rows[0].n,0);
  entries[0].reason='unrecognized-future-revocation';
  await assert.rejects(verifyRestoredSchoolDatabase({pool,journal,snapshotCheckpoint:{sequence:'0',entries:'0'}}),/Unsupported journal/);
 }finally{await db.close();}
});

test('retention is policy-bound, covers open closed and undated assignments, and scheduler cannot export or delete schools',async()=>{
 const {db,pool}=await fixture();try{
  const {cleanupSchool}=await import('../../server/school-retention-operations.js');
  await db.exec(`INSERT INTO assignment(id,school_id,class_id,created_by,area,content_id,content_version,question_limit,title,status,due_at,created_at) VALUES
  ('30000000-0000-4000-8000-000000000001','${A}','20000000-0000-4000-8000-000000000001','${U}','vocabulary','vocab.basic','1',1,'Åpen gammel','published','2025-01-01','2025-01-01'),
  ('30000000-0000-4000-8000-000000000002','${A}','20000000-0000-4000-8000-000000000001','${U}','vocabulary','vocab.basic','1',1,'Uten frist','closed',NULL,'2025-01-01'),
  ('30000000-0000-4000-8000-000000000003','${A}','20000000-0000-4000-8000-000000000001','${U}','vocabulary','vocab.basic','1',1,'Fremtidig','published','2999-01-01','2025-01-01');
  INSERT INTO school_ops.retention_policy(school_id,version,reference,learning_days,audit_days,expires_at) VALUES('${A}',1,'synthetic-policy',30,30,now()+interval '1 day');`);
  await db.exec('SET ROLE school_retention_operator');
  await assert.rejects(exportSchool(pool,{schoolId:A,authorizationReference:'synthetic-export'}),/permission/i);
  await assert.rejects(deleteSchool(pool,{schoolId:A,authorizationReference:'synthetic-delete'}),/permission/i);
  await assert.rejects(cleanupSchool(pool,{schoolId:B,policyVersion:1}),/policy/i);
  const preview=await cleanupSchool(pool,{schoolId:A,policyVersion:1});
  assert.equal(preview.assignmentIds.length,2);assert.equal(preview.applied,false);
  const calls=[];
  await cleanupSchool(pool,{schoolId:A,policyVersion:1,apply:true,journal:{async revoke(id,reason){calls.push({id,reason});}}});
  assert.equal(calls.length,2);assert.ok(calls.every(x=>x.reason==='assignment_retention'));
  await db.exec('RESET ROLE');
  assert.equal((await db.query('SELECT count(*)::int n FROM assignment WHERE school_id=$1',[A])).rows[0].n,1);
  assert.equal((await db.query('SELECT count(*)::int n FROM school_class WHERE school_id=$1',[B])).rows[0].n,1);
 }finally{await db.close();}
});

test('identity without remaining schools can sign in pending after purge, but blocked users cannot',async()=>{
 const {db,pool}=await fixture();try{
  await db.query("INSERT INTO feide_identity(issuer,subject,user_id) VALUES('https://synthetic.test','synthetic-shared',$1)",[U]);
  await db.query("INSERT INTO school_ops.authorization VALUES($1,'synthetic-delete-b','delete','local-test',now()+interval '1 hour')",[B]);
  const journal={async deleteSchool(){}};
  await deleteSchool(pool,{schoolId:A,authorizationReference:'synthetic-delete',apply:true,journal});
  let linked=await db.query("SELECT * FROM app_link_feide_identity('https://synthetic.test','synthetic-shared','Syntetisk lærer')");
  assert.equal(linked.rows[0].school_id,B);
  await deleteSchool(pool,{schoolId:B,authorizationReference:'synthetic-delete-b',apply:true,journal});
  linked=await db.query("SELECT * FROM app_link_feide_identity('https://synthetic.test','synthetic-shared','Syntetisk lærer')");
  assert.equal(linked.rows[0].account_status,'pending');
  await db.query("SELECT app_create_session($1,$2,NULL,'pending',$3,NULL,now()+interval '1 hour',$4)",[Buffer.alloc(32,1),U,Buffer.alloc(32,2),'urn:mace:feide.no:auth:level:fad08:3']);
  assert.equal((await db.query('SELECT count(*)::int n FROM app_session')).rows[0].n,1);
  const resolved=await db.query('SELECT * FROM app_resolve_session($1,now())',[Buffer.alloc(32,1)]);
  assert.equal(resolved.rows[0].role,'pending');
  await db.query("UPDATE app_user SET status='blocked' WHERE id=$1",[U]);
  await assert.rejects(db.query("SELECT app_create_session($1,$2,NULL,'pending',$3,NULL,now()+interval '1 hour',NULL)",[Buffer.alloc(32,3),U,Buffer.alloc(32,4)]),/invalid pending/);
 }finally{await db.close();}
});
