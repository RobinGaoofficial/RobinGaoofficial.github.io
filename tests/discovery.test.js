const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Liquid } = require('liquidjs');
const { renderPost } = require('../tools/render-interactions.cjs');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const engine = new Liquid();
engine.registerFilter('absolute_url', value => new URL(value, 'https://gaobinbin.dev').href);
engine.registerFilter('xml_escape', value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'));
engine.registerFilter('date_to_rfc822', value => new Date(value).toUTCString());
engine.registerFilter('normalize_whitespace', value => value.replace(/\s+/g, ' '));
const posts = Array.from({length: 55}, (_, i) => ({ title: `标题 & <${i}>`, url: `/posts/post-${i}.html`, date: '2026-11-17', excerpt: '<p>文字 & 更多</p>', categories: ['随笔 & 学习'] }));
const context = { site: {title: '博客 & 笔记', description: '记录 <思考>', time: '2026-11-17', posts} };
const render = name => engine.parseAndRender(read(name).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, ''), context);

test('RSS includes escaped recent entries, stable absolute GUIDs and legacy article', async () => {
  const xml = await render('feed.xml');
  assert.ok(xml.startsWith('<?xml'));
  assert.equal((xml.match(/<item>/g) || []).length, 51);
  assert.match(xml, /标题 &amp; &lt;0&gt;/);
  assert.match(xml, /文字 &amp; 更多/);
  assert.match(xml, /<guid isPermaLink="true">https:\/\/gaobinbin.dev\/posts\/post-0.html<\/guid>/);
  assert.match(xml, /hello-world.html/);
  assert.doesNotMatch(xml, /post-50.html|\{%|\{\{/);
});
test('sitemap includes all posts and public pages but no internal or error pages', async () => {
  const xml = await render('sitemap.xml');
  assert.equal((xml.match(/<loc>/g) || []).length, 61);
  assert.match(xml, /https:\/\/gaobinbin.dev\/content-use.html/);
  assert.match(xml, /post-54.html/);
  assert.doesNotMatch(xml, /404.html|_drafts|\/docs\/|\/services\/|\{%|\{\{/);
});
test('public layout advertises RSS and indexing; 404 is not indexed', async () => {
  const html = await renderPost();
  assert.match(html, /©2026-至今 高彬斌/);
  assert.match(html, /type="application\/rss\+xml"[^>]+https:\/\/gaobinbin.dev\/feed.xml/);
  assert.match(html, /name="robots" content="index,follow"/);
  const error = await renderPost({collection:null, url:'/404.html'});
  assert.match(error, /name="robots" content="noindex,follow"/);
});
test('crawler policy blocks known training bots while leaving search available', () => {
  const robots = read('robots.txt');
  for (const bot of ['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot']) {
    assert.ok(robots.includes(`User-agent: ${bot}\nDisallow: /`));
  }
  assert.match(robots, /User-agent: \*\r?\nAllow: \//);
  assert.doesNotMatch(robots, /User-agent: (Googlebot|bingbot|OAI-SearchBot|Claude-SearchBot)/);
  assert.match(robots, /Sitemap: https:\/\/gaobinbin.dev\/sitemap.xml/);
});
