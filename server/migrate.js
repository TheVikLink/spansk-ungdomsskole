import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';

async function migrate(url, directory, trackingTable) {
  if (!url) throw new Error(`Missing migration connection for ${trackingTable}`);
  const pool = new pg.Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 5_000, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false });
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [trackingTable === 'schema_migration' ? 345712 : 345713]);
    await client.query(`CREATE TABLE IF NOT EXISTS ${trackingTable} (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
    const applied = await client.query(`SELECT version FROM ${trackingTable}`);
    const known = new Set(applied.rows.map((row) => row.version));
    const directoryUrl = new URL(`./${directory}/`, import.meta.url);
    const files = (await readdir(directoryUrl)).filter((file) => /^\d+_[a-z0-9_-]+\.sql$/u.test(file)).sort();
    for (const file of files) {
      const version = file.replace(/\.sql$/u, '');
      if (known.has(version)) continue;
      await client.query(await readFile(new URL(file, directoryUrl), 'utf8'));
      if (trackingTable === 'schema_migration') {
        // Migration scripts also mark themselves atomically with their schema changes.
        const result = await client.query(`SELECT 1 FROM ${trackingTable} WHERE version=$1`, [version]);
        if (result.rowCount !== 1) throw new Error(`Migration ${version} did not mark itself applied`);
      } else {
        await client.query(`INSERT INTO ${trackingTable}(version) VALUES($1) ON CONFLICT DO NOTHING`, [version]);
      }
      console.log(`Applied ${trackingTable} ${version}`);
    }
  } finally {
    try { await client.query('SELECT pg_advisory_unlock($1)', [trackingTable === 'schema_migration' ? 345712 : 345713]); } catch {}
    client.release();
    await pool.end();
  }
}

await migrate(process.env.MIGRATION_DATABASE_URL, 'migrations', 'schema_migration');
await migrate(process.env.JOURNAL_MIGRATION_DATABASE_URL, 'journal-migrations', 'journal_migration');
