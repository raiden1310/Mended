import {test} from 'node:test';
import assert from 'node:assert/strict';
import {suggestServices, mergeRepairSuggestions} from '../shared/intake-shortcuts.js';

test('quick choices are catalog entries related to observed damage and favor the item type',()=>{
 const choices=suggestServices('Band is bent out of round','Bracelet');
 assert.equal(choices[0].code,'BG-03');
 assert.ok(suggestServices('Scuffed and dirty surface','Bracelet').some(service=>service.code==='BG-05'));
 assert.deepEqual(suggestServices('','Ring'),[]);
 assert.deepEqual(suggestServices('Unknown damage','Ring'),[]);
});
test('close-up reanalysis preserves manual edits and does not repeat a matched service',()=>{
 const manual={id:1,source:'manual',damage:'Associate confirmed bent band',serviceCode:'BG-03',override:80,extra:12,metalIndexes:[0,1],photo:0};
 const old={id:2,source:'ai',damage:'Scuffs',serviceCode:'BG-05'};
 const fresh=[{id:3,source:'ai',damage:'Band has an uneven outline with visible bends.',serviceCode:''},{id:4,source:'ai',damage:'Scuffs on surface',serviceCode:'BG-05'},{id:5,source:'ai',damage:'Clasp broken',serviceCode:'BG-12'}];
 const result=mergeRepairSuggestions([manual,old],fresh);
 assert.deepEqual(result,[manual,fresh[1],fresh[2]]);
 assert.equal(mergeRepairSuggestions(Array.from({length:12},(_,id)=>({...manual,id})),fresh).length,12);
});
