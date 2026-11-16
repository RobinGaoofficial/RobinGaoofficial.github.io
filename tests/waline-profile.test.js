const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { patchWaline, replacement } = require('../tools/patch-waline.cjs');
test('the shipped client normalizes missing OAuth profile fields for comment validation', () => {
  const shipped = fs.readFileSync(require.resolve('../assets/vendor/waline/waline.js'), 'utf8');
  assert.ok(shipped.includes(replacement));
  const assign = new Function('h', 's', replacement + ';return h;');
  assert.deepEqual(assign({}, { value: { display_name: 'Robin', email: null, url: null } }), { nick: 'Robin', mail: '', link: '' });
  assert.deepEqual(assign({}, { value: { display_name: 'Author', email: 'author@example.com', url: 'https://example.com' } }), { nick: 'Author', mail: 'author@example.com', link: 'https://example.com' });
});
test('vendor updates fail loudly when the reviewed profile code changes', () => {
  assert.throws(() => patchWaline('different code'), /review/);
});
