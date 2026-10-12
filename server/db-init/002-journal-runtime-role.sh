#!/bin/sh
set -eu
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set=ON_ERROR_STOP=1 --set=runtime_password="$JOURNAL_RUNTIME_PASSWORD" <<'SQL'
CREATE ROLE journal_runtime LOGIN PASSWORD :'runtime_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
GRANT CONNECT ON DATABASE spansk_journal TO journal_runtime;
GRANT USAGE ON SCHEMA public TO journal_runtime;
SQL
