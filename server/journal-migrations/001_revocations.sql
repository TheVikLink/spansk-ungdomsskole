BEGIN;
CREATE TABLE IF NOT EXISTS entitlement_revocation (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  grant_id uuid NOT NULL UNIQUE,
  reason text NOT NULL CHECK (reason IN ('class_membership_removed','school_membership_removed','user_blocked','school_blocked','class_invitation_used','school_invitation_used','school_invitation_revoked')),
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION reject_journal_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'security journal is append-only'; END;
$$;
REVOKE ALL ON FUNCTION reject_journal_mutation() FROM PUBLIC;
CREATE TRIGGER entitlement_revocation_immutable
  BEFORE UPDATE OR DELETE ON entitlement_revocation
  FOR EACH ROW EXECUTE FUNCTION reject_journal_mutation();
CREATE TRIGGER entitlement_revocation_no_truncate
  BEFORE TRUNCATE ON entitlement_revocation
  FOR EACH STATEMENT EXECUTE FUNCTION reject_journal_mutation();
CREATE TABLE IF NOT EXISTS journal_migration (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
INSERT INTO journal_migration(version) VALUES ('001_revocations') ON CONFLICT DO NOTHING;
COMMIT;
