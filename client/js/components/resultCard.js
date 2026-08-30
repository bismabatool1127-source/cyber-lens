import { el } from './el.js';

const LABELS = { LOW: 'LOW RISK', SUSPICIOUS: 'SUSPICIOUS', HIGH: 'HIGH RISK' };
const CONTEXT = { url: 'URL Risk', email: 'Email Risk', phone: 'Phone Risk' };

const ICONS = {
  LOW: 'M12 1.8 3.5 5v6.1c0 5.2 3.6 9.4 8.5 11.1 4.9-1.7 8.5-5.9 8.5-11.1V5L12 1.8Zm-1.2 13.6-3-3 1.4-1.4 1.6 1.6 4.8-4.8 1.4 1.4-6.2 6.2Z',
  SUSPICIOUS: 'M12 1.8 3.5 5v6.1c0 5.2 3.6 9.4 8.5 11.1 4.9-1.7 8.5-5.9 8.5-11.1V5L12 1.8Zm1 13.7h-2v-2h2v2Zm0-3.5h-2V7h2v5Z',
  HIGH: 'M12 1.8 3.5 5v6.1c0 5.2 3.6 9.4 8.5 11.1 4.9-1.7 8.5-5.9 8.5-11.1V5L12 1.8Zm3.6 12.4-1.4 1.4L12 13.4l-2.2 2.2-1.4-1.4 2.2-2.2-2.2-2.2 1.4-1.4 2.2 2.2 2.2-2.2 1.4 1.4-2.2 2.2 2.2 2.2Z',
};

/**
 * Shared result component used by all three scanners.
 * @param {object} result  risk engine result
 * @param {{scanType:'url'|'email'|'phone', extra?: Node|null, actions?: Node|null}} options
 */
export function renderResultCard(result, { scanType, extra = null, actions = null }) {
  const level = LABELS[result.classification] ? result.classification : 'SUSPICIOUS';

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('width', '34');
  icon.setAttribute('height', '34');
  icon.setAttribute('aria-hidden', 'true');
  const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  iconPath.setAttribute('fill', 'currentColor');
  iconPath.setAttribute('d', ICONS[level]);
  icon.appendChild(iconPath);

  const reasons = el(
    'ol',
    { class: 'reason-list' },
    result.reasons.length ? result.reasons.map((r) => el('li', {}, r)) : [el('li', {}, 'No significant suspicious indicators were detected.')]
  );

  const card = el('section', { class: `result-card risk-${level}`, 'aria-label': 'Analysis result' }, [
    el('div', { class: 'result-header' }, [
      el('span', { class: 'result-icon' }, icon),
      el('div', {}, [
        el('p', { class: 'result-status', role: 'heading', 'aria-level': '2' }, LABELS[level]),
        el('p', { class: 'result-context' }, `${CONTEXT[scanType]} · Confidence: ${result.confidence}`),
      ]),
    ]),
    el('div', { class: 'result-score-row' }, [
      el('div', { class: 'result-score-label' }, [
        el('span', {}, 'Risk Score'),
        el('span', {}, `${result.riskScore} / 100`),
      ]),
      el('div', { class: 'score-bar', role: 'img', 'aria-label': `Risk score ${result.riskScore} out of 100` }, [
        el('div', { class: 'score-bar-fill', style: `width:${result.riskScore}%` }),
      ]),
    ]),
    el('div', { class: 'result-body' }, [
      el('div', { class: 'result-section' }, [
        el('h3', {}, 'Why this was flagged'),
        reasons,
      ]),
      extra,
      el('div', { class: 'result-section' }, [
        el('h3', {}, 'Recommendation'),
        el('p', { class: 'recommendation' }, result.recommendation),
      ]),
      actions,
    ]),
  ]);

  return card;
}
