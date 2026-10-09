// How each piece of a word is said when spelling it aloud, the way it's taught at school.
//   Bangla:  ঙ্গ → "উঁয়ো-এ গ", শ্রে → "তালব্য শ-এ র-ফলা এ-কার", ণি → "মূর্ধন্য ণ-এ হ্রস্ব ই-কার"
//   English: one letter at a time (b, e, d).
import { segment } from './segment.js';

const BN_CONSONANT = {
  'ঙ': 'উঁয়ো', 'ঞ': 'ইঁয়ো', 'জ': 'বর্গীয় জ', 'য': 'অন্তঃস্থ য', 'য়': 'অন্তঃস্থ অ',
  'ণ': 'মূর্ধন্য ণ', 'ন': 'দন্ত্য ন', 'শ': 'তালব্য শ', 'ষ': 'মূর্ধন্য ষ', 'স': 'দন্ত্য স',
  'ড়': 'ড-এ শূন্য ড়', 'ঢ়': 'ঢ-এ শূন্য ঢ়', 'ৎ': 'খণ্ড ত',
};
const BN_VOWEL = {
  'অ': 'স্বরে অ', 'আ': 'স্বরে আ', 'ই': 'হ্রস্ব ই', 'ঈ': 'দীর্ঘ ঈ', 'উ': 'হ্রস্ব উ', 'ঊ': 'দীর্ঘ ঊ',
  'ঋ': 'ঋ', 'এ': 'এ', 'ঐ': 'ঐ', 'ও': 'ও', 'ঔ': 'ঔ',
};
const BN_SIGN = {
  'া': 'আ-কার', 'ি': 'হ্রস্ব ই-কার', 'ী': 'দীর্ঘ ঈ-কার', 'ু': 'হ্রস্ব উ-কার', 'ূ': 'দীর্ঘ ঊ-কার',
  'ৃ': 'ঋ-কার', 'ে': 'এ-কার', 'ৈ': 'ঐ-কার', 'ো': 'ও-কার', 'ৌ': 'ঔ-কার',
};
const BN_MARK = { 'ং': 'অনুস্বার', 'ঃ': 'বিসর্গ', 'ঁ': 'চন্দ্রবিন্দু' };
const BN_PHALA = { 'য': 'য-ফলা', 'র': 'র-ফলা', 'ব': 'ব-ফলা', 'ম': 'ম-ফলা', 'ল': 'ল-ফলা' };
const HASANTA = '্';
const NUKTA = '়';

const consonantName = (c) => BN_CONSONANT[c] || c;

/** The spoken name of one Bangla tile (akshara). */
export function bnTileName(tile) {
  const chars = [...tile.normalize('NFC')];
  // Treat consonant + nukta (য়, ড়, ঢ়) as one letter.
  const units = [];
  for (const ch of chars) {
    if (ch === NUKTA && units.length) units[units.length - 1] += ch;
    else units.push(ch);
  }
  const parts = [];
  let reph = false;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (u === HASANTA) continue;
    if (BN_VOWEL[u]) parts.push(BN_VOWEL[u]);
    else if (BN_SIGN[u]) parts.push(BN_SIGN[u]);
    else if (BN_MARK[u]) parts.push(BN_MARK[u]);
    else if (u === 'র' && units[i + 1] === HASANTA && i === 0 && units.length > 2) reph = true; // র্ক: reph
    else if (units[i - 1] === HASANTA && BN_PHALA[u] && parts.length) parts.push(BN_PHALA[u]); // ্য ্র ...
    else parts.push(consonantName(u));
  }
  if (reph) parts.splice(1, 0, 'রেফ');
  if (!parts.length) return tile;
  return parts.length === 1 ? parts[0] : `${parts[0]}-এ ${parts.slice(1).join(' ')}`;
}

/** The spoken name of one tile in any language (null when the language isn't supported yet). */
export function tileName(tile, lang) {
  if (lang === 'bn') return bnTileName(tile);
  if (lang === 'en') return tile.toLowerCase();
  return null;
}

/** [{ tile, name }] for a whole word, skipping spaces. */
export function spellingOf(word) {
  return segment(word.word, word.lang)
    .filter((t) => !t.space)
    .map((t) => ({ tile: t.text, display: t.display, name: tileName(t.text, word.lang) }));
}

export const canSpell = (lang) => lang === 'bn' || lang === 'en';

/** Text the voice reads for a name (hyphens become pauses). */
export const spokenName = (name, lang) => (lang === 'en' ? `${name.toUpperCase()}.` : name.replace(/-/g, ' '));

/** File-name key for a tile's name audio. */
export const spellKey = (tile, lang) =>
  `${lang}-${[...tile.normalize('NFC')].map((c) => c.codePointAt(0).toString(16)).join('-')}`;
