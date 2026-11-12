/* Runs before styles are painted, so a saved dark theme does not flash white. */
(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const valid = value => ['system', 'light', 'dark'].includes(value) ? value : 'system';
  let preference = 'system';
  let menu;
  try { preference = valid(localStorage.getItem('blog-theme')); } catch (_) {}
  function apply() {
    document.documentElement.dataset.theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    if (menu) menu.value = preference;
  }
  apply();
  media.addEventListener('change', apply);
  window.addEventListener('storage', event => {
    if (event.key === 'blog-theme' || event.key === null) {
      preference = valid(event.newValue);
      apply();
    }
  });
  function bind() {
    menu = document.querySelector('#theme-select');
    if (!menu) return;
    menu.hidden = false;
    menu.value = preference;
    menu.addEventListener('change', () => {
      preference = valid(menu.value);
      try { localStorage.setItem('blog-theme', preference); } catch (_) {}
      apply();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
