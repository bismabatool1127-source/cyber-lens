import { el } from './el.js';

const STEPS = [
  {
    title: 'Submit',
    desc: 'Paste a suspicious link, email or phone number. Cyber-Lens examines the text safely — it never opens or executes anything.',
  },
  {
    title: 'Analyze',
    desc: 'Structural checks run against the target and are matched with curated threat intelligence and a live phishing feed.',
  },
  {
    title: 'Assess',
    desc: 'A central risk engine weighs every triggered indicator and produces a single risk score from 0 to 100.',
  },
  {
    title: 'Explain',
    desc: 'Plain-language reasons show exactly what was flagged and why — no black-box verdicts.',
  },
  {
    title: 'Recommend',
    desc: 'Every result ends with one clear next step: proceed with care, verify through official channels, or stay away.',
  },
];

export function createHowItWorks() {
  return el('section', { class: 'section', id: 'how-it-works' }, [
    el('div', { class: 'section-head reveal' }, [
      el('p', { class: 'section-kicker' }, 'How it works'),
      el('h2', { class: 'section-title' }, 'From suspicion to clarity in five steps'),
      el('p', { class: 'section-sub' }, 'Detect, explain, recommend — the philosophy behind every Cyber-Lens analysis.'),
    ]),
    el(
      'ol',
      { class: 'steps reveal' },
      STEPS.map((step, i) =>
        el('li', { class: 'step glass' }, [
          el('span', { class: 'step-number', 'aria-hidden': 'true' }, String(i + 1).padStart(2, '0')),
          el('h3', { class: 'step-title' }, step.title),
          el('p', { class: 'step-desc' }, step.desc),
        ])
      )
    ),
  ]);
}
