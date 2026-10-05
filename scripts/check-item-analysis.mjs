// Live regression check: pass a non-sensitive JPEG fixture resized to 1024px.
// Calls development OpenAI once; no provider key leaves Convex.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';
import { validatePhotos, ITEM_TYPES, METALS, PURITIES, STONES, supportedPurity } from '../shared/item-rules.js';

const path = process.argv[2];
if (!path) throw new Error('Run: node scripts/check-item-analysis.mjs /path/to/resized-test-photo.jpg');
const data = `data:image/jpeg;base64,${readFileSync(path).toString('base64')}`;
const photos = [{ data, hallmark: false }, { data, hallmark: true }, { data, hallmark: false }];
validatePhotos(photos);
const client = new ConvexHttpClient('https://cool-hawk-741.convex.cloud');
const invalid = await client.action(api.itemAnalysis.analyze, { photos: photos.slice(0, 2) });
assert.equal(invalid.status, 'error');
assert.match(invalid.message, /between 3/);
const noHallmark = await client.action(api.itemAnalysis.analyze, { photos: photos.map((photo) => ({ ...photo, hallmark: false })) });
assert.equal(noHallmark.status, 'error');
assert.match(noHallmark.message, /hallmark/);
const result = await client.action(api.itemAnalysis.analyze, { photos });
assert.equal(result.status, 'success', result.message);
assert.ok(ITEM_TYPES.includes(result.details.itemType));
for (const entry of result.details.metals) {
  assert.ok(METALS.includes(entry.metal));
  assert.ok(PURITIES.includes(entry.purity));
  assert.equal(supportedPurity(entry.metal, entry.purity, entry.hallmark), entry.purity);
}
assert.ok(result.details.stones.every((stone) => STONES.includes(stone)));
console.log('Passed: live analysis returns editable item information; server rejects missing photos and hallmark; purity requires evidence.');
