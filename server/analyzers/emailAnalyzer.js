import { parseSender, senderIndicators, bodyIndicators, extractUrls } from './indicators/emailIndicators.js';
import { analyzeUrl } from './urlAnalyzer.js';
import { evaluate } from '../services/riskEngine.js';

/**
 * Email analysis: sender characteristics + social-engineering indicators +
 * analysis of every link found in the body (reusing the URL engine).
 */
export function analyzeEmail({ sender, subject = '', body }, threatIntel) {
  const parsedSender = parseSender(sender);
  const bodyRaw = String(body ?? '');
  const bodyLower = bodyRaw.toLowerCase();
  const subjectText = String(subject ?? '');

  const indicators = [
    ...senderIndicators(parsedSender, subjectText, bodyLower, threatIntel),
    ...bodyIndicators(subjectText, bodyLower, bodyRaw),
  ];

  const subjectHits = typeof threatIntel?.matchSubjectKeywords === 'function' ? threatIntel.matchSubjectKeywords(subjectText) : [];
  if (subjectHits.length > 0) {
    indicators.push({
      name: 'known-subject-keyword',
      weight: 20,
      triggered: true,
      detail: `Subject line matches known phishing wording ("${subjectHits[0].pattern_value}")`,
    });
  }

  const bodyHits = typeof threatIntel?.matchBodyPhrases === 'function' ? threatIntel.matchBodyPhrases(bodyRaw) : [];
  if (bodyHits.length > 0) {
    indicators.push({
      name: 'known-body-phrase',
      weight: 15,
      triggered: true,
      detail: `Message matches known phishing wording ("${bodyHits[0].pattern_value}")`,
    });
  }

  // Links inside the email go through the same URL engine.
  const extractedUrls = extractUrls(bodyRaw).map((url) => {
    const r = analyzeUrl(url, threatIntel);
    return r ? { url, classification: r.classification, riskScore: r.riskScore } : null;
  }).filter(Boolean);

  if (extractedUrls.length > 0) {
    const worst = extractedUrls.reduce((a, b) => (b.riskScore > a.riskScore ? b : a));
    if (worst.riskScore > 0) {
      indicators.push({
        name: 'suspicious-links-in-email',
        weight: Math.round(worst.riskScore * 0.4),
        triggered: true,
        detail: `Contains ${extractedUrls.length} link${extractedUrls.length === 1 ? '' : 's'}; the most suspicious one scored ${worst.riskScore}/100`,
      });
    }
  }

  const result = evaluate(indicators, { type: 'email' });
  return { ...result, extractedUrls };
}
