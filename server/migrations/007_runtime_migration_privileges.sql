BEGIN;

-- Runtime reads migration readiness but must never alter migration history.
REVOKE ALL ON TABLE schema_migration FROM app_runtime;
GRANT SELECT ON TABLE schema_migration TO app_runtime;

-- These SECURITY DEFINER functions are invoked by their triggers, not by app roles.
REVOKE ALL ON FUNCTION app_guard_school_owner_status()
  FROM PUBLIC, app_runtime, school_owner_provisioner;
REVOKE ALL ON FUNCTION app_block_schools_for_inactive_owner()
  FROM PUBLIC, app_runtime, school_owner_provisioner;

INSERT INTO schema_migration(version)
VALUES ('007_runtime_migration_privileges')
ON CONFLICT DO NOTHING;

COMMIT;
