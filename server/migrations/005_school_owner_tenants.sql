BEGIN;

CREATE TABLE school_owner (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 160),
  external_reference text NOT NULL UNIQUE CHECK (length(external_reference) BETWEEN 1 AND 160),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','blocked')),
  verification_reference text,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'active' OR (
    external_reference NOT LIKE 'migration-unverified:%'
    AND verification_reference IS NOT NULL AND length(verification_reference) BETWEEN 4 AND 120
    AND verified_by IS NOT NULL AND length(verified_by) BETWEEN 2 AND 80
    AND verified_at IS NOT NULL
  ))
);

ALTER TABLE school ADD COLUMN owner_id uuid;
ALTER TABLE school ADD COLUMN access_grant_id uuid NOT NULL DEFAULT gen_random_uuid();
-- Existing school records have no trustworthy owner reference. Give them
-- individual pending placeholders and close them until an operator verifies ownership.
INSERT INTO school_owner(id,display_name,external_reference,status)
SELECT gen_random_uuid(), 'Uavklart skoleeier for skole ' || id::text,
       'migration-unverified:' || id::text, 'pending'
FROM school;
UPDATE school s SET owner_id=o.id, status='blocked'
FROM school_owner o WHERE o.external_reference='migration-unverified:' || s.id::text;

ALTER TABLE school ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE school ADD CONSTRAINT school_owner_fk FOREIGN KEY (owner_id) REFERENCES school_owner(id);
ALTER TABLE school ADD CONSTRAINT school_owner_id_unique UNIQUE (owner_id,id);
CREATE INDEX school_owner_id_idx ON school(owner_id);
CREATE UNIQUE INDEX school_access_grant_id_unique ON school(access_grant_id);

CREATE TABLE school_owner_lifecycle_event (
  id bigserial PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES school_owner(id),
  school_id uuid REFERENCES school(id),
  action text NOT NULL CHECK (action IN ('owner_activated','school_assigned','owner_blocked')),
  operator_id text NOT NULL CHECK (length(operator_id) BETWEEN 2 AND 80),
  authorization_reference text NOT NULL CHECK (length(authorization_reference) BETWEEN 4 AND 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((action='school_assigned') = (school_id IS NOT NULL))
);

CREATE FUNCTION app_reject_school_owner_event_mutation() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN RAISE EXCEPTION 'school-owner lifecycle events are append-only' USING ERRCODE='55000'; END $$;
CREATE TRIGGER school_owner_event_no_update BEFORE UPDATE OR DELETE ON school_owner_lifecycle_event
FOR EACH ROW EXECUTE FUNCTION app_reject_school_owner_event_mutation();

CREATE FUNCTION app_guard_school_owner_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE owner_status text;
BEGIN
  SELECT status INTO owner_status FROM public.school_owner WHERE id=NEW.owner_id;
  IF owner_status IS NULL THEN RAISE EXCEPTION 'school owner is required' USING ERRCODE='23503'; END IF;
  IF NEW.status='active' AND owner_status<>'active' THEN
    RAISE EXCEPTION 'an active school requires an active verified owner' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER school_owner_status_guard BEFORE INSERT OR UPDATE OF owner_id,status ON school
FOR EACH ROW EXECUTE FUNCTION app_guard_school_owner_status();

CREATE FUNCTION app_block_schools_for_inactive_owner() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF OLD.status='active' AND NEW.status<>'active' THEN
    UPDATE public.school SET status='blocked' WHERE owner_id=NEW.id AND status='active';
    UPDATE public.school_membership SET status='revoked' WHERE school_id IN (SELECT id FROM public.school WHERE owner_id=NEW.id);
    UPDATE public.class_membership SET status='revoked' WHERE school_id IN (SELECT id FROM public.school WHERE owner_id=NEW.id);
    UPDATE public.school_invite SET revoked_at=coalesce(revoked_at,now()) WHERE school_id IN (SELECT id FROM public.school WHERE owner_id=NEW.id);
    UPDATE public.class_invite SET used_at=coalesce(used_at,now()) WHERE school_id IN (SELECT id FROM public.school WHERE owner_id=NEW.id);
    UPDATE public.app_session SET revoked_at=coalesce(revoked_at,now()),encrypted_id_token=NULL,acr=NULL
      WHERE school_id IN (SELECT id FROM public.school WHERE owner_id=NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER school_owner_block_children AFTER UPDATE OF status ON school_owner
FOR EACH ROW EXECUTE FUNCTION app_block_schools_for_inactive_owner();

CREATE FUNCTION app_provision_school_owner(
  p_display_name text, p_external_reference text, p_operator_id text,
  p_authorization_reference text, p_school_ids uuid[]
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE owner_uuid uuid; school_uuid uuid;
BEGIN
  IF p_display_name IS NULL OR length(trim(p_display_name)) NOT BETWEEN 1 AND 160
     OR p_external_reference IS NULL OR length(trim(p_external_reference)) NOT BETWEEN 1 AND 160
     OR p_external_reference LIKE 'migration-unverified:%'
     OR p_operator_id IS NULL OR p_operator_id !~ '^[A-Za-z0-9@._-]{2,80}$'
     OR p_authorization_reference IS NULL OR p_authorization_reference !~ '^[A-Za-z0-9._/-]{4,120}$'
     OR p_school_ids IS NULL OR cardinality(p_school_ids)=0 THEN
    RAISE EXCEPTION 'verified owner provisioning details are required' USING ERRCODE='22023';
  END IF;
  IF (SELECT count(DISTINCT x) FROM unnest(p_school_ids) AS x) <> cardinality(p_school_ids) THEN
    RAISE EXCEPTION 'school list must not contain duplicates' USING ERRCODE='22023';
  END IF;

  SELECT id INTO owner_uuid FROM public.school_owner
   WHERE external_reference=trim(p_external_reference) FOR UPDATE;
  IF owner_uuid IS NULL THEN
    INSERT INTO public.school_owner(display_name,external_reference,status,verification_reference,verified_by,verified_at)
    VALUES(trim(p_display_name),trim(p_external_reference),'active',trim(p_authorization_reference),trim(p_operator_id),now())
    RETURNING id INTO owner_uuid;
  ELSE
    UPDATE public.school_owner SET display_name=trim(p_display_name),status='active',
      verification_reference=trim(p_authorization_reference),verified_by=trim(p_operator_id),verified_at=now()
      WHERE id=owner_uuid;
  END IF;
  INSERT INTO public.school_owner_lifecycle_event(owner_id,action,operator_id,authorization_reference)
  VALUES(owner_uuid,'owner_activated',trim(p_operator_id),trim(p_authorization_reference));

  FOREACH school_uuid IN ARRAY p_school_ids LOOP
    PERFORM 1 FROM public.school WHERE id=school_uuid AND status='blocked' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'school is missing or not awaiting owner verification' USING ERRCODE='22023'; END IF;
    UPDATE public.school SET owner_id=owner_uuid,access_grant_id=gen_random_uuid() WHERE id=school_uuid;
    INSERT INTO public.school_owner_lifecycle_event(owner_id,school_id,action,operator_id,authorization_reference)
    VALUES(owner_uuid,school_uuid,'school_assigned',trim(p_operator_id),trim(p_authorization_reference));
    UPDATE public.school SET status='active' WHERE id=school_uuid;
  END LOOP;
  RETURN owner_uuid;
END $$;
REVOKE ALL ON FUNCTION app_provision_school_owner(text,text,text,text,uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_provision_school_owner(text,text,text,text,uuid[]) FROM app_runtime;
GRANT EXECUTE ON FUNCTION app_provision_school_owner(text,text,text,text,uuid[]) TO school_owner_provisioner;

CREATE FUNCTION app_block_school_owner(p_owner_id uuid, p_operator_id text, p_authorization_reference text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE affected_owner uuid;
BEGIN
  IF p_operator_id IS NULL OR p_operator_id !~ '^[A-Za-z0-9@._-]{2,80}$'
     OR p_authorization_reference IS NULL OR p_authorization_reference !~ '^[A-Za-z0-9._/-]{4,120}$' THEN
    RAISE EXCEPTION 'operator and authorization reference are required' USING ERRCODE='22023';
  END IF;
  UPDATE public.school_owner SET status='blocked' WHERE id=p_owner_id AND status='active' RETURNING id INTO affected_owner;
  IF affected_owner IS NULL THEN RETURN false; END IF;
  INSERT INTO public.school_owner_lifecycle_event(owner_id,action,operator_id,authorization_reference)
  VALUES(affected_owner,'owner_blocked',trim(p_operator_id),trim(p_authorization_reference));
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION app_block_school_owner(uuid,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_block_school_owner(uuid,text,text) FROM app_runtime;
GRANT EXECUTE ON FUNCTION app_block_school_owner(uuid,text,text) TO school_owner_provisioner;

CREATE FUNCTION app_owner_school_access_grants(p_owner_id uuid)
RETURNS TABLE(owner_status text,school_id uuid,access_grant_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
 SELECT o.status,s.id,s.access_grant_id FROM public.school_owner o
 LEFT JOIN public.school s ON s.owner_id=o.id AND s.status='active'
 WHERE o.id=p_owner_id ORDER BY s.id
$$;
REVOKE ALL ON FUNCTION app_owner_school_access_grants(uuid) FROM PUBLIC,app_runtime;
GRANT EXECUTE ON FUNCTION app_owner_school_access_grants(uuid) TO school_owner_provisioner;

CREATE FUNCTION app_lock_school_owner_access_grants(p_owner_id uuid)
RETURNS TABLE(owner_status text,school_id uuid,access_grant_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
BEGIN
  SELECT o.status INTO owner_status FROM public.school_owner o WHERE o.id=p_owner_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  RETURN QUERY SELECT owner_status,s.id,s.access_grant_id FROM public.school s
   WHERE s.owner_id=p_owner_id AND s.status='active' ORDER BY s.id;
  IF NOT FOUND THEN RETURN QUERY SELECT owner_status,NULL::uuid,NULL::uuid; END IF;
END $$;
REVOKE ALL ON FUNCTION app_lock_school_owner_access_grants(uuid) FROM PUBLIC,app_runtime;
GRANT EXECUTE ON FUNCTION app_lock_school_owner_access_grants(uuid) TO school_owner_provisioner;

CREATE FUNCTION app_school_access_grant(p_school_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
 SELECT s.access_grant_id FROM public.school s JOIN public.school_owner o ON o.id=s.owner_id
 WHERE s.id=p_school_id AND s.status='active' AND o.status='active'
$$;
REVOKE ALL ON FUNCTION app_school_access_grant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_school_access_grant(uuid) TO app_runtime;

REVOKE ALL ON school_owner,school_owner_lifecycle_event FROM PUBLIC,app_runtime;
REVOKE ALL ON SEQUENCE school_owner_lifecycle_event_id_seq FROM PUBLIC,app_runtime;

INSERT INTO schema_migration(version) VALUES ('005_school_owner_tenants') ON CONFLICT DO NOTHING;

COMMIT;
