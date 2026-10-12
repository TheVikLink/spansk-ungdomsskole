import pg from 'pg';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { bootstrapFirstSchoolAdmin } from '../server/admin-bootstrap.js';

const FEIDE_ISSUER = 'https://auth.dataporten.no';

if (process.env.NODE_ENV !== 'production' || process.env.SCHOOL_ADMIN_BOOTSTRAP_ENABLED !== 'true') {
  console.error('Førsteadministrator-rutinen krever NODE_ENV=production og eksplisitt SCHOOL_ADMIN_BOOTSTRAP_ENABLED=true.');
  process.exitCode = 1;
} else if (process.env.SCHOOL_PROVISIONING_DATABASE_SSL !== 'true') {
  console.error('Rutinen krever SCHOOL_PROVISIONING_DATABASE_SSL=true med sertifikatkontroll.');
  process.exitCode = 1;
} else if (!process.env.SCHOOL_PROVISIONING_DATABASE_URL) {
  console.error('SCHOOL_PROVISIONING_DATABASE_URL mangler i sikker lokal konfigurasjon.');
  process.exitCode = 1;
} else {
  const terminal = createInterface({ input, output });
  const pool = new pg.Pool({ connectionString: process.env.SCHOOL_PROVISIONING_DATABASE_URL, max: 1, connectionTimeoutMillis: 5_000, ssl: { rejectUnauthorized: true } });
  try {
    const schoolId = (await terminal.question('Skolens interne ID: ')).trim();
    const subject = (await terminal.question('Eksakt Feide subject fra verifisert skoleeierinstruks: ')).trim();
    const operatorId = (await terminal.question('Operatør-ID (ikke navn): ')).trim();
    const authorizationReference = (await terminal.question('Referanse til dokumentert skoleeiergodkjenning: ')).trim();
    output.write(`Skriv BOOTSTRAP SCHOOL ADMIN ${schoolId} for å fortsette: `);
    const confirmation = (await terminal.question('')).trim();
    const result = await bootstrapFirstSchoolAdmin(pool, {
      schoolId, issuer: FEIDE_ISSUER, subject, operatorId, authorizationReference, confirmation,
    });
    console.log(`Første skoleadministrator er opprettet (${result.status}) for skole ${result.schoolId}.`);
  } catch {
    console.error('Rutinen ble avvist eller feilet. Kontroller skoleeiergodkjenning, identitet og sikker databasekonfigurasjon. Ingen identitetsdata eller databasefeil skrives ut.');
    process.exitCode = 1;
  } finally {
    terminal.close();
    await pool.end();
  }
}
