import { el } from './el.js';
import { svgIcon } from './icons.js';
import { createAnalyzingState } from './analyzingState.js';
import { renderResultCard } from './resultCard.js';
import { wireScannerForm } from './scannerForm.js';
import { defangForDisplay } from '../utils/defang.js';

/** The validation rules are the exact ones previously used by each scanner page. */

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

const MODES = [
  { id: 'email', label: 'Email Scan', icon: 'email' },
  { id: 'url', label: 'URL Scan', icon: 'url' },
  { id: 'phone', label: 'Phone Scan', icon: 'phone' },
];

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

/**
 * Unified three-mode scanner console. Owns the forms, the shared output area
 * and the status strip; reuses the existing wireScannerForm pipeline unchanged.
 *
 * @param {object} opts
 * @param {'url'|'email'|'phone'} [opts.initialMode]
 * @param {() => void} [opts.onScanStart]
 * @param {(result: object|null) => void} [opts.onScanResult]
 * @param {(text: string, state: string) => void} [opts.onStatus]
 */
export function createScannerConsole({ initialMode = 'url', onScanStart, onScanResult, onStatus } = {}) {
  const analyzing = createAnalyzingState();
  const output = el('div', { class: 'console-output', 'aria-live': 'polite' });

  const statusText = el('span', { class: 'console-status-text' }, 'Lens ready — choose a scan mode to begin.');
  const status = el('div', { class: 'console-status is-idle' }, [el('span', { class: 'status-dot', 'aria-hidden': 'true' }), statusText]);

  function setStatus(text, state) {
    statusText.textContent = text;
    status.className = `console-status ${state}`;
    onStatus?.(text, state);
  }

  const panes = {};
  const tabs = [];

  function activate(modeId) {
    tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.mode === modeId)));
    for (const [id, pane] of Object.entries(panes)) pane.classList.toggle('is-active', id === modeId);
  }

  const tabList = el('div', { class: 'console-tabs', role: 'tablist', 'aria-label': 'Scanner mode' });
  for (const mode of MODES) {
    const tab = el(
      'button',
      { class: 'console-tab', type: 'button', role: 'tab', 'data-mode': mode.id, 'aria-selected': 'false' },
      [svgIcon(mode.icon, 17), mode.label]
    );
    tab.addEventListener('click', () => activate(mode.id));
    tabs.push(tab);
    tabList.appendChild(tab);
  }
  tabList.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const idx = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    const next = e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
    tabs[next].focus();
    activate(tabs[next].dataset.mode);
    e.preventDefault();
  });

  /* ---- shared wiring ---- */
  const wire = (form, button, endpoint, buildPayload, validate, scanType, resetFn) =>
    wireScannerForm({
      form,
      button,
      output,
      analyzing,
      endpoint,
      buildPayload,
      validate,
      onStart: () => {
        setStatus('Analyzing target — running threat checks…', 'is-scanning');
        onScanStart?.();
      },
      onSettled: (result) => {
        if (result) {
          const label = result.classification === 'LOW' ? 'LOW RISK' : result.classification === 'HIGH' ? 'HIGH RISK' : 'SUSPICIOUS';
          setStatus(`Verdict: ${label} — risk score ${result.riskScore}/100`, `is-${result.classification.toLowerCase()}`);
        } else {
          setStatus('Analysis interrupted — lens ready for a new attempt.', 'is-idle');
        }
        onScanResult?.(result);
      },
      renderResult: (result) =>
        renderResultCard(result, {
          scanType,
          extra: scanType === 'email' ? extractedLinksPanel(result.extractedUrls) : null,
          actions: el('div', { class: 'result-actions' }, [
            el(
              'button',
              {
                class: 'btn btn-ghost',
                type: 'button',
                onclick: () => {
                  output.innerHTML = '';
                  resetFn();
                  setStatus('Lens ready — choose a scan mode to begin.', 'is-idle');
                },
              },
              'Scan another'
            ),
          ]),
        }),
    });

  /* ---- URL pane ---- */
  const urlInput = el('input', {
    class: 'input',
    id: 'url-input',
    type: 'text',
    name: 'url',
    placeholder: 'https://suspicious-link.example.com/page',
    autocomplete: 'off',
    spellcheck: 'false',
    maxLength: 2048,
    'aria-describedby': 'url-input-error',
  });
  const urlButton = el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, [svgIcon('radar', 18), 'Analyze URL']);
  const urlForm = el('form', { noValidate: true }, [
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label', htmlFor: 'url-input' }, [
        'Suspicious link',
        el('span', { class: 'field-hint' }, 'Cyber-Lens analyzes the link safely — it never opens it.'),
      ]),
      urlInput,
      el('p', { class: 'field-error', id: 'url-input-error', role: 'alert' }),
    ]),
    urlButton,
  ]);
  wire(
    urlForm,
    urlButton,
    '/scan/url',
    () => ({ url: urlInput.value.trim() }),
    () => {
      const value = urlInput.value.trim();
      if (!value) return { 'url-input': 'Please enter a URL to analyze.' };
      if (!isValidUrlInput(value)) return { 'url-input': 'Please enter a valid URL.' };
      return {};
    },
    'url',
    () => {
      urlInput.value = '';
      urlInput.focus();
    }
  );
  panes.url = el('div', { class: 'console-pane', role: 'tabpanel' }, urlForm);

  /* ---- Email pane ---- */
  const sender = el('input', {
    class: 'input',
    id: 'email-sender',
    type: 'text',
    placeholder: 'e.g. security@bank.com',
    autocomplete: 'off',
    spellcheck: 'false',
    maxLength: 320,
    'aria-describedby': 'email-sender-error',
  });
  const subject = el('input', { class: 'input', id: 'email-subject', type: 'text', placeholder: 'e.g. Urgent: verify your account', autocomplete: 'off', maxLength: 1000 });
  const body = el('textarea', { class: 'textarea', id: 'email-body', placeholder: 'Paste the full email message here…', maxLength: 50000, 'aria-describedby': 'email-body-error' });
  const emailButton = el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, [svgIcon('radar', 18), 'Analyze Email']);
  const emailForm = el('form', { noValidate: true }, [
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label', htmlFor: 'email-sender' }, 'Sender email'),
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
    emailButton,
  ]);
  wire(
    emailForm,
    emailButton,
    '/scan/email',
    () => ({ sender: sender.value.trim(), subject: subject.value.trim(), body: body.value }),
    () => {
      const errors = {};
      if (!sender.value.trim()) errors['email-sender'] = "Please enter the sender's email address.";
      if (!body.value.trim()) errors['email-body'] = 'Please paste the email message to analyze.';
      return errors;
    },
    'email',
    () => {
      emailForm.reset();
      sender.focus();
    }
  );
  panes.email = el('div', { class: 'console-pane', role: 'tabpanel' }, emailForm);

  /* ---- Phone pane ---- */
  const phoneInput = el('input', {
    class: 'input',
    id: 'phone-input',
    type: 'tel',
    placeholder: 'e.g. +92 300 1234567',
    autocomplete: 'off',
    maxLength: 30,
    'aria-describedby': 'phone-input-error phone-input-hint',
  });
  const phoneButton = el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, [svgIcon('radar', 18), 'Check Number']);
  const phoneForm = el('form', { noValidate: true }, [
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label', htmlFor: 'phone-input' }, [
        'Phone number',
        el('span', { class: 'field-hint', id: 'phone-input-hint' }, 'Include the country code when possible, e.g. +92 300 1234567.'),
      ]),
      phoneInput,
      el('p', { class: 'field-error', id: 'phone-input-error', role: 'alert' }),
    ]),
    phoneButton,
  ]);
  wire(
    phoneForm,
    phoneButton,
    '/scan/phone',
    () => ({ phone: phoneInput.value.trim() }),
    () => {
      const value = phoneInput.value.trim();
      if (!value) return { 'phone-input': 'Please enter a phone number to check.' };
      if (!/^[0-9+()\s.\-]+$/.test(value)) return { 'phone-input': 'Please enter a valid phone number (digits, spaces, +, - and parentheses only).' };
      return {};
    },
    'phone',
    () => {
      phoneInput.value = '';
      phoneInput.focus();
    }
  );
  panes.phone = el('div', { class: 'console-pane', role: 'tabpanel' }, phoneForm);

  const consoleEl = el('div', { class: 'console glass', id: 'scanner-console' }, [
    tabList,
    el('div', { class: 'console-body' }, [panes.url, panes.email, panes.phone, output]),
    status,
  ]);

  activate(initialMode);

  return { element: consoleEl, activate, setStatus };
}
