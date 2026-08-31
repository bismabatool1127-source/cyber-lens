import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cyberlens-api-'));
process.env.DB_PATH = path.join(tmpDir, 'test.db');
process.env.NODE_ENV = 'test';
process.env.FEED_URL = ''; // keep smoke tests offline

const { createApp } = await import('../server/index.js');
const { closeDb } = await import('../server/db.js');

let server;
let base;

before(async () => {
  const app = createApp();
  server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server?.close();
  closeDb();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const post = (pathName, body, raw) =>
  fetch(`${base}${pathName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw ?? JSON.stringify(body),
  });

test('GET /api/health responds ok', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
});

test('URL scan returns the standardized explainable shape', async () => {
  const res = await post('/api/scan/url', { url: 'http://paypa1-secure-login.tk/webscr/login.php' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.classification, 'HIGH');
  assert.equal(typeof data.riskScore, 'number');
  assert.ok(['low', 'medium', 'high'].includes(data.confidence));
  assert.ok(Array.isArray(data.reasons) && data.reasons.length > 0);
  assert.equal(typeof data.recommendation, 'string');
  assert.ok(Array.isArray(data.indicators));
});

test('URL scan rejects empty and invalid input with friendly messages', async () => {
  const empty = await post('/api/scan/url', { url: '   ' });
  assert.equal(empty.status, 400);
  assert.match((await empty.json()).message, /enter a URL/i);

  const invalid = await post('/api/scan/url', { url: 'javascript:alert(1)' });
  assert.equal(invalid.status, 400);
  assert.match((await invalid.json()).message, /valid URL/i);
});

test('email scan returns result plus extractedUrls', async () => {
  const res = await post('/api/scan/email', {
    sender: 'security@paypa1-secure-login.tk',
    subject: 'Urgent: verify your account immediately',
    body: 'Dear Customer, act now or your account will be suspended. Visit http://paypa1-secure-login.tk/webscr/login.php and verify your password.',
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.classification, 'HIGH');
  assert.ok(Array.isArray(data.extractedUrls));
  assert.equal(data.extractedUrls.length, 1);
});

test('email scan validates missing fields', async () => {
  const res = await post('/api/scan/email', { sender: '', body: '' });
  assert.equal(res.status, 400);
});

test('phone scan works and reports normalized number', async () => {
  const res = await post('/api/scan/phone', { phone: '+92 300 1112223' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.normalized, '+923001112223');
  assert.equal(data.classification, 'HIGH');
});

test('malformed JSON body is handled gracefully', async () => {
  const res = await post('/api/scan/url', null, '{not json');
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.error, 'INVALID_JSON');
});

test('unknown API route returns JSON 404 without stack traces', async () => {
  const res = await fetch(`${base}/api/definitely-not-a-route`);
  assert.equal(res.status, 404);
  const text = await res.text();
  assert.ok(!text.includes('at '));
});

test('recent scans list only redacted summaries', async () => {
  const res = await fetch(`${base}/api/recent-scans`);
  assert.equal(res.status, 200);
  const { scans } = await res.json();
  assert.ok(Array.isArray(scans) && scans.length > 0);
  for (const scan of scans) {
    assert.ok(['url', 'email', 'phone'].includes(scan.type));
    assert.ok(!scan.targetSummary.includes('paypa1-secure-login'));
  }
});

test('stats endpoint reports real scan totals and threat-intel counts', async () => {
  await post('/api/scan/url', { url: 'https://www.wikipedia.org' });
  const res = await fetch(`${base}/api/stats`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.scans.total >= 4);
  assert.ok(data.scans.safe >= 1 && data.scans.malicious >= 1);
  assert.equal(data.scans.total, data.scans.safe + data.scans.suspicious + data.scans.malicious);
  assert.ok(data.scans.byType.url >= 1 && data.scans.byType.email >= 1 && data.scans.byType.phone >= 1);
  assert.ok(Number.isInteger(data.threatIntel.seedRecords) && data.threatIntel.seedRecords > 0);
});

test('static frontend is served', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes('CYBER'));
});
