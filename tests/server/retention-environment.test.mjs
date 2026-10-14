import test from 'node:test';
import assert from 'node:assert/strict';
import {discardPlatformAdministration,platformAdministrationKeys} from '../../server/retention-environment.js';
test('scheduler drops injected administrative environment without reading existing secret values',()=>{
 const values=new Map(platformAdministrationKeys.map(key=>[key,'synthetic-unused-administrator-value']));values.set('SCHOOL_RETENTION_DATABASE_URL','synthetic-restricted-role');
 const env={delete:key=>values.delete(key),has:key=>values.has(key),get(){throw Error('Existing administration secret must never be read');}};
 assert.equal(discardPlatformAdministration(env),true);assert.equal(values.size,1);
 assert.throws(()=>discardPlatformAdministration({delete(){},has(){return true;}}),/could not be removed/);
});
