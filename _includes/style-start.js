(() => {
  const root = document.documentElement;
  const valid = value => value === 'tech' || value === 'humanities';
  let manual, pending, previous;
  try { manual = localStorage.getItem('blog-style'); } catch (_) {}
  try {
    const raw = sessionStorage.getItem('blog-next-style');
    sessionStorage.removeItem('blog-next-style');
    pending = JSON.parse(raw);
    previous = JSON.parse(sessionStorage.getItem('blog-current-style'));
  } catch (_) {}

  const target = location.pathname + location.search;
  const internal = pending && pending.target === target && Date.now() - pending.time < 60000;
  const referrer = document.referrer && new URL(document.referrer);
  const fromPrevious = previous && referrer && referrer.origin === location.origin &&
    referrer.pathname === previous.path;
  const inherited = internal ? pending.style : fromPrevious ? previous.style : null;
  const historical = history.state?.blogStyleSource === 'manual'
    ? root.dataset.recommended : history.state?.blogStyle;
  root.dataset.style = [manual, historical, inherited, root.dataset.recommended]
    .find(valid) || 'tech';
  root.dataset.styleSource = valid(manual) ? 'manual' : 'auto';

  function remember() {
    const style = root.dataset.style;
    try { history.replaceState({ ...history.state, blogStyle: style, blogStyleSource: root.dataset.styleSource }, ''); } catch (_) {}
    try { sessionStorage.setItem('blog-current-style', JSON.stringify({path: location.pathname, style})); } catch (_) {}
  }
  remember();
  document.addEventListener('blog-style-change', remember);
  window.addEventListener('pageshow', remember);
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey ||
        event.metaKey || event.shiftKey || (link.target && link.target !== '_self') ||
        link.hasAttribute('download')) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.pathname + url.search === location.pathname + location.search) return;
    try {
      sessionStorage.setItem('blog-next-style', JSON.stringify({
        target: url.pathname + url.search, style: root.dataset.style, time: Date.now()
      }));
    } catch (_) {}
  });
})();
