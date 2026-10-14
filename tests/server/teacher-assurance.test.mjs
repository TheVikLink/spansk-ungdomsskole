import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalSchoolFixture } from './helpers/local-school-fixture.mjs';
import { LocalBrowser, signIn } from './helpers/local-oidc-browser.mjs';
import { FEIDE_MFA_ACR } from '../../server/config.js';

test('signed strong teacher survives school selection; weak and missing assurance cannot read school APIs', { timeout: 60000 }, async () => {
  const f = await createLocalSchoolFixture({ teacherRequiredAcr: FEIDE_MFA_ACR });
  try {
    await f.database.exec(`INSERT INTO school(id,owner_id,feide_org_id,name) VALUES
      ('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000011','synthetic-assurance-b','Syntetisk skole B');
      INSERT INTO school_membership(school_id,user_id,role) VALUES
      ('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','teacher');`);
    const weak = new LocalBrowser(f.origin);
    await signIn(weak, f.issuer, 'demo-teacher');
    const choices = await weak.json('/api/session');
    assert.equal(choices.body.role, 'select_school');
    await weak.json('/api/select-school', { method:'POST', body:{ schoolId: choices.body.schools[0].id }});
    const rejected = await weak.json('/api/classes');
    assert.equal(rejected.status,403);
    assert.equal(rejected.body.reauthenticationRole,'teacher');
    const strong = new LocalBrowser(f.origin);
    await signIn(strong, f.issuer, 'demo-teacher', FEIDE_MFA_ACR, 'teacher');
    const schools = await strong.json('/api/session');
    assert.equal(schools.body.schools.length,2);
    assert.equal((await strong.json('/api/select-school',{method:'POST',body:{schoolId:schools.body.schools[0].id}})).status,200);
    assert.equal((await strong.json('/api/session')).status,200);
    assert.equal((await strong.json('/api/classes')).status,200);
    await f.database.exec("UPDATE app_session SET acr=NULL WHERE role='teacher' AND revoked_at IS NULL");
    assert.equal((await strong.json('/api/classes')).status,403);
    const student = new LocalBrowser(f.origin);
    await signIn(student,f.issuer,'demo-student-a');
    assert.equal((await student.json('/api/session')).body.role,'student');
    assert.equal((await student.json('/api/assignments')).status,200);
  } finally { await f.close(); }
});
