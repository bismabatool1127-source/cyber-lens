import { el } from './el.js';
import { svgIcon } from './icons.js';

/** Static illustration of a result — clearly labeled, never derived from live data. */

const GAUGE_R = 70;
const CIRCUMFERENCE = 2 * Math.PI * GAUGE_R;
const DEMO_SCORE = 87;

function demoGauge() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 160 160');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Example risk score ${DEMO_SCORE} out of 100`);

  const track = document.createElementNS(ns, 'circle');
  track.setAttribute('class', 'gauge-track');
  for (const [k, v] of Object.entries({ cx: '80', cy: '80', r: String(GAUGE_R) })) track.setAttribute(k, v);

  const arc = document.createElementNS(ns, 'circle');
  arc.setAttribute('class', 'gauge-arc');
  for (const [k, v] of Object.entries({
    cx: '80',
    cy: '80',
    r: String(GAUGE_R),
    'stroke-dasharray': String(CIRCUMFERENCE),
    'stroke-dashoffset': String(CIRCUMFERENCE * (1 - DEMO_SCORE / 100)),
  }))
    arc.setAttribute(k, v);

  svg.append(track, arc);

  return el('div', { class: 'gauge' }, [
    svg,
    el('div', { class: 'gauge-center' }, [
      el('span', { class: 'gauge-score', 'aria-hidden': 'true' }, String(DEMO_SCORE)),
      el('span', { class: 'gauge-max' }, '/ 100'),
      el('span', { class: 'gauge-caption' }, 'Risk score'),
    ]),
  ]);
}

export function createExampleResult() {
  const indicators = [
    { name: 'typosquat-brand', detail: 'Domain closely imitates a well-known brand name.' },
    { name: 'credential-keywords-path', detail: 'The link path uses sign-in wording typical of fake login pages.' },
    { name: 'suspicious-tld', detail: 'Uses a top-level domain frequently abused for phishing.' },
  ];

  return el('section', { class: 'section', id: 'example' }, [
    el('div', { class: 'section-head reveal' }, [
      el('p', { class: 'section-kicker' }, 'What a result looks like'),
      el('h2', { class: 'section-title' }, 'Clear verdicts, explained'),
      el('p', { class: 'section-sub' }, 'A sample analysis below — run your own scan above to see live results.'),
    ]),
    el('div', { class: 'reveal' }, [
      el('section', { class: 'result-card glass risk-HIGH example-result', 'aria-label': 'Example analysis result' }, [
        el('p', { class: 'example-tag' }, [svgIcon('shieldAlert', 14), 'Example — demonstration only, not live data']),
        el('div', { class: 'result-top' }, [
          demoGauge(),
          el('div', { class: 'result-headline' }, [
            el('h3', { class: 'result-status-title' }, 'HIGH RISK'),
            el('p', { class: 'result-assessment' }, 'Strong malicious signals detected. Avoid any interaction with this item.'),
            el('div', { class: 'result-meta' }, [
              el('span', { class: 'meta-chip' }, ['Threat level ', el('strong', {}, 'Critical')]),
              el('span', { class: 'meta-chip' }, ['Confidence ', el('strong', {}, 'high')]),
              el('span', { class: 'meta-chip' }, [el('strong', {}, 'URL analysis')]),
            ]),
          ]),
        ]),
        el('div', { class: 'result-body' }, [
          el('div', { class: 'result-section' }, [
            el('h3', {}, 'Why this was flagged'),
            el('ol', { class: 'reason-list' }, [
              el('li', {}, 'The domain imitates a major payment brand — a common phishing technique.'),
              el('li', {}, 'The link asks for sign-in details on an unencrypted connection.'),
              el('li', {}, 'The address matches patterns commonly used in phishing campaigns.'),
            ]),
          ]),
          el('div', { class: 'result-section' }, [
            el('h3', {}, ['Detection indicators', el('span', { class: 'signals-line' }, '3 of 3 signals triggered')]),
            el(
              'div',
              { class: 'indicator-grid' },
              indicators.map((i) =>
                el('div', { class: 'indicator-chip' }, [
                  el('p', { class: 'indicator-chip-name' }, el('span', {}, i.name)),
                  el('p', { class: 'indicator-chip-detail' }, i.detail),
                ])
              )
            ),
          ]),
          el('div', { class: 'result-section' }, [
            el('h3', {}, 'Recommendation'),
            el('p', { class: 'recommendation' }, 'Do not open this link or enter any personal information.'),
          ]),
        ]),
      ]),
    ]),
  ]);
}
