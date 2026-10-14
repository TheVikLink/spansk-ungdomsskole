import { loadConfig } from './config.js';
import { createDatabasePools } from './database.js';
import { createSchoolApp } from './app.js';
import { createRevocationJournal } from './revocation-journal.js';
import { verifyReopeningGate,migrationDigests } from './reopening-gate.js';
import { DatabaseStartupError } from './startup-diagnostics.js';

export async function createSchoolRuntime({ env = process.env, serveLocalStaticAssets = false } = {}) {
  const config = loadConfig(env);
  const pools = createDatabasePools(config);
  try {
    const [schema, journal] = await Promise.all([
      pools.appPool.query("SELECT count(*)::int AS n FROM schema_migration WHERE version IN ('001_initial','002_school_membership_lifecycle','003_account_deletion','004_session_auth_level','005_school_owner_tenants','006_assignment_content_snapshots','007_runtime_migration_privileges','008_pin_provisioning_trigger_search_path','009_student_school_invitations','010_school_lifecycle_operations','011_bounded_retention_scheduler')")
        .catch((error) => { throw new DatabaseStartupError('APP', error); }),
      pools.journalPool.query("SELECT count(*)::int AS n FROM journal_migration WHERE version IN ('001_revocations','002_account_deletion','003_fixed_trigger_search_path','004_runtime_least_privilege','005_school_deletion')")
        .catch((error) => { throw new DatabaseStartupError('JOURNAL', error); }),
    ]);
    if (schema.rows[0].n < 11 || journal.rows[0].n < 5) throw new Error('Required database migrations are missing');

    await verifyReopeningGate({pool:pools.appPool,journal:createRevocationJournal(pools.journalPool),expectedDigests:await migrationDigests()});
    const { app } = createSchoolApp({ config, appPool: pools.appPool, journalPool: pools.journalPool, serveLocalStaticAssets });
    return { app, config, close: () => pools.close() };
  } catch (error) {
    await pools.close();
    throw error;
  }
}
