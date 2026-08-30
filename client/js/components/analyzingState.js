import { el } from './el.js';

const STEPS = ['Checking format', 'Checking threat indicators', 'Calculating risk'];

/** Staged progress panel shown while a scan request is in flight. */
export function createAnalyzingState() {
  let timer = null;
  let stepIndex = 0;

  const stepEl = el('p', { class: 'analyzing-step', 'aria-live': 'polite' }, STEPS[0] + '…');
  const panel = el('div', { class: 'analyzing', role: 'status', 'aria-busy': 'true' }, [
    el('div', { class: 'analyzing-spinner', 'aria-hidden': 'true' }),
    stepEl,
    el('p', { class: 'analyzing-note' }, 'Analyzing…'),
  ]);

  return {
    element: panel,
    start() {
      stepIndex = 0;
      stepEl.textContent = `${STEPS[0]}…`;
      timer = setInterval(() => {
        stepIndex = Math.min(stepIndex + 1, STEPS.length - 1);
        stepEl.textContent = `${STEPS[stepIndex]}…`;
      }, 900);
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
    },
  };
}
