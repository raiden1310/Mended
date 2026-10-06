import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import * as errors from '../src/error-navigation.js';
import {api} from '../convex/_generated/api.js';
import * as rules from '../shared/item-rules.js';
import * as shortcuts from '../shared/intake-shortcuts.js';
import * as multi from '../shared/multi-intake.js';
import * as ticketRules from '../shared/ticket-rules.js';
import * as catalog from '../shared/repair-catalog.js';
import * as customer from '../src/customer-picker.js';
import * as ticket from '../src/ticket.js';
import * as photos from '../src/photo-loading.js';
async function appPage(){
const dom=new JSDOM('<main id="app"></main><div id="splash"></div>',{url:'https://cool-hawk-741.convex.site',runScripts:'outside-only'});
const w=dom.window;globalThis.document=w.document;globalThis.window=w;globalThis.ResizeObserver=class{observe(){}disconnect(){}};w.scrollTo=()=>{};w.ResizeObserver=class {observe(){}disconnect(){}};
Object.assign(w,errors,await import('../shared/item-accordion.js'),rules,shortcuts,multi,ticketRules,catalog,customer,ticket,photos,{api,mendedLogo:'/logo.svg',startSplash:(_container,callback)=>callback()});
const scrolls=[];w.HTMLElement.prototype.scrollIntoView=function(options){scrolls.push({element:this,options});};
w.ConvexHttpClient=class {async query(){return {complete:true,subtotal:100,fees:0,total:100,lines:[],amount:100,basis:'18K',unit:'per item'};}};
let source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('import.meta.env.VITE_CONVEX_URL',"'https://cool-hawk-741.convex.cloud'");
source+='\nwindow.check={state,newItem,render,analyze,client};';w.eval(source);
return {...w.check,w,scrolls,close:()=>{for(const item of w.check.state.items)clearTimeout(item.estimateTimer);w.close();}};

}

const details={itemType:'Ring',metals:[{metal:'Yellow gold',purity:'18K / 750',hallmark:'750'}],stones:['Unknown']};
function review(page){const {state,newItem,render}=page;state.items=[newItem()];state.items[0].details=structuredClone(details);state.items[0].repairs=[{id:1,damage:'Scratches',serviceCode:null,override:null,extra:0,photo:0,source:'manual'}];state.screen='review';render();}

test('choosing a service through search or a suggestion removes that repair’s suggestions',async()=>{
 for(const method of ['search','suggestion']){const page=await appPage();try{review(page);const doc=page.w.document;assert.ok(doc.querySelector('.quick-services'));if(method==='search'){doc.querySelector('[data-picker] input').focus();doc.querySelector('[data-picker] [data-code]').click();}else doc.querySelector('[data-quick-service]').click();assert.ok(page.state.repairs[0].serviceCode);assert.equal(doc.querySelector('.quick-services'),null);assert.ok(doc.querySelector('.selected-service.is-selected'));}finally{page.close();}}
});

test('single-item capture and review hide Remove item; removing a second item hides it again',async()=>{
 const page=await appPage();try{assert.equal(page.w.document.querySelector('[data-delete-item]'),null);review(page);assert.equal(page.w.document.querySelector('[data-delete-item]'),null);const extra=page.newItem();extra.details=structuredClone(details);page.state.items.push(extra);page.render();page.w.document.querySelector('[data-delete-item]').click();assert.equal(page.state.items.length,1);assert.equal(page.w.document.querySelector('[data-delete-item]'),null);}finally{page.close();}
});

test('missing customer focuses and scrolls to the complete error instead of the customer input',async()=>{
 const page=await appPage();try{review(page);page.w.document.querySelector('#item-form').dispatchEvent(new page.w.Event('submit',{bubbles:true,cancelable:true}));const alert=page.w.document.querySelector('.notice.error');assert.match(alert.textContent,/select a customer/);assert.equal(page.w.document.activeElement,alert);assert.equal(page.scrolls.at(-1).element,alert);assert.equal(page.scrolls.at(-1).options.block,'start');}finally{page.close();}
});

test('error navigation handles new inline and signature errors without repeating unchanged errors',async()=>{
 const page=await appPage();try{const root=page.w.document.querySelector('#app');root.innerHTML='<p role="alert">Price failed</p><p role="alert" hidden>Hidden error</p>';const navigate=errors.createErrorNavigation(root);navigate();assert.equal(page.scrolls.at(-1).element,root.firstElementChild);const count=page.scrolls.length;navigate();assert.equal(page.scrolls.length,count);root.firstElementChild.textContent='Estimate failed';navigate();assert.equal(page.scrolls.length,count+1);const signature=page.w.document.createElement('p');signature.textContent='Sign before saving';page.w.document.body.append(signature);errors.revealError(signature);assert.equal(page.w.document.activeElement,signature);assert.equal(page.scrolls.at(-1).element,signature);}finally{page.close();}
});

test('a failed customer search scrolls to its error without closing the message',async()=>{
 const page=await appPage();try{const state={customer:null,customerSearch:'Sample'};const root=page.w.document.querySelector('#app');root.innerHTML=customer.customerCard(state);customer.bindCustomer({state,searchCustomers:async()=>{throw new Error('Offline');},markChanged:()=>{},render:()=>{}});root.querySelector('#customer-search').focus();await new Promise(resolve=>setTimeout(resolve,0));const alert=root.querySelector('[role="alert"]');assert.match(alert.textContent,/Could not search/);assert.equal(page.w.document.activeElement,alert);assert.equal(root.querySelector('#customer-options').hidden,false);assert.equal(page.scrolls.at(-1).element,alert);}finally{page.close();}
});
