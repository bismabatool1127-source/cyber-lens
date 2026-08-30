/**
 * Centralized risk engine. All scanners funnel their indicators here so scoring,
 * classification and recommendation logic lives in exactly one place.
 */

export const CLASSIFICATION = Object.freeze({ LOW: 'LOW', SUSPICIOUS: 'SUSPICIOUS', HIGH: 'HIGH' });

const THRESHOLDS = Object.freeze({ HIGH: 70, SUSPICIOUS: 35 });

const RECOMMENDATIONS = Object.freeze({
  url: {
    LOW: 'No known threat detected. Still, stay alert — new malicious links appear every day.',
    SUSPICIOUS: 'Avoid opening this link until its source is verified through an independent channel.',
    HIGH: 'Do not open this link or enter any personal information.',
  },
  email: {
    LOW: 'No known threat detected. Remain cautious with unexpected requests or attachments.',
    SUSPICIOUS: 'Treat this email with caution. Verify the sender through an independent trusted source.',
    HIGH: 'Do not click links, open attachments, or provide sensitive information. Delete this email.',
  },
  phone: {
    LOW: 'No known threat detected. Stay cautious with unexpected calls asking for personal details.',
    SUSPICIOUS: 'Verify the caller through an independent trusted source before sharing anything.',
    HIGH: 'Do not share personal or financial information with this number. Block it if it persists.',
  },
});

/**
 * @param {Array<{name:string, weight:number, detail?:string|null}>} indicators triggered indicators
 * @param {{type:'url'|'email'|'phone'}} ctx
 */
export function evaluate(indicators, ctx) {
  const type = ctx?.type ?? 'url';
  const triggered = indicators.filter((i) => i.triggered !== false && i.weight > 0);
  const informational = indicators.filter((i) => i.triggered !== false && i.weight === 0);

  const score = Math.min(100, triggered.reduce((sum, i) => sum + i.weight, 0));
  const classification =
    score >= THRESHOLDS.HIGH ? CLASSIFICATION.HIGH : score >= THRESHOLDS.SUSPICIOUS ? CLASSIFICATION.SUSPICIOUS : CLASSIFICATION.LOW;

  const confidence =
    score >= 85 || triggered.length >= 4 ? 'high' : score >= 50 || triggered.length >= 2 ? 'medium' : 'low';

  return {
    classification,
    riskScore: score,
    confidence,
    reasons: [...triggeredToReasons(triggered), ...informational.map((i) => i.detail || i.name)],
    recommendation: RECOMMENDATIONS[type][classification],
    indicators: [...triggered, ...informational],
  };
}

function triggeredToReasons(triggered) {
  return triggered
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .map((i) => i.detail || i.name);
}

/** Merge a base result with an extra score contribution (e.g., URL findings inside an email). */
export function combineScores(baseScore, extraScore, factor) {
  return Math.min(100, Math.round(baseScore + extraScore * factor));
}
