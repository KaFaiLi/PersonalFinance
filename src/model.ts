/** All money HKD; rates are fractions; month 1 is the first model month.
 * Synthetic demonstration only. No private source values are included here. */
export const DEMO = {
  years:50, salary:42000, paidMonths:12, bonus:42000, otherIncome:0, incomeGrowth:0.02,
  pension:1500, extraPension:0, eligiblePension:18000, pensionGrowth:0,
  otherPayroll:0, payrollGrowth:0, otherDeductions:0, allowance:145000, extraAllowance:0,
  utilities:900, insurance:1000, transport:700, subscriptions:200, familyExpense:2000,
  debtPayments:0, otherLiving:500, food:4500, annualLiving:18000, livingGrowth:0.02,
  retirementYears:30, retirementIncome:12000, retirementTaxShare:0, retirementLivingShare:0.8,
  investments:600000, cash:250000, target:8000, targetGrowth:0.03, retiredTarget:0,
  surplusShare:0.5, annualReturn:0.05, timing:'end', dcaYears:20,
  rent:11000, rentGrowth:0.02, price:5200000, ownBudget:850000, partnerBudget:900000,
  purchaseCosts:180000, renovation:120000, reserve:100000, financedInsurance:0,
  gift:null as number|null, giftConfirmed:false, loanMode:'budget', knownLoan:3800000,
  mortgageRate:0.035, mortgageYears:30, ownershipShare:0.5, paymentShare:0.5, expenseShare:0.5,
  management:1800, rates:12000, groundRent:3000, maintenance:12000, propertyInsurance:2000,
  otherHolding:0, holdingGrowth:0.02, propertyGrowth:0.02, sellingRate:0.01, sellingFixed:15000,
  housingDeductionIncluded:0, interestEligible:false, claimedYears:0, rentEligible:false,
  tenants:2, rentPaymentShare:0.5, eligibleLeaseShare:1,
  claims:Array(50).fill(1) as number[], overrides:Array(600).fill(null) as (number|null)[]
};
export type Inputs = typeof DEMO;
export const cloneDemo = (): Inputs => structuredClone(DEMO);
const rateKeys = ['incomeGrowth','pensionGrowth','payrollGrowth','livingGrowth','targetGrowth','annualReturn','rentGrowth','holdingGrowth','propertyGrowth'];
const shares = ['surplusShare','ownershipShare','paymentShare','expenseShare','retirementTaxShare','rentPaymentShare','eligibleLeaseShare','sellingRate'];
export function validate(x: unknown): asserts x is Inputs {
  if(!x || typeof x!=='object' || Array.isArray(x)) throw Error('輸入必須是物件');
  const a=x as Record<string,unknown>;
  if(Object.keys(a).length!==Object.keys(DEMO).length || Object.keys(a).some(k=>!Object.hasOwn(DEMO,k))) throw Error('欄位不完整或包含未知欄位');
  for(const [k,d] of Object.entries(DEMO)) {
    const v=a[k];
    if(k==='gift') {if(v!==null && (typeof v!=='number'||!Number.isFinite(v)||v<0||v>1e12))throw Error('資助金額無效');continue;}
    if(Array.isArray(d)) continue;
    if(typeof v!==typeof d) throw Error(`${k}：資料類別無效`);
    if(typeof d==='number') {
      const n=v as number;
      if(!Number.isFinite(n)||Math.abs(n)>1e12)throw Error(`${k}：數值無效`);
      if(rateKeys.includes(k)?n<=-1:n<0)throw Error(`${k}：數值超出範圍`);
      if(rateKeys.includes(k)&&n>1)throw Error(`${k}：年率不可超過100%`);
      if(shares.includes(k)&&n>1)throw Error(`${k}：比例不可超過100%`);
    }
  }
  for(const [key,lo,hi] of [['years',1,50],['dcaYears',1,50],['retirementYears',0,50],['mortgageYears',1,40],['paidMonths',0,12],['claimedYears',0,20],['tenants',1,100]] as const){
    const n=a[key] as number;if(!Number.isInteger(n)||n<lo||n>hi)throw Error(`${key}：整數範圍 ${lo}–${hi}`);
  }
  if(!['begin','end'].includes(a.timing as string)||!['budget','known'].includes(a.loanMode as string))throw Error('選項無效');
  if((a.rentPaymentShare as number)<=0 || (a.housingDeductionIncluded as number)>(a.otherDeductions as number))throw Error('租金比例或重複扣除額無效');
  if(!Array.isArray(a.claims)||a.claims.length!==50||a.claims.some(v=>v!==0&&v!==1))throw Error('申索選擇須為50個0或1');
  if(!Array.isArray(a.overrides)||a.overrides.length!==600||a.overrides.some(v=>v!==null&&(typeof v!=='number'||!Number.isFinite(v)||v< -1||v>10)))throw Error('覆寫須為600個空白或月回報（-100%至1000%）');
  if((a.mortgageRate as number)>1)throw Error('按揭年利率不可超過100%');
}
export function encode(x:Inputs):string {validate(x);return JSON.stringify({schema:'personal-finance',version:1,inputs:x},null,2);}
export function decode(text:string):Inputs {
  if(text.length>100000)throw Error('檔案過大');
  const v=JSON.parse(text);if(!v||v.schema!=='personal-finance'||v.version!==1||Object.keys(v).sort().join(',')!=='inputs,schema,version')throw Error('不支援的檔案版本');
  validate(v.inputs);return structuredClone(v.inputs);
}
export function monthlyRate(annual:number):number {return Math.expm1(Math.log1p(annual)/12);}
export function payment(loan:number,rate:number,months:number):number {return rate===0?loan/months:loan*(rate/12)/(-Math.expm1(-months*Math.log1p(rate/12)));}
export function tax(net:number,allowance:number,relief=0){
  net=Math.max(0,net);const taxable=Math.max(0,net-allowance);
  const progressive=[.02,.06,.1,.14].reduce((s,r,i)=>s+Math.min(50000,Math.max(0,taxable-i*50000))*r,0)+Math.max(0,taxable-200000)*.17;
  const standard=Math.min(net,5000000)*.15+Math.max(0,net-5000000)*.16;
  return {progressive,standard,tax:Math.max(0,Math.min(progressive,standard)-relief)};
}
/** Maps semantic inputs to the frozen model's normalized C25:C104 parameter interface. */
export function parameters(x:Inputs):number[] {
  const c:number[]=[];const set=(k:number,v:number)=>c[k]=v;
  const direct:Record<number,keyof Inputs>={25:'years',26:'incomeGrowth',27:'livingGrowth',28:'rentGrowth',29:'propertyGrowth',30:'holdingGrowth',31:'annualReturn',33:'target',34:'targetGrowth',35:'surplusShare',36:'investments',37:'cash',40:'rent',45:'pensionGrowth',46:'payrollGrowth',47:'price',48:'ownBudget',49:'partnerBudget',50:'purchaseCosts',51:'renovation',52:'reserve',53:'financedInsurance',57:'ownershipShare',58:'paymentShare',59:'expenseShare',61:'management',62:'rates',63:'groundRent',64:'maintenance',65:'propertyInsurance',66:'otherHolding',67:'sellingRate',68:'sellingFixed',70:'knownLoan',73:'mortgageRate',74:'mortgageYears',86:'otherDeductions',87:'housingDeductionIncluded',90:'claimedYears',93:'tenants',94:'rentPaymentShare',95:'eligibleLeaseShare',96:'retirementYears',97:'retirementIncome',98:'retirementTaxShare',99:'retirementLivingShare',100:'retiredTarget'};
  for(const [k,v] of Object.entries(direct))set(+k,x[v] as number);
  set(32,x.timing==='begin'?1:0);set(41,x.salary*x.paidMonths+x.bonus+x.otherIncome);
  set(42,x.pension*x.paidMonths+x.extraPension);set(43,x.otherPayroll*x.paidMonths);
  set(44,x.utilities+x.insurance+x.transport+x.subscriptions+x.familyExpense+x.debtPayments+x.otherLiving+x.food+x.annualLiving/12);
  set(56,Math.min(x.cash,Math.max(0,x.ownBudget-x.investments)));
  set(55,x.gift??Math.max(0,x.ownBudget-x.investments-c[56]));
  set(60,x.ownBudget+x.partnerBudget===0?0:x.ownBudget/(x.ownBudget+x.partnerBudget));
  set(71,x.price-(x.ownBudget+x.partnerBudget-x.purchaseCosts-x.renovation-x.reserve)+x.financedInsurance);
  set(72,x.loanMode==='budget'?c[71]:x.knownLoan);set(75,payment(c[72],x.mortgageRate,x.mortgageYears*12));
  set(76,x.price-(c[72]-x.financedInsurance));set(77,c[76]+x.purchaseCosts+x.renovation+x.reserve);
  set(78,Math.max(0,c[77]-x.ownBudget-x.partnerBudget));set(79,c[77]*c[60]);
  set(80,x.investments+x.cash+c[55]-c[79]+x.reserve*c[60]);set(81,Math.max(0,-c[80]));
  set(83,(x.price-c[72])*x.ownershipShare);set(84,(x.price-c[72])*(x.ownershipShare-c[60]));
  set(85,Math.min(c[42],x.eligiblePension,18000));set(88,x.allowance+x.extraAllowance);
  set(89,+x.interestEligible);set(91,Math.min(x.ownershipShare,x.paymentShare));set(92,+x.rentEligible);
  set(101,c[72]>0?Math.max(0,(c[72]-x.financedInsurance)/c[72]):0);set(102,100000);set(103,100000);set(104,0);
  return c;
}
export type Cell=number|string|null;
export type Projection={monthly:Cell[][],annual:Cell[][],parameters:number[],buyFunded:boolean,loanValid:boolean};
/** Deterministic parity kernel. Arrays retain the reference's A:BX and A:AC column order.
 * Money stays IEEE-754 full precision; null denotes an unsupported/unfunded wealth result. */
export function project(c:number[],overrides:(number|null)[],claims:number[]):Projection {
  const monthly:Cell[][]=[],annual:Cell[][]=[];
  const loanValid=c[72]>=c[53]&&c[72]<=c[47]+c[53]&&c[72]>=0;
  const buyFunded=loanValid&&c[78]<=0&&c[81]<=0;
  let loan=c[72];
  for(let m=1;m<=c[25]*12;m++) {
    const y=Math.ceil(m/12),work=y<=c[96],r:Cell[]=Array(77).fill(null);
    r[1]=m;r[2]=y;r[3]=work?c[41]/12*(1+c[26])**(y-1):c[97];
    r[4]=work?c[42]/12*(1+c[45])**(y-1):0;r[5]=work?c[43]/12*(1+c[46])**(y-1):0;
    r[6]=c[44]*(1+c[27])**(y-1)*(work?1:c[99]);r[7]=c[40]*(1+c[28])**(y-1);
    r[8]=overrides[m-1]??monthlyRate(c[31]);r[9]=work?c[33]*(1+c[34])**(y-1):c[100];
    if(loanValid){r[10]=loan;r[11]=loan*c[73]/12;r[13]=m>c[74]*12?0:m===c[74]*12?loan+(r[11] as number):Math.min(c[75],loan+(r[11] as number));r[12]=(r[13] as number)-(r[11] as number);loan=Math.max(0,loan-(r[12] as number));r[14]=loan;}
    r[15]=c[47]*(1+c[29])**(m/12);r[16]=(c[61]+(c[62]+c[63]+c[64]+c[65]+c[66])/12)*c[59]*(1+c[30])**(y-1);
    monthly.push(r);
  }
  let used=c[90];
  for(let y=1;y<=50;y++){
    const a:Cell[]=Array(30).fill(null),work=y<=c[96];a[1]=y;a[2]=work?'工作':'退休';a[3]=claims[y-1];
    a[4]=work?c[41]*(1+c[26])**(y-1):c[97]*12*c[98];
    a[5]=work?Math.min(c[85]*(1+c[45])**(y-1),c[42]*(1+c[45])**(y-1),18000):0;
    a[6]=Math.max(0,c[86]-c[87]);a[7]=Math.max(0,(a[4] as number)-(a[5] as number)-(a[6] as number));a[8]=c[88];
    const rows=monthly.slice((y-1)*12,y*12),interest=rows.reduce((s,r)=>s+Number(r[11]),0),rent=rows.reduce((s,r)=>s+Number(r[7]),0);
    a[9]=interest;a[10]=used;a[29]=c[89]&&claims[y-1]===1&&interest*c[91]*c[101]>0&&used<20?1:0;
    a[11]=a[29]?Math.min(interest*c[91]*c[101],c[102]*c[57]):0;used+=a[29] as number;
    a[12]=c[92]?Math.min(rent/c[94]*c[95]/c[93],c[103]*c[95]/c[93]):0;
    for(const [netCol,taxableCol,progCol,stdCol,totalCol,ded] of [[7,13,14,15,16,0],[17,18,19,20,21,a[12]],[22,23,24,25,26,a[11]]] as number[][]){
      const net=Math.max(0,(a[7] as number)-ded);a[netCol]=net;a[taxableCol]=Math.max(0,net-c[88]);
      const t=tax(net,c[88],y===1?c[104]:0);a[progCol]=t.progressive;a[stdCol]=t.standard;a[totalCol]=t.tax;
    }
    a[27]=(a[16] as number)-(a[21] as number);a[28]=(a[16] as number)-(a[26] as number);annual.push(a);
  }
  let prev:Cell[]=Array(77).fill(0);
  for(const r of monthly){
    const m=r[1] as number,y=r[2] as number,a=annual[y-1],n=(i:number)=>Number(r[i]),p=(i:number)=>Number(prev[i]);
    r[17]=Number(a[21])/12;r[18]=Number(a[26])/12;r[19]=n(3)-n(4)-n(5)-n(6)-n(7)-n(17);
    r[20]=loanValid?n(3)-n(4)-n(5)-n(6)-n(13)*c[58]-n(16)-n(18):null;
    for(const buy of [false,true]){
      if(buy&&!buyFunded)continue;
      const base=buy?29:21,flow=n(buy?20:19),openingInvestment=m===1?(buy?0:c[36]):p(base+4),openingCash=m===1?(buy?c[80]:c[37]):p(base+5);
      const contribution=Math.min(n(9),Math.max(0,flow))+Math.max(0,flow-n(9))*c[35];
      const grown=(openingInvestment+(c[32]?contribution:0))*(1+n(8))+(c[32]?0:contribution);
      r[base]=contribution;r[base+1]=Math.min(openingCash,Math.max(0,-flow));r[base+2]=Math.min(grown,Math.max(0,-flow)-n(base+1));
      r[base+3]=Math.max(0,-flow-n(base+1)-n(base+2));r[base+4]=grown-n(base+2);r[base+5]=openingCash+Math.max(0,flow)-contribution-n(base+1);
      r[base+6]=(m===1?0:p(base+6))+n(base+3);
      if(!buy)r[28]=n(27)<.005?n(25)+n(26):null;
      r[buy?50:49]=(openingInvestment+(c[32]?contribution:0))*n(8);
    }
    r[36]=n(15)*c[57];r[37]=loanValid?n(14)*c[57]:null;r[38]=loanValid?n(36)-n(37):null;
    r[39]=buyFunded&&n(35)<.005?n(33)+n(34)+n(38):null;r[40]=r[39]===null?null:n(39)-(n(15)*c[67]+c[68])*c[57];
    r[41]=(m===1?c[36]:p(41))+n(21);r[42]=buyFunded?(m===1?0:p(42))+n(29):null;
    r[43]=(m===1?0:p(43))+n(7);r[44]=loanValid?(m===1?(c[50]+c[51]+c[53])*c[60]:p(44))+n(11)*c[58]+n(16):null;
    r[45]=(m===1?0:p(45))+Number(a[27])/12;r[46]=(m===1?0:p(46))+Number(a[28])/12;r[47]=c[55];
    r[48]=buyFunded?(m===1?0:p(48))+n(12)*c[58]:null;
    r[51]=(n(25)+n(26)-n(27))-((m===1?c[36]:p(25))+(m===1?c[37]:p(26))-(m===1?0:p(27)))-n(49)-n(19);
    r[52]=buyFunded?(n(33)+n(34)+n(38)-n(35))-(m===1?c[80]+c[83]:p(33)+p(34)+p(38)-p(35))-n(50)-n(20)-(n(15)-(m===1?c[47]:p(15)))*c[57]-n(12)*c[57]:null;
    r[53]=loanValid?(m===1?c[84]:p(53))+n(12)*(c[57]-c[58]):null;
    r[54]=n(27)>0?'租樓出現未獲資金支持缺口':!buyFunded?'資金不足：先補足或調整貸款':n(35)>0?'買樓出現未獲資金支持缺口':'情景可計算；請核實假設';
    r[55]=buyFunded?(m===1?c[79]-c[55]:p(55))+n(29)+n(12)*c[58]:null;r[56]=y<=c[96]?'工作':'退休';r[57]=r[28];r[58]=r[39];
    for(const [j,rate] of [[59,0],[65,.05],[71,.1]])for(const buy of [false,true]){
      if(buy&&!buyFunded)continue;
      const b=j+(buy?3:0),con=n(buy?29:21),flow=n(buy?20:19),cashUsed=n(buy?30:22),start=m===1?(buy?0:c[36]):p(b),rr=monthlyRate(rate);
      const grown=(start+(c[32]?con:0))*(1+rr)+(c[32]?0:con);
      r[b]=Math.max(0,grown-Math.max(0,-flow-cashUsed));
      // Preserve the frozen Sheet sensitivity expression (month-end term's sign differs from base).
      r[b+1]=(m===1?0:p(b+1))+Math.max(0,-flow-cashUsed-(start+(c[32]?con:0))*(1+rr)+(c[32]?0:con));
      r[b+2]=n(b+1)<.005?n(b)+n(buy?34:26)+(buy?n(38):0):null;
    }
    prev=r;
  }
  return {monthly,annual,parameters:c,buyFunded,loanValid};
}
export function simulate(x:Inputs):Projection {validate(x);const result=project(parameters(x),x.overrides,x.claims);if(result.monthly.some(r=>r.some(v=>typeof v==='number'&&!Number.isFinite(v))))throw Error('情景超出數值範圍，請降低回報覆寫或年期');return result;}
export function dca(x:Inputs){
  validate(x);let wealth=x.investments,paid=x.investments;const rows=[];
  for(let m=1;m<=x.dcaYears*12;m++){const rate=x.overrides[m-1]??monthlyRate(x.annualReturn);wealth=(wealth+(x.timing==='begin'?x.target:0))*(1+rate)+(x.timing==='end'?x.target:0);paid+=x.target;if(!Number.isFinite(wealth))throw Error('定投超出數值範圍，請降低回報覆寫或年期');rows.push({month:m,paid,wealth,gain:wealth-paid});}
  return rows;
}
export function sensitivity(x:Inputs){return [0,.03,.05,.07,.1].map(rate=>({rate,result:simulate({...x,annualReturn:rate,overrides:Array(600).fill(null)})}));}
