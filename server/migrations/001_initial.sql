BEGIN;

CREATE TABLE IF NOT EXISTS app_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 120),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','blocked','deleted')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS school (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feide_org_id text NOT NULL UNIQUE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','deleted')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS school_membership (
  school_id uuid NOT NULL REFERENCES school(id), user_id uuid NOT NULL REFERENCES app_user(id),
  grant_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  role text NOT NULL CHECK (role IN ('teacher','student','school_admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  PRIMARY KEY (school_id,user_id)
);
CREATE TABLE IF NOT EXISTS feide_identity (
  issuer text NOT NULL, subject text NOT NULL, user_id uuid NOT NULL REFERENCES app_user(id),
  linked_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz,
  PRIMARY KEY (issuer,subject)
);
CREATE TABLE IF NOT EXISTS school_class (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES school(id),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 100), school_year text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed')),
  UNIQUE (school_id,id), UNIQUE (school_id,name,school_year)
);
CREATE TABLE IF NOT EXISTS class_membership (
  school_id uuid NOT NULL, class_id uuid NOT NULL, user_id uuid NOT NULL REFERENCES app_user(id),
  grant_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  role text NOT NULL CHECK (role IN ('teacher','student')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','revoked')),
  PRIMARY KEY (class_id,user_id),
  FOREIGN KEY (school_id,class_id) REFERENCES school_class(school_id,id)
);
CREATE TABLE IF NOT EXISTS class_invite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL,
  class_id uuid NOT NULL, token_hash bytea NOT NULL UNIQUE, created_by uuid NOT NULL REFERENCES app_user(id),
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher')),
  expires_at timestamptz NOT NULL, used_at timestamptz,
  FOREIGN KEY (school_id,class_id) REFERENCES school_class(school_id,id)
);
CREATE TABLE IF NOT EXISTS school_invite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES school(id),
  token_hash bytea NOT NULL UNIQUE, created_by uuid NOT NULL REFERENCES app_user(id),
  expires_at timestamptz NOT NULL, used_at timestamptz, revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS assignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL, class_id uuid NOT NULL,
  created_by uuid NOT NULL REFERENCES app_user(id), area text NOT NULL CHECK (area IN ('vocabulary','grammar','verbs','listening')),
  content_id text NOT NULL, content_version text NOT NULL, question_limit smallint NOT NULL CHECK (question_limit BETWEEN 1 AND 50),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  due_at timestamptz, status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (school_id,class_id) REFERENCES school_class(school_id,id),
  UNIQUE (school_id,id)
);
CREATE TABLE IF NOT EXISTS assignment_recipient (
  school_id uuid NOT NULL, assignment_id uuid NOT NULL, student_id uuid NOT NULL REFERENCES app_user(id),
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','removed')),
  PRIMARY KEY (assignment_id,student_id),
  FOREIGN KEY (school_id,assignment_id) REFERENCES assignment(school_id,id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS learning_event (
  id uuid PRIMARY KEY, school_id uuid NOT NULL, assignment_id uuid NOT NULL, student_id uuid NOT NULL REFERENCES app_user(id),
  area text NOT NULL CHECK (area IN ('vocabulary','grammar','verbs','listening')),
  content_id text NOT NULL, content_version text NOT NULL, question_id text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('correct','incorrect','completed')),
  attempt integer NOT NULL CHECK (attempt > 0), hints_used smallint NOT NULL DEFAULT 0 CHECK (hints_used BETWEEN 0 AND 20),
  practice_session uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (school_id,assignment_id) REFERENCES assignment(school_id,id) ON DELETE CASCADE,
  UNIQUE (school_id,id)
);
CREATE INDEX IF NOT EXISTS learning_event_student_area_idx ON learning_event(school_id,student_id,area,created_at);
CREATE INDEX IF NOT EXISTS assignment_class_due_idx ON assignment(school_id,class_id,due_at);
CREATE TABLE IF NOT EXISTS app_session (
  token_hash bytea PRIMARY KEY, user_id uuid NOT NULL REFERENCES app_user(id), school_id uuid REFERENCES school(id),
  role text NOT NULL CHECK (role IN ('teacher','student','school_admin','pending','select_school')),
  csrf_hash bytea NOT NULL, encrypted_id_token bytea, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz
);
CREATE TABLE IF NOT EXISTS oidc_transaction (
  handle_hash bytea PRIMARY KEY, expected_state text NOT NULL, expected_nonce text NOT NULL,
  encrypted_pkce_verifier bytea NOT NULL, kind text NOT NULL CHECK (kind IN ('login','logout')),
  created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, consumed_at timestamptz
);
CREATE TABLE IF NOT EXISTS audit_event (
  id bigserial PRIMARY KEY, school_id uuid REFERENCES school(id), actor_id uuid REFERENCES app_user(id),
  action text NOT NULL CHECK (action IN ('class_created','invite_created','school_invite_created','school_invite_revoked','assignment_created','assignment_closed','membership_approved','membership_revoked','export_created')),
  target_type text NOT NULL CHECK (target_type IN ('class','invite','school_invite','assignment','membership')), target_id uuid, created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (actor_id IS NOT NULL OR school_id IS NULL)
);

CREATE FUNCTION app_link_feide_identity(p_issuer text,p_subject text,p_display_name text)
RETURNS TABLE(user_id uuid,account_status text,school_id uuid,member_role text,school_name text,school_grant_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE found_identity record; member_count integer; linked_user_id uuid;
BEGIN
 SELECT fi.user_id,fi.revoked_at,u.status INTO found_identity
 FROM public.feide_identity fi JOIN public.app_user u ON u.id=fi.user_id
 WHERE fi.issuer=p_issuer AND fi.subject=p_subject FOR UPDATE OF fi,u;
 IF FOUND THEN
  IF found_identity.revoked_at IS NOT NULL OR found_identity.status IN ('blocked','deleted') THEN
   RAISE EXCEPTION 'identity access has been revoked' USING ERRCODE='28000';
  END IF;
  linked_user_id:=found_identity.user_id;
  UPDATE public.app_user SET display_name=p_display_name WHERE id=linked_user_id;
 ELSE
  INSERT INTO public.app_user(display_name,status) VALUES(p_display_name,'pending') RETURNING id INTO linked_user_id;
  INSERT INTO public.feide_identity(issuer,subject,user_id) VALUES(p_issuer,p_subject,linked_user_id);
 END IF;
 user_id:=linked_user_id;
 SELECT count(*) INTO member_count FROM public.school_membership m JOIN public.school s ON s.id=m.school_id
 WHERE m.user_id=linked_user_id AND m.status='active' AND s.status='active';
 IF member_count=1 THEN
  UPDATE public.app_user SET status='active' WHERE id=linked_user_id AND status='pending';
  RETURN QUERY SELECT linked_user_id,'active'::text,m.school_id,m.role,s.name,m.grant_id
   FROM public.school_membership m JOIN public.school s ON s.id=m.school_id
   WHERE m.user_id=linked_user_id AND m.status='active' AND s.status='active';
 ELSIF member_count>1 THEN
  UPDATE public.app_user SET status='active' WHERE id=linked_user_id AND status='pending';
  RETURN QUERY SELECT linked_user_id,'active'::text,m.school_id,m.role,s.name,m.grant_id
   FROM public.school_membership m JOIN public.school s ON s.id=m.school_id
   WHERE m.user_id=linked_user_id AND m.status='active' AND s.status='active' ORDER BY s.name;
 ELSE
  RETURN QUERY SELECT linked_user_id,'pending'::text,NULL::uuid,'pending'::text,NULL::text,NULL::uuid;
 END IF;
END $$;

CREATE FUNCTION app_resolve_session(p_token_hash bytea,p_now timestamptz)
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
  IF current_session.school_id IS NOT NULL OR v_user.status<>'pending' THEN RETURN; END IF;
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

CREATE FUNCTION app_create_session(p_token_hash bytea,p_user_id uuid,p_school_id uuid,p_role text,p_csrf_hash bytea,p_encrypted_id_token bytea,p_expires_at timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
BEGIN
 IF p_role='pending' THEN
  IF p_school_id IS NOT NULL OR NOT EXISTS (SELECT 1 FROM public.app_user u WHERE u.id=p_user_id AND u.status='pending') THEN RAISE EXCEPTION 'invalid pending session' USING ERRCODE='28000'; END IF;
 ELSIF p_role='select_school' THEN
  IF p_school_id IS NOT NULL OR NOT EXISTS (SELECT 1 FROM public.school_membership m WHERE m.user_id=p_user_id AND m.status='active') THEN RAISE EXCEPTION 'invalid school selector session' USING ERRCODE='28000'; END IF;
 ELSIF NOT EXISTS (SELECT 1 FROM public.school_membership m JOIN public.school s ON s.id=m.school_id
   WHERE m.user_id=p_user_id AND m.school_id=p_school_id AND m.role=p_role AND m.status='active' AND s.status='active') THEN
  RAISE EXCEPTION 'active school membership required' USING ERRCODE='28000';
 END IF;
 INSERT INTO public.app_session(token_hash,user_id,school_id,role,csrf_hash,encrypted_id_token,expires_at)
 VALUES(p_token_hash,p_user_id,p_school_id,p_role,p_csrf_hash,p_encrypted_id_token,p_expires_at);
END $$;

CREATE FUNCTION app_logout_session(p_token_hash bytea,p_now timestamptz)
RETURNS bytea LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE old_token bytea;
BEGIN
 SELECT encrypted_id_token INTO old_token FROM public.app_session WHERE token_hash=p_token_hash AND revoked_at IS NULL AND expires_at>p_now FOR UPDATE;
 IF NOT FOUND THEN RETURN NULL; END IF;
 UPDATE public.app_session SET revoked_at=p_now,encrypted_id_token=NULL WHERE token_hash=p_token_hash;
 RETURN old_token;
END $$;

CREATE FUNCTION app_redeem_class_invite(p_code_hash bytea,p_user_id uuid,p_session_hash bytea)
RETURNS TABLE(school_id uuid,role text,encrypted_logout_token bytea)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE invite record; active_session record;
BEGIN
 SELECT i.id,i.school_id,i.class_id,i.role INTO invite FROM public.class_invite i JOIN public.school_class c ON c.id=i.class_id JOIN public.school s ON s.id=i.school_id
  WHERE i.token_hash=p_code_hash AND i.used_at IS NULL AND i.expires_at>now() AND c.status='active' AND s.status='active' FOR UPDATE OF i;
 IF NOT FOUND THEN RAISE EXCEPTION 'invitation is invalid or expired' USING ERRCODE='28000'; END IF;
 SELECT s.school_id,s.encrypted_id_token INTO active_session FROM public.app_session s JOIN public.app_user u ON u.id=s.user_id
 JOIN public.school_membership m ON m.school_id=s.school_id AND m.user_id=s.user_id AND m.role=invite.role AND m.status='active'
 WHERE s.token_hash=p_session_hash AND s.user_id=p_user_id AND s.school_id=invite.school_id AND s.role=invite.role
  AND s.revoked_at IS NULL AND s.expires_at>now() AND u.status='active' FOR UPDATE OF s,m;
 IF NOT FOUND THEN RAISE EXCEPTION 'active, approved student school membership is required' USING ERRCODE='28000'; END IF;
 INSERT INTO public.class_membership(school_id,class_id,user_id,role,status)
 VALUES(invite.school_id,invite.class_id,p_user_id,invite.role,'pending')
 ON CONFLICT(class_id,user_id) DO UPDATE SET status='pending',grant_id=gen_random_uuid()
  WHERE class_membership.role=invite.role AND class_membership.status='revoked';
 IF NOT FOUND THEN RAISE EXCEPTION 'existing class membership requires review' USING ERRCODE='28000'; END IF;
 UPDATE public.class_invite SET used_at=now() WHERE id=invite.id;
 UPDATE public.app_session s SET revoked_at=now(),encrypted_id_token=NULL WHERE s.token_hash=p_session_hash AND s.user_id=p_user_id AND s.role='student';
 RETURN QUERY SELECT invite.school_id,invite.role,active_session.encrypted_id_token;
END $$;

CREATE FUNCTION app_lookup_class_invite(p_code_hash bytea,p_user_id uuid,p_session_hash bytea)
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
 SELECT i.id FROM public.class_invite i
 JOIN public.school_class c ON c.school_id=i.school_id AND c.id=i.class_id
 JOIN public.school s ON s.id=i.school_id
 JOIN public.app_session session ON session.token_hash=p_session_hash AND session.user_id=p_user_id
 JOIN public.app_user u ON u.id=session.user_id
 JOIN public.school_membership m ON m.school_id=i.school_id AND m.user_id=p_user_id AND m.role=i.role AND m.status='active'
 WHERE i.token_hash=p_code_hash AND i.used_at IS NULL AND i.expires_at>now() AND c.status='active' AND s.status='active'
  AND session.school_id=i.school_id AND session.role=i.role AND session.revoked_at IS NULL AND session.expires_at>now() AND u.status='active'
 LIMIT 1
$$;

CREATE FUNCTION app_redeem_school_invite(p_code_hash bytea,p_user_id uuid,p_session_hash bytea)
RETURNS TABLE(school_id uuid,role text,encrypted_logout_token bytea)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE invite record; active_session record; existing_membership_status text;
BEGIN
 SELECT i.id,i.school_id INTO invite FROM public.school_invite i JOIN public.school s ON s.id=i.school_id
  WHERE i.token_hash=p_code_hash AND i.used_at IS NULL AND i.revoked_at IS NULL AND i.expires_at>now() AND s.status='active' FOR UPDATE OF i;
 IF NOT FOUND THEN RAISE EXCEPTION 'invitation is invalid or expired' USING ERRCODE='28000'; END IF;
 SELECT s.user_id,s.encrypted_id_token INTO active_session FROM public.app_session s JOIN public.app_user u ON u.id=s.user_id
  WHERE s.token_hash=p_session_hash AND s.user_id=p_user_id AND s.school_id IS NULL AND s.role IN ('pending','select_school')
   AND s.revoked_at IS NULL AND s.expires_at>now() AND u.status IN ('pending','active') FOR UPDATE OF s,u;
 IF NOT FOUND THEN RAISE EXCEPTION 'active pending or school-selector Feide session is required' USING ERRCODE='28000'; END IF;
 IF EXISTS (SELECT 1 FROM public.school_membership m WHERE m.user_id=p_user_id AND m.school_id=invite.school_id AND m.status='active') THEN
  RAISE EXCEPTION 'identity already has access to this school' USING ERRCODE='28000';
 END IF;
 SELECT m.status INTO existing_membership_status FROM public.school_membership m
  WHERE m.school_id=invite.school_id AND m.user_id=p_user_id FOR UPDATE;
 IF FOUND THEN
  IF existing_membership_status<>'revoked' THEN RAISE EXCEPTION 'school membership requires review' USING ERRCODE='28000'; END IF;
  UPDATE public.school_membership m SET role='teacher',status='active',grant_id=gen_random_uuid()
   WHERE m.school_id=invite.school_id AND m.user_id=p_user_id AND m.status='revoked';
 ELSE
  INSERT INTO public.school_membership(school_id,user_id,role,status) VALUES(invite.school_id,p_user_id,'teacher','active');
 END IF;
 UPDATE public.app_user SET status='active' WHERE id=p_user_id;
 UPDATE public.school_invite SET used_at=now() WHERE id=invite.id;
 UPDATE public.app_session SET revoked_at=now(),encrypted_id_token=NULL WHERE token_hash=p_session_hash;
 RETURN QUERY SELECT invite.school_id,'teacher'::text,active_session.encrypted_id_token;
END $$;

CREATE FUNCTION app_lookup_school_invite(p_code_hash bytea,p_user_id uuid,p_session_hash bytea)
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
 SELECT i.id FROM public.school_invite i JOIN public.school s ON s.id=i.school_id
 JOIN public.app_session session ON session.token_hash=p_session_hash AND session.user_id=p_user_id
 JOIN public.app_user u ON u.id=session.user_id
 WHERE i.token_hash=p_code_hash AND i.used_at IS NULL AND i.revoked_at IS NULL AND i.expires_at>now() AND s.status='active'
  AND session.school_id IS NULL AND session.role IN ('pending','select_school') AND session.revoked_at IS NULL AND session.expires_at>now() AND u.status IN ('pending','active')
  AND NOT EXISTS (SELECT 1 FROM public.school_membership m WHERE m.user_id=p_user_id AND m.school_id=i.school_id AND m.status='active')
 LIMIT 1
$$;

CREATE FUNCTION app_approve_class_member(target_class uuid,target_student uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE v_school uuid;
BEGIN
 v_school:=nullif(current_setting('app.school_id',true),'')::uuid;
 IF current_setting('app.role',true)<>'teacher' OR NOT app_is_class_member(v_school,target_class,'teacher') THEN
  RAISE EXCEPTION 'teacher access required' USING ERRCODE='28000';
 END IF;
 PERFORM 1 FROM public.school_class c WHERE c.school_id=v_school AND c.id=target_class AND c.status='active' FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE public.class_membership cm SET status='active'
  WHERE cm.school_id=v_school AND cm.class_id=target_class AND cm.user_id=target_student
   AND cm.role IN ('student','teacher') AND cm.status='pending'
   AND EXISTS (SELECT 1 FROM public.school_membership sm JOIN public.app_user u ON u.id=sm.user_id
    WHERE sm.school_id=v_school AND sm.user_id=target_student AND sm.role=cm.role AND sm.status='active' AND u.status='active');
 RETURN FOUND;
END $$;

CREATE FUNCTION app_revoke_class_member(target_class uuid,target_student uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE school uuid;
BEGIN
 school:=nullif(current_setting('app.school_id',true),'')::uuid;
 IF current_setting('app.role',true)<>'teacher' OR NOT app_is_class_member(school,target_class,'teacher') THEN RAISE EXCEPTION 'teacher access required' USING ERRCODE='28000'; END IF;
 PERFORM 1 FROM public.school_class c WHERE c.school_id=school AND c.id=target_class AND c.status='active' FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF target_student=nullif(current_setting('app.user_id',true),'')::uuid THEN RETURN false; END IF;
 IF EXISTS (SELECT 1 FROM public.class_membership cm WHERE cm.school_id=school AND cm.class_id=target_class AND cm.user_id=target_student AND cm.role='teacher' AND cm.status='active')
   AND (SELECT count(*) FROM public.class_membership cm WHERE cm.school_id=school AND cm.class_id=target_class AND cm.role='teacher' AND cm.status='active')<=1 THEN
  RETURN false;
 END IF;
 UPDATE public.class_membership SET status='revoked'
  WHERE school_id=school AND class_id=target_class AND user_id=target_student AND user_id<>nullif(current_setting('app.user_id',true),'')::uuid
   AND role IN ('student','teacher') AND status IN ('active','pending');
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE public.assignment_recipient ar SET status='removed' FROM public.assignment a
  WHERE a.school_id=school AND a.class_id=target_class AND ar.school_id=a.school_id AND ar.assignment_id=a.id AND ar.student_id=target_student AND ar.status='assigned';
 RETURN true;
END $$;

CREATE FUNCTION app_my_schools()
RETURNS TABLE(school_id uuid,school_name text,role text,grant_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
 SELECT m.school_id,s.name,m.role,m.grant_id FROM public.school_membership m JOIN public.school s ON s.id=m.school_id
 WHERE m.user_id=nullif(current_setting('app.user_id',true),'')::uuid AND m.status='active' AND s.status='active'
 ORDER BY s.name
$$;

CREATE TABLE IF NOT EXISTS schema_migration (
  version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO schema_migration(version) VALUES ('001_initial') ON CONFLICT DO NOTHING;

-- The web role must not own these tables or have BYPASSRLS. Requests set these
-- transaction-local values only after loading a live server-side session.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['app_user','feide_identity','app_session','school','school_membership','school_class','class_membership','class_invite','school_invite','assignment','assignment_recipient','learning_event','audit_event'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
CREATE POLICY school_scope ON school FOR SELECT USING (id = nullif(current_setting('app.school_id',true),'')::uuid);
CREATE FUNCTION app_is_class_member(target_school uuid, target_class uuid, required_role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public SET row_security = off AS $$
 SELECT EXISTS (SELECT 1 FROM public.class_membership cm
  WHERE cm.school_id=target_school AND cm.class_id=target_class
   AND cm.user_id=nullif(current_setting('app.user_id',true),'')::uuid
   AND cm.role=required_role AND cm.status='active')
$$;
CREATE FUNCTION app_can_view_user(target_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public SET row_security = off AS $$
 SELECT target_user=nullif(current_setting('app.user_id',true),'')::uuid OR
  (current_setting('app.role',true)='teacher' AND EXISTS (
   SELECT 1 FROM public.class_membership target
   JOIN public.class_membership teacher ON teacher.school_id=target.school_id AND teacher.class_id=target.class_id
   WHERE target.user_id=target_user AND target.school_id=nullif(current_setting('app.school_id',true),'')::uuid
    AND target.status IN ('active','pending') AND teacher.user_id=nullif(current_setting('app.user_id',true),'')::uuid
    AND target.role='student' AND teacher.role='teacher' AND teacher.status='active'))
$$;
CREATE POLICY app_user_scope ON app_user FOR SELECT USING (app_can_view_user(id));
CREATE POLICY school_membership_scope ON school_membership FOR SELECT USING (
 school_id=nullif(current_setting('app.school_id',true),'')::uuid AND
 (user_id=nullif(current_setting('app.user_id',true),'')::uuid OR current_setting('app.role',true)='school_admin'));
CREATE FUNCTION app_is_assignment_teacher(target_school uuid, target_assignment uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public SET row_security = off AS $$
 SELECT EXISTS (SELECT 1 FROM public.assignment a JOIN public.class_membership cm
  ON cm.school_id=a.school_id AND cm.class_id=a.class_id
  WHERE a.school_id=target_school AND a.id=target_assignment
   AND cm.user_id=nullif(current_setting('app.user_id',true),'')::uuid
   AND cm.role='teacher' AND cm.status='active')
$$;
CREATE FUNCTION app_is_assignment_recipient(target_school uuid, target_assignment uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public SET row_security = off AS $$
 SELECT EXISTS (SELECT 1 FROM public.assignment_recipient ar
  WHERE ar.school_id=target_school AND ar.assignment_id=target_assignment
   AND ar.student_id=nullif(current_setting('app.user_id',true),'')::uuid AND ar.status='assigned')
$$;
CREATE FUNCTION app_can_submit(target_school uuid,target_assignment uuid,target_area text,target_content text,target_version text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
 SELECT EXISTS (SELECT 1 FROM public.assignment a JOIN public.assignment_recipient ar
  ON ar.school_id=a.school_id AND ar.assignment_id=a.id
  JOIN public.class_membership cm ON cm.school_id=a.school_id AND cm.class_id=a.class_id
  WHERE a.school_id=target_school AND a.id=target_assignment AND a.status='published'
   AND a.area=target_area AND a.content_id=target_content AND a.content_version=target_version
   AND ar.student_id=nullif(current_setting('app.user_id',true),'')::uuid AND ar.status='assigned'
   AND cm.user_id=nullif(current_setting('app.user_id',true),'')::uuid AND cm.role='student' AND cm.status='active')
$$;
CREATE POLICY school_class_scope ON school_class FOR SELECT USING (
 school_id = nullif(current_setting('app.school_id',true),'')::uuid AND (
 current_setting('app.role',true) = 'school_admin' OR app_is_class_member(school_class.school_id,school_class.id,'teacher')
 OR app_is_class_member(school_class.school_id,school_class.id,'student')));
CREATE POLICY school_class_teacher_insert ON school_class FOR INSERT WITH CHECK (
 school_id=nullif(current_setting('app.school_id',true),'')::uuid AND current_setting('app.role',true)='teacher'
 AND EXISTS (SELECT 1 FROM school_membership sm WHERE sm.school_id=school_class.school_id AND sm.user_id=nullif(current_setting('app.user_id',true),'')::uuid AND sm.role='teacher' AND sm.status='active'));
CREATE POLICY school_class_teacher_update ON school_class FOR UPDATE USING (
 school_id=nullif(current_setting('app.school_id',true),'')::uuid AND app_is_class_member(school_class.school_id,school_class.id,'teacher'))
 WITH CHECK (school_id=nullif(current_setting('app.school_id',true),'')::uuid AND app_is_class_member(school_class.school_id,school_class.id,'teacher'));
CREATE POLICY class_membership_scope ON class_membership FOR SELECT USING (
 school_id = nullif(current_setting('app.school_id',true),'')::uuid AND (
 user_id=nullif(current_setting('app.user_id',true),'')::uuid OR current_setting('app.role',true)='school_admin'
 OR app_is_class_member(class_membership.school_id,class_membership.class_id,'teacher')));
CREATE POLICY class_membership_teacher_self_insert ON class_membership FOR INSERT WITH CHECK (
 school_id=nullif(current_setting('app.school_id',true),'')::uuid AND user_id=nullif(current_setting('app.user_id',true),'')::uuid
 AND role='teacher' AND current_setting('app.role',true)='teacher'
 AND EXISTS (SELECT 1 FROM school_membership sm WHERE sm.school_id=class_membership.school_id AND sm.user_id=class_membership.user_id AND sm.role='teacher' AND sm.status='active'));
CREATE POLICY class_invite_scope ON class_invite FOR SELECT USING (
 school_id=nullif(current_setting('app.school_id',true),'')::uuid AND current_setting('app.role',true) IN ('teacher','school_admin')
 AND (current_setting('app.role',true)='school_admin' OR app_is_class_member(class_invite.school_id,class_invite.class_id,'teacher')));
CREATE POLICY class_invite_teacher_insert ON class_invite FOR INSERT WITH CHECK (
 school_id=nullif(current_setting('app.school_id',true),'')::uuid AND current_setting('app.role',true)='teacher'
 AND app_is_class_member(class_invite.school_id,class_invite.class_id,'teacher'));
CREATE POLICY school_invite_admin_scope ON school_invite FOR SELECT USING (
 school_id=nullif(current_setting('app.school_id',true),'')::uuid AND current_setting('app.role',true)='school_admin');
CREATE POLICY school_invite_admin_insert ON school_invite FOR INSERT WITH CHECK (
 school_id=nullif(current_setting('app.school_id',true),'')::uuid AND current_setting('app.role',true)='school_admin'
 AND created_by=nullif(current_setting('app.user_id',true),'')::uuid);
CREATE POLICY school_invite_admin_update ON school_invite FOR UPDATE USING (
 school_id=nullif(current_setting('app.school_id',true),'')::uuid AND current_setting('app.role',true)='school_admin')
 WITH CHECK (school_id=nullif(current_setting('app.school_id',true),'')::uuid AND current_setting('app.role',true)='school_admin');
CREATE POLICY assignment_scope ON assignment FOR SELECT USING (
 school_id=nullif(current_setting('app.school_id',true),'')::uuid AND (
 current_setting('app.role',true)='school_admin' OR (current_setting('app.role',true)='teacher' AND app_is_class_member(assignment.school_id,assignment.class_id,'teacher'))
 OR (current_setting('app.role',true)='student' AND app_is_assignment_recipient(assignment.school_id,assignment.id))));
CREATE POLICY assignment_teacher_insert ON assignment FOR INSERT WITH CHECK (
 school_id=nullif(current_setting('app.school_id',true),'')::uuid AND current_setting('app.role',true)='teacher'
 AND created_by=nullif(current_setting('app.user_id',true),'')::uuid AND app_is_class_member(school_id,class_id,'teacher'));
CREATE POLICY assignment_teacher_update ON assignment FOR UPDATE USING (
 school_id=nullif(current_setting('app.school_id',true),'')::uuid AND current_setting('app.role',true)='teacher' AND app_is_class_member(school_id,class_id,'teacher'))
 WITH CHECK (school_id=nullif(current_setting('app.school_id',true),'')::uuid AND current_setting('app.role',true)='teacher' AND app_is_class_member(school_id,class_id,'teacher'));
CREATE POLICY assignment_recipient_scope ON assignment_recipient FOR SELECT USING (
 school_id=nullif(current_setting('app.school_id',true),'')::uuid AND (
 student_id=nullif(current_setting('app.user_id',true),'')::uuid
 OR (current_setting('app.role',true)='teacher' AND app_is_assignment_teacher(assignment_recipient.school_id,assignment_recipient.assignment_id))));
CREATE POLICY assignment_recipient_teacher_insert ON assignment_recipient FOR INSERT WITH CHECK (
 school_id=nullif(current_setting('app.school_id',true),'')::uuid AND current_setting('app.role',true)='teacher'
 AND app_is_assignment_teacher(school_id,assignment_id));
CREATE POLICY learning_event_scope ON learning_event FOR SELECT USING (
 school_id=nullif(current_setting('app.school_id',true),'')::uuid AND (
 student_id=nullif(current_setting('app.user_id',true),'')::uuid
 OR app_is_assignment_teacher(learning_event.school_id,learning_event.assignment_id)));
CREATE POLICY learning_event_student_insert ON learning_event FOR INSERT WITH CHECK (
 school_id=nullif(current_setting('app.school_id',true),'')::uuid AND current_setting('app.role',true)='student'
 AND student_id=nullif(current_setting('app.user_id',true),'')::uuid
 AND app_can_submit(school_id,assignment_id,area,content_id,content_version));
CREATE POLICY audit_event_scope ON audit_event FOR SELECT USING (
 school_id IS NULL OR school_id=nullif(current_setting('app.school_id',true),'')::uuid
);
CREATE POLICY audit_event_actor_insert ON audit_event FOR INSERT WITH CHECK (
 actor_id=nullif(current_setting('app.user_id',true),'')::uuid AND
 (school_id IS NULL OR school_id=nullif(current_setting('app.school_id',true),'')::uuid));

DO $$ DECLARE fn text; BEGIN
 FOREACH fn IN ARRAY ARRAY[
  'app_is_class_member(uuid,uuid,text)','app_can_view_user(uuid)','app_is_assignment_teacher(uuid,uuid)',
  'app_is_assignment_recipient(uuid,uuid)','app_can_submit(uuid,uuid,text,text,text)','app_link_feide_identity(text,text,text)',
  'app_resolve_session(bytea,timestamp with time zone)','app_create_session(bytea,uuid,uuid,text,bytea,bytea,timestamp with time zone)',
  'app_logout_session(bytea,timestamp with time zone)','app_redeem_class_invite(bytea,uuid,bytea)','app_lookup_class_invite(bytea,uuid,bytea)','app_redeem_school_invite(bytea,uuid,bytea)','app_lookup_school_invite(bytea,uuid,bytea)','app_approve_class_member(uuid,uuid)','app_revoke_class_member(uuid,uuid)','app_my_schools()'
 ] LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',fn);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO app_runtime',fn);
 END LOOP;
END $$;
COMMIT;
