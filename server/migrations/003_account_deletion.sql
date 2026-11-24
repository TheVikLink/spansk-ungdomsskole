BEGIN;
CREATE FUNCTION app_prepare_own_account_deletion(target_user uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE current_user_id uuid; account_status text;
BEGIN
 current_user_id:=nullif(current_setting('app.user_id',true),'')::uuid;
 IF current_user_id IS NULL OR current_user_id<>target_user THEN
  RAISE EXCEPTION 'own account required' USING ERRCODE='28000';
 END IF;
 PERFORM 1 FROM public.feide_identity WHERE user_id=target_user ORDER BY issuer,subject FOR UPDATE;
 SELECT status INTO account_status FROM public.app_user WHERE id=target_user FOR UPDATE;
 RETURN FOUND AND account_status<>'deleted';
END $$;

CREATE FUNCTION app_delete_own_account(target_user uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
BEGIN
 IF NOT app_prepare_own_account_deletion(target_user) THEN RETURN false; END IF;
 UPDATE public.app_user SET status='deleted',display_name='Slettet konto' WHERE id=target_user;
 DELETE FROM public.feide_identity WHERE user_id=target_user;
 UPDATE public.school_membership SET status='revoked' WHERE user_id=target_user AND status='active';
 UPDATE public.class_membership SET status='revoked' WHERE user_id=target_user AND status IN ('active','pending');
 DELETE FROM public.assignment_recipient WHERE student_id=target_user;
 DELETE FROM public.learning_event WHERE student_id=target_user;
 UPDATE public.app_session SET revoked_at=coalesce(revoked_at,now()),encrypted_id_token=NULL,acr=NULL WHERE user_id=target_user;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION app_prepare_own_account_deletion(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_delete_own_account(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_prepare_own_account_deletion(uuid),app_delete_own_account(uuid) TO app_runtime;
INSERT INTO schema_migration(version) VALUES ('003_account_deletion') ON CONFLICT DO NOTHING;
COMMIT;
