// The answer reveal: honeycomb letter tiles hidden under leaves that flutter away one by one.
import { segment, highlightedTiles } from './segment.js';
import { coverLeafHTML } from './art.js';
import { escapeHtml, dirOf } from './i18n.js';
import { sfx } from './sfx.js';
import { motionAllowed } from './ambient.js';

export function tilesHTML(word, { open = false, covers = true } = {}) {
  const tiles = segment(word.word, word.lang);
  return tileRowHTML(tiles, word.lang, { glow: highlightedTiles(tiles, word.word, word.highlight), open, covers });
}

/** Honeycomb tiles for already-segmented text. A tile may carry its own classes in `cls`. */
export function tileRowHTML(tiles, lang, { glow = new Set(), open = false, covers = true, cls = '' } = {}) {
  const body = tiles.map((t, i) => {
    if (t.space) return `<div class="tile tile-space${t.cls ? ` ${t.cls}` : ''}"></div>`;
    return `<div class="tile${glow.has(i) ? ' glow' : ''}${open ? ' open' : ''}${t.cls ? ` ${t.cls}` : ''}" style="--k:${i}">
      <div class="hex"></div><div class="hex-in"></div>
      <div class="glyph">${escapeHtml(t.display)}</div>
      ${covers && (!open || covers === 'always') ? `<div class="cover">${coverLeafHTML(i)}</div>` : ''}
    </div>`;
  }).join('');
  return `<div class="tiles${cls ? ` ${cls}` : ''}" lang="${lang}" dir="${dirOf(lang)}" style="--n:${tiles.length}" aria-hidden="true">${body}</div>`;
}

/** Type mode: green where her spelling matches, orange where it differs; the first difference pulses. */
export function markChecked(root, tiles, firstWrong) {
  root.querySelectorAll('.tile').forEach((el, k) => {
    if (!tiles[k]) return;
    el.classList.add(tiles[k].ok ? 'ok' : 'bad');
    el.classList.toggle('first', k === firstWrong && !tiles[k].ok);
  });
}

/** Type mode: what she typed, as small open tiles. Once `marked`, coloured like the answer, with an
 *  empty orange tile where letters are missing. */
export function typedTilesHTML(result, lang, marked = false) {
  const tiles = result.typed.map((tile, k) => ({
    ...tile,
    cls: marked ? `${tile.ok ? 'ok' : 'bad'}${k === result.firstWrong && !tile.ok ? ' first' : ''}` : '',
  }));
  if (marked && result.missingAt >= 0) tiles.splice(result.missingAt, 0, { text: '', display: '', space: false, cls: 'tile-gap bad first' });
  return tileRowHTML(tiles, lang, { open: true, covers: false, cls: 'typed-tiles' });
}

/** The word with its tricky parts marked (English and Bangla only — spans could break Arabic joining). */
export function markedWordHTML(word) {
  const s = word.word;
  if (word.lang === 'ar' || !word.highlight?.length) return escapeHtml(s);
  const parts = [];
  let from = 0;
  for (const h of word.highlight) {
    const at = s.indexOf(h, from);
    if (at < 0) continue;
    parts.push(escapeHtml(s.slice(from, at)), `<span class="hl">${escapeHtml(h)}</span>`);
    from = at + h.length;
  }
  parts.push(escapeHtml(s.slice(from)));
  return parts.join('');
}

export function bigWordHTML(word) {
  return `<div class="big-word" lang="${word.lang}" dir="${dirOf(word.lang)}">${markedWordHTML(word)}</div>`;
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
