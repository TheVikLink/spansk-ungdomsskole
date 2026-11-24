BEGIN;

-- Runtime access is deliberately limited to append operations on journal events.
-- Never let default privileges silently grant access to future journal tables.
ALTER DEFAULT PRIVILEGES FOR ROLE journal_migrator IN SCHEMA public
  REVOKE ALL ON TABLES FROM journal_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE journal_migrator IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM journal_runtime;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM journal_runtime;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM journal_runtime;

GRANT SELECT, INSERT ON entitlement_revocation, entitlement_revocation_subject TO journal_runtime;
GRANT SELECT ON journal_migration TO journal_runtime;
GRANT USAGE, SELECT ON SEQUENCE entitlement_revocation_id_seq TO journal_runtime;

INSERT INTO journal_migration(version)
VALUES ('004_runtime_least_privilege')
ON CONFLICT DO NOTHING;

COMMIT;
