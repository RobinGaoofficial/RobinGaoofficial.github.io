const test = require('node:test');
const assert = require('node:assert/strict');
const { filterAndSortPosts, paginatePosts } = require('../assets/js/post-browser.js');

const posts = [
  { id: 'one', text: 'Jekyll search notes', category: '学习', date: '2026-11-14' },
  { id: 'two', text: 'Reading list', category: '随笔', date: '2026-11-12' },
  { id: 'three', text: 'Search experiment', category: '学习', date: '2026-10-30' }
];

test('filters posts by every selected reader criterion', () => {
  const result = filterAndSortPosts(posts, {
    keyword: 'search',
    category: '学习',
    month: '2026-11',
    from: '2026-11-01',
    to: '2026-11-14',
    sort: 'newest'
  });

  assert.deepEqual(result.map(post => post.id), ['one']);
});

test('uses inclusive date endpoints and newest-first sorting', () => {
  const result = filterAndSortPosts(posts, {
    keyword: '', category: '', month: '', from: '2026-10-30', to: '2026-11-12', sort: 'newest'
  });

  assert.deepEqual(result.map(post => post.id), ['two', 'three']);
});

test('ignores an inverted date range instead of hiding every post', () => {
  const result = filterAndSortPosts(posts, {
    keyword: '', category: '', month: '', from: '2026-11-14', to: '2026-11-01', sort: 'newest'
  });

  assert.deepEqual(result.map(post => post.id), ['one', 'two', 'three']);
});

test('sorts titles deterministically when requested', () => {
  const result = filterAndSortPosts(posts, {
    keyword: '', category: '', month: '', from: '', to: '', sort: 'title'
  });

  assert.deepEqual(result.map(post => post.id), ['one', 'two', 'three']);
});

test('paginates the filtered result and constrains invalid pages', () => {
  const result = paginatePosts(posts, 9, 2);

  assert.equal(result.page, 2);
  assert.equal(result.totalPages, 2);
  assert.deepEqual(result.items.map(post => post.id), ['three']);
});
