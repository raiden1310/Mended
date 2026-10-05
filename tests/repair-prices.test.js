import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalogPrice } from '../shared/repair-prices.js';
import { REPAIR_SERVICES } from '../shared/repair-catalog.js';

test('typical prices use the confirmed metal and never substitute for unsupported metals', () => {
  const gold = [{metal:'Yellow gold',purity:'14K / 585'}];
  assert.equal(catalogPrice('RF-01',gold).amount,40);
  assert.equal(catalogPrice('RF-01',[{metal:'White gold',purity:'18K / 750'}]).amount,40);
  assert.equal(catalogPrice('RF-01',[{metal:'Platinum',purity:'950 platinum'}]).amount,48);
  for (const metal of [{metal:'Unknown',purity:'Unknown'},{metal:'Yellow gold',purity:'Unknown'},{metal:'Silver',purity:'925 silver'},{metal:'Yellow gold',purity:'10K / 417'},{metal:'Platinum',purity:'Unknown'}]) {
    assert.equal(catalogPrice('RF-01',[metal]).amount,null);
  }
  assert.equal(catalogPrice('RF-01',[...gold,{metal:'Platinum',purity:'950 platinum'}]).amount,null);
  assert.throws(()=>catalogPrice('invented',gold));
  for (const service of REPAIR_SERVICES) {
    assert.ok(Number.isFinite(catalogPrice(service.code,gold).amount));
    assert.ok(catalogPrice(service.code,gold).unit);
  }
});

test('updated bangle prices support 22K and 24K without confusing them with platinum', () => {
  assert.equal(catalogPrice('BG-03', [{metal:'Yellow gold',purity:'22K / 916'}]).amount, 93.5);
  assert.equal(catalogPrice('BG-05', [{metal:'Yellow gold',purity:'22K / 916'}]).amount, 49.5);
  assert.equal(catalogPrice('BG-03', [{metal:'Yellow gold',purity:'24K / 999'}]).amount, 97.75);
  assert.equal(catalogPrice('BG-03', [{metal:'Platinum',purity:'950 platinum'}]).amount, 102);
  const unavailable = catalogPrice('BG-02', [{metal:'Yellow gold',purity:'24K / 999'}]);
  assert.equal(unavailable.amount, null);
  assert.equal(unavailable.availability, 'not_offered');
  assert.equal(catalogPrice('BG-03', [{metal:'Silver',purity:'925 silver'}]).availability, 'unsupported_metal');
  assert.equal(catalogPrice('BG-03', [{metal:'Yellow gold',purity:'Unknown'}]).availability, 'confirm_metal');
});
