import lottie from 'lottie-web/build/player/lottie_light';

const container = document.getElementById('splash');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (!reducedMotion.matches) {
  const animation = lottie.loadAnimation({
    container,
    renderer: 'svg',
    loop: false,
    autoplay: false,
    path: '/mended_splash.json',
    rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
  });

  animation.addEventListener('DOMLoaded', () => {
    container.classList.add('ready');
    animation.play();
  });
  animation.addEventListener('data_failed', () => {
    container.classList.remove('ready');
  });
  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) animation.goToAndStop(animation.totalFrames - 1, true);
  });
}
