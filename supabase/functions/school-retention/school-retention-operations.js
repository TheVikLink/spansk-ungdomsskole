import { z } from 'zod';
const scope=z.object({schoolId:z.string().uuid(),policyVersion:z.number().int().positive()});
export async function cleanupSchool(pool,options){
 const {schoolId,policyVersion}=scope.parse(options);const apply=options.apply===true;const client=await pool.connect();
 try{
  await client.query('BEGIN');
  await client.query("SET LOCAL statement_timeout='5s'");
  await client.query("SET LOCAL idle_in_transaction_session_timeout='10s'");
  const result=await client.query('SELECT school_ops.prepare_retention($1,$2) AS report',[schoolId,policyVersion]);
  const report=result.rows[0].report;
  if(apply){
   if(!options.journal?.revoke && !options.journal?.revokeAssignments)throw Error('External retention journal is required');
   if(options.journal.revokeAssignments && report.assignmentIds.length) await options.journal.revokeAssignments(report.assignmentIds);
   else for(const id of report.assignmentIds)await options.journal.revoke(id,'assignment_retention');
   const applied=await client.query('SELECT school_ops.apply_retention($1,$2) AS report',[schoolId,policyVersion]);
   Object.assign(report,applied.rows[0].report);
  }
  delete report.expiredSessionHashes;
  await client.query(apply?'COMMIT':'ROLLBACK');return {applied:apply,...report};
 }catch(error){try{await client.query('ROLLBACK');}catch{}throw error;}finally{client.release();}
}
