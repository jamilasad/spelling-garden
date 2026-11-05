// The on-screen keyboard for Type mode. Our own keys, never the device keyboard, which suggests and
// autocorrects words (giving the spelling away) and may have no Bangla or Arabic.
//   English: lowercase QWERTY.
//   Bangla and Arabic come in two styles (Settings):
//     'focused' (default): the word's letters mixed with their look-alikes and a few random letters,
//                          in alphabet order; every vowel sign, ফলা and haraka is always there.
//     'full':              every letter, like a normal keyboard (Bangla on two pages).
// Nothing else about the keys depends on the word: no key is hidden, coloured or put first because of it.
import { t, escapeHtml, dirOf, getLang } from './i18n.js';
import { icon } from './icons.js';
import { sfx } from './sfx.js';
import { lookAlikes } from './confusions.js';

/** Splits text into keys: one character each, but ড় ঢ় য় (letter + nukta) stay one key. */
export const keysOf = (s) => (s || '').normalize('NFC').match(/.\u09BC?/gsu) || [];

const EN_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].map(keysOf);
const EN_EXTRA = ["'", '-'];

const BN_VOWELS = keysOf('অআইঈউঊঋএঐওঔ');
const BN_CONSONANTS = keysOf('কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়');
const BN_KHANDA_TA = 'ৎ';
const BN_SIGNS = keysOf('\u09BE\u09BF\u09C0\u09C1\u09C2\u09C3\u09C7\u09C8\u09CB\u09CC'); // া ি ী ু ূ ৃ ে ৈ ো ৌ
const BN_MARKS = ['\u0982', '\u0983', '\u0981', '\u09CD'];                              // ং ঃ ঁ ্
// ফলা and রেফ as one key each, the way children learn them (প + র-ফলা = প্র), not হসন্ত + letter.
const BN_FOLA = ['\u09CD\u09B0', '\u09CD\u09AF', '\u09CD\u09AC', '\u09B0\u09CD'];         // ্র ্য ্ব র্

const AR_LETTERS = keysOf('ابتثجحخدذرزسشصضطظعغفقكلمنهوي');
const AR_MORE = keysOf('ةىأإآؤئء');
const AR_HARAKAT = ['\u064E', '\u0650', '\u064F', '\u0652', '\u0651', '\u064B', '\u064D', '\u064C', '\u0670']; // َ ِ ُ ْ ّ ً ٍ ٌ ٰ

const LETTERS = { bn: [...BN_VOWELS, ...BN_CONSONANTS, BN_KHANDA_TA], ar: [...AR_LETTERS, ...AR_MORE] };
const FOCUS_ROW = 7;
const FOCUS_SIZE = 14; // letters on the focused keyboard: two rows of seven (more only for long words)
const MAX_KEYS = 40;

const MARK = /^\p{M}/u;
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

function shuffle(a, rng) {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The focused keyboard's letters: the word's own, their look-alikes, then random ones up to a fixed count. */
function focusedLetters(word, lang, rng) {
  const all = LETTERS[lang];
  const own = [...new Set(keysOf(word))].filter((k) => all.includes(k));
  const chosen = new Set([...own, ...own.flatMap((k) => lookAlikes(k, lang)).filter((k) => all.includes(k))]);
  const size = Math.max(FOCUS_SIZE, Math.ceil(chosen.size / FOCUS_ROW) * FOCUS_ROW);
  for (const k of shuffle(all.filter((x) => !chosen.has(x)), rng)) {
    if (chosen.size >= size) break;
    chosen.add(k);
  }
  return all.filter((k) => chosen.has(k));
}

/**
 * The keys for one word.
 * @returns {{ pages: string[][][], bottom: string[] }} pages of rows of keys (only full Bangla has two
 *   pages), and the keys that sit next to Space: English ' and -, plus any character the word needs that
 *   the layout lacks (a rare letter in a future word list), so every word can always be typed.
 */
export function keyboardLayout(word, lang, style = 'focused', rng = Math.random) {
  let pages;
  if (lang === 'bn' && style === 'full') {
    pages = [
      [...chunk(BN_CONSONANTS.slice(0, 30), 10), [...BN_CONSONANTS.slice(30), BN_KHANDA_TA, ...BN_MARKS.slice(0, 3)], BN_SIGNS, [BN_MARKS[3], ...BN_FOLA]],
      chunk(BN_VOWELS, 6),
    ];
  } else if (lang === 'bn') {
    pages = [[...chunk(focusedLetters(word, lang, rng), FOCUS_ROW), ...chunk([...BN_SIGNS, ...BN_MARKS, ...BN_FOLA], 9)]];
  } else if (lang === 'ar' && style === 'full') {
    pages = [[...chunk([...AR_LETTERS, ...AR_MORE], 9), AR_HARAKAT]];
  } else if (lang === 'ar') {
    pages = [[...chunk(focusedLetters(word, lang, rng), FOCUS_ROW), AR_HARAKAT.slice(0, 5), AR_HARAKAT.slice(5)]];
  } else {
    pages = [EN_ROWS];
  }
  const near = lang === 'en' ? EN_EXTRA : [];
  const have = new Set([...pages.flat(2), ...near]);
  const extra = [...new Set(keysOf(lang === 'en' ? word.toLowerCase() : word))].filter((k) => !have.has(k) && !/\s/u.test(k));
  return { pages, bottom: [...near, ...extra] };
}

/** Signs, ফলা and harakat sit on a dotted circle (Bangla) or a tatweel (Arabic), as in schoolbooks. */
const isSign = (k) => MARK.test(k) || (k.length > 1 && k.endsWith('\u09CD'));
const keyLabel = (k, lang) => {
  if (!isSign(k)) return k;
  if (!MARK.test(k)) return `${k}\u25CC`; // রেফ sits on top of the letter after it
  return `${lang === 'ar' ? '\u0640' : '\u25CC'}${k}`;
};

/**
 * Puts the answer box, the keys and the Check button into `host`. Also takes a laptop's own keyboard
 * (letters, Space, Backspace, Enter).
 * @param {{ word: string, lang: 'en'|'bn'|'ar', style?: 'focused'|'full', peek?: string, onSubmit: (typed: string) => void }} opts
 *   `peek`: Buzzy's picture to peek over the keys beside the answer box (HTML, may be empty).
 * @returns {{ value: () => string, disable: () => void, destroy: () => void }}
 */
export function createKeyboard(host, { word, lang, style = 'focused', peek = '', onSubmit }) {
  const layout = keyboardLayout(word, lang, style);
  const physical = new Set([...keyboardLayout(word, lang, 'full').pages.flat(2), ...layout.bottom, ' ']);
  const typed = []; // one entry per key press, so Backspace takes back exactly one key
  let page = 0;
  let enabled = true;

  const keyBtn = (k, cls = '') =>
    `<button class="kb-key${isSign(k) ? ' kb-mark' : ''}${cls}" type="button" tabindex="-1" data-k="${escapeHtml(k)}">${escapeHtml(keyLabel(k, lang))}</button>`;
  const pages = layout.pages.map((rows, p) =>
    `<div class="kb-page" data-page="${p}"${p ? ' hidden' : ''}>${rows.map((row) => `<div class="kb-row">${row.map((k) => keyBtn(k)).join('')}</div>`).join('')}</div>`).join('');
  const toggle = layout.pages.length > 1
    ? `<button class="kb-key kb-fn kb-toggle" type="button" tabindex="-1" data-kb="page" aria-label="${t('kb.vowels')}">${keysOf('অআ').join(' ')}</button>`
    : '';
  const rows = Math.max(...layout.pages.map((p) => p.length));
  host.innerHTML = `<div class="kb is-empty" data-lang="${lang}" style="--kb-rows:${rows}">
      <div class="kb-top">
        <div class="kb-display" lang="${lang}" dir="${dirOf(lang)}" aria-live="polite">
          <span class="kb-text"></span><span class="kb-caret" aria-hidden="true"></span>
          <span class="kb-placeholder" lang="${getLang()}" dir="${dirOf(getLang())}">${t(`kb.placeholder.${lang}`)}</span>
        </div>
        ${peek ? `<div class="kb-peek" aria-hidden="true">${peek}</div>` : ''}
      </div>
      <div class="kb-keys" lang="${lang}" dir="${dirOf(lang)}" role="group" aria-label="${t('kb.label')}">
        <div class="kb-pages">${pages}</div>
        <div class="kb-row kb-bottom">
          ${toggle}${layout.bottom.map((k) => keyBtn(k)).join('')}
          <button class="kb-key kb-space" type="button" tabindex="-1" data-k=" " lang="${getLang()}">${t('kb.space')}</button>
          <button class="kb-key kb-fn kb-back" type="button" tabindex="-1" data-kb="back" aria-label="${t('kb.backspace')}">${icon('backspace')}</button>
        </div>
      </div>
      <button class="btn btn-leaf btn-big btn-wide kb-check" type="button" data-kb="check" disabled>${icon('check')}<span>${t('kb.check')}</span></button>
    </div>`;

  const box = host.querySelector('.kb');
  const text = box.querySelector('.kb-text');
  const check = box.querySelector('.kb-check');
  const toggleBtn = box.querySelector('.kb-toggle');
  const buzzy = box.querySelector('.kb-peek');

  const value = () => typed.join('');
  const refresh = () => {
    const v = value().normalize('NFC');
    text.textContent = v;
    box.classList.toggle('is-empty', !v);
    check.disabled = !enabled || !v.trim();
  };
  const showPage = (p) => {
    page = p;
    box.querySelectorAll('.kb-page').forEach((el) => { el.hidden = Number(el.dataset.page) !== p; });
    if (toggleBtn) {
      toggleBtn.textContent = keysOf(p ? 'কখ' : 'অআ').join(' ');
      toggleBtn.setAttribute('aria-label', t(p ? 'kb.consonants' : 'kb.vowels'));
    }
  };
  const flash = (sel) => {
    const el = box.querySelector(sel);
    if (!el) return;
    el.classList.add('is-pressed');
    setTimeout(() => el.classList.remove('is-pressed'), 120);
  };
  const hop = () => {
    if (!buzzy) return;
    buzzy.classList.remove('is-hop');
    void buzzy.offsetWidth; // restarts the hop when keys come fast
    buzzy.classList.add('is-hop');
  };
  const insert = (k) => {
    if (!enabled || typed.length >= MAX_KEYS) return;
    if (k === ' ' && (!typed.length || typed[typed.length - 1] === ' ')) return;
    typed.push(k);
    sfx.key();
    hop();
    flash(`[data-k="${CSS.escape(k)}"]`);
    if (page) showPage(0); // after a vowel, back to the consonants
    refresh();
  };
  const back = () => {
    if (!enabled || !typed.length) return;
    typed.pop();
    sfx.key(true);
    flash('.kb-back');
    refresh();
  };
  const submit = () => {
    if (!enabled || !value().trim()) return;
    onSubmit(value());
  };

  const onDown = (e) => { if (e.target.closest('.kb-key')) e.preventDefault(); }; // keys never take the focus
  const onClick = (e) => {
    const key = e.target.closest('[data-k]');
    if (key) { insert(key.dataset.k); return; }
    const act = e.target.closest('[data-kb]')?.dataset.kb;
    if (act === 'back') back();
    else if (act === 'check') submit();
    else if (act === 'page' && enabled) { sfx.key(); showPage(page ? 0 : 1); }
  };
  const onKey = (e) => {
    if (!enabled || e.metaKey || e.ctrlKey || e.isComposing) return;
    if (document.querySelector('.dialog-backdrop') || e.target.closest?.('input, textarea, select')) return;
    if (e.key === 'Backspace') back();
    else if (e.key === 'Enter') submit();
    else {
      const k = lang === 'en' && e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const parts = keysOf(k);
      // Named keys ("Shift", "ArrowLeft") are plain ASCII words; an Arabic keyboard's لا key types two letters.
      if (!parts.length || (k.length > 1 && /^[\x20-\x7E]+$/.test(k)) || !parts.every((p) => physical.has(p))) return;
      parts.forEach(insert);
    }
    e.preventDefault();
    // A focused button (Hear the word, a hint) would otherwise be pressed by the same Space or Enter.
    const f = document.activeElement;
    if (f && f !== document.body && !box.contains(f)) f.blur();
  };
  box.addEventListener('pointerdown', onDown);
  box.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);

  return {
    value,
    disable() {
      enabled = false;
      box.classList.add('is-done');
      box.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      refresh();
    },
    destroy() {
      enabled = false;
      document.removeEventListener('keydown', onKey);
      host.innerHTML = '';
    },
  };
}
