// Development-only round trip using fictional customers and supplied jewelry JPEGs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

const paths=process.argv.slice(2);
if(paths.length!==3)throw new Error('Pass three resized JPEG paths; the third is the hallmark.');
const client=new ConvexHttpClient('https://cool-hawk-741.convex.cloud');
const [customer]=await client.query(api.customers.search,{text:'Olivia'});
assert.ok(customer);
const args={
  requestId:randomUUID(),customerId:customer.id,
  details:{itemType:'Bracelet',metals:[{metal:'Yellow gold',purity:'22K / 916',hallmark:'916'}],stones:['Other']},
  photos:paths.map((path,index)=>({data:`data:image/jpeg;base64,${readFileSync(path).toString('base64')}`,hallmark:index===2})),
  repairs:[{damage:'Bent band',serviceCode:'BG-03',photo:1,override:null,extra:10},{damage:'Scuffs',serviceCode:'BG-05',photo:2,override:null,extra:0}],
  rush:true,rhodium:false,issuedDate:new Date().toISOString().slice(0,10),
};
await assert.rejects(client.action(api.tickets.create,{...args,photos:args.photos.slice(0,2)}));
const id=await client.action(api.tickets.create,args);
assert.equal(await client.action(api.tickets.create,args),id,'Retry must reuse the same ticket.');
const draft=await client.query(api.tickets.get,{id});
assert.equal(draft.status,'draft');assert.equal(draft.total,203);assert.equal(draft.repairs[0].extra,10);
assert.equal(draft.customer.name,'Olivia Bennett');assert.equal(draft.photos.length,3);
for(const photo of draft.photos)assert.equal((await fetch(photo.url)).status,200);
await assert.rejects(client.mutation(api.tickets.sign,{id,dueDate:draft.dueDate,signature:[]}));
await assert.rejects(client.mutation(api.tickets.sign,{id,dueDate:'2026-01-01',signature:[[{x:.1,y:.1},{x:.5,y:.5}]]}));
const signature=[[{x:.1,y:.2},{x:.2,y:.6},{x:.3,y:.3},{x:.8,y:.5}]];
await client.mutation(api.tickets.sign,{id,dueDate:draft.dueDate,signature});
const saved=await client.query(api.tickets.get,{id});
assert.equal(saved.status,'signed');assert.deepEqual(saved.signature,signature);assert.equal(saved.total,203);assert.ok(saved.signedAt);
await client.mutation(api.tickets.sign,{id,dueDate:'2026-12-31',signature:[[{x:.3,y:.3},{x:.8,y:.8}]]});
assert.deepEqual(await client.query(api.tickets.get,{id}),saved,'A retry must not replace the approval.');
console.log('Passed: stored photos, exact fees/total, unique numbered ticket on retry, blank/invalid signature and date rejection, saved and immutable approval.');
