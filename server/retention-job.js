import {cleanupSchool} from './school-retention-operations.js';
/** Background role has policy-bound retention only, never export or school purge. */
export async function runRetentionCycle({pool,journalPool,apply=false,globalPolicyVersion=null}) {
 const run=apply ? (await pool.query('SELECT school_ops.begin_job() AS id')).rows[0].id : null;
 try {
 const targets=await pool.query('SELECT * FROM school_ops.retention_targets($1)',[apply]);
 const reports=[];let failures=0;
 const journal={async revokeAssignments(ids){await journalPool.query('SELECT journal_retention.record_assignments($1::uuid[])',[ids]);}};
 for(const target of targets.rows){
  try {
  const report=await cleanupSchool(pool,{schoolId:target.school_id,policyVersion:target.version,apply,journal});
  // Job output contains counts/policy references only, never per-pupil exports.
  reports.push({schoolId:report.schoolId,policyVersion:report.policyVersion,applied:report.applied,assignments:report.assignmentIds.length,deletedAuditEvents:report.deletedAuditEvents??0,deletedSchoolInvitations:report.deletedSchoolInvitations??0,deletedClassInvitations:report.deletedClassInvitations??0,deletedSessions:report.deletedSessions??0});
  }catch{failures++;}
 }
 let technical=null;
 if(globalPolicyVersion!==null){try{const r=await pool.query('SELECT school_ops.cleanup_global_expiry($1,$2) AS report',[globalPolicyVersion,apply]);technical=r.rows[0].report;}catch{failures++;}}
 if(run)await pool.query('SELECT school_ops.finish_job($1,$2,$3,$4)',[run,failures===0,reports.length,reports.reduce((n,r)=>n+r.assignments,0)]);
 if(failures)throw Object.assign(Error('Retention cycle incomplete'),{code:'RETENTION_PARTIAL'});
 return {mode:apply?'applied':'report',schools:reports,technical};
 }catch(error){if(run && error.code!=='RETENTION_PARTIAL')await pool.query('SELECT school_ops.finish_job($1,false,0,0)',[run]).catch(()=>{});throw error;}
}
