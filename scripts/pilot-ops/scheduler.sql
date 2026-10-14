BEGIN;
DO $$ BEGIN
 IF current_database()<>'postgres' OR session_user<>'postgres' THEN RAISE EXCEPTION 'Exact staging operator required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.schema_migration WHERE version='011_bounded_retention_scheduler') THEN RAISE EXCEPTION 'Reviewed lifecycle runtime required'; END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE SCHEMA pilot_scheduler AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA pilot_scheduler FROM PUBLIC,anon,authenticated,app_runtime,school_retention_operator,school_data_operator;
CREATE TABLE pilot_scheduler.configuration(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),expires_at timestamptz NOT NULL,enabled boolean NOT NULL DEFAULT false);
INSERT INTO pilot_scheduler.configuration(expires_at) VALUES(now()+interval '7 days');
CREATE TABLE pilot_scheduler.request(id bigint PRIMARY KEY,requested_at timestamptz NOT NULL DEFAULT now(),observed_at timestamptz,status_code integer,failed boolean);
ALTER TABLE pilot_scheduler.configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_scheduler.request ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA pilot_scheduler FROM PUBLIC,anon,authenticated,app_runtime,school_retention_operator,school_data_operator;
-- pg_net's queue temporarily contains a credential; application roles cannot read it.
REVOKE ALL ON net.http_request_queue,net._http_response FROM PUBLIC,anon,authenticated,app_runtime,school_retention_operator,school_data_operator;
CREATE FUNCTION pilot_scheduler.enqueue() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE caller text;request_id bigint;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pilot_scheduler.configuration WHERE enabled AND expires_at>clock_timestamp()) THEN RETURN; END IF;
 UPDATE pilot_scheduler.request q SET observed_at=now(),status_code=r.status_code,failed=(coalesce(r.status_code,0)<>200 OR coalesce(r.timed_out,false) OR r.error_msg IS NOT NULL) FROM net._http_response r WHERE r.id=q.id AND q.observed_at IS NULL;
 IF EXISTS(SELECT 1 FROM pilot_scheduler.request q WHERE q.failed IS TRUE OR (q.observed_at IS NULL AND q.requested_at<now()-interval '5 minutes')) THEN
  UPDATE pilot_scheduler.configuration SET enabled=false;RETURN;
 END IF;
 -- No overlapping invocation; never expose response headers or Vault contents.
 IF EXISTS(SELECT 1 FROM pilot_scheduler.request WHERE observed_at IS NULL) THEN RETURN; END IF;
 SELECT decrypted_secret INTO STRICT caller FROM vault.decrypted_secrets WHERE name='spansk123-retention-staging-20261014';
 IF length(caller)<32 THEN RAISE EXCEPTION 'Dedicated caller configuration missing'; END IF;
 request_id:=net.http_post(url:='https://peglwndjqnrstwnlrdsa.supabase.co/functions/v1/school-retention',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||caller,'x-region','eu-central-1'),body:='{}'::jsonb,timeout_milliseconds:=140000);
 INSERT INTO pilot_scheduler.request(id) VALUES(request_id);
 DELETE FROM pilot_scheduler.request WHERE requested_at<now()-interval '7 days';
END $$;
REVOKE ALL ON FUNCTION pilot_scheduler.enqueue() FROM PUBLIC,anon,authenticated,app_runtime,school_retention_operator,school_data_operator;
-- Daily 02:15 UTC (04:15 Oslo summer / 03:15 winter). Initially disabled.
SELECT cron.schedule('spansk123-retention-staging','15 2 * * *','SELECT pilot_scheduler.enqueue();');
-- Collect only status metadata before pg_net's transient responses expire.
SELECT cron.schedule('spansk123-retention-receipts','*/2 * * * *',$cron$UPDATE pilot_scheduler.request q SET observed_at=now(),status_code=r.status_code,failed=(coalesce(r.status_code,0)<>200 OR coalesce(r.timed_out,false) OR r.error_msg IS NOT NULL) FROM net._http_response r WHERE r.id=q.id AND q.observed_at IS NULL;$cron$);
DO $$ BEGIN
 IF has_table_privilege('app_runtime','net.http_request_queue','SELECT') OR has_table_privilege('school_retention_operator','net.http_request_queue','SELECT') OR has_table_privilege('school_retention_operator','vault.decrypted_secrets','SELECT') THEN RAISE EXCEPTION 'Credential queue is accessible to application roles'; END IF;
END $$;
COMMIT;
