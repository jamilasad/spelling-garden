// The answer reveal: honeycomb letter tiles hidden under leaves that flutter away one by one.
import { segment, highlightedTiles } from './segment.js';
import { coverLeafHTML } from './art.js';
import { escapeHtml, dirOf } from './i18n.js';
import { sfx } from './sfx.js';
import { motionAllowed } from './ambient.js';

export function tilesHTML(word, { open = false, covers = true } = {}) {
  const tiles = segment(word.word, word.lang);
  const glow = highlightedTiles(tiles, word.word, word.highlight);
  const body = tiles.map((t, i) => {
    if (t.space) return '<div class="tile tile-space"></div>';
    return `<div class="tile${glow.has(i) ? ' glow' : ''}${open ? ' open' : ''}">
      <div class="hex"></div><div class="hex-in"></div>
      <div class="glyph">${escapeHtml(t.display)}</div>
      ${covers && !open ? `<div class="cover">${coverLeafHTML(i)}</div>` : ''}
    </div>`;
  }).join('');
  return `<div class="tiles" lang="${word.lang}" dir="${dirOf(word.lang)}" style="--n:${tiles.length}" aria-hidden="true">${body}</div>`;
}

/** The whole word, with the tricky parts marked (English and Bangla only — spans could break Arabic joining). */
export function bigWordHTML(word) {
  const s = word.word;
  let html = escapeHtml(s);
  if (word.lang !== 'ar' && word.highlight?.length) {
    const parts = [];
    let from = 0;
    for (const h of word.highlight) {
      const at = s.indexOf(h, from);
      if (at < 0) continue;
      parts.push(escapeHtml(s.slice(from, at)), `<span class="hl">${escapeHtml(h)}</span>`);
      from = at + h.length;
    }
    parts.push(escapeHtml(s.slice(from)));
    html = parts.join('');
  }
  return `<div class="big-word" lang="${word.lang}" dir="${dirOf(word.lang)}">${html}</div>`;
}

/** Plays the reveal. Resolves when every tile is open. */
export function runReveal(root, { mode = 'letters' } = {}) {
  const tiles = [...root.querySelectorAll('.tile:not(.tile-space)')];
  return new Promise((resolve) => {
    if (!motionAllowed() || mode === 'word') {
      tiles.forEach((t) => t.classList.add('open'));
      sfx.whoosh();
      setTimeout(resolve, motionAllowed() ? 750 : 60);
      return;
    }
    const step = tiles.length > 8 ? 200 : 260;
    tiles.forEach((t, i) => setTimeout(() => { t.classList.add('open'); sfx.pop(i); }, 200 + i * step));
    setTimeout(resolve, 200 + tiles.length * step + 450);
  });
}
