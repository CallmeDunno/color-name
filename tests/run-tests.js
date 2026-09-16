// Run: node tests/run-tests.js
const assert = require('assert');
const { normalizeHex, deltaE2000 } = require('../js/color-utils.js');
const { toSnakeCase } = require('../js/snake-case.js');
const { createLookup } = require('../js/name-lookup.js');
const data = require('../data/colornames.min.json');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok  ', name);
  } catch (e) {
    console.error('  FAIL', name, '\n       ', e.message);
    process.exitCode = 1;
  }
}

test('normalizeHex', () => {
  assert.strictEqual(normalizeHex('#FFA500'), 'ffa500');
  assert.strictEqual(normalizeHex(' ffa500 '), 'ffa500');
  assert.strictEqual(normalizeHex('#fa0'), 'ffaa00');
  assert.strictEqual(normalizeHex('xyz'), null);
  assert.strictEqual(normalizeHex('#12345'), null);
  assert.strictEqual(normalizeHex(''), null);
});

test('toSnakeCase', () => {
  assert.strictEqual(toSnakeCase('Olive Drab'), 'olive_drab');
  assert.strictEqual(toSnakeCase('Crème Brûlée'), 'creme_brulee');
  assert.strictEqual(toSnakeCase("Baker's Chocolate"), 'bakers_chocolate');
  assert.strictEqual(toSnakeCase('The Count’s Black'), 'the_counts_black');
  assert.strictEqual(toSnakeCase('Salt & Pepper'), 'salt_and_pepper');
  assert.strictEqual(toSnakeCase('100 Mph'), 'color_100_mph');
  assert.strictEqual(toSnakeCase('  Hot-Pink!! '), 'hot_pink');
});

test('deltaE2000 reference pair (Sharma et al.)', () => {
  const d = deltaE2000([50, 2.6772, -79.7751], [50, 0, -82.7485]);
  assert.ok(Math.abs(d - 2.0425) < 1e-4, 'got ' + d);
});

const lookup = createLookup(data);

test('exact matches', () => {
  assert.strictEqual(lookup.findClosest('000000').name, 'Black');
  assert.strictEqual(lookup.findClosest('ffffff').name, 'White');
  assert.strictEqual(lookup.findClosest('ffa500').exact, true);
});

test('nearest match', () => {
  const missing = ['123456', 'abcdef', '7f7f80', '0a0b0c'].find((h) => !(h in data));
  const r = lookup.findClosest(missing);
  assert.strictEqual(r.exact, false);
  assert.ok(r.name && r.name.length > 0);
  assert.ok(r.deltaE > 0);
});

test('all names produce non-empty snake_case', () => {
  const bad = Object.values(data).filter((n) => !toSnakeCase(n));
  assert.deepStrictEqual(bad, []);
});

console.log(`\n${passed} test(s) passed`);
