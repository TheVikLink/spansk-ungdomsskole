export function roleTransaction(role,body){
 if(!['app_migrator','journal_migrator'].includes(role))throw Error('Only staging migration roles are supported');
 return `BEGIN;
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='30s';
DO $preflight$ BEGIN
 IF current_user<>'postgres' OR session_user<>'postgres' OR current_database()<>'postgres' OR (SELECT rolsuper FROM pg_roles WHERE rolname='postgres') THEN RAISE EXCEPTION 'Non-superuser staging postgres required'; END IF;
 IF (SELECT count(*) FROM pg_auth_members WHERE roleid='${role}'::regrole AND member='postgres'::regrole)<>1 OR NOT EXISTS(SELECT 1 FROM pg_auth_members WHERE roleid='${role}'::regrole AND member='postgres'::regrole AND grantor='supabase_admin'::regrole AND admin_option AND NOT inherit_option AND NOT set_option) THEN RAISE EXCEPTION 'Original migrator grant differs'; END IF;
END $preflight$;
CREATE TEMP TABLE pilot_role_snapshot ON COMMIT DROP AS SELECT roleid,member,grantor,admin_option,inherit_option,set_option FROM pg_auth_members WHERE roleid='${role}'::regrole;
GRANT ${role} TO postgres WITH ADMIN FALSE,INHERIT FALSE,SET TRUE GRANTED BY postgres;
SET LOCAL ROLE ${role};
${body}
RESET ROLE;
REVOKE ${role} FROM postgres GRANTED BY postgres;
DO $restore$ BEGIN
 IF EXISTS((SELECT roleid,member,grantor,admin_option,inherit_option,set_option FROM pg_auth_members WHERE roleid='${role}'::regrole EXCEPT SELECT * FROM pg_temp.pilot_role_snapshot) UNION ALL (SELECT * FROM pg_temp.pilot_role_snapshot EXCEPT SELECT roleid,member,grantor,admin_option,inherit_option,set_option FROM pg_auth_members WHERE roleid='${role}'::regrole)) THEN RAISE EXCEPTION 'Original grants were not exactly restored'; END IF;
END $restore$;
COMMIT;
`;
}
