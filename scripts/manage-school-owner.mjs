import pg from 'pg';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { createRevocationJournal } from '../server/revocation-journal.js';
import { blockSchoolOwner } from '../server/school-owner.js';

const action = process.argv[2];
if (!['activate', 'block'].includes(action)) throw new Error('Usage: node scripts/manage-school-owner.mjs activate|block');
if (process.env.NODE_ENV !== 'production' || process.env.SCHOOL_OWNER_BOOTSTRAP_ENABLED !== 'true') {
  console.error('Skoleeier-rutinen krever NODE_ENV=production og eksplisitt SCHOOL_OWNER_BOOTSTRAP_ENABLED=true.');
  process.exitCode = 1;
} else if (process.env.SCHOOL_OWNER_PROVISIONING_DATABASE_SSL !== 'true' || !process.env.SCHOOL_OWNER_PROVISIONING_DATABASE_URL
  || (process.argv[2] === 'block' && (process.env.SECURITY_JOURNAL_DATABASE_SSL !== 'true' || !process.env.SECURITY_JOURNAL_DATABASE_URL))) {
  console.error('Krever separat TLS-kontrollert eierdatabase og, ved sperring, sikkerhetsjournal.');
  process.exitCode = 1;
} else {
  const terminal = createInterface({ input, output });
  const pool = new pg.Pool({ connectionString: process.env.SCHOOL_OWNER_PROVISIONING_DATABASE_URL, max: 1, connectionTimeoutMillis: 5_000, ssl: { rejectUnauthorized: true } });
  const journalPool = action === 'block' ? new pg.Pool({ connectionString: process.env.SECURITY_JOURNAL_DATABASE_URL, max: 1, connectionTimeoutMillis: 5_000, ssl: { rejectUnauthorized: true } }) : null;
  try {
    let result;
    if (action === 'activate') {
      const displayName = (await terminal.question('Verifisert skoleeiernavn: ')).trim();
      const externalReference = (await terminal.question('Ekstern organisasjonsreferanse: ')).trim();
      const schoolIds = (await terminal.question('Interne skole-ID-er, kommaseparert: ')).split(',').map((id) => id.trim()).filter(Boolean);
      const operatorId = (await terminal.question('Operatør-ID: ')).trim();
      const authorizationReference = (await terminal.question('Referanse til dokumentert eierbekreftelse: ')).trim();
      output.write(`Skriv ACTIVATE SCHOOL OWNER ${externalReference} for å fortsette: `);
      const confirmation = (await terminal.question('')).trim();
      if (confirmation !== `ACTIVATE SCHOOL OWNER ${externalReference}`) throw new Error('Confirmation did not match');
      result = await pool.query('SELECT app_provision_school_owner($1,$2,$3,$4,$5::uuid[]) AS owner_id', [displayName, externalReference, operatorId, authorizationReference, schoolIds]);
      console.log(`Skoleeier ble aktivert for ${schoolIds.length} skole(r). Intern referanse: ${result.rows[0].owner_id}.`);
    } else {
      const ownerId = (await terminal.question('Intern skoleeier-ID: ')).trim();
      const operatorId = (await terminal.question('Operatør-ID: ')).trim();
      const authorizationReference = (await terminal.question('Referanse til dokumentert sperrebeslutning: ')).trim();
      output.write(`Skriv BLOCK SCHOOL OWNER ${ownerId} for å fortsette: `);
      const confirmation = (await terminal.question('')).trim();
      if (confirmation !== `BLOCK SCHOOL OWNER ${ownerId}`) throw new Error('Confirmation did not match');
      result = await blockSchoolOwner(pool, createRevocationJournal(journalPool), { ownerId, operatorId, authorizationReference });
      if (!result.blocked) throw new Error('Owner was missing or already blocked');
      console.log(`Skoleeier og ${result.schools} aktive skole(r) er sperret. Sikkerhetsjournalen ble skrevet før skoledataene ble endret.`);
    }
  } catch {
    console.error('Rutinen ble avvist eller feilet. Kontroller godkjenningsreferanse, identifikatorer og separat databasekonfigurasjon. Ingen databasefeil eller elevdata skrives ut.');
    process.exitCode = 1;
  } finally {
    terminal.close();
    if (journalPool) await journalPool.end();
    await pool.end();
  }
}
