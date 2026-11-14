(() => {
  const input = document.querySelector('#search');
  if (!input || !window.PostBrowser) return;

  const cards = Array.from(document.querySelectorAll('[data-search]'));
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
    return { keyword: input.value, category: category.value, month: month.value, from: from.value, to: to.value, sort: sort.value };
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

  function render() {
    const results = window.PostBrowser.filterAndSortPosts(posts, filters());
    const paged = window.PostBrowser.paginatePosts(results, page, pageSize);
    page = paged.page;
    const visible = new Set(paged.items.map(post => post.card));
    cards.forEach(card => { card.hidden = !visible.has(card); });
    status.textContent = `找到 ${results.length} 篇文章${results.length ? `，第 ${page} / ${paged.totalPages} 页` : ''}`;
    empty.hidden = results.length !== 0;
    renderPagination(paged.totalPages);
  }

  [input, category, month, from, to, sort].forEach(control => control.addEventListener('input', () => { page = 1; render(); }));
  [category, month, sort].forEach(control => control.addEventListener('change', () => { page = 1; render(); }));
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
  render();
})();

