import { el } from './el.js';

const STEPS = ['Checking format', 'Checking threat indicators', 'Calculating risk'];

/** Staged lens-scan progress panel shown while a scan request is in flight. */
export function createAnalyzingState() {
  let timer = null;
  let stepIndex = 0;

  const stepEl = el('p', { class: 'analyzing-step', 'aria-live': 'polite' }, STEPS[0] + '…');
  const progress = el(
    'div',
    { class: 'analyzing-progress', 'aria-hidden': 'true' },
    STEPS.map(() => el('span'))
  );

  const panel = el('div', { class: 'analyzing glass', role: 'status', 'aria-busy': 'true' }, [
    el('div', { class: 'lens-loader', 'aria-hidden': 'true' }, [
      el('span', { class: 'lens-loader-ring' }),
      el('span', { class: 'lens-loader-sweep' }),
      el('span', { class: 'lens-loader-core' }),
    ]),
    stepEl,
    progress,
    el('p', { class: 'analyzing-note' }, 'Cyber-Lens is observing the target…'),
  ]);

  const marks = progress.querySelectorAll('span');

  function paint() {
    stepEl.textContent = `${STEPS[stepIndex]}…`;
    marks.forEach((m, i) => m.classList.toggle('done', i <= stepIndex));
  }

  return {
    element: panel,
    start() {
      stepIndex = 0;
      paint();
      timer = setInterval(() => {
        stepIndex = Math.min(stepIndex + 1, STEPS.length - 1);
        paint();
      }, 900);
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
    },
  };
}
