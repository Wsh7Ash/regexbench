import test from 'node:test';
import assert from 'node:assert/strict';

import { compile, explain, isValid, matchAll, segment } from '../src/regex.js';

// Build a literal backslash at runtime so this file contains no backslashes
// (keeps it robust against any transport escaping).
const BS = String.fromCharCode(92);
const DIGIT_PLUS = `[0-9]+`; // equivalent to \d+
const WORD = `[A-Za-z0-9_]`;

test('compile accepts a valid pattern', () => {
  const r = compile(DIGIT_PLUS, 'g');
  assert.equal(r.ok, true);
  assert.equal(r.error, null);
  assert.ok(r.regex instanceof RegExp);
});

test('compile reports invalid pattern without throwing', () => {
  const r = compile('(', 'g');
  assert.equal(r.ok, false);
  assert.ok(typeof r.error === 'string' && r.error.length > 0);
  assert.equal(r.regex, null);
});

test('compile rejects invalid flags', () => {
  const r = compile('a', 'z');
  assert.equal(r.ok, false);
});

test('isValid mirrors compile', () => {
  assert.equal(isValid(`${WORD}+`), true);
  assert.equal(isValid('['), false);
});

test('matchAll finds all matches with index and text', () => {
  const { regex } = compile(DIGIT_PLUS, 'g');
  const matches = matchAll(regex, 'a1 b22 c333');
  assert.equal(matches.length, 3);
  assert.deepEqual(matches.map(m => m.text), ['1', '22', '333']);
  assert.deepEqual(matches.map(m => m.index), [1, 4, 8]);
});

test('matchAll captures groups', () => {
  const { regex } = compile(`(${WORD}+)@(${WORD}+)`, 'g');
  const matches = matchAll(regex, 'mail me at bob@example or sue@test');
  assert.equal(matches.length, 2);
  assert.deepEqual(matches[0].groups, ['bob', 'example']);
});

test('matchAll works on a non-global pattern', () => {
  const { regex } = compile(DIGIT_PLUS); // no g flag
  const matches = matchAll(regex, 'a1 b2 c3');
  assert.equal(matches.length, 3);
});

test('matchAll understands a real backslash-d pattern', () => {
  // Construct "\d+" from the runtime backslash to prove module handles escapes.
  const { regex, ok } = compile(`${BS}d+`, 'g');
  assert.equal(ok, true);
  assert.equal(regex.source, `${BS}d+`);
  const matches = matchAll(regex, 'a1 b22');
  assert.equal(matches.length, 2);
  assert.deepEqual(matches.map(m => m.text), ['1', '22']);
});

test('matchAll does not hang on zero-length matches', () => {
  const { regex } = compile('x*', 'g'); // matches empty string everywhere
  const matches = matchAll(regex, 'ab');
  assert.ok(Array.isArray(matches));
  assert.ok(matches.length <= 3); // bounded, not infinite
});

test('segment splits input into matched and unmatched runs', () => {
  const { regex } = compile(DIGIT_PLUS, 'g');
  const matches = matchAll(regex, 'a1 b22');
  const segs = segment('a1 b22', matches);
  // Reassembling the text must reproduce the input.
  assert.equal(segs.map(s => s.text).join(''), 'a1 b22');
  // Exactly two segments carry a match.
  assert.equal(segs.filter(s => s.match).length, 2);
});

test('segment covers full input with no overlaps', () => {
  const input = 'foo bar baz';
  const { regex } = compile('bar', 'g');
  const segs = segment(input, matchAll(regex, input));
  assert.equal(segs.map(s => s.text).join(''), input);
});

test('explain returns descriptions for common constructs', () => {
  const steps = explain(`^${BS}d{3}-${BS}d+$`);
  assert.ok(steps.length > 0);
  assert.ok(steps.some(s => s.includes('digit')));
  assert.ok(steps.some(s => s.includes('start of the string')));
});

test('explain consumes the whole pattern (no infinite loop)', () => {
  const steps = explain('a(b|c)*d');
  assert.ok(Array.isArray(steps));
  assert.ok(steps.length >= 4);
});
