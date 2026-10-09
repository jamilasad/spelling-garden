// Wrong-but-believable choices for the Missing-letters game, built from the mix-ups children
// really make: ি/ী and ন/ণ in Bangla, ة/ه and missing harakat in Arabic, b/d and vowels in English.

const EN = {
  a: 'eiou', e: 'aiy', i: 'eya', o: 'aue', u: 'oa', y: 'ie',
  b: 'dp', d: 'bt', p: 'bq', q: 'pk', c: 'ks', k: 'cq', s: 'cz', z: 's', g: 'jk', j: 'g',
  f: 'vp', v: 'fw', w: 'uv', m: 'n', n: 'm', l: 'r', r: 'l', t: 'd', h: 'n', x: 'k',
};
const EN_FILL = 'aeioustrnlcdm';

// Bangla: each character with the characters it is commonly confused with.
const BN = {
  'ি': 'ী', 'ী': 'ি', 'ু': 'ূ', 'ূ': 'ু', 'ে': 'ৈ', 'ৈ': 'ে', 'ো': 'ৌ', 'ৌ': 'ো',
  'ন': 'ণ', 'ণ': 'ন', 'শ': 'ষস', 'ষ': 'শস', 'স': 'শষ', 'জ': 'য', 'য': 'জ', 'য়': 'য',
  'র': 'ড়', 'ড়': 'র', 'ঙ': 'ং', 'ং': 'ঙ', 'ৎ': 'ত', 'ত': 'ৎথ', 'থ': 'ত',
  'ট': 'ঠ', 'ঠ': 'ট', 'ক': 'খ', 'খ': 'ক', 'গ': 'ঘ', 'ঘ': 'গ', 'দ': 'ধ', 'ধ': 'দ',
  'ব': 'ভ', 'ভ': 'ব', 'প': 'ফ', 'ফ': 'প', 'চ': 'ছ', 'ছ': 'চ',
  'ই': 'ঈ', 'ঈ': 'ই', 'উ': 'ঊ', 'ঊ': 'উ', 'ঐ': 'এ', 'আ': 'অ', 'অ': 'আ', 'ও': 'ঔ',
};
const BN_FILL = ['কা', 'লি', 'মে', 'রা', 'দি', 'নো', 'সু', 'তা'];

// Arabic: letters and marks that are commonly confused.
const AR = {
  'ة': 'هت', 'ه': 'ةح', 'ت': 'طة', 'ط': 'ت', 'ث': 'سذ', 'س': 'صث', 'ص': 'س',
  'أ': 'إا', 'إ': 'أا', 'ا': 'أى', 'ء': 'أ', 'ى': 'يا', 'ي': 'ى',
  'ض': 'دظ', 'ظ': 'ضز', 'د': 'ذض', 'ذ': 'زد', 'ز': 'ذر', 'ر': 'ز',
  'ح': 'خه', 'خ': 'ح', 'ق': 'ك', 'ك': 'ق', 'ع': 'غ', 'غ': 'ع', 'و': 'ؤ',
  'َ': 'ُِ', // fatha  ↔ kasra, damma
  'ِ': 'َُ', // kasra  ↔ fatha, damma
  'ُ': 'ٌَ', // damma  ↔ fatha, tanween damma
  'ْ': 'َ',       // sukun  ↔ fatha
  'ٌ': 'ٍُ', // tanween damma ↔ damma, tanween kasra
  'ٍ': 'ٌ',       // tanween kasra ↔ tanween damma
  'ً': 'ٌ',       // tanween fatha ↔ tanween damma
};
const AR_FILL = ['بَ', 'تِ', 'نُ', 'مْ', 'لَ', 'رِ'];

const DROPPABLE = {
  bn: ['ঁ', '্য', '্র'],
  ar: ['ٰ', 'ّ'],  // dagger alif, shadda
};

function shuffle(a, rng) {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Every variant of `text` with one character swapped for a look-alike, or one small mark dropped. */
function variants(text, lang) {
  const map = lang === 'bn' ? BN : lang === 'ar' ? AR : null;
  const out = new Set();
  const chars = [...text];
  if (map) {
    chars.forEach((ch, i) => {
      for (const alt of map[ch] || '') out.add([...chars.slice(0, i), alt, ...chars.slice(i + 1)].join(''));
    });
  }
  for (const piece of DROPPABLE[lang] || []) {
    if (text.includes(piece)) out.add(text.replace(piece, ''));
  }
  if (lang === 'bn' && /[ািীেো]$/.test(text) && !text.includes('ঁ')) out.add(`${text}ঁ`);
  out.delete(text);
  out.delete('');
  return [...out].map((v) => v.normalize('NFC')).filter((v) => v !== text.normalize('NFC'));
}

/**
 * Wrong choices for one missing tile.
 * @param {string} tile    the correct tile text (one letter / akshara / letter with harakat)
 * @param {'en'|'bn'|'ar'} lang
 * @param {number} count   how many wrong choices
 * @param {string[]} others other tiles in the same word, used to top up the list
 */
export function distractors(tile, lang, count = 2, others = [], rng = Math.random) {
  const correct = tile.normalize('NFC');
  const picked = [];
  const add = (c) => {
    const v = c.normalize('NFC');
    if (v && v !== correct && !picked.includes(v) && picked.length < count) picked.push(v);
  };

  if (lang === 'en') {
    const lower = correct.toLowerCase();
    shuffle([...(EN[lower] || '')], rng).forEach(add);
    if (picked.length < count) shuffle([...EN_FILL], rng).forEach(add);
    return picked;
  }

  shuffle(variants(correct, lang), rng).forEach(add);
  if (picked.length < count) shuffle(others, rng).forEach(add);
  if (picked.length < count) shuffle(lang === 'bn' ? BN_FILL : AR_FILL, rng).forEach(add);
  return picked;
}

/**
 * Which tiles to hide: the tricky (highlighted) ones, at most `max`, never every tile.
 * @param {number[]} highlighted tile indexes in reading order
 * @param {number[]} letterTiles indexes of all non-space tiles
 */
export function pickBlanks(highlighted, letterTiles, max = 3, rng = Math.random) {
  let pool = highlighted.filter((i) => letterTiles.includes(i));
  if (!pool.length) pool = letterTiles.slice();
  let chosen = pool.length > max ? shuffle(pool, rng).slice(0, max) : pool.slice();
  if (chosen.length >= letterTiles.length && letterTiles.length > 1) {
    chosen = shuffle(chosen, rng).slice(0, letterTiles.length - 1);
  }
  return chosen.sort((a, b) => a - b);
}
