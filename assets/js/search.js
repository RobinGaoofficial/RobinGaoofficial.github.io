(() => {
  const input = document.querySelector('#search');
  if (!input) return;
  const cards = Array.from(document.querySelectorAll('[data-search]'));
  const status = document.querySelector('#search-status');
  const empty = document.querySelector('#empty-state');
  input.addEventListener('input', () => {
    const query = input.value.trim().toLocaleLowerCase();
    let count = 0;
    for (const card of cards) {
      const match = card.dataset.search.toLocaleLowerCase().includes(query);
      card.hidden = !match;
      if (match) count++;
    }
    status.textContent = query ? '找到 ' + count + ' 篇文章' : '';
    empty.hidden = count !== 0;
  });
})();

