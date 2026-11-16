const fs = require('node:fs');
const path = require('node:path');
const { Liquid } = require('liquidjs');
const root = path.resolve(__dirname, '..');
const engine = new Liquid({ root: path.join(root, '_includes'), jekyllInclude: true });
engine.registerFilter('relative_url', value => value);
engine.registerFilter('absolute_url', value => new URL(value, 'https://gaobinbin.dev').href);
engine.registerFilter('date_to_xmlschema', value => new Date(value).toISOString());
engine.registerFilter('uri_escape', encodeURIComponent);

async function renderPost({ serverURL = '', title = '保持好奇，记录与分享', content = '<p>这里是文章正文。</p>', collection = 'posts', url = '/posts/interaction-preview.html', previous, next } = {}) {
  const context = {
    page: { title, layout: 'post', collection, url, previous, next, date: '2026-11-15', categories: ['随笔'] },
    site: { title: '高彬斌的博客', description: '记录学习、思考，以及探索新事物的经历。', time: new Date(), waline: { server_url: serverURL } },
    content
  };
  const post = fs.readFileSync(path.join(root, '_layouts/post.html'), 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  context.content = await engine.parseAndRender(post, context);
  return engine.parseAndRender(fs.readFileSync(path.join(root, '_layouts/default.html'), 'utf8'), context);
}
module.exports = { renderPost };
