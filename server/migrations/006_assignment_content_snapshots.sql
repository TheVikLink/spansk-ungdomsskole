BEGIN;

ALTER TABLE assignment ADD COLUMN content_snapshot jsonb;
ALTER TABLE assignment ADD CONSTRAINT assignment_content_snapshot_object
  CHECK (content_snapshot IS NULL OR jsonb_typeof(content_snapshot)='object');

INSERT INTO schema_migration(version) VALUES ('006_assignment_content_snapshots') ON CONFLICT DO NOTHING;

COMMIT;
