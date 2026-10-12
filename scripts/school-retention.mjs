import pg from 'pg';
import { deleteExpiredSchoolData, validateRetentionDays } from '../server/retention.js';
import { createRevocationJournal } from '../server/revocation-journal.js';

const url = process.env.MIGRATION_DATABASE_URL;
const learningDays = process.env.SCHOOL_LEARNING_RETENTION_DAYS;
const auditDays = process.env.SCHOOL_AUDIT_RETENTION_DAYS;
if (!url || !learningDays || !auditDays) throw new Error('Set MIGRATION_DATABASE_URL and both school retention periods explicitly before running this command');
const database = new URL(url);
if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '[::1]'].includes(database.hostname.replace(/^\[|\]$/gu, ''))) {
  throw new Error('This local retention command only runs against a loopback migrator database outside production');
}
validateRetentionDays(learningDays);
validateRetentionDays(auditDays);
const apply = process.argv.includes('--apply');
const journalUrl = process.env.SECURITY_JOURNAL_DATABASE_URL;
if (apply && !journalUrl) throw new Error('Set SECURITY_JOURNAL_DATABASE_URL before applying retention so deletions survive database restore');
if (journalUrl) {
  const journalDatabase = new URL(journalUrl);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(journalDatabase.hostname.replace(/^\[|\]$/gu, ''))) {
    throw new Error('This local retention command only accepts a loopback security-journal database');
  }
}
const pool = new pg.Pool({ connectionString: url, max: 1, statement_timeout: 10_000, application_name: 'spansk123-retention-local' });
const journalPool = apply ? new pg.Pool({ connectionString: journalUrl, max: 1, statement_timeout: 10_000, application_name: 'spansk123-retention-journal-local' }) : null;
try {
  const journal = journalPool ? createRevocationJournal(journalPool) : null;
  const counts = await deleteExpiredSchoolData(pool, { learningRetentionDays: learningDays, auditRetentionDays: auditDays, apply, journal });
  console.log(JSON.stringify({ mode: apply ? 'applied' : 'dry-run-rolled-back', deletedOrWouldDelete: counts }));
} finally { await Promise.all([pool.end(), journalPool?.end()]); }
