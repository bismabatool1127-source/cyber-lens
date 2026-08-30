import fs from 'node:fs';
import path from 'node:path';
import { urlHash } from '../utils/urlHash.js';
import { parseUrl } from '../utils/urlParser.js';
import { logger } from '../utils/logger.js';

/**
 * Live community threat feed (OpenPhish by default).
 * Additive source only: failures never break analysis — the app degrades to the
 * curated seed database and any previously cached feed entries.
 */
export class FeedThreatIntel {
  constructor({ url, refreshMs, maxEntries, cachePath }) {
    this.url = url;
    this.refreshMs = refreshMs;
    this.maxEntries = maxEntries;
    this.cachePath = cachePath;
    this.urlHashes = new Set();
    this.domains = new Set();
    this.timer = null;
    this.lastSync = null;
  }

  loadCache() {
    try {
      if (!fs.existsSync(this.cachePath)) return;
      const lines = fs.readFileSync(this.cachePath, 'utf8').split(/\r?\n/).filter(Boolean);
      for (const line of lines.slice(0, this.maxEntries)) this.#add(line);
      logger.info(`Feed cache loaded (${this.urlHashes.size} entries)`);
    } catch (err) {
      logger.warn('Feed cache unreadable, starting empty', err?.message);
    }
  }

  #add(urlText) {
    const parsed = parseUrl(urlText);
    if (!parsed) return;
    this.urlHashes.add(urlHash(urlText));
    this.domains.add(parsed.hostname);
    if (this.urlHashes.size > this.maxEntries) {
      const first = this.urlHashes.values().next().value;
      this.urlHashes.delete(first);
    }
  }

  async refresh() {
    if (!this.url) return;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(this.url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`feed responded ${res.status}`);

      const text = await res.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => /^https?:\/\//i.test(l));
      this.urlHashes.clear();
      this.domains.clear();
      for (const line of lines.slice(0, this.maxEntries)) this.#add(line);
      this.lastSync = new Date().toISOString();

      try {
        fs.mkdirSync(path.dirname(this.cachePath), { recursive: true });
        fs.writeFileSync(this.cachePath, lines.slice(0, this.maxEntries).join('\n'), 'utf8');
      } catch (writeErr) {
        logger.warn('Could not persist feed cache', writeErr?.message);
      }
      logger.info(`Live feed synced (${this.urlHashes.size} entries)`);
    } catch (err) {
      logger.warn('Live feed unavailable - continuing with cached/seed data only', err?.message);
    }
  }

  start() {
    if (!this.url) return;
    this.loadCache();
    this.refresh();
    this.timer = setInterval(() => this.refresh(), this.refreshMs);
    this.timer.unref?.();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  lookupUrl(hash) {
    return this.urlHashes.has(hash)
      ? { matchedOn: 'url', kind: 'phishing', severity: 'high', source: 'live-feed' }
      : null;
  }

  lookupDomain(domain) {
    return this.domains.has(String(domain).toLowerCase())
      ? { matchedOn: 'domain', kind: 'phishing', severity: 'high', source: 'live-feed' }
      : null;
  }
}
