import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createLocalSchoolFixture} from './helpers/local-school-fixture.mjs';
import {LocalBrowser,signIn} from './helpers/local-oidc-browser.mjs';
import {createRevocationJournal} from '../../server/revocation-journal.js';
const SCHOOL='10000000-0000-4000-8000-000000000001',STUDENT='00000000-0000-4000-8000-000000000002';
test('journal-only retention hides learning data and forbids answers before application deletion completes',async()=>{
 const f=await createLocalSchoolFixture();try{
  const teacher=new LocalBrowser(f.origin),student=new LocalBrowser(f.origin);
  await signIn(teacher,f.issuer,'demo-teacher');await signIn(student,f.issuer,'demo-student-a');
  const cls=await teacher.json('/api/classes',{method:'POST',body:{name:'Syntetisk retensjon',schoolYear:'2026-2027'}});assert.equal(cls.status,201);
  await f.database.query("INSERT INTO class_membership(school_id,class_id,user_id,role,status) VALUES($1,$2,$3,'student','active')",[SCHOOL,cls.body.id,STUDENT]);
  const assignment=await teacher.json('/api/assignments',{method:'POST',body:{classId:cls.body.id,activityId:'vocabulary.all.v1',title:'Syntetisk slettbar lekse',questionCount:1}});assert.equal(assignment.status,201);
  const exercise=await student.json(`/api/assignments/${assignment.body.id}`);assert.equal(exercise.status,200);
  const q=exercise.body.exercise.questions[0];
  const answer={eventId:randomUUID(),practiceSession:exercise.body.practiceSession,questionId:q.id,answerId:q.options[0].id};
  assert.equal((await student.json(`/api/assignments/${assignment.body.id}/answers`,{method:'POST',body:answer})).status,200);
  const db=f.journalDatabase;const journal=createRevocationJournal({query:db.query.bind(db),async connect(){return {query:db.query.bind(db),release(){}}}});
  let reached;const atOuter=new Promise(r=>reached=r);let resume;const paused=new Promise(r=>resume=r);
  const original=f.journal.isAssignmentRetained.bind(f.journal);let first=true;
  f.journal.isAssignmentRetained=async(id)=>{const retained=await original(id);if(first){first=false;reached();await paused;}return retained;};
  const racing=student.json(`/api/assignments/${assignment.body.id}`);
  await atOuter;await journal.revoke(assignment.body.id,'assignment_retention');resume();
  assert.equal((await racing).status,404,'the transaction rechecks a journal mark committed after the outer guard');
  f.journal.isAssignmentRetained=original;
  assert.equal((await student.json('/api/assignments')).body.assignments.length,0);
  assert.equal((await student.json(`/api/assignments/${assignment.body.id}`)).status,404);
  assert.equal((await student.json(`/api/assignments/${assignment.body.id}/answers`,{method:'POST',body:{...answer,eventId:randomUUID()}})).status,404);
  assert.equal((await student.json('/api/me/export',{method:'POST',body:{}})).body.learningEvents.length,0);
  assert.equal((await teacher.json(`/api/classes/${cls.body.id}/progress`)).body.rows.length,0);
  assert.equal((await teacher.json(`/api/classes/${cls.body.id}/export`,{method:'POST',body:{}})).body.rows.length,0);
  assert.equal((await f.database.query('SELECT count(*)::int n FROM learning_event')).rows[0].n,1);
 }finally{await f.close();}
});
