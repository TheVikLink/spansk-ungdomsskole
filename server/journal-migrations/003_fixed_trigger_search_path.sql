BEGIN;
ALTER FUNCTION reject_journal_mutation() SET search_path = pg_catalog;
INSERT INTO journal_migration(version) VALUES ('003_fixed_trigger_search_path') ON CONFLICT DO NOTHING;
COMMIT;
