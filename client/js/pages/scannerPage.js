import { el } from '../components/el.js';
import { createScannerConsole } from '../components/scannerConsole.js';

/** Focused scanner page: the unified console with one mode preselected. */
export function makeScannerPage({ title, subtitle, mode }) {
  return {
    render(container) {
      const scanner = createScannerConsole({ initialMode: mode });
      container.appendChild(
        el('div', { class: 'scanner-page' }, [
          el('a', { class: 'back-link', href: '#/' }, '← Back to home'),
          el('div', { class: 'scanner-page-head' }, [
            el('h1', { class: 'scanner-title' }, title),
            el('p', { class: 'scanner-subtitle' }, subtitle),
          ]),
          scanner.element,
        ])
      );
    },
  };
}
