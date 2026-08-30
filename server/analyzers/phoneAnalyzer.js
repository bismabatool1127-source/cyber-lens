import { normalizePhone, phoneIndicators } from './indicators/phoneIndicators.js';
import { evaluate } from '../services/riskEngine.js';

export function analyzePhone(rawPhone, threatIntel) {
  const normalized = normalizePhone(rawPhone);
  const indicators = phoneIndicators(normalized);

  const known =
    normalized.e164 && typeof threatIntel?.lookupPhone === 'function' ? threatIntel.lookupPhone(normalized.e164) : null;
  if (known) {
    indicators.push({
      name: 'known-risk-number',
      weight: 90,
      triggered: true,
      detail: 'This number matches a known suspicious record in threat intelligence',
    });
  }
  if (normalized.country) {
    indicators.push({
      name: 'format-valid',
      weight: 0,
      triggered: true,
      detail: `Format is valid (${normalized.country.country}, ${normalized.e164})`,
    });
  }

  const result = evaluate(indicators, { type: 'phone' });
  return { ...result, normalized: normalized.e164 };
}
