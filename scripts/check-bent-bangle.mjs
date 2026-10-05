// Live regression check: pass resized whole-piece, close-up, and third-view JPEGs.
// The supplied photos are read locally, sent to the development action, and never saved here.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { ConvexHttpClient } from 'convex/browser';
const paths = process.argv.slice(2);
assert.equal(paths.length, 3, 'Pass three resized JPEG paths.');
const photos = paths.map((path, index) => ({ data: 'data:image/jpeg;base64,' + readFileSync(path).toString('base64'), hallmark: index === 1 }));
const client = new ConvexHttpClient('https://cool-hawk-741.convex.cloud');
const result = await client.action('itemAnalysis:analyzeRepairs', { photos });
assert.equal(result.status, 'success', result.message);
assert.equal(result.assessment, 'visible_damage', 'The confirmed bent bangle must not be reported as undamaged.');
assert.ok(result.repairs.some(repair => /bent|bend|distort|deform|kink|out.of.round|flatten/i.test(repair.damage)), 'Report the visible shape damage.');
assert.ok(result.repairs.every(repair => repair.photo >= 1 && repair.photo <= 3));
assert.ok(result.repairs.filter(repair => /bent|bend|distort|deform|kink|out.of.round|flatten/i.test(repair.damage)).every(repair => ['', 'BG-03'].includes(repair.serviceCode)), 'Use a bangle reshaping service only when applicable; never substitute a ring service.');
console.log('Passed: bent bangle detected, evidence cited, only applicable bangle services selected.');
console.log(JSON.stringify(result));
