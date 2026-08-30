import crypto from 'node:crypto';
import { parseUrl } from './urlParser.js';

/** Protocol-agnostic normalized form so http/https variants of a malicious page both match. */
export function normalizeForHash(urlText) {
  const p = parseUrl(urlText);
  if (!p) return String(urlText).trim().toLowerCase();
  return `${p.hostname}${p.pathname}${p.search}`.toLowerCase();
}

export function urlHash(urlText) {
  return crypto.createHash('sha256').update(normalizeForHash(urlText)).digest('hex');
}
