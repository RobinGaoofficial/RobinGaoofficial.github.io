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
  const posts = cards.map((card, index) => ({ card, index, text: card.dataset.search, title: card.dataset.title, category: card.dataset.category, date: card.dataset.date }));
  const pageSize = 6;
  let page = 1;

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

  function filters() {
    return window.PostBrowser.normalizeFilters({ keyword: input.value, category: category.value, month: month.value, from: from.value, to: to.value, sort: sort.value });
  }

  function setExpanded(expanded) {
    panel.hidden = !expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
  }

  function restoreFilters(criteria) {
    input.value = criteria.keyword;
    category.value = criteria.category;
    month.value = criteria.month;
    from.value = criteria.from;
    to.value = criteria.to;
    sort.value = criteria.sort;
  }

  function syncUrl(criteria) {
    const search = window.PostBrowser.filtersToSearch(criteria);
    window.history.replaceState(null, '', `${search}${window.location.hash}`);
  }

  function updateFilterSummary(criteria) {
    const active = window.PostBrowser.activeFilterCount(criteria);
    count.hidden = active === 0;
    count.textContent = active ? String(active) : '';
    clear.disabled = active === 0 && criteria.sort === 'newest';
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
    page = paged.page;
    const visible = new Set(paged.items.map(post => post.card));
    cards.forEach(card => { card.hidden = !visible.has(card); });
    const hasConditions = window.PostBrowser.activeFilterCount(criteria) > 0 || criteria.sort !== 'newest';
    status.hidden = !hasConditions;
    status.textContent = hasConditions ? `找到 ${results.length} 篇文章${results.length ? `，第 ${page} / ${paged.totalPages} 页` : ''}` : '';
    empty.hidden = results.length !== 0;
    renderPagination(paged.totalPages);
    updateFilterSummary(criteria);
    if (updateUrl) syncUrl(criteria);
  }

  function changed() {
    page = 1;
    render();
  }

  input.addEventListener('focus', () => setExpanded(true));
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
  clear.addEventListener('click', () => {
    input.value = '';
    category.value = '';
    month.value = '';
    from.value = '';
    to.value = '';
    sort.value = 'newest';
    page = 1;
    render();
  });
  window.addEventListener('popstate', () => {
    const criteria = window.PostBrowser.normalizeFilters(window.PostBrowser.filtersFromSearch(window.location.search));
    restoreFilters(criteria);
    setExpanded(window.PostBrowser.activeFilterCount(criteria) > 0 || criteria.sort !== 'newest');
    page = 1;
    render(false);
  });

  const initial = window.PostBrowser.normalizeFilters(window.PostBrowser.filtersFromSearch(window.location.search));
  restoreFilters(initial);
  setExpanded(window.PostBrowser.activeFilterCount(initial) > 0 || initial.sort !== 'newest');
  render(false);
})();

