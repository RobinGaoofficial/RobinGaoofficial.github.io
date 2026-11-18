/* Left-drag-only Nextcloud entrance. Not a link or a keyboard control. */
(() => {
  function bind() {
    const cloud = document.getElementById('cloud-drag-handle');
    if (!cloud) return;
    const threshold = 40;
    const maxTravel = 48;
    let drag = null;

    function reset() {
      const pointerId = drag && drag.pointerId;
      drag = null;
      cloud.classList.remove('is-dragging', 'is-armed');
      cloud.style.removeProperty('--cloud-x');
      if (pointerId !== null && pointerId !== undefined &&
          cloud.hasPointerCapture(pointerId)) {
        cloud.releasePointerCapture(pointerId);
      }
    }

    cloud.addEventListener('pointerdown', event => {
      if (drag || !event.isPrimary || event.button !== 0) return;
      drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
      cloud.classList.add('is-dragging');
      cloud.setPointerCapture(event.pointerId);
    });
    cloud.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (Math.abs(dy) > 16 && Math.abs(dy) > Math.abs(dx)) {
        reset();
        return;
      }
      const distance = Math.max(0, Math.min(maxTravel, -dx));
      cloud.style.setProperty('--cloud-x', -distance + 'px');
      cloud.classList.toggle('is-armed', distance >= threshold && Math.abs(dy) <= 18);
    });
    cloud.addEventListener('pointerup', event => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      const shouldOpen = dx <= -threshold && Math.abs(dy) <= 18;
      reset();
      if (shouldOpen) {
        window.open('https://cloud.gaobinbin.dev/', '_blank', 'noopener,noreferrer');
      }
    });
    cloud.addEventListener('pointercancel', reset);
    cloud.addEventListener('lostpointercapture', () => { if (drag) reset(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
