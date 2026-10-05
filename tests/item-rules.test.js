import { test } from 'node:test';
import assert from 'node:assert/strict';
import { supportedPurity, photoIntakeMessage, validatePhotos, validateRepairs } from '../shared/item-rules.js';

test('purity needs a readable, matching hallmark, never a guess from appearance', () => {
  assert.equal(supportedPurity('Yellow gold', '14K / 585', ''), 'Unknown');
  assert.equal(supportedPurity('Yellow gold', '14K / 585', '18K'), 'Unknown');
  assert.equal(supportedPurity('Yellow gold', '14K / 585', '585'), '14K / 585');
  assert.equal(supportedPurity('Unknown', '14K / 585', '14K'), 'Unknown');
  assert.equal(supportedPurity('Gold (color unknown)', '18K / 750', '750'), '18K / 750');
  assert.equal(supportedPurity('Silver', '18K / 750', '750'), 'Unknown');
  assert.equal(supportedPurity('Silver', '925 silver', '925'), '925 silver');
});

const jpeg = (width, height) => 'data:image/jpeg;base64,' + Buffer.from([255,216,255,192,0,11,8,height >> 8,height & 255,width >> 8,width & 255,1,1,0,0,255,217]).toString('base64');
const photo = { data: jpeg(1024,768), hallmark: true };
test('server requires three resized photos and a hallmark designation', () => {
  assert.throws(() => validatePhotos([photo, photo]), /between 3/);
  assert.throws(() => validatePhotos(Array(3).fill({ ...photo, hallmark: false })), /hallmark/);
  assert.throws(() => validatePhotos(Array(3).fill({ ...photo, data: jpeg(2048,768) })), /1024/);
  assert.throws(() => validatePhotos(Array(3).fill({ ...photo, data: 'data:image/jpeg;base64,aGVsbG8=' })), /Invalid JPEG/);
  assert.throws(() => validatePhotos(Array(7).fill(photo)), /between 3/);
  assert.doesNotThrow(() => validatePhotos(Array(3).fill(photo)));
});

test('manual damage is accepted without another photo; repair bounds and evidence are enforced', () => {
  const manual = { damage: '  Broken clasp  ', serviceCode: 'CH-04', photo: 0 };
  assert.deepEqual(validateRepairs([manual], 3), [{ damage: 'Broken clasp', serviceCode: 'CH-04', photo: 0 }]);
  assert.deepEqual(validateRepairs([], 3), []);
  assert.throws(() => validateRepairs([{ ...manual, damage: '' }], 3), /damage description/);
  assert.throws(() => validateRepairs([{ ...manual, serviceCode: 'made-up-service' }], 3), /repair service/);
  assert.throws(() => validateRepairs([{ ...manual, photo: 4 }], 3), /existing evidence photo/);
  assert.throws(() => validateRepairs(Array(13).fill(manual), 3), /12/);
});

test('AI can leave a service unselected, but associate confirmation requires a catalog entry', () => {
  const damage = { damage: 'Broken clasp', serviceCode: '', photo: 1 };
  assert.doesNotThrow(() => validateRepairs([damage], 3, { allowUnselected: true }));
  assert.throws(() => validateRepairs([damage], 3), /from the catalog/);
  assert.throws(() => validateRepairs([{ ...damage, serviceCode: 'invented' }], 3, { allowUnselected: true }), /from the catalog/);
});

test('multiple pieces request one item, while blur keeps its own retake message', () => {
  assert.equal(photoIntakeMessage({multipleItems:true,photosUsable:false}), 'One item at a time, please.');
  assert.equal(photoIntakeMessage({multipleItems:true,photosUsable:true}), 'One item at a time, please.');
  assert.match(photoIntakeMessage({multipleItems:false,photosUsable:false}), /too unclear/);
  assert.equal(photoIntakeMessage({multipleItems:false,photosUsable:true}), '');
});
