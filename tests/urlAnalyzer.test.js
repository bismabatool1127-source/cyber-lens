import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeUrl } from '../server/analyzers/urlAnalyzer.js';
import { parseUrl, refangInput, defangForDisplay } from '../server/utils/urlParser.js';

test('clean reputable URL is LOW risk', () => {
  const r = analyzeUrl('https://www.wikipedia.org/wiki/Main_Page', null);
  assert.equal(r.classification, 'LOW');
  assert.equal(r.riskScore, 0);
  assert.equal(r.indicators.length, 0);
});

test('IP-literal host is flagged', () => {
  const r = analyzeUrl('http://203.0.113.55/admin/login', null);
  assert.ok(r.indicators.some((i) => i.name === 'ip-literal-host'));
});

test('punycode host is flagged', () => {
  const r = analyzeUrl('https://xn--80ak6aa92e.com/', null);
  assert.ok(r.indicators.some((i) => i.name === 'punycode-host'));
});

test('typosquat of paypal is flagged', () => {
  const r = analyzeUrl('https://paypa1.com/login', null);
  assert.ok(r.indicators.some((i) => i.name === 'typosquat-brand'));
});

test('compound typosquat tokens are flagged', () => {
  const r = analyzeUrl('http://paypa1-verify-account.xyz/signin', null);
  assert.ok(r.indicators.some((i) => i.name === 'typosquat-brand'));
});

test('genuine paypal domain is NOT flagged as typosquat', () => {
  const r = analyzeUrl('https://www.paypal.com/signin', null);
  assert.ok(!r.indicators.some((i) => i.name === 'typosquat-brand'));
  assert.ok(!r.indicators.some((i) => i.name === 'brand-keyword-host'));
});

test('brand keyword on non-genuine domain is flagged', () => {
  const r = analyzeUrl('https://paypal-secure-alerts.net/login', null);
  assert.ok(r.indicators.some((i) => i.name === 'brand-keyword-host'));
});

test('credential keywords in path are flagged', () => {
  const r = analyzeUrl('https://random-site.org/secure/account/verify', null);
  assert.ok(r.indicators.some((i) => i.name === 'credential-keywords-path'));
});

test('suspicious TLD is flagged', () => {
  const r = analyzeUrl('https://something.tk/', null);
  assert.ok(r.indicators.some((i) => i.name === 'suspicious-tld'));
});

test('http scheme, deep subdomains, double extension, port flagged', () => {
  const r = analyzeUrl('http://a.b.c.example-site.org:8080/files/invoice.pdf.exe', null);
  const names = r.indicators.map((i) => i.name);
  assert.ok(names.includes('http-scheme'));
  assert.ok(names.includes('excessive-subdomains'));
  assert.ok(names.includes('double-extension'));
  assert.ok(names.includes('non-standard-port'));
});

test('at-sign userinfo is flagged', () => {
  const r = analyzeUrl('https://legit-bank.com@evil.example.net/', null);
  assert.ok(r.indicators.some((i) => i.name === 'at-sign-in-url'));
});

test('defanged input is normalized and noted', () => {
  const { text, defanged } = refangInput('hxxps://evil-site[.]com/path');
  assert.equal(defanged, true);
  assert.equal(text, 'https://evil-site.com/path');
  const r = analyzeUrl('hxxps://evil-site[.]com/path', null);
  assert.ok(r.indicators.some((i) => i.name === 'defanged-input'));
});

test('defangForDisplay neutralizes links', () => {
  const d = defangForDisplay('https://evil.com/a.b');
  assert.ok(d.startsWith('hxxps://'));
  assert.ok(d.includes('[.]'));
  assert.ok(!d.includes('https://'));
});

test('very strong phishing URL reaches HIGH', () => {
  const r = analyzeUrl('http://paypa1-login-verify.tk:8080/webscr/login.php', null);
  assert.equal(r.classification, 'HIGH');
  assert.ok(r.riskScore >= 70);
});

test('known-bad threat intel match yields HIGH with top reason', () => {
  const fakeIntel = {
    lookupUrl: () => ({ matchedOn: 'url', kind: 'phishing', severity: 'high' }),
    lookupDomain: () => null,
  };
  const r = analyzeUrl('https://whatever.example.org/', fakeIntel);
  assert.equal(r.classification, 'HIGH');
  assert.match(r.reasons[0], /known malicious/i);
});

test('domain match also works for subdomain URLs', () => {
  const fakeIntel = {
    lookupUrl: () => null,
    lookupDomain: (d) => (d === 'evil.example' ? { matchedOn: 'domain', kind: 'phishing', severity: 'high' } : null),
  };
  const r = analyzeUrl('https://login.evil.example/page', fakeIntel);
  assert.equal(r.classification, 'HIGH');
});

test('parseUrl rejects non-http schemes and garbage', () => {
  assert.equal(parseUrl('javascript:alert(1)'), null);
  assert.equal(parseUrl('ftp://example.com'), null);
  assert.equal(parseUrl('not a url at all'), null);
});

test('risk score never exceeds 100', () => {
  const r = analyzeUrl('http://user:pass@1.2.3.4:9999/a.b.c/invoice.pdf.exe?' + 'x%20'.repeat(300), null);
  assert.ok(r.riskScore <= 100);
});
