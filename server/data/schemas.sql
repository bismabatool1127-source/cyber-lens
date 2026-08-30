-- Cyber-Lens threat intelligence schema.
-- All entries are threat records only; user-submitted scan input is never stored here.

CREATE TABLE IF NOT EXISTS domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL UNIQUE COLLATE NOCASE,
  category TEXT NOT NULL CHECK (category IN ('phishing','malware','spam','fraud','scam')),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high')),
  source TEXT NOT NULL DEFAULT 'seed',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS urls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url_hash TEXT NOT NULL UNIQUE,
  url_preview TEXT NOT NULL,
  domain TEXT NOT NULL COLLATE NOCASE,
  category TEXT NOT NULL CHECK (category IN ('phishing','malware','credential_harvest','redirect','scam','fraud')),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high')),
  source TEXT NOT NULL DEFAULT 'seed',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_indicators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('sender_domain','sender_pattern','subject_keyword','body_phrase')),
  pattern_value TEXT NOT NULL COLLATE NOCASE,
  category TEXT NOT NULL CHECK (category IN ('phishing','spam','impersonation','social_engineering')),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high')),
  source TEXT NOT NULL DEFAULT 'seed',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS phones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_e164 TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('scam','spam','impersonation','premium_fraud')),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high')),
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'seed',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_urls_domain ON urls(domain);
CREATE INDEX IF NOT EXISTS idx_email_pattern ON email_indicators(pattern_type);
