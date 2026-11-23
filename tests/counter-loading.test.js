const test = require('node:test');
const assert = require('node:assert/strict');
const { createCounters } = require('../assets/js/interactions.js');

test('a repeat visit shares its in-flight GET and a partial response keeps the known count', async () => {
  let reads = 0;
  const counters = createCounters({
    serverURL: 'https://comments.example.com', path: '/posts/test.html',
    sessionStorage: { getItem: () => '1' },
    api: {
      async getArticleCounter() {
        reads++;
        return reads === 1 ? [{ time: 4 }] : [{ time: 4, reaction0: 0 }];
      }
    }
  });
  const [view, likes] = await Promise.allSettled([counters.view(), counters.likes()]);
  assert.equal(reads, 1);
  assert.deepEqual(view, { status: 'fulfilled', value: 4 });
  assert.equal(likes.status, 'rejected');
  assert.equal(await counters.likes(), 0);
  assert.equal(reads, 2);
});
