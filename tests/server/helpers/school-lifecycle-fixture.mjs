import {migrationDigests} from '../../../server/reopening-gate.js';
import { PGlite } from '@electric-sql/pglite';
import { readFile,readdir } from 'node:fs/promises';
const A='10000000-0000-4000-8000-000000000001',B='10000000-0000-4000-8000-000000000002',U='00000000-0000-4000-8000-000000000001';
export async function createLifecycleFixture(db=new PGlite()){
 await db.exec("DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='app_runtime') THEN CREATE ROLE app_runtime NOLOGIN; END IF; IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='school_owner_provisioner') THEN CREATE ROLE school_owner_provisioner NOLOGIN; END IF; IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='app_migrator') THEN CREATE ROLE app_migrator NOLOGIN; END IF; END $$;");
 for(const file of (await readdir(new URL('../../../server/migrations/',import.meta.url))).filter(x=>x.endsWith('.sql')).sort()) await db.exec(await readFile(new URL('../../../server/migrations/'+file,import.meta.url),'utf8'));
 for(const [source,sha] of Object.entries(await migrationDigests()))await db.query('INSERT INTO school_ops.migration_digest VALUES($1,$2)',[source,sha]);
 await db.exec(`INSERT INTO school_owner(id,display_name,external_reference,status,verification_reference,verified_by,verified_at) VALUES ('11000000-0000-4000-8000-000000000001','Syntetisk eier','synthetic-lifecycle','active','synthetic-only','local-test',now());
 INSERT INTO school(id,owner_id,feide_org_id,name) VALUES ('${A}','11000000-0000-4000-8000-000000000001','synthetic-a','Syntetisk A'),('${B}','11000000-0000-4000-8000-000000000001','synthetic-b','Syntetisk B');
 INSERT INTO app_user(id,display_name,status) VALUES('${U}','Syntetisk delt lærer','active');
 INSERT INTO school_membership(school_id,user_id,role) VALUES('${A}','${U}','teacher'),('${B}','${U}','teacher');
 INSERT INTO school_class(id,school_id,name,school_year) VALUES('20000000-0000-4000-8000-000000000001','${A}','A-klassen','2026'),('20000000-0000-4000-8000-000000000002','${B}','B-klassen','2026');
 INSERT INTO school_ops.authorization(school_id,reference,operation,operator_id,expires_at) VALUES('${A}','synthetic-export','export','local-test',now()+interval '1 hour'),('${A}','synthetic-delete','delete','local-test',now()+interval '1 hour');`);
 const pool={async connect(){return {query:db.query.bind(db),release(){}}}};
 return {db,pool:db.connect?db:pool};
}
