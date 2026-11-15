const test = require('node:test');
const assert = require('node:assert/strict');
const { renderPost } = require('../tools/render-interactions.cjs');

test('posts without a configured backend offer sharing without fabricated counts or login controls', async () => {
  const html = await renderPost();
  assert.match(html, /data-share /);
  assert.doesNotMatch(html, /data-view-count|data-like-count|data-comments>/);
  assert.match(html, /src="\/assets\/js\/interactions.js\?v=/);
  assert.doesNotMatch(html, /href="[^\"]*waline.css/);
});

test('the composed post layout enables the interaction assets and escapes article metadata', async () => {
  const html = await renderPost({ serverURL: 'https://comments.example.com', title: '标题 "<img src=x>"', content: '<p id="original-post">原有文章</p>' });
  assert.match(html, /data-server-url="https:\/\/comments.example.com"/);
  assert.match(html, /data-title="标题 (?:&quot;|&#34;)&lt;img src=x&gt;(?:&quot;|&#34;)"/);
  assert.match(html, /data-view-count/);
  assert.match(html, /data-like-count/);
  assert.match(html, /data-comments/);
  assert.match(html, /href="\/assets\/vendor\/waline\/waline.css\?v=3.16.2"/);
  assert.match(html, /<p id="original-post">原有文章<\/p>/);
  assert.doesNotMatch(html, /\{%|\{\{/);
});
