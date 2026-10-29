'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
let source=fs.readFileSync(path.resolve(__dirname,'first-grade-bank.test.cjs'),'utf8').split('const result=runChecks(')[0];
source=source.replace('return {GEN,SLOTS','return {makeProgressLink,readProgressToken,installProgressSnapshot,openProgressLink,GEN,SLOTS').replace("{protocol:'https:'}","globalThis.testLocation");
const makeHarness=new Function('require',source+';return makeHarness;')(require);
globalThis.testLocation={protocol:'http:',origin:'https://example.com',pathname:'/Math-1st-grade/',search:'',hash:''};
globalThis.history={replaceState(){globalThis.testLocation.hash='';}};
(async()=>{
  const sender=makeHarness(html),a=sender.api;
  a.player.name='Séla ⚽';a.player.stickers=[a.THEMES.huntrix.stickers[0][0]];a.player.levelTrials.count={at:2,n:5,right:4};
  a.db.profiles.push({...structuredClone(a.player),id:'pSibling',name:'Sibling',stars:{seoul:3}});
  const link=await a.makeProgressLink(),token=link.split('#progress=')[1];assert(token.startsWith('z'));
  const snapshot=await a.readProgressToken(token);assert.equal(snapshot.profiles.length,2);assert.equal(snapshot.profiles[0].name,'Séla ⚽');
  assert.deepEqual(snapshot.profiles[0].stats.count,{n:7,r:5});assert.equal(snapshot.profiles[0].level.count,2);assert.deepEqual(snapshot.profiles[0].levelTrials.count,{at:2,n:5,right:4});assert.deepEqual(snapshot.profiles[0].stickers,a.player.stickers);
  const receiver=makeHarness(html,73,{...structuredClone(a.player),id:'pOther',name:'Other player'});
  const existing=JSON.stringify(receiver.api.db);
  // Merely opening and previewing a link never writes over device progress.
  testLocation.hash='#progress='+token;await receiver.api.openProgressLink();assert.equal(JSON.stringify(receiver.api.db),existing);assert.equal(testLocation.hash,'');assert.equal(receiver.node('#transferLoad').hidden,false);
  receiver.node('#transferLoad').onclick();assert.equal(receiver.api.db.profiles.length,3);assert.equal(receiver.api.player.name,'Séla ⚽');assert.equal(receiver.api.player.stars.seoul,2);
  assert.equal(JSON.parse(receiver.storage.get('mathShowdown')).profiles.length,3);
  receiver.api.player.stars.seoul=3;receiver.api.installProgressSnapshot(await receiver.api.readProgressToken(token));assert.equal(receiver.api.db.profiles.length,3);assert.equal(receiver.api.player.stars.seoul,2);
  // Subsequent phone progress is independent of an already-created snapshot.
  a.player.stars.seoul=3;assert.equal((await a.readProgressToken(token)).profiles[0].stars.seoul,2);
  const compress=globalThis.CompressionStream;globalThis.CompressionStream=undefined;
  const fallback=await a.makeProgressLink();globalThis.CompressionStream=compress;assert(fallback.split('#progress=')[1].startsWith('j'));assert.equal((await a.readProgressToken(fallback.split('#progress=')[1])).profiles[0].name,'Séla ⚽');
  for(const invalid of ['','z!!!','j'+Buffer.from('{"v":2}').toString('base64url'),'z'+'a'.repeat(60001)])await assert.rejects(()=>a.readProgressToken(invalid));
  const bad={v:1,at:new Date().toISOString(),profiles:[{id:'pEvil',name:'Evil',theme:'__proto__'}]};await assert.rejects(()=>a.readProgressToken('j'+Buffer.from(JSON.stringify(bad)).toString('base64url')));
  const previous=JSON.stringify(receiver.api.db);receiver.storage.set=()=>{throw Error('Quota exceeded');};assert.throws(()=>receiver.api.installProgressSnapshot(snapshot));assert.equal(JSON.stringify(receiver.api.db),previous);
  // The parent action provides a selectable link when native share/clipboard are unavailable.
  await sender.node('#pShare').onclick();assert.equal(sender.node('#pShareLink').hidden,false);assert(sender.node('#pShareLink').value.includes('#progress='));assert.equal(sender.node('#pShare').disabled,false);
  console.log('Progress sharing passed: multi-player compressed and plain links, Unicode, preview, import, existing-player preservation, snapshot isolation, malformed links, storage failure, copy fallback. Link length:',link.length);
})().catch(e=>{console.error(e);process.exitCode=1;});
