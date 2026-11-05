// Type mode: checks a typed spelling strictly, tile by tile.
// Both words are put in the same Unicode form (NFC) and must then match exactly: a missing haraka,
// ি instead of ী or a different conjunct all count as wrong. Only the outside spaces, doubled
// spaces and (in English) capital letters are let off, since the keyboard has no capitals.
import { segment } from './segment.js';

const AR_HARAKAT = /[\u064B-\u0652\u0670]/g;

export function normalizeAnswer(s, lang) {
  let v = (s || '').normalize('NFC').replace(/\s+/g, ' ').trim();
  if (lang === 'en') v = v.replace(/[\u2018\u2019]/g, "'");
  return v;
}

const fold = (s, lang) => (lang === 'en' ? s.toLowerCase() : s);

/**
 * @returns {{ correct: boolean, firstWrong: number, missingAt: number, harakatOnly: boolean,
 *   target: {text, display, space, ok}[], typed: {text, display, space, ok}[] }}
 *   Tiles at the start and the end that match are `ok`; everything between them is not.
 *   `firstWrong` is the index of the first tile that differs (the same in both lists), or -1.
 *   `missingAt`: where in her tiles something was left out, when all of hers match (else -1).
 *   `harakatOnly`: Arabic letters all right, only the harakat differ.
 */
export function checkSpelling(typed, target, lang) {
  const a = normalizeAnswer(typed, lang);
  const b = normalizeAnswer(target, lang);
  const got = segment(a, lang);
  const want = segment(b, lang);
  const same = (x, y) => fold(x.text, lang) === fold(y.text, lang);

  let pre = 0;
  while (pre < want.length && pre < got.length && same(want[pre], got[pre])) pre++;
  let suf = 0;
  while (suf < want.length - pre && suf < got.length - pre && same(want[want.length - 1 - suf], got[got.length - 1 - suf])) suf++;
  const mark = (tiles) => tiles.map((tile, k) => ({ ...tile, ok: k < pre || k >= tiles.length - suf }));

  const correct = fold(a, lang) === fold(b, lang);
  return {
    correct,
    firstWrong: correct ? -1 : pre,
    missingAt: !correct && got.length - pre - suf === 0 ? pre : -1,
    harakatOnly: !correct && lang === 'ar' && a.replace(AR_HARAKAT, '') === b.replace(AR_HARAKAT, ''),
    target: mark(want),
    typed: mark(got),
  };
}
