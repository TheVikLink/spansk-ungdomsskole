BEGIN;
ALTER TABLE app_session ADD COLUMN acr text;
DROP FUNCTION app_create_session(bytea,uuid,uuid,text,bytea,bytea,timestamptz);
CREATE OR REPLACE FUNCTION app_logout_session(p_token_hash bytea,p_now timestamptz)
RETURNS bytea LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE old_token bytea;
BEGIN
 SELECT encrypted_id_token INTO old_token FROM public.app_session WHERE token_hash=p_token_hash AND revoked_at IS NULL AND expires_at>p_now FOR UPDATE;
 IF NOT FOUND THEN RETURN NULL; END IF;
 UPDATE public.app_session SET revoked_at=p_now,encrypted_id_token=NULL,acr=NULL WHERE token_hash=p_token_hash;
 RETURN old_token;
END $$;

CREATE FUNCTION app_create_session(p_token_hash bytea,p_user_id uuid,p_school_id uuid,p_role text,p_csrf_hash bytea,p_encrypted_id_token bytea,p_expires_at timestamptz,p_acr text)
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
 INSERT INTO public.app_session(token_hash,user_id,school_id,role,csrf_hash,encrypted_id_token,expires_at,acr)
 VALUES(p_token_hash,p_user_id,p_school_id,p_role,p_csrf_hash,p_encrypted_id_token,p_expires_at,p_acr);
END $$;

CREATE FUNCTION app_session_auth_level(p_token_hash bytea)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
 SELECT s.acr FROM public.app_session s JOIN public.app_user u ON u.id=s.user_id
 WHERE s.token_hash=p_token_hash AND s.revoked_at IS NULL AND s.expires_at>now() AND u.status IN ('active','pending')
$$;
REVOKE ALL ON FUNCTION app_create_session(bytea,uuid,uuid,text,bytea,bytea,timestamptz,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_session_auth_level(bytea) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_create_session(bytea,uuid,uuid,text,bytea,bytea,timestamptz,text),app_session_auth_level(bytea) TO app_runtime;
INSERT INTO schema_migration(version) VALUES ('004_session_auth_level') ON CONFLICT DO NOTHING;
COMMIT;
