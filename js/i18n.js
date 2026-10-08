// On-screen text in English, Bangla and Arabic. All text lives in i18n/*.json, never inside images.

export const UI_LANGS = ['en', 'bn', 'ar'];
const cache = {};
let lang = 'en';
let dict = {};
let fallback = {};

async function load(code) {
  if (!cache[code]) {
    const res = await fetch(`i18n/${code}.json`, { cache: 'no-cache' });
    cache[code] = res.ok ? await res.json() : {};
  }
  return cache[code];
}

export async function setLang(code) {
  lang = UI_LANGS.includes(code) ? code : 'en';
  fallback = await load('en');
  dict = lang === 'en' ? fallback : await load(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

export const getLang = () => lang;
export const dirOf = (code) => (code === 'ar' ? 'rtl' : 'ltr');

/** t('home.hello', { name: 'Amina' }) — numbers in vars are shown in the current language's digits. */
export function t(key, vars) {
  let s = dict[key] ?? fallback[key] ?? key;
  if (vars) {
    s = s.replace(/\{(\w+)\}/g, (_, k) => {
      const v = vars[k];
      return typeof v === 'number' ? num(v) : v ?? '';
    });
  }
  return s;
}

/** Plural-aware: uses key.one / key.other. */
export function tn(key, n, vars = {}) {
  // Only use the "one" form when the current language defines it (Bangla and Arabic use one form for all counts here).
  const form = n === 1 && dict[`${key}.one`] !== undefined ? 'one' : 'other';
  return t(`${key}.${form}`, { n, ...vars });
}

export function num(n) {
  try { return new Intl.NumberFormat(lang).format(n); } catch { return String(n); }
}

/** Picks the best text from a { en, bn, ar } object for the current language. */
export function pick(obj, prefer) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[prefer || lang] ?? obj[lang] ?? obj.en ?? Object.values(obj)[0] ?? '';
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
