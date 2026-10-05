// Keep thumbnails hidden until the browser has decoded the complete image.
export async function decodePhoto(image, ready, failed) {
  try {
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Empty photo');
    ready();
  } catch { failed(); }
}

export function bindPhotoLoading(root = document) {
  root.querySelectorAll('.photo-preview').forEach(preview => {
    const image = preview.querySelector('img');
    const retry = preview.querySelector('.photo-retry');
    let attempt = 0;
    const load = () => {
      const current = ++attempt;
      preview.dataset.state = 'loading';
      retry.hidden = true;
      decodePhoto(image, () => {
        if (current !== attempt || !preview.isConnected) return;
        preview.dataset.state = 'ready';
      }, () => {
        if (current !== attempt || !preview.isConnected) return;
        preview.dataset.state = 'error';
        retry.hidden = false;
      });
    };
    retry.addEventListener('click', () => {
      // A fresh request recovers an interrupted storage download.
      const original = image.dataset.source;
      image.src = original.startsWith('https:') ? `${original}${original.includes('?') ? '&' : '?'}retry=${Date.now()}` : original;
      load();
    });
    load();
  });
}

export function photoPreview(source, label, escape) {
  return `<div class="photo-preview" data-state="loading"><img src="${escape(source)}" data-source="${escape(source)}" alt="${escape(label)}" decoding="async" width="160" height="160" /><span class="photo-loading helper" role="status">Loading photo…</span><button type="button" class="photo-retry text-button" aria-label="Retry ${escape(label)}" hidden>Retry photo</button></div>`;
}
