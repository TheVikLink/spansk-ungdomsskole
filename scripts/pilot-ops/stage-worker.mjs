import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const files=['retention-environment.js','retention-job.js','retention-handler.js','school-retention-operations.js'];
const hashes={};
for(const name of files){
 const bytes=await readFile(new URL('../../server/'+name,import.meta.url));
 await writeFile(new URL('../../supabase/functions/school-retention/'+name,import.meta.url),bytes);
 hashes[name]=createHash('sha256').update(bytes).digest('hex');
}
console.log(JSON.stringify({copied:files.length,sourceHashes:hashes}));
