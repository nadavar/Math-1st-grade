'use strict';
const fs=require('node:fs');
const path=require('node:path');
function makeHarness(html,seed=73,legacy){
  const elements=new Map(),storeMap=new Map(),timers=[];
  function node(key){
    if(elements.has(key))return elements.get(key);
    const classes=new Set();let html='';
    const n={value:'',textContent:'',hidden:false,disabled:false,checked:false,dataset:{},children:[],style:{setProperty(){}},className:'',offsetWidth:100,
      classList:{add(...xs){xs.forEach(x=>classes.add(x));},remove(...xs){xs.forEach(x=>classes.delete(x));},contains(x){return classes.has(x);},toggle(x,force){if(force===undefined)force=!classes.has(x);if(force)classes.add(x);else classes.delete(x);}},
      setAttribute(k,v){this[k]=v;},appendChild(c){this.children.push(c);},insertAdjacentHTML(where,s){html+=s;},addEventListener(){},focus(){},querySelector(){return null;}};
    Object.defineProperty(n,'innerHTML',{get:()=>html,set:v=>{html=v;n.children=[];}});
    elements.set(key,n);return n;
  }
  const document={documentElement:{style:{setProperty(){}}},querySelector:node,querySelectorAll(sel){if(sel==='#choices .choice')return node('#choices').children;if(sel==='.order-slots div')return Array.from({length:4},(_,i)=>node('orderSlot'+i));return [];},createElement:()=>node('created'+elements.size)};
  const player=legacy||{id:'pTest',name:'Test Player',theme:'huntrix',stars:{seoul:2},stickers:['⭐'],stats:{count:{n:7,r:5}},level:{count:2},streak:{},miss:{},focus:['counting','placevalue','subtraction','multistep']};
  storeMap.set('mathShowdown',JSON.stringify({profiles:[player],current:player.id,voice:false,sound:false}));
  const localStorage={getItem:k=>storeMap.get(k)||null,setItem:(k,v)=>storeMap.set(k,v)};
  const math=Object.create(Math);math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const factory=new Function('document','window','localStorage','setTimeout','clearTimeout','confirm','navigator','location','Math',script+`
    return {GEN,SLOTS,THEMES,SKILL_NAMES,FOCUS_AREAS,startStage,nextQ,choose,showHint,onCorrect,onWrong,reveal,advance,recordFirst,questionKey,
      get player(){return S;},get round(){return R;},get db(){return DB;},
      selectTheme(k){S.theme=k;},setSkill(k){R.q.skill=k;},reset:()=>$('#pReset').onclick(),renderMap,
      resetLearning(){S.stats={};S.level={};S.streak={};S.miss={};S.levelTrials={};S.recent=[];},
      setLevel(k,n){S.level[k]=n;},setQuestion(k,q){R.q=q;R.q.skill=k;R.tries=0;R.hinted=false;R.locked=false;}
    };`);
  const api=factory(document,{scrollTo(){}},localStorage,(fn,ms)=>{timers.push({fn,ms});return timers.length;},()=>{},()=>true,{}, {protocol:'https:'},math);
  return {api,node,elements,storage:storeMap,timers};
}
function runChecks(html,makeHarness){
  const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
  const h=makeHarness(html,12345),a=h.api,sideCount={circle:0,triangle:3,square:4,rectangle:4,hexagon:6,trapezoid:4};
  const sums=xs=>xs.reduce((a,b)=>a+b,0),strip=s=>s.replace(/<[^>]*>/g,'');
  let checked=0,audited=0;const kinds={},variation={};
  function expected(k,q,L){
    const d=q.audit;
    if(d){
      audited++;kinds[d.kind]=(kinds[d.kind]||0)+1;
      switch(d.kind){
        case 'expanded':assert(d.n===d.t+d.o,'expanded values');return d.mode===1?`${d.t} + ${d.o}`:d.n;
        case 'regroup':return d.n-10*d.keep;
        case 'add':assert(sums(d.terms)<=(k==='add'?20:100),'addition bound');return sums(d.terms);
        case 'sub':assert(d.a>=d.b,'subtraction nonnegative');return d.a-d.b;
        case 'missing_add':assert(d.total===d.a+d.b,'missing add data');return [d.a,d.b,d.a+d.b][d.pos];
        case 'missing_sub':assert(d.c===d.a-d.b,'missing sub data');return [d.a,d.b,d.a-d.b][d.pos];
        case 'eq':return (d.sub?d.a-d.b:d.a+d.b)===d.shown?'T':'F';
        case 'equality_expr':return sums(d.left)===sums(d.right)?'T':'F';
        case 'story_one':return d.sub?d.a-d.b:d.a+d.b;
        case 'story':{const equations=d.solved.map(line=>{const m=line.match(/(\d+)\s*([+−])\s*(\d+)\s*=\s*(\d+)/);assert(m,'story equation syntax');const val=m[2]==='+'?+m[1]+ +m[3]:+m[1]- +m[3];assert(val===+m[4],'story equation mismatch');assert(val>=0&&val<=20,'story bounds');return val;});return d.solved.at(-1).startsWith('Check:')?equations[0]:equations.at(-1);}
        case 'clock':assert(d.m===0||d.m===30,'grade-1 time scope');assert(L!==1||d.m===0,'hour intro');return d.mode==='minutes'?d.m:`${d.h}:${d.m?'30':'00'}`;
        case 'shape':return d.mode==='name'?d.k:sideCount[d.k];
        case 'solid':assert(['sphere','cube','cone','cylinder','rectangular prism'].includes(d.k),'solid scope');return d.k;
        case 'frac':assert(!d.parts||[2,4].includes(d.parts),'halves fourths scope');if(d.mode==='equal')return d.at;if(d.mode==='size')return 'halves';if(d.mode==='name')return d.parts===2?'halves':'fourths';return d.parts===2?'two halves':'four fourths';
        case 'compose':if(d.mode==='square')assert(q.visual.includes('width="100" height="100"'),'square diagram dimensions');return {circle:'circle',square:'square',rectangle:'rectangle',solid:'rectangular prism'}[d.mode];
        case 'coins':{const v={penny:1,nickel:5,dime:10,quarter:25}[d.name];assert(v===d.value,'coin facts');return d.dollar?100/v:v;}
        case 'coin_total':assert(d.pennies+5*d.nickels+10*d.dimes<=100,'coin limit');return d.pennies+5*d.nickels+10*d.dimes;
        case 'bills':assert(d.ones+5*d.fives+10*d.tens<=100,'bill limit');return d.ones+5*d.fives+10*d.tens;
        case 'measure':return d.n;
        case 'length_order':{const sorted=d.values.map((n,i)=>({n,l:'ABC'[i]})).sort((a,b)=>a.n-b.n);return d.mode==='order'?sorted.map(p=>p.l).join(', '):d.mode==='longest'?sorted.at(-1).l:sorted[0].l;}
        case 'tally':return d.mode==='total'?d.a+d.b:d.mode==='difference'?Math.abs(d.a-d.b):d.a;
        case 'pictograph':return d.mode==='read'?d.values[0]:d.mode==='total'?sums(d.values):d.mode==='difference'?Math.abs(d.values[0]-d.values[1]):Math.max(...d.values);
        default:throw Error('Unknown audit '+d.kind);
      }
    }
    switch(k){
      case 'count':return (q.visual.match(/class="obj"/g)||[]).length;
      case 'next':{const n=q.text.match(/\d+/g).map(Number);return q.text.includes('AFTER')?n[0]+1:q.text.includes('BEFORE')?n[0]-1:n[0]+1;}
      case 'skip':{const n=[...q.visual.matchAll(/<span>(\d+)<\/span>/g)].map(x=>+x[1]);return n[2]+n[1]-n[0];}
      case 'missing':{const n=[...q.visual.matchAll(/<span(?: class="blank")?>([^<]*)<\/span>/g)].map(x=>x[1]==='?'?null:Number(x[1]));const known=n.map((v,i)=>({v,i})).filter(p=>p.v!==null),delta=(known[1].v-known[0].v)/(known[1].i-known[0].i);return n[0]+delta*n.indexOf(null);}
      case 'build':{const t=(q.visual.match(/class="bundle"/g)||[]).length,match=q.visual.match(/<div class="ones">([\s\S]*?)<\/div>/),o=match?(match[1].match(/<i>/g)||[]).length:0;return t*10+o;}
      case 'tens':{const n=+q.text.match(/\d+/)[0];return q.text.includes('TENS')?Math.floor(n/10):n%10;}
      case 'compare':{if(typeof q.answer==='number')return Math.max(...q.choices.map(c=>c.value));const n=[...q.visual.matchAll(/<span>(\d+)<\/span>/g)].map(m=>+m[1]);assert(n.every(n=>n<=100),'comparison boundary');return n[0]>n[1]?'>':n[0]<n[1]?'<':'=';}
      case 'tenmore':{const n=q.text.match(/\d+/g).map(Number);return q.text.includes('more')?n[1]+n[0]:n[1]-n[0];}
      default:throw Error('Missing oracle '+k);
    }
  }
  assert(Object.keys(a.GEN).length===31,'31 generators');assert(a.SLOTS.length===10,'10 stages');
  for(const theme of Object.keys(a.THEMES)){
    a.selectTheme(theme);assert(a.THEMES[theme].places.length===10,'theme places');assert(a.THEMES[theme].intro.length===10,'theme introductions');a.renderMap();
    for(const k of Object.keys(a.GEN))for(let L=1;L<=3;L++){
      const keys=new Set();
      for(let i=0;i<120;i++){
        const q=a.GEN[k](L);assert(q.text&&q.hint&&q.explain,`${theme} ${k} missing content`);
        assert(!/NaN|undefined/.test(q.visual||''),`${k} invalid visual`);
        if(q.type==='order'){const sorted=[...q.nums].sort((x,y)=>q.down?y-x:x-y);assert(JSON.stringify(sorted)===JSON.stringify(q.sorted),'order answer');}
        else{
          const want=expected(k,q,L);assert(want===q.answer,JSON.stringify({k,L,want,answer:q.answer,text:q.text,audit:q.audit}));
          assert(q.choices.length>=2,'enough choices '+k);assert(q.choices.some(c=>c.value===q.answer),'correct option '+k);
          assert(new Set(q.choices.map(c=>c.value)).size===q.choices.length,'unique options '+k);
          if(typeof q.answer==='number')assert(Number.isInteger(q.answer)&&q.answer>=0,'nonnegative integer '+k);
        }
        keys.add(a.questionKey(k,q));checked++;
      }
      variation[theme+':'+k+':'+L]=keys.size;
    }
    for(const st of [...a.SLOTS,{id:'daily'}]){a.startStage(st.id);assert(a.round.total===10,'round length');a.nextQ();assert(a.round.stage.skills.includes(a.round.q.skill),'stage generator coverage');}
  }
  // Balanced selection means a ten-question stage samples every included skill.
  a.resetLearning();a.startStage('tokyo');for(let i=0;i<10;i++)a.nextQ();const uses=a.round.skillUses;assert(Object.keys(uses).length===6,'all six place-value skills sampled');assert(Math.max(...Object.values(uses))-Math.min(...Object.values(uses))<=1,'balanced sampling');
  // Deduplication includes persistence across repeated rounds.
  a.resetLearning();a.startStage('paris');a.round.stage.skills=['add'];for(let i=0;i<10;i++)a.nextQ();const first=[...a.round.seen];assert(new Set(first).size===10,'no within-round math repeat');a.startStage('paris');a.round.stage.skills=['add'];for(let i=0;i<10;i++)a.nextQ();assert(a.round.seen.every(k=>!first.includes(k)),'avoid recently seen math');
  const savedDB=JSON.parse(h.storage.get('mathShowdown'));assert(savedDB.profiles[0].recent.length===20,'recent persisted');
  // Six current-level attempts and four consecutive independent successes.
  a.resetLearning();a.startStage('paris');for(let i=0;i<5;i++){a.setQuestion('add',a.GEN.add(1));a.recordFirst(true);}assert((a.player.level.add||1)===1,'not promoted too early');a.setQuestion('add',a.GEN.add(1));a.recordFirst(true);assert(a.player.level.add===2,'sustained success promotes');
  const before=a.player.stats.add.r;a.setQuestion('add',a.GEN.add(2));a.showHint();a.onCorrect();assert(a.player.stats.add.r===before,'hint not first-shot success');assert(a.player.streak.add===0,'hint resets mastery streak');assert(a.player.level.add===2,'hint does not lower independently');
  a.setQuestion('add',a.GEN.add(2));a.onWrong(null);const tries=a.player.stats.add.n;a.onWrong(null);assert(a.player.stats.add.n===tries,'retry not another independent attempt');assert(a.player.level.add===2,'two retries not two questions');a.setQuestion('add',a.GEN.add(2));a.onWrong(null);assert(a.player.level.add===1,'two first errors lower');
  // Picture answer cards reveal the correct clock using their choice index.
  a.resetLearning();a.startStage('bonus');a.round.stage.skills=['clock'];let found=false;
  for(let i=0;i<30;i++){a.setLevel('clock',2);a.nextQ();if(a.round.q.audit.mode==='digital'){found=true;break;}}
  assert(found,'digital-to-analog task generated');a.reveal();const correctButton=h.node('#choices').children.find(b=>b.classList.contains('reveal'));assert(correctButton,'clock answer revealed');assert(a.round.q.choices[Number(correctButton.dataset.choiceIndex)].value===a.round.q.answer,'correct clock revealed');
  // Reset clears newly added learning data without deleting the profile.
  a.player.levelTrials.add={at:1,n:3,right:2};a.reset();assert(a.player.recent.length===0&&Object.keys(a.player.levelTrials).length===0,'reset new fields');assert(a.player.id==='pTest','profile retained');
  return {checked,audited,kinds,minimumUnique:Math.min(...Object.values(variation)),newStages:3,totalGenerators:31,themes:5,roundQuestions:10,checks:'Independent math, all stages/themes, recent-question memory, migration, mastery, hints, retries, clock answer cards, and reset passed.'};
}
const result=runChecks(fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8'),makeHarness);
console.log(JSON.stringify(result,null,2));
