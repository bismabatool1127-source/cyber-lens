import { el } from '../components/el.js';
import { apiGet } from '../api.js';

const SCANNERS = [
  {
    path: '/url',
    title: 'URL Scanner',
    desc: 'Check a suspicious link before opening it.',
    cta: 'SCAN URL',
    icon: 'M3.9 12a5.1 5.1 0 0 1 5.1-5.1h3a1 1 0 1 0 0-2H9A7.1 7.1 0 0 0 9 19h3a1 1 0 1 0 0-2H9A5.1 5.1 0 0 1 3.9 12Zm4.1 1a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm5.1-8.1a1 1 0 0 1 1 1 .9.9 0 0 1 0 .2A5.1 5.1 0 0 1 15 12a5.1 5.1 0 0 1 .9 2.9v.2a1 1 0 1 1-2 0 3.1 3.1 0 0 0-.2-1.2h.3a1 1 0 0 1 0-2h.2A3.1 3.1 0 0 0 14 10a1 1 0 0 1-1-1c0-.4 0-.8.1-1.1Z',
  },
  {
    path: '/email',
    title: 'Email Scanner',
    desc: 'Analyze suspicious emails and detect phishing indicators.',
    cta: 'SCAN EMAIL',
    icon: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v.4l8 5.3 8-5.3V6H4Zm16 2.9-7.4 4.9a1 1 0 0 1-1.2 0L4 8.9V18h16V8.9Z',
  },
  {
    path: '/phone',
    title: 'Phone Scanner',
    desc: 'Check a phone number for suspicious indicators.',
    cta: 'CHECK PHONE',
    icon: 'M6.6 2.3 8.9 2a1 1 0 0 1 1.1.7l.9 3.2a1 1 0 0 1-.3 1.1L9 8.4a13.6 13.6 0 0 0 6.6 6.6l1.4-1.6a1 1 0 0 1 1.1-.3l3.2.9a1 1 0 0 1 .7 1.1l-.3 2.3a1.9 1.9 0 0 1-1.9 1.6C10.3 19 5 13.7 5 4.2c0-1 .7-1.8 1.6-1.9Z',
  },
];

const TIPS = [
  'Never enter passwords after clicking a link in an unexpected message. Type the website address yourself instead.',
  'Urgency is a warning sign. Scammers pressure you to act before you have time to think.',
  'Check the sender address, not just the display name. Names are easy to fake.',
  'Banks and real services never ask for passwords, PINs or codes by email or phone.',
];

function scannerIcon(d) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '26');
  svg.setAttribute('height', '26');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('d', d);
  svg.appendChild(path);
  return svg;
}

function scannerCard({ path, title, desc, cta, icon }) {
  return el('article', { class: 'scanner-card-tile' }, [
    el('span', { class: 'scanner-card-icon' }, scannerIcon(icon)),
    el('h2', { class: 'scanner-card-title' }, title),
    el('p', { class: 'scanner-card-desc' }, desc),
    el('a', { class: 'btn btn-primary btn-block', href: `#${path}` }, cta),
  ]);
}

function badgeFor(classification) {
  return el('span', { class: `badge badge-${classification}` }, classification === 'LOW' ? 'LOW RISK' : classification);
}

async function renderRecentScans(container) {
  const list = el('ul', { class: 'recent-list' });
  try {
    const { scans } = await apiGet('/recent-scans');
    if (!scans || scans.length === 0) {
      container.appendChild(
        el('p', { class: 'empty-state' }, 'No scans yet. Choose a scanner above and analyze a suspicious link, email or phone number — your latest results will appear here.')
      );
      return;
    }
    for (const scan of scans) {
      const time = new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      list.appendChild(
        el('li', { class: 'recent-item' }, [
          el('span', { class: 'recent-item-type' }, scan.type),
          el('span', { class: 'recent-item-target' }, scan.targetSummary),
          badgeFor(scan.classification),
          el('span', { class: 'recent-item-time', 'aria-label': `Scanned at ${time}` }, time),
        ])
      );
    }
    container.appendChild(list);
  } catch {
    container.appendChild(el('p', { class: 'empty-state' }, 'Scan history is temporarily unavailable.'));
  }
}

export const homePage = {
  async render(container) {
    container.appendChild(
      el('section', { class: 'hero' }, [
        el('p', { class: 'hero-badge' }, [
          scannerIcon('M12 1.8 3.5 5v6.1c0 5.2 3.6 9.4 8.5 11.1 4.9-1.7 8.5-5.9 8.5-11.1V5L12 1.8Z'),
          'AI-assisted security analysis',
        ]),
        el('h1', { class: 'hero-title' }, ['CYBER', el('span', { class: 'accent' }, '-LENS')]),
        el('p', { class: 'hero-tagline' }, 'Your Digital Security Guard'),
        el('p', { class: 'hero-sub' }, 'Analyze suspicious links, emails and phone numbers before you trust them.'),
      ])
    );

    container.appendChild(el('div', { class: 'scanner-grid' }, SCANNERS.map(scannerCard)));

    const recentBox = el('div', { class: 'panel' }, [el('h2', { class: 'panel-title' }, 'Recent scans')]);
    const recentHolder = el('div');
    recentBox.appendChild(recentHolder);

    const tipsBox = el('div', { class: 'panel' }, [
      el('h2', { class: 'panel-title' }, 'Security tips'),
      el(
        'ul',
        { class: 'tips-list' },
        TIPS.map((tip) => el('li', {}, [el('span', { class: 'tip-icon', 'aria-hidden': 'true' }, '›'), el('span', {}, tip)]))
      ),
    ]);

    container.appendChild(el('div', { class: 'home-columns' }, [recentBox, tipsBox]));

    container.appendChild(
      el('p', { class: 'trust-message' }, 'Cyber-Lens provides risk analysis and should not be treated as a guarantee of safety.')
    );

    renderRecentScans(recentHolder);
  },
};
