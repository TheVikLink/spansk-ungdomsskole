BEGIN;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='journal_school_operator') THEN CREATE ROLE journal_school_operator NOLOGIN NOINHERIT NOBYPASSRLS; END IF; END $$;
ALTER TABLE entitlement_revocation DROP CONSTRAINT entitlement_revocation_reason_check;
ALTER TABLE entitlement_revocation ADD CONSTRAINT entitlement_revocation_reason_check
 CHECK(reason IN ('class_membership_removed','school_membership_removed','user_blocked','user_deleted','assignment_retention','school_blocked','class_invitation_used','school_invitation_used','school_invitation_revoked','school_deleted'));
CREATE FUNCTION restrict_school_deletion_journal() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$ BEGIN
 IF NEW.reason='school_deleted' AND NOT pg_has_role(current_user,'journal_migrator','USAGE') THEN
 RAISE EXCEPTION 'School deletion journal requires the dedicated operator role' USING ERRCODE='42501';
 END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION restrict_school_deletion_journal() FROM PUBLIC,journal_runtime;
CREATE TRIGGER school_deletion_operator_only BEFORE INSERT ON entitlement_revocation FOR EACH ROW EXECUTE FUNCTION restrict_school_deletion_journal();
GRANT USAGE ON SCHEMA public TO journal_school_operator;
GRANT SELECT ON entitlement_revocation,entitlement_revocation_subject TO journal_school_operator;
GRANT SELECT ON journal_migration TO journal_school_operator;
CREATE SCHEMA IF NOT EXISTS journal_school;
REVOKE ALL ON SCHEMA journal_school FROM PUBLIC;
GRANT USAGE ON SCHEMA journal_school TO journal_school_operator;
CREATE TABLE journal_school.authorization (
 school_id uuid NOT NULL, access_grant_id uuid NOT NULL, reference text NOT NULL CHECK(length(reference) BETWEEN 4 AND 120),
 expires_at timestamptz NOT NULL, PRIMARY KEY(school_id,access_grant_id,reference)
);
ALTER TABLE journal_school.authorization ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA journal_school FROM PUBLIC,journal_runtime,journal_school_operator;
CREATE FUNCTION journal_school.record_deletion(p_school uuid,p_grant uuid,p_reference text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,journal_school SET row_security=off AS $$
DECLARE v_event bigint;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM journal_school.authorization WHERE school_id=p_school AND access_grant_id=p_grant AND reference=p_reference AND expires_at>clock_timestamp()) THEN
  RAISE EXCEPTION 'School journal authorization is missing or expired' USING ERRCODE='28000';
 END IF;
 IF NOT pg_try_advisory_xact_lock(hashtextextended(p_school::text,345715)) THEN RAISE EXCEPTION 'School journal busy' USING ERRCODE='55P03'; END IF;
 INSERT INTO public.entitlement_revocation(grant_id,reason) VALUES(p_grant,'school_blocked') ON CONFLICT(grant_id) DO NOTHING;
 IF NOT EXISTS(SELECT 1 FROM public.entitlement_revocation e LEFT JOIN public.entitlement_revocation_subject s ON s.event_id=e.id WHERE e.grant_id=p_grant AND e.reason='school_blocked' AND coalesce(s.subject_id,e.grant_id)=p_grant) THEN
  RAISE EXCEPTION 'School access journal conflicts with existing event';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.entitlement_revocation e JOIN public.entitlement_revocation_subject s ON s.event_id=e.id WHERE s.subject_id=p_school AND e.reason='school_deleted') THEN
  INSERT INTO public.entitlement_revocation(grant_id,reason) VALUES(gen_random_uuid(),'school_deleted') RETURNING id INTO v_event;
  INSERT INTO public.entitlement_revocation_subject(event_id,subject_id) VALUES(v_event,p_school);
 END IF;
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA journal_school FROM PUBLIC,journal_runtime;
GRANT EXECUTE ON FUNCTION journal_school.record_deletion(uuid,uuid,text) TO journal_school_operator;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='journal_retention_operator') THEN CREATE ROLE journal_retention_operator NOLOGIN NOINHERIT NOBYPASSRLS; END IF; END $$;
CREATE SCHEMA IF NOT EXISTS journal_retention;
REVOKE ALL ON SCHEMA journal_retention FROM PUBLIC;
GRANT USAGE ON SCHEMA journal_retention TO journal_retention_operator;
CREATE FUNCTION journal_retention.record_assignment(p_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v_grant uuid:=md5('spansk123:assignment-retention:'||p_id::text)::uuid; v_event bigint;
BEGIN
 -- A distinct grant namespace prevents retention from reserving a user/school
 -- grant UUID and obstructing a later genuine revocation of that grant.
 INSERT INTO public.entitlement_revocation(grant_id,reason) VALUES(v_grant,'assignment_retention') ON CONFLICT(grant_id) DO NOTHING RETURNING id INTO v_event;
 IF v_event IS NOT NULL THEN INSERT INTO public.entitlement_revocation_subject(event_id,subject_id) VALUES(v_event,p_id);
 ELSIF NOT EXISTS(SELECT 1 FROM public.entitlement_revocation e JOIN public.entitlement_revocation_subject s ON s.event_id=e.id WHERE e.grant_id=v_grant AND e.reason='assignment_retention' AND s.subject_id=p_id) THEN
  RAISE EXCEPTION 'Retention journal conflicts with existing event';
 END IF;
END $$;
CREATE FUNCTION journal_retention.record_assignments(p_ids uuid[]) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,journal_retention AS $$ DECLARE v_id uuid; BEGIN
 IF cardinality(p_ids)>20 OR cardinality(p_ids) IS NULL THEN RAISE EXCEPTION 'Retention journal batch must contain at most 20 assignments'; END IF;
 FOREACH v_id IN ARRAY p_ids LOOP PERFORM journal_retention.record_assignment(v_id); END LOOP;
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA journal_retention FROM PUBLIC,journal_runtime;
GRANT EXECUTE ON FUNCTION journal_retention.record_assignment(uuid),journal_retention.record_assignments(uuid[]) TO journal_retention_operator;
INSERT INTO journal_migration(version) VALUES('005_school_deletion');
COMMIT;
