import test from 'node:test';
import assert from 'node:assert/strict';
import { decodePhoto } from '../src/photo-loading.js';

test('a thumbnail is shown only after complete decoding, and interrupted photos can recover', async () => {
  let resolve, visible=false, error=false;
  const image={naturalWidth:1024,naturalHeight:768,decode:()=>new Promise(r=>{resolve=r;})};
  const pending=decodePhoto(image,()=>{visible=true;},()=>{error=true;});
  assert.equal(visible,false);
  resolve();await pending;assert.equal(visible,true);assert.equal(error,false);
  image.decode=()=>Promise.reject(new Error('Interrupted download'));
  visible=false;await decodePhoto(image,()=>{visible=true;},()=>{error=true;});
  assert.equal(visible,false);assert.equal(error,true);
  image.decode=()=>Promise.resolve();
  await decodePhoto(image,()=>{visible=true;error=false;},()=>{error=true;});
  assert.equal(visible,true);assert.equal(error,false);
});
