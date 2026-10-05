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
const state = { screen: 'capture', photos: [], details: null, busy: false, processing: false, error: '', confirmed: false, repairs: [], assessment: null, repairError: '', repairBusy: false, repairPhotosChanged: false, estimate: null, estimateError: '', estimatePending: false, rush: false, rhodium: false };
let photoId = 0;
let repairId = 0;
let estimateRequest = 0;
let estimateTimer;
state.customer = null;
state.customerSearch = '';
state.ticket = null;
state.ticketRequestId = null;
state.ticketRequestSignature = null;

function startNewPiece() {
  state.ticket=null;state.ticketRequestId=null;state.ticketRequestSignature=null;state.customer=null;state.customerSearch='';state.rush=false;state.rhodium=false;state.estimate=null;
  state.photos=[];state.details=null;state.repairs=[];state.assessment=null;state.repairError='';state.repairPhotosChanged=false;state.screen='capture';state.confirmed=false;state.error='';
  render();window.scrollTo(0,0);
}
const usd = amount => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'}).format(amount);
const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const options = (values, selected) => values.map((value) => `<option${value === selected ? ' selected' : ''}>${escape(value)}</option>`).join('');
const cameraIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9V8a3 3 0 0 1 3-3h2l2-3h5l2 3h2a3 3 0 0 1 3 3v7M3 16v2a3 3 0 0 0 3 3h10"/><circle cx="12" cy="12" r="4"/><circle cx="21" cy="20" r="2.5" fill="currentColor" stroke="none"/></svg>';

function photoStrip(editable) {
  return `<div class="photos" aria-label="Captured photos">${state.photos.map((photo, index) => `<figure class="photo">
    <img src="${photo.data}" alt="Jewelry photo ${index + 1}${photo.hallmark ? ', hallmark close-up' : ''}" />
    <figcaption>Photo ${index + 1}${photo.hallmark ? ' · Hallmark' : ''}</figcaption>
    ${editable ? `<button class="text-button hallmark${photo.hallmark ? ' selected' : ''}" data-mark="${photo.id}" aria-pressed="${photo.hallmark}">${photo.hallmark ? 'Hallmark photo' : 'Mark as hallmark'}</button><button class="remove" data-remove="${photo.id}" aria-label="Remove photo ${index + 1}">Remove</button>` : ''}
  </figure>`).join('')}</div>`;
}

function render() {
  const reviewing = state.screen === 'review';
  if (state.screen === 'ticket') {
    app.innerHTML = `<header class="header"><img class="brand" src="${mendedLogo}" alt="Mended" width="171" height="32" /><span class="step">Repair ticket</span></header>${state.error?`<p class="notice error" role="alert">${escape(state.error)}</p>`:''}${ticketScreen(state.ticket)}`;
    bindTicket({state,render,startNew:startNewPiece,edit:()=>{state.screen='review';state.confirmed=false;state.ticketRequestId=null;state.error='';render();window.scrollTo(0,0);},save:async args=>{await client.mutation(api.tickets.sign,args);const ticket=await client.query(api.tickets.get,{id:args.id});if(!ticket)throw new Error('Ticket not found');return ticket;}});
    return;
  }
  app.innerHTML = `<header class="header"><img class="brand" src="${mendedLogo}" alt="Mended" width="171" height="32" /><span class="step">${reviewing ? 'Review estimate' : 'Repair intake'}</span></header>
    ${state.error ? `<p class="notice error" role="alert">${escape(state.error)}</p>` : ''}
    ${reviewing ? reviewScreen() : captureScreen()}`;
  if (!reviewing) {
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
}

function captureScreen() {
  const ready = state.photos.length >= 3 && state.photos.some((photo) => photo.hallmark);
  const locked = state.busy || state.processing;
  if (state.busy) return `<section class="card analysis" aria-busy="true"><h1>Identifying your piece</h1><p role="status">Checking the item, metals, hallmark, and stones. This may take a minute.</p><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></section>${photoStrip(false)}`;
  return `<section class="intro"><h1>Accurate repairs.<br>Satisfied clients.</h1><p>Upload images of the item and AI will handle the rest for you</p></section>
    <section class="card capture"><h2>Photograph one piece</h2><p>Take at least three images: the whole piece, a hallmark close-up, and another angle.</p>
      <button id="take-photo" type="button" class="camera" aria-label="Take photo" ${locked || state.photos.length >= MAX_PHOTOS ? 'disabled' : ''}><span class="camera-placeholder">${cameraIcon}<span class="camera-guidance">Keep the piece in focus<br>and use good light.</span><span class="camera-guidance">Click here to begin intake</span></span></button>
      <input id="camera-file" type="file" accept="image/*" capture="environment" hidden ${locked || state.photos.length >= MAX_PHOTOS ? 'disabled' : ''} />
      <label class="upload${locked || state.photos.length >= MAX_PHOTOS ? ' disabled' : ''}">Or Upload Images<input id="files" aria-label="Or Upload Images" type="file" accept="image/*" multiple ${locked || state.photos.length >= MAX_PHOTOS ? 'disabled' : ''} /></label>
      <p class="helper">${state.processing ? 'Preparing photos…' : 'Photos are resized on your phone before analysis.'}</p>
    </section>
    <section class="photo-section"><div class="section-heading"><h2>Your photos</h2><span>${state.photos.length} / ${MAX_PHOTOS}</span></div>
      ${state.photos.length ? photoStrip(!locked) : '<p class="empty">Your captured photos will appear here.</p>'}
      <p class="helper">${state.photos.length < 3 ? `${3 - state.photos.length} more photo${3 - state.photos.length === 1 ? '' : 's'} needed. ` : ''}${state.photos.some((photo) => photo.hallmark) ? 'Hallmark photo selected. An unreadable mark is okay.' : 'Mark one photo as the hallmark close-up.'}</p>
    </section>
    <footer class="actions"><button id="analyze" class="primary" ${!ready || locked ? 'disabled' : ''}>${state.details ? (state.repairPhotosChanged ? 'Review damage with new photos' : 'Return to review') : 'Identify item'}</button></footer>`;
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
    state.repairs = [...state.repairs.filter((repair) => repair.source === 'manual'), ...result.repairs.map((repair) => ({ ...repair, id: ++repairId, source: 'ai' }))];
    state.repairPhotosChanged = false;
  } catch { state.repairError = BUSY_MESSAGE; state.assessment = 'unclear'; state.repairs = state.repairs.filter((repair) => repair.source === 'manual'); }
  state.repairBusy = false; render();
}

async function analyze() {
  if (state.busy || state.processing || state.photos.length < 3 || !state.photos.some((photo) => photo.hallmark)) return;
  if (state.details) {
    state.screen = 'review'; render(); window.scrollTo(0, 0);
    if (state.repairPhotosChanged) await analyzeRepairs();
    return;
  }
  state.busy = true; state.error = ''; render();
  try {
    if (!client) throw new Error('Missing backend configuration');
    const result = await client.action(api.itemAnalysis.analyze, { photos: state.photos.map(({ data, hallmark }) => ({ data, hallmark })) });
    if (result.status !== 'success') { state.error = result.message; }
    else { state.details = result.details; state.screen = 'review'; state.confirmed = false; }
  } catch { state.error = BUSY_MESSAGE; }
  state.busy = false; render(); window.scrollTo(0, 0);
  if (state.details && !state.assessment) await analyzeRepairs();
}

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
    if (repair.price.availability === 'not_offered') return `This service is not offered for ${escape(repair.price.basis)} in the catalog. Enter a price only if the repair can be performed.`;
    return 'No catalog price for this metal and purity. Enter the confirmed price.';
  }
  return `Catalog: ${usd(repair.price.amount)} · ${escape(repair.price.basis)} · ${escape(repair.price.unit)}. ${repair.override != null ? 'Associate price entered.' : 'Typical base price.'}`;
}

function estimateArgs() {
  return {
    metals: state.details.metals.map(({metal,purity})=>({metal,purity})),
    repairs: state.repairs.map(repair=>({serviceCode:repair.serviceCode,override:repair.override ?? null,extra:repair.extra ?? 0})),
    rush:state.rush,rhodium:state.rhodium,
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
}

function refreshEstimate() {
  clearTimeout(estimateTimer);
  const request=++estimateRequest;
  state.estimate=null; state.estimateError=''; state.estimatePending=true;
  updateEstimateSummary();
  estimateTimer=setTimeout(async()=>{
    try {
      const result=await client.query(api.estimates.calculate,estimateArgs());
      if (request!==estimateRequest) return;
      state.estimate=result;
    } catch {
      if (request!==estimateRequest) return;
      state.estimateError='Check your prices and fees. Use positive USD amounts or zero, with up to two decimal places.';
    }
    state.estimatePending=false; updateEstimateSummary();
  },150);
}

function estimateCard() {
  const eligible=state.details.metals.some(({metal,purity})=>metal==='White gold' && ['14K / 585','18K / 750'].includes(purity));
  return `<section class="card estimate"><h2>Estimate</h2>
    <label class="fee-choice"><input id="rush-fee" type="checkbox" ${state.rush ? 'checked' : ''} />Rush job · +$50.00</label>
    <label class="fee-choice"><input id="rhodium-fee" type="checkbox" ${state.rhodium ? 'checked' : ''} ${eligible ? '' : 'disabled'} />Re-rhodium after bench work · +$10.00</label>
    <p class="helper">Re-rhodium fee applies to confirmed 14K or 18K white gold. Select fees only when needed. Enter other charges under the relevant service.</p>
    <div id="estimate-summary" aria-live="polite">${estimateSummary()}</div>
  </section>`;
}

function refreshPrices() {
  const eligible=state.details.metals.some(({metal,purity})=>metal==='White gold' && ['14K / 585','18K / 750'].includes(purity));
  if (!eligible) state.rhodium=false;
  const rhodium=document.querySelector('#rhodium-fee');
  if (rhodium) { rhodium.disabled=!eligible; rhodium.checked=state.rhodium; }
  const metals = state.details.metals.map(({ metal, purity }) => ({ metal, purity }));
  for (const repair of state.repairs) {
    if (!repair.serviceCode) continue;
    const key = JSON.stringify([repair.serviceCode, metals]);
    if (repair.priceKey === key) continue;
    repair.priceKey = key; repair.price = null; repair.priceError = '';
    const update = () => {
      const output = document.querySelector(`[data-price="${repair.id}"]`);
      if (output) output.innerHTML = priceText(repair);
      const amount=document.querySelector(`[data-amount="${repair.id}"]`);
      if (amount && repair.override == null) amount.value=repair.price?.amount ?? '';
      refreshEstimate();
    };
    update();
    client.query(api.repairPrices.get, { serviceCode: repair.serviceCode, metals }).then(price => {
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
    <p class="helper${state.repairError || state.assessment === 'unclear' ? ' attention' : ''}" role="status">${escape(message)}</p>
    <div class="repair-list">${state.repairs.map((repair, index) => `<div class="repair-row">
      <div class="section-heading"><h3>Repair service ${index + 1}</h3><button type="button" class="text-button remove" data-remove-repair="${repair.id}" aria-label="Remove repair service ${index + 1}">Remove</button></div>
      <div class="repair-fields"><label class="field">Damage<textarea form="item-form" id="damage-${repair.id}" data-damage="${repair.id}" maxlength="160" rows="1" required placeholder="Describe the damage">${escape(repair.damage)}</textarea></label>
      <div class="service-picker" data-picker="${repair.id}"><label class="field" for="service-${repair.id}">Repair service</label><input id="service-${repair.id}" type="search" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="service-options-${repair.id}" autocomplete="off" placeholder="Search services" />
      <div id="service-options-${repair.id}" class="service-options" role="listbox" aria-label="Repair services" hidden></div>
      <p class="selected-service">${repair.serviceCode ? escape(REPAIR_SERVICES.find(service => service.code === repair.serviceCode)?.name || '') : 'Choose a service from the list.'}</p></div></div>
      <div class="price-fields">
        <label class="field">Service price (USD)<input type="number" inputmode="decimal" min="0" max="1000000" step="0.01" data-amount="${repair.id}" aria-label="Service price ${index+1} (USD)" value="${repair.override ?? repair.price?.amount ?? ''}" placeholder="Enter price" ${repair.serviceCode ? '' : 'disabled'} /></label>
        <label class="field">Additional fee (USD)<input type="number" inputmode="decimal" min="0" max="1000000" step="0.01" data-extra="${repair.id}" aria-label="Additional fee ${index+1} (USD)" value="${repair.extra ?? 0}" /></label>
      </div>
      <button type="button" class="text-button catalog-reset" data-reset-price="${repair.id}" ${repair.override == null ? 'hidden' : ''}>Use catalog price</button>
      <p class="service-price" data-price="${repair.id}" role="status">${priceText(repair)}</p>
      <p class="helper">${repair.photo ? `Suggested from photo ${repair.photo}. Check against the piece.` : 'Entered by the associate.'}</p>
    </div>`).join('')}</div>
    <button type="button" id="close-up" class="text-button">Add optional close-up</button>`}
  </section>`;
}

function reviewScreen() {
  const details = state.details;
  return `<section class="intro"><h1>Review Estimate</h1><p>Review the suggested details and correct anything that needs a closer look.</p></section>
    ${state.confirmed ? '<p class="notice success" role="status">Estimate confirmed. These details stay here until you reload or start another piece.</p>' : ''}
    ${customerCard(state)}
    <form id="item-form" class="card details">
      <div class="section-heading"><h2>Item information</h2>${details.metals.length < 3 ? '<button type="button" id="add-metal" class="text-button">Add metal</button>' : ''}</div><div class="item-fields"><label class="field">Item type<select id="item-type">${options(ITEM_TYPES, details.itemType)}</select></label>
      ${details.metals.map((metal, index) => `<div class="metal-group"><label class="field">Metal${details.metals.length > 1 ? ` ${index + 1}` : ''}<select data-metal="${index}">${options(METALS, metal.metal)}</select></label>
        <label class="field">Purity<select data-purity="${index}">${options(PURITIES, metal.purity)}</select></label>
        <p class="helper${metal.purity === 'Unknown' ? ' attention' : ''}">${metal.hallmark ? `Hallmark read: ${escape(metal.hallmark)}. ` : 'No readable hallmark. '}${metal.purity === 'Unknown' ? 'Select purity only if you can confirm it, or leave Unknown.' : 'Check the purity against the piece.'}</p>
        ${details.metals.length > 1 ? `<button type="button" class="text-button" data-remove-metal="${index}">Remove metal ${index + 1}</button>` : ''}</div>`).join('')}</div>
      <fieldset><legend>Stones</legend><p class="helper">Select all that you can confirm. Appearance alone may not identify a stone.</p><div class="stones">${STONES.map((stone) => `<label class="stone"><input type="checkbox" value="${escape(stone)}" ${details.stones.includes(stone) ? 'checked' : ''} />${escape(stone)}</label>`).join('')}</div></fieldset>
      <p class="helper">Unknown is okay. These are photo-based suggestions, ready for your check.</p>
    </form>
    ${servicesCard()}
    ${estimateCard()}
    <section class="photo-section"><div class="section-heading"><h2>Captured images</h2><button id="back" class="text-button">Review photos</button></div>${photoStrip(false)}</section>
    <footer class="actions">${state.confirmed ? '<button id="new-piece" class="primary">Start another piece</button>' : `<button type="submit" form="item-form" class="primary" ${state.repairBusy ? 'disabled' : ''}>Confirm estimate</button>`}</footer>`;
}

function bindReview() {
  const markChanged = () => {
    state.confirmed = false;
    state.ticketRequestId = null;
    const notice = document.querySelector('.notice.success'); notice?.remove();
    const footer = document.querySelector('.actions');
    footer.innerHTML = `<button type="submit" form="item-form" class="primary" ${state.repairBusy ? 'disabled' : ''}>Confirm estimate</button>`;
  };
  bindCustomer({ state, searchCustomers: text => client.query(api.customers.search, { text }), markChanged, render });
  document.querySelector('#item-type').addEventListener('change', (event) => { state.details.itemType = event.target.value; markChanged(); });
  document.querySelectorAll('[data-metal]').forEach((select) => select.addEventListener('change', () => {
    state.details.metals[Number(select.dataset.metal)].metal = select.value;
    state.details.metals[Number(select.dataset.metal)].purity = 'Unknown';
    state.confirmed = false; render();
  }));
  document.querySelectorAll('[data-purity]').forEach((select) => select.addEventListener('change', () => { state.details.metals[Number(select.dataset.purity)].purity = select.value; markChanged(); refreshPrices(); }));
  document.querySelector('#add-metal')?.addEventListener('click', () => { state.details.metals.push({ metal: 'Unknown', purity: 'Unknown', hallmark: '' }); state.confirmed = false; render(); });
  document.querySelectorAll('[data-remove-metal]').forEach((button) => button.addEventListener('click', () => { state.details.metals.splice(Number(button.dataset.removeMetal), 1); state.confirmed = false; render(); }));
  document.querySelectorAll('.stones input').forEach((input) => input.addEventListener('change', () => {
    let selected = new Set(state.details.stones);
    if (input.checked) {
      if (['Unknown', 'None visible'].includes(input.value)) selected = new Set([input.value]);
      else { selected.delete('Unknown'); selected.delete('None visible'); selected.add(input.value); }
    } else selected.delete(input.value);
    state.details.stones = selected.size ? [...selected] : ['Unknown'];
    document.querySelectorAll('.stones input').forEach((checkbox) => { checkbox.checked = state.details.stones.includes(checkbox.value); });
    markChanged();
  }));
  document.querySelector('#add-service')?.addEventListener('click', () => {
    state.repairs.push({ id: ++repairId, source: 'manual', damage: '', serviceCode: '', photo: 0 });
    state.confirmed = false; render();
    document.querySelector(`[data-damage="${repairId}"]`)?.focus();
  });
  document.querySelectorAll('[data-damage]').forEach((input) => input.addEventListener('input', () => {
    const id = Number(input.dataset.damage);
    const repair = state.repairs.find((entry) => entry.id === id);
    repair.damage = input.value;
    repair.source = 'manual';
    alignRepairFields(); markChanged();
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
      picker.querySelector('.selected-service').textContent = service.name;
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
  document.querySelector('#close-up')?.addEventListener('click', () => {
    state.screen = 'capture'; state.error = ''; render(); window.scrollTo(0, 0);
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
  document.querySelector('#item-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.repairBusy) return;
    if (!state.customer) { state.error='Search and select a customer before creating the repair ticket.';render();document.querySelector('#customer-search').focus();return; }
    if (state.estimateError) { state.error=state.estimateError; render(); return; }
    const button = document.querySelector('.actions button'); button.disabled = true; button.textContent = 'Checking your review…';
    app.inert=true;
    const reviewArgs={photoCount:state.photos.length,repairs:state.repairs.map(({damage,serviceCode,photo})=>({damage,serviceCode,photo}))};
    const amounts=estimateArgs();
    const signature=value=>JSON.stringify(value,(_key,entry)=>typeof entry==='number' && !Number.isFinite(entry) ? 'invalid amount' : entry);
    const snapshot=signature([reviewArgs,amounts,state.customer?.id ?? null,state.details]);
    try {
      const result = await client.action(api.itemAnalysis.reviewRepairs, reviewArgs);
      if (!result.ok) state.error=result.message;
      else {
        const estimate=await client.query(api.estimates.calculate,amounts);
        const currentReview={photoCount:state.photos.length,repairs:state.repairs.map(({damage,serviceCode,photo})=>({damage,serviceCode,photo}))};
        if (snapshot!==signature([currentReview,estimateArgs(),state.customer?.id ?? null,state.details])) state.error='The estimate changed while checking. Review it and confirm again.';
        else if (estimate.complete) {
          if(state.ticketRequestSignature!==snapshot || !state.ticketRequestId){state.ticketRequestId=crypto.randomUUID();state.ticketRequestSignature=snapshot;}
          const today=new Date();const issuedDate=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
          const id=await client.action(api.tickets.create,{
            requestId:state.ticketRequestId,customerId:state.customer.id,details:state.details,
            photos:state.photos.map(({data,hallmark})=>({data,hallmark})),
            repairs:reviewArgs.repairs.map((repair,index)=>({...repair,override:amounts.repairs[index].override,extra:amounts.repairs[index].extra})),
            rush:amounts.rush,rhodium:amounts.rhodium,issuedDate,
          });
          state.ticket=await client.query(api.tickets.get,{id});
          if(!state.ticket)throw new Error('Ticket not found');
          state.screen='ticket';state.confirmed=true;state.estimate=estimate;state.error='';
        }
        else state.error='Choose all services and enter any missing prices before confirming.';
      }
    } catch { state.error = 'Could not create the ticket. Check your connection and try again.'; }
    finally { app.inert=false; }
    render(); window.scrollTo(0, 0);
  });
  document.querySelector('#back').addEventListener('click', () => { state.screen = 'capture'; state.error = ''; render(); window.scrollTo(0, 0); });
  document.querySelector('#new-piece')?.addEventListener('click', startNewPiece);
}

const splash = document.querySelector('#splash');
startSplash(splash, () => {
  splash.hidden = true;
  app.hidden = false;
  render();
});
