import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestedDueDate, validateDueDate, validateSignature, signaturePoint } from '../shared/ticket-rules.js';

test('ticket due dates use the longest in-house service and skip weekends', () => {
  assert.equal(suggestedDueDate('2026-10-09', ['BG-03', 'BG-05']), '2026-10-13');
  assert.throws(() => suggestedDueDate('2026-02-30', ['BG-03']));
  assert.throws(() => suggestedDueDate('2026-10-09', ['invented']));
  assert.throws(() => validateDueDate('2026-10-08', '2026-10-09'));
  assert.equal(validateDueDate('2026-10-15', '2026-10-09'), '2026-10-15');
});

test('a saved signature must contain bounded drawn strokes, never a blank or tap', () => {
  assert.throws(() => validateSignature([]));
  assert.throws(() => validateSignature([[{x:.1,y:.1}]]));
  assert.throws(() => validateSignature([[{x:.1,y:.1},{x:.1,y:.1}]]));
  assert.throws(() => validateSignature([[{x:-1,y:.1},{x:.4,y:.4}]]));
  assert.throws(() => validateSignature([[{x:NaN,y:.1},{x:.4,y:.4}]]));
  assert.throws(() => validateSignature(Array.from({length:65},()=>[{x:.1,y:.1},{x:.4,y:.4}])));
  assert.equal(validateSignature([[{x:.1,y:.1},{x:.4,y:.4}]]).length,1);
});

test('signature coordinates preserve the drawing proportions at phone and desktop widths', () => {
  for(const width of [184,342,552]) {
    const point=signaturePoint({width,height:220,left:10,top:20},{clientX:110,clientY:70});
    assert.equal(point.x/point.y,2,'Both axes must share a scale so the signature never stretches.');
  }
  assert.deepEqual(signaturePoint({width:342,height:220,left:0,top:0},{clientX:-50,clientY:-50}),{x:0,y:0});
});
