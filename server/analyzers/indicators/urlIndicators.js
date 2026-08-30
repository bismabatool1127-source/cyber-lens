import { levenshtein } from '../../utils/levenshtein.js';
import { isIpLiteral } from '../../utils/urlParser.js';

/**
 * Brand names protected by typosquatting/impersonation checks, and their
 * genuine primary domains (used to avoid false positives).
 */
export const BRANDS = Object.freeze([
  { name: 'google', domain: 'google.com' },
  { name: 'facebook', domain: 'facebook.com' },
  { name: 'amazon', domain: 'amazon.com' },
  { name: 'apple', domain: 'apple.com' },
  { name: 'microsoft', domain: 'microsoft.com' },
  { name: 'paypal', domain: 'paypal.com' },
  { name: 'netflix', domain: 'netflix.com' },
  { name: 'instagram', domain: 'instagram.com' },
  { name: 'twitter', domain: 'twitter.com' },
  { name: 'linkedin', domain: 'linkedin.com' },
  { name: 'whatsapp', domain: 'whatsapp.com' },
  { name: 'snapchat', domain: 'snapchat.com' },
  { name: 'dropbox', domain: 'dropbox.com' },
  { name: 'adobe', domain: 'adobe.com' },
  { name: 'yahoo', domain: 'yahoo.com' },
  { name: 'ebay', domain: 'ebay.com' },
  { name: 'walmart', domain: 'walmart.com' },
  { name: 'chase', domain: 'chase.com' },
  { name: 'wellsfargo', domain: 'wellsfargo.com' },
  { name: 'steam', domain: 'steampowered.com' },
]);

const SUSPICIOUS_TLDS = new Set([
  'tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'top', 'buzz', 'click', 'link',
  'work', 'cyou', 'icu', 'rest', 'surf', 'quest', 'monster',
]);

const FREE_HOSTS = [
  'github.io', 'netlify.app', 'vercel.app', 'herokuapp.com', 'firebaseapp.com',
  'web.app', 'pages.dev', 'glitch.me', 'repl.co', 'weebly.com', 'wixsite.com',
];

const CREDENTIAL_KEYWORDS = [
  'login', 'signin', 'sign-in', 'logon', 'verify', 'verification', 'secure',
  'account', 'password', 'credential', 'banking', 'unlock', 'authenticate',
  'webscr', 'update-info', 'confirm-identity',
];

export function sldOf(hostname) {
  const labels = hostname.split('.');
  return labels.length >= 2 ? labels[labels.length - 2] : hostname;
}

export function tldOf(hostname) {
  const labels = hostname.split('.');
  return labels[labels.length - 1];
}

function isGenuineDomain(hostname) {
  return BRANDS.some((b) => hostname === b.domain || hostname.endsWith(`.${b.domain}`));
}

function ind(name, weight, detail) {
  return { name, weight, triggered: true, detail };
}

function off(name, weight) {
  return { name, weight, triggered: false, detail: null };
}

/** Each check is a pure function: (parsed) => indicator object. */
export const URL_INDICATORS = [
  function ipLiteralHost(p) {
    return isIpLiteral(p.hostname)
      ? ind('ip-literal-host', 25, 'Uses a raw IP address instead of a normal website name')
      : off('ip-literal-host', 25);
  },

  function punycodeHost(p) {
    const hit = p.hostname.split('.').some((label) => label.startsWith('xn--'));
    return hit
      ? ind('punycode-host', 20, 'Domain is encoded in internationalized (punycode) format, a common trick to imitate real names')
      : off('punycode-host', 20);
  },

  function typosquatBrand(p) {
    if (isGenuineDomain(p.hostname)) return off('typosquat-brand', 30);
    const tokens = sldOf(p.hostname).split(/[-_]+/).filter(Boolean);
    for (const b of BRANDS) {
      for (const token of tokens) {
        const d = levenshtein(token, b.name);
        if (d >= 1 && d <= 2) {
          return ind('typosquat-brand', 30, `Domain name closely resembles "${b.name}" (likely imitation)`);
        }
      }
    }
    return off('typosquat-brand', 30);
  },

  function brandKeywordInHost(p) {
    if (isGenuineDomain(p.hostname)) return off('brand-keyword-host', 25);
    const sld = sldOf(p.hostname);
    const labels = p.hostname.split('.').slice(0, -2).join('.');
    for (const b of BRANDS) {
      const inSld = sld !== b.name && sld.includes(b.name);
      const inSub = labels.includes(b.name);
      if (inSld || inSub) {
        return ind('brand-keyword-host', 25, `Uses the "${b.name}" name but is not the official ${b.domain} website`);
      }
    }
    return off('brand-keyword-host', 25);
  },

  function credentialKeywordsInPath(p) {
    const target = `${p.pathname}${p.search}`.toLowerCase();
    const hits = CREDENTIAL_KEYWORDS.filter((k) => target.includes(k));
    return hits.length > 0
      ? ind('credential-keywords-path', 20, 'Link path uses sign-in / verification wording typical of fake login pages')
      : off('credential-keywords-path', 20);
  },

  function suspiciousTld(p) {
    return SUSPICIOUS_TLDS.has(tldOf(p.hostname))
      ? ind('suspicious-tld', 15, `Uses a top-level domain (".${tldOf(p.hostname)}") frequently abused for phishing`)
      : off('suspicious-tld', 15);
  },

  function insecureScheme(p) {
    return p.protocol === 'http'
      ? ind('http-scheme', 15, 'Connection is not encrypted (http instead of https)')
      : off('http-scheme', 15);
  },

  function atSignInUrl(p) {
    return p.userinfo
      ? ind('at-sign-in-url', 15, 'Contains an "@" symbol, which can hide the real destination site')
      : off('at-sign-in-url', 15);
  },

  function deepSubdomains(p) {
    const subLevels = p.hostname.split('.').length - 2;
    return subLevels >= 3
      ? ind('excessive-subdomains', 15, `Unusually deep address structure (${subLevels} subdomain levels)`)
      : off('excessive-subdomains', 15);
  },

  function doubleExtension(p) {
    const lastSegment = p.pathname.split('/').filter(Boolean).pop() ?? '';
    const hit = /\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png|gif|txt)\.(exe|js|php|scr|bat|cmd|vbs|jar|pif|html?)$/i.test(lastSegment);
    return hit
      ? ind('double-extension', 15, 'File name disguises its real type (double extension)')
      : off('double-extension', 15);
  },

  function excessiveEncoding(p) {
    const target = `${p.pathname}${p.search}`;
    if (target.length < 20) return off('encoded-chars-excessive', 15);
    const encoded = (target.match(/%/g) ?? []).length * 3;
    return encoded / target.length > 0.2
      ? ind('encoded-chars-excessive', 15, 'Contains an unusually high amount of encoded characters')
      : off('encoded-chars-excessive', 15);
  },

  function freeHosting(p) {
    const hit = FREE_HOSTS.some((host) => p.hostname === host || p.hostname.endsWith(`.${host}`));
    return hit
      ? ind('free-hosting', 10, 'Hosted on a free website platform commonly abused for phishing pages')
      : off('free-hosting', 10);
  },

  function veryLongUrl(p) {
    return p.raw.length > 500
      ? ind('url-length', 10, 'URL is unusually long, which can hide its true destination')
      : off('url-length', 10);
  },

  function nonStandardPort(p) {
    const hit = p.port !== '' && p.port !== '80' && p.port !== '443';
    return hit
      ? ind('non-standard-port', 10, `Connects through an unusual network port (:${p.port})`)
      : off('non-standard-port', 10);
  },

  function defangedInput(p) {
    return p.defanged
      ? ind('defanged-input', 10, 'The link was shared in a deliberately disabled ("defanged") format, which suggests someone already distrusted it')
      : off('defanged-input', 10);
  },
];
