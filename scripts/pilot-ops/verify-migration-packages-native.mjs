import pg from 'pg';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.env.PILOT_PACKAGE_DATABASE_URL;const destination=process.argv[2];
if(!url||!destination||new URL(url).hostname!=='127.0.0.1')throw Error('Fresh loopback disposable package database required');
const bootstrap=new pg.Pool({connectionString:url,max:1});
const rootUrl=new URL(url);rootUrl.username='pilot_package_root';rootUrl.password='synthetic-pilot-package-root-only';
rootUrl.pathname='/postgres';const root=new pg.Pool({connectionString:rootUrl.toString(),max:1});
try{
 if(!process.argv.includes('--resume-packages')){
 await bootstrap.query("DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='pilot_package_root') THEN CREATE ROLE pilot_package_root LOGIN SUPERUSER PASSWORD 'synthetic-pilot-package-root-only'; END IF; END $$");
 await root.query(`ALTER ROLE postgres RENAME TO supabase_admin;
 CREATE ROLE postgres LOGIN NOSUPERUSER CREATEROLE CREATEDB BYPASSRLS PASSWORD 'synthetic-pilot-package-local-only';
 CREATE ROLE app_migrator NOLOGIN;CREATE ROLE journal_migrator NOLOGIN;
 CREATE ROLE app_runtime NOLOGIN NOBYPASSRLS;CREATE ROLE journal_runtime NOLOGIN NOBYPASSRLS;CREATE ROLE school_owner_provisioner NOLOGIN NOBYPASSRLS;
 GRANT app_migrator,journal_migrator TO postgres WITH ADMIN TRUE,INHERIT FALSE,SET FALSE;`);
 await root.query('CREATE DATABASE pilot_app OWNER postgres');await root.query('CREATE DATABASE pilot_journal OWNER postgres');
 for(const [database,role,folder,maximum] of [['pilot_app','app_migrator','migrations','009'],['pilot_journal','journal_migrator','journal-migrations','004']]){
  rootUrl.pathname='/'+database;const pool=new pg.Pool({connectionString:rootUrl.toString(),max:1});
  try{
   await pool.query(`ALTER SCHEMA public OWNER TO ${role}; SET ROLE ${role}`);
   for(const file of (await readdir(new URL('../../server/'+folder+'/',import.meta.url))).filter(x=>x.endsWith('.sql')&&x.slice(0,3)<=maximum).sort())await pool.query(await readFile(new URL('../../server/'+folder+'/'+file,import.meta.url),'utf8'));
  }finally{await pool.end();}
 }

 }
 for(const [database,role,file,schema] of [['pilot_journal','journal_migrator','journal-migration.sql','journal_school'],['pilot_app','app_migrator','app-migration.sql','school_ops']]){
  const connection=new URL(url);connection.pathname='/'+database;const pool=new pg.Pool({connectionString:connection.toString(),max:1,statement_timeout:30000});
  try{
   const sql=(await readFile(destination+'/'+file,'utf8')).replace("current_database()<>'postgres'",`current_database()<>'${database}'`);
   const prior=await pool.query("SELECT roleid,member,grantor,admin_option,inherit_option,set_option FROM pg_auth_members WHERE roleid=$1::regrole ORDER BY member,grantor",[role]);
   await assert.rejects(pool.query(sql.replace('\nRESET ROLE;',()=>"\nDO $$ BEGIN RAISE EXCEPTION 'synthetic failure after DDL'; END $$;\nRESET ROLE;")),/synthetic failure/);
   await pool.query('ROLLBACK');
   assert.deepEqual((await pool.query("SELECT roleid,member,grantor,admin_option,inherit_option,set_option FROM pg_auth_members WHERE roleid=$1::regrole ORDER BY member,grantor",[role])).rows,prior.rows);
   assert.equal((await pool.query('SELECT count(*)::int n FROM pg_namespace WHERE nspname=$1',[schema])).rows[0].n,0);
   console.log(`${file}: injected failure after DDL rolled back schema, marker and all temporary grants.`);
   await pool.query(sql);
   const grants=await pool.query("SELECT g.rolname AS grantor,a.admin_option,a.inherit_option,a.set_option FROM pg_auth_members a JOIN pg_roles g ON g.oid=a.grantor WHERE roleid=$1::regrole AND member='postgres'::regrole",[role]);
   assert.deepEqual(grants.rows,[{grantor:'supabase_admin',admin_option:true,inherit_option:false,set_option:false}]);
   const owners=await pool.query('SELECT DISTINCT p.proowner::regrole::text owner FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=$1',[schema]);assert.deepEqual(owners.rows,[{owner:role}]);
   await assert.rejects(pool.query(`SET ROLE ${role}`),/permission/);
   console.log(`${file}: exact original grants restored; private functions owned by ${role}; SET denied.`);
  }finally{await pool.end();}
 }
}catch(error){console.error('Native package verification failed:',error.message);process.exitCode=1;}finally{await Promise.all([bootstrap.end(),root.end()]);}
