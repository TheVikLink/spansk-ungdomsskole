import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const raw=process.env.PILOT_PACKAGE_DATABASE_URL,folder=process.argv[2];
if(!raw||new URL(raw).hostname!=='127.0.0.1'||!folder)throw Error('Disposable loopback package fixture required');
const original=new URL(raw);const roots=[];
function connection(database,user,password){const url=new URL(original);url.pathname='/'+database;url.username=user;url.password=password;return new pg.Pool({connectionString:url.toString(),max:1,statement_timeout:10000});}
const rootApp=connection('pilot_app','pilot_package_root','synthetic-pilot-package-root-only');const rootJournal=connection('pilot_journal','pilot_package_root','synthetic-pilot-package-root-only');roots.push(rootApp,rootJournal);
const actorApp=connection('pilot_app','postgres','synthetic-pilot-package-local-only');const actorJournal=connection('pilot_journal','postgres','synthetic-pilot-package-local-only');roots.push(actorApp,actorJournal);
const ref='synthetic-pilot-ops-2026-10-14';
try{
 let update=await readFile(folder+'/bundle-digest-update.sql','utf8');update=update.replace("current_database()<>'postgres'","current_database()<>'pilot_app'");await actorApp.query(update);
 const owner=randomUUID(),teacher=randomUUID(),student=randomUUID();
 await rootApp.query("INSERT INTO school_owner(id,display_name,external_reference,status,verification_reference,verified_by,verified_at) VALUES($1,'Syntetisk tidligere eier','synthetic-feide-e2e-2026-10-13','active','synthetic-only','native',now())",[owner]);
 await rootApp.query("INSERT INTO school(id,owner_id,feide_org_id,name) VALUES('d7d3415b-cec0-4055-ac6e-72cc9c58ff46',$1,'synthetic-old','Syntetisk tidligere skole')",[owner]);
 for(const [user,name,role] of [[teacher,'Frank Foreleser Føllesen','school_admin'],[student,'Andreas Foss','student']]){
  await rootApp.query("INSERT INTO app_user(id,display_name,status) VALUES($1,$2,'active')",[user,name]);await rootApp.query("INSERT INTO school_membership(school_id,user_id,role) VALUES('d7d3415b-cec0-4055-ac6e-72cc9c58ff46',$1,$2)",[user,role]);
  await rootApp.query("INSERT INTO feide_identity(issuer,subject,user_id) VALUES('https://auth.dataporten.no',$1,$2)",['synthetic-native-'+user,user]);
 }
 await actorApp.query((await readFile(folder+'/synthetic-lifecycle-fixture.sql','utf8')).replace("current_database()<>'postgres'","current_database()<>'pilot_app'"));
 const school=(await rootApp.query('SELECT s.id FROM school s JOIN school_owner o ON o.id=s.owner_id WHERE o.external_reference=$1',[ref])).rows[0].id;
 const dates={'__JOB_EXPIRES__':new Date(Date.now()+7*86400000).toISOString(),'__OPERATOR_EXPIRES__':new Date(Date.now()+90*60000).toISOString()};
 const replacements={...dates,'__APP_JOB_PASSWORD__':'synthetic-app-job-local-only','__APP_OPERATOR_PASSWORD__':'synthetic-app-op-local-only','__JOURNAL_JOB_PASSWORD__':'synthetic-journal-job-local-only','__JOURNAL_OPERATOR_PASSWORD__':'synthetic-journal-op-local-only'};
 for(const [file,pool] of [['app-job-roles.template.sql',actorApp],['journal-job-roles.template.sql',actorJournal]]){let sql=await readFile(folder+'/'+file,'utf8');for(const [key,value] of Object.entries(replacements))sql=sql.replaceAll(key,value);await pool.query(sql);}
 const jobApp=connection('pilot_app','school_retention_job_20261014',replacements.__APP_JOB_PASSWORD__);const jobJournal=connection('pilot_journal','journal_retention_job_20261014',replacements.__JOURNAL_JOB_PASSWORD__);const opApp=connection('pilot_app','school_data_test_20261014',replacements.__APP_OPERATOR_PASSWORD__);roots.push(jobApp,jobJournal,opApp);
 await assert.rejects(jobApp.query('SELECT * FROM app_user'),/permission/);await assert.rejects(jobApp.query('SET ROLE app_migrator'),/permission/);
 await assert.rejects(jobApp.query('SELECT school_ops.export_school($1,$2)',[school,ref]),/permission/);await assert.rejects(jobApp.query('SELECT school_ops.prepare_deletion($1,$2)',[school,ref]),/permission/);
 await assert.rejects(jobJournal.query("INSERT INTO entitlement_revocation(grant_id,reason) VALUES(gen_random_uuid(),'user_deleted')"),/permission/);await assert.rejects(jobJournal.query('SET ROLE journal_migrator'),/permission/);
 const exported=(await opApp.query('SELECT school_ops.export_school($1,$2) AS data',[school,ref])).rows[0].data;assert.equal(exported.users.length,2);assert.equal(exported.memberships.find(x=>x.user_id===teacher).role,'teacher');
 assert.equal((await rootApp.query("SELECT role FROM school_membership WHERE school_id='d7d3415b-cec0-4055-ac6e-72cc9c58ff46' AND user_id=$1",[teacher])).rows[0].role,'school_admin');
 const {runRetentionCycle}=await import('../../server/retention-job.js');const result=await runRetentionCycle({pool:jobApp,journalPool:jobJournal,apply:true,globalPolicyVersion:1});assert.equal(result.schools.length,1);
 assert.equal((await jobApp.query('SELECT school_ops.job_health() AS health')).rows[0].health.healthy,true);
 const grants=(await actorApp.query("SELECT g.rolname grantor,a.admin_option,a.inherit_option,a.set_option FROM pg_auth_members a JOIN pg_roles g ON g.oid=a.grantor WHERE roleid='app_migrator'::regrole AND member='postgres'::regrole")).rows;assert.deepEqual(grants,[{grantor:'supabase_admin',admin_option:true,inherit_option:false,set_option:false}]);
 console.log(JSON.stringify({result:'passed',fixtureSchools:1,sharedUsers:2,teacherRoleOnlyInNewFixture:true,originalAdminPreserved:true,migratorGrantsRestored:true,jobCannotReadUsers:true,jobCannotExportOrPurge:true,journalCannotDeleteAccounts:true,boundedJobCompleted:true}));
}catch(error){console.error('Native follow-up verification failed:',error.message);process.exitCode=1;}finally{await Promise.all(roots.map(p=>p.end()));}
