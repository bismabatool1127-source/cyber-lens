import { apiPost } from '../api.js';
import { showToast } from './toast.js';

/**
 * Shared submit pipeline for every scanner form: client validation, inline errors,
 * analyzing state, API call, friendly server-error handling.
 *
 * @param {object} opts
 * @param {HTMLFormElement} opts.form
 * @param {HTMLButtonElement} opts.button
 * @param {HTMLElement} opts.output       container for analyzing panel + result card
 * @param {{element:HTMLElement,start():void,stop():void}} opts.analyzing
 * @param {string} opts.endpoint          e.g. '/scan/url'
 * @param {() => object} opts.buildPayload
 * @param {() => Record<string,string>} opts.validate  returns map of fieldId -> error message (empty when ok)
 * @param {(result:object) => Node} opts.renderResult
 */
export function wireScannerForm({ form, button, output, analyzing, endpoint, buildPayload, validate, renderResult }) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const errors = validate();
    let firstInvalid = null;
    for (const [fieldId, message] of Object.entries(errors)) {
      const field = document.getElementById(fieldId);
      const errorEl = document.getElementById(`${fieldId}-error`);
      if (field) field.setAttribute('aria-invalid', 'true');
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('visible');
      }
      firstInvalid ??= field;
    }
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    for (const field of form.querySelectorAll('[aria-invalid]')) field.removeAttribute('aria-invalid');
    form.querySelectorAll('.field-error.visible').forEach((n) => n.classList.remove('visible'));

    button.disabled = true;
    output.innerHTML = '';
    output.appendChild(analyzing.element);
    analyzing.start();

    try {
      const result = await apiPost(endpoint, buildPayload());
      output.innerHTML = '';
      output.appendChild(renderResult(result));
      output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      output.innerHTML = '';
      showToast(err.message || "We couldn't complete the analysis right now. Please try again.", 'error');
    } finally {
      analyzing.stop();
      button.disabled = false;
    }
  });
}
