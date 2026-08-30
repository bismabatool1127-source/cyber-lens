import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzePhone } from '../server/analyzers/phoneAnalyzer.js';
import { normalizePhone } from '../server/analyzers/indicators/phoneIndicators.js';

test('normalizes international formats', () => {
  assert.equal(normalizePhone('+92 300 1234567').e164, '+923001234567');
  assert.equal(normalizePhone('00923001234567').e164, '+923001234567');
  assert.equal(normalizePhone('03001234567').e164, '+923001234567');
  assert.equal(normalizePhone('(202) 555-0134').e164, '+12025550134');
  assert.equal(normalizePhone('+44 7700 900123').e164, '+447700900123');
});

test('unparseable input is flagged', () => {
  const r = analyzePhone('call me maybe', null);
  assert.ok(r.indicators.some((i) => i.name === 'unparseable-number'));
});

test('known scam number is HIGH with valid-format note', () => {
  const fakeIntel = { lookupPhone: (n) => (n === '+923001112223' ? { matchedOn: 'phone' } : null) };
  const r = analyzePhone('+92 300 1112223', fakeIntel);
  assert.equal(r.classification, 'HIGH');
  assert.ok(r.reasons.some((x) => /known suspicious record/i.test(x)));
  assert.ok(r.reasons.some((x) => /Format is valid/i.test(x)));
});

test('premium-rate number is flagged', () => {
  const r = analyzePhone('+1 900 555 0100', null);
  assert.ok(r.indicators.some((i) => i.name === 'premium-rate-prefix'));
});

test('too short / too long flagged', () => {
  assert.ok(analyzePhone('+92123', null).indicators.some((i) => i.name === 'too-short'));
  assert.ok(analyzePhone('+92300123456789012345', null).indicators.some((i) => i.name === 'too-long'));
});

test('repeating digits vanity pattern flagged', () => {
  const r = analyzePhone('+923001111111', null);
  assert.ok(r.indicators.some((i) => i.name === 'vanity-pattern'));
});

test('normal clean number is LOW with format note', () => {
  const r = analyzePhone('+44 20 7946 0018', null);
  assert.equal(r.classification, 'LOW');
  assert.ok(r.reasons.some((x) => /Format is valid/i.test(x)));
});
