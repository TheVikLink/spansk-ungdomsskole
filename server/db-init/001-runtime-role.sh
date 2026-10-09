#!/bin/sh
set -eu
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set=ON_ERROR_STOP=1 --set=runtime_password="$APP_RUNTIME_PASSWORD" --set=school_owner_provisioner_password="$SCHOOL_OWNER_PROVISIONER_PASSWORD" <<'SQL'
CREATE ROLE app_runtime LOGIN PASSWORD :'runtime_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
CREATE ROLE school_owner_provisioner LOGIN PASSWORD :'school_owner_provisioner_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
GRANT CONNECT ON DATABASE spansk_school TO app_runtime;
GRANT CONNECT ON DATABASE spansk_school TO school_owner_provisioner;
GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT USAGE ON SCHEMA public TO school_owner_provisioner;
ALTER DEFAULT PRIVILEGES FOR ROLE app_migrator IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE app_migrator IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
SQL
