import {createErrorNavigation, revealError} from './error-navigation.js';
import {selectItem} from '../shared/item-accordion.js';
import {captureReady, combinedEstimate} from '../shared/multi-intake.js';
import {suggestedDueDate, validateDueDate} from '../shared/ticket-rules.js';
import {suggestServices, mergeRepairSuggestions} from '../shared/intake-shortcuts.js';
import { photoPreview, bindPhotoLoading } from './photo-loading.js';
import mendedLogo from '../design/logo/svg/mended_horizontal_full-color.svg';
import { REPAIR_SERVICES, searchServices } from '../shared/repair-catalog.js';
import { startSplash } from './splash.js';
import { customerCard, bindCustomer } from './customer-picker.js';
import { ticketScreen, bindTicket } from './ticket.js';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import './style.css';
import { ITEM_TYPES, METALS, PURITIES, STONES, MAX_PHOTOS, BUSY_MESSAGE } from '../shared/item-rules.js';

const client = import.meta.env.VITE_CONVEX_URL ? new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL) : null;
const app = document.querySelector('#app');
const revealAppErrors = createErrorNavigation(app);
let itemSequence=0;
const newItem=()=>({id:++itemSequence,photos:[],details:null,repairs:[],assessment:null,repairError:'',repairBusy:false,repairPhotosChanged:false,estimate:null,estimateError:'',estimatePending:false,rush:false,rhodium:false,itemDetailsOpen:undefined,dueDate:'',dueEdited:false,analysisError:''});
const state={screen:'capture',items:[newItem()],active:0,busy:false,processing:false,error:'',confirmed:false};
for(const key of Object.keys(state.items[0]).filter(key=>key!=='id')) Object.defineProperty(state,key,{get:()=>state.items[state.active][key],set:value=>{state.items[state.active][key]=value;}});
const todayDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
async function loadTicket(id){const ticket=await client.query(api.combinedTickets.get,{id});if(!ticket)throw new Error('Ticket not found');ticket.items=[];let after=-1;while(true){const rows=await client.query(api.combinedTickets.items,{id,after});ticket.items.push(...rows);if(rows.length<10)break;after=rows.at(-1).position;}return ticket;}
let photoId = 0;
let repairId = 0;
state.customer = null;
state.customerSearch = '';
state.ticket = null;
state.ticketRequestId = null;
state.ticketRequestSignature = null;

function startNewPiece(keepCustomer = false) {
  const customer = keepCustomer === true ? state.customer : null;
  state.items=[newItem()];state.active=0;state.reviewCollapsed=false;state.ticket=null;state.ticketRequestId=null;state.ticketRequestSignature=null;state.customer=customer;state.customerSearch='';state.screen='capture';state.confirmed=false;state.error='';
  render();window.scrollTo(0,0);
}
const usd = amount => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'}).format(amount);
const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const options = (values, selected) => values.map((value) => `<option${value === selected ? ' selected' : ''}>${escape(value)}</option>`).join('');
const cameraIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9V8a3 3 0 0 1 3-3h2l2-3h5l2 3h2a3 3 0 0 1 3 3v7M3 16v2a3 3 0 0 0 3 3h10"/><circle cx="12" cy="12" r="4"/><circle cx="21" cy="20" r="2.5" fill="currentColor" stroke="none"/></svg>';

function photoStrip(editable) {
  return `<div class="photos" aria-label="Captured photos">${state.photos.map((photo, index) => `<figure class="photo">
    ${photoPreview(photo.data, `Jewelry photo ${index + 1}${photo.hallmark ? ', hallmark close-up' : ''}`, escape)}
    <figcaption>Photo ${index + 1}${photo.hallmark ? ' · Hallmark' : ''}</figcaption>
    ${editable ? `<button class="text-button hallmark${photo.hallmark ? ' selected' : ''}" data-mark="${photo.id}" aria-pressed="${photo.hallmark}">${photo.hallmark ? 'Hallmark photo' : 'Mark as hallmark'}</button><button class="photo-remove" data-remove="${photo.id}" aria-label="Remove photo ${index + 1}"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#A33A43"/><path d="M11 11l10 10m0-10L11 21" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/></svg></button>` : ''}
  </figure>`).join('')}</div>`;
}

const backIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6M8 12h12"/></svg>';
function pageHeader(label, back = '') {
  return `<header class="header"><div class="header-brand">${back ? `<button type="button" class="nav-back" id="header-back" aria-label="${back}">${backIcon}</button>` : ''}<img class="brand" src="${mendedLogo}" alt="Mended" width="171" height="32" /></div><span class="step">${label}</span></header>`;
}
function returnToPhotos() { state.screen = 'capture'; state.error = ''; render(); window.scrollTo(0, 0); }

function render() {
  const reviewing = state.screen === 'review';
  if (state.screen === 'ticket') {
    app.innerHTML = `${pageHeader('Repair ticket', state.ticket.status === 'signed' ? '' : 'Edit estimate')}${state.error?`<p class="notice error" role="alert">${escape(state.error)}</p>`:''}${ticketScreen(state.ticket)}`;
    bindPhotoLoading(app);
    bindTicket({state,render,startNew:()=>startNewPiece(),nextForCustomer:()=>startNewPiece(true),edit:()=>{state.screen='review';state.confirmed=false;state.ticketRequestId=null;state.error='';render();window.scrollTo(0,0);},save:async args=>{const saved=await client.query(api.combinedTickets.get,{id:args.id});if(saved?.status==='signed')return await loadTicket(args.id);for(const item of state.ticket.items)await client.mutation(api.combinedTickets.updateDue,{id:item.id,dueDate:item.dueDate});await client.mutation(api.combinedTickets.sign,{id:args.id,signature:args.signature});return await loadTicket(args.id);}});
    revealAppErrors();
    return;
  }
  app.innerHTML = `${pageHeader(reviewing ? 'Review estimate' : 'Repair intake', reviewing ? 'Review photos' : '')}
    ${state.error ? `<p class="notice error" role="alert">${escape(state.error)}</p>` : ''}
    ${reviewing ? reviewScreen() : captureScreen()}`;
  bindPhotoLoading(app);
  document.querySelectorAll('[data-open-item]').forEach(button=>button.addEventListener('click',()=>{selectItem(state,Number(button.dataset.openItem),button.classList.contains('item-accordion-heading'));state.error='';render();}));
  document.querySelectorAll('[data-delete-item]').forEach(button=>button.addEventListener('click',()=>{if(state.items.length<=1)return;state.items.splice(Number(button.dataset.deleteItem),1);if(!state.items.length)state.items=[newItem()];state.active=Math.min(state.active,state.items.length-1);state.reviewCollapsed=false;state.ticketRequestId=null;state.error='';render();}));
  document.querySelector('#add-item')?.addEventListener('click',()=>{if(!captureReady(state.items[state.active]) || state.busy || state.processing)return;state.items.push(newItem());state.active=state.items.length-1;state.ticketRequestId=null;render();window.scrollTo(0,0);});
  if (!reviewing) {
    document.querySelector('#capture-clear-customer')?.addEventListener('click',()=>{state.customer=null;render();});
    document.querySelector('#take-photo')?.addEventListener('click', () => document.querySelector('#camera-file').click());
    document.querySelector('#camera-file')?.addEventListener('change', importFiles);
    document.querySelector('#files')?.addEventListener('change', importFiles);
    document.querySelector('#analyze')?.addEventListener('click', analyze);
    document.querySelectorAll('[data-mark]').forEach((button) => button.addEventListener('click', () => {
      state.photos.forEach((photo) => { photo.hallmark = photo.id === Number(button.dataset.mark); });
      state.error = ''; invalidatePhotos(); render();
    }));
    document.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => {
      state.photos = state.photos.filter((photo) => photo.id !== Number(button.dataset.remove));
      invalidatePhotos(); state.error = ''; render();
    }));
  } else {
    bindReview();
    alignRepairFields();
    refreshPrices();
    refreshEstimate();
  }
  revealAppErrors();
}

function captureScreen() {
  const ready = state.items.every(captureReady);
  const locked = state.busy || state.processing;
  if (state.busy) return `<section class="card analysis" aria-busy="true"><h1>Checking item ${state.active+1} of ${state.items.length}</h1><p role="status">Each item is analyzed separately. Completed items stay saved here while the others are checked.</p><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></section>${photoStrip(false)}`;
  return `<section class="intro"><h1>Accurate repairs.<br>Satisfied clients.</h1><p>Upload images of the item and Mended will handle the rest for you</p></section>
    ${state.customer ? `<p class="notice">Next piece for ${escape(state.customer.name)} <button id="capture-clear-customer" type="button" class="text-button">Change customer</button></p>` : ''}
    ${itemNavigation()}<section class="card capture"><h2>Photograph item ${state.active+1}</h2><p>Take at least three images: the whole piece, a hallmark close-up, and another angle.</p>
      <div class="capture-tray"><button id="take-photo" type="button" class="camera" aria-label="Take photo" ${locked || state.photos.length >= MAX_PHOTOS ? 'disabled' : ''}><span class="camera-placeholder">${cameraIcon}<span class="camera-guidance">Keep the piece in focus<br>and use good light.</span><span class="camera-guidance">Click here to begin intake</span></span></button></div>
      <input id="camera-file" type="file" accept="image/*" capture="environment" hidden ${locked || state.photos.length >= MAX_PHOTOS ? 'disabled' : ''} />
      <label class="upload${locked || state.photos.length >= MAX_PHOTOS ? ' disabled' : ''}">Or Upload Images<input id="files" aria-label="Or Upload Images" type="file" accept="image/*" multiple ${locked || state.photos.length >= MAX_PHOTOS ? 'disabled' : ''} /></label>
      <p class="helper">${state.processing ? 'Preparing photos…' : 'Photos are resized on your phone before analysis.'}</p>
    </section>
    <section class="photo-section"><div class="section-heading"><h2>Your photos</h2><span>${state.photos.length} / ${MAX_PHOTOS}</span></div>
      ${state.photos.length ? photoStrip(!locked) : '<p class="empty">Your captured photos will appear here.</p>'}
      <p class="helper">${state.photos.length < 3 ? `${3 - state.photos.length} more photo${3 - state.photos.length === 1 ? '' : 's'} needed. ` : ''}${state.photos.some((photo) => photo.hallmark) ? 'Hallmark photo selected. An unreadable mark is okay.' : 'Mark one photo as the hallmark close-up.'}</p>
    </section>
    <footer class="actions"><button id="analyze" class="primary" ${!ready || locked ? 'disabled' : ''}>Get estimate</button><button id="add-item" class="secondary" ${!captureReady(state.items[state.active]) || locked ? 'disabled' : ''}>Add another item</button></footer>`;
}

function resizedImage(source, width, height) {
  if (!width || !height) throw new Error('Photo is not ready. Please try again.');
  const scale = Math.min(1, 1024 / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
  const context = canvas.getContext('2d');
  context.fillStyle = '#FFFFFF'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  let quality = 0.85;
  let data = canvas.toDataURL('image/jpeg', quality);
  while (data.length > 350000 && quality > 0.3) { quality -= 0.1; data = canvas.toDataURL('image/jpeg', quality); }
  if (data.length > 350000) throw new Error('This photo is too large. Try a different photo.');
  return { id: ++photoId, data, hallmark: false };
}

async function importFiles(event) {
  if (state.busy || state.processing || state.photos.length >= MAX_PHOTOS) return;
  const files = [...event.target.files];
  if (!files.length) return;
  const room = MAX_PHOTOS - state.photos.length;
  state.processing = true; state.error = ''; render();
  for (const file of files.slice(0, room)) {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url; await image.decode();
      state.photos.push(resizedImage(image, image.naturalWidth, image.naturalHeight));
      invalidatePhotos();
    } catch {
      state.error = 'One photo could not be opened. Try a JPEG or take another photo.';
    } finally { URL.revokeObjectURL(url); }
  }
  if (files.length > room) state.error = `You can use up to ${MAX_PHOTOS} photos of one piece.`;
  state.processing = false; render();
}

function invalidatePhotos() {
  state.repairPhotosChanged = Boolean(state.details);
  state.confirmed = false;
  state.repairs.forEach((repair) => { if (repair.source === 'manual') repair.photo = 0; });
}

async function analyzeRepairs() {
  state.repairBusy = true; state.repairError = ''; render();
  try {
    const result = await client.action(api.itemAnalysis.analyzeRepairs, { photos: state.photos.map(({ data, hallmark }) => ({ data, hallmark })) });
    state.assessment = result.assessment;
    state.repairError = result.status === 'error' ? result.message : '';
    state.repairs = mergeRepairSuggestions(state.repairs,result.repairs.map(repair=>({...repair,id:++repairId,source:'ai'})));
    if(state.repairs.length) state.assessment='visible_damage';
    state.repairPhotosChanged = false;
  } catch { state.repairError = BUSY_MESSAGE; state.assessment = 'unclear'; state.repairs = state.repairs.filter((repair) => repair.source === 'manual'); }
  state.repairBusy = false; render();
}

async function analyze() {
 if(state.busy || state.processing || !state.items.every(captureReady))return;
 state.busy=true;state.error='';
 for(let index=0;index<state.items.length;index++){
  state.active=index;const item=state.items[index];render();
  try{
   if(!item.details || item.analysisError){const result=await client.action(api.itemAnalysis.analyze,{photos:item.photos.map(({data,hallmark})=>({data,hallmark}))});
    if(result.status!=='success'){item.analysisError=result.message;continue;}item.details=result.details;item.analysisError='';}
   if(!item.assessment || item.repairPhotosChanged)await analyzeRepairs();
   item.estimate=await client.query(api.estimates.calculate,estimateArgs());
  }catch{item.analysisError=BUSY_MESSAGE;}
 }
 state.busy=false;state.active=Math.max(0,state.items.findIndex(item=>item.analysisError || !item.estimate?.complete));state.screen='review';state.reviewCollapsed=false;window.scrollTo(0,0);render();
}
function manualDetails(){return {itemType:'Unknown',metals:[{metal:'Unknown',purity:'Unknown',hallmark:''}],stones:['Unknown']};}
function itemNavigation(){return `<nav class="item-navigation" aria-label="Items">${state.items.map((item,index)=>`<button type="button" class="${index===state.active?'selected':''}" data-open-item="${index}" ${state.busy || state.processing || state.repairBusy?'disabled':''}>Item ${index+1}</button>`).join('')}</nav><div class="section-heading"><p class="helper">Photos belong only to this item.</p>${state.items.length > 1 ? `<button type="button" class="text-button danger" data-delete-item="${state.active}" ${state.busy || state.processing || state.repairBusy?'disabled':''}>Remove item</button>` : ''}</div>`;}
function grandTotal(){const estimate=combinedEstimate(state.items);return `<p class="estimate-total">Combined estimate · ${state.items.length} item${state.items.length===1?'':'s'}<strong>${estimate.complete?usd(estimate.total):'Review all items'}</strong></p>`;}
function accordionHeader(item,index){return `<button type="button" class="item-accordion-heading" data-open-item="${index}" aria-expanded="${index===state.active && !state.reviewCollapsed}" ${state.repairBusy || state.processing?'disabled':''}>${item.photos[0]?`<img src="${item.photos[0].data}" alt="" />`:''}<span>Item ${index+1} · ${escape(item.details?.itemType ?? 'Needs review')}<small>${item.analysisError?'Needs review':item.estimate?.complete?usd(item.estimate.total):'Complete this estimate'}</small></span><span aria-hidden="true">${index===state.active && !state.reviewCollapsed?'−':'+'}</span></button>`;}
// Grow both boxes together so a longer damage description stays readable.
function alignRepairFields() {
  document.querySelectorAll('.repair-fields').forEach(row => {
    const damage = row.querySelector('textarea');
    const search = row.querySelector('input');
    damage.style.height = '48px';
    const height = Math.max(48, damage.scrollHeight + 2);
    damage.style.height = `${height}px`;
    search.style.height = `${height}px`;
  });
}
window.addEventListener('resize', () => { if (state.screen === 'review') alignRepairFields(); });

function priceText(repair) {
  if (!repair.serviceCode) return 'Select a service to see its price.';
  if (!repair.price) return repair.priceError || 'Fetching catalog price…';
  if (repair.price.amount === null) {
    if (repair.price.availability === 'select_metals') return 'Select the metal(s) being repaired to see the price.';
    if (repair.price.availability === 'not_offered') return `This service is not offered for ${escape(repair.price.basis)} in the catalog. Enter a price only if the repair can be performed.`;
    return 'No catalog price for this metal and purity. Enter the confirmed price.';
  }
  return `Catalog: ${usd(repair.price.amount)} · ${escape(repair.price.basis)} · ${escape(repair.price.unit)}. ${repair.override != null ? 'Associate price entered.' : 'Typical base price.'}${(repair.metalIndexes?.length ?? 0) > 1 ? ' 80% of the summed metal prices.' : ''}`;
}

function estimateArgs(item=state.items[state.active]) {
  return {
    metals: item.details.metals.map(({metal,purity})=>({metal,purity})),
    repairs: item.repairs.map(repair=>({serviceCode:repair.serviceCode,metalIndexes:item.details.metals.length === 1 ? [0] : (repair.metalIndexes ?? []),override:repair.override ?? null,extra:repair.extra ?? 0})),
    rush:item.rush,rhodium:item.rhodium,
  };
}

function estimateSummary() {
  if (state.estimatePending) return '<p role="status">Recalculating estimate…</p>';
  if (state.estimateError) return `<p class="attention" role="alert">${escape(state.estimateError)}</p>`;
  const estimate=state.estimate;
  if (!estimate) return '<p role="status">Add services to build the estimate.</p>';
  return `<div class="estimate-breakdown"><span>Services and additional fees</span><strong>${usd(estimate.subtotal)}</strong><span>Catalog fees</span><strong>${usd(estimate.fees)}</strong></div>
    <p class="estimate-total">Total estimate<strong>${estimate.complete ? usd(estimate.total) : 'Price needed'}</strong></p>
    <p class="helper" role="status">${estimate.complete ? 'USD · Review every price before confirming.' : estimate.lines.length ? 'Choose a service and enter any missing price to complete the total. The amounts above include priced services only.' : 'Add a repair service to create an estimate.'}</p>`;
}

function updateEstimateSummary() {
  const target=document.querySelector('#estimate-summary');
  if (target) target.innerHTML=estimateSummary();
  revealAppErrors();
  const combined=document.querySelector("#combined-total");if(combined)combined.innerHTML=grandTotal();
  document.querySelectorAll(".item-accordion-heading small").forEach((el,index)=>{const item=state.items[index];el.textContent=item.analysisError?"Needs review":item.estimate?.complete?usd(item.estimate.total):"Complete this estimate";});
}

function refreshEstimate() {
 const item=state.items[state.active];clearTimeout(item.estimateTimer);const version=(item.estimateVersion ?? 0)+1;item.estimateVersion=version;
 const args=estimateArgs(item);item.estimate=null;item.estimateError='';item.estimatePending=true;updateEstimateSummary();
 item.estimateTimer=setTimeout(async()=>{
  try{const result=await client.query(api.estimates.calculate,args);if(item.estimateVersion!==version)return;item.estimate=result;
   if(!item.dueEdited && item.repairs.length && item.repairs.every(repair=>repair.serviceCode))item.dueDate=suggestedDueDate(todayDate(),item.repairs.map(repair=>repair.serviceCode));
  }catch{if(item.estimateVersion!==version)return;item.estimateError='Check your prices and fees. Use positive USD amounts or zero, with up to two decimal places.';}
  item.estimatePending=false;if(state.screen==='review'){if(state.items[state.active]===item){const due=document.querySelector('#item-due');if(due)due.value=item.dueDate;}updateEstimateSummary();}
 },150);
}

function estimateCard() {
  const eligible=state.details.metals.some(({metal,purity})=>metal==='White gold' && ['14K / 585','18K / 750'].includes(purity));
  return `<section class="card estimate"><h2>Estimate</h2>
    <label class="fee-choice"><input id="rush-fee" type="checkbox" ${state.rush ? 'checked' : ''} />Rush job · +$50.00</label>
    <label class="fee-choice"><input id="rhodium-fee" type="checkbox" ${state.rhodium ? 'checked' : ''} ${eligible ? '' : 'disabled'} />Re-rhodium after bench work · +$10.00</label>
    <p class="helper">Re-rhodium fee applies to confirmed 14K or 18K white gold. Select fees only when needed. Enter other charges under the relevant service.</p>
    <label class="field">Item due date<input id="item-due" type="date" min="${todayDate()}" value="${state.dueDate}" /></label><p class="helper">Each item has its own due date. Adjust for your bench schedule.</p><div id="estimate-summary" aria-live="polite">${estimateSummary()}</div>
  </section>`;
}

function refreshPrices() {
  const item=state.items[state.active];
  const eligible=state.details.metals.some(({metal,purity})=>metal==='White gold' && ['14K / 585','18K / 750'].includes(purity));
  if (!eligible) state.rhodium=false;
  const rhodium=document.querySelector('#rhodium-fee');
  if (rhodium) { rhodium.disabled=!eligible; rhodium.checked=state.rhodium; }
  const metals = state.details.metals.map(({ metal, purity }) => ({ metal, purity }));
  for (const repair of state.repairs) {
    if (!repair.serviceCode) continue;
    const key = JSON.stringify([repair.serviceCode, metals, repair.metalIndexes ?? []]);
    if (repair.priceKey === key) continue;
    repair.priceKey = key; repair.price = null; repair.priceError = '';
    const update = () => {
      if(state.items[state.active]!==item || state.screen!=="review")return;
      const output = document.querySelector(`[data-price="${repair.id}"]`);
      if (output) { output.innerHTML = priceText(repair); if(repair.priceError) output.setAttribute('role','alert'); else output.setAttribute('role','status'); }
      revealAppErrors();
      const amount=document.querySelector(`[data-amount="${repair.id}"]`);
      if (amount && repair.override == null) amount.value=repair.price?.amount ?? '';
      refreshEstimate();
    };
    update();
    client.query(api.repairPrices.get, { serviceCode: repair.serviceCode, metals, metalIndexes:repair.metalIndexes ?? [] }).then(price => {
      if (repair.priceKey !== key) return;
      repair.price = price; update();
    }).catch(() => {
      if (repair.priceKey !== key) return;
      repair.priceKey = null; repair.priceError = 'Price unavailable. Try selecting the service again.'; update();
    });
  }
  refreshEstimate();
}

function servicesCard() {
  const message = state.repairError || (state.assessment === 'none_visible'
    ? 'No damage is visible in these photos. Check the piece and add anything the photos missed.'
    : state.assessment === 'unclear' ? 'Damage could not be identified confidently. Enter it manually, or add an optional close-up.'
    : 'Review each damage and repair service. Add anything missed, and remove suggestions you cannot confirm.');
  return `<section class="card services" aria-busy="${state.repairBusy}">
    <div class="section-heading"><h2>Services</h2><button type="button" id="add-service" class="text-button" ${state.repairBusy || state.repairs.length >= 12 ? 'disabled' : ''}>Add service</button></div>
    ${state.repairBusy ? '<p class="helper" role="status">Checking the photos for visible damage…</p><div class="skeleton"></div>' : `
    <p class="helper${state.repairError || state.assessment === 'unclear' ? ' attention' : ''}" role="${state.repairError ? 'alert' : 'status'}">${escape(message)}</p>
    ${state.repairError ? '<button type="button" id="retry-damage" class="text-button">Retry damage analysis for this item</button>' : ''}<div class="repair-list">${state.repairs.map((repair, index) => `<div class="repair-row">
      <div class="section-heading"><h3>Repair service ${index + 1}</h3><button type="button" class="text-button service-remove" data-remove-repair="${repair.id}" aria-label="Remove repair service ${index + 1}">Remove</button></div>
      <div class="repair-fields"><label class="field">Damage<textarea form="item-form" id="damage-${repair.id}" data-damage="${repair.id}" maxlength="160" rows="1" required placeholder="Describe the damage">${escape(repair.damage)}</textarea></label>
      <div class="service-picker" data-picker="${repair.id}"><label class="field" for="service-${repair.id}">Repair service</label><input id="service-${repair.id}" type="search" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="service-options-${repair.id}" autocomplete="off" placeholder="Search services" />
      <div id="service-options-${repair.id}" class="service-options" role="listbox" aria-label="Repair services" hidden></div>
      <p class="selected-service ${repair.serviceCode ? 'is-selected' : ''}">${repair.serviceCode ? escape(REPAIR_SERVICES.find(service => service.code === repair.serviceCode)?.name || '') : 'Choose a service from the list.'}</p></div></div>
      ${!repair.serviceCode ? `<div class="quick-services" aria-label="Suggested catalog choices">${suggestServices(repair.damage,state.details.itemType).map(service=>`<button type="button" class="quick-service" data-quick-service="${repair.id}" data-code="${service.code}">${escape(service.name)}<small>${service.code}</small></button>`).join('')}</div>` : ''}
      ${state.details.metals.length > 1 ? `<fieldset class="service-metals"><legend>Metal(s) being repaired</legend><button type="button" class="text-button" data-all-metals="${repair.id}">All metals</button><div class="stones">${state.details.metals.map((metal,metalIndex)=>`<label class="metal-choice"><input type="checkbox" data-repair-metal="${repair.id}" value="${metalIndex}" ${(repair.metalIndexes ?? []).includes(metalIndex) ? 'checked' : ''} />${escape(metal.metal)} · ${escape(metal.purity)}</label>`).join('')}</div><p class="helper">Choose one or more. Multiple metals use 80% of the sum of their service prices.</p>${state.repairs.length > 1 && repair.metalIndexes?.length ? `<button type="button" class="text-button" data-apply-metals="${repair.id}">Apply these metals to all services</button>` : ''}</fieldset>` : ''}
      <div class="price-fields">
        <label class="field">Service price (USD)<input type="number" inputmode="decimal" min="0" max="1000000" step="0.01" data-amount="${repair.id}" aria-label="Service price ${index+1} (USD)" value="${repair.override ?? repair.price?.amount ?? ''}" placeholder="Enter price" ${repair.serviceCode ? '' : 'disabled'} /></label>
        <label class="field">Additional fee (USD)<input type="number" inputmode="decimal" min="0" max="1000000" step="0.01" data-extra="${repair.id}" aria-label="Additional fee ${index+1} (USD)" value="${repair.extra ?? 0}" /></label>
      </div>
      <button type="button" class="text-button catalog-reset" data-reset-price="${repair.id}" ${repair.override == null ? 'hidden' : ''}>Use catalog price</button>
      <p class="service-price" data-price="${repair.id}" role="${repair.priceError ? 'alert' : 'status'}">${priceText(repair)}</p>
      <p class="helper">${repair.photo ? `Suggested from photo ${repair.photo}. Check against the piece.` : 'Entered by the associate.'}</p>
    </div>`).join('')}</div>
    <button type="button" id="close-up" class="text-button" ${state.processing || state.photos.length >= MAX_PHOTOS ? 'disabled' : ''}>Add optional close-up</button><input id="close-up-file" type="file" accept="image/*" capture="environment" hidden />`}
  </section>`;
}

function itemReviewScreen() {
  if(!state.details)state.details=manualDetails();
  const details = state.details;
  const expanded=state.itemDetailsOpen ?? (details.itemType==='Unknown' || details.metals.some(metal=>metal.metal==='Unknown' || metal.purity==='Unknown') || details.stones.includes('Unknown'));
  return `${state.analysisError?`<p class="notice error" role="alert">${escape(state.analysisError)}</p><button type="button" id="retry-item" class="text-button">Retry this item</button><p class="helper">Or enter this item’s details and services below.</p>`:''}${itemNavigation()}
    <form id="item-form" class="card details" novalidate>
      <div class="section-heading"><h2>Item information</h2><button type="button" id="toggle-item-details" class="text-button" aria-expanded="${expanded}" aria-controls="item-edit-fields">${expanded ? 'Close details' : 'Edit details'}</button></div>
      <div class="item-summary" ${expanded ? 'hidden' : ''}><p>${escape(details.itemType)}</p><p>${details.metals.map(metal=>`${escape(metal.metal)} · ${escape(metal.purity)}`).join('<br>')}</p><p class="helper">Stones: ${details.stones.map(escape).join(', ')}</p><p class="helper">Check these details against the piece.</p></div>
      <div id="item-edit-fields" ${expanded ? '' : 'hidden'}><div class="section-heading">${details.metals.length < 3 ? '<button type="button" id="add-metal" class="text-button">Add metal</button>' : ''}</div><div class="item-fields"><label class="field">Item type<select id="item-type">${options(ITEM_TYPES, details.itemType)}</select></label>
      ${details.metals.map((metal, index) => `<div class="metal-group"><label class="field">Metal${details.metals.length > 1 ? ` ${index + 1}` : ''}<select data-metal="${index}">${options(METALS, metal.metal)}</select></label>
        <label class="field">Purity<select data-purity="${index}">${options(PURITIES, metal.purity)}</select></label>
        <p class="helper${metal.purity === 'Unknown' ? ' attention' : ''}">${metal.hallmark ? `Hallmark read: ${escape(metal.hallmark)}. ` : 'No readable hallmark. '}${metal.purity === 'Unknown' ? 'Select purity only if you can confirm it, or leave Unknown.' : 'Check the purity against the piece.'}</p>
        ${details.metals.length > 1 ? `<button type="button" class="text-button" data-remove-metal="${index}">Remove metal ${index + 1}</button>` : ''}</div>`).join('')}</div>
      <fieldset><legend>Stones</legend><p class="helper">Select all that you can confirm. Appearance alone may not identify a stone.</p><div class="stones">${STONES.map((stone) => `<label class="stone"><input type="checkbox" value="${escape(stone)}" ${details.stones.includes(stone) ? 'checked' : ''} />${escape(stone)}</label>`).join('')}</div></fieldset>
      <p class="helper">Unknown is okay. These are photo-based suggestions, ready for your check.</p></div>
    </form>
    ${servicesCard()}
    ${estimateCard()}
    <section class="photo-section"><div class="section-heading"><h2>Captured images</h2><button id="back" class="text-button">Review photos</button></div>${photoStrip(false)}</section>
    `;
}
function reviewScreen(){return `<section class="intro"><h1>Review Estimate</h1><p>Review each item before confirming the combined ticket.</p></section>${customerCard(state)}${state.items.map((item,index)=>`<section class="item-accordion">${accordionHeader(item,index)}${index===state.active?`<div class="item-accordion-body" ${state.reviewCollapsed ? 'hidden' : ''}>${itemReviewScreen()}</div>`:''}</section>`).join('')}<section id="combined-total" class="card">${grandTotal()}</section><footer class="actions"><button type="submit" form="item-form" class="primary" ${state.repairBusy?'disabled':''}>Confirm estimate</button></footer>`;
}

function bindReview() {
  document.querySelector('#retry-damage')?.addEventListener('click',analyzeRepairs);
  document.querySelector('#item-due').addEventListener('change',event=>{state.dueDate=event.target.value;state.dueEdited=true;state.ticketRequestId=null;});
  document.querySelector('#retry-item')?.addEventListener('click',async()=>{state.busy=true;app.inert=true;const item=state.items[state.active];try{const result=await client.action(api.itemAnalysis.analyze,{photos:item.photos.map(({data,hallmark})=>({data,hallmark}))});if(result.status==='success'){item.details=result.details;item.analysisError='';await analyzeRepairs();}else item.analysisError=result.message;}catch{item.analysisError=BUSY_MESSAGE;}finally{state.busy=false;app.inert=false;render();}});

  const markChanged = () => {
    state.confirmed = false;
    state.ticketRequestId = null;
    const notice = document.querySelector('.notice.success'); notice?.remove();
    const footer = document.querySelector('.actions');
    footer.innerHTML = `<button type="submit" form="item-form" class="primary" ${state.repairBusy ? 'disabled' : ''}>Confirm estimate</button>`;
  };
  document.querySelector('#toggle-item-details').addEventListener('click',()=>{state.itemDetailsOpen=!(document.querySelector('#toggle-item-details').getAttribute('aria-expanded')==='true');render();});
  bindCustomer({ state, searchCustomers: text => client.query(api.customers.search, { text }), markChanged, render });
  document.querySelector('#item-type').addEventListener('change', (event) => { state.details.itemType = event.target.value; markChanged(); render(); });
  document.querySelectorAll('[data-metal]').forEach((select) => select.addEventListener('change', () => {
    state.details.metals[Number(select.dataset.metal)].metal = select.value;
    state.details.metals[Number(select.dataset.metal)].purity = 'Unknown';
    state.repairs.forEach(repair=>{repair.override=null;});
    state.confirmed = false; render();
  }));
  document.querySelectorAll('[data-purity]').forEach((select) => select.addEventListener('change', () => { state.details.metals[Number(select.dataset.purity)].purity = select.value; state.repairs.forEach(repair=>{repair.override=null;}); markChanged(); render(); }));
  document.querySelector('#add-metal')?.addEventListener('click', () => { state.details.metals.push({ metal: 'Unknown', purity: 'Unknown', hallmark: '' }); state.repairs.forEach(repair=>{repair.metalIndexes=[];repair.override=null;}); state.confirmed = false; render(); });
  document.querySelectorAll('[data-remove-metal]').forEach((button) => button.addEventListener('click', () => { const removed=Number(button.dataset.removeMetal);
    state.details.metals.splice(removed, 1);
    state.repairs.forEach(repair=>{repair.metalIndexes=(repair.metalIndexes ?? []).filter(index=>index!==removed).map(index=>index>removed?index-1:index);repair.override=null;}); state.confirmed = false; render(); }));
  document.querySelectorAll('.stone input').forEach((input) => input.addEventListener('change', () => {
    let selected = new Set(state.details.stones);
    if (input.checked) {
      if (['Unknown', 'None visible'].includes(input.value)) selected = new Set([input.value]);
      else { selected.delete('Unknown'); selected.delete('None visible'); selected.add(input.value); }
    } else selected.delete(input.value);
    state.details.stones = selected.size ? [...selected] : ['Unknown'];
    document.querySelectorAll('.stone input').forEach((checkbox) => { checkbox.checked = state.details.stones.includes(checkbox.value); });
    markChanged();
  }));
  document.querySelector('#add-service')?.addEventListener('click', () => {
    state.repairs.push({ id: ++repairId, source: 'manual', damage: '', serviceCode: '', photo: 0 });
    state.confirmed = false; render();
    document.querySelector(`[data-damage="${repairId}"]`)?.focus();
  });
  document.querySelectorAll('[data-repair-metal]').forEach(input=>input.addEventListener('change',()=>{
    const repair=state.repairs.find(entry=>entry.id===Number(input.dataset.repairMetal));
    const selected=new Set(repair.metalIndexes ?? []);
    if(input.checked) selected.add(Number(input.value)); else selected.delete(Number(input.value));
    repair.metalIndexes=[...selected].sort((a,b)=>a-b);repair.override=null;repair.source='manual';
    document.querySelector(`[data-reset-price="${repair.id}"]`).hidden=true;
    markChanged();render();
  }));
  document.querySelectorAll('[data-all-metals], [data-apply-metals]').forEach(button=>button.addEventListener('click',()=>{
    const repair=state.repairs.find(entry=>entry.id===Number(button.dataset.allMetals || button.dataset.applyMetals));
    const indexes=button.dataset.allMetals ? state.details.metals.map((_,index)=>index) : repair.metalIndexes;
    const targets=button.dataset.allMetals ? [repair] : state.repairs;
    targets.forEach(entry=>{entry.metalIndexes=[...indexes];entry.override=null;entry.source='manual';});
    markChanged();render();
  }));
  document.querySelectorAll('[data-quick-service]').forEach(button=>button.addEventListener('click',()=>{
    const repair=state.repairs.find(entry=>entry.id===Number(button.dataset.quickService));
    repair.serviceCode=button.dataset.code;repair.override=null;repair.source='manual';markChanged();render();
  }));
  document.querySelectorAll('[data-damage]').forEach((input) => input.addEventListener('input', () => {
    const id = Number(input.dataset.damage);
    const repair = state.repairs.find((entry) => entry.id === id);
    repair.damage = input.value;
    repair.source = 'manual';
    alignRepairFields(); markChanged();
    if(!repair.serviceCode){const choices=document.querySelector(`[data-picker="${repair.id}"]`).closest('.repair-row').querySelector('.quick-services');if(choices){choices.innerHTML=suggestServices(repair.damage,state.details.itemType).map(service=>`<button type="button" class="quick-service" data-code="${service.code}">${escape(service.name)}<small>${service.code}</small></button>`).join('');choices.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{repair.serviceCode=button.dataset.code;repair.override=null;repair.source='manual';markChanged();render();}));}}
  }));
  document.querySelectorAll('[data-picker]').forEach((picker) => {
    const repair = state.repairs.find(entry => entry.id === Number(picker.dataset.picker));
    const input = picker.querySelector('input');
    const list = picker.querySelector('[role="listbox"]');
    let matches = [];
    let active = -1;
    function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); }
    function select(service) {
      repair.serviceCode = service.code; repair.source = 'manual'; repair.override=null; repair.extra=0;
      const amount=document.querySelector(`[data-amount="${repair.id}"]`); if(amount) amount.disabled=false;
      const extra=document.querySelector(`[data-extra="${repair.id}"]`); if(extra) extra.value=0;
      document.querySelector(`[data-reset-price="${repair.id}"]`).hidden=true;
      const selectedService = picker.querySelector('.selected-service');
      selectedService.textContent = service.name;
      selectedService.classList.add('is-selected');
      picker.closest('.repair-row').querySelector('.quick-services')?.remove();
      input.value = ''; close(); markChanged(); refreshPrices();
    }
    function show() {
      matches = searchServices(input.value).slice(0, 10); active = -1;
      list.innerHTML = matches.length ? matches.map(service => `<button type="button" role="option" id="option-${repair.id}-${service.code}" aria-selected="false" data-code="${service.code}"><span>${escape(service.name)}</span><small>${escape(service.category)} · ${service.code}</small></button>`).join('') : '<p class="helper">No matching service. Try another word.</p>';
      list.style.top = `${input.offsetTop + input.offsetHeight + 8}px`;
      list.hidden = false; input.setAttribute('aria-expanded', 'true'); input.removeAttribute('aria-activedescendant');
      list.querySelectorAll('[data-code]').forEach(button => {
        button.addEventListener('mousedown', event => event.preventDefault());
        button.addEventListener('click', () => select(matches.find(service => service.code === button.dataset.code)));
      });
    }
    input.addEventListener('focus', show);
    input.addEventListener('input', show);
    picker.addEventListener('focusout', event => { if (!picker.contains(event.relatedTarget)) close(); });
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault(); if (list.hidden) show();
        if (!matches.length) return;
        active = active < 0 ? (event.key === 'ArrowDown' ? 0 : matches.length - 1) : (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
        list.querySelectorAll('[role="option"]').forEach((option, index) => option.setAttribute('aria-selected', String(index === active)));
        const option = list.querySelectorAll('[role="option"]')[active];
        input.setAttribute('aria-activedescendant', option.id); option.scrollIntoView({ block: 'nearest' });
      }
      if (event.key === 'Enter') {
        event.preventDefault(); if (active >= 0 && !list.hidden) select(matches[active]);
      }
    });
  });
  document.querySelectorAll('[data-remove-repair]').forEach((button) => button.addEventListener('click', () => {
    state.repairs = state.repairs.filter((repair) => repair.id !== Number(button.dataset.removeRepair));
    state.confirmed = false; render();
  }));
  document.querySelector('#close-up')?.addEventListener('click',()=>document.querySelector('#close-up-file').click());
  document.querySelector('#close-up-file')?.addEventListener('change',async event=>{
    const previous=state.photos.length;
    await importFiles(event);
    if(state.photos.length>previous) await analyzeRepairs();
  });
  document.querySelectorAll('[data-amount], [data-extra]').forEach(input=>input.addEventListener('input',()=>{
    const repair=state.repairs.find(entry=>entry.id===Number(input.dataset.amount || input.dataset.extra));
    if (input.dataset.amount) repair.override=input.value==='' ? NaN : Number(input.value);
    else repair.extra=input.value==='' ? NaN : Number(input.value);
    repair.source='manual';
    document.querySelector(`[data-reset-price="${repair.id}"]`).hidden=repair.override==null;
    document.querySelector(`[data-price="${repair.id}"]`).innerHTML=priceText(repair);
    markChanged(); refreshEstimate();
  }));
  document.querySelectorAll('[data-reset-price]').forEach(button=>button.addEventListener('click',()=>{
    const repair=state.repairs.find(entry=>entry.id===Number(button.dataset.resetPrice));
    repair.override=null; state.confirmed=false; render();
  }));
  document.querySelector('#rush-fee').addEventListener('change',event=>{state.rush=event.target.checked;markChanged();refreshEstimate();});
  document.querySelector('#rhodium-fee').addEventListener('change',event=>{state.rhodium=event.target.checked;markChanged();refreshEstimate();});
  document.querySelector('#item-form').addEventListener('submit',async event=>{
   event.preventDefault();if(state.repairBusy)return;
   if(!state.customer){state.error='Search and select a customer before creating the repair ticket.';render();revealError(document.querySelector('.notice.error'));return;}
   state.items.forEach(item=>{clearTimeout(item.estimateTimer);item.estimateVersion=(item.estimateVersion ?? 0)+1;item.estimatePending=false;});app.inert=true;const button=document.querySelector('.actions .primary');button.textContent='Checking every item…';button.disabled=true;
   try{
    const issuedDate=todayDate();
    for(let index=0;index<state.items.length;index++){
     const item=state.items[index];state.active=index;
     if(!captureReady(item) || !item.details)throw new Error(`Review photos and details for item ${index+1}.`);
     const reviewed=await client.action(api.itemAnalysis.reviewRepairs,{photoCount:item.photos.length,repairs:item.repairs.map(({damage,serviceCode,photo})=>({damage,serviceCode,photo}))});
     if(!reviewed.ok)throw new Error(`Item ${index+1}: ${reviewed.message}`);
     item.estimate=await client.query(api.estimates.calculate,estimateArgs(item));if(!item.estimate.complete)throw new Error(`Complete the prices for item ${index+1}.`);
     if(!item.dueEdited)item.dueDate=suggestedDueDate(issuedDate,item.repairs.map(repair=>repair.serviceCode));validateDueDate(item.dueDate,issuedDate);
    }
    const snapshot=JSON.stringify(state.items.map(item=>[item.details,item.photos,item.repairs.map(({damage,serviceCode,photo,metalIndexes,override,extra})=>({damage,serviceCode,photo,metalIndexes,override,extra})),item.rush,item.rhodium,item.dueDate]).concat([state.customer.id,issuedDate]));
    if(state.ticketRequestSignature!==snapshot || !state.ticketRequestId){state.ticketRequestId=crypto.randomUUID();state.ticketRequestSignature=snapshot;}
    const id=await client.mutation(api.combinedTickets.begin,{requestId:state.ticketRequestId,customerId:state.customer.id,expected:state.items.length,issuedDate});
    for(let position=0;position<state.items.length;position++){
     button.textContent=`Saving item ${position+1} of ${state.items.length}…`;const item=state.items[position],amounts=estimateArgs(item);
     await client.action(api.combinedTickets.addItem,{id,position,details:item.details,photos:item.photos.map(({data,hallmark})=>({data,hallmark})),repairs:item.repairs.map((repair,index)=>({damage:repair.damage,serviceCode:repair.serviceCode,photo:repair.photo,...amounts.repairs[index]})),rush:item.rush,rhodium:item.rhodium,dueDate:item.dueDate});
    }
    await client.mutation(api.combinedTickets.finish,{id});state.ticket=await loadTicket(id);state.screen='ticket';state.confirmed=true;state.error='';
   }catch(error){state.reviewCollapsed=false;state.error=error.message || 'Could not save the intake. Check your connection and try again.';}
   finally{app.inert=false;render();window.scrollTo(0,0);}
  });
  document.querySelector('#back').addEventListener('click', returnToPhotos);
  document.querySelector('#header-back')?.addEventListener('click', returnToPhotos);
  document.querySelector('#new-piece')?.addEventListener('click', startNewPiece);
}

const splash = document.querySelector('#splash');
startSplash(splash, () => {
  splash.hidden = true;
  app.hidden = false;
  render();
});
