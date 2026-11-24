BEGIN;

ALTER TABLE assignment ADD COLUMN IF NOT EXISTS pinned_until timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS assignment_one_pin_per_class
  ON assignment(school_id,class_id) WHERE pinned_until IS NOT NULL;

INSERT INTO schema_migration(version) VALUES ('009_assignment_pins') ON CONFLICT DO NOTHING;

COMMIT;
