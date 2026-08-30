import { el } from '../components/el.js';
import { createAnalyzingState } from '../components/analyzingState.js';
import { renderResultCard } from '../components/resultCard.js';
import { wireScannerForm } from '../components/scannerForm.js';

function isValidUrlInput(value) {
  if (!value) return false;
  let candidate = value.trim().replace(/^hxxps?:\/\//i, (m) => m.toLowerCase().replace('hxxp', 'http'));
  candidate = candidate.replace(/\[\.\]/g, '.');
  if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate)) candidate = `http://${candidate}`;
  try {
    const u = new URL(candidate);
    return (u.protocol === 'http:' || u.protocol === 'https:') && Boolean(u.hostname);
  } catch {
    return false;
  }
}

export const urlScannerPage = {
  render(container) {
    const analyzing = createAnalyzingState();

    const input = el('input', {
      class: 'input',
      id: 'url-input',
      type: 'text',
      name: 'url',
      placeholder: 'Enter URL…',
      autocomplete: 'off',
      spellcheck: 'false',
      maxLength: 2048,
      'aria-describedby': 'url-input-error',
    });

    const button = el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'ANALYZE URL');

    const form = el('form', { noValidate: true, class: 'scanner-form' }, [
      el('div', { class: 'field' }, [
        el('label', { class: 'field-label', htmlFor: 'url-input' }, [
          'Suspicious link',
          el('span', { class: 'field-hint' }, 'Cyber-Lens analyzes the link safely — it never opens it.'),
        ]),
        input,
        el('p', { class: 'field-error', id: 'url-input-error', role: 'alert' }),
      ]),
      button,
    ]);

    const output = el('div', { class: 'scanner-output', 'aria-live': 'polite' });

    container.appendChild(
      el('div', { class: 'scanner-page' }, [
        el('a', { class: 'back-link', href: '#/' }, '← Back to home'),
        el('div', { class: 'scanner-card' }, [
          el('h1', { class: 'scanner-title' }, 'URL Security Scanner'),
          el('p', { class: 'scanner-subtitle' }, 'Paste a suspicious link and Cyber-Lens will analyze it.'),
          form,
        ]),
        output,
      ])
    );

    wireScannerForm({
      form,
      button,
      output,
      analyzing,
      endpoint: '/scan/url',
      buildPayload: () => ({ url: input.value.trim() }),
      validate: () => {
        const value = input.value.trim();
        if (!value) return { 'url-input': 'Please enter a URL to analyze.' };
        if (!isValidUrlInput(value)) return { 'url-input': 'Please enter a valid URL.' };
        return {};
      },
      renderResult: (result) =>
        renderResultCard(result, {
          scanType: 'url',
          actions: el('div', { class: 'result-actions' }, [
            el(
              'button',
              {
                class: 'btn btn-ghost',
                type: 'button',
                onclick: () => {
                  output.innerHTML = '';
                  input.value = '';
                  input.focus();
                },
              },
              'SCAN ANOTHER URL'
            ),
          ]),
        }),
    });
  },
};
