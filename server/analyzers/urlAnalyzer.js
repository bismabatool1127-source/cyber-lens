import { parseUrl } from '../utils/urlParser.js';
import { urlHash } from '../utils/urlHash.js';
import { URL_INDICATORS } from './indicators/urlIndicators.js';
import { evaluate } from '../services/riskEngine.js';

/**
 * Full URL analysis: structural indicators + threat-intelligence matching.
 * Returns the standardized risk result from the central risk engine.
 */
export function analyzeUrl(rawUrl, threatIntel) {
  const parsed = parseUrl(rawUrl);
  if (!parsed) return null;

  const indicators = URL_INDICATORS.map((check) => check(parsed));

  // Threat-intelligence matching: exact URL first, then the domain and its parents.
  const urlMatch = typeof threatIntel?.lookupUrl === 'function' ? threatIntel.lookupUrl(urlHash(rawUrl)) : null;
  let domainMatch = null;
  const labels = parsed.hostname.split('.');
  for (let i = 0; i <= labels.length - 2 && !domainMatch; i++) {
    domainMatch = (typeof threatIntel?.lookupDomain === 'function' ? threatIntel.lookupDomain(labels.slice(i).join('.')) : null);
  }

  if (urlMatch) {
    indicators.push({
      name: 'known-malicious-url',
      weight: 95,
      triggered: true,
      detail: 'This exact link matches a known malicious record in threat intelligence',
    });
  } else if (domainMatch) {
    indicators.push({
      name: 'known-risky-domain',
      weight: 90,
      triggered: true,
      detail: 'This website name matches a known risky record in threat intelligence',
    });
  }

  return evaluate(indicators, { type: 'url' });
}
