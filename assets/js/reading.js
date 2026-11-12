(() => {
  const prose = document.querySelector('.prose');
  if (!prose) return;

  // Native anchors keep the directory useful with keyboard navigation and history.
  const headings = Array.from(prose.querySelectorAll('h2, h3'));
  if (headings.length >= 2) {
    const directory = document.createElement('details');
    directory.className = 'article-toc';
    directory.open = window.matchMedia('(min-width: 701px)').matches;
    const summary = document.createElement('summary');
    summary.textContent = '本文目录';
    directory.append(summary);
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', '本文目录');
    const list = document.createElement('ol');
    const links = new Map();
    for (const [index, heading] of headings.entries()) {
      let base = heading.id || heading.textContent.trim().toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-') || `section-${index + 1}`;
      let id = base;
      let suffix = 2;
      while (document.getElementById(id) && document.getElementById(id) !== heading) id = `${base}-${suffix++}`;
      heading.id = id;
      const item = document.createElement('li');
      if (heading.tagName === 'H3') item.className = 'toc-subheading';
      const link = document.createElement('a');
      link.href = '#' + encodeURIComponent(id);
      link.textContent = heading.textContent;
      links.set(heading, link);
      item.append(link);
      list.append(item);
    }
    nav.append(list);
    directory.append(nav);
    prose.before(directory);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        const current = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!current) return;
        for (const link of links.values()) link.removeAttribute('aria-current');
        links.get(current.target).setAttribute('aria-current', 'location');
      }, {rootMargin: '-5% 0px -65% 0px'});
      headings.forEach(heading => observer.observe(heading));
    }
  }

  for (const pre of prose.querySelectorAll('pre')) {
    const code = pre.querySelector('code') || pre;
    const frame = document.createElement('div');
    frame.className = 'code-frame';
    const toolbar = document.createElement('div');
    toolbar.className = 'code-toolbar';
    const hint = document.createElement('span');
    hint.className = 'copy-status';
    hint.setAttribute('role', 'status');
    const language = (code.className + ' ' + (pre.closest('[class*="language-"]')?.className || '')).match(/language-([\w+-]+)/);
    hint.textContent = language ? language[1] : '代码';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.textContent = '复制代码';
    button.setAttribute('aria-label', '复制这段代码');
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(code.textContent);
        hint.textContent = '已复制';
      } catch (_) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(range);
        hint.textContent = '自动复制不可用，代码已选中，请手动复制';
      } finally {
        button.disabled = false;
      }
    });
    pre.before(frame);
    toolbar.append(hint, button);
    frame.append(toolbar, pre);
  }

  // The native modal supplies focus trapping, Escape, and an inert page behind it.
  if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;
  const images = Array.from(prose.querySelectorAll('img')).filter(img => !img.closest('a, button'));
  if (!images.length) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'image-dialog';
  dialog.setAttribute('aria-label', '图片预览');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'image-close';
  close.textContent = '关闭 ×';
  close.setAttribute('aria-label', '关闭图片预览');
  const large = document.createElement('img');
  const caption = document.createElement('p');
  caption.className = 'image-caption';
  dialog.append(close, large, caption);
  document.body.append(dialog);
  let trigger;
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('image-open');
    trigger?.focus({preventScroll: true});
  });
  for (const img of images) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'image-zoom-trigger';
    button.setAttribute('aria-label', '放大图片' + (img.alt ? '：' + img.alt : ''));
    img.before(button);
    button.append(img);
    button.addEventListener('click', () => {
      trigger = button;
      large.src = img.currentSrc || img.src;
      large.alt = img.alt;
      caption.textContent = img.alt;
      caption.hidden = !img.alt;
      dialog.showModal();
      document.body.classList.add('image-open');
      close.focus();
    });
  }
})();
