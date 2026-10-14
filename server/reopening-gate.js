import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const digest=(value)=>createHash('sha256').update(value).digest('hex');
/** Bind the deployment receipt to actual migration sources, not a version count. */
export async function migrationDigests(){
 // Literal paths ensure the server bundle contains every verified source.
 const files={
  'migrations/001_initial.sql':await readFile(new URL('./migrations/001_initial.sql',import.meta.url)),
  'migrations/002_school_membership_lifecycle.sql':await readFile(new URL('./migrations/002_school_membership_lifecycle.sql',import.meta.url)),
  'migrations/003_account_deletion.sql':await readFile(new URL('./migrations/003_account_deletion.sql',import.meta.url)),
  'migrations/004_session_auth_level.sql':await readFile(new URL('./migrations/004_session_auth_level.sql',import.meta.url)),
  'migrations/005_school_owner_tenants.sql':await readFile(new URL('./migrations/005_school_owner_tenants.sql',import.meta.url)),
  'migrations/006_assignment_content_snapshots.sql':await readFile(new URL('./migrations/006_assignment_content_snapshots.sql',import.meta.url)),
  'migrations/007_runtime_migration_privileges.sql':await readFile(new URL('./migrations/007_runtime_migration_privileges.sql',import.meta.url)),
  'migrations/008_pin_provisioning_trigger_search_path.sql':await readFile(new URL('./migrations/008_pin_provisioning_trigger_search_path.sql',import.meta.url)),
  'migrations/009_student_school_invitations.sql':await readFile(new URL('./migrations/009_student_school_invitations.sql',import.meta.url)),
  'migrations/010_school_lifecycle_operations.sql':await readFile(new URL('./migrations/010_school_lifecycle_operations.sql',import.meta.url)),
  'migrations/011_bounded_retention_scheduler.sql':await readFile(new URL('./migrations/011_bounded_retention_scheduler.sql',import.meta.url)),
  'journal-migrations/001_revocations.sql':await readFile(new URL('./journal-migrations/001_revocations.sql',import.meta.url)),
  'journal-migrations/002_account_deletion.sql':await readFile(new URL('./journal-migrations/002_account_deletion.sql',import.meta.url)),
  'journal-migrations/003_fixed_trigger_search_path.sql':await readFile(new URL('./journal-migrations/003_fixed_trigger_search_path.sql',import.meta.url)),
  'journal-migrations/004_runtime_least_privilege.sql':await readFile(new URL('./journal-migrations/004_runtime_least_privilege.sql',import.meta.url)),
  'journal-migrations/005_school_deletion.sql':await readFile(new URL('./journal-migrations/005_school_deletion.sql',import.meta.url)),
  'runtime/runtime.js':await readFile(new URL('./runtime.js',import.meta.url)),
  'runtime/recovery.js':await readFile(new URL('./recovery.js',import.meta.url)),
  'runtime/reopening-gate.js':await readFile(new URL('./reopening-gate.js',import.meta.url)),
  'runtime/app.js':await readFile(new URL('./app.js',import.meta.url)),
  'runtime/revocation-journal.js':await readFile(new URL('./revocation-journal.js',import.meta.url)),
 };
 return Object.fromEntries(Object.entries(files).map(([name,bytes])=>[name,digest(bytes)]));
}
export async function verifyReopeningGate({pool,journal,expectedDigests,receipt=null}){
 const sources=await migrationDigests();
 if(JSON.stringify(expectedDigests)!==JSON.stringify(sources))throw Error('Migration source digests differ; deployment must remain closed');
 const checkpoint=await journal.checkpoint();
 const entries=await journal.entriesThrough(checkpoint.sequence);
 if(entries.length!==Number(checkpoint.entries))throw Error('Incomplete journal; deployment must remain closed');
 const supported=new Set(['user_deleted','user_blocked','assignment_retention','school_blocked','school_deleted','class_membership_removed','school_membership_removed','class_invitation_used','school_invitation_used','school_invitation_revoked']);
 if(entries.some(x=>!supported.has(x.reason)))throw Error('Unsupported journal event; deployment must remain closed');
 const deletedSchools=[...new Set(entries.filter(x=>x.reason==='school_deleted').map(x=>x.subject_id))].sort();
 const assignments=[...new Set(entries.filter(x=>x.reason==='assignment_retention').map(x=>x.subject_id))].sort();
 const users=[...new Set(entries.filter(x=>x.reason==='user_deleted').map(x=>x.subject_id))].sort();
 const state=await pool.query('SELECT school_ops.reopening_state($1::uuid[],$2::uuid[],$3::uuid[],$4::jsonb) AS ready',[deletedSchools,assignments,users,JSON.stringify(sources)]);
 if(state.rows[0]?.ready!==true)throw Error('Journal deletion is not applied to restored data; deployment must remain closed');
 const fresh=await journal.checkpoint();
 if(fresh.sequence!==checkpoint.sequence || fresh.entries!==checkpoint.entries)throw Error('Journal advanced during verification; retry with a fresh checkpoint');
 const journalDigest=digest(JSON.stringify(entries));
 if(receipt && (receipt.journalDigest!==journalDigest || JSON.stringify(receipt.migrationDigests)!==JSON.stringify(sources)
  || receipt.journalCheckpoint.sequence!==checkpoint.sequence || receipt.journalCheckpoint.entries!==checkpoint.entries))throw Error('Reopening receipt is stale; verify the restored database again');
 return {format:'spansk123-reopening-receipt-v1',verifiedAt:new Date().toISOString(),migrationDigests:sources,journalCheckpoint:checkpoint,journalDigest,deletedSchoolIds:deletedSchools};
}
