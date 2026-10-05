import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateEstimate} from '../shared/estimate.js';
const metals=[{metal:'Yellow gold',purity:'22K / 916'}];
const line=(serviceCode,override=null,extra=0)=>({serviceCode,override,extra});
test('totals use catalog prices, manual corrections, extras and one rush fee',()=>{
 const r=calculateEstimate({metals,repairs:[line('BG-03'),line('BG-05',50,12.34)],rush:true,rhodium:false});
 assert.equal(r.total,205.84); assert.equal(r.complete,true);
 assert.equal(r.lines[0].amount,93.5);
});
test('unknown prices and unmatched services never become a zero-dollar complete estimate',()=>{
 const input={metals:[{metal:'Silver',purity:'925 silver'}],repairs:[line('BG-03')],rush:false,rhodium:false};
 assert.equal(calculateEstimate(input).total,null);
 assert.equal(calculateEstimate({...input,repairs:[line('BG-03',0)]}).total,0);
 assert.equal(calculateEstimate({...input,repairs:[line('',50)]}).complete,false);
});
test('money, catalog choices and fee eligibility are checked on the server',()=>{
 const input={metals,repairs:[line('BG-03')],rush:false,rhodium:false};
 for(const override of [-1,NaN,Infinity,1.234,1000001]) assert.throws(()=>calculateEstimate({...input,repairs:[line('BG-03',override)]}));
 assert.throws(()=>calculateEstimate({...input,repairs:[line('invented')]}));
 assert.throws(()=>calculateEstimate({...input,rhodium:true}));
 const white=[{metal:'White gold',purity:'18K / 750'}];
 assert.equal(calculateEstimate({...input,metals:white,rhodium:true}).total,95);
 assert.equal(calculateEstimate({...input,repairs:[]}).total,null);
 assert.throws(()=>calculateEstimate({...input,repairs:Array(13).fill(line('BG-03'))}));
});
