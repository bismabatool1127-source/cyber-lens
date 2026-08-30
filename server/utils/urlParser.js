/**
 * URL parsing + defang normalization.
 * Defanged forms (hxxp, h**p, [.]) are commonly used when people share
 * suspicious links safely; we restore them for analysis but NEVER fetch the URL.
 */

const DEFANG_SCHEME = /^(hxxp|h\*\*p)s?:\/\//i;
const DEFANG_DOT = /\[(\.|\[dot\]|dot)\]/gi;

export function refangInput(raw) {
  let s = String(raw).trim();
  let defanged = false;
  if (DEFANG_SCHEME.test(s)) {
    s = s.replace(DEFANG_SCHEME, (m) => (m.toLowerCase().startsWith('hxxps') || m.toLowerCase().startsWith('h**ps') ? 'https://' : 'http://'));
    defanged = true;
  }
  if (DEFANG_DOT.test(s)) {
    s = s.replace(DEFANG_DOT, '.');
    defanged = true;
  }
  if (/\[at\]/i.test(s)) {
    s = s.replace(/\[at\]/gi, '@');
    defanged = true;
  }
  return { text: s, defanged };
}

/**
 * Parse a URL defensively. Returns null when the value cannot be parsed.
 * Never throws. Never performs any network access.
 */
export function parseUrl(raw) {
  const { text, defanged } = refangInput(raw);
  let candidate = text;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate)) candidate = `http://${candidate}`;

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (!hostname) return null;

  return {
    raw: String(raw).trim(),
    href: parsed.href,
    protocol: parsed.protocol.replace(':', ''),
    hostname,
    port: parsed.port,
    pathname: parsed.pathname,
    search: parsed.search,
    userinfo: parsed.username ? `${parsed.username}${parsed.password ? ':***' : ''}` : null,
    defanged,
  };
}

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function isIpLiteral(hostname) {
  if (hostname.includes(':')) return true; // IPv6 (URL brackets already stripped by .hostname)
  const m = hostname.match(IPV4);
  if (!m) return false;
  return m.slice(1, 5).every((octet) => Number(octet) <= 255);
}

/** Defang a URL for safe display: never render user-supplied links as clickable. */
export function defangForDisplay(urlText) {
  return String(urlText)
    .replace(/^https?:\/\//i, (m) => (m.toLowerCase().startsWith('https') ? 'hxxps://' : 'hxxp://'))
    .replace(/\./g, '[.]');
}
