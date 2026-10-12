const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function validateRequest(request) {
  if (!UUID.test(request.schoolId || '')) throw new Error('A valid school ID is required');
  let issuer;
  try { issuer = new URL(request.issuer); } catch { throw new Error('A valid Feide issuer is required'); }
  if (issuer.protocol !== 'https:') throw new Error('The bootstrap issuer must use HTTPS');
  if (typeof request.subject !== 'string' || request.subject.length < 1 || request.subject.length > 255 || request.subject.trim() !== request.subject) throw new Error('The exact Feide subject is required');
  if (typeof request.operatorId !== 'string' || !/^[A-Za-z0-9@._-]{2,80}$/u.test(request.operatorId)) throw new Error('A short operator identifier is required');
  if (typeof request.authorizationReference !== 'string' || !/^[A-Za-z0-9._/-]{4,120}$/u.test(request.authorizationReference)) throw new Error('An authorization reference is required');
  if (request.confirmation !== `BOOTSTRAP SCHOOL ADMIN ${request.schoolId}`) throw new Error('The school-specific confirmation phrase does not match');
}

/** Provision the first school administrator after separate school-owner verification. */
export async function bootstrapFirstSchoolAdmin(pool, request) {
  validateRequest(request);
  const client = pool.connect ? await pool.connect() : pool;
  try {
    const role = await client.query('SELECT current_user AS name');
    if (role.rows[0]?.name === 'app_runtime') throw new Error('Bootstrap requires a separate privileged provisioning database role');
    await client.query('BEGIN');
    const school = await client.query("SELECT s.id FROM school s JOIN school_owner o ON o.id=s.owner_id AND o.status='active' WHERE s.id=$1 AND s.status='active' FOR UPDATE OF s", [request.schoolId]);
    if (!school.rowCount) throw new Error('The active school record was not found');
    const existingAdmin = await client.query("SELECT 1 FROM school_membership WHERE school_id=$1 AND role='school_admin' AND status='active' LIMIT 1", [request.schoolId]);
    if (existingAdmin.rowCount) throw new Error('The school already has an active administrator');

    const identity = await client.query(
      `SELECT fi.user_id,fi.revoked_at,u.status AS user_status
       FROM feide_identity fi JOIN app_user u ON u.id=fi.user_id
       WHERE fi.issuer=$1 AND fi.subject=$2 FOR UPDATE OF fi,u`,
      [request.issuer, request.subject],
    );
    if (!identity.rowCount) throw new Error('The exact Feide identity must sign in before provisioning');
    const { user_id: userId, revoked_at: revokedAt, user_status: userStatus } = identity.rows[0];
    if (revokedAt || !['pending', 'active'].includes(userStatus)) throw new Error('This Feide identity is blocked or revoked');

    const existingMembership = await client.query(
      'SELECT role,status FROM school_membership WHERE school_id=$1 AND user_id=$2 FOR UPDATE',
      [request.schoolId, userId],
    );
    if (existingMembership.rowCount) {
      const membership = existingMembership.rows[0];
      if (membership.status !== 'active') throw new Error('A revoked school membership cannot be bootstrapped again');
      if (membership.role !== 'teacher') throw new Error('Only a verified teacher membership can be promoted');
      await client.query("UPDATE school_membership SET role='school_admin',grant_id=gen_random_uuid() WHERE school_id=$1 AND user_id=$2", [request.schoolId, userId]);
    } else {
      await client.query("INSERT INTO school_membership(school_id,user_id,role,status) VALUES($1,$2,'school_admin','active')", [request.schoolId, userId]);
    }
    await client.query("UPDATE app_user SET status='active' WHERE id=$1", [userId]);
    await client.query("UPDATE app_session SET revoked_at=coalesce(revoked_at,now()),encrypted_id_token=NULL WHERE school_id=$1 AND user_id=$2", [request.schoolId, userId]);
    await client.query(
      "INSERT INTO school_provisioning_event(school_id,target_user_id,operation,operator_id,authorization_reference) VALUES($1,$2,'first_admin_created',$3,$4)",
      [request.schoolId, userId, request.operatorId, request.authorizationReference],
    );
    await client.query('COMMIT');
    return { schoolId: request.schoolId, status: existingMembership.rowCount ? 'promoted' : 'created' };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    if (client !== pool) client.release();
  }
}
