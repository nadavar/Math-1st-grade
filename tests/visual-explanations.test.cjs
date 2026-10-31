'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
const source=fs.readFileSync(path.resolve(__dirname,'first-grade-bank.test.cjs'),'utf8').split('const result=runChecks(')[0].replace('return {GEN,SLOTS','return {visualExplanation,coachArithmetic,coachBlocks,coachLine,GEN,SLOTS');
const makeHarness=new Function('require',source+';return makeHarness;')(require),h=makeHarness(html),a=h.api;
function blocks(s){return [...s.matchAll(/aria-label="(\d+) tens and (\d+) ones(?:, take away (\d+) ones)?"/g)].map(m=>({t:+m[1],o:+m[2],cross:+(m[3]||0)}));}
function verifyMath(terms,sub){
 const [x,y]=terms,result=sub?x-y:terms.reduce((s,n)=>s+n,0),s=a.coachArithmetic(terms,sub,true);
 assert(!/undefined|NaN|Infinity/.test(s));
 if(Math.max(x,result)>20){const rows=blocks(s);assert(rows.length>=3);assert.equal(rows[0].t*10+rows[0].o,x);const final=rows.at(-1);assert.equal(final.t*10+final.o,result);assert.equal(final.cross,0);
  if(sub){const crossed=rows.find(r=>r.cross===y&&r.t*10+r.o===x);assert(crossed,'subtraction preserves starting amount before removal');assert.equal(crossed.t*10+crossed.o-crossed.cross,result);}
  else assert(rows.some(r=>r.t===Math.floor(x/10)&&r.o===x%10+y),'addition shows combined ones before trade');
 }else{
  assert.equal((s.match(/class="coach-dot /g)||[]).length,sub?x:result);
  assert.equal((s.match(/class="coach-dot [^"]*crossed/g)||[]).length,sub?y:0);
 }
}
for(let x=0;x<=99;x++)for(let y=0;y<=9;y++){
 if(x+y<=100)verifyMath([x,y],false);if(y<=x)verifyMath([x,y],true);
}
for(let x=0;x<=10;x++)for(let y=0;y<=10-x;y++)verifyMath([x,y,10-x-y],false);
const borrow=a.coachArithmetic([32,5],true,true);assert(blocks(borrow).some(r=>r.t===2&&r.o===12));assert.deepEqual(blocks(borrow).at(-1),{t:2,o:7,cross:0});
const trade=a.coachArithmetic([28,7],false,true);assert(blocks(trade).some(r=>r.t===2&&r.o===15));assert.deepEqual(blocks(trade).at(-1),{t:3,o:5,cross:0});
const expected=new Set(['count','build','tens','compare','expanded','regroup','add','sub','add100','sub100','missing_add','missing_sub','eq','word','clock','shape','frac','coins','coin_total','bills','measure','tally','pictograph']);let checked=0;
for(const theme of Object.keys(a.THEMES)){a.selectTheme(theme);for(const [skill,gen] of Object.entries(a.GEN))for(let level=1;level<=3;level++)for(let i=0;i<30;i++){
 const q=gen(level);q.skill=skill;
 for(const solved of [false,true]){const out=a.visualExplanation(q,solved);assert(!/undefined|NaN|Infinity/.test(out),skill);if(expected.has(skill))assert(out.includes('class="coach"'),skill+' has a model');}
 if(skill==='regroup'){const rows=blocks(a.visualExplanation(q,true));assert.equal(rows.at(-1).t*10+rows.at(-1).o,q.audit.n);assert.equal(rows.at(-1).o,q.answer);}
 checked++;
}}
// Hint -> learner requests worked explanation -> learner chooses when to move on.
a.startStage('seoul');a.setQuestion('sub',{...a.GEN.sub(1),audit:{kind:'sub',a:9,b:4},answer:5});
a.onWrong(null);assert.equal(h.node('#explainBtn').hidden,false);assert(h.node('#hint').innerHTML.includes('coach-dots'));const attempts=a.player.stats.sub.n;
h.node('#explainBtn').onclick();assert(a.round.locked);assert.equal(h.node('#explainBtn').hidden,true);assert(h.node('#gotIt').classList.contains('on'));assert(h.node('#hint').innerHTML.includes('9 − 4 = 5'));assert.equal(a.player.stats.sub.n,attempts);assert(!h.timers.some(t=>t.fn.name==='advance'),'worked explanation does not auto-advance');
a.nextQ();assert.equal(h.node('#explainBtn').hidden,true);assert.equal(h.node('#hint').innerHTML,'');
a.setQuestion('order',a.GEN.order(1));a.showHint();assert.doesNotThrow(()=>h.node('#explainBtn').onclick());assert(a.round.locked);
// Partial and full explanations each retain the same mathematical operands.
const part=a.visualExplanation({audit:{kind:'add',terms:[6,3]}},false),full=a.visualExplanation({audit:{kind:'add',terms:[6,3]}},true);assert(!part.includes('6 + 3 = 9'));assert(full.includes('6 + 3 = 9'));
console.log('Visual explanations passed:',checked,'generated questions across all themes; arithmetic counters, trades, borrowing, regrouping, hint/reveal/reset, and order fallback.');
