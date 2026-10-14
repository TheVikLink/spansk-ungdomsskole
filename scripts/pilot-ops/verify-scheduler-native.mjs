import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
const pool=new pg.Pool({connectionString:'postgres://postgres:synthetic-scheduler-local-only@127.0.0.1:5448/postgres'});
let calls=0;const server=createServer((req,res)=>{assert.equal(req.method,'POST');assert.equal(req.headers['x-region'],'eu-central-1');assert.equal(req.headers.authorization,'Bearer synthetic-native-scheduler-caller-only-12345');calls++;res.writeHead(200,{'Content-Type':'application/json'});res.end('{"status":"completed"}');});
await new Promise(resolve=>server.listen(9015,'0.0.0.0',resolve));
try{
 await pool.query("CREATE ROLE app_runtime; CREATE ROLE school_retention_operator; CREATE ROLE school_data_operator; CREATE TABLE schema_migration(version text PRIMARY KEY); INSERT INTO schema_migration VALUES('011_bounded_retention_scheduler');");
 const file=await readFile(new URL('./scheduler.sql',import.meta.url),'utf8');
 await pool.query(file.replace('https://peglwndjqnrstwnlrdsa.supabase.co/functions/v1/school-retention','http://host.docker.internal:9015/retention'));
 await pool.query("SELECT vault.create_secret('synthetic-native-scheduler-caller-only-12345','spansk123-retention-staging-20261014'); UPDATE pilot_scheduler.configuration SET enabled=true,expires_at=now()+interval '5 minutes'; SELECT cron.schedule('spansk123-retention-staging','* * * * *','SELECT pilot_scheduler.enqueue();');");
 const deadline=Date.now()+185000;
 while(calls<2&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,1000));
 assert.ok(calls>=2,'Two actual PostgreSQL scheduled HTTP calls');
 await pool.query('SELECT pilot_scheduler.enqueue()');
 assert.equal((await pool.query('SELECT count(*)::int n FROM pilot_scheduler.request WHERE status_code=200')).rows[0].n>=2,true);
 const privileges=(await pool.query("SELECT has_table_privilege('app_runtime','net.http_request_queue','SELECT') web,has_table_privilege('school_retention_operator','vault.decrypted_secrets','SELECT') job")).rows[0];assert.deepEqual(privileges,{web:false,job:false});
 await pool.query("INSERT INTO pilot_scheduler.request(id,requested_at,status_code,observed_at,failed) VALUES(-1,now(),503,now(),true); SELECT pilot_scheduler.enqueue();");
 assert.equal((await pool.query('SELECT enabled FROM pilot_scheduler.configuration')).rows[0].enabled,false);
 console.log(JSON.stringify({scheduledCalls:calls,privateCredentialQueue:true,failedHttpDisablesJob:true,regionHeader:true,statusReceipt:true}));
}finally{await pool.query("SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname LIKE 'spansk123-retention-%'").catch(()=>{});await pool.end();await new Promise(resolve=>server.close(resolve));}
