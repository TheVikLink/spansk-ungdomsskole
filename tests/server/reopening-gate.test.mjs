import test from 'node:test';
import assert from 'node:assert/strict';
import {createLifecycleFixture} from './helpers/school-lifecycle-fixture.mjs';
import {migrationDigests,verifyReopeningGate} from '../../server/reopening-gate.js';
import {verifyRestoredSchoolDatabase} from '../../server/recovery.js';
test('deployment gate refuses source changes, stale receipts and restore resurrection before replay',async()=>{
 const {db}=await createLifecycleFixture();try{
  const pool={query:db.query.bind(db),async connect(){return {query:db.query.bind(db),release(){}}}};
  const entries=[];const journal={async checkpoint(){return {sequence:String(entries.length),entries:String(entries.length)};},async entriesThrough(){return entries;}};
  const options={pool,journal,expectedDigests:await migrationDigests()};
  const receipt=await verifyReopeningGate(options);
  await assert.rejects(verifyReopeningGate({...options,expectedDigests:{bad:'bad'}}),/digests/);
  entries.push({id:'1',grant_id:'10000000-0000-4000-8000-000000000099',subject_id:'10000000-0000-4000-8000-000000000001',reason:'school_deleted'});
  await assert.rejects(verifyReopeningGate(options),/not applied/);
  await verifyRestoredSchoolDatabase({pool,journal,snapshotCheckpoint:{sequence:'0',entries:'0'}});
  await assert.rejects(verifyReopeningGate({...options,receipt}),/stale/);
  const reopened=await verifyReopeningGate(options);assert.equal(reopened.deletedSchoolIds.length,1);
  await verifyReopeningGate({...options,receipt:reopened});
  entries.push({id:'2',grant_id:'10000000-0000-4000-8000-000000000098',subject_id:'10000000-0000-4000-8000-000000000002',reason:'future_unknown_type'});
  await assert.rejects(verifyReopeningGate(options),/Unsupported/);entries.pop();
  let checkpoints=0;
  const advancing={...journal,async checkpoint(){checkpoints++;return checkpoints===1?{sequence:'1',entries:'1'}:{sequence:'2',entries:'2'};}};
  await assert.rejects(verifyReopeningGate({...options,journal:advancing}),/advanced/);
  // A status-only tombstone must not hide leftover personal learning/identity data.
  const user='00000000-0000-4000-8000-000000000001';
  await db.query("UPDATE app_user SET status='deleted',display_name='Slettet konto' WHERE id=$1",[user]);
  entries.push({id:'2',grant_id:'10000000-0000-4000-8000-000000000097',subject_id:user,reason:'user_deleted'});
  await assert.rejects(verifyReopeningGate(options),/not applied/);
  await verifyRestoredSchoolDatabase({pool,journal,snapshotCheckpoint:{sequence:'0',entries:'0'}});
  await verifyReopeningGate(options);
  await db.query("UPDATE school_ops.migration_digest SET sha256=repeat('0',64) WHERE source='runtime/recovery.js'");
  await assert.rejects(verifyReopeningGate(options),/not applied/);
 }finally{await db.close();}
});
