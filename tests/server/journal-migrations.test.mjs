import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('journal immutability function pins search_path to pg_catalog', async () => {
  const db = new PGlite();
  try {
    await db.exec('CREATE ROLE journal_migrator; CREATE ROLE journal_runtime; GRANT USAGE, CREATE ON SCHEMA public TO journal_migrator; CREATE TABLE journal_migration (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());');
    for (const filename of [
      '001_revocations.sql',
      '002_account_deletion.sql',
      '003_fixed_trigger_search_path.sql',
      '004_runtime_least_privilege.sql',
    ]) {
      await db.exec(await readFile(new URL(`../../server/journal-migrations/${filename}`, import.meta.url), 'utf8'));
    }

    const result = await db.query(`
      SELECT p.proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'reject_journal_mutation'
    `);
    assert.deepEqual(result.rows[0]?.proconfig, ['search_path=pg_catalog']);

    const privileges = await db.query(`
      SELECT
        has_function_privilege('journal_runtime', 'reject_journal_mutation()', 'EXECUTE') AS runtime_can_execute_trigger,
        has_function_privilege('public', 'reject_journal_mutation()', 'EXECUTE') AS public_can_execute_trigger,
        has_table_privilege('journal_runtime', 'entitlement_revocation', 'SELECT') AS can_read_events,
        has_table_privilege('journal_runtime', 'entitlement_revocation', 'INSERT') AS can_append_events,
        has_table_privilege('journal_runtime', 'entitlement_revocation', 'UPDATE') AS can_update_events,
        has_table_privilege('journal_runtime', 'entitlement_revocation', 'DELETE') AS can_delete_events,
        has_table_privilege('journal_runtime', 'journal_migration', 'SELECT') AS can_read_migrations,
        has_table_privilege('journal_runtime', 'journal_migration', 'INSERT') AS can_write_migrations,
        has_sequence_privilege('journal_runtime', 'entitlement_revocation_id_seq', 'USAGE') AS can_allocate_event_id
    `);
    assert.deepEqual(privileges.rows[0], {
      runtime_can_execute_trigger: false,
      public_can_execute_trigger: false,
      can_read_events: true,
      can_append_events: true,
      can_update_events: false,
      can_delete_events: false,
      can_read_migrations: true,
      can_write_migrations: false,
      can_allocate_event_id: true,
    });

    await db.exec(`SET ROLE journal_migrator; CREATE TABLE future_journal_private (id integer); RESET ROLE;`);
    const futureTableAccess = await db.query(`
      SELECT has_table_privilege('journal_runtime', 'future_journal_private', 'SELECT') AS can_read,
             has_table_privilege('journal_runtime', 'future_journal_private', 'INSERT') AS can_insert
    `);
    assert.deepEqual(futureTableAccess.rows[0], { can_read: false, can_insert: false });
  } finally {
    await db.close();
  }
});
