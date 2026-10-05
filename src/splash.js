import './splash.css';

// A failed or blocked video must never stop the app opening.
export function startSplash(container, onComplete = () => {}) {
  const video = container.querySelector('video');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let finished = false;
  let timeout;
  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    video.pause();
    container.classList.remove('playing');
    reducedMotion.removeEventListener('change', motionChanged);
    onComplete();
  }
  function motionChanged(event) { if (event.matches) finish(); }
  if (video.ended || reducedMotion.matches) { finish(); return; }
  video.muted = true;
  video.addEventListener('playing', () => { if (!finished) container.classList.add('playing'); });
  video.addEventListener('ended', finish, { once: true });
  video.addEventListener('error', finish, { once: true });
  video.querySelector('source')?.addEventListener('error', finish, { once: true });
  reducedMotion.addEventListener('change', motionChanged);
  timeout = setTimeout(finish, 6000);
  video.play()?.catch(finish);
}
