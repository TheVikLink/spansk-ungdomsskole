import pg from 'pg';

function connectionOptions(connectionString, databaseSsl, ca) {
  const url = new URL(connectionString);
  // pg parses these after its explicit options, replacing the entire ssl object.
  // TLS policy must remain under app control, including in local test mode.
  for (const key of ['ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'uselibpqcompat', 'sslnegotiation']) {
    url.searchParams.delete(key);
  }
  return {
    connectionString: url.toString(),
    sslnegotiation: 'postgres',
    ssl: databaseSsl ? { rejectUnauthorized: true, ...(ca ? { ca } : {}) } : false,
  };
}

export function createDatabasePools(config) {
  const shared = {
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  };
  const appPool = new pg.Pool({ ...shared,
    ...connectionOptions(config.databaseUrl, config.databaseSsl, config.databaseCaCertificate),
    application_name: 'spansk123-app' });
  const journalPool = new pg.Pool({ ...shared,
    ...connectionOptions(config.journalDatabaseUrl, config.databaseSsl, config.journalCaCertificate),
    application_name: 'spansk123-security-journal', max: 4 });
  for (const pool of [appPool, journalPool]) pool.on('error', () => {
    // Deliberately omit the error object; driver errors may contain connection details.
  });
  return { appPool, journalPool, async close() { await Promise.all([appPool.end(), journalPool.end()]); } };
}
