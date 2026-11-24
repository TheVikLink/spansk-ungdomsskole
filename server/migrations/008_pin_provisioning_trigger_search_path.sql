BEGIN;

-- This trigger only raises an exception and needs no application schema lookup.
ALTER FUNCTION public.reject_school_provisioning_event_mutation()
  SET search_path = pg_catalog;

INSERT INTO schema_migration(version)
VALUES ('008_pin_provisioning_trigger_search_path')
ON CONFLICT DO NOTHING;

COMMIT;
