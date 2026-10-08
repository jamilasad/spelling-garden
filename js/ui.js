// Small shared UI helpers.
import { icon } from './icons.js';
import { t, escapeHtml } from './i18n.js';
import { mascotHTML } from './art.js';

let toastTimer = 0;
export function toast(message, ms = 2600) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

export function go(path = '', params) {
  const qs = params ? `?${new URLSearchParams(params)}` : '';
  const next = `#/${path}${qs}`;
  if (location.hash === next) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = next;
}

/** back: 'home' for the garden, another route name for a back arrow, or '' for none. */
export function topbar({ title = '', back = '', end = '', start = '' } = {}) {
  let first = start || '<span class="spacer"></span>';
  if (back === 'home') {
    first = `<a class="icon-btn" href="#/" aria-label="${t('common.home')}">${icon('home')}</a>`;
  } else if (back) {
    first = `<a class="icon-btn" href="#/${back}" aria-label="${t('common.back')}">${icon('back', { className: 'flip-rtl' })}</a>`;
  }
  return `<header class="topbar">${first}<h1 class="title">${title}</h1>${end || '<span class="spacer"></span>'}</header>`;
}

/**
 * Press-and-hold behaviour (pointer, Enter or Space). Fills --p from 0 to 1.
 * @returns cleanup function
 */
export function holdButton(el, ms, onDone, onTooShort) {
  let start = 0;
  let raf = 0;
  let done = false;
  const reset = () => {
    cancelAnimationFrame(raf);
    el.style.setProperty('--p', 0);
    el.classList.remove('holding', 'is-pressed');
    start = 0;
  };
  const tick = (now) => {
    const p = Math.min(1, (now - start) / ms);
    el.style.setProperty('--p', p.toFixed(3));
    if (p >= 1) {
      done = true;
      reset();
      onDone();
    } else {
      raf = requestAnimationFrame(tick);
    }
  };
  const begin = (e) => {
    if (start || el.disabled) return;
    if (e.type === 'pointerdown') {
      if (e.button !== 0) return;
      try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    done = false;
    start = performance.now();
    el.classList.add('holding', 'is-pressed');
    raf = requestAnimationFrame(tick);
  };
  const end = () => {
    if (!start) return;
    const short = !done && performance.now() - start < ms;
    reset();
    if (short && onTooShort) onTooShort();
  };
  const key = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
      e.preventDefault();
      if (e.type === 'keydown') begin(e); else end();
    }
  };
  const clickGuard = (e) => e.preventDefault();
  el.addEventListener('pointerdown', begin);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', end);
  el.addEventListener('keydown', key);
  el.addEventListener('keyup', key);
  el.addEventListener('click', clickGuard);
  el.addEventListener('contextmenu', clickGuard);
  return () => {
    reset();
    el.removeEventListener('pointerdown', begin);
    el.removeEventListener('pointerup', end);
    el.removeEventListener('pointercancel', end);
    el.removeEventListener('lostpointercapture', end);
    el.removeEventListener('keydown', key);
    el.removeEventListener('keyup', key);
    el.removeEventListener('click', clickGuard);
    el.removeEventListener('contextmenu', clickGuard);
  };
}

export function downloadFile(name, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * A friendly in-app question instead of the browser's plain alert.
 * The "no" button is the safe choice and gets the focus.
 * @returns {Promise<boolean>} true when the "yes" button is chosen
 */
export function confirmDialog({ title, message = '', yes, no, yesTone = 'cream', noTone = 'honey', pose = 'think' }) {
  return new Promise((resolve) => {
    const before = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'dialog-backdrop';
    wrap.innerHTML = `<div class="dialog card" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-msg">
        <div class="dialog-mascot" aria-hidden="true">${mascotHTML(pose)}</div>
        <h2 id="dlg-title">${escapeHtml(title)}</h2>
        ${message ? `<p id="dlg-msg" class="lead">${escapeHtml(message)}</p>` : ''}
        <div class="dialog-actions">
          <button class="btn btn-${yesTone}" type="button" data-answer="yes">${escapeHtml(yes)}</button>
          <button class="btn btn-${noTone}" type="button" data-answer="no">${escapeHtml(no)}</button>
        </div>
      </div>`;
    const close = (answer) => {
      document.removeEventListener('keydown', onKey, true);
      wrap.classList.add('closing');
      setTimeout(() => wrap.remove(), 160);
      if (before && before.focus) before.focus({ preventScroll: true });
      resolve(answer);
    };
    const buttons = () => [...wrap.querySelectorAll('button')];
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
      else if (e.key === 'Tab') {
        const [first, last] = [buttons()[0], buttons()[buttons().length - 1]];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('[data-answer]');
      if (b) close(b.dataset.answer === 'yes');
      else if (e.target === wrap) close(false);
    });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(wrap);
    wrap.querySelector('[data-answer="no"]').focus({ preventScroll: true });
  });
}
