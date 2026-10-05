import test from 'node:test';
import assert from 'node:assert/strict';
import { ticketScreen } from '../src/ticket.js';
const details={itemType:'Bracelet',metals:[{metal:'Yellow gold',purity:'18K / 750',hallmark:'750'}],stones:['None visible']};
const makeItem=(position,dueDate)=>({id:`fake-item-${position}`,position,details,dueDate,photos:[],repairs:[{serviceCode:'BG-03',serviceName:'Reshape bangle',damage:'Bent band',amount:100,extra:5,total:105,manual:true,metalIndexes:[0],photo:0}],subtotal:105,fees:50,total:155,rush:true,rhodium:false});
const ticket={id:'fake-ticket',number:1,customer:{name:'Alex Example',phone:'555-0100'},issuedDate:'2026-10-06',total:310,status:'draft',items:[makeItem(0,'2026-10-07'),makeItem(1,'2026-10-12')]};
test('one combined ticket shows independent due dates and rush fees',()=>{
 const html=ticketScreen(ticket);
 assert.match(html,/\$310\.00/);
 assert.match(html,/Item 1 · Bracelet/);assert.match(html,/Item 2 · Bracelet/);
 assert.match(html,/data-item-due="0" value="2026-10-07"/);assert.match(html,/data-item-due="1" value="2026-10-12"/);
 assert.equal((html.match(/Rush fee/g)??[]).length,2);
 assert.equal((html.match(/id="sign-ticket"/g)??[]).length,1);
});
test('signed copies contain every item with one signature per copy',()=>{
 const html=ticketScreen({...ticket,status:'signed',signature:[[{x:.1,y:.1},{x:.2,y:.2}]],signedAt:Date.UTC(2026,9,6)});
 assert.equal((html.match(/class="print-ticket"/g)??[]).length,2);
 assert.equal((html.match(/Customer signature<\/h2>/g)??[]).length,3);
 assert.equal((html.match(/Item 2 · Bracelet/g)??[]).length,3);
 assert.doesNotMatch(html,/data-item-due=/);
});
