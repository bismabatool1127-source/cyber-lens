import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Point the app at a throwaway database BEFORE importing anything that reads config.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cyberlens-test-'));
process.env.DB_PATH = path.join(tmpDir, 'test.db');
process.env.NODE_ENV = 'test';

const { getDb, closeDb } = await import('../server/db.js');
const { seedDatabase } = await import('../server/seed.js');
const { SeedThreatIntel, CompositeThreatIntel } = await import('../server/services/threatIntel.js');
const { urlHash } = await import('../server/utils/urlHash.js');

let intel;

before(() => {
  const db = getDb();
  seedDatabase(db);
  intel = new SeedThreatIntel(db);
});

after(() => {
  closeDb();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('seeded malicious domain is found', () => {
  const hit = intel.lookupDomain('paypa1-secure-login.tk');
  assert.ok(hit);
  assert.equal(hit.matchedOn, 'domain');
});

test('unknown domain returns null', () => {
  assert.equal(intel.lookupDomain('totally-clean.example.org'), null);
});

test('seeded malicious URL is found by hash', () => {
  const hit = intel.lookupUrl(urlHash('http://paypa1-secure-login.tk/webscr/login.php'));
  assert.ok(hit);
  assert.equal(hit.matchedOn, 'url');
});

test('http/https variants of a seeded URL both match', () => {
  const a = intel.lookupUrl(urlHash('http://paypa1-secure-login.tk/webscr/login.php'));
  const b = intel.lookupUrl(urlHash('https://PAYPA1-SECURE-LOGIN.tk/webscr/login.php'));
  assert.ok(a);
  assert.ok(b);
});

test('known risky sender domain is found', () => {
  assert.ok(intel.lookupSenderDomain('paypa1-secure-login.tk'));
  assert.equal(intel.lookupSenderDomain('gmail.com'), null);
});

test('subject keyword matching works case-insensitively', () => {
  const hits = intel.matchSubjectKeywords('URGENT: Verify Your Account Immediately or lose access');
  assert.ok(hits.length >= 1);
});

test('body phrase matching works', () => {
  const hits = intel.matchBodyPhrases('Hello, we detected unusual sign-in activity on your account.');
  assert.ok(hits.length >= 1);
});

test('seeded scam phone is found', () => {
  const hit = intel.lookupPhone('+923001112223');
  assert.ok(hit);
  assert.equal(hit.matchedOn, 'phone');
});

test('composite returns first match by priority and survives failing sources', () => {
  const failing = {
    lookupDomain() {
      throw new Error('source down');
    },
  };
  const composite = new CompositeThreatIntel([failing, intel]);
  assert.ok(composite.lookupDomain('paypa1-secure-login.tk'));
  assert.equal(composite.lookupDomain('unknown.example'), null);
});
