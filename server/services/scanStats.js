/**
 * In-memory counters for the public dashboard. Additive only: they observe
 * the same scan summaries already recorded for recent-scans and never alter
 * analysis behavior. Not persisted — counts reset with the process.
 */

const totals = { total: 0, LOW: 0, SUSPICIOUS: 0, HIGH: 0, url: 0, email: 0, phone: 0 };

export function countScan(summary) {
  totals.total += 1;
  if (summary.classification in totals) totals[summary.classification] += 1;
  if (summary.type in totals) totals[summary.type] += 1;
}

export function scanStats() {
  return {
    total: totals.total,
    safe: totals.LOW,
    suspicious: totals.SUSPICIOUS,
    malicious: totals.HIGH,
    byType: { url: totals.url, email: totals.email, phone: totals.phone },
  };
}

export function resetStats() {
  totals.total = 0;
  totals.LOW = 0;
  totals.SUSPICIOUS = 0;
  totals.HIGH = 0;
  totals.url = 0;
  totals.email = 0;
  totals.phone = 0;
}
