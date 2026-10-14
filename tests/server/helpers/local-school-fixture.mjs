import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createSchoolApp } from '../../../server/app.js';
import { createLocalOidcProvider } from '../../../server/local-oidc-provider.js';
async function freePort(){const s=createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
// PGlite has one connection: reserve it across whole transactions, as pg.Pool does.
function asPool(db){
 let tail=Promise.resolve();
 async function connect(){let unlock;const previous=tail;tail=new Promise(r=>{unlock=r;});await previous;return {query:db.query.bind(db),release:unlock};}
 return {connect,async query(...args){const client=await connect();try{return await client.query(...args);}finally{client.release();}}};
}
export async function createLocalSchoolFixture({ teacherRequiredAcr = null } = {}){
const database = new PGlite();
const journalDatabase = new PGlite();
let appServer,providerServer;

    await database.exec('CREATE ROLE app_runtime NOLOGIN NOBYPASSRLS');
    await database.exec(await readFile(new URL('../../../server/migrations/001_initial.sql', import.meta.url), 'utf8'));
    await database.exec(await readFile(new URL('../../../server/migrations/002_school_membership_lifecycle.sql', import.meta.url), 'utf8'));
    await database.exec(await readFile(new URL('../../../server/migrations/003_account_deletion.sql', import.meta.url), 'utf8'));
    await database.exec(await readFile(new URL('../../../server/migrations/004_session_auth_level.sql', import.meta.url), 'utf8'));
    await database.exec('CREATE ROLE school_owner_provisioner NOLOGIN NOBYPASSRLS');
    await database.exec(await readFile(new URL('../../../server/migrations/005_school_owner_tenants.sql', import.meta.url), 'utf8'));
    await database.exec(await readFile(new URL('../../../server/migrations/006_assignment_content_snapshots.sql', import.meta.url), 'utf8'));
    await database.exec(await readFile(new URL('../../../server/migrations/009_student_school_invitations.sql', import.meta.url), 'utf8'));
    await journalDatabase.exec(await readFile(new URL('../../../server/journal-migrations/001_revocations.sql', import.meta.url), 'utf8'));
    await journalDatabase.exec(await readFile(new URL('../../../server/journal-migrations/002_account_deletion.sql', import.meta.url), 'utf8'));
    await database.exec(`
      INSERT INTO school_owner(id,display_name,external_reference,status,verification_reference,verified_by,verified_at)
       VALUES ('10000000-0000-4000-8000-000000000010','Syntetisk eier A','synthetic-owner-e2e-a','active','synthetic-only','e2e-seed',now()),
        ('10000000-0000-4000-8000-000000000011','Syntetisk eier B','synthetic-owner-e2e-b','active','synthetic-only','e2e-seed',now());
      INSERT INTO school(id,owner_id,feide_org_id,name) VALUES ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000010','synthetic-e2e-org','Syntetisk demoskole');
      INSERT INTO app_user(id,display_name,status) VALUES ('00000000-0000-4000-8000-000000000001','Syntetisk lærer','active');
      INSERT INTO feide_identity(issuer,subject,user_id) VALUES ('http://placeholder.test','demo-teacher','00000000-0000-4000-8000-000000000001');
      INSERT INTO school_membership(school_id,user_id,role,status) VALUES ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','teacher','active');
      INSERT INTO app_user(id,display_name,status) VALUES ('00000000-0000-4000-8000-000000000003','Syntetisk skoleadministrator','active');
      INSERT INTO feide_identity(issuer,subject,user_id) VALUES ('http://placeholder.test','demo-admin','00000000-0000-4000-8000-000000000003');
      INSERT INTO school_membership(school_id,user_id,role,status) VALUES ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','school_admin','active');
      INSERT INTO app_user(id,display_name,status) VALUES ('00000000-0000-4000-8000-000000000004','Syntetisk administrator uten MFA','active');
      INSERT INTO feide_identity(issuer,subject,user_id) VALUES ('http://placeholder.test','demo-admin-low','00000000-0000-4000-8000-000000000004');
      INSERT INTO school_membership(school_id,user_id,role,status) VALUES ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000004','school_admin','active');
    `);
    const appPort = await freePort();
    const issuerPort = await freePort();
    const publicOrigin = `http://127.0.0.1:${appPort}`;
    const issuer = `http://127.0.0.1:${issuerPort}`;
    await database.query('UPDATE feide_identity SET issuer=$1', [issuer]);
    const config = {
      mode: 'local-oidc-test', nodeEnv: 'test', host: '127.0.0.1', port: appPort,
      publicOrigin, databaseUrl: 'postgres://local:local@127.0.0.1:5432/local', journalDatabaseUrl: 'postgres://local:local@127.0.0.1:5433/journal',
      oidc: { issuer, clientId: 'school-e2e', clientSecret: 'synthetic-oidc-client-secret-at-least-32' },
      adminRequiredAcr: 'urn:mace:feide.no:auth:level:fad08:3', teacherRequiredAcr,
      sessionSecret: 'synthetic-e2e-session-secret-long-enough-123',
      cookie: { name: 'spansk_session_dev', secure: false, sameSite: 'Lax', path: '/' }, trustedProxyHops: 0,
    };
    const pool = asPool(database);
    const provider = createLocalOidcProvider({ issuer, publicOrigin, clientId: config.oidc.clientId, clientSecret: config.oidc.clientSecret, cookieSecret: config.sessionSecret });
    providerServer = provider.app.listen(issuerPort, '127.0.0.1');
    const school = createSchoolApp({ config, appPool: pool, journalPool: asPool(journalDatabase), serveLocalStaticAssets: true });
    appServer = school.app.listen(appPort, '127.0.0.1');
    await Promise.all([providerServer, appServer].map((server) => server.listening
      ? Promise.resolve()
      : new Promise((resolve) => server.once('listening', resolve))));



 await database.query("INSERT INTO app_user(id,display_name,status) VALUES('00000000-0000-4000-8000-000000000002','Syntetisk elev','active')");
 await database.query("INSERT INTO feide_identity(issuer,subject,user_id) VALUES($1,'demo-student-a','00000000-0000-4000-8000-000000000002')",[issuer]);
 await database.query("INSERT INTO school_membership(school_id,user_id,role) VALUES('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','student')");
 return {origin:publicOrigin, issuer, config, database, async close(){await Promise.all([appServer,providerServer].map(s=>new Promise(r=>{s.closeAllConnections();s.close(r);})));await database.close();await journalDatabase.close();}};
}
