/**
 * In-memory ring buffer of sanitized scan summaries for the dashboard.
 * Deliberately NOT persisted: user submissions are private and forgotten on restart.
 */

const CAPACITY = 10;
const buffer = [];

export function recordScan(summary) {
  buffer.unshift({ ...summary, timestamp: new Date().toISOString() });
  if (buffer.length > CAPACITY) buffer.length = CAPACITY;
}

export function listScans() {
  return buffer.slice();
}

export function clearScans() {
  buffer.length = 0;
}
