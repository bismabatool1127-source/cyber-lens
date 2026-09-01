import { el } from '../components/el.js';

const LAYERS = [
  'Format validation',
  'Structural & rule-based indicators',
  'Social-engineering language checks',
  'Threat-intelligence matching (curated database + live community phishing feed)',
];

const CHECKS = [
  ['URL Scanner', ['Link structure', 'Suspicious domains', 'Imitation brand names', 'Unsafe connections', 'Known malicious records from threat intelligence']],
  ['Email Scanner', ['Sender authenticity', 'Pressure and fear language', 'Requests for sensitive information', 'Every link found inside the message']],
  ['Phone Scanner', ['Number format and country code', 'Premium-rate ranges', 'Known suspicious numbers']],
];

export const aboutPage = {
  render(container) {
    const layers = el('div', { class: 'layers-diagram glass' }, [
      el(
        'div',
        { class: 'layers-col', role: 'group', 'aria-label': 'Analysis layers' },
        LAYERS.map((label) => el('button', { class: 'layer-chip', type: 'button', 'aria-pressed': 'false' }, label))
      ),
      el('span', { class: 'layer-arrow', 'aria-hidden': 'true' }, '→'),
      el('div', { class: 'layer-engine' }, [
        el('strong', {}, 'Central risk engine'),
        el('span', {}, 'weighs every triggered indicator'),
      ]),
      el('span', { class: 'layer-arrow', 'aria-hidden': 'true' }, '→'),
      el(
        'div',
        {
          class: 'risk-scale',
          role: 'img',
          'aria-label': 'Explainable risk score from 0 to 100: 0 to 34 LOW RISK, 35 to 69 SUSPICIOUS, 70 to 100 HIGH RISK',
        },
        [
          el('span', { class: 'risk-zone zone-low' }, 'LOW RISK'),
          el('span', { class: 'risk-zone zone-suspicious' }, 'SUSPICIOUS'),
          el('span', { class: 'risk-zone zone-high' }, 'HIGH RISK'),
        ]
      ),
    ]);
    layers.addEventListener('click', (e) => {
      const chip = e.target.closest('.layer-chip');
      if (!chip) return;
      chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });

    container.appendChild(
      el('div', { class: 'scanner-page' }, [
        el('a', { class: 'back-link', href: '#/' }, '← Back to home'),
        el('div', { class: 'panel glass about-content', style: 'padding: var(--space-xl)' }, [
          el('h1', { class: 'scanner-title' }, 'About Cyber-Lens'),
          el('p', {}, 'Your Digital Security Guard. Cyber-Lens helps ordinary users examine suspicious links, emails and phone numbers before trusting them. Instead of simply labelling something "safe" or "dangerous", it follows one principle:'),
          el('p', { class: 'about-principle' }, 'Detect → Explain → Recommend'),

          el('h2', { class: 'section-title' }, 'Why Cyber-Lens'),
          el('p', {}, 'Phishing and scam attempts target everyday people, not security experts — and most security tools speak in jargon that leaves non-technical users more confused, not safer. Cyber-Lens exists to close that gap: take the same suspicious content a security team would inspect, and explain the verdict in plain language anyone can act on.'),

          el('h2', { class: 'section-title' }, 'How it works'),
          layers,
          el('p', {}, 'Every scan combines these layers of analysis, and the result is an explainable risk score from 0 to 100 with one of three classifications: LOW RISK, SUSPICIOUS or HIGH RISK.'),

          el('h2', { class: 'section-title' }, 'What each scanner checks'),
          el(
            'div',
            { class: 'check-cards' },
            CHECKS.map(([name, items]) =>
              el('div', { class: 'check-card glass' }, [
                el('h3', {}, name),
                el('ul', { class: 'check-list' }, items.map((item) => el('li', {}, item))),
              ])
            )
          ),

          el('h2', { class: 'section-title' }, 'Privacy'),
          el('p', {}, 'Submitted links, emails and phone numbers are analyzed in memory and never stored. Your scan history on this device shows only shortened, redacted summaries. Cyber-Lens never opens or downloads submitted links.'),

          el('h2', { class: 'section-title' }, 'Important limitation'),
          el('p', {}, 'Cyber-Lens provides risk analysis to help you make better decisions. A LOW RISK result means "no known threat detected" — it is not a guarantee of safety. New threats appear every day, so always stay cautious with unexpected messages.'),
        ]),
      ])
    );
  },
};
