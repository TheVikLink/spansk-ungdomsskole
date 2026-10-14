import pg from 'pg';
import {readFile,writeFile,stat} from 'node:fs/promises';
import {rootCertificates} from 'node:tls';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {exportSchool,deleteSchool} from '../../server/school-lifecycle.js';
const path='/private/tmp/spansk123-pilot-private-20261014/operators.json';
assert.equal((await stat(path)).mode&0o077,0,'Private credentials file required');
const config=JSON.parse(await readFile(path,'utf8'));
assert.equal(config.app.project,'peglwndjqnrstwnlrdsa');assert.equal(config.journal.project,'quznpkwsapehdcmicgsq');
assert.equal(config.reference,'synthetic-pilot-ops-2026-10-14');assert.equal(config.schoolId,'b76aeea7-ecbf-48b9-93ae-80f64a65baba');
assert.ok(Date.parse(config.expiry)>Date.now());
const ca=await readFile('/private/tmp/spansk123-supabase-ca-2026-10-14.crt','utf8');
function pool(entry){assert.ok(['school_data_test_20261014','journal_school_test_20261014'].includes(entry.role));return new pg.Pool({host:'aws-0-eu-north-1.pooler.supabase.com',port:5432,user:entry.role+'.'+entry.project,password:entry.password,database:'postgres',ssl:{rejectUnauthorized:true,ca:[...rootCertificates,ca]},max:1,connectionTimeoutMillis:7000,statement_timeout:10000,application_name:'spansk123-synthetic-lifecycle-verification'});}
const app=pool(config.app);let journal;
try{
 assert.equal((await app.query('SELECT current_user AS role')).rows[0].role,config.app.role);
 await assert.rejects(app.query('SELECT * FROM app_user'),/permission denied/);
 await assert.rejects(exportSchool(app,{schoolId:config.schoolId,authorizationReference:'unauthorized-synthetic-reference'}),/authorization/i);
 const mode=process.argv[2]??'probe';
 if(mode==='export'||mode==='inspect-export-shape'){
  const data=await exportSchool(app,{schoolId:config.schoolId,authorizationReference:config.reference});
  assert.equal(data.school.id,config.schoolId);assert.equal(data.users.length,2);
  const bytes=JSON.stringify(data,null,2)+'\n';
  if(mode==='inspect-export-shape'){
   const fields=[];const walk=(value,path)=>{if(!value||typeof value!=='object')return;for(const [key,item] of Object.entries(value)){if(key==='audio')fields.push({path:path+'.'+key,type:typeof item,isArray:Array.isArray(item),length:Array.isArray(item)?item.length:null,empty:item===null||(Array.isArray(item)&&item.length===0)});walk(item,path+'.'+key);}};walk(data,'export');console.log(JSON.stringify({audioFields:fields}));
  }else{
  for(const key of ['token_hash','csrf_hash','encrypted_id_token','subject','issuer','answer_text','audio_data','recording'])assert.equal(new RegExp('"'+key+'"\\s*:').test(bytes),false,key);
  const verifyAudio=(value)=>{if(!value||typeof value!=='object')return;for(const [key,item] of Object.entries(value)){if(key==='audio')assert.equal(item,null,'This vocabulary fixture permits only null audio metadata');verifyAudio(item);}};verifyAudio(data);
  await writeFile('/Users/olehenrikvik/spansk-ungdomsskole/output/pilot-ops-2026-10-14/synthetic-school-export.json',bytes,{mode:0o600,flag:'wx'});
  console.log(JSON.stringify({exported:true,sha256:createHash('sha256').update(bytes).digest('hex'),collections:Object.fromEntries(Object.entries(data).filter(([,value])=>Array.isArray(value)).map(([key,value])=>[key,value.length])),secretFieldsAbsent:true}));
  }
 }else if(mode==='delete-preview'){
  const report=await deleteSchool(app,{schoolId:config.schoolId,authorizationReference:config.reference});console.log(JSON.stringify({reportOnly:!report.applied,schoolId:report.schoolId}));
 }else if(mode==='apply-delete'){
  assert.equal(process.argv[3],'apply-synthetic-school-b76aeea7', 'Exact reviewed synthetic confirmation required');
  journal=pool(config.journal);
  assert.equal((await journal.query('SELECT current_user AS role')).rows[0].role,config.journal.role);
  const report=await deleteSchool(app,{schoolId:config.schoolId,authorizationReference:config.reference,apply:true,journal:{deleteSchool:async(school,grant,ref)=>journal.query('SELECT journal_school.record_deletion($1,$2,$3)',[school,grant,ref])}});
  await assert.rejects(exportSchool(app,{schoolId:config.schoolId,authorizationReference:config.reference}),/Deleted school/);
  console.log(JSON.stringify({deleted:report.applied,schoolId:config.schoolId,exportAfterDeletionDenied:true}));
 }else{assert.equal(mode,'probe');console.log(JSON.stringify({connectedWithVerifiedTls:true,role:config.app.role,directUserReadDenied:true,unauthorizedExportDenied:true}));}
}catch(error){console.error(JSON.stringify({operationFailed:true,code:error.code??null,message:error.message.replaceAll(config.app.password,'[redacted]').replaceAll(config.journal.password,'[redacted]')}));process.exitCode=1;}
finally{await Promise.all([app.end(),journal?.end()]);}
