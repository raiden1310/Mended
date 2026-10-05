import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REPAIR_SERVICES, searchServices } from '../shared/repair-catalog.js';

test('all 93 unique workbook service codes are searchable by code, name, and category', () => {
  assert.equal(REPAIR_SERVICES.length, 93);
  assert.equal(new Set(REPAIR_SERVICES.map(service => service.code)).size, 93);
  for (const service of REPAIR_SERVICES) assert.deepEqual(searchServices(service.code), [service]);
  assert.ok(searchServices('lobster small').some(service => service.code === 'CH-05'));
  assert.ok(searchServices('stones').some(service => service.code === 'ST-01'));
  assert.deepEqual(searchServices('unlisted repair'), []);
});
