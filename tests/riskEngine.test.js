import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, CLASSIFICATION } from '../server/services/riskEngine.js';

const ind = (name, weight) => ({ name, weight, triggered: true, detail: `reason for ${name}` });

test('score below 35 classifies LOW', () => {
  const r = evaluate([ind('a', 34)], { type: 'url' });
  assert.equal(r.classification, CLASSIFICATION.LOW);
  assert.equal(r.riskScore, 34);
});

test('score 35-69 classifies SUSPICIOUS', () => {
  assert.equal(evaluate([ind('a', 35)], { type: 'url' }).classification, CLASSIFICATION.SUSPICIOUS);
  assert.equal(evaluate([ind('a', 69)], { type: 'url' }).classification, CLASSIFICATION.SUSPICIOUS);
});

test('score >= 70 classifies HIGH', () => {
  assert.equal(evaluate([ind('a', 70)], { type: 'url' }).classification, CLASSIFICATION.HIGH);
  assert.equal(evaluate([ind('a', 100)], { type: 'url' }).classification, CLASSIFICATION.HIGH);
});

test('score is capped at 100', () => {
  const r = evaluate([ind('a', 80), ind('b', 80)], { type: 'url' });
  assert.equal(r.riskScore, 100);
});

test('confidence levels follow score and indicator count', () => {
  assert.equal(evaluate([ind('a', 10)], { type: 'url' }).confidence, 'low');
  assert.equal(evaluate([ind('a', 50)], { type: 'url' }).confidence, 'medium');
  assert.equal(evaluate([ind('a', 85)], { type: 'url' }).confidence, 'high');
  assert.equal(evaluate([ind('a', 10), ind('b', 10), ind('c', 10), ind('d', 10)], { type: 'url' }).confidence, 'high');
});

test('reasons are sorted by weight and human readable', () => {
  const r = evaluate([ind('small', 5), ind('big', 40)], { type: 'url' });
  assert.equal(r.reasons[0], 'reason for big');
});

test('no indicators means LOW with reassuring wording', () => {
  const r = evaluate([], { type: 'url' });
  assert.equal(r.classification, CLASSIFICATION.LOW);
  assert.match(r.recommendation, /no known threat detected/i);
});

test('recommendations differ per scan type', () => {
  const url = evaluate([ind('a', 80)], { type: 'url' });
  const phone = evaluate([ind('a', 80)], { type: 'phone' });
  assert.notEqual(url.recommendation, phone.recommendation);
});

test('never claims 100% safe', () => {
  for (const type of ['url', 'email', 'phone']) {
    const r = evaluate([], { type });
    assert.ok(!/100%|guarantee/i.test(r.recommendation));
  }
});
