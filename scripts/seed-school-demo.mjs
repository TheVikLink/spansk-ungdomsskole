import pg from 'pg';
import { loadConfig } from '../server/config.js';

const config = loadConfig();
if (config.mode !== 'local-oidc-test') throw new Error('Synthetic school seed is restricted to explicit local OIDC test mode');
const pool = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL, max: 1, connectionTimeoutMillis: 5_000, ssl: false });
const teacherId = '81000000-0000-4000-8000-000000000001';
const schoolId = '81000000-0000-4000-8000-000000000002';
const schoolOwnerId = '81000000-0000-4000-8000-000000000006';
const adminId = '81000000-0000-4000-8000-000000000005';
const classlessTeacherId = '81000000-0000-4000-8000-000000000007';
const syntheticStudents = [
  ['81000000-0000-4000-8000-000000000003', 'demo-student-a', 'Syntetisk elev A'],
  ['81000000-0000-4000-8000-000000000004', 'demo-student-b', 'Syntetisk elev B'],
];

try {
  await pool.query('BEGIN');
  await pool.query(`INSERT INTO school_owner(id,display_name,external_reference,status,verification_reference,verified_by,verified_at)
    VALUES($1,'Syntetisk skoleeier','synthetic-local-school-owner','active','synthetic-only','local-seed',now()) ON CONFLICT(id) DO NOTHING`, [schoolOwnerId]);
  await pool.query("INSERT INTO school(id,owner_id,feide_org_id,name) VALUES($1,$2,'local-synthetic-org','Syntetisk demoskole') ON CONFLICT(id) DO NOTHING", [schoolId, schoolOwnerId]);
  await pool.query("INSERT INTO app_user(id,display_name,status) VALUES($1,'Syntetisk lærer','active') ON CONFLICT(id) DO NOTHING", [teacherId]);
  await pool.query("INSERT INTO feide_identity(issuer,subject,user_id) VALUES($1,'demo-teacher',$2) ON CONFLICT(issuer,subject) DO NOTHING", [config.oidc.issuer, teacherId]);
  await pool.query("INSERT INTO school_membership(school_id,user_id,role,status) VALUES($1,$2,'teacher','active') ON CONFLICT(school_id,user_id) DO NOTHING", [schoolId, teacherId]);
  await pool.query("INSERT INTO app_user(id,display_name,status) VALUES($1,'Syntetisk skoleadministrator','active') ON CONFLICT(id) DO NOTHING", [adminId]);
  await pool.query("INSERT INTO feide_identity(issuer,subject,user_id) VALUES($1,'demo-admin',$2) ON CONFLICT(issuer,subject) DO NOTHING", [config.oidc.issuer, adminId]);
  await pool.query("INSERT INTO school_membership(school_id,user_id,role,status) VALUES($1,$2,'school_admin','active') ON CONFLICT(school_id,user_id) DO NOTHING", [schoolId, adminId]);
  await pool.query("INSERT INTO app_user(id,display_name,status) VALUES($1,'Syntetisk lærer uten klasse','active') ON CONFLICT(id) DO NOTHING", [classlessTeacherId]);
  await pool.query("INSERT INTO feide_identity(issuer,subject,user_id) VALUES($1,'demo-teacher-b',$2) ON CONFLICT(issuer,subject) DO NOTHING", [config.oidc.issuer, classlessTeacherId]);
  await pool.query("INSERT INTO school_membership(school_id,user_id,role,status) VALUES($1,$2,'teacher','active') ON CONFLICT(school_id,user_id) DO NOTHING", [schoolId, classlessTeacherId]);
  for (const [studentId, subject, displayName] of syntheticStudents) {
    await pool.query('INSERT INTO app_user(id,display_name,status) VALUES($1,$2,\'active\') ON CONFLICT(id) DO NOTHING', [studentId, displayName]);
    await pool.query('INSERT INTO feide_identity(issuer,subject,user_id) VALUES($1,$2,$3) ON CONFLICT(issuer,subject) DO NOTHING', [config.oidc.issuer, subject, studentId]);
    await pool.query("INSERT INTO school_membership(school_id,user_id,role,status) VALUES($1,$2,'student','active') ON CONFLICT(school_id,user_id) DO NOTHING", [schoolId, studentId]);
  }
  await pool.query('COMMIT');
  console.log('Added one synthetic local school, administrator, class-owning and classless teachers, and two pre-approved synthetic student identities. No real school or pupil data was used.');
} catch (error) {
  await pool.query('ROLLBACK');
  throw error;
} finally { await pool.end(); }
