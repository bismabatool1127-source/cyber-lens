import { el } from './el.js';
import { svgIcon } from './icons.js';

const FEATURES = [
  {
    icon: 'url',
    title: 'URL & Phishing Detection',
    desc: 'Around 15 structural checks — typosquatting, credential-harvest paths, abusive TLDs — plus threat-intelligence matching.',
  },
  {
    icon: 'email',
    title: 'Email Security Analysis',
    desc: 'Sender authenticity, social-engineering language and every link inside the message, run through the full URL engine.',
  },
  {
    icon: 'phone',
    title: 'Phone Number Intelligence',
    desc: 'E.164 normalization, country detection, premium-rate ranges and known-risk number matching.',
  },
  {
    icon: 'gauge',
    title: 'Explainable Risk Scoring',
    desc: 'A central risk engine turns weighted indicators into a 0–100 score with plain-language reasons — never a black box.',
  },
  {
    icon: 'radar',
    title: 'Live Threat Intelligence',
    desc: 'A curated threat database combined with a live community phishing feed, refreshed automatically every 6 hours.',
  },
  {
    icon: 'report',
    title: 'Clear Security Reports',
    desc: 'Every scan ends with detected indicators, the reasoning behind them and one recommended action you can act on.',
  },
];

export function createFeatures() {
  return el('section', { class: 'section', id: 'features' }, [
    el('div', { class: 'section-head reveal' }, [
      el('p', { class: 'section-kicker' }, 'Capabilities'),
      el('h2', { class: 'section-title' }, 'One lens, three ways to look'),
      el('p', { class: 'section-sub' }, 'Hybrid rule-based analysis plus threat intelligence — detection, explanation and a recommendation every time.'),
    ]),
    el(
      'div',
      { class: 'features-grid reveal' },
      FEATURES.map((f) =>
        el('article', { class: 'feature-card glass' }, [
          el('div', { class: 'feature-visual' }, svgIcon(f.icon, 26)),
          el('h3', { class: 'feature-title' }, f.title),
          el('p', { class: 'feature-desc' }, f.desc),
        ])
      )
    ),
  ]);
}
