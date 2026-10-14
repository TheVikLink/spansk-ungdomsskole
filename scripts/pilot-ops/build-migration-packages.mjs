import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {migrationDigests} from '../../server/reopening-gate.js';
import {resolve} from 'node:path';
const destination=process.argv[2];if(!destination)throw Error('Explicit package output directory required');await mkdir(destination,{recursive:true});
const sources=await migrationDigests();
function wrap({role,schemas,groups,versions,tracking,body,extra=''}){
 return `-- Reviewed staging migration only. Project binding is enforced by the caller.
BEGIN;
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='30s';
DO $preflight$ BEGIN
 IF current_user<>'postgres' OR session_user<>'postgres' OR current_database()<>'postgres' OR (SELECT rolsuper FROM pg_roles WHERE rolname='postgres') THEN RAISE EXCEPTION 'Non-superuser staging postgres operator required'; END IF;
 IF (SELECT count(*) FROM pg_auth_members WHERE roleid='${role}'::regrole AND member='postgres'::regrole)<>1 OR NOT EXISTS(SELECT 1 FROM pg_auth_members WHERE roleid='${role}'::regrole AND member='postgres'::regrole AND grantor='supabase_admin'::regrole AND admin_option AND NOT inherit_option AND NOT set_option) THEN RAISE EXCEPTION 'Original migration role grant differs'; END IF;
 IF EXISTS(SELECT 1 FROM pg_auth_members WHERE roleid='${role}'::regrole AND grantor='postgres'::regrole) THEN RAISE EXCEPTION 'Unexpected existing operator grant'; END IF;
 IF EXISTS(SELECT 1 FROM pg_namespace WHERE nspname IN (${schemas.map(x=>`'${x}'`).join(',')})) THEN RAISE EXCEPTION 'Private lifecycle schema already exists; inspect outcome instead of retrying'; END IF;
END $preflight$;
CREATE TEMP TABLE pilot_role_snapshot ON COMMIT DROP AS SELECT roleid,member,grantor,admin_option,inherit_option,set_option FROM pg_auth_members WHERE roleid='${role}'::regrole;
GRANT ${role} TO postgres WITH ADMIN FALSE,INHERIT FALSE,SET TRUE GRANTED BY postgres;
${groups.map(x=>`CREATE ROLE ${x} NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;`).join('\n')}
${schemas.map(x=>`CREATE SCHEMA ${x} AUTHORIZATION ${role};`).join('\n')}
SET LOCAL ROLE ${role};
DO $schema$ BEGIN
 IF (SELECT array_agg(version ORDER BY version) FROM public.${tracking}) IS DISTINCT FROM ARRAY[${versions.map(x=>`'${x}'`).join(',')}]::text[] THEN RAISE EXCEPTION 'Exact prior migration list required'; END IF;
END $schema$;
${body.trim().replace(/^BEGIN;\s*/,'').replace(/COMMIT;$/,'').replace(/^CREATE SCHEMA IF NOT EXISTS (school_ops|journal_school|journal_retention);$/gm,'')}
${extra}
DO $owner$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN (${schemas.map(x=>`'${x}'`).join(',')}) AND p.proowner<>'${role}'::regrole) THEN RAISE EXCEPTION 'Unexpected private function owner'; END IF;
END $owner$;
RESET ROLE;
REVOKE ${role} FROM postgres GRANTED BY postgres;
DO $restore$ BEGIN
 IF EXISTS((SELECT roleid,member,grantor,admin_option,inherit_option,set_option FROM pg_auth_members WHERE roleid='${role}'::regrole EXCEPT SELECT * FROM pg_temp.pilot_role_snapshot) UNION ALL (SELECT * FROM pg_temp.pilot_role_snapshot EXCEPT SELECT roleid,member,grantor,admin_option,inherit_option,set_option FROM pg_auth_members WHERE roleid='${role}'::regrole)) THEN RAISE EXCEPTION 'Migration role membership was not exactly restored'; END IF;
END $restore$;
COMMIT;
`;
}
const appVersions=Object.keys(sources).filter(x=>x.startsWith('migrations/')&&!x.includes('/010_')).map(x=>x.split('/')[1].slice(0,-4));
const journalVersions=Object.keys(sources).filter(x=>x.startsWith('journal-migrations/')&&!x.includes('/005_')).map(x=>x.split('/')[1].slice(0,-4));
const ledger=Object.entries(sources).map(([file,sha])=>`INSERT INTO school_ops.migration_digest(source,sha256) VALUES('${file}','${sha}');`).join('\n');
await writeFile(resolve(destination,'app-migration.sql'),wrap({role:'app_migrator',schemas:['school_ops'],groups:['school_data_operator','school_retention_operator'],versions:appVersions,tracking:'schema_migration',body:await readFile(new URL('../../server/migrations/010_school_lifecycle_operations.sql',import.meta.url),'utf8'),extra:ledger}));
await writeFile(resolve(destination,'journal-migration.sql'),wrap({role:'journal_migrator',schemas:['journal_school','journal_retention'],groups:['journal_school_operator','journal_retention_operator'],versions:journalVersions,tracking:'journal_migration',body:await readFile(new URL('../../server/journal-migrations/005_school_deletion.sql',import.meta.url),'utf8')}));
await writeFile(resolve(destination,'source-digests.json'),JSON.stringify({appProject:'peglwndjqnrstwnlrdsa',journalProject:'quznpkwsapehdcmicgsq',sources},null,2)+'\n');
console.log('Prepared bounded app/journal migration packages and source digest manifest; not applied.');
