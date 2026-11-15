const test = require('node:test');
const assert = require('node:assert/strict');
const { monthDays } = require('../assets/js/filter-controls.js');

test('calendar includes leap day and uses Monday as the first weekday', () => {
  const february = monthDays(2024, 1);
  assert.equal(february.offset, 3);
  assert.equal(february.dates.length, 29);
  assert.equal(february.dates[28], '2024-02-29');
  assert.equal(monthDays(2026, 1).dates.length, 28);
});

test('calendar navigation crosses year boundaries with correct dates', () => {
  assert.equal(monthDays(2026, 12).dates[0], '2027-01-01');
  assert.equal(monthDays(2026, -1).dates[30], '2025-12-31');
  assert.equal(monthDays(2026, 10).offset, 6);
});
