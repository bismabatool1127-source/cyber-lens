/**
 * Threat intelligence service layer.
 *
 * Every analyzer queries threat data ONLY through `threatIntel` (a CompositeThreatIntel).
 * To integrate a real threat-intelligence API later, implement the same lookup methods
 * and add the implementation to the composite chain — no analyzer code changes needed.
 *
 * Lookup result shape (or null when no match):
 * { matchedOn: 'domain'|'url'|'email'|'phone', kind: string, category: string, severity: string, preview?: string }
 */

export class SeedThreatIntel {
  constructor(db) {
    this.db = db;
    this.domainStmt = db.prepare('SELECT domain, category, severity FROM domains WHERE domain = ?');
    this.urlStmt = db.prepare('SELECT url_preview, domain, category, severity FROM urls WHERE url_hash = ?');
    this.senderDomainStmt = db.prepare(
      "SELECT pattern_value, category, severity FROM email_indicators WHERE pattern_type = 'sender_domain' AND pattern_value = ?"
    );
    this.subjectStmt = db.prepare(
      "SELECT pattern_value, category, severity FROM email_indicators WHERE pattern_type = 'subject_keyword'"
    );
    this.bodyStmt = db.prepare(
      "SELECT pattern_value, category, severity FROM email_indicators WHERE pattern_type = 'body_phrase'"
    );
    this.phoneStmt = db.prepare('SELECT phone_e164, category, severity, notes FROM phones WHERE phone_e164 = ?');
  }

  lookupDomain(domain) {
    const row = this.domainStmt.get(String(domain).toLowerCase());
    return row ? { matchedOn: 'domain', kind: row.category, severity: row.severity, value: row.domain } : null;
  }

  lookupUrl(hash) {
    const row = this.urlStmt.get(hash);
    return row
      ? { matchedOn: 'url', kind: row.category, severity: row.severity, preview: row.url_preview, value: row.domain }
      : null;
  }

  lookupSenderDomain(domain) {
    const row = this.senderDomainStmt.get(String(domain).toLowerCase());
    return row ? { matchedOn: 'email', kind: row.category, severity: row.severity, value: row.pattern_value } : null;
  }

  /** Case-insensitive substring matches against known malicious subject keywords. */
  matchSubjectKeywords(subject) {
    const text = String(subject).toLowerCase();
    return this.subjectStmt.all().filter((r) => text.includes(r.pattern_value.toLowerCase()));
  }

  matchBodyPhrases(body) {
    const text = String(body).toLowerCase();
    return this.bodyStmt.all().filter((r) => text.includes(r.pattern_value.toLowerCase()));
  }

  lookupPhone(e164) {
    const row = this.phoneStmt.get(e164);
    return row ? { matchedOn: 'phone', kind: row.category, severity: row.severity, value: row.phone_e164 } : null;
  }
}

/**
 * Priority chain across multiple threat-intel sources. First match wins.
 * Sources are ordered by trust: curated seed DB first, live feed second.
 */
export class CompositeThreatIntel {
  constructor(sources) {
    this.sources = sources;
  }

  #first(method, ...args) {
    for (const source of this.sources) {
      if (typeof source[method] !== 'function') continue;
      try {
        const hit = source[method](...args);
        if (hit) return hit;
      } catch {
        // A failing source must never break analysis; skip it.
      }
    }
    return null;
  }

  lookupDomain(domain) {
    return this.#first('lookupDomain', domain);
  }
  lookupUrl(hash) {
    return this.#first('lookupUrl', hash);
  }
  lookupSenderDomain(domain) {
    return this.#first('lookupSenderDomain', domain);
  }
  lookupPhone(e164) {
    return this.#first('lookupPhone', e164);
  }

  // Keyword/phrase matching aggregates across sources (deduplicated by value).
  matchSubjectKeywords(subject) {
    const seen = new Set();
    const out = [];
    for (const source of this.sources) {
      if (typeof source.matchSubjectKeywords !== 'function') continue;
      try {
        for (const r of source.matchSubjectKeywords(subject)) {
          if (!seen.has(r.pattern_value)) {
            seen.add(r.pattern_value);
            out.push(r);
          }
        }
      } catch { /* skip failing source */ }
    }
    return out;
  }

  matchBodyPhrases(body) {
    const seen = new Set();
    const out = [];
    for (const source of this.sources) {
      if (typeof source.matchBodyPhrases !== 'function') continue;
      try {
        for (const r of source.matchBodyPhrases(body)) {
          if (!seen.has(r.pattern_value)) {
            seen.add(r.pattern_value);
            out.push(r);
          }
        }
      } catch { /* skip failing source */ }
    }
    return out;
  }
}
