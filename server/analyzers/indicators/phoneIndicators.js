/**
 * Lightweight phone checks (intentionally simple per the 4-day constraint).
 * Normalization targets E.164; unknown formats are flagged, not rejected.
 */

export const COUNTRY_CODES = [
  { code: '971', country: 'United Arab Emirates' },
  { code: '966', country: 'Saudi Arabia' },
  { code: '44', country: 'United Kingdom' },
  { code: '92', country: 'Pakistan' },
  { code: '91', country: 'India' },
  { code: '86', country: 'China' },
  { code: '81', country: 'Japan' },
  { code: '55', country: 'Brazil' },
  { code: '61', country: 'Australia' },
  { code: '49', country: 'Germany' },
  { code: '33', country: 'France' },
  { code: '1', country: 'United States / Canada' },
].sort((a, b) => b.code.length - a.code.length);

const PREMIUM_PREFIXES = [
  { cc: '1', prefix: '900', label: 'US premium-rate (900)' },
  { cc: '92', prefix: '900', label: 'Pakistan premium-rate (900)' },
  { cc: '44', prefix: '870', label: 'UK premium-rate (87x)' },
  { cc: '44', prefix: '871', label: 'UK premium-rate (87x)' },
  { cc: '44', prefix: '872', label: 'UK premium-rate (87x)' },
  { cc: '44', prefix: '873', label: 'UK premium-rate (87x)' },
  { cc: '49', prefix: '900', label: 'Germany premium-rate (900)' },
  { cc: '971', prefix: '900', label: 'UAE premium-rate (900)' },
  { cc: '61', prefix: '1900', label: 'Australia premium-rate (1900)' },
];

export function normalizePhone(raw) {
  let s = String(raw ?? '').trim();
  s = s.replace(/[()\s.\-]/g, '');
  if (!/^\+?\d+$/.test(s)) return { e164: null, national: null, country: null, parseable: false };

  if (s.startsWith('00')) s = `+${s.slice(2)}`;

  let digits = s.replace(/^\+/, '');

  // Local-number inference for the two most common demo locales.
  if (!s.startsWith('+') && !s.startsWith('00')) {
    if (/^0\d{10}$/.test(digits)) digits = `92${digits.slice(1)}`; // PK local mobile
    else if (/^\d{10}$/.test(digits)) digits = `1${digits}`; // NANP local
  }

  const country = COUNTRY_CODES.find((c) => digits.startsWith(c.code)) ?? null;
  const national = country ? digits.slice(country.code.length) : digits;

  return { e164: `+${digits}`, national, country, parseable: true };
}

function ind(name, weight, detail) {
  return { name, weight, triggered: true, detail };
}
function off(name, weight) {
  return { name, weight, triggered: false, detail: null };
}

export function phoneIndicators(normalized) {
  const out = [];
  const { e164, national, country, parseable } = normalized;

  if (!parseable) {
    out.push(ind('unparseable-number', 15, 'The number contains unusual characters and could not be read cleanly'));
    return out;
  }

  out.push(
    national && national.length < 7
      ? ind('too-short', 15, 'The number is shorter than a normal phone number')
      : off('too-short', 15)
  );

  out.push(
    e164.length - 1 > 15
      ? ind('too-long', 10, 'The number is longer than the international standard allows (E.164)')
      : off('too-long', 10)
  );

  out.push(
    country
      ? off('unknown-country-code', 10)
      : ind('unknown-country-code', 10, 'The country code could not be recognized')
  );

  const premium = PREMIUM_PREFIXES.find((p) => country?.code === p.cc && national?.startsWith(p.prefix));
  out.push(
    premium
      ? ind('premium-rate-prefix', 25, `Uses a premium-rate range (${premium.label}) often abused for phone scams`)
      : off('premium-rate-prefix', 25)
  );

  const repeating = national ? /(\d)\1{5,}/.test(national) : false;
  out.push(
    repeating
      ? ind('vanity-pattern', 10, 'Contains long repeating digit sequences typical of spoofed/vanity numbers')
      : off('vanity-pattern', 10)
  );

  return out;
}
