import { el } from '../components/el.js';
import { svgIcon } from '../components/icons.js';
import { createScannerConsole } from '../components/scannerConsole.js';
import { createDashboard } from '../components/dashboard.js';
import { createThreatNet } from '../components/threatNet.js';
import { createFeatures } from '../components/features.js';
import { createGlobe } from '../three/globe.js';
import { observeReveals } from '../utils/reveal.js';

const TIPS = [
  'Never enter passwords after clicking a link in an unexpected message. Type the website address yourself instead.',
  'Urgency is a warning sign. Scammers pressure you to act before you have time to think.',
  'Check the sender address, not just the display name. Names are easy to fake.',
  'Banks and real services never ask for passwords, PINs or codes by email or phone.',
];

export const homePage = {
  destroy() {
    this._globe?.destroy();
    this._globe = null;
    this._net?.destroy?.();
    this._net = null;
    this._dash?.cleanup?.();
    this._dash = null;
    this._stopReveals?.();
  },

  async render(container) {
    /* ---------- hero ---------- */
    const canvas = el('canvas', { class: 'globe-canvas', 'aria-hidden': 'true' });
    const globeStage = el('div', { class: 'hero-globe' }, [
      canvas,
      el('p', { class: 'hero-globe-caption' }, 'Continuous observation'),
    ]);

    const console_ = createScannerConsole({
      initialMode: 'url',
      onScanStart: () => this._globe?.setScanning(true),
      onScanResult: (result) => {
        this._globe?.setScanning(false);
        if (result) {
          this._globe?.flash(result.classification);
          window.dispatchEvent(new CustomEvent('scan:complete'));
        }
      },
    });

    const hero = el('section', { class: 'hero' }, [
      el('div', { class: 'container hero-grid' }, [
        el('div', { class: 'hero-copy' }, [
          el('p', { class: 'hero-badge' }, [svgIcon('shield', 15), 'AI-assisted security analysis']),
          el('h1', { class: 'hero-title' }, ['See Threats ', el('span', { class: 'accent' }, 'Before They Become Breaches.')]),
          el('p', { class: 'hero-sub' }, 'Analyze links, emails and phone numbers with intelligent security insights.'),
          console_.element,
          el('div', { class: 'hero-chips' }, [
            el('span', { class: 'hero-chip' }, [svgIcon('shieldCheck', 14), 'Nothing you scan is stored']),
            el('span', { class: 'hero-chip' }, [svgIcon('radar', 14), 'Live threat intelligence']),
            el('span', { class: 'hero-chip' }, [svgIcon('report', 14), 'Explainable results']),
          ]),
        ]),
        globeStage,
      ]),
    ]);
    container.appendChild(hero);

    createGlobe(canvas).then((globe) => {
      if (globe) {
        this._globe = globe;
      } else {
        canvas.remove();
        globeStage.prepend(el('div', { class: 'globe-fallback', 'aria-hidden': 'true' }));
      }
    });

    /* ---------- sections ---------- */
    this._dash = createDashboard();
    container.appendChild(this._dash);

    const net = createThreatNet();
    this._net = net;
    container.appendChild(
      el('section', { class: 'section', id: 'observation' }, [
        el('div', { class: 'section-head reveal' }, [
          el('p', { class: 'section-kicker' }, 'Threat observation'),
          el('h2', { class: 'section-title' }, 'A network under continuous watch'),
          el('p', { class: 'section-sub' }, 'Cyber-Lens observes traffic patterns and threat indicators, so anomalies stand out the moment they appear.'),
        ]),
        el('div', { class: 'reveal' }, net),
      ])
    );

    container.appendChild(createFeatures());

    container.appendChild(
      el('section', { class: 'section', id: 'tips' }, [
        el('div', { class: 'section-head reveal' }, [
          el('p', { class: 'section-kicker' }, 'Stay ahead'),
          el('h2', { class: 'section-title' }, 'Security habits that matter'),
        ]),
        el(
          'div',
          { class: 'panel glass reveal' },
          el(
            'ul',
            { class: 'tips-list' },
            TIPS.map((tip) => el('li', {}, [el('span', { class: 'tip-icon', 'aria-hidden': 'true' }, '›'), el('span', {}, tip)]))
          )
        ),
      ])
    );

    container.appendChild(
      el('p', { class: 'trust-message' }, 'Cyber-Lens provides risk analysis and should not be treated as a guarantee of safety.')
    );

    this._stopReveals = observeReveals(container);
  },
};
