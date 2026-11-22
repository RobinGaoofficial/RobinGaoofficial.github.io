
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

    let press = null;
    let consumeClick = false;

    function finish() {
      if (!press) return;
      const { id, timer } = press;
      press = null;
      clearTimeout(timer);
      button.removeAttribute('data-hold');
      button.style.removeProperty('--cloud-x');
      if (button.hasPointerCapture(id)) button.releasePointerCapture(id);
    }
    function cancel() {
      if (press) consumeClick = true;
      finish();
    }
    function track(event) {
      const dx = event.clientX - press.x;
      const dy = event.clientY - press.y;
      if ((!press.held && Math.hypot(dx, dy) > 8) || Math.abs(dy) > 16) {
        cancel();
        return;
      }
      if (!press.held) return;
      if (Math.hypot(dx, dy) > 8) press.moved = true;
      button.style.setProperty('--cloud-x', Math.max(-72, Math.min(0, dx)) + 'px');
      button.dataset.hold = dx <= -64 ? 'ready' : 'held';
    }

    document.addEventListener('pointerdown', event => {
      if (press && event.pointerId !== press.id) cancel();
    }, true);
    button.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || press) return;
      consumeClick = false;
      press = { id: event.pointerId, x: event.clientX, y: event.clientY, held: false, moved: false };
      button.setPointerCapture(press.id);
      press.timer = setTimeout(() => {
        press.held = true;
        consumeClick = true;
        button.dataset.hold = 'held';
      }, 500);
    });
    button.addEventListener('pointermove', event => {
      if (press?.id === event.pointerId) track(event);
    });
    button.addEventListener('pointerup', event => {
      if (press?.id !== event.pointerId) return;
      track(event);
      if (!press) return;
      const openCloud = button.dataset.hold === 'ready';
      const restore = press.held && !press.moved;
      finish();
      if (openCloud) window.open('https://cloud.gaobinbin.dev/', '_blank', 'noopener,noreferrer');
      else if (restore) setPreference('system');
    });
    for (const type of ['pointercancel', 'lostpointercapture']) {
      button.addEventListener(type, event => { if (event.pointerId === press?.id) cancel(); });
    }
    window.addEventListener('blur', cancel);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') cancel(); });
    button.addEventListener('contextmenu', event => {
      event.preventDefault();
      if (event.pointerType === 'touch' || press) return;
      setPreference('system');
    });
    button.addEventListener('click', event => {
      if (consumeClick && event.detail !== 0) return;
      setPreference(event.shiftKey ? 'system' : currentTheme() === 'dark' ? 'light' : 'dark');
    });

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
