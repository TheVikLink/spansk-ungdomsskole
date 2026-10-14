import {discardPlatformAdministration,platformAdministrationKeys} from './retention-environment.js';
discardPlatformAdministration(Deno.env);
const processModule=await import('node:process');
for(const key of platformAdministrationKeys)delete processModule.default.env[key];
if(platformAdministrationKeys.some(key=>key in processModule.default.env))throw Error('Scheduler administrator environment remains available');
const [{default:pg},{runRetentionCycle},{createRetentionHandler}]=await Promise.all([import('npm:pg@8.23.0'),import('./retention-job.js'),import('./retention-handler.js')]);
const APP='peglwndjqnrstwnlrdsa',JOURNAL='quznpkwsapehdcmicgsq';
function pool(project,key,role){
 const raw=Deno.env.get(key);if(!raw)throw Error('Retention database configuration missing');
 const url=new URL(raw);
 if(url.hostname!==`db.${project}.supabase.co`||url.pathname!=='/postgres'||decodeURIComponent(url.username)!==role||url.port!=='5432')throw Error('Dedicated staging database/role binding required');
 for(const option of ['ssl','sslmode','sslcert','sslkey','sslrootcert','uselibpqcompat','sslnegotiation'])url.searchParams.delete(option);
 const ca=Deno.env.get(key+'_CA');if(!ca)throw Error('Verified database CA required');
 return new pg.Pool({connectionString:url.toString(),ssl:{rejectUnauthorized:true,ca},max:1,connectionTimeoutMillis:5000,statement_timeout:5000,idleTimeoutMillis:1000,application_name:'spansk123-retention-staging'});
}
const handler=createRetentionHandler({secret:Deno.env.get('SCHOOL_RETENTION_CALLER_SECRET'),async run(){
 if(Deno.env.get('SB_REGION')!=='eu-central-1')throw Error('Dedicated EU scheduler region required');
 const app=pool(APP,'SCHOOL_RETENTION_DATABASE_URL','school_retention_job_20261014');
 const journal=pool(JOURNAL,'SCHOOL_RETENTION_JOURNAL_URL','journal_retention_job_20261014');
 try{return await runRetentionCycle({pool:app,journalPool:journal,apply:true,globalPolicyVersion:1});}
 finally{await Promise.all([app.end(),journal.end()]);}
}});
Deno.serve(handler);
