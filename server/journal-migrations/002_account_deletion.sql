BEGIN;
CREATE TABLE entitlement_revocation_subject (
 event_id bigint PRIMARY KEY REFERENCES entitlement_revocation(id),
 subject_id uuid NOT NULL
);
CREATE TRIGGER entitlement_revocation_subject_immutable
 BEFORE UPDATE OR DELETE ON entitlement_revocation_subject
 FOR EACH ROW EXECUTE FUNCTION reject_journal_mutation();
CREATE TRIGGER entitlement_revocation_subject_no_truncate
 BEFORE TRUNCATE ON entitlement_revocation_subject
 FOR EACH STATEMENT EXECUTE FUNCTION reject_journal_mutation();
ALTER TABLE entitlement_revocation DROP CONSTRAINT entitlement_revocation_reason_check;
ALTER TABLE entitlement_revocation ADD CONSTRAINT entitlement_revocation_reason_check
 CHECK (reason IN ('class_membership_removed','school_membership_removed','user_blocked','user_deleted','assignment_retention','school_blocked','class_invitation_used','school_invitation_used','school_invitation_revoked'));
INSERT INTO journal_migration(version) VALUES ('002_account_deletion') ON CONFLICT DO NOTHING;
COMMIT;
