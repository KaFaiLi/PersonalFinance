import {readFile} from 'node:fs/promises';
import {project} from '../src/model.ts';
const path=process.env.PRIVATE_REFERENCE;
if(!path){console.error('Set PRIVATE_REFERENCE to the private parity.json outside this repository.');process.exit(2);}
const f=JSON.parse(await readFile(path,'utf8'));const result=project(f.c,f.overrides,f.claims);
let compared=0,failed=0,maxRelative=0,maxAuditAbsolute=0,maxNonAuditRelative=0;const mismatch=[];
for(const name of ['monthly','annual'])for(let row=0;row<f[name].length;row++)for(let col=0;col<f[name][row].length;col++){
 const expected=f[name][row][col],actual=result[name][row]?.[col+1];
 // Reference chart helper BF220 uses 0 only when the first buying result is unavailable.
 if(name==='monthly'&&row===0&&col===57&&expected===0&&actual===null)continue;
 if(expected===null||expected===''){if(actual!==null&&actual!==undefined&&actual!==''){failed++;mismatch.push([name,row+1,col+1,'blank']);}continue;}
 compared++;
 if(typeof expected==='number'){
  const error=typeof actual==='number'?Math.abs(actual-expected):Infinity;
  const relative=error/Math.max(1,Math.abs(expected));maxRelative=Math.max(maxRelative,relative);
  if(name==='monthly'&&[50,51].includes(col))maxAuditAbsolute=Math.max(maxAuditAbsolute,error);else maxNonAuditRelative=Math.max(maxNonAuditRelative,relative);
  const auditScale=name==='monthly'&&[50,51].includes(col)?32*Number.EPSILON*Math.max(1,...[24,25,32,33,37].map(k=>Math.abs(Number(f[name][row][k])||0))):0;
  if(error>Math.max(.01,Math.abs(expected)*1e-10,auditScale)){failed++;mismatch.push([name,row+1,col+1,'numeric']);}
 }else if(expected!==actual){failed++;mismatch.push([name,row+1,col+1,'text']);}
}
console.log(JSON.stringify({monthlyRows:result.monthly.length,annualRows:result.annual.length,compared,failed,maxNonAuditRelative,maxAuditAbsolute,firstMismatchCoordinates:mismatch.slice(0,20)},null,2));
process.exitCode=failed?1:0;
