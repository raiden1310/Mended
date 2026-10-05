// Run after importing the fictional workbook into development Convex.
import assert from 'node:assert/strict';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

const client = new ConvexHttpClient('https://cool-hawk-741.convex.cloud');
for (const text of ['olivia', 'Bennett', 'Olivia Bennett', '(212) 555-0143', '212555', '5550143', '0143']) {
  const result = await client.query(api.customers.search, { text });
  assert.ok(result.some(customer => customer.name === 'Olivia Bennett'), `No match for ${text}`);
  assert.equal(new Set(result.map(customer => customer.id)).size, result.length);
}
assert.deepEqual(await client.query(api.customers.search, { text: '' }), []);
assert.deepEqual(await client.query(api.customers.search, { text: 'Nobodyintheworkbook' }), []);
await assert.rejects(client.query(api.customers.search, { text: 'a'.repeat(81) }));
console.log('Passed: first/last/full name, formatted and partial phone searches, empty/no matches, unique results, server search limit.');
