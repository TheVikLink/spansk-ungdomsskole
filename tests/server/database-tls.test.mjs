import test from 'node:test';
import assert from 'node:assert/strict';
import { rootCertificates } from 'node:tls';
import pg from 'pg';
import { createDatabasePools } from '../../server/database.js';

function config(query = '') {
  return {
    databaseSsl: true,
    databaseCaCertificate: rootCertificates[0],
    journalCaCertificate: rootCertificates[1],
    databaseUrl: `postgresql://app_runtime:p%40ss%3Aword@db.example.test:6543/app?options=-c%20search_path%3Dpublic&${query}`,
    journalDatabaseUrl: `postgresql://journal_runtime:journal-secret@journal.example.test:6543/journal?${query}`,
  };
}

test('actual pg clients preserve per-pool CA, hostname checks and credentials despite URL TLS overrides', async () => {
  for (const query of ['', 'sslmode=require', 'sslmode=no-verify', 'ssl=false', 'ssl=0', 'sslnegotiation=direct',
    'sslmode=verify-ca&uselibpqcompat=true', 'sslmode=require&sslrootcert=/not-a-real-cert&sslkey=/not-a-real-key&sslcert=/not-a-real-cert']) {
    const pools = createDatabasePools(config(query));
    try {
      const app = new pg.Client(pools.appPool.options).connectionParameters;
      const journal = new pg.Client(pools.journalPool.options).connectionParameters;
      for (const [parameters, expectedCa] of [[app, rootCertificates[0]], [journal, rootCertificates[1]]]) {
        assert.equal(parameters.ssl.rejectUnauthorized, true, query);
        assert.equal(parameters.ssl.ca, expectedCa, query);
        assert.equal(parameters.ssl.checkServerIdentity, undefined, 'Node must verify the hostname');
        assert.equal(parameters.sslnegotiation, 'postgres');
      }
      assert.equal(app.user, 'app_runtime');
      assert.equal(app.password, 'p@ss:word');
      assert.equal(app.host, 'db.example.test');
      assert.equal(app.port, 6543);
      assert.equal(app.options, '-c search_path=public');
      assert.equal(journal.user, 'journal_runtime');
    } finally { await pools.close(); }
  }
});

test('pools retain default trusted roots without custom CA and preserve explicit local no-TLS mode', async () => {
  for (const databaseSsl of [true, false]) {
    const pools = createDatabasePools({ ...config('sslnegotiation=direct&sslmode=no-verify'), databaseSsl,
      databaseCaCertificate: undefined, journalCaCertificate: undefined });
    try {
      for (const pool of [pools.appPool, pools.journalPool]) {
        const parameters = new pg.Client(pool.options).connectionParameters;
        assert.deepEqual(parameters.ssl, databaseSsl ? { rejectUnauthorized: true } : false);
        assert.equal(parameters.sslnegotiation, 'postgres');
      }
    } finally { await pools.close(); }
  }
});
