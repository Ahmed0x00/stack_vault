/* StackVault shared UI — toasts + confirm dialogs (no native alert/confirm) */
(function (global) {
  const TOAST_TTL = 3800;

  function ensureToastHost() {
    let host = document.getElementById('sv-toast-host');
    if (host) return host;
    host = document.createElement('div');
    host.id = 'sv-toast-host';
    host.className = 'sv-toast-host';
    host.setAttribute('aria-live', 'polite');
    host.setAttribute('aria-relevant', 'additions');
    document.body.appendChild(host);
    return host;
  }

  function svToast(message, type) {
    const kind = type || 'info';
    const host = ensureToastHost();
    const el = document.createElement('div');
    el.className = 'sv-toast sv-toast--' + kind;
    el.setAttribute('role', kind === 'error' ? 'alert' : 'status');

    const icons = {
      success: '✓',
      error: '!',
      warning: '!',
      info: 'i'
    };

    el.innerHTML =
      '<span class="sv-toast__icon" aria-hidden="true">' + (icons[kind] || icons.info) + '</span>' +
      '<span class="sv-toast__msg"></span>' +
      '<button type="button" class="sv-toast__close" aria-label="Dismiss">&times;</button>';
    el.querySelector('.sv-toast__msg').textContent = String(message || '');

    const remove = () => {
      el.classList.add('sv-toast--out');
      setTimeout(() => el.remove(), 220);
    };

    el.querySelector('.sv-toast__close').addEventListener('click', remove);
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('sv-toast--in'));
    setTimeout(remove, TOAST_TTL);
  }

  function svConfirm(opts) {
    const options = opts || {};
    return new Promise((resolve) => {
      const existing = document.getElementById('sv-confirm-modal');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'sv-confirm-modal';
      overlay.className = 'sv-modal-overlay';
      overlay.innerHTML =
        '<div class="sv-modal" role="dialog" aria-modal="true" aria-labelledby="sv-confirm-title">' +
          '<h3 id="sv-confirm-title" class="sv-modal__title"></h3>' +
          '<p class="sv-modal__body"></p>' +
          '<div class="sv-modal__actions">' +
            '<button type="button" class="sv-btn sv-btn--ghost" data-sv-cancel></button>' +
            '<button type="button" class="sv-btn sv-btn--primary" data-sv-ok></button>' +
          '</div>' +
        '</div>';

      overlay.querySelector('.sv-modal__title').textContent = options.title || 'Confirm';
      overlay.querySelector('.sv-modal__body').textContent = options.message || '';
      overlay.querySelector('[data-sv-cancel]').textContent = options.cancelText || 'Cancel';
      const okBtn = overlay.querySelector('[data-sv-ok]');
      okBtn.textContent = options.confirmText || 'Confirm';
      if (options.danger) okBtn.classList.add('sv-btn--danger');

      const finish = (value) => {
        document.removeEventListener('keydown', onKey);
        overlay.remove();
        resolve(value);
      };

      const onKey = (e) => {
        if (e.key === 'Escape') finish(false);
      };

      overlay.querySelector('[data-sv-cancel]').addEventListener('click', () => finish(false));
      okBtn.addEventListener('click', () => finish(true));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) finish(false);
      });
      document.addEventListener('keydown', onKey);

      document.body.appendChild(overlay);
      okBtn.focus();
    });
  }

  global.svToast = svToast;
  global.svConfirm = svConfirm;
})(window);
