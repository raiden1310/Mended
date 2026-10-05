import test from 'node:test';
import assert from 'node:assert/strict';
import { selectItem } from '../shared/item-accordion.js';
test('minus collapses, plus reopens, and another item opens without losing edits',()=>{
 const items=[{repairs:[{extra:12}]},{repairs:[{extra:5}]}];
 const state={screen:'review',active:1,items};
 selectItem(state,1,true);assert.equal(state.reviewCollapsed,true);assert.equal(state.active,1);
 selectItem(state,1,true);assert.equal(state.reviewCollapsed,false);
 selectItem(state,1,true);selectItem(state,0,true);assert.equal(state.reviewCollapsed,false);assert.equal(state.active,0);
 assert.equal(state.items,items);assert.equal(state.items[1].repairs[0].extra,5);
 state.screen='capture';selectItem(state,0,false);assert.equal(state.reviewCollapsed,false);
});
