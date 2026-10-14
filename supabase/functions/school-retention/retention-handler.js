import {Buffer} from 'node:buffer';
import {timingSafeEqual} from 'node:crypto';
/** Scheduler endpoint accepts an opaque dedicated bearer and no policy overrides. */
export function createRetentionHandler({secret,run}) {
 if(typeof secret!=='string'||secret.length<32)throw Error('Dedicated retention caller secret is required');
 const expected=Buffer.from(`Bearer ${secret}`);
 return async(request)=>{
  const supplied=Buffer.from(request.headers.get('authorization')??'');
  if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return Response.json({error:'Unauthorized'},{status:401});
  if(request.method!=='POST')return Response.json({error:'Method not allowed'},{status:405});
  if(new URL(request.url).search)return Response.json({error:'Policy overrides are forbidden'},{status:400});
  const body=await request.text();
  if(body.length>2||(body!==''&&body!=='{}'))return Response.json({error:'Policy overrides are forbidden'},{status:400});
  try {
   const result=await run();
   return Response.json({status:'completed',schools:result.schools.length,deletedAssignments:result.schools.reduce((n,x)=>n+x.assignments,0)});
  }catch{return Response.json({error:'Retention did not complete; inspect the private run receipt'},{status:503});}
 };
}
