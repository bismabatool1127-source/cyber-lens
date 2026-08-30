import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeEmail } from '../server/analyzers/emailAnalyzer.js';
import { parseSender, extractUrls } from '../server/analyzers/indicators/emailIndicators.js';

const PHISHING_EMAIL = {
  sender: 'PayPal Security <security@paypa1-secure-login.tk>',
  subject: 'Urgent: verify your account immediately',
  body: 'Dear Customer, we detected unusual sign-in activity. Your account will be suspended within 24 hours unless you act now. Click http://paypa1-secure-login.tk/webscr/login.php to verify your password immediately.',
};

test('obvious phishing email is HIGH risk', () => {
  const r = analyzeEmail(PHISHING_EMAIL, null);
  assert.equal(r.classification, 'HIGH');
  assert.ok(r.riskScore >= 70);
});

test('phishing email reports its strongest indicators', () => {
  const r = analyzeEmail(PHISHING_EMAIL, null);
  const names = r.indicators.map((i) => i.name);
  assert.ok(names.includes('lookalike-sender-domain'));
  assert.ok(names.includes('urgency-pressure'));
  assert.ok(names.includes('sensitive-info-request'));
  assert.ok(names.includes('suspicious-links-in-email'));
});

test('extracted links are analyzed and returned', () => {
  const r = analyzeEmail(PHISHING_EMAIL, null);
  assert.equal(r.extractedUrls.length, 1);
  assert.ok(r.extractedUrls[0].riskScore >= 70);
});

test('clean business email is LOW risk', () => {
  const r = analyzeEmail(
    {
      sender: 'newsletter@company.example.com',
      subject: 'Your monthly summary',
      body: 'Hi Taylor, here is your activity summary for July. No action is needed. You can read more at https://www.wikipedia.org/wiki/Main_Page.',
    },
    null
  );
  assert.equal(r.classification, 'LOW');
});

test('freemail sender claiming a brand is flagged', () => {
  const r = analyzeEmail(
    { sender: 'paypal.support@gmail.com', subject: 'Your account', body: 'Hello, this is a note about your paypal account.' },
    null
  );
  assert.ok(r.indicators.some((i) => i.name === 'freemail-for-brand'));
});

test('disposable sender domain is flagged', () => {
  const r = analyzeEmail({ sender: 'hr@mailinator.com', subject: 'Offer', body: 'Hello.' }, null);
  assert.ok(r.indicators.some((i) => i.name === 'disposable-sender-domain'));
});

test('display name mismatch is flagged', () => {
  const r = analyzeEmail(
    { sender: 'Microsoft Support <support@secure-micr0soft-alerts.net>', subject: 'Notice', body: 'Hello.' },
    null
  );
  assert.ok(r.indicators.some((i) => i.name === 'display-name-mismatch'));
});

test('invalid sender format is flagged', () => {
  const r = analyzeEmail({ sender: 'not-an-email', subject: 'x', body: 'hello' }, null);
  assert.ok(r.indicators.some((i) => i.name === 'invalid-sender-format'));
});

test('caps abuse is flagged only on the raw body', () => {
  const loud = analyzeEmail({ sender: 'a@b.co', subject: 'x', body: 'ACT NOW! YOUR ACCOUNT WILL BE CLOSED. THIS IS URGENT. DO NOT DELAY.' }, null);
  assert.ok(loud.indicators.some((i) => i.name === 'caps-abuse'));
  const quiet = analyzeEmail({ sender: 'a@b.co', subject: 'x', body: 'this is a normal lowercase message with enough letters to count.' }, null);
  assert.ok(!quiet.indicators.some((i) => i.name === 'caps-abuse'));
});

test('parseSender handles display name + angle brackets', () => {
  const s = parseSender('PayPal Security <security@paypa1-secure-login.tk>');
  assert.equal(s.address, 'security@paypa1-secure-login.tk');
  assert.equal(s.displayName, 'PayPal Security');
  assert.equal(s.domain, 'paypa1-secure-login.tk');
});

test('extractUrls finds plain and defanged links, dedupes, caps at 10', () => {
  const urls = extractUrls('a http://x.com/1 b https://x.com/1 c hxxp://y[.]com/2 ' + Array.from({ length: 15 }, (_, i) => `http://s${i}.com/`).join(' '));
  assert.equal(urls[0], 'http://x.com/1');
  assert.ok(urls.includes('http://y.com/2'));
  assert.equal(urls.length, 10);
});

test('known subject keyword from threat intel is flagged', () => {
  const fakeIntel = {
    matchSubjectKeywords: (s) => (s.toLowerCase().includes('verify your account immediately') ? [{ pattern_value: 'verify your account immediately' }] : []),
    matchBodyPhrases: () => [],
  };
  const r = analyzeEmail({ sender: 'a@b.co', subject: 'Verify Your Account Immediately', body: 'hello' }, fakeIntel);
  assert.ok(r.indicators.some((i) => i.name === 'known-subject-keyword'));
});
