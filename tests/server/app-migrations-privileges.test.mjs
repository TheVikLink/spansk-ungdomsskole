import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('app runtime can only read migration tracking and cannot execute owner trigger functions', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE app_migrator NOLOGIN;
      CREATE ROLE app_runtime NOLOGIN NOBYPASSRLS;
      CREATE ROLE school_owner_provisioner NOLOGIN NOBYPASSRLS;
      GRANT USAGE, CREATE ON SCHEMA public TO app_migrator;
      ALTER DEFAULT PRIVILEGES FOR ROLE app_migrator IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
      SET ROLE app_migrator;
      CREATE TABLE schema_migration (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
      RESET ROLE;
    `);

    for (const filename of [
      '001_initial.sql',
      '002_school_membership_lifecycle.sql',
      '003_account_deletion.sql',
      '004_session_auth_level.sql',
      '005_school_owner_tenants.sql',
      '006_assignment_content_snapshots.sql',
      '007_runtime_migration_privileges.sql',
      '008_pin_provisioning_trigger_search_path.sql',
    ]) {
      await db.exec(await readFile(new URL(`../../server/migrations/${filename}`, import.meta.url), 'utf8'));
    }

    const privileges = await db.query(`
      SELECT
        has_table_privilege('app_runtime', 'schema_migration', 'SELECT') AS can_read_migrations,
        has_table_privilege('app_runtime', 'schema_migration', 'INSERT') AS can_insert_migrations,
        has_table_privilege('app_runtime', 'schema_migration', 'UPDATE') AS can_update_migrations,
        has_table_privilege('app_runtime', 'schema_migration', 'DELETE') AS can_delete_migrations,
        has_table_privilege('app_runtime', 'schema_migration', 'TRUNCATE') AS can_truncate_migrations,
        has_function_privilege('app_runtime', 'app_guard_school_owner_status()', 'EXECUTE') AS runtime_can_execute_owner_guard,
        has_function_privilege('school_owner_provisioner', 'app_guard_school_owner_status()', 'EXECUTE') AS provisioner_can_execute_owner_guard,
        (SELECT proconfig FROM pg_proc WHERE oid='reject_school_provisioning_event_mutation()'::regprocedure) AS provisioning_trigger_config,
        EXISTS (
          SELECT 1 FROM pg_proc p CROSS JOIN LATERAL aclexplode(p.proacl) a
          WHERE p.proname IN ('app_guard_school_owner_status', 'app_block_schools_for_inactive_owner')
            AND a.grantee=0 AND a.privilege_type='EXECUTE'
        ) AS trigger_functions_executable_by_public
    `);

    assert.deepEqual(privileges.rows[0], {
      can_read_migrations: true,
      can_insert_migrations: false,
      can_update_migrations: false,
      can_delete_migrations: false,
      can_truncate_migrations: false,
      runtime_can_execute_owner_guard: false,
      provisioner_can_execute_owner_guard: false,
      provisioning_trigger_config: ['search_path=pg_catalog'],
      trigger_functions_executable_by_public: false,
    });
  } finally {
    await db.close();
  }
});
