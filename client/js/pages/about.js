import { el } from '../components/el.js';

const CHECKS = [
  ['URL Scanner', 'Link structure, suspicious domains, imitation brand names, unsafe connections, and known malicious records from threat intelligence.'],
  ['Email Scanner', 'Sender authenticity, pressure and fear language, requests for sensitive information, and every link found inside the message.'],
  ['Phone Scanner', 'Number format and country code, premium-rate ranges, and known suspicious numbers.'],
];

export const aboutPage = {
  render(container) {
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
          el('p', {}, 'Every scan combines several layers of analysis: format validation, structural and rule-based indicators, social-engineering language checks, and threat-intelligence matching (a curated database plus a live community phishing feed). The result is an explainable risk score from 0 to 100 with one of three classifications: LOW RISK, SUSPICIOUS or HIGH RISK.'),

          el('h2', { class: 'section-title' }, 'What each scanner checks'),
          el('ul', { class: 'tips-list' }, CHECKS.map(([name, desc]) => el('li', {}, [el('span', { class: 'tip-icon', 'aria-hidden': 'true' }, '›'), el('span', {}, [el('strong', {}, name + ': '), desc])]))),

          el('h2', { class: 'section-title' }, 'Privacy'),
          el('p', {}, 'Submitted links, emails and phone numbers are analyzed in memory and never stored. Your scan history on this device shows only shortened, redacted summaries. Cyber-Lens never opens or downloads submitted links.'),

          el('h2', { class: 'section-title' }, 'Important limitation'),
          el('p', {}, 'Cyber-Lens provides risk analysis to help you make better decisions. A LOW RISK result means "no known threat detected" — it is not a guarantee of safety. New threats appear every day, so always stay cautious with unexpected messages.'),
        ]),
      ])
    );
  },
};
