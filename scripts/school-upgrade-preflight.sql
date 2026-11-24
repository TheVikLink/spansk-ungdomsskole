-- Read-only metadata preflight for each explicitly selected Spansk123 staging database.
-- Not an upgrade, backup, restore or permission grant. Never prints password material.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '10s';
SELECT current_database() AS database, current_setting('server_version') AS postgres_version;
SELECT extname AS extension, extversion AS version FROM pg_extension ORDER BY extname;
SELECT count(*) AS replication_slots FROM pg_replication_slots;
SELECT count(*) AS prepared_transactions FROM pg_prepared_xacts;
SELECT count(*) AS custom_login_roles_using_md5
FROM pg_authid
WHERE rolcanlogin AND rolname IN
 ('app_runtime','journal_runtime','school_owner_provisioner','global_auth_job_staging')
 AND rolpassword LIKE 'md5%';
SELECT count(*) AS ltree_index_columns
FROM pg_index i CROSS JOIN LATERAL unnest(i.indclass::oid[]) k(opclass)
JOIN pg_opclass oc ON oc.oid=k.opclass JOIN pg_type t ON t.oid=oc.opcintype
WHERE t.typname IN ('ltree','_ltree');
SELECT count(*) AS float_btree_gist_index_columns
FROM pg_index i CROSS JOIN LATERAL unnest(i.indclass::oid[]) k(opclass)
JOIN pg_opclass oc ON oc.oid=k.opclass JOIN pg_type t ON t.oid=oc.opcintype
JOIN pg_am am ON am.oid=oc.opcmethod
WHERE am.amname='gist' AND oc.opcname LIKE '%float%' AND t.typname IN ('float4','float8');
SELECT count(*) AS custom_operators_with_non_builtin_estimators
FROM pg_operator o
JOIN pg_namespace n ON n.oid=o.oprnamespace
LEFT JOIN pg_proc restriction_estimator ON restriction_estimator.oid=o.oprrest
LEFT JOIN pg_namespace rn ON rn.oid=restriction_estimator.pronamespace
LEFT JOIN pg_proc join_estimator ON join_estimator.oid=o.oprjoin
LEFT JOIN pg_namespace jn ON jn.oid=join_estimator.pronamespace
WHERE n.nspname NOT IN ('pg_catalog','information_schema')
 AND (rn.nspname IS DISTINCT FROM 'pg_catalog' AND o.oprrest<>0
   OR jn.nspname IS DISTINCT FROM 'pg_catalog' AND o.oprjoin<>0);
ROLLBACK;
