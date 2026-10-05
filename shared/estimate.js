import {catalogPrice} from './repair-prices.js';

function cents(value) {
  if (!Number.isFinite(value) || value < 0 || value > 1000000 || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) throw new Error('Enter a valid USD amount with up to two decimal places.');
  return Math.round(value * 100);
}

export function calculateEstimate({metals, repairs, rush, rhodium}) {
  if (!Array.isArray(repairs) || repairs.length > 12) throw new Error('Use up to 12 repair services.');
  if (typeof rush !== 'boolean' || typeof rhodium !== 'boolean') throw new Error('Confirm any additional fees.');
  // Validate metal bounds even when there are no services.
  catalogPrice('RF-01', metals);
  const whiteGold = metals.some(({metal,purity})=>metal==='White gold' && ['14K / 585','18K / 750'].includes(purity));
  if (rhodium && !whiteGold) throw new Error('The catalog re-rhodium fee requires confirmed 14K or 18K white gold.');
  const lines = repairs.map(({serviceCode,override,extra})=>{
    const catalog = serviceCode ? catalogPrice(serviceCode,metals) : null;
    if (override !== null) cents(override);
    const extraCents=cents(extra);
    const amount=serviceCode ? (override ?? catalog.amount) : null;
    return {serviceCode,amount,extra,total:amount===null?null:(cents(amount)+extraCents)/100,manual:override!==null};
  });
  const fees=(rush?50:0)+(rhodium?10:0);
  const subtotal=lines.reduce((total,line)=>total+(line.total===null?0:Math.round(line.total * 100)),0)/100;
  const missing=lines.filter(line=>line.total===null).length;
  const complete=lines.length>0 && missing===0;
  return {lines,subtotal,fees,total:complete?(Math.round(subtotal * 100)+Math.round(fees * 100))/100:null,complete,missing,currency:'USD'};
}
