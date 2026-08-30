import { levenshtein } from '../../utils/levenshtein.js';
import { BRANDS, sldOf } from './urlIndicators.js';

export const FREEMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'live.com',
  'mail.com', 'proton.me', 'protonmail.com', 'icloud.com', 'gmx.com', 'yandex.com',
]);

export const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'temp-mail.org', 'guerrillamail.com', '10minutemail.com',
  'throwawaymail.com', 'yopmail.com', 'sharklasers.com', 'getnada.com', 'dispostable.com',
  'fakeinbox.com', 'maildrop.cc', 'trashmail.com', 'mintemail.com', 'mytemp.email',
]);

const URGENCY_PHRASES = [
  'immediately', 'urgent', 'act now', 'within 24 hours', 'within 48 hours', 'expires soon',
  'limited time', "don't delay", 'do not delay', 'right away', 'as soon as possible',
  'final notice', 'last chance', 'will be suspended', 'will be closed', 'will be deleted',
];

const SENSITIVE_REQUESTS = [
  'verify your password', 'confirm your password', 'enter your credit card', 'credit card number',
  'provide your pin', 'share your otp', 'one-time code', 'bank account details',
  'social security number', 'your ssn', 'date of birth', "mother's maiden", 'cvv',
  'account number and password', 'send money', 'gift card',
];

const THREAT_PHRASES = [
  'unauthorized access detected', 'suspicious activity', 'violation of terms', 'legal action',
  'report to authorities', 'your account will be closed', 'your account will be suspended',
  'we detected unusual sign-in', 'attempted breach',
];

const GENERIC_GREETINGS = [
  'dear customer', 'dear user', 'dear account holder', 'hello member', 'dear valued customer',
  'dear sir/madam', 'dear sir or madam', 'to whom it may concern', 'dear client',
];

const ATTACHMENT_PHRASES = [
  'attached invoice', 'see attached receipt', 'download attachment', 'open the document',
  'attached file', 'please open the attached', 'invoice attached',
];

export function parseSender(raw) {
  const text = String(raw ?? '').trim();
  const angled = text.match(/<([^>]+)>/);
  const address = (angled ? angled[1] : text).trim();
  const displayName = angled ? text.replace(/<[^>]*>/, '').trim() : '';
  const at = address.lastIndexOf('@');
  const domain = at > 0 ? address.slice(at + 1).toLowerCase() : null;
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(address);
  return { raw: text, address, displayName, domain, valid };
}

function ind(name, weight, detail) {
  return { name, weight, triggered: true, detail };
}
function off(name, weight) {
  return { name, weight, triggered: false, detail: null };
}

export function senderIndicators(sender, subject, bodyLower, threatIntel) {
  const out = [];

  out.push(
    sender.valid
      ? off('invalid-sender-format', 10)
      : ind('invalid-sender-format', 10, 'The sender address is not a properly formatted email address')
  );

  const domain = sender.domain;
  if (domain) {
    out.push(
      DISPOSABLE_DOMAINS.has(domain)
        ? ind('disposable-sender-domain', 30, 'Sent from a disposable/temporary email service')
        : off('disposable-sender-domain', 30)
    );

    const genuine = BRANDS.some((b) => domain === b.domain || domain.endsWith(`.${b.domain}`));
    const tokens = sldOf(domain).split(/[-_]+/).filter(Boolean);
    let lookalike = null;
    if (!genuine) {
      for (const b of BRANDS) {
        for (const token of tokens) {
          const d = levenshtein(token, b.name);
          if (d >= 1 && d <= 2) lookalike = b.name;
        }
      }
    }
    out.push(
      lookalike
        ? ind('lookalike-sender-domain', 25, `Sender domain closely resembles "${lookalike}" but is not the official domain`)
        : off('lookalike-sender-domain', 25)
    );

    const claimedBrand = BRANDS.find(
      (b) => bodyLower.includes(b.name) || subject.toLowerCase().includes(b.name)
    );
    out.push(
      FREEMAIL_DOMAINS.has(domain) && claimedBrand
        ? ind('freemail-for-brand', 25, `Claims to relate to "${claimedBrand.name}" but was sent from a free personal email address`)
        : off('freemail-for-brand', 25)
    );

    const displayBrand = sender.displayName
      ? BRANDS.find((b) => sender.displayName.toLowerCase().includes(b.name))
      : null;
    out.push(
      displayBrand && !genuine
        ? ind('display-name-mismatch', 15, `Display name says "${sender.displayName}" but the real sender address does not belong to that organization`)
        : off('display-name-mismatch', 15)
    );

    const known = typeof threatIntel?.lookupSenderDomain === 'function' ? threatIntel.lookupSenderDomain(domain) : null;
    if (known) {
      out.push(ind('known-risky-sender', 30, 'The sender address matches a known malicious sender in threat intelligence'));
    }
  }

  return out;
}

export function bodyIndicators(subject, bodyLower, bodyRaw) {
  const out = [];

  const urgencyHits = URGENCY_PHRASES.filter((p) => bodyLower.includes(p));
  out.push(
    urgencyHits.length >= 2
      ? ind('urgency-pressure', 20, 'Uses pressure/urgency language to make you act quickly')
      : off('urgency-pressure', 20)
  );

  const sensitiveHits = SENSITIVE_REQUESTS.filter((p) => bodyLower.includes(p));
  out.push(
    sensitiveHits.length >= 1
      ? ind('sensitive-info-request', 25, 'Asks for sensitive information (passwords, codes, financial details)')
      : off('sensitive-info-request', 25)
  );

  const threatHits = THREAT_PHRASES.filter((p) => bodyLower.includes(p));
  out.push(
    threatHits.length >= 1
      ? ind('threat-language', 15, 'Uses fear or threat language (account closure, legal action, suspicious activity)')
      : off('threat-language', 15)
  );

  const hasGenericGreeting = GENERIC_GREETINGS.some((g) => bodyLower.startsWith(g) || bodyLower.includes(`\n${g}`) || bodyLower.includes(`${g},`));
  out.push(
    hasGenericGreeting
      ? ind('generic-greeting', 10, 'Uses a generic greeting instead of your name (common in mass phishing)')
      : off('generic-greeting', 10)
  );

  const letters = (bodyRaw.match(/[a-z]/g) ?? []).length;
  const uppers = (bodyRaw.match(/[A-Z]/g) ?? []).length;
  out.push(
    letters + uppers > 40 && uppers / (letters + uppers) > 0.3
      ? ind('caps-abuse', 10, 'Unusual amount of CAPITAL letters (shouting style)')
      : off('caps-abuse', 10)
  );

  const attachmentHits = ATTACHMENT_PHRASES.filter((p) => bodyLower.includes(p));
  out.push(
    attachmentHits.length >= 1
      ? ind('attachment-lure', 15, 'Encourages opening an attachment or document (common malware delivery trick)')
      : off('attachment-lure', 15)
  );

  return out;
}

/** Extract plain and defanged URLs from email text. */
export function extractUrls(text) {
  const refanged = String(text)
    .replace(/hxxps?:\/\//gi, (m) => (m.toLowerCase().includes('hxxps') ? 'https://' : 'http://'))
    .replace(/\[(\.|\[dot\]|dot)\]/gi, '.')
    .replace(/\[at\]/gi, '@');

  const matches = refanged.match(/https?:\/\/[^\s<>"')\]]+/gi) ?? [];
  return [...new Set(matches)].slice(0, 10);
}
