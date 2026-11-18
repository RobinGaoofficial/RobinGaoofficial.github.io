
/* Minimal light/dark toggle with system preference. */
(() => {
  const media = window.matchMedia(
    '(prefers-color-scheme: dark)'
  );

  const valid = value =>
    ['system', 'light', 'dark'].includes(value)
      ? value
      : 'system';

  let preference = 'system';
  let button = null;

  try {
    preference = valid(localStorage.getItem('blog-theme'));
  } catch (_) {}

  function currentTheme() {
    return preference === 'system'
      ? (media.matches ? 'dark' : 'light')
      : preference;
  }

  function apply() {
    const theme = currentTheme();

    document.documentElement.dataset.theme = theme;

    if (!button) return;

    const description = preference === 'system'
      ? `跟随系统，当前${theme === 'dark' ? '深色' : '浅色'}`
      : `当前${theme === 'dark' ? '深色' : '浅色'}`;

    const next = theme === 'dark' ? '浅色' : '深色';

    button.setAttribute(
      'aria-label',
      `${description}；点击切换到${next}模式；长按或右键恢复跟随系统`
    );

    button.title =
      `${description} · 点击切换${next}；右键或长按恢复跟随系统`;
  }

  function setPreference(value) {
    preference = valid(value);

    try {
      if (preference === 'system') {
        localStorage.removeItem('blog-theme');
      } else {
        localStorage.setItem('blog-theme', preference);
      }
    } catch (_) {}

    apply();
  }

  // Apply before the page is painted.
  apply();

  // Follow operating-system changes in automatic mode.
  media.addEventListener('change', () => {
    if (preference === 'system') apply();
  });

  // Synchronize other open tabs.
  window.addEventListener('storage', event => {
    if (event.key === 'blog-theme' || event.key === null) {
      preference = valid(
        event.key === null ? null : event.newValue
      );
      apply();
    }
  });

  function bind() {
    button = document.querySelector('#theme-toggle');
    if (!button) return;

    button.hidden = false;
    apply();

    let holdTimer = null;
    let suppressClickUntil = 0;
    let startX = 0;
    let startY = 0;

    function cancelHold() {
      if (holdTimer !== null) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    }

    button.addEventListener('click', event => {
      // Do not toggle after a completed long press.
      if (Date.now() < suppressClickUntil) return;

      // Shift + click: restore automatic mode.
      if (event.shiftKey) {
        setPreference('system');
        return;
      }

      // One click always reverses the visible theme.
      setPreference(
        currentTheme() === 'dark' ? 'light' : 'dark'
      );
    });

    // Right-click or keyboard context-menu key.
    button.addEventListener('contextmenu', event => {
      event.preventDefault();
      cancelHold();
      setPreference('system');
    });

    // Touch and pen: long press restores system mode.
    button.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' ||
          event.button !== 0) return;

      cancelHold();
      startX = event.clientX;
      startY = event.clientY;

      holdTimer = setTimeout(() => {
        holdTimer = null;
        setPreference('system');
        suppressClickUntil = Date.now() + 850;
      }, 650);
    });

    button.addEventListener('pointermove', event => {
      if (Math.abs(event.clientX - startX) > 10 ||
          Math.abs(event.clientY - startY) > 10) {
        cancelHold();
      }
    });

    ['pointerup', 'pointercancel', 'pointerleave']
      .forEach(type =>
        button.addEventListener(type, cancelHold)
      );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
