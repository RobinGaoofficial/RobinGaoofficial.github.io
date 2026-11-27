(() => {
  const input = document.querySelector('#search');
  if (!input || !window.PostBrowser) return;

  const cards = Array.from(document.querySelectorAll('[data-search]'));
  const toggle = document.querySelector('#filters-toggle');
  const panel = document.querySelector('#filter-panel');
  const count = document.querySelector('#filter-count');
  const category = document.querySelector('#category-filter');
  const month = document.querySelector('#month-filter');
  const from = document.querySelector('#date-from');
  const to = document.querySelector('#date-to');
  const sort = document.querySelector('#sort-filter');
  const clear = document.querySelector('#clear-filters');
  const status = document.querySelector('#search-status');
  const empty = document.querySelector('#empty-state');
  const pagination = document.querySelector('#pagination');
  const monthMode = document.querySelector('#mode-month');
  const rangeMode = document.querySelector('#mode-range');
  const monthField = document.querySelector('#month-field');
  const rangeFields = document.querySelector('#range-fields');
  const dateError = document.querySelector('#date-error');
  const grid = document.querySelector('.post-grid');
  const section = grid.closest('#notes');
  const searchEntry = document.getElementById('editorial-search');
  let returnY = null;
  let returnPage = 1;
  function openSearch(open) {
    section.classList.toggle('search-open', open);
    searchEntry.setAttribute('aria-expanded', String(open));
    searchEntry.textContent = open ? '退出搜索' : '搜索文章';
  }
  searchEntry.addEventListener('click', () => {
    if (!section.classList.contains('search-open')) {
      returnY = window.scrollY;
      returnPage = page;
      openSearch(true);
      input.focus();
    } else {
      restoreFilters(window.PostBrowser.normalizeFilters({}));
      page = returnPage;
      openSearch(false);
      render();
      if (returnY !== null) window.scrollTo({top: returnY, behavior: 'instant'});
      returnY = null;
    }
  });
  const posts = cards.map(card => {
    const summary = card.querySelector('p');
    return { card, summary, excerpt: summary.textContent, heading: card.querySelector('h3 a'),
      text: card.dataset.search, title: card.dataset.title, category: card.dataset.category, date: card.dataset.date };
  });

  function highlight(element, text, match, surroundingText) {
    if (!match) {
      if (element.textContent !== text || element.childElementCount) element.textContent = text;
      return;
    }
    const end = match.index + match[0].length;
    const start = surroundingText ? Math.max(0, match.index - 32) : 0;
    const stop = surroundingText ? Math.min(text.length, end + 60) : text.length;
    const mark = document.createElement('mark');
    mark.textContent = match[0];
    element.replaceChildren((start ? '…' : '') + text.slice(start, match.index), mark,
      text.slice(end, stop) + (stop < text.length ? '…' : ''));
  }
  const pageSize = 6;
  let page = 1;

  function pageFromUrl() {
    const value = Number(new URLSearchParams(location.search).get('page'));
    return Number.isSafeInteger(value) && value > 0 ? value : 1;
  }

  function rememberCard(event) {
    const link = event.target.closest('a');
    const card = link?.closest('.post-card');
    if (!card) return;
    try {
      sessionStorage.setItem('blog:list:' + link.pathname, JSON.stringify({
        search: location.search, offset: card.getBoundingClientRect().top, expanded: !panel.hidden
      }));
    } catch (_) { /* The return link still identifies the card. */ }
  }
  grid.addEventListener('click', rememberCard);
  grid.addEventListener('auxclick', rememberCard);

  function addOptions(select, values) {
    values.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.append(option);
    });
  }

  addOptions(category, [...new Set(posts.map(post => post.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN')));
  addOptions(month, [...new Set(posts.map(post => post.date.slice(0, 7)).filter(Boolean))].sort().reverse());
  const widgets = window.FilterControls ? [
    ...[category, month, sort].map(window.FilterControls.enhanceSelect),
    window.FilterControls.enhanceDates([from, to])
  ] : [];

  function setTimeMode(range) {
    monthMode.setAttribute('aria-pressed', String(!range));
    rangeMode.setAttribute('aria-pressed', String(range));
    monthField.hidden = range;
    rangeFields.hidden = !range;
    widgets.forEach(widget => widget.close());
  }

  function filters() {
    return window.PostBrowser.normalizeFilters({ keyword: input.value, category: category.value, month: month.value, from: from.value, to: to.value, sort: sort.value });
  }

  function setExpanded(expanded) {
    panel.hidden = !expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
    if (!expanded) widgets.forEach(widget => widget.close());
  }

  function restoreFilters(criteria) {
    input.value = criteria.keyword;
    category.value = criteria.category;
    month.value = criteria.month;
    from.value = criteria.from;
    to.value = criteria.to;
    sort.value = criteria.sort;
    setTimeMode(Boolean(criteria.from || criteria.to));
    setExpanded(Boolean(criteria.category || criteria.month || criteria.from || criteria.to || criteria.sort !== 'newest'));
  }

  function syncUrl(criteria) {
    const search = window.PostBrowser.filtersToSearch(criteria);
    const url = new URL(window.location.href);
    ['q', 'category', 'month', 'from', 'to', 'sort'].forEach(key => url.searchParams.delete(key));
    new URLSearchParams(search).forEach((value, key) => url.searchParams.set(key, value));
    if (page > 1) url.searchParams.set('page', String(page));
    else url.searchParams.delete('page');
    if (url.hash.startsWith('#result=')) url.hash = 'notes';
    window.history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function updateFilterSummary(criteria) {
    const active = window.PostBrowser.activeFilterCount(criteria);
    count.hidden = active === 0;
    count.textContent = active ? String(active) : '';
    clear.hidden = active === 0 && criteria.sort === 'newest' && !from.value && !to.value;
  }

  function renderPagination(totalPages) {
    pagination.replaceChildren();
    pagination.hidden = totalPages < 2;
    if (totalPages < 2) return;
    const previous = document.createElement('button');
    previous.type = 'button';
    previous.textContent = '上一页';
    previous.disabled = page === 1;
    previous.addEventListener('click', () => { page -= 1; render(); });
    const indicator = document.createElement('span');
    indicator.textContent = `第 ${page} / ${totalPages} 页`;
    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = '下一页';
    next.disabled = page === totalPages;
    next.addEventListener('click', () => { page += 1; render(); });
    pagination.append(previous, indicator, next);
  }

  function render(updateUrl = true) {
    const criteria = filters();
    const results = window.PostBrowser.filterAndSortPosts(posts, criteria);
    const paged = window.PostBrowser.paginatePosts(results, page, pageSize);
    const pattern = criteria.keyword && new RegExp(criteria.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'iu');
    for (const post of paged.items) {
      const bodyMatch = pattern ? pattern.exec(post.text) : null;
      highlight(post.summary, bodyMatch ? post.text : post.excerpt, bodyMatch, true);
      highlight(post.heading, post.title, pattern ? pattern.exec(post.title) : null, false);
    }
    page = paged.page;
    const visible = new Set(paged.items.map(post => post.card));
    grid.classList.toggle('has-recent', paged.items.length > 1);
    grid.style.setProperty('--recent-rows', Math.max(1, paged.items.length - 1));
    cards.forEach(card => card.classList.remove('lead-article','first-recent'));
    paged.items[0]?.card.classList.add('lead-article');
    paged.items[1]?.card.classList.add('first-recent');
    cards.forEach(card => { card.hidden = !visible.has(card); });
    // DOM order must match the sorted results, not just their visibility.
    results.forEach(post => grid.append(post.card));
    const hasConditions = Boolean(criteria.keyword) || window.PostBrowser.activeFilterCount(criteria) > 0 || criteria.sort !== 'newest';
    if (hasConditions) openSearch(true);
    status.hidden = !hasConditions;
    status.textContent = hasConditions ? `找到 ${results.length} 篇文章${results.length ? `，第 ${page} / ${paged.totalPages} 页` : ''}` : '';
    empty.hidden = results.length !== 0;
    renderPagination(paged.totalPages);
    updateFilterSummary(criteria);
    dateError.hidden = !(from.value && to.value && from.value > to.value);
    widgets.forEach(widget => widget.sync());
    if (updateUrl) syncUrl(criteria);
  }

  function changed() {
    page = 1;
    render();
  }

  input.addEventListener('input', changed);
  toggle.addEventListener('click', () => setExpanded(panel.hidden));
  category.addEventListener('change', changed);
  month.addEventListener('change', () => {
    if (month.value) {
      from.value = '';
      to.value = '';
    }
    changed();
  });
  [from, to].forEach(control => control.addEventListener('input', () => {
    if (from.value || to.value) month.value = '';
    changed();
  }));
  sort.addEventListener('change', changed);
  monthMode.addEventListener('click', () => {
    from.value = '';
    to.value = '';
    setTimeMode(false);
    changed();
  });
  rangeMode.addEventListener('click', () => {
    month.value = '';
    setTimeMode(true);
    changed();
  });
  clear.addEventListener('click', () => {
    input.value = '';
    category.value = '';
    month.value = '';
    from.value = '';
    to.value = '';
    sort.value = 'newest';
    setTimeMode(false);
    page = 1;
    render();
  });
  function restoreList() {
    openSearch(false);
    const criteria = window.PostBrowser.normalizeFilters(window.PostBrowser.filtersFromSearch(window.location.search));
    restoreFilters(criteria);
    page = pageFromUrl();
    render(false);
  }
  function restoreCard() {
    const target = posts.find(post => !post.card.hidden &&
      location.hash === '#result=' + encodeURIComponent(post.heading.pathname));
    if (!target) return;
    let offset = 24;
    try {
      const saved = JSON.parse(sessionStorage.getItem('blog:list:' + target.heading.pathname));
      if (saved && saved.search === location.search && Number.isFinite(saved.offset)) {
        setExpanded(saved.expanded);
        offset = saved.offset;
      }
    } catch (_) { /* Use the card position without session storage. */ }
    window.scrollBy({ top: target.card.getBoundingClientRect().top - offset, behavior: 'instant' });
  }
  window.addEventListener('popstate', () => {
    restoreList();
    requestAnimationFrame(restoreCard);
  });

  restoreList();
  window.addEventListener('pageshow', event => {
    if (!event.persisted) requestAnimationFrame(restoreCard);
  });
})();

