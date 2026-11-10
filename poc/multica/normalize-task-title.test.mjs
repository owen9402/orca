import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTaskTitle } from './normalize-task-title.mjs';

// ECMAScript WhiteSpace + LineTerminator
const WS = [
  ...[0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x20, 0xa0, 0x1680],
  ...Array.from({ length: 11 }, (_, i) => 0x2000 + i),
  0x2028, 0x2029, 0x202f, 0x205f, 0x3000, 0xfeff,
].map((c) => String.fromCharCode(c));
const NOT_WS = ['\u0085', '᠎', '​'];

test('AC1 named export, sync string result', () => {
  assert.equal(typeof normalizeTaskTitle, 'function');
  assert.equal(typeof normalizeTaskTitle('x'), 'string');
});

test('AC2 basic normalization', () => {
  assert.equal(normalizeTaskTitle('  Hello   WORLD  '), 'Hello WORLD');
  assert.equal(normalizeTaskTitle('a\tb\nc\r\nd'), 'a b c d');
  assert.equal(normalizeTaskTitle('Already fine'), 'Already fine');
});

test('AC3 empty and whitespace-only', () => {
  assert.equal(normalizeTaskTitle(''), '');
  assert.equal(normalizeTaskTitle('   \t\n '), '');
  assert.equal(normalizeTaskTitle(' a '), 'a');
});

test('AC4 every ECMAScript whitespace char', () => {
  for (const w of WS) {
    const n = 'U+' + w.charCodeAt(0).toString(16);
    assert.equal(normalizeTaskTitle(`${w}a${w}`), 'a', `edges ${n}`);
    assert.equal(normalizeTaskTitle(`a${w}b`), 'a b', `inner ${n}`);
    assert.equal(normalizeTaskTitle(`a${w}${w}${w}b`), 'a b', `run ${n}`);
    assert.equal(normalizeTaskTitle(`${w}${w}`), '', `only ${n}`);
  }
  assert.equal(normalizeTaskTitle(`${WS.join('')}a${WS.join('')}b${WS.join('')}`), 'a b');
});

test('AC5 non-whitespace preserved', () => {
  for (const c of NOT_WS) {
    assert.equal(normalizeTaskTitle(`${c}a${c}b${c}`), `${c}a${c}b${c}`);
  }
  assert.equal(normalizeTaskTitle(' Ab 한글  😀 é '), 'Ab 한글 😀 é');
});

test('AC6 non-strings throw TypeError', () => {
  const evil = { toString() { throw new Error('called'); }, valueOf() { throw new Error('called'); } };
  for (const v of [undefined, null, true, 1, NaN, 1n, Symbol('s'), [], ['a'], {}, evil, () => 'a', new String('a')]) {
    assert.throws(() => normalizeTaskTitle(v), TypeError);
  }
});

test('AC7 idempotent and large inputs', () => {
  const once = normalizeTaskTitle(' \t a  b  c ');
  assert.equal(normalizeTaskTitle(once), once);
  assert.equal(once, 'a b c');
  const big = 'ab 　\n'.repeat(20000);
  assert.equal(normalizeTaskTitle(big), 'ab '.repeat(19999) + 'ab');
  assert.equal(normalizeTaskTitle(' '.repeat(100000) + 'x' + ' '.repeat(100000)), 'x');
});
