export type MarketRow={month:string,spy:number,housing:number,adjusted:number,closeDate:string,flag:string};
export function historical(rows:MarketRow[]){
 if(rows.length!==241)throw Error('歷史資料須有241個月份');
 for(let i=0;i<rows.length;i++){
  const r=rows[i];if(![r.spy,r.housing,r.adjusted].every(v=>Number.isFinite(v)&&v>0))throw Error('歷史價格無效');
  const [y,m]=r.month.split('-').map(Number);if(y*12+m!==2006*12+8+i)throw Error('歷史月份不連續');
 }
 const keys=['spy','housing','adjusted'] as const;
 const normalized=rows.map(r=>({month:r.month,...Object.fromEntries(keys.map(k=>[k,r[k]/rows[0][k]*100]))}));
 const fixed=Array.from({length:4},(_,i)=>{
  const a=rows[i*60],b=rows[(i+1)*60];return{start:a.month,end:b.month,...Object.fromEntries(keys.map(k=>{
   const total=rows[240][k]/rows[0][k]-1,change=(b[k]-a[k])/rows[0][k];
   return[k,{return:b[k]/a[k]-1,cagr:(b[k]/a[k])**.2-1,points:change*100,contribution:total===0?null:change/total}];
  }))};
 });
 const rolling=rows.slice(60).map((r,i)=>({start:rows[i].month,end:r.month,...Object.fromEntries(keys.map(k=>[k,r[k]/rows[i][k]-1]))}));
 return{normalized,fixed,rolling};
}
