// Reveal the whole message without letting field focus scroll past it.
export function revealError(element) {
  if (!element || !element.textContent.trim() || element.closest('[hidden]')) return;
  element.setAttribute('tabindex', '-1');
  element.focus({ preventScroll: true });
  element.scrollIntoView({ block: 'start', behavior: 'instant' });
}

export function createErrorNavigation(root) {
  let previous = new Set();
  return () => {
    const errors = [...root.querySelectorAll('[role="alert"]')].filter(element => element.textContent.trim() && !element.closest('[hidden]'));
    const newError = errors.find(element => !previous.has(element.textContent.trim()));
    if (newError) revealError(newError);
    previous = new Set(errors.map(element => element.textContent.trim()));
  };
}
