import {test} from 'node:test';
import assert from 'node:assert/strict';
import {printTicketCopies} from '../src/print-ticket.js';
test('printing waits for both signed copies and complete images; failed decoding never opens print',async()=>{
 let printed=0,finish;
 const pending=new Promise(resolve=>{finish=resolve;});
 const root={querySelectorAll:selector=>selector==='.print-ticket' ? [{},{}] : [{decode:()=>pending}]};
 const action=printTicketCopies(root,()=>printed++);
 assert.equal(printed,0);finish();await action;assert.equal(printed,1);
 await assert.rejects(printTicketCopies({querySelectorAll:()=>[]},()=>printed++));
 await assert.rejects(printTicketCopies({querySelectorAll:selector=>selector==='.print-ticket' ? [{},{}] : [{decode:async()=>{throw new Error('Interrupted');}}]},()=>printed++));
 assert.equal(printed,1);
});
