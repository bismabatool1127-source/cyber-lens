import { el } from '../components/el.js';
import { createAnalyzingState } from '../components/analyzingState.js';
import { renderResultCard } from '../components/resultCard.js';
import { wireScannerForm } from '../components/scannerForm.js';
import { defangForDisplay } from '../utils/defang.js';

function extractedLinksPanel(extractedUrls) {
  if (!extractedUrls || extractedUrls.length === 0) return null;
  return el('div', { class: 'result-section' }, [
    el('h3', {}, `Detected links — ${extractedUrls.length} link${extractedUrls.length === 1 ? '' : 's'} analyzed`),
    el(
      'ul',
      { class: 'extracted-links' },
      extractedUrls.map((u) =>
        el('li', { class: 'extracted-link' }, [
          el('span', {}, defangForDisplay(u.url)),
          el('span', { class: `badge badge-${u.classification}` }, u.classification === 'LOW' ? 'LOW RISK' : u.classification),
        ])
      )
    ),
  ]);
}

export const emailScannerPage = {
  render(container) {
    const analyzing = createAnalyzingState();

    const sender = el('input', { class: 'input', id: 'email-sender', type: 'text', placeholder: 'e.g. security@bank.com', autocomplete: 'off', spellcheck: 'false', maxLength: 320, 'aria-describedby': 'email-sender-error' });
    const subject = el('input', { class: 'input', id: 'email-subject', type: 'text', placeholder: 'e.g. Urgent: verify your account', autocomplete: 'off', maxLength: 1000 });
    const body = el('textarea', { class: 'textarea', id: 'email-body', placeholder: 'Paste the full email message here…', maxLength: 50000, 'aria-describedby': 'email-body-error' });
    const button = el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'ANALYZE EMAIL');

    const form = el('form', { noValidate: true }, [
      el('div', { class: 'field' }, [
        el('label', { class: 'field-label', htmlFor: 'email-sender' }, "Sender email"),
        sender,
        el('p', { class: 'field-error', id: 'email-sender-error', role: 'alert' }),
      ]),
      el('div', { class: 'field' }, [
        el('label', { class: 'field-label', htmlFor: 'email-subject' }, ['Subject', el('span', { class: 'field-hint' }, 'Optional')]),
        subject,
      ]),
      el('div', { class: 'field' }, [
        el('label', { class: 'field-label', htmlFor: 'email-body' }, 'Email body'),
        body,
        el('p', { class: 'field-error', id: 'email-body-error', role: 'alert' }),
      ]),
      button,
    ]);

    const output = el('div', { class: 'scanner-output', 'aria-live': 'polite' });

    container.appendChild(
      el('div', { class: 'scanner-page' }, [
        el('a', { class: 'back-link', href: '#/' }, '← Back to home'),
        el('div', { class: 'scanner-card' }, [
          el('h1', { class: 'scanner-title' }, 'Email Security Scanner'),
          el('p', { class: 'scanner-subtitle' }, 'Cyber-Lens will examine the sender, message content and links found inside the email.'),
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
      endpoint: '/scan/email',
      buildPayload: () => ({ sender: sender.value.trim(), subject: subject.value.trim(), body: body.value }),
      validate: () => {
        const errors = {};
        if (!sender.value.trim()) errors['email-sender'] = "Please enter the sender's email address.";
        if (!body.value.trim()) errors['email-body'] = 'Please paste the email message to analyze.';
        return errors;
      },
      renderResult: (result) =>
        renderResultCard(result, {
          scanType: 'email',
          extra: extractedLinksPanel(result.extractedUrls),
          actions: el('div', { class: 'result-actions' }, [
            el(
              'button',
              {
                class: 'btn btn-ghost',
                type: 'button',
                onclick: () => {
                  output.innerHTML = '';
                  form.reset();
                  sender.focus();
                },
              },
              'SCAN ANOTHER EMAIL'
            ),
          ]),
        }),
    });
  },
};
