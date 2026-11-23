const test = require('node:test');
const assert = require('node:assert/strict');
const { articleIdentity, shareArticle, createCounters } = require('../assets/js/interactions.js');

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

test('article links share one counter across domains, queries, hashes and Chinese URL encoding', () => {
  const a = articleIdentity('https://gaobinbin.dev/posts/随笔.html?source=share#comments');
  const b = articleIdentity('https://robingaoofficial.github.io/posts/%E9%9A%8F%E7%AC%94.html');
  assert.equal(a.path, '/posts/随笔.html');
  assert.equal(a.path, b.path);
  assert.equal(a.url, 'https://gaobinbin.dev/posts/%E9%9A%8F%E7%AC%94.html');
  assert.notEqual(articleIdentity('https://gaobinbin.dev/posts/a%2Fb.html').path, '/posts/a/b.html');
});

test('sharing uses the native sheet, cancellation does not copy, unsupported sharing copies', async () => {
  const data = { title: '随笔', url: 'https://gaobinbin.dev/posts/8.html' };
  let received;
  assert.equal(await shareArticle(data, { share: async value => { received = value; } }), 'shared');
  assert.deepEqual(received, data);
  assert.equal(await shareArticle(data, { share: async () => { throw Object.assign(new Error(), { name: 'AbortError' }); }, clipboard: { writeText: () => assert.fail('cancel must not copy') } }), 'cancelled');
  assert.equal(await shareArticle(data, { clipboard: { writeText: async value => { received = value; } } }), 'copied');
  assert.equal(received, data.url);
  assert.equal(await shareArticle(data, {}), 'manual');
  let nativeCalls = 0;
  const desktop = { share: () => { nativeCalls++; }, clipboard: {writeText: async url => {received=url;}} };
  assert.equal(await shareArticle(data, desktop, false), 'copied');
  assert.equal(received, data.url);
  desktop.clipboard.writeText = async () => { throw Error('denied'); };
  assert.equal(await shareArticle(data, desktop, false), 'manual');
  assert.equal(nativeCalls, 0);
});

test('pageviews increment only once per article per session, including concurrent calls', async () => {
  let views = 7;
  const calls = [];
  const api = {
    getArticleCounter: async () => [{ time: views, reaction0: 2 }],
    updateArticleCounter: async options => { calls.push(options); return [{ time: ++views, reaction0: 2 }]; }
  };
  const options = { api, serverURL: 'https://comments.example.com', path: '/posts/8.html', sessionStorage: memoryStorage(), localStorage: memoryStorage() };
  const counter = createCounters(options);
  await Promise.all([counter.view(), counter.view()]);
  await createCounters(options).view();
  assert.equal(views, 8);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, 'time');
  assert.equal(calls[0].path, '/posts/8.html');
});

test('likes persist only after a successful response, toggle and suppress concurrent double clicks', async () => {
  const calls = [];
  let shouldFail = true;
  const counter = createCounters({ serverURL: 'https://comments.example.com', path: '/posts/8.html', sessionStorage: memoryStorage(), localStorage: memoryStorage(), api: {
    updateArticleCounter: async options => {
      calls.push(options);
      if (shouldFail) throw new Error('offline');
      return [{ time: 8, reaction0: options.action === 'desc' ? 2 : 3 }];
    }
  } });
  await assert.rejects(counter.toggleLike(), /offline/);
  assert.equal(counter.liked(), false);
  shouldFail = false;
  const results = await Promise.all([counter.toggleLike(), counter.toggleLike()]);
  assert.equal(calls.length, 2);
  assert.equal(results[0], 3);
  assert.equal(counter.liked(), true);
  assert.equal(await counter.toggleLike(), 2);
  assert.equal(counter.liked(), false);
  assert.equal(calls[2].action, 'desc');
  assert.equal(calls[2].type, 'reaction0');
});

test('unavailable browser storage does not block reading or liking', async () => {
  const blockedStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() {} };
  const counter = createCounters({ api: { updateArticleCounter: async () => [{ time: 1, reaction0: 1 }], getArticleCounter: async () => [{ time: 1, reaction0: 1 }] }, serverURL: 'https://comments.example.com', path: '/posts/8.html', sessionStorage: blockedStorage, localStorage: blockedStorage });
  assert.equal(await counter.view(), 1);
  assert.equal(await counter.toggleLike(), 1);
  assert.equal(counter.liked(), true);
});
