// Local UI fixture only. Never deploy this server or its temporary counters.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { renderPost } = require('./render-interactions.cjs');
const root = path.resolve(__dirname, '..');
const counters = { time: 7, reaction0: 2 };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:4174');
  res.setHeader('Cache-Control', 'no-store');
  if (url.pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (url.pathname === '/api/article') {
      if (req.method === 'POST') {
        let body = '';
        for await (const chunk of req) body += chunk;
        const { type, action } = JSON.parse(body);
        if (Object.hasOwn(counters, type)) counters[type] = Math.max(0, counters[type] + (action === 'desc' ? -1 : 1));
      }
      res.end(JSON.stringify({ errno: 0, data: [{ ...counters }] }));
    } else res.end(JSON.stringify({ errno: 0, data: { count: 0, page: 1, pageSize: 10, data: [], totalPages: 0 } }));
    return;
  }
  if (url.pathname.startsWith('/offline/')) { res.writeHead(503).end(); return; }
  if (url.pathname.startsWith('/posts/')) {
    const serverURL = url.searchParams.has('disabled') ? '' : url.searchParams.has('offline') ? 'http://127.0.0.1:4174/offline' : 'http://127.0.0.1:4174';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(await renderPost({ serverURL, content: '<p>把学习中的发现和生活里的思考记录下来，也期待听见你的声音。</p><p>喜欢一篇文章，可以点个赞；有新的想法，欢迎在文末留下评论。</p><p><small>本地界面预览 · 计数为临时测试数据，不会写入线上服务。</small></p>' }));
    return;
  }
  if (!url.pathname.startsWith('/assets/')) { res.writeHead(404).end(); return; }
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(path.join(root, 'assets') + path.sep)) { res.writeHead(403).end(); return; }
  try {
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});
server.listen(4174, '127.0.0.1', () => console.log('Local UI preview: http://127.0.0.1:4174/posts/interaction-preview.html'));
