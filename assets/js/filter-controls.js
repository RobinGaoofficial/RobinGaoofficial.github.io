/* Shared, theme-aware controls. Native fields remain the source of values. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FilterControls = api;
})(typeof window === 'undefined' ? null : window, function () {
  function monthDays(year, month) {
    const first = new Date(year, month, 1);
    return {
      offset: (first.getDay() + 6) % 7,
      dates: Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) =>
        `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`)
    };
  }

  function enhanceSelect(select) {
    const host = document.createElement('div');
    host.className = 'filter-select';
    select.before(host);
    host.append(select);
    const label = document.querySelector(`label[for="${select.id}"]`);
    const button = document.createElement('button');
    button.type = 'button';
    button.id = `${select.id}-button`;
    button.className = 'filter-control';
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    if (label) label.htmlFor = button.id;
    const list = document.createElement('div');
    list.id = `${select.id}-options`;
    list.className = 'filter-options';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', label ? label.textContent : '筛选选项');
    list.hidden = true;
    button.setAttribute('aria-controls', list.id);
    const options = Array.from(select.options).map(option => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'filter-option';
      item.setAttribute('role', 'option');
      item.tabIndex = -1;
      item.textContent = option.text;
      item.dataset.value = option.value;
      item.addEventListener('click', () => {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        close(true);
      });
      list.append(item);
      return item;
    });
    function sync() {
      const selected = select.selectedOptions[0];
      button.textContent = selected ? selected.text : '请选择';
      button.setAttribute('aria-label', `${label ? label.textContent : '筛选'}：${button.textContent}`);
      options.forEach(item => item.setAttribute('aria-selected', String(item.dataset.value === select.value)));
    }
    function close(focus = false) {
      list.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      if (focus) button.focus();
    }
    function open() {
      list.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      (options.find(item => item.dataset.value === select.value) || options[0]).focus();
    }
    button.addEventListener('click', () => list.hidden ? open() : close());
    button.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(); }
    });
    host.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(true); }
      if (!list.hidden && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const index = options.indexOf(document.activeElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 :
          (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
        options[next].focus();
      }
    });
    host.addEventListener('focusout', event => { if (!host.contains(event.relatedTarget)) close(); });
    document.addEventListener('pointerdown', event => { if (!host.contains(event.target)) close(); });
    select.addEventListener('change', sync);
    select.hidden = true;
    host.append(button, list);
    sync();
    return { sync, close };
  }

  function enhanceDates(inputs) {
    const dialog = document.createElement('dialog');
    dialog.className = 'filter-calendar';
    dialog.setAttribute('aria-labelledby', 'calendar-title');
    // Static markup only; article content and URL values never become HTML.
    dialog.innerHTML = '<header class="calendar-heading"><h2 id="calendar-title">选择日期</h2><button type="button" class="calendar-close" aria-label="关闭日历">×</button></header><div class="calendar-month"><button type="button" class="calendar-prev" aria-label="上个月">‹</button><strong aria-live="polite"></strong><button type="button" class="calendar-next" aria-label="下个月">›</button></div><div class="calendar-week" aria-hidden="true"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div><div class="calendar-days" role="group" aria-label="日期"></div><div class="calendar-footer"><button type="button" class="calendar-clear">清除此日期</button><button type="button" class="calendar-today">今天</button></div>';
    document.body.append(dialog);
    const days = dialog.querySelector('.calendar-days');
    const heading = dialog.querySelector('.calendar-month strong');
    let active;
    let displayed;
    const buttons = inputs.map(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      const button = document.createElement('button');
      button.type = 'button';
      button.id = `${input.id}-button`;
      button.className = 'filter-control date-control';
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-describedby', 'date-error');
      button.dataset.label = label.textContent;
      label.htmlFor = button.id;
      input.hidden = true;
      input.after(button);
      button.addEventListener('click', () => {
        active = input;
        const today = new Date();
        const parts = input.value.split('-').map(Number);
        displayed = input.value ? new Date(parts[0], parts[1] - 1, 1) : new Date(today.getFullYear(), today.getMonth(), 1);
        dialog.querySelector('h2').textContent = `选择${button.dataset.label}`;
        draw();
        dialog.showModal();
        focusDay();
      });
      return button;
    });
    function sync() {
      buttons.forEach((button, i) => {
        button.textContent = inputs[i].value || '选择日期';
        button.setAttribute('aria-label', `${button.dataset.label}：${button.textContent}`);
      });
    }
    function focusDay(value) {
      const target = value && days.querySelector(`[data-date="${value}"]`);
      (target || days.querySelector('[aria-pressed="true"]') || days.querySelector('button')).focus();
    }
    function choose(value) {
      active.value = value;
      active.dispatchEvent(new Event('input', { bubbles: true }));
      sync();
      dialog.close();
    }
    function draw() {
      const year = displayed.getFullYear();
      const month = displayed.getMonth();
      heading.textContent = `${year} 年 ${month + 1} 月`;
      days.replaceChildren();
      const grid = monthDays(year, month);
      grid.dates.forEach((value, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.date = value;
        button.textContent = String(index + 1);
        button.setAttribute('aria-label', value);
        button.setAttribute('aria-pressed', String(active.value === value));
        if (index === 0) button.style.gridColumnStart = grid.offset + 1;
        button.addEventListener('click', () => choose(value));
        button.addEventListener('keydown', event => {
          const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
          if (!delta) return;
          event.preventDefault();
          const next = new Date(year, month, index + 1 + delta);
          const target = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
          displayed = new Date(next.getFullYear(), next.getMonth(), 1);
          draw();
          focusDay(target);
        });
        days.append(button);
      });
    }
    dialog.querySelector('.calendar-prev').addEventListener('click', () => { displayed.setMonth(displayed.getMonth() - 1); draw(); });
    dialog.querySelector('.calendar-next').addEventListener('click', () => { displayed.setMonth(displayed.getMonth() + 1); draw(); });
    dialog.querySelector('.calendar-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.calendar-clear').addEventListener('click', () => choose(''));
    dialog.querySelector('.calendar-today').addEventListener('click', () => {
      const today = new Date();
      choose(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
    });
    dialog.addEventListener('click', event => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
    });
    inputs.forEach(input => input.addEventListener('input', sync));
    sync();
    return { sync, close: () => dialog.close() };
  }
  return { enhanceSelect, enhanceDates, monthDays };
});
