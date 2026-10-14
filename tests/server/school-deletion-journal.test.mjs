import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { readFile,readdir } from 'node:fs/promises';
import { createRevocationJournal } from '../../server/revocation-journal.js';
const SCHOOL='10000000-0000-4000-8000-000000000001',GRANT='10000000-0000-4000-8000-000000000002';
test('school deletion journal is atomic, idempotent, uses stable school ID and cannot be written by web runtime',async()=>{
 const db=new PGlite();try{
  await db.exec('CREATE ROLE journal_runtime NOLOGIN; CREATE ROLE journal_migrator NOLOGIN;');
  for(const f of (await readdir(new URL('../../server/journal-migrations/',import.meta.url))).filter(x=>x.endsWith('.sql')).sort())await db.exec(await readFile(new URL('../../server/journal-migrations/'+f,import.meta.url),'utf8'));
  const pool={query:db.query.bind(db),async connect(){return {query:db.query.bind(db),release(){}}}};
  const journal=createRevocationJournal(pool);
  await db.query("INSERT INTO journal_school.authorization VALUES($1,$2,'synthetic-delete',now()+interval '1 hour')",[SCHOOL,GRANT]);
  await db.exec('SET ROLE journal_runtime');
  await assert.rejects(journal.deleteSchool(SCHOOL,GRANT,'synthetic-delete'),/school|permission|operator/i);
  assert.equal((await db.query('SELECT count(*)::int n FROM entitlement_revocation')).rows[0].n,0);
  await db.exec('RESET ROLE; SET ROLE journal_school_operator');
  await journal.deleteSchool(SCHOOL,GRANT,'synthetic-delete');await journal.deleteSchool(SCHOOL,GRANT,'synthetic-delete');
  await assert.rejects(db.query("INSERT INTO entitlement_revocation(grant_id,reason) VALUES(gen_random_uuid(),'user_deleted')"),/permission/i);
  await assert.rejects(journal.deleteSchool(SCHOOL,GRANT,'wrong-reference'),/authorization/i);
  assert.equal((await journal.checkpoint()).entries,'2');
  assert.equal(await journal.isRevoked(SCHOOL),true);assert.equal(await journal.isRevoked(GRANT),true);
 }finally{await db.close();}
});

test('retention journal cannot revoke a user or school through UUID type confusion',async()=>{
 const db=new PGlite();try{
  await db.exec('CREATE ROLE journal_runtime NOLOGIN; CREATE ROLE journal_migrator NOLOGIN;');
  for(const f of (await readdir(new URL('../../server/journal-migrations/',import.meta.url))).filter(x=>x.endsWith('.sql')).sort())await db.exec(await readFile(new URL('../../server/journal-migrations/'+f,import.meta.url),'utf8'));
  await db.exec('SET ROLE journal_retention_operator');
  await db.query('SELECT journal_retention.record_assignment($1)',[SCHOOL]);
  await db.exec('RESET ROLE; SET ROLE journal_runtime');
  const journal=createRevocationJournal({query:db.query.bind(db)});
  assert.equal(await journal.isRevoked(SCHOOL),false);
  assert.equal(await journal.isAssignmentRetained(SCHOOL),true);
  const writable=createRevocationJournal({query:db.query.bind(db),async connect(){return {query:db.query.bind(db),release(){}}}});
  await writable.revoke(SCHOOL,'user_deleted');
  assert.equal(await writable.isRevoked(SCHOOL),true);
 }finally{await db.close();}
});
