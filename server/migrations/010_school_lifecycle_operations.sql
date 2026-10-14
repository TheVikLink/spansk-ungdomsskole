BEGIN;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='school_data_operator') THEN CREATE ROLE school_data_operator NOLOGIN NOINHERIT NOBYPASSRLS; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='school_retention_operator') THEN CREATE ROLE school_retention_operator NOLOGIN NOINHERIT NOBYPASSRLS; END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS school_ops;
REVOKE ALL ON SCHEMA school_ops FROM PUBLIC;
GRANT USAGE ON SCHEMA school_ops TO school_data_operator,school_retention_operator;
CREATE TABLE school_ops.authorization (
 school_id uuid NOT NULL REFERENCES public.school(id), reference text NOT NULL CHECK(length(reference) BETWEEN 4 AND 120),
 operation text NOT NULL CHECK(operation IN ('export','delete')), operator_id text NOT NULL CHECK(length(operator_id) BETWEEN 2 AND 80),
 expires_at timestamptz NOT NULL, PRIMARY KEY(school_id,reference,operation)
);
ALTER TABLE school_ops.authorization ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION school_ops.check_authorization(p_school uuid,p_reference text,p_operation text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM school_ops.authorization WHERE school_id=p_school AND reference=p_reference AND operation=p_operation AND expires_at>clock_timestamp()) THEN
  RAISE EXCEPTION 'School authorization is missing or expired' USING ERRCODE='28000';
 END IF;
END $$;
CREATE FUNCTION school_ops.lock_school(p_school uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$
BEGIN
 IF NOT pg_try_advisory_xact_lock(hashtextextended(p_school::text,345714)) THEN
  RAISE EXCEPTION 'School operation is busy; retry with a new transaction' USING ERRCODE='55P03';
 END IF;
END $$;
CREATE FUNCTION school_ops.guard_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$
DECLARE v_school uuid; v_status text; reduced boolean:=false;
BEGIN
 v_school:=NEW.school_id;
 IF v_school IS NULL THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' THEN
  IF TG_TABLE_NAME IN ('school_membership','class_membership') THEN
   reduced:=NEW.status='revoked' AND (to_jsonb(NEW)-'status')=(to_jsonb(OLD)-'status');
  ELSIF TG_TABLE_NAME='assignment_recipient' THEN
   reduced:=NEW.status='removed' AND (to_jsonb(NEW)-'status')=(to_jsonb(OLD)-'status');
  ELSIF TG_TABLE_NAME IN ('school_invite','class_invite') THEN
   reduced:=(to_jsonb(NEW)-ARRAY['used_at','revoked_at'])=(to_jsonb(OLD)-ARRAY['used_at','revoked_at'])
    AND (OLD.used_at IS NULL OR NEW.used_at=OLD.used_at)
    AND (TG_TABLE_NAME='class_invite' OR (to_jsonb(OLD)->>'revoked_at' IS NULL OR to_jsonb(NEW)->>'revoked_at'=to_jsonb(OLD)->>'revoked_at'))
    AND (NEW.used_at IS NOT NULL OR to_jsonb(NEW)->>'revoked_at' IS NOT NULL);
  ELSIF TG_TABLE_NAME='app_session' THEN
   reduced:=NEW.revoked_at IS NOT NULL AND NEW.encrypted_id_token IS NULL AND NEW.acr IS NULL
    AND (OLD.revoked_at IS NULL OR NEW.revoked_at=OLD.revoked_at)
    AND (to_jsonb(NEW)-ARRAY['revoked_at','encrypted_id_token','acr'])=(to_jsonb(OLD)-ARRAY['revoked_at','encrypted_id_token','acr']);
  END IF;
 END IF;
 -- A heartbeat does not create entitlement or learning data. The application
 -- separately validates user, school and journal access after resolving it.
 IF TG_OP='UPDATE' AND TG_TABLE_NAME='app_session' AND (to_jsonb(NEW)-'last_seen_at')=(to_jsonb(OLD)-'last_seen_at') THEN RETURN NEW; END IF;
 IF reduced THEN RETURN NEW; END IF;
 IF NOT pg_try_advisory_xact_lock_shared(hashtextextended(v_school::text,345714)) THEN
  RAISE EXCEPTION 'School operation busy; retry request' USING ERRCODE='55P03';
 END IF;
 SELECT status INTO v_status FROM public.school WHERE id=v_school;
 IF v_status IS DISTINCT FROM 'active' THEN RAISE EXCEPTION 'School is inactive; new school data is forbidden' USING ERRCODE='28000'; END IF;
 RETURN NEW;
END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['school_membership','school_class','class_membership','class_invite','school_invite','assignment','assignment_recipient','learning_event','audit_event','app_session'] LOOP
 EXECUTE format('CREATE TRIGGER school_lifecycle_write_guard BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION school_ops.guard_write()',t);
 END LOOP;
END $$;
CREATE FUNCTION school_ops.guard_tombstone()
RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$ BEGIN
 IF OLD.status='deleted' AND (NEW.status<>'deleted' OR NEW.access_grant_id<>OLD.access_grant_id) THEN
  RAISE EXCEPTION 'Deleted school cannot be reactivated or assigned a new access grant' USING ERRCODE='28000';
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER school_deleted_is_final BEFORE UPDATE ON public.school FOR EACH ROW EXECUTE FUNCTION school_ops.guard_tombstone();
CREATE FUNCTION school_ops.export_school(p_school uuid,p_reference text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$
DECLARE data jsonb;
BEGIN
 PERFORM school_ops.check_authorization(p_school,p_reference,'export');
 SELECT jsonb_build_object(
 'format','spansk123-school-export-v1','exportedAt',transaction_timestamp(),
 'school',jsonb_build_object('id',s.id,'name',s.name,'feide_org_id',s.feide_org_id,'owner_id',s.owner_id,'status',s.status,'created_at',s.created_at),
 'users',coalesce((SELECT jsonb_agg(jsonb_build_object('id',u.id,'display_name',u.display_name,'status',u.status,'created_at',u.created_at) ORDER BY u.id) FROM public.app_user u WHERE u.id IN (
  SELECT user_id FROM public.school_membership WHERE school_id=p_school UNION SELECT user_id FROM public.class_membership WHERE school_id=p_school
  UNION SELECT created_by FROM public.assignment WHERE school_id=p_school UNION SELECT student_id FROM public.learning_event WHERE school_id=p_school
  UNION SELECT created_by FROM public.class_invite WHERE school_id=p_school UNION SELECT created_by FROM public.school_invite WHERE school_id=p_school
  UNION SELECT actor_id FROM public.audit_event WHERE school_id=p_school UNION SELECT target_user_id FROM public.school_provisioning_event WHERE school_id=p_school
 )), '[]'::jsonb),
 'memberships',coalesce((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.user_id) FROM public.school_membership m WHERE m.school_id=p_school),'[]'::jsonb),
 'classes',coalesce((SELECT jsonb_agg(to_jsonb(c) ORDER BY c.id) FROM public.school_class c WHERE c.school_id=p_school),'[]'::jsonb),
 'classMemberships',coalesce((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.class_id,m.user_id) FROM public.class_membership m WHERE m.school_id=p_school),'[]'::jsonb),
 'assignments',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.id) FROM public.assignment a WHERE a.school_id=p_school),'[]'::jsonb),
 'recipients',coalesce((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.assignment_id,r.student_id) FROM public.assignment_recipient r WHERE r.school_id=p_school),'[]'::jsonb),
 'learningEvents',coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.created_at,e.id) FROM public.learning_event e WHERE e.school_id=p_school),'[]'::jsonb),
 'auditEvents',coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.created_at,e.id) FROM public.audit_event e WHERE e.school_id=p_school),'[]'::jsonb),
 'classInvitations',coalesce((SELECT jsonb_agg(to_jsonb(i)-'token_hash' ORDER BY i.id) FROM public.class_invite i WHERE i.school_id=p_school),'[]'::jsonb),
 'schoolInvitations',coalesce((SELECT jsonb_agg(to_jsonb(i)-'token_hash' ORDER BY i.id) FROM public.school_invite i WHERE i.school_id=p_school),'[]'::jsonb),
 'provisioningEvents',coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.id) FROM public.school_provisioning_event e WHERE e.school_id=p_school),'[]'::jsonb),
 'ownerEvents',coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.id) FROM public.school_owner_lifecycle_event e WHERE e.school_id=p_school),'[]'::jsonb)
 ) INTO data FROM public.school s WHERE s.id=p_school;
 IF data IS NULL THEN RAISE EXCEPTION 'School does not exist'; END IF;
 RETURN data;
END $$;
CREATE FUNCTION school_ops.prepare_deletion(p_school uuid,p_reference text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$
DECLARE s public.school; t text;
BEGIN
 PERFORM school_ops.check_authorization(p_school,p_reference,'delete');
 PERFORM school_ops.lock_school(p_school);
 SELECT * INTO s FROM public.school WHERE id=p_school FOR UPDATE NOWAIT;
 IF NOT FOUND THEN RAISE EXCEPTION 'School does not exist'; END IF;
 FOREACH t IN ARRAY ARRAY['app_session','school_invite','class_invite','learning_event','assignment_recipient','assignment','class_membership','school_class','school_membership','audit_event'] LOOP
  EXECUTE format('SELECT 1 FROM public.%I WHERE school_id=$1 FOR UPDATE NOWAIT',t) USING p_school;
 END LOOP;
 RETURN jsonb_build_object('schoolId',s.id,'accessGrantId',s.access_grant_id,'alreadyDeleted',s.status='deleted',
  'assignments',(SELECT count(*) FROM public.assignment WHERE school_id=p_school),
  'learningEvents',(SELECT count(*) FROM public.learning_event WHERE school_id=p_school),
  'memberships',(SELECT count(*) FROM public.school_membership WHERE school_id=p_school));
END $$;
-- Internal function is also the idempotent restore replay implementation.
CREATE FUNCTION school_ops.purge_school(p_school uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$
BEGIN
 PERFORM school_ops.lock_school(p_school);
 PERFORM 1 FROM public.school WHERE id=p_school FOR UPDATE NOWAIT;
 DELETE FROM public.app_session WHERE school_id=p_school;
 DELETE FROM public.school_invite WHERE school_id=p_school;
 DELETE FROM public.class_invite WHERE school_id=p_school;
 DELETE FROM public.learning_event WHERE school_id=p_school;
 DELETE FROM public.assignment_recipient WHERE school_id=p_school;
 DELETE FROM public.assignment WHERE school_id=p_school;
 DELETE FROM public.class_membership WHERE school_id=p_school;
 DELETE FROM public.school_class WHERE school_id=p_school;
 DELETE FROM public.school_membership WHERE school_id=p_school;
 DELETE FROM public.audit_event WHERE school_id=p_school;
 UPDATE public.school SET status='deleted',name='Avviklet skole' WHERE id=p_school;
END $$;
CREATE FUNCTION school_ops.apply_deletion(p_school uuid,p_reference text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$
BEGIN
 PERFORM school_ops.prepare_deletion(p_school,p_reference);
 PERFORM school_ops.purge_school(p_school);
END $$;
CREATE OR REPLACE FUNCTION app_resolve_session(p_token_hash bytea,p_now timestamptz)
RETURNS TABLE(user_id uuid,school_id uuid,role text,csrf_hash bytea,expires_at timestamptz,display_name text,school_grant_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE current_session public.app_session%ROWTYPE; v_user public.app_user%ROWTYPE;
        current_membership public.school_membership%ROWTYPE;
BEGIN
 SELECT s.* INTO current_session FROM public.app_session s
 WHERE s.token_hash=p_token_hash AND s.revoked_at IS NULL AND s.expires_at>p_now FOR UPDATE;
 IF NOT FOUND THEN RETURN; END IF;
 IF current_session.role IN ('teacher','school_admin') AND current_session.last_seen_at <= p_now - interval '30 minutes' THEN RETURN; END IF;
 SELECT u.* INTO v_user FROM public.app_user u WHERE u.id=current_session.user_id;
 IF NOT FOUND OR v_user.status NOT IN ('active','pending') THEN RETURN; END IF;
 IF current_session.role='pending' THEN
  IF current_session.school_id IS NOT NULL OR EXISTS(SELECT 1 FROM public.school_membership m JOIN public.school s ON s.id=m.school_id WHERE m.user_id=current_session.user_id AND m.status='active' AND s.status='active') THEN RETURN; END IF;
 ELSIF current_session.role='select_school' THEN
  IF current_session.school_id IS NOT NULL OR NOT EXISTS (SELECT 1 FROM public.school_membership m WHERE m.user_id=current_session.user_id AND m.status='active') THEN RETURN; END IF;
 ELSE
  SELECT m.* INTO current_membership FROM public.school_membership m JOIN public.school s ON s.id=m.school_id
  WHERE m.school_id=current_session.school_id AND m.user_id=current_session.user_id AND m.role=current_session.role AND m.status='active' AND s.status='active';
  IF NOT FOUND OR v_user.status<>'active' THEN RETURN; END IF;
 END IF;
 UPDATE public.app_session SET last_seen_at=p_now WHERE token_hash=p_token_hash;
 RETURN QUERY SELECT current_session.user_id,current_session.school_id,current_session.role,current_session.csrf_hash,
  current_session.expires_at,v_user.display_name,current_membership.grant_id;
 RETURN;
END
$$;


CREATE OR REPLACE FUNCTION app_create_session(p_token_hash bytea,p_user_id uuid,p_school_id uuid,p_role text,p_csrf_hash bytea,p_encrypted_id_token bytea,p_expires_at timestamptz,p_acr text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
BEGIN
 IF p_role='pending' THEN
  IF p_school_id IS NOT NULL OR NOT EXISTS (SELECT 1 FROM public.app_user u WHERE u.id=p_user_id AND u.status IN ('pending','active') AND NOT EXISTS(SELECT 1 FROM public.school_membership m JOIN public.school s ON s.id=m.school_id WHERE m.user_id=p_user_id AND m.status='active' AND s.status='active')) THEN RAISE EXCEPTION 'invalid pending session' USING ERRCODE='28000'; END IF;
 ELSIF p_role='select_school' THEN
  IF p_school_id IS NOT NULL OR NOT EXISTS (SELECT 1 FROM public.school_membership m WHERE m.user_id=p_user_id AND m.status='active') THEN RAISE EXCEPTION 'invalid school selector session' USING ERRCODE='28000'; END IF;
 ELSIF NOT EXISTS (SELECT 1 FROM public.school_membership m JOIN public.school s ON s.id=m.school_id
   WHERE m.user_id=p_user_id AND m.school_id=p_school_id AND m.role=p_role AND m.status='active' AND s.status='active') THEN
  RAISE EXCEPTION 'active school membership required' USING ERRCODE='28000';
 END IF;
 INSERT INTO public.app_session(token_hash,user_id,school_id,role,csrf_hash,encrypted_id_token,expires_at,acr)
 VALUES(p_token_hash,p_user_id,p_school_id,p_role,p_csrf_hash,p_encrypted_id_token,p_expires_at,p_acr);
END $$;


-- Account deletion obtains all barriers before identity/user locks and journal.
CREATE OR REPLACE FUNCTION public.app_prepare_own_account_deletion(target_user uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$
DECLARE account_status text; v_school uuid; before_schools uuid[]; after_schools uuid[];
BEGIN
 IF nullif(current_setting('app.user_id',true),'')::uuid IS DISTINCT FROM target_user THEN RAISE EXCEPTION 'own account required' USING ERRCODE='28000'; END IF;
 SELECT array_agg(school_id ORDER BY school_id) INTO before_schools FROM public.school_membership WHERE user_id=target_user;
 FOREACH v_school IN ARRAY coalesce(before_schools,ARRAY[]::uuid[]) LOOP PERFORM school_ops.lock_school(v_school); END LOOP;
 PERFORM 1 FROM public.feide_identity WHERE user_id=target_user ORDER BY issuer,subject FOR UPDATE;
 SELECT status INTO account_status FROM public.app_user WHERE id=target_user FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 SELECT array_agg(school_id ORDER BY school_id) INTO after_schools FROM public.school_membership WHERE user_id=target_user;
 IF before_schools IS DISTINCT FROM after_schools THEN RAISE EXCEPTION 'School membership changed; retry account deletion' USING ERRCODE='55P03'; END IF;
 RETURN account_status<>'deleted';
END $$;
CREATE TABLE school_ops.retention_policy (
 school_id uuid PRIMARY KEY REFERENCES public.school(id), version integer NOT NULL CHECK(version>0),
 reference text NOT NULL CHECK(length(reference) BETWEEN 4 AND 120),
 learning_days integer NOT NULL CHECK(learning_days BETWEEN 1 AND 3650),
 audit_days integer NOT NULL CHECK(audit_days BETWEEN 1 AND 3650), expires_at timestamptz NOT NULL, last_attempt_at timestamptz
);
ALTER TABLE school_ops.retention_policy ENABLE ROW LEVEL SECURITY;
CREATE TABLE school_ops.global_expiry_policy (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),version integer NOT NULL CHECK(version>0),
 reference text NOT NULL CHECK(length(reference) BETWEEN 4 AND 120),expires_at timestamptz NOT NULL
);
ALTER TABLE school_ops.global_expiry_policy ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION school_ops.retention_targets(p_claim boolean DEFAULT false) RETURNS TABLE(school_id uuid,version integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$
DECLARE candidate record;
BEGIN
 FOR candidate IN SELECT p.school_id,p.version FROM school_ops.retention_policy p JOIN public.school s ON s.id=p.school_id
 WHERE p.expires_at>clock_timestamp() AND s.status='active' ORDER BY p.last_attempt_at NULLS FIRST,p.school_id LIMIT 20 FOR UPDATE OF p SKIP LOCKED LOOP
  IF p_claim THEN UPDATE school_ops.retention_policy p SET last_attempt_at=clock_timestamp() WHERE p.school_id=candidate.school_id; END IF;
  school_id:=candidate.school_id;version:=candidate.version;RETURN NEXT;
 END LOOP;
END $$;
CREATE TABLE school_ops.retention_batch (transaction_id bigint NOT NULL,school_id uuid NOT NULL,policy_version integer NOT NULL,report jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(transaction_id,school_id));
ALTER TABLE school_ops.retention_batch ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION school_ops.prepare_retention(p_school uuid,p_version integer)
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
 RETURN report;
END $$;
CREATE FUNCTION school_ops.apply_retention(p_school uuid,p_version integer)
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
 RETURN (report-'expiredSessionHashes') || jsonb_build_object('deletedAssignments',assignments_count,'deletedAuditEvents',audit_count,'deletedSchoolInvitations',school_invites_count,'deletedClassInvitations',class_invites_count,'deletedSessions',sessions_count);
END $$;
CREATE FUNCTION school_ops.cleanup_global_expiry(p_version integer,p_apply boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$
DECLARE sessions_count integer; oidc_count integer; sessions bytea[]; transactions bytea[];
BEGIN
 IF NOT EXISTS(SELECT 1 FROM school_ops.global_expiry_policy WHERE version=p_version AND expires_at>clock_timestamp()) THEN RAISE EXCEPTION 'Approved global technical expiry policy is required'; END IF;
 IF NOT pg_try_advisory_xact_lock(345716) THEN RAISE EXCEPTION 'Technical expiry operation busy' USING ERRCODE='55P03'; END IF;
 SELECT array_agg(token_hash) INTO sessions FROM (SELECT token_hash FROM public.app_session WHERE school_id IS NULL AND (expires_at<=transaction_timestamp() OR revoked_at IS NOT NULL) ORDER BY token_hash LIMIT 100 FOR UPDATE NOWAIT) q;
 SELECT array_agg(handle_hash) INTO transactions FROM (SELECT handle_hash FROM public.oidc_transaction WHERE expires_at<=transaction_timestamp() OR consumed_at IS NOT NULL ORDER BY handle_hash LIMIT 100 FOR UPDATE NOWAIT) q;
 sessions_count:=coalesce(cardinality(sessions),0);oidc_count:=coalesce(cardinality(transactions),0);
 IF p_apply THEN
  DELETE FROM public.app_session WHERE token_hash=ANY(coalesce(sessions,ARRAY[]::bytea[]));
  DELETE FROM public.oidc_transaction WHERE handle_hash=ANY(coalesce(transactions,ARRAY[]::bytea[]));
 END IF;
 RETURN jsonb_build_object('policyVersion',p_version,'applied',p_apply,'sessions',sessions_count,'oidcTransactions',oidc_count);
END $$;
CREATE TABLE school_ops.job_run(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),started_at timestamptz NOT NULL DEFAULT now(),finished_at timestamptz,status text NOT NULL DEFAULT 'running' CHECK(status IN ('running','completed','failed')),school_count integer NOT NULL DEFAULT 0 CHECK(school_count>=0),assignment_count integer NOT NULL DEFAULT 0 CHECK(assignment_count>=0),failure_category text CHECK(failure_category IN ('operation_failed')));
ALTER TABLE school_ops.job_run ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION school_ops.begin_job() RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$ INSERT INTO school_ops.job_run DEFAULT VALUES RETURNING id $$;
CREATE FUNCTION school_ops.finish_job(p_id uuid,p_success boolean,p_schools integer,p_assignments integer) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$ UPDATE school_ops.job_run SET finished_at=now(),status=CASE WHEN p_success THEN 'completed' ELSE 'failed' END,school_count=p_schools,assignment_count=p_assignments,failure_category=CASE WHEN p_success THEN NULL ELSE 'operation_failed' END WHERE id=p_id AND status='running' $$;
CREATE FUNCTION school_ops.job_health(p_max_minutes integer DEFAULT 2880) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$
 SELECT jsonb_build_object('latestStatus',(SELECT status FROM school_ops.job_run ORDER BY started_at DESC,id DESC LIMIT 1),'lastSuccess',(SELECT max(finished_at) FROM school_ops.job_run WHERE status='completed'),'healthy',coalesce((SELECT status='completed' AND finished_at>now()-make_interval(mins=>p_max_minutes) FROM school_ops.job_run ORDER BY started_at DESC,id DESC LIMIT 1),false))
$$;

CREATE TABLE school_ops.migration_digest (source text PRIMARY KEY,sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'));
ALTER TABLE school_ops.migration_digest ENABLE ROW LEVEL SECURITY;
-- Runtime/deployment gate only returns a boolean; no pupil rows are exposed.
CREATE FUNCTION school_ops.reopening_state(p_schools uuid[],p_assignments uuid[],p_users uuid[],p_digests jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,school_ops SET row_security=off AS $$
DECLARE t text; remains boolean;
BEGIN
 IF p_digests IS DISTINCT FROM (SELECT jsonb_object_agg(source,sha256) FROM school_ops.migration_digest) THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.school WHERE id=ANY(p_schools) AND status<>'deleted') THEN RETURN false; END IF;
 FOREACH t IN ARRAY ARRAY['app_session','school_invite','class_invite','learning_event','assignment_recipient','assignment','class_membership','school_class','school_membership','audit_event'] LOOP
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE school_id=ANY($1))',t) INTO remains USING p_schools;
  IF remains THEN RETURN false; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM public.assignment WHERE id=ANY(p_assignments)) OR EXISTS(SELECT 1 FROM public.app_user WHERE id=ANY(p_users) AND (status<>'deleted' OR display_name<>'Slettet konto'))
 OR EXISTS(SELECT 1 FROM public.feide_identity WHERE user_id=ANY(p_users))
 OR EXISTS(SELECT 1 FROM public.school_membership WHERE user_id=ANY(p_users) AND status='active')
 OR EXISTS(SELECT 1 FROM public.class_membership WHERE user_id=ANY(p_users) AND status IN ('active','pending'))
 OR EXISTS(SELECT 1 FROM public.assignment_recipient WHERE student_id=ANY(p_users))
 OR EXISTS(SELECT 1 FROM public.learning_event WHERE student_id=ANY(p_users))
 OR EXISTS(SELECT 1 FROM public.app_session WHERE user_id=ANY(p_users) AND (revoked_at IS NULL OR encrypted_id_token IS NOT NULL OR acr IS NOT NULL)) THEN RETURN false; END IF;
 RETURN true;
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA school_ops FROM PUBLIC,app_runtime,school_data_operator,school_retention_operator;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA school_ops FROM PUBLIC,app_runtime,school_data_operator,school_retention_operator;
GRANT EXECUTE ON FUNCTION school_ops.export_school(uuid,text),school_ops.prepare_deletion(uuid,text),school_ops.apply_deletion(uuid,text) TO school_data_operator;
GRANT EXECUTE ON FUNCTION school_ops.retention_targets(boolean),school_ops.begin_job(),school_ops.finish_job(uuid,boolean,integer,integer),school_ops.job_health(integer),school_ops.prepare_retention(uuid,integer),school_ops.apply_retention(uuid,integer),school_ops.cleanup_global_expiry(integer,boolean) TO school_retention_operator;
GRANT USAGE ON SCHEMA school_ops TO app_runtime;
GRANT EXECUTE ON FUNCTION school_ops.reopening_state(uuid[],uuid[],uuid[],jsonb) TO app_runtime,school_data_operator;
INSERT INTO public.schema_migration(version) VALUES('010_school_lifecycle_operations');
COMMIT;
