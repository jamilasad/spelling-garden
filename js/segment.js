// Splits a word into "tiles" — the units a child writes one at a time.
//   English: one letter per tile.
//   Bangla:  one akshara per tile (consonants joined by হসন্ত, plus vowel signs and ঁ).
//            ং ঃ ৎ are written as separate glyphs, so they get their own tiles.
//   Arabic:  one letter per tile, together with all of its harakat.
// Written by hand rather than with Intl.Segmenter, whose handling of Bangla
// conjuncts differs between browser versions.

const ZWJ = '‍';

const isSpace = (c) => c === 0x20 || c === 0xa0;
const isZeroWidth = (c) => c === 0x200c || c === 0x200d;

// ---- Bangla ----
const BN_NUKTA = 0x09bc;
const BN_HASANTA = 0x09cd;
const BN_CHANDRABINDU = 0x0981;
const isBnConsonant = (c) => (c >= 0x0995 && c <= 0x09b9) || (c >= 0x09dc && c <= 0x09df) || c === 0x09f0 || c === 0x09f1;
const isBnIndependentVowel = (c) => c >= 0x0985 && c <= 0x0994;
const isBnVowelSign = (c) => (c >= 0x09be && c <= 0x09cc) || c === 0x09d7 || c === 0x09e2 || c === 0x09e3;

function bnClusterEnd(s, i) {
  const c = s.charCodeAt(i);
  let j = i + 1;
  if (isBnConsonant(c)) {
    if (s.charCodeAt(j) === BN_NUKTA) j++;
    while (s.charCodeAt(j) === BN_HASANTA) {
      let k = j + 1;
      if (isZeroWidth(s.charCodeAt(k))) k++;
      if (k < s.length && isBnConsonant(s.charCodeAt(k))) {
        j = k + 1;
        if (s.charCodeAt(j) === BN_NUKTA) j++;
      } else {
        j = k; // trailing হসন্ত stays with its consonant
        break;
      }
    }
    while (j < s.length && isBnVowelSign(s.charCodeAt(j))) j++;
    if (s.charCodeAt(j) === BN_CHANDRABINDU) j++;
  } else if (isBnIndependentVowel(c)) {
    if (s.charCodeAt(j) === BN_CHANDRABINDU) j++;
  }
  return j;
}

// ---- Arabic ----
const AR_HAMZA = 0x0621;
const isArMark = (c) =>
  (c >= 0x064b && c <= 0x065f) || c === 0x0670 || c === 0x0640 ||
  (c >= 0x0610 && c <= 0x061a) || (c >= 0x06d6 && c <= 0x06ed && c !== 0x06dd && c !== 0x06de);
const isArLetter = (c) => (c >= 0x0620 && c <= 0x064a) || (c >= 0x066e && c <= 0x06d3) || (c >= 0x06fa && c <= 0x06ff);
// Letters that connect only to the letter before them (never to the next one).
const AR_RIGHT_JOINING = new Set([0x0622, 0x0623, 0x0624, 0x0625, 0x0627, 0x0629, 0x062f, 0x0630, 0x0631, 0x0632, 0x0648, 0x0671, 0x0698]);
const isArDualJoining = (c) => isArLetter(c) && c !== AR_HAMZA && !AR_RIGHT_JOINING.has(c);
const isArJoinable = (c) => isArLetter(c) && c !== AR_HAMZA;

function arClusterEnd(s, i) {
  let j = i + 1;
  while (j < s.length && isArMark(s.charCodeAt(j))) j++;
  return j;
}

function genericClusterEnd(s, i) {
  const cp = s.codePointAt(i);
  return i + (cp > 0xffff ? 2 : 1);
}

/**
 * @returns {{text:string, display:string, start:number, end:number, space:boolean}[]}
 *   `display` adds zero-width joiners to Arabic tiles so each letter keeps the
 *   joined shape it has inside the word.
 */
export function segment(word, lang) {
  const s = (word || '').normalize('NFC');
  const clusterEnd = lang === 'bn' ? bnClusterEnd : lang === 'ar' ? arClusterEnd : genericClusterEnd;
  const tiles = [];
  let i = 0;
  while (i < s.length) {
    const c = s.charCodeAt(i);
    if (isSpace(c)) {
      tiles.push({ text: ' ', display: ' ', start: i, end: i + 1, space: true });
      i++;
      continue;
    }
    const end = clusterEnd(s, i);
    const text = s.slice(i, end);
    tiles.push({ text, display: text, start: i, end, space: false });
    i = end;
  }
  if (lang === 'ar') addArabicJoiners(tiles);
  return tiles;
}

function addArabicJoiners(tiles) {
  tiles.forEach((t, idx) => {
    if (t.space) return;
    const base = t.text.charCodeAt(0);
    const prev = tiles[idx - 1];
    const next = tiles[idx + 1];
    const joinPrev = prev && !prev.space && isArDualJoining(prev.text.charCodeAt(0)) && isArJoinable(base);
    const joinNext = next && !next.space && isArDualJoining(base) && isArJoinable(next.text.charCodeAt(0));
    t.display = (joinPrev ? ZWJ : '') + t.text + (joinNext ? ZWJ : '');
  });
}

/**
 * Which tiles to make glow. Each highlight is a substring, searched in order,
 * each search starting where the previous match ended.
 * @returns {Set<number>} tile indexes
 */
export function highlightedTiles(tiles, word, highlights = []) {
  const s = (word || '').normalize('NFC');
  const out = new Set();
  let from = 0;
  for (const h of highlights) {
    const needle = h.normalize('NFC');
    const at = s.indexOf(needle, from);
    if (at < 0) continue;
    const endAt = at + needle.length;
    tiles.forEach((t, idx) => {
      if (!t.space && t.start < endAt && t.end > at) out.add(idx);
    });
    from = endAt;
  }
  return out;
}

/** Hides every appearance of `word` inside `sentence`, so a spoken-sentence hint can be shown without giving the spelling away. */
export function maskWord(sentence, word, mask = '＿＿＿') {
  if (!sentence) return '';
  const s = sentence.normalize('NFC');
  const w = (word || '').normalize('NFC');
  if (!w) return s;
  const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return s.replace(new RegExp(escaped, 'giu'), mask);
}
