BEGIN;

CREATE TABLE school_provisioning_event (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 school_id uuid NOT NULL REFERENCES school(id),
 target_user_id uuid NOT NULL REFERENCES app_user(id),
 operation text NOT NULL CHECK (operation='first_admin_created'),
 operator_id text NOT NULL CHECK (length(operator_id) BETWEEN 2 AND 80),
 authorization_reference text NOT NULL CHECK (length(authorization_reference) BETWEEN 4 AND 120),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE school_provisioning_event ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION reject_school_provisioning_event_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'school provisioning log is append-only'; END;
$$;
CREATE TRIGGER school_provisioning_event_immutable BEFORE UPDATE OR DELETE ON school_provisioning_event
 FOR EACH ROW EXECUTE FUNCTION reject_school_provisioning_event_mutation();
CREATE TRIGGER school_provisioning_event_no_truncate BEFORE TRUNCATE ON school_provisioning_event
 FOR EACH STATEMENT EXECUTE FUNCTION reject_school_provisioning_event_mutation();

CREATE OR REPLACE FUNCTION app_can_view_user(target_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
 SELECT target_user=nullif(current_setting('app.user_id',true),'')::uuid OR
  (current_setting('app.role',true)='teacher' AND EXISTS (
   SELECT 1 FROM public.class_membership target
   JOIN public.class_membership teacher ON teacher.school_id=target.school_id AND teacher.class_id=target.class_id
   WHERE target.user_id=target_user AND target.school_id=nullif(current_setting('app.school_id',true),'')::uuid
    AND target.status IN ('active','pending') AND teacher.user_id=nullif(current_setting('app.user_id',true),'')::uuid
    AND target.role='student' AND teacher.role='teacher' AND teacher.status='active')) OR
  (current_setting('app.role',true)='school_admin' AND EXISTS (
   SELECT 1 FROM public.school_membership target
   WHERE target.user_id=target_user AND target.school_id=nullif(current_setting('app.school_id',true),'')::uuid))
$$;

CREATE FUNCTION app_school_members()
RETURNS TABLE(user_id uuid,display_name text,role text,membership_status text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE school uuid; actor uuid;
BEGIN
 school:=nullif(current_setting('app.school_id',true),'')::uuid;
 actor:=nullif(current_setting('app.user_id',true),'')::uuid;
 IF current_setting('app.role',true)<>'school_admin' OR NOT EXISTS (
   SELECT 1 FROM public.school_membership m JOIN public.school s ON s.id=m.school_id
   WHERE m.school_id=school AND m.user_id=actor AND m.role='school_admin' AND m.status='active' AND s.status='active'
 ) THEN RAISE EXCEPTION 'active school administrator required' USING ERRCODE='28000'; END IF;
 RETURN QUERY SELECT m.user_id,u.display_name,m.role,m.status
  FROM public.school_membership m JOIN public.app_user u ON u.id=m.user_id
  WHERE m.school_id=school AND m.status='active' ORDER BY m.role,u.display_name;
END $$;

CREATE FUNCTION app_revoke_school_member(target_user uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE school uuid; actor uuid; target_role text;
BEGIN
 school:=nullif(current_setting('app.school_id',true),'')::uuid;
 actor:=nullif(current_setting('app.user_id',true),'')::uuid;
 IF current_setting('app.role',true)<>'school_admin' THEN RAISE EXCEPTION 'school administrator required' USING ERRCODE='28000'; END IF;
 PERFORM 1 FROM public.school s JOIN public.school_membership actor_membership
  ON actor_membership.school_id=s.id AND actor_membership.user_id=actor AND actor_membership.role='school_admin' AND actor_membership.status='active'
  WHERE s.id=school AND s.status='active' FOR UPDATE OF s;
 IF NOT FOUND THEN RAISE EXCEPTION 'active school administrator required' USING ERRCODE='28000'; END IF;
 SELECT m.role INTO target_role FROM public.school_membership m
  WHERE m.school_id=school AND m.user_id=target_user AND m.status='active' FOR UPDATE;
 IF NOT FOUND THEN RETURN 'not_found'; END IF;
 IF target_user=actor THEN RETURN 'self'; END IF;
 IF target_role='school_admin' AND (SELECT count(*) FROM public.school_membership m
   WHERE m.school_id=school AND m.role='school_admin' AND m.status='active')<=1 THEN RETURN 'last_admin'; END IF;
 UPDATE public.school_membership SET status='revoked' WHERE school_id=school AND user_id=target_user AND status='active';
 UPDATE public.class_membership SET status='revoked' WHERE school_id=school AND user_id=target_user AND status IN ('active','pending');
 UPDATE public.assignment_recipient SET status='removed' WHERE school_id=school AND student_id=target_user AND status='assigned';
 UPDATE public.app_session SET revoked_at=coalesce(revoked_at,now()),encrypted_id_token=NULL,acr=NULL
  WHERE school_id=school AND user_id=target_user AND revoked_at IS NULL;
 RETURN 'revoked';
END $$;

DO $$ DECLARE fn text; BEGIN
 FOREACH fn IN ARRAY ARRAY['app_school_members()','app_revoke_school_member(uuid)'] LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',fn);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO app_runtime',fn);
 END LOOP;
END $$;

INSERT INTO schema_migration(version) VALUES ('002_school_membership_lifecycle') ON CONFLICT DO NOTHING;
COMMIT;
