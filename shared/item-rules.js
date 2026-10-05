import { REPAIR_SERVICES } from './repair-catalog.js';
export const ITEM_TYPES = ['Unknown', 'Ring', 'Necklace', 'Bracelet', 'Earring', 'Pendant', 'Brooch', 'Chain', 'Watch', 'Other'];
export const METALS = ['Unknown', 'Yellow gold', 'White gold', 'Rose gold', 'Gold (color unknown)', 'Silver', 'Platinum', 'Palladium', 'Stainless steel', 'Titanium', 'Other'];
export const PURITIES = ['Unknown', '9K / 375', '10K / 417', '14K / 585', '18K / 750', '22K / 916', '24K / 999', '800 silver', '900 silver', '925 silver', '999 silver', '850 platinum', '900 platinum', '950 platinum', '999 platinum', '500 palladium', '950 palladium', '999 palladium', 'Not applicable'];
export const STONES = ['Unknown', 'None visible', 'Diamond', 'Ruby', 'Sapphire', 'Emerald', 'Pearl', 'Amethyst', 'Opal', 'Topaz', 'Other'];
export const MAX_PHOTOS = 6;
export const BUSY_MESSAGE = 'Busy right now. Try again in a few minutes.';

// A color or item shape is never evidence of purity.
export function supportedPurity(metal, purity, hallmark) {
  if (purity === 'Unknown') return purity;
  if (!hallmark || metal === 'Unknown') return 'Unknown';
  const mark = hallmark.toUpperCase().trim();
  const contains = (value) => new RegExp(`(^|[^A-Z0-9])${value}([^A-Z0-9]|$)`).test(mark);
  if (metal.toLowerCase().includes('gold')) {
    const mapping = { '9K / 375': ['9K', '9KT', '375'], '10K / 417': ['10K', '10KT', '417'], '14K / 585': ['14K', '14KT', '585'], '18K / 750': ['18K', '18KT', '750'], '22K / 916': ['22K', '22KT', '916'], '24K / 999': ['24K', '24KT', '999'] };
    return mapping[purity]?.some(contains) ? purity : 'Unknown';
  }
  const suffix = { Silver: 'silver', Platinum: 'platinum', Palladium: 'palladium' }[metal];
  if (suffix && purity.endsWith(suffix) && contains(purity.split(' ')[0])) return purity;
  return 'Unknown';
}

export function jpegDimensions(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Invalid JPEG');
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error('Invalid JPEG');
    const marker = bytes[offset + 1];
    const length = bytes[offset + 2] * 256 + bytes[offset + 3];
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      return { height: bytes[offset + 5] * 256 + bytes[offset + 6], width: bytes[offset + 7] * 256 + bytes[offset + 8] };
    }
    if (length < 2) break;
    offset += 2 + length;
  }
  throw new Error('Invalid JPEG');
}

export function validatePhotos(photos) {
  if (photos.length < 3 || photos.length > MAX_PHOTOS) throw new Error(`Add between 3 and ${MAX_PHOTOS} photos.`);
  if (!photos.some((photo) => photo.hallmark)) throw new Error('Mark one photo as the hallmark close-up.');
  for (const photo of photos) {
    if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.data) || photo.data.length > 350000) throw new Error('Please retake or replace this photo.');
    const bytes = Uint8Array.from(atob(photo.data.split(',')[1]), (char) => char.charCodeAt(0));
    const size = jpegDimensions(bytes);
    if (!size.width || !size.height || Math.max(size.width, size.height) > 1024) throw new Error('Photos must be resized to 1024 pixels before analysis.');
  }
}

// The same bounds apply to AI suggestions and associate-entered services.
export function validateRepairs(repairs, photoCount, { allowUnselected = false } = {}) {
  if (!Array.isArray(repairs) || repairs.length > 12) throw new Error('Use up to 12 repair services.');
  return repairs.map(({ damage, serviceCode, photo }) => {
    if (typeof damage !== 'string' || !damage.trim() || damage.trim().length > 160) throw new Error('Enter a damage description of up to 160 characters.');
    if (!REPAIR_SERVICES.some(service => service.code === serviceCode) && !(allowUnselected && serviceCode === '')) throw new Error('Choose a repair service from the catalog.');
    if (!Number.isInteger(photo) || photo < 0 || photo > photoCount) throw new Error('Choose an existing evidence photo, or use 0 for manual entry.');
    return { damage: damage.trim(), serviceCode, photo };
  });
}
