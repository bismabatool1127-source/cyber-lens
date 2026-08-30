import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getDb } from './db.js';
import { config } from './config.js';
import { urlHash } from './utils/urlHash.js';
import { defangForDisplay, parseUrl } from './utils/urlParser.js';
import { logger } from './utils/logger.js';

export function loadSeedData() {
  const file = path.join(config.dataDir, 'threat-seed.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Idempotent: uses INSERT OR IGNORE so re-running is safe. Returns row counts inserted per table. */
export function seedDatabase(db = getDb()) {
  const seed = loadSeedData();
  const counts = { domains: 0, urls: 0, email_indicators: 0, phones: 0 };

  const insDomain = db.prepare(
    'INSERT OR IGNORE INTO domains (domain, category, severity, source) VALUES (?, ?, ?, ?)'
  );
  for (const d of seed.domains) {
    const r = insDomain.run(d.domain, d.category, d.severity, 'seed');
    counts.domains += Number(r.changes);
  }

  const insUrl = db.prepare(
    'INSERT OR IGNORE INTO urls (url_hash, url_preview, domain, category, severity, source) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const u of seed.urls) {
    const parsed = parseUrl(u.url);
    if (!parsed) continue;
    const r = insUrl.run(
      urlHash(u.url),
      defangForDisplay(u.url),
      parsed.hostname,
      u.category,
      u.severity,
      'seed'
    );
    counts.urls += Number(r.changes);
  }

  const insEmail = db.prepare(
    'INSERT INTO email_indicators (pattern_type, pattern_value, category, severity, source) VALUES (?, ?, ?, ?, ?)'
  );
  for (const e of seed.email_indicators) {
    const exists = db
      .prepare('SELECT 1 FROM email_indicators WHERE pattern_type = ? AND pattern_value = ?')
      .get(e.pattern_type, e.pattern_value);
    if (exists) continue;
    insEmail.run(e.pattern_type, e.pattern_value, e.category, e.severity, 'seed');
    counts.email_indicators += 1;
  }

  const insPhone = db.prepare(
    'INSERT OR IGNORE INTO phones (phone_e164, category, severity, notes, source) VALUES (?, ?, ?, ?, ?)'
  );
  for (const p of seed.phones) {
    const r = insPhone.run(p.phone_e164, p.category, p.severity, p.notes ?? null, 'seed');
    counts.phones += Number(r.changes);
  }

  return counts;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const counts = seedDatabase();
  logger.info('Seed complete', counts);
}
