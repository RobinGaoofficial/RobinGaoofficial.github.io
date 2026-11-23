(function () {
  'use strict';

  function articleIdentity(href) {
    const url = new URL(href);
    url.search = '';
    url.hash = '';
    let path = url.pathname;
    try { path = decodeURI(path); } catch (_) { /* Keep malformed escapes unchanged. */ }
    return { url: url.href, path: path.replace(/%[0-9a-f]{2}/gi, value => value.toUpperCase()) };
  }

  async function shareArticle(data, browser, useNative = true) {
    if (useNative && typeof browser.share === 'function') {
      try { await browser.share(data); return 'shared'; }
      catch (error) { if (error.name === 'AbortError') return 'cancelled'; }
    }
    try {
      if (browser.clipboard && typeof browser.clipboard.writeText === 'function') {
        await browser.clipboard.writeText(data.url);
        return 'copied';
      }
    } catch (_) { /* Offer a selectable link if clipboard access is denied. */ }
    return 'manual';
  }

  function storageWithFallback(storage) {
    const memory = new Map();
    return {
      get(key) {
        try { return storage ? storage.getItem(key) : memory.get(key); }
        catch (_) { return memory.get(key); }
      },
      set(key, value) {
        memory.set(key, value);
        try { if (storage) storage.setItem(key, value); } catch (_) { /* Private browsing. */ }
      },
      remove(key) {
        memory.delete(key);
        try { if (storage) storage.removeItem(key); } catch (_) { /* Private browsing. */ }
      }
    };
  }

  function counterValue(result, field) {
    if (!Array.isArray(result) || !result[0]) throw new Error('Invalid counter response');
    const value = result[0][field];
    if (!Number.isFinite(value) || value < 0) throw new Error('Invalid counter value');
    return value;
  }

  async function requestCounter(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error('Counter service unavailable');
    const result = await response.json();
    if (result.errno !== 0) throw new Error('Counter request failed');
    return result.data;
  }

  const counterApi = {
    getArticleCounter({ serverURL, paths, type, lang }) {
      const query = new URLSearchParams({ path: paths.join(','), type: type.join(','), lang });
      return requestCounter(`${serverURL}/api/article?${query}`);
    },
    updateArticleCounter({ serverURL, lang, path, type, action }) {
      return requestCounter(`${serverURL}/api/article?lang=${lang}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, type, action })
      });
    }
  };

  function createCounters({ api = counterApi, serverURL, path, sessionStorage, localStorage }) {
    const base = { serverURL: serverURL.replace(/\/$/, ''), path, lang: 'zh-CN' };
    const key = `${base.serverURL}|${path}`;
    const session = storageWithFallback(sessionStorage);
    const local = storageWithFallback(localStorage);
    const viewKey = `robin:view:${key}`;
    const likeKey = `robin:like:${key}`;
    let viewRequest;
    let likeRequest;
    let readRequest;
    function read() {
      if (!readRequest) {
        readRequest = api.getArticleCounter({ serverURL: base.serverURL, lang: base.lang, paths: [path], type: ['time', 'reaction0'] })
          .finally(() => { readRequest = null; });
      }
      return readRequest;
    }
    const liked = () => local.get(likeKey) === '1';
    return {
      likes: async () => counterValue(await read(), 'reaction0'),
      liked,
      view() {
        if (viewRequest) return viewRequest;
        viewRequest = (async () => {
          if (session.get(viewKey)) return counterValue(await read(), 'time');
          session.set(viewKey, '1');
          try { return counterValue(await api.updateArticleCounter({ ...base, type: 'time', action: 'inc' }), 'time'); }
          catch (error) { session.remove(viewKey); throw error; }
        })().finally(() => { viewRequest = null; });
        return viewRequest;
      },
      toggleLike() {
        if (likeRequest) return likeRequest;
        const wasLiked = liked();
        likeRequest = (async () => {
          const result = await api.updateArticleCounter({ ...base, type: 'reaction0', action: wasLiked ? 'desc' : 'inc' });
          const count = counterValue(result, 'reaction0');
          local.set(likeKey, wasLiked ? '0' : '1');
          return count;
        })().finally(() => { likeRequest = null; });
        return likeRequest;
      }
    };
  }

  function browserStorage(name) {
    try { return window[name]; } catch (_) { return null; }
  }

  async function mount(root) {
    const identity = articleIdentity(root.dataset.url);
    const status = root.querySelector('[data-share-status]');
    const share = root.querySelector('[data-share]');
    const manual = root.querySelector('[data-share-link]');
    const label = share.querySelector('[data-share-label]');
    const options = root.querySelector('[data-share-options]');
    const desktop = options && (/Windows NT/i.test(navigator.userAgent) ||
      window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    if (!desktop && label && typeof navigator.share !== 'function') label.textContent = '复制文章链接';
    share.hidden = false;
    async function performShare(button, useNative) {
      button.disabled = true;
      const result = await shareArticle({ title: root.dataset.title, url: identity.url }, navigator, useNative);
      status.textContent = { shared: '已打开系统分享', copied: '文章链接已复制', cancelled: '', manual: '请手动复制下方文章链接' }[result];
      manual.hidden = result !== 'manual';
      if (!manual.hidden) { manual.value = identity.url; manual.focus(); manual.select(); }
      button.disabled = false;
    }
    if (desktop) {
      const copy = options.querySelector('[data-copy-link]');
      const system = options.querySelector('[data-system-share]');
      system.hidden = typeof navigator.share !== 'function';
      share.setAttribute('aria-controls', options.id);
      share.setAttribute('aria-expanded', 'false');
      share.addEventListener('click', () => {
        options.hidden = !options.hidden;
        share.setAttribute('aria-expanded', String(!options.hidden));
        manual.hidden = true;
        status.textContent = '';
        if (!options.hidden) copy.focus();
      });
      copy.addEventListener('click', () => performShare(copy, false));
      system.addEventListener('click', () => performShare(system, true));
    } else {
      share.addEventListener('click', () => performShare(share, true));
    }

    const serverURL = root.dataset.serverUrl;
    if (!serverURL) return;
    const like = root.querySelector('[data-like]');
    const likeLabel = root.querySelector('[data-like-label]');
    const likes = root.querySelector('[data-like-count]');
    const views = document.querySelector('[data-view-count]');
    const serviceStatus = root.querySelector('[data-service-status]');
    const retry = root.querySelector('[data-service-retry]');
    const counters = createCounters({ serverURL, path: identity.path, sessionStorage: browserStorage('sessionStorage'), localStorage: browserStorage('localStorage') });
    let likeRevision = 0;
    let commentAttempts = 0;
    function updateLikeState() {
      like.setAttribute('aria-pressed', String(counters.liked()));
      likeLabel.textContent = counters.liked() ? '已点赞' : '点赞';
      like.title = counters.liked() ? '取消点赞' : '喜欢这篇文章';
    }
    like.addEventListener('click', async () => {
      if (like.disabled) return;
      like.disabled = true;
      try {
        likes.textContent = await counters.toggleLike();
        likeRevision++;
        updateLikeState();
        status.textContent = counters.liked() ? '谢谢你的喜欢' : '已取消点赞';
      } catch (_) { status.textContent = '点赞未能保存，请稍后重试'; }
      finally { like.disabled = false; }
    });
    updateLikeState();
    like.disabled = false;
    const tasks = {
      阅读量: async () => { views.textContent = await counters.view(); },
      点赞数: async () => {
        const revision = likeRevision;
        const count = await counters.likes();
        if (revision === likeRevision) likes.textContent = count;
      },
      评论: async () => {
        const url = new URL(root.dataset.clientModule, document.baseURI);
        if (commentAttempts++) url.searchParams.set('retry', commentAttempts);
        const api = await import(url.href);
        api.init({
          el: root.querySelector('[data-comments]'), serverURL, path: identity.path,
          lang: 'zh-CN', login: 'force', dark: 'html[data-theme="dark"]',
          pageview: false, comment: false, reaction: false, pageSize: 10,
          emoji: false, search: false, imageUploader: false, texRenderer: false,
          noRss: true, noCopyright: true, commentSorting: 'latest',
          locale: { placeholder: '写下你的想法，和我聊聊这篇文章…', sofa: '还没有评论，欢迎来聊聊。', login: '登录 / 注册' }
        });
      }
    };
    const failed = new Set();
    function showFailures() {
      retry.hidden = failed.size === 0;
      serviceStatus.textContent = failed.size ? `${[...failed].join('、')}加载失败，请重试。` : '';
    }
    async function run(name) {
      failed.delete(name);
      showFailures();
      try { await tasks[name](); }
      catch (_) { failed.add(name); showFailures(); }
    }
    retry.addEventListener('click', () => [...failed].forEach(run));
    await Promise.all(Object.keys(tasks).map(run));
  }

  if (typeof module === 'object' && module.exports) module.exports = { articleIdentity, shareArticle, createCounters };
  if (typeof document !== 'undefined') {
    const root = document.querySelector('[data-post-interactions]');
    if (root) mount(root);
  }
})();
