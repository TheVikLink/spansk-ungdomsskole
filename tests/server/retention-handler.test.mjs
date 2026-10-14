import test from 'node:test';
import assert from 'node:assert/strict';
import {createRetentionHandler} from '../../server/retention-handler.js';
test('scheduled cleanup requires its dedicated bearer and refuses caller policy changes',async()=>{
 const secret='synthetic-only-caller-secret-long-enough';let calls=0;
 const handler=createRetentionHandler({secret,async run(){calls++;return {schools:[{assignments:2}]};}});
 const req=(body='{}',authorization=`Bearer ${secret}`,path='https://synthetic.test/cleanup')=>new Request(path,{method:'POST',headers:{authorization},body});
 assert.equal((await handler(req('{}','Bearer public-anon-jwt'))).status,401);
 assert.equal((await handler(req('{"apply":true}'))).status,400);
 assert.equal((await handler(req('{}',`Bearer ${secret}`,'https://synthetic.test/cleanup?school=other'))).status,400);
 assert.equal(calls,0);
 const result=await handler(req());assert.equal(result.status,200);assert.deepEqual(await result.json(),{status:'completed',schools:1,deletedAssignments:2});
 const failed=createRetentionHandler({secret,async run(){throw Error('PRIVATE SQL secret');}});
 const failure=await failed(req());assert.equal(failure.status,503);assert.doesNotMatch(await failure.text(),/PRIVATE|secret/);
});
