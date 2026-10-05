import {printTicketCopies} from './print-ticket.js';
import { photoPreview } from './photo-loading.js';
import { validateDueDate, validateSignature, signaturePoint } from '../shared/ticket-rules.js';

const escape = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
const usd = amount => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(amount);
const date = value => new Date(`${value}T12:00:00`).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
const number = ticket => `MND-${String(ticket.number).padStart(6,'0')}`;

function signatureImage(strokes) {
  if (!strokes) return '';
  const points=strokes.flat(),xs=points.map(point=>point.x*600),ys=points.map(point=>point.y*600);
  const left=Math.min(...xs)-10,top=Math.min(...ys)-10,width=Math.max(...xs)-left+10,height=Math.max(...ys)-top+10;
  return `<svg viewBox="${left} ${top} ${width} ${height}" role="img" aria-label="Customer signature">${strokes.map(stroke=>`<polyline points="${stroke.map(point=>`${point.x*600},${point.y*600}`).join(' ')}" fill="none" stroke="#241A2B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`).join('')}</svg>`;
}

function contents(ticket, printable=false) {
  return `<section class="ticket-summary"><p class="helper">${number(ticket)} · ${ticket.status==='signed'?'Signed':'Awaiting signature'}</p><p class="ticket-total">${usd(ticket.total)}</p>
    <div class="ticket-dates"><div><p class="helper">Issued</p><p>${date(ticket.issuedDate)}</p></div><div>${printable || ticket.status==='signed' ? `<p class="helper">Due</p><p>${date(ticket.dueDate)}</p>` : `<label class="field" for="ticket-due">Due date<input id="ticket-due" type="date" min="${ticket.issuedDate}" value="${ticket.dueDate}" required /></label>`}</div></div>
    ${printable || ticket.status==='signed' ? '' : '<p class="helper">Suggested from the longest in-house repair time, counting weekdays. Adjust for your bench schedule and holidays.</p>'}</section>
    <section class="card ticket-section"><h2>Customer</h2><p>${escape(ticket.customer.name)}</p><p class="helper">${escape(ticket.customer.phone)}</p></section>
    <section class="card ticket-section"><h2>Item information</h2><p>${escape(ticket.details.itemType)}</p><p>${ticket.details.metals.map(metal=>`${escape(metal.metal)} · ${escape(metal.purity)}`).join('<br>')}</p><p class="helper">Stones: ${ticket.details.stones.map(escape).join(', ')}</p>${ticket.details.metals.filter(metal=>metal.hallmark).map(metal=>`<p class="helper">Hallmark: ${escape(metal.hallmark)}</p>`).join('')}</section>
    <section class="card ticket-section"><h2>Repair services</h2>${ticket.repairs.map((repair,index)=>`<div class="ticket-repair"><h3>${escape(repair.serviceName)}</h3><p>${escape(repair.damage)}</p>${ticket.details.metals.length > 1 && repair.metalIndexes?.length ? `<p class="helper">Metal(s): ${repair.metalIndexes.map(index=>`${escape(ticket.details.metals[index].metal)} · ${escape(ticket.details.metals[index].purity)}`).join(' + ')}</p>` : ''}<div class="ticket-price-row"><span>Service price</span><span>${usd(repair.amount)}</span></div>${repair.extra ? `<div class="ticket-price-row"><span>Additional fee</span><span>${usd(repair.extra)}</span></div>` : ''}<p class="helper">${repair.serviceCode}${repair.photo ? ` · Photo ${repair.photo}` : ' · Associate entry'}</p></div>`).join('')}
    <div class="ticket-totals"><div class="ticket-price-row"><span>Subtotal</span><span>${usd(ticket.subtotal)}</span></div>${ticket.rush?'<div class="ticket-price-row"><span>Rush fee</span><span>$50.00</span></div>':''}${ticket.rhodium?'<div class="ticket-price-row"><span>Re-rhodium fee</span><span>$10.00</span></div>':''}<div class="ticket-price-row total"><span>Total estimate</span><span>${usd(ticket.total)}</span></div></div></section>
    <section class="ticket-section"><h2>Captured images</h2><div class="ticket-photos">${ticket.photos.map((photo,index)=>`<figure>${photo.url ? printable ? `<img src="${escape(photo.url)}" alt="Jewelry photo ${index+1}" />` : photoPreview(photo.url, `Jewelry photo ${index+1}`, escape) : '<p>Photo unavailable</p>'}<figcaption>Photo ${index+1}${photo.hallmark?' · Hallmark':''}</figcaption></figure>`).join('')}</div></section>
    ${ticket.status==='signed'?`<section class="card ticket-section"><h2>Customer signature</h2><div class="saved-signature">${signatureImage(ticket.signature)}</div><p class="helper">Signed ${escape(new Date(ticket.signedAt).toLocaleString())}</p></section>`:''}`;
}

export function ticketScreen(ticket) {
  return `<div class="ticket"><section class="intro"><h1>Your Repair Ticket</h1></section>${ticket.status==='signed'?'<p class="notice success" role="status">Signed ticket saved.</p>':''}${contents(ticket)}
    <footer class="actions">${ticket.status==='signed'?`<button id="print-ticket" class="primary">Print two copies</button><button id="ticket-next-customer" class="text-button ticket-secondary">Next piece for ${escape(ticket.customer.name)}</button><button id="ticket-new" class="text-button ticket-secondary">Start another piece</button>`:'<button id="sign-ticket" class="primary">Sign and save</button><button id="edit-ticket" class="text-button ticket-secondary">Edit estimate</button>'}</footer></div>
    ${ticket.status==='signed'?`<div class="print-tickets" aria-hidden="true">${['Store copy','Customer copy'].map(copy=>`<article class="print-ticket"><h1>Mended · Repair Ticket</h1><p>${copy}</p>${contents(ticket,true)}</article>`).join('')}</div>`:''}`;
}

export function bindTicket({state,render,save,edit,startNew,nextForCustomer}) {
  const ticket=state.ticket;
  document.querySelector('#ticket-due')?.addEventListener('change',event=>{ticket.dueDate=event.target.value;state.error='';});
  document.querySelector('#edit-ticket')?.addEventListener('click',edit);
  document.querySelector('#header-back')?.addEventListener('click',edit);
  document.querySelector('#ticket-next-customer')?.addEventListener('click',nextForCustomer);
  const printSavedTicket=async()=>{try{await printTicketCopies();}catch{state.error='The signed ticket is saved. A photo could not load for printing. Try Print two copies again.';render();}};
  document.querySelector('#ticket-new')?.addEventListener('click',startNew);
  document.querySelector('#sign-ticket')?.addEventListener('click',()=>{
    try { validateDueDate(ticket.dueDate,ticket.issuedDate); }
    catch(error) { state.error=error.message;render();return; }
    openSignature(ticket,async signature=>{state.ticket=await save({id:ticket.id,dueDate:ticket.dueDate,signature});state.error='';render();window.scrollTo(0,0);},printSavedTicket);
  });
  document.querySelector('#print-ticket')?.addEventListener('click',async event=>{
    const button=event.currentTarget;button.disabled=true;button.textContent='Preparing copies…';
    try {
      await printTicketCopies();
    } catch { state.error='A ticket photo could not load. Check your connection and try printing again.';render(); }
    finally { if(button.isConnected){button.disabled=false;button.textContent='Print two copies';} }
  });
}

function openSignature(ticket,onSave,onPrint) {
  const dialog=document.createElement('dialog');dialog.className='signature-sheet';
  dialog.innerHTML=`<div class="sheet-drag-area"><button type="button" class="sheet-handle" aria-label="Close signature sheet"><span></span></button><h2 id="signature-heading">Customer signature</h2></div><p>${escape(ticket.customer.name)} · ${number(ticket)}</p><p class="helper">Total estimate ${usd(ticket.total)} · Due ${date(ticket.dueDate)}</p><p class="helper">Review the ticket, then sign below.</p><label class="field" for="signature-canvas">Sign here</label><canvas id="signature-canvas" aria-label="Draw your signature" tabindex="0"></canvas><button type="button" class="text-button" id="signature-clear">Clear signature</button><p class="helper error" id="signature-error" role="alert"></p><button type="button" class="primary signature-save" id="signature-save-print">Save signed ticket and print</button><button type="button" class="text-button signature-save" id="signature-save">Save signed ticket only</button>`;
  dialog.setAttribute('aria-labelledby','signature-heading');dialog.setAttribute('tabindex','-1');document.body.append(dialog);dialog.showModal();dialog.focus({preventScroll:true});
  const canvas=dialog.querySelector('canvas'),context=canvas.getContext('2d');
  const message=dialog.querySelector('#signature-error');
  let strokes=[],stroke=null,pointerId=null,pointCount=0,saving=false;
  function draw() {
    const rect=canvas.getBoundingClientRect(),ratio=window.devicePixelRatio || 1;
    canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);
    context.scale(ratio,ratio);context.strokeStyle='#241A2B';context.lineWidth=2;context.lineCap='round';context.lineJoin='round';
    const scale=Math.max(rect.width,rect.height);
    for(const entry of strokes){context.beginPath();entry.forEach((point,index)=>{context[index?'lineTo':'moveTo'](point.x*scale,point.y*scale);});context.stroke();}
  }
  const observer=new ResizeObserver(draw);observer.observe(canvas);
  const point=event=>signaturePoint(canvas.getBoundingClientRect(),event);
  canvas.addEventListener('pointerdown',event=>{
    if(saving || stroke || strokes.length>=64 || pointCount>=4096 || (event.pointerType==='mouse' && event.button!==0))return;
    event.preventDefault();pointerId=event.pointerId;canvas.setPointerCapture(pointerId);stroke=[point(event)];strokes.push(stroke);pointCount++;message.textContent='';
  });
  canvas.addEventListener('pointermove',event=>{
    if(!stroke || saving || event.pointerId!==pointerId)return;
    if(pointCount>=4096){message.textContent='Signature is full. Save it, or clear and redraw.';return;}
    stroke.push(point(event));pointCount++;draw();
  });
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,event=>{if(event.pointerId===pointerId){stroke=null;pointerId=null;}});
  dialog.querySelector('#signature-clear').addEventListener('click',()=>{if(!saving){strokes=[];stroke=null;pointerId=null;pointCount=0;message.textContent='';draw();}});
  const handle=dialog.querySelector('.sheet-handle');
  const dragArea=dialog.querySelector('.sheet-drag-area');
  let drag=null;
  handle.addEventListener('click',()=>{if(!saving && !drag)dialog.close();});
  dragArea.addEventListener('pointerdown',event=>{
    if(saving || (event.pointerType==='mouse' && event.button!==0))return;
    event.preventDefault();
    drag={id:event.pointerId,start:event.clientY,distance:0};
    dragArea.setPointerCapture(event.pointerId);
    dialog.classList.add('dragging');
  });
  dragArea.addEventListener('pointermove',event=>{
    if(!drag || event.pointerId!==drag.id)return;
    drag.distance=Math.max(0,event.clientY-drag.start);
    dialog.style.transform=`translateY(${drag.distance}px)`;
  });
  const finishDrag=event=>{
    if(!drag || event.pointerId!==drag.id)return;
    const dismiss=event.type==='pointerup' && drag.distance>=90 && !saving;
    // Suppress the click after a drag so a short pull snaps back.
    const moved=drag.distance>5;
    drag=null;dialog.classList.remove('dragging');dialog.style.transform='';
    if(moved){const prevent=event=>{event.preventDefault();event.stopImmediatePropagation();};handle.addEventListener('click',prevent,{once:true,capture:true});setTimeout(()=>handle.removeEventListener('click',prevent,true),0);}
    if(dismiss)dialog.close();
  };
  for(const name of ['pointerup','pointercancel','lostpointercapture'])dragArea.addEventListener(name,finishDrag);
  dialog.addEventListener('cancel',event=>{if(saving)event.preventDefault();});
  dialog.addEventListener('close',()=>{observer.disconnect();dialog.remove();});
  dialog.querySelectorAll('.signature-save').forEach(saveButton=>saveButton.addEventListener('click',async event=>{
    if(saving)return;
    try{validateSignature(strokes);}catch(error){message.textContent=error.message;return;}
    saving=true;dialog.querySelectorAll('.signature-save').forEach(button=>{button.disabled=true;});dialog.querySelector('#signature-clear').disabled=true;handle.disabled=true;
    const button=event.currentTarget;const label=button.textContent;const printAfter=button.id==='signature-save-print';button.textContent='Saving signed ticket…';
    try {await onSave(strokes);dialog.close();if(printAfter)await onPrint();}
    catch {message.textContent='Could not save the signed ticket. Your signature is still here. Try again.';saving=false;dialog.querySelectorAll('.signature-save').forEach(button=>{button.disabled=false;});button.textContent=label;dialog.querySelector('#signature-clear').disabled=false;handle.disabled=false;}
  }));
}
