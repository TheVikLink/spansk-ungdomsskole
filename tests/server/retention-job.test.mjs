import test from 'node:test';
import assert from 'node:assert/strict';
import {createLifecycleFixture} from './helpers/school-lifecycle-fixture.mjs';
import {runRetentionCycle} from '../../server/retention-job.js';
test('automatic retention uses only registered policy and stops on journal failure; separate global expiry preserves live sessions',async()=>{
 const {db,pool}=await createLifecycleFixture();pool.query=db.query.bind(db);
 try{
  await db.exec(`INSERT INTO school_ops.global_expiry_policy(version,reference,expires_at) VALUES(1,'synthetic-global-expiry',now()+interval '1 day');
  INSERT INTO app_session(token_hash,user_id,school_id,role,csrf_hash,expires_at) VALUES(decode(repeat('01',32),'hex'),'00000000-0000-4000-8000-000000000001',NULL,'select_school',decode(repeat('02',32),'hex'),'2999-01-01'),(decode(repeat('03',32),'hex'),'00000000-0000-4000-8000-000000000001',NULL,'select_school',decode(repeat('04',32),'hex'),'2025-01-01');
  INSERT INTO school_ops.retention_policy(school_id,version,reference,learning_days,audit_days,expires_at) VALUES('10000000-0000-4000-8000-000000000001',1,'synthetic-policy',30,30,now()+interval '1 day');
  INSERT INTO assignment(school_id,class_id,created_by,area,content_id,content_version,question_limit,title,created_at) VALUES('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','vocabulary','vocab.basic','1',1,'Syntetisk utløpt','2025-01-01');
  SET ROLE school_retention_operator;`);
  const preview=await runRetentionCycle({pool,journalPool:null,globalPolicyVersion:1});
  await db.exec('BEGIN');
  const prepared=(await db.query("SELECT school_ops.prepare_retention('10000000-0000-4000-8000-000000000001',1) AS report")).rows[0].report;
  for(const key of ['expiredSessionHashes','auditIds','schoolInvitationIds','classInvitationIds'])assert.equal(key in prepared,false);
  await db.exec('ROLLBACK');
  assert.equal(preview.schools.length,1);assert.equal(preview.schools[0].assignments,1);assert.equal(preview.technical.sessions,1);
  await assert.rejects(runRetentionCycle({pool,journalPool:{async query(){throw Error('journal unavailable');}},apply:true}),/Retention cycle incomplete/);
  await db.exec('RESET ROLE');assert.equal((await db.query('SELECT count(*)::int n FROM assignment')).rows[0].n,1);
  await db.exec('SET ROLE school_retention_operator');
  const calls=[];const r=await runRetentionCycle({pool,journalPool:{async query(sql,args){calls.push({sql,args});}},apply:true,globalPolicyVersion:1});
  assert.equal(calls.length,1);assert.equal(r.technical.sessions,1);
  await db.exec('RESET ROLE');assert.equal((await db.query('SELECT count(*)::int n FROM app_session')).rows[0].n,1);
  const repeated=await runRetentionCycle({pool,journalPool:null});assert.equal(repeated.schools[0].assignments,0);
 }finally{await db.close();}
});

test('school policy batches advance across 21 schools, global expiry is bounded and failure/staleness are visible',async()=>{
 const {db,pool}=await createLifecycleFixture();pool.query=db.query.bind(db);
 try{
  await db.exec(`INSERT INTO school(id,owner_id,feide_org_id,name) SELECT ('40000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,'11000000-0000-4000-8000-000000000001','synthetic-'||i,'Syntetisk batch '||i FROM generate_series(1,21) i;
   INSERT INTO school_ops.retention_policy(school_id,version,reference,learning_days,audit_days,expires_at) SELECT id,1,'synthetic-batch',30,30,now()+interval '1 day' FROM school WHERE feide_org_id LIKE 'synthetic-%';
   INSERT INTO school_ops.global_expiry_policy(version,reference,expires_at) VALUES(1,'synthetic-technical',now()+interval '1 day');
   INSERT INTO oidc_transaction(handle_hash,expected_state,expected_nonce,encrypted_pkce_verifier,kind,expires_at) SELECT decode(lpad(to_hex(i),64,'0'),'hex'),'synthetic-state','synthetic-nonce',decode('01','hex'),'login','2025-01-01' FROM generate_series(1,105) i;
   SET ROLE school_retention_operator;`);
  const ids=new Set();for(let i=0;i<5;i++){const batch=await db.query('SELECT * FROM school_ops.retention_targets(true)');assert.equal(batch.rows.length,5);for(const row of batch.rows)ids.add(row.school_id);}assert.equal(ids.size,23);
  const expiry=await db.query('SELECT school_ops.cleanup_global_expiry(1,true) AS report');assert.equal(expiry.rows[0].report.oidcTransactions,100);
  assert.equal((await db.query('SELECT school_ops.cleanup_global_expiry(1,true) AS report')).rows[0].report.oidcTransactions,5);
  const id=(await db.query('SELECT school_ops.begin_job() AS id')).rows[0].id;
  await db.query('SELECT school_ops.finish_job($1,false,0,0)',[id]);
  assert.equal((await db.query('SELECT school_ops.job_health() AS report')).rows[0].report.healthy,false);
  const success=(await db.query('SELECT school_ops.begin_job() AS id')).rows[0].id;await db.query('SELECT school_ops.finish_job($1,true,1,1)',[success]);
  assert.equal((await db.query('SELECT school_ops.job_health() AS report')).rows[0].report.healthy,true);
  await db.exec("RESET ROLE; UPDATE school_ops.job_run SET started_at='2025-01-01',finished_at='2025-01-01'; SET ROLE school_retention_operator;");
  assert.equal((await db.query('SELECT school_ops.job_health() AS report')).rows[0].report.healthy,false);
 }finally{await db.close();}
});

test('one failing school does not starve another approved school and the run remains failed',async()=>{
 const {db,pool}=await createLifecycleFixture();pool.query=db.query.bind(db);
 try{
  await db.exec(`INSERT INTO school_ops.retention_policy(school_id,version,reference,learning_days,audit_days,expires_at) SELECT id,1,'synthetic-policy',30,30,now()+interval '1 day' FROM school;
  INSERT INTO assignment(id,school_id,class_id,created_by,area,content_id,content_version,question_limit,title,created_at) VALUES
   ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','vocabulary','vocab.basic','1',1,'Syntetisk feil','2025-01-01'),
   ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','vocabulary','vocab.basic','1',1,'Syntetisk riktig','2025-01-01'); SET ROLE school_retention_operator;`);
  await assert.rejects(runRetentionCycle({pool,apply:true,journalPool:{async query(_sql,args){if(args[0].includes('30000000-0000-4000-8000-000000000001'))throw Error('injected journal failure');}}}),/cycle incomplete/);
  assert.equal((await db.query('SELECT school_ops.job_health() AS health')).rows[0].health.latestStatus,'failed');
  await db.exec('RESET ROLE');const assignments=(await db.query('SELECT id FROM assignment ORDER BY id')).rows;
  assert.deepEqual(assignments,[{id:'30000000-0000-4000-8000-000000000001'}]);
 }finally{await db.close();}
});
