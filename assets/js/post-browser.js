(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PostBrowser = api;
})(typeof window === 'undefined' ? null : window, function () {
  function normalized(value) {
    return String(value || '').trim();
  }

  function normalizeFilters(filters) {
    const criteria = Object.assign({ keyword: '', category: '', month: '', from: '', to: '', sort: 'newest' }, filters);
    const result = {
      keyword: normalized(criteria.keyword),
      category: normalized(criteria.category),
      month: normalized(criteria.month),
      from: normalized(criteria.from),
      to: normalized(criteria.to),
      sort: ['newest', 'oldest', 'title'].includes(criteria.sort) ? criteria.sort : 'newest'
    };
    if (result.from || result.to) result.month = '';
    if (result.from && result.to && result.from > result.to) {
      result.from = '';
      result.to = '';
    }
    return result;
  }

  function filtersFromSearch(search) {
    const params = new URLSearchParams(search);
    return {
      keyword: params.get('q'), category: params.get('category'), month: params.get('month'),
      from: params.get('from'), to: params.get('to'), sort: params.get('sort')
    };
  }

  function filtersToSearch(filters) {
    const criteria = normalizeFilters(filters);
    const params = new URLSearchParams();
    if (criteria.keyword) params.set('q', criteria.keyword);
    if (criteria.category) params.set('category', criteria.category);
    if (criteria.month) params.set('month', criteria.month);
    if (criteria.from) params.set('from', criteria.from);
    if (criteria.to) params.set('to', criteria.to);
    if (criteria.sort !== 'newest') params.set('sort', criteria.sort);
    const value = params.toString();
    return value ? `?${value}` : '';
  }

  function activeFilterCount(filters) {
    const criteria = normalizeFilters(filters);
    return Number(Boolean(criteria.keyword)) + Number(Boolean(criteria.category)) + Number(Boolean(criteria.month || criteria.from || criteria.to));
  }

  function filterAndSortPosts(posts, filters) {
    const criteria = normalizeFilters(filters);
    const keyword = criteria.keyword.toLocaleLowerCase();
    const category = criteria.category;
    const month = criteria.month;
    const from = criteria.from;
    const to = criteria.to;

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

  return { filterAndSortPosts, paginatePosts, normalizeFilters, filtersFromSearch, filtersToSearch, activeFilterCount };
});
