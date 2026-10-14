import { z } from 'zod';
const scope = z.object({ schoolId:z.string().uuid(),authorizationReference:z.string().min(4).max(120) });
export async function exportSchool(pool, options) {
 const {schoolId,authorizationReference}=scope.parse(options);const client=await pool.connect();
 try {
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const result=await client.query('SELECT school_ops.export_school($1,$2) AS data',[schoolId,authorizationReference]);
  await client.query('COMMIT');return result.rows[0].data;
 }catch(error){try{await client.query('ROLLBACK');}catch{}throw error;}finally{client.release();}
}
export async function deleteSchool(pool, options) {
 const {schoolId,authorizationReference}=scope.parse(options);const apply=options.apply===true;const client=await pool.connect();
 try {
  await client.query('BEGIN');
  const prepared=await client.query('SELECT school_ops.prepare_deletion($1,$2) AS report',[schoolId,authorizationReference]);
  const report=prepared.rows[0].report;
  if(apply){
   if(!options.journal?.deleteSchool)throw Error('An external school deletion journal is required');
   await options.journal.deleteSchool(schoolId,report.accessGrantId,authorizationReference);
   await client.query('SELECT school_ops.apply_deletion($1,$2)',[schoolId,authorizationReference]);
  }
  await client.query(apply?'COMMIT':'ROLLBACK');return {applied:apply,...report};
 }catch(error){try{await client.query('ROLLBACK');}catch{}throw error;}finally{client.release();}
}
