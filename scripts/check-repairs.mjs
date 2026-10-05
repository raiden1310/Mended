// Development-only live check. Supply a non-sensitive JPEG; nothing is saved.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';
import { validateRepairs } from '../shared/item-rules.js';
const path = process.argv[2];
if (!path) throw new Error('Pass a resized test JPEG path.');
const data = 'data:image/jpeg;base64,' + readFileSync(path).toString('base64');
const photos = [{data, hallmark:false},{data, hallmark:true},{data, hallmark:false}];
const client = new ConvexHttpClient('https://cool-hawk-741.convex.cloud');
const rejected = await client.action(api.itemAnalysis.analyzeRepairs, {photos:photos.slice(0,2)});
assert.equal(rejected.status, 'error');
const manual = [{damage:'Broken clasp',serviceCode:'CH-04',photo:0}];
const review = await client.action(api.itemAnalysis.reviewRepairs, {repairs:manual,photoCount:3});
assert.equal(review.ok,true);
assert.deepEqual(review.repairs,manual);
const invalid = await client.action(api.itemAnalysis.reviewRepairs, {repairs:[{...manual[0],photo:4}],photoCount:3});
assert.equal(invalid.ok,false);
const result = await client.action(api.itemAnalysis.analyzeRepairs, {photos});
assert.equal(result.status,'success',result.message);
assert.ok(['visible_damage','none_visible','unclear'].includes(result.assessment));
assert.deepEqual(validateRepairs(result.repairs,3,{allowUnselected:true}),result.repairs);
if (result.assessment !== 'visible_damage') assert.deepEqual(result.repairs,[]);
else assert.ok(result.repairs.length > 0 && result.repairs.every(repair => repair.photo > 0));
console.log('Passed: live damage assessment, evidence references, manual entry without extra photos, and server rejection of invalid inputs.');
console.log(JSON.stringify(result));

if (process.argv.includes('--scuffed-ring')) {
  assert.equal(result.assessment, 'visible_damage');
  assert.ok(result.repairs.some(repair => repair.serviceCode === 'RF-01'), 'Visible ring scuffs must suggest cleaning and polishing');
  const price = await client.query(api.repairPrices.get, {serviceCode:'RF-01',metals:[{metal:'Yellow gold',purity:'14K / 585'}]});
  assert.equal(price.amount,40);
  console.log('Passed: visible ring scuffs suggest RF-01 and fetch the catalog price.');
}
