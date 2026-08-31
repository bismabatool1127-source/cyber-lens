import { el } from './el.js';

const LABELS = { LOW: 'LOW RISK', SUSPICIOUS: 'SUSPICIOUS', HIGH: 'HIGH RISK' };
const ASSESSMENT = {
  LOW: 'No known threat detected — this does not guarantee absolute safety, so stay alert.',
  SUSPICIOUS: 'Several suspicious signals were found. Treat this with caution and verify through official channels.',
  HIGH: 'Strong malicious signals detected. Avoid any interaction with this item.',
};
const THREAT_LEVEL = { LOW: 'Low', SUSPICIOUS: 'Elevated', HIGH: 'Critical' };
const CONTEXT = { url: 'URL analysis', email: 'Email analysis', phone: 'Phone analysis' };

const GAUGE_R = 70;
const CIRCUMFERENCE = 2 * Math.PI * GAUGE_R;

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function radialGauge(score) {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

  const track = svgEl('circle', { class: 'gauge-track', cx: '80', cy: '80', r: String(GAUGE_R) });
  const arc = svgEl('circle', {
    class: 'gauge-arc',
    cx: '80',
    cy: '80',
    r: String(GAUGE_R),
    'stroke-dasharray': String(CIRCUMFERENCE),
    'stroke-dashoffset': reducedMotion ? String(CIRCUMFERENCE * (1 - score / 100)) : String(CIRCUMFERENCE),
  });
  const svg = svgEl('svg', { viewBox: '0 0 160 160', role: 'img', 'aria-label': `Risk score ${score} out of 100` });
  svg.appendChild(track);
  svg.appendChild(arc);

  const scoreEl = el('span', { class: 'gauge-score', 'aria-hidden': 'true' }, reducedMotion ? String(score) : '0');
  const gauge = el('div', { class: 'gauge' }, [
    svg,
    el('div', { class: 'gauge-center' }, [scoreEl, el('span', { class: 'gauge-max' }, '/ 100'), el('span', { class: 'gauge-caption' }, 'Risk score')]),
  ]);

  if (!reducedMotion) {
    setTimeout(() => {
      arc.setAttribute('stroke-dashoffset', String(CIRCUMFERENCE * (1 - score / 100)));
    }, 40);
    const start = performance.now();
    const tick = (now) => {
      const k = Math.min((now - start) / 950, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      scoreEl.textContent = String(Math.round(score * eased));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(() => {
      scoreEl.textContent = String(score);
    }, 1050);
  }

  return gauge;
}

/**
 * Shared result component used by all three scanners (signature preserved).
 * @param {object} result  risk engine result
 * @param {{scanType:'url'|'email'|'phone', extra?: Node|null, actions?: Node|null}} options
 */
export function renderResultCard(result, { scanType, extra = null, actions = null }) {
  const level = LABELS[result.classification] ? result.classification : 'SUSPICIOUS';
  const triggered = (result.indicators || []).filter((i) => i.triggered);
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const meta = el('div', { class: 'result-meta' }, [
    el('span', { class: 'meta-chip' }, ['Threat level ', el('strong', {}, THREAT_LEVEL[level])]),
    el('span', { class: 'meta-chip' }, ['Confidence ', el('strong', {}, result.confidence)]),
    el('span', { class: 'meta-chip' }, [el('strong', {}, CONTEXT[scanType])]),
    el('span', { class: 'meta-chip mono' }, `Scanned ${time}`),
  ]);

  const reasons = el(
    'ol',
    { class: 'reason-list' },
    result.reasons.length ? result.reasons.map((r) => el('li', {}, r)) : [el('li', {}, 'No significant suspicious indicators were detected.')]
  );

  const indicators = el(
    'div',
    { class: 'indicator-grid' },
    triggered.length
      ? triggered.map((i) =>
          el('div', { class: 'indicator-chip' }, [
            el('p', { class: 'indicator-chip-name' }, [el('span', {}, i.name), el('span', { class: 'indicator-chip-weight' }, `w:${i.weight}`)]),
            el('p', { class: 'indicator-chip-detail' }, i.detail),
          ])
        )
      : [el('p', { class: 'empty-state' }, 'No detection indicators were triggered by this item.')]
  );

  return el('section', { class: `result-card glass risk-${level}`, 'aria-label': 'Analysis result' }, [
    el('div', { class: 'result-top' }, [
      radialGauge(result.riskScore),
      el('div', { class: 'result-headline' }, [
        el('h2', { class: 'result-status-title', role: 'heading', 'aria-level': '2' }, LABELS[level]),
        el('p', { class: 'result-assessment' }, ASSESSMENT[level]),
        meta,
      ]),
    ]),
    el('div', { class: 'result-body' }, [
      el('div', { class: 'result-section' }, [el('h3', {}, 'Why this was flagged'), reasons]),
      el('div', { class: 'result-section' }, [
        el('h3', {}, [
          'Detection indicators',
          el(
            'span',
            { class: 'signals-line' },
            `${triggered.length} of ${(result.indicators || []).length} signals triggered`
          ),
        ]),
        indicators,
      ]),
      extra,
      el('div', { class: 'result-section' }, [
        el('h3', {}, 'Recommendation'),
        el('p', { class: 'recommendation' }, result.recommendation),
      ]),
      actions,
    ]),
  ]);
}
