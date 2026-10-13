BEGIN;

-- Keep this migration during runtime rollback; an older runtime must refuse
-- school invitations until a v2 journal-aware runtime is restored.
ALTER TABLE public.school_invite ADD COLUMN member_role text NOT NULL DEFAULT 'teacher'
  CHECK (member_role IN ('teacher','student'));

-- Old deployments must fail closed after this migration. Only the v2 caller
-- checks the independent journal while holding the database transaction locks.
CREATE OR REPLACE FUNCTION app_lookup_school_invite(p_code_hash bytea,p_user_id uuid,p_session_hash bytea)
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
 SELECT NULL::uuid
$$;
CREATE OR REPLACE FUNCTION app_redeem_school_invite(p_code_hash bytea,p_user_id uuid,p_session_hash bytea)
RETURNS TABLE(school_id uuid,role text,encrypted_logout_token bytea)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
BEGIN
 RAISE EXCEPTION 'school invitation runtime upgrade required' USING ERRCODE='28000';
END $$;

CREATE FUNCTION app_redeem_school_invite_v2(p_code_hash bytea,p_user_id uuid,p_session_hash bytea)
RETURNS TABLE(school_id uuid,role text,encrypted_logout_token bytea,invite_id uuid,school_grant_id uuid,issuer_grant_id uuid,issuer_user_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE invite record; active_session record; target_school uuid; school_grant uuid; issuer_grant uuid;
BEGIN
 SELECT i.school_id INTO target_school FROM public.school_invite i WHERE i.token_hash=p_code_hash;
 IF NOT FOUND THEN RAISE EXCEPTION 'invitation is invalid or expired' USING ERRCODE='28000'; END IF;
 -- Owner before school follows the owner-blocking lock order. The school lock
 -- also serializes with administrator membership revocation.
 PERFORM 1 FROM public.school_owner o JOIN public.school s ON s.owner_id=o.id
  WHERE s.id=target_school AND o.status='active' FOR SHARE OF o;
 IF NOT FOUND THEN RAISE EXCEPTION 'school owner is inactive' USING ERRCODE='28000'; END IF;
 SELECT s.access_grant_id INTO school_grant FROM public.school s WHERE s.id=target_school AND s.status='active' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'school is inactive' USING ERRCODE='28000'; END IF;
 SELECT i.id,i.school_id,i.member_role,i.created_by INTO invite FROM public.school_invite i
  WHERE i.token_hash=p_code_hash AND i.school_id=target_school AND i.used_at IS NULL
   AND i.revoked_at IS NULL AND i.expires_at>now() AND i.member_role IN ('teacher','student') FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'invitation is invalid or expired' USING ERRCODE='28000'; END IF;
 -- A single stable user-lock order prevents cross-school invitations from
 -- deadlocking. Account deletion also locks the user before membership/session.
 PERFORM 1 FROM public.app_user u WHERE u.id IN (invite.created_by,p_user_id) ORDER BY u.id FOR UPDATE;
 SELECT m.grant_id INTO issuer_grant FROM public.school_membership m JOIN public.app_user u ON u.id=m.user_id
  WHERE m.school_id=invite.school_id AND m.user_id=invite.created_by AND m.role='school_admin'
   AND m.status='active' AND u.status='active' FOR SHARE OF m;
 IF NOT FOUND THEN RAISE EXCEPTION 'invitation issuer is no longer authorized' USING ERRCODE='28000'; END IF;
 SELECT s.user_id,s.encrypted_id_token INTO active_session FROM public.app_session s JOIN public.app_user u ON u.id=s.user_id
  WHERE s.token_hash=p_session_hash AND s.user_id=p_user_id AND s.school_id IS NULL AND s.role IN ('pending','select_school')
   AND s.revoked_at IS NULL AND s.expires_at>now() AND u.status IN ('pending','active') FOR UPDATE OF s;
 IF NOT FOUND THEN RAISE EXCEPTION 'active pending or school-selector Feide session is required' USING ERRCODE='28000'; END IF;
 -- Revoked memberships require an independently reviewed reinstatement path.
 -- An ordinary invitation may never revive them or change their former role.
 IF EXISTS (SELECT 1 FROM public.school_membership m WHERE m.user_id=p_user_id AND m.school_id=invite.school_id) THEN
  RAISE EXCEPTION 'existing school membership requires review' USING ERRCODE='28000';
 END IF;
 INSERT INTO public.school_membership(school_id,user_id,role,status)
  VALUES(invite.school_id,p_user_id,invite.member_role,'active');
 UPDATE public.app_user SET status='active' WHERE id=p_user_id;
 UPDATE public.school_invite SET used_at=now() WHERE id=invite.id;
 UPDATE public.app_session SET revoked_at=now(),encrypted_id_token=NULL WHERE token_hash=p_session_hash;
 RETURN QUERY SELECT invite.school_id,invite.member_role::text,active_session.encrypted_id_token,invite.id,school_grant,issuer_grant,invite.created_by;
END $$;

-- Existing signatures retain their ACLs but are disabled. The new signature
-- is executable only by the server role, never PUBLIC or browser roles.
REVOKE ALL ON FUNCTION app_redeem_school_invite_v2(bytea,uuid,bytea) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_redeem_school_invite_v2(bytea,uuid,bytea) TO app_runtime;
INSERT INTO schema_migration(version) VALUES ('009_student_school_invitations');
COMMIT;
