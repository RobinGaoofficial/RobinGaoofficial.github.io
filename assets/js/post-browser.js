(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PostBrowser = api;
})(typeof window === 'undefined' ? null : window, function () {
  function normalized(value) {
    return String(value || '').trim();
  }

  function filterAndSortPosts(posts, filters) {
    const criteria = Object.assign({ keyword: '', category: '', month: '', from: '', to: '', sort: 'newest' }, filters);
    const keyword = normalized(criteria.keyword).toLocaleLowerCase();
    const category = normalized(criteria.category);
    const month = normalized(criteria.month);
    let from = normalized(criteria.from);
    let to = normalized(criteria.to);
    if (from && to && from > to) {
      from = '';
      to = '';
    }

    return posts.filter(post => {
      const date = normalized(post.date);
      return (!keyword || normalized(post.text).toLocaleLowerCase().includes(keyword)) &&
        (!category || normalized(post.category) === category) &&
        (!month || date.startsWith(month)) &&
        (!from || date >= from) &&
        (!to || date <= to);
    }).sort((left, right) => {
      if (criteria.sort === 'oldest') return normalized(left.date).localeCompare(normalized(right.date));
      if (criteria.sort === 'title') return normalized(left.title || left.text).localeCompare(normalized(right.title || right.text), 'zh-CN');
      return normalized(right.date).localeCompare(normalized(left.date));
    });
  }

  function paginatePosts(posts, requestedPage, pageSize) {
    const totalPages = Math.max(1, Math.ceil(posts.length / pageSize));
    const page = Math.min(Math.max(Number(requestedPage) || 1, 1), totalPages);
    const start = (page - 1) * pageSize;
    return { items: posts.slice(start, start + pageSize), page, totalPages };
  }

  return { filterAndSortPosts, paginatePosts };
});
