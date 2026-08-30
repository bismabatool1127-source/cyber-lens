import { el } from '../components/el.js';
import { createAnalyzingState } from '../components/analyzingState.js';
import { renderResultCard } from '../components/resultCard.js';
import { wireScannerForm } from '../components/scannerForm.js';

export const phoneScannerPage = {
  render(container) {
    const analyzing = createAnalyzingState();

    const input = el('input', {
      class: 'input',
      id: 'phone-input',
      type: 'tel',
      placeholder: 'Enter phone number…',
      autocomplete: 'off',
      maxLength: 30,
      'aria-describedby': 'phone-input-error phone-input-hint',
    });

    const button = el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'CHECK NUMBER');

    const form = el('form', { noValidate: true }, [
      el('div', { class: 'field' }, [
        el('label', { class: 'field-label', htmlFor: 'phone-input' }, [
          'Phone number',
          el('span', { class: 'field-hint', id: 'phone-input-hint' }, 'Include the country code when possible, e.g. +92 300 1234567.'),
        ]),
        input,
        el('p', { class: 'field-error', id: 'phone-input-error', role: 'alert' }),
      ]),
      button,
    ]);

    const output = el('div', { class: 'scanner-output', 'aria-live': 'polite' });

    container.appendChild(
      el('div', { class: 'scanner-page' }, [
        el('a', { class: 'back-link', href: '#/' }, '← Back to home'),
        el('div', { class: 'scanner-card' }, [
          el('h1', { class: 'scanner-title' }, 'Phone Number Security Check'),
          el('p', { class: 'scanner-subtitle' }, 'Check a phone number for suspicious indicators.'),
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
      endpoint: '/scan/phone',
      buildPayload: () => ({ phone: input.value.trim() }),
      validate: () => {
        const value = input.value.trim();
        if (!value) return { 'phone-input': 'Please enter a phone number to check.' };
        if (!/^[0-9+()\s.\-]+$/.test(value)) return { 'phone-input': 'Please enter a valid phone number (digits, spaces, +, - and parentheses only).' };
        return {};
      },
      renderResult: (result) =>
        renderResultCard(result, {
          scanType: 'phone',
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
              'CHECK ANOTHER NUMBER'
            ),
          ]),
        }),
    });
  },
};
