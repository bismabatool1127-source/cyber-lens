/** Redaction helpers. Scan input is never persisted; these keep summaries safe too. */

export function truncate(text, max = 80) {
  const s = String(text ?? '');
  return s.length <= max ? s : `${s.slice(0, max)}…`;
}

export function redactDomain(domain) {
  const s = String(domain ?? '');
  if (s.length <= 6) return s;
  return `${s.slice(0, 3)}***${s.slice(-4)}`;
}

export function redactEmail(email) {
  const s = String(email ?? '');
  const at = s.lastIndexOf('@');
  if (at <= 0) return truncate(s, 3) + '***';
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  return `${local.slice(0, 1)}***@${redactDomain(domain)}`;
}

export function redactPhone(phone) {
  const s = String(phone ?? '').replace(/\D/g, '');
  if (s.length < 4) return '***';
  return `+${s.slice(0, 2)}***${s.slice(-3)}`;
}
