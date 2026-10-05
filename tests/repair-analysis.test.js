import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareDamageFindings, applyCatalogMatches } from '../shared/repair-analysis.js';

test('detected damage survives empty, missing, and unmatched catalog results', () => {
  const damage = [{damage:'Bangle bent out of round',repairNeeded:'Reshape bangle',photo:2},{damage:'Visible surface scuffs',repairNeeded:'Clean and polish',photo:1}];
  const prepared = prepareDamageFindings('none_visible',damage,3);
  assert.equal(prepared.assessment,'visible_damage');
  assert.deepEqual(applyCatalogMatches(prepared.findings,[],3), damage.map(({damage,photo})=>({damage,photo,serviceCode:''})));
  const matched = applyCatalogMatches(prepared.findings,[{finding:1,serviceCode:'RF-01'}],3);
  assert.equal(matched[0].damage,damage[0].damage);
  assert.equal(matched[0].serviceCode,'');
  assert.equal(matched[1].serviceCode,'RF-01');
  assert.equal(matched[1].photo,1);
  assert.throws(()=>applyCatalogMatches(prepared.findings,[{finding:0,serviceCode:'invented'}],3));
  assert.throws(()=>applyCatalogMatches(prepared.findings,[{finding:3,serviceCode:''}],3));
});
