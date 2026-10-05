import { IN_HOUSE_DAYS } from './repair-turnaround.js';
import { ITEM_TYPES, METALS, PURITIES, STONES } from './item-rules.js';

const DAY = 86400000;
function dateValue(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Choose a valid date.');
  const date = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value) throw new Error('Choose a valid date.');
  return date;
}

export function validateIssuedDate(value, now = Date.now()) {
  const date = dateValue(value);
  // Accept the phone's local calendar date across all time zones.
  if (Math.abs(date.getTime() - now) > 2 * DAY) throw new Error('Check the date on your phone.');
  return value;
}

export function suggestedDueDate(issuedDate, serviceCodes) {
  const date = dateValue(issuedDate);
  if (!serviceCodes.length || serviceCodes.length > 12) throw new Error('Choose repair services first.');
  let days = Math.max(...serviceCodes.map(code => {
    if (!Object.hasOwn(IN_HOUSE_DAYS, code)) throw new Error('Choose a service from the catalog.');
    return IN_HOUSE_DAYS[code];
  }));
  while (days > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (![0,6].includes(date.getUTCDay())) days--;
  }
  return date.toISOString().slice(0,10);
}

export function validateDueDate(value, issuedDate) {
  const days = (dateValue(value).getTime() - dateValue(issuedDate).getTime()) / DAY;
  if (days < 0 || days > 365) throw new Error('Choose a due date between the issue date and one year later.');
  return value;
}

export function validateDetails(details) {
  if (!ITEM_TYPES.includes(details.itemType) || details.metals.length < 1 || details.metals.length > 3 || details.stones.length < 1 || details.stones.length > STONES.length) throw new Error('Review the item information.');
  for (const metal of details.metals) if (!METALS.includes(metal.metal) || !PURITIES.includes(metal.purity) || typeof metal.hallmark !== 'string' || metal.hallmark.length > 160) throw new Error('Review the metal and purity.');
  if (details.stones.some(stone => !STONES.includes(stone)) || new Set(details.stones).size !== details.stones.length || (details.stones.length > 1 && details.stones.some(stone => ['Unknown','None visible'].includes(stone)))) throw new Error('Review the stone selections.');
  return details;
}

export function validateSignature(strokes) {
  if (!Array.isArray(strokes) || !strokes.length || strokes.length > 64) throw new Error('Draw a signature before saving.');
  let count = 0, distance = 0;
  for (const stroke of strokes) {
    if (!Array.isArray(stroke) || !stroke.length) throw new Error('Draw a signature before saving.');
    count += stroke.length;
    for (let index = 0; index < stroke.length; index++) {
      const point = stroke[index];
      if (![point.x,point.y].every(value => Number.isFinite(value) && value >= 0 && value <= 1)) throw new Error('Please clear and redraw the signature.');
      if (index) distance += Math.hypot(point.x - stroke[index-1].x, point.y - stroke[index-1].y);
    }
  }
  if (count > 4096) throw new Error('Please clear and redraw a shorter signature.');
  if (distance < .015) throw new Error('Draw a signature before saving.');
  return strokes;
}

export function signaturePoint({width,height,left,top},{clientX,clientY}) {
  const scale=Math.max(width,height);
  return {x:Math.max(0,Math.min(width,clientX-left))/scale,y:Math.max(0,Math.min(height,clientY-top))/scale};
}
