BEGIN;
-- Five bounded school batches keep the scheduler within its HTTP wall clock.
-- A failing school must not starve later approved schools.
CREATE OR REPLACE FUNCTION school_ops.retention_targets(p_claim boolean DEFAULT false) RETURNS TABLE(school_id uuid,version integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$
DECLARE candidate record;
BEGIN
 FOR candidate IN SELECT p.school_id,p.version FROM school_ops.retention_policy p JOIN public.school s ON s.id=p.school_id
 WHERE p.expires_at>clock_timestamp() AND s.status='active' ORDER BY p.last_attempt_at NULLS FIRST,p.school_id LIMIT 5 FOR UPDATE OF p SKIP LOCKED LOOP
  IF p_claim THEN UPDATE school_ops.retention_policy p SET last_attempt_at=clock_timestamp() WHERE p.school_id=candidate.school_id; END IF;
  school_id:=candidate.school_id;version:=candidate.version;RETURN NEXT;
 END LOOP;
END $$;
-- A final school export precedes deletion. Retained immutable security events
-- must not become a path to current shared-user names after a school is deleted.
CREATE OR REPLACE FUNCTION school_ops.check_authorization(p_school uuid,p_reference text,p_operation text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM school_ops.authorization WHERE school_id=p_school AND reference=p_reference AND operation=p_operation AND expires_at>clock_timestamp()) THEN
  RAISE EXCEPTION 'School authorization is missing or expired' USING ERRCODE='28000';
 END IF;
 IF p_operation='export' AND EXISTS(SELECT 1 FROM public.school WHERE id=p_school AND status='deleted') THEN
  RAISE EXCEPTION 'Deleted school cannot export current shared-user data' USING ERRCODE='28000';
 END IF;
END $$;
-- Keep technical deletion identifiers entirely inside the private transaction batch.
CREATE OR REPLACE FUNCTION school_ops.prepare_retention(p_school uuid,p_version integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$
DECLARE p school_ops.retention_policy; ids uuid[]; audit_ids bigint[]; school_invite_ids uuid[]; class_invite_ids uuid[]; session_hashes bytea[]; cutoff timestamptz; report jsonb;
BEGIN
 PERFORM school_ops.lock_school(p_school);
 PERFORM 1 FROM public.school WHERE id=p_school AND status='active' FOR UPDATE NOWAIT;
 IF NOT FOUND THEN RAISE EXCEPTION 'An active school and approved retention policy are required'; END IF;
 SELECT * INTO p FROM school_ops.retention_policy WHERE school_id=p_school AND version=p_version AND expires_at>clock_timestamp() FOR SHARE NOWAIT;
 IF NOT FOUND THEN RAISE EXCEPTION 'School retention policy is missing, expired or changed'; END IF;
 cutoff:=transaction_timestamp()-make_interval(days=>p.learning_days);
 -- Every row later removed is locked before the independent journal commit.
 -- At most 20 assignments and 100 technical/audit rows of each kind per cycle.
 SELECT array_agg(id ORDER BY id) INTO ids FROM (SELECT id FROM public.assignment WHERE school_id=p_school AND greatest(created_at,coalesce(due_at,created_at))<=cutoff ORDER BY id LIMIT 20 FOR UPDATE NOWAIT) q;
 PERFORM 1 FROM public.learning_event WHERE school_id=p_school AND assignment_id=ANY(coalesce(ids,ARRAY[]::uuid[])) FOR UPDATE NOWAIT;
 PERFORM 1 FROM public.assignment_recipient WHERE school_id=p_school AND assignment_id=ANY(coalesce(ids,ARRAY[]::uuid[])) FOR UPDATE NOWAIT;
 SELECT array_agg(id ORDER BY id) INTO audit_ids FROM (SELECT id FROM public.audit_event WHERE school_id=p_school AND created_at<=transaction_timestamp()-make_interval(days=>p.audit_days) ORDER BY id LIMIT 100 FOR UPDATE NOWAIT) q;
 SELECT array_agg(id ORDER BY id) INTO school_invite_ids FROM (SELECT id FROM public.school_invite WHERE school_id=p_school AND (expires_at<=transaction_timestamp() OR used_at IS NOT NULL OR revoked_at IS NOT NULL) ORDER BY id LIMIT 100 FOR UPDATE NOWAIT) q;
 SELECT array_agg(id ORDER BY id) INTO class_invite_ids FROM (SELECT id FROM public.class_invite WHERE school_id=p_school AND (expires_at<=transaction_timestamp() OR used_at IS NOT NULL) ORDER BY id LIMIT 100 FOR UPDATE NOWAIT) q;
 SELECT array_agg(token_hash) INTO session_hashes FROM (SELECT token_hash FROM public.app_session WHERE school_id=p_school AND (expires_at<=transaction_timestamp() OR revoked_at IS NOT NULL) ORDER BY token_hash LIMIT 100 FOR UPDATE NOWAIT) q;
 report:=jsonb_build_object('schoolId',p_school,'policyVersion',p.version,'reference',p.reference,
  'assignmentIds',coalesce(to_jsonb(ids),'[]'::jsonb),'auditIds',coalesce(to_jsonb(audit_ids),'[]'::jsonb),
  'schoolInvitationIds',coalesce(to_jsonb(school_invite_ids),'[]'::jsonb),'classInvitationIds',coalesce(to_jsonb(class_invite_ids),'[]'::jsonb),
  'expiredSessionHashes',coalesce(to_jsonb(session_hashes),'[]'::jsonb));
 INSERT INTO school_ops.retention_batch(transaction_id,school_id,policy_version,report) VALUES(txid_current(),p_school,p_version,report) ON CONFLICT(transaction_id,school_id) DO UPDATE SET report=excluded.report,policy_version=excluded.policy_version;
 RETURN report-ARRAY['expiredSessionHashes','auditIds','schoolInvitationIds','classInvitationIds'];
END $$;
CREATE OR REPLACE FUNCTION school_ops.apply_retention(p_school uuid,p_version integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$
DECLARE report jsonb; assignments_count integer; audit_count integer; school_invites_count integer; class_invites_count integer; sessions_count integer;
BEGIN
 SELECT b.report INTO report FROM school_ops.retention_batch b WHERE b.transaction_id=txid_current() AND b.school_id=p_school AND b.policy_version=p_version FOR UPDATE NOWAIT;
 IF NOT FOUND THEN RAISE EXCEPTION 'Prepare the exact retention batch in the same transaction before apply'; END IF;
 IF NOT EXISTS(SELECT 1 FROM school_ops.retention_policy WHERE school_id=p_school AND version=p_version AND expires_at>clock_timestamp()) THEN RAISE EXCEPTION 'Approved retention policy expired'; END IF;
 DELETE FROM public.assignment WHERE school_id=p_school AND id IN (SELECT value::uuid FROM jsonb_array_elements_text(report->'assignmentIds'));
 GET DIAGNOSTICS assignments_count=ROW_COUNT;
 DELETE FROM public.audit_event WHERE school_id=p_school AND id IN (SELECT value::bigint FROM jsonb_array_elements_text(report->'auditIds'));
 GET DIAGNOSTICS audit_count=ROW_COUNT;
 DELETE FROM public.school_invite WHERE school_id=p_school AND id IN (SELECT value::uuid FROM jsonb_array_elements_text(report->'schoolInvitationIds'));
 GET DIAGNOSTICS school_invites_count=ROW_COUNT;
 DELETE FROM public.class_invite WHERE school_id=p_school AND id IN (SELECT value::uuid FROM jsonb_array_elements_text(report->'classInvitationIds'));
 GET DIAGNOSTICS class_invites_count=ROW_COUNT;
 DELETE FROM public.app_session WHERE school_id=p_school AND token_hash IN (SELECT value::bytea FROM jsonb_array_elements_text(report->'expiredSessionHashes'));
 GET DIAGNOSTICS sessions_count=ROW_COUNT;
 DELETE FROM school_ops.retention_batch WHERE transaction_id=txid_current() AND school_id=p_school;
 RETURN (report-ARRAY['expiredSessionHashes','auditIds','schoolInvitationIds','classInvitationIds']) || jsonb_build_object('deletedAssignments',assignments_count,'deletedAuditEvents',audit_count,'deletedSchoolInvitations',school_invites_count,'deletedClassInvitations',class_invites_count,'deletedSessions',sessions_count);
END $$;
INSERT INTO public.schema_migration(version) VALUES('011_bounded_retention_scheduler');
COMMIT;
