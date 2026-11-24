import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

const secret = () => randomBytes(32).toString('base64url');
const migratorPassword = secret();
const runtimePassword = secret();
const schoolOwnerProvisionerPassword = secret();
const journalMigratorPassword = secret();
const journalRuntimePassword = secret();
const oidcClientSecret = secret();
const sessionSecret = secret();
const config = `NODE_ENV=development
LOCAL_OIDC_TEST_ENABLED=true
HOST=127.0.0.1
PORT=3000
PUBLIC_ORIGIN=http://127.0.0.1:3000
OIDC_ISSUER=http://127.0.0.1:3001
OIDC_CLIENT_ID=spansk-school-local
OIDC_CLIENT_SECRET=${oidcClientSecret}
SESSION_SECRET=${sessionSecret}
MIGRATOR_PASSWORD=${migratorPassword}
RUNTIME_PASSWORD=${runtimePassword}
SCHOOL_OWNER_PROVISIONER_PASSWORD=${schoolOwnerProvisionerPassword}
JOURNAL_MIGRATOR_PASSWORD=${journalMigratorPassword}
JOURNAL_RUNTIME_PASSWORD=${journalRuntimePassword}
MIGRATION_DATABASE_URL=postgres://app_migrator:${migratorPassword}@127.0.0.1:5432/spansk_school
DATABASE_URL=postgres://app_runtime:${runtimePassword}@127.0.0.1:5432/spansk_school
SCHOOL_OWNER_PROVISIONING_DATABASE_URL=postgres://school_owner_provisioner:${schoolOwnerProvisionerPassword}@127.0.0.1:5432/spansk_school
JOURNAL_MIGRATION_DATABASE_URL=postgres://journal_migrator:${journalMigratorPassword}@127.0.0.1:5433/spansk_journal
SECURITY_JOURNAL_DATABASE_URL=postgres://journal_runtime:${journalRuntimePassword}@127.0.0.1:5433/spansk_journal
`;
await writeFile('.env', config, { flag: 'wx', mode: 0o600 });
console.log('Created private .env with random local-only secrets. It is ignored by Git. No credentials were printed.');
