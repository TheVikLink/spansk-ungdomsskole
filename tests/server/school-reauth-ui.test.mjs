import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=(await readFile(new URL('../../server/public/school.js',import.meta.url),'utf8')).replace('\nload();\n','\n');
function fixture(role,sessionRole='teacher'){
 const destinations=[];const element={replaceChildren(){},remove(){}};
 const context=vm.createContext({document:{querySelector(){return element;},addEventListener(){},cookie:''},window:{addEventListener(){},setInterval(){},clearTimeout(){},setTimeout(){}},location:{assign(url){destinations.push(url);}},fetch:async()=>Response.json({reauthenticationRequired:true,reauthenticationRole:role,error:'Sterk innlogging kreves'},{status:403}),Response,URLSearchParams,Date,Map,Error});
 context.fixtureRole=sessionRole;
 vm.runInContext(source+"\ncurrentSession={userId:'synthetic-teacher',role:fixtureRole};globalThis.operations={refreshActiveSession,api};",context);
 return {operations:context.operations,destinations};
}
test('session heartbeat preserves the strong-login route after the server clears a weak teacher cookie',async()=>{
 const f=fixture('teacher');await f.operations.refreshActiveSession({force:true});assert.deepEqual(f.destinations,['/school?reauth=teacher']);
});
test('API strong-login denial preserves only supported role hints',async()=>{
 for(const role of ['teacher','school_admin','untrusted&next=external']){const f=fixture(role);await assert.rejects(f.operations.api('/api/classes'),/Sterk/);assert.deepEqual(f.destinations,[['teacher','school_admin'].includes(role)?'/school?reauth='+role:'/school']);}
});
test('pre-school screens do not heartbeat a cookie that school selection is rotating',async()=>{
 for(const role of ['select_school','pending']){const f=fixture('teacher',role);await f.operations.refreshActiveSession({force:true});assert.deepEqual(f.destinations,[]);}
});
