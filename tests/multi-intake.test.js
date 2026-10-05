import test from 'node:test';
import assert from 'node:assert/strict';
import { captureReady, combinedEstimate } from '../shared/multi-intake.js';
import { calculateEstimate } from '../shared/estimate.js';
test('every item needs three photos and its own marked hallmark',()=>{
 assert.equal(captureReady({photos:[{}, {}, {}]}),false);
 assert.equal(captureReady({photos:[{hallmark:true}, {}]}),false);
 assert.equal(captureReady({photos:[{hallmark:true}, {}, {}]}),true);
});
test('combined prices include rush separately for each item and added fees',()=>{
 const item=extra=>({estimate:calculateEstimate({metals:[{metal:'Yellow gold',purity:'18K / 750'}],repairs:[{serviceCode:'BG-03',override:100,extra}],rush:true,rhodium:false})});
 assert.equal(combinedEstimate([item(5),item(12)]).total,317);
 assert.equal(combinedEstimate([item(5),{estimate:null}]).complete,false);
 assert.equal(combinedEstimate(Array.from({length:301},()=>item(0))).total,45150);
});
