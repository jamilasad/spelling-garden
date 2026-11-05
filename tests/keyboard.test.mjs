import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// A tiny browser stand-in: the keyboard plays sounds, and the sounds read the settings.
globalThis.window = { addEventListener() {} };
const { keyboardLayout, keysOf } = await import('../js/keyboard.js');

const LISTS = [['words-en', 'en'], ['words-bn', 'bn'], ['words-ar', 'ar']];
const words = (file) => JSON.parse(readFileSync(new URL(`../data/${file}.json`, import.meta.url)));
const keySet = (layout) => new Set([...layout.pages.flat(2), ...layout.bottom, ' ']);

function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

test('every word in the lists can be typed on both keyboards', () => {
  for (const [file, lang] of LISTS) {
    for (const w of words(file)) {
      for (const style of ['focused', 'full']) {
        const keys = keySet(keyboardLayout(w.word, lang, style, seeded(1)));
        const text = lang === 'en' ? w.word.toLowerCase() : w.word;
        for (const k of keysOf(text)) assert.ok(keys.has(k), `${w.id} (${style}): no key for "${k}"`);
      }
    }
  }
});

test('a word with a letter the layout lacks gets that key, so it can still be typed', () => {
  assert.deepEqual(keyboardLayout('café', 'en').bottom, ["'", '-', 'é']);
  assert.ok(keyboardLayout('ٱلْكِتَابُ', 'ar', 'full').bottom.includes('ٱ'));
});

test('English is lowercase QWERTY, whatever the word', () => {
  const a = keyboardLayout('giraffe', 'en', 'focused');
  const b = keyboardLayout('scooter', 'en', 'full');
  assert.deepEqual(a, b);
  assert.deepEqual(a.pages[0].map((row) => row.join('')), ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']);
});

test('full keyboards have every letter and sign and never depend on the word', () => {
  const bn = keyboardLayout('শ্রেণি', 'bn', 'full');
  assert.deepEqual(bn, keyboardLayout('ব্যাঙ', 'bn', 'full'));
  const bnKeys = keySet(bn);
  for (const k of keysOf('অআইঈউঊঋএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়ৎািীুূৃেৈোৌ্ংঃঁ')) {
    assert.ok(bnKeys.has(k), `Bangla full keyboard lacks ${k}`);
  }
  assert.equal(bn.pages.length, 2, 'consonants and signs, then vowels');

  const ar = keyboardLayout('قَلَمٌ', 'ar', 'full');
  assert.deepEqual(ar, keyboardLayout('يَوْمٌ', 'ar', 'full'));
  const arKeys = keySet(ar);
  for (const k of keysOf('ابتثجحخدذرزسشصضطظعغفقكلمنهويأإؤئءآةىًٌٍَُِّْٰ')) {
    assert.ok(arKeys.has(k), `Arabic full keyboard lacks ${k}`);
  }
});

test('focused keyboards: the word\'s letters, their look-alikes, all signs, and the same count for every word', () => {
  const r = keyboardLayout('শ্রেণি', 'bn', 'focused', seeded(7));
  const keys = keySet(r);
  for (const k of ['শ', 'র', 'ণ', 'ন', 'ষ', 'স']) assert.ok(keys.has(k), `missing ${k}`);
  for (const k of keysOf('ািীুূৃেৈোৌ্ংঃঁ')) assert.ok(keys.has(k));

  const ar = keySet(keyboardLayout('سَبْعَةٌ', 'ar', 'focused', seeded(7)));
  for (const k of ['ة', 'ه', 'ت', 'س', 'ص']) assert.ok(ar.has(k), `missing ${k}`);
  for (const k of ['َ', 'ِ', 'ُ', 'ً', 'ٍ', 'ٌ', 'ْ', 'ّ', 'ٰ']) assert.ok(ar.has(k));

  // The number of keys must not hint at how long the word is.
  for (const [file, lang] of LISTS.slice(1)) {
    const sizes = new Set(words(file).map((w) => keyboardLayout(w.word, lang, 'focused', seeded(3)).pages.flat(2).length));
    assert.equal(sizes.size, 1, `${lang}: ${[...sizes]}`);
  }
});

test('focused letters come in alphabet order, so nothing stands out as the word', () => {
  const order = keysOf('অআইঈউঊঋএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়ৎ');
  for (const seed of [1, 2, 3]) {
    const letters = keyboardLayout('বিদ্যালয়', 'bn', 'focused', seeded(seed)).pages[0].flat().filter((k) => order.includes(k));
    assert.deepEqual(letters, [...letters].sort((a, b) => order.indexOf(a) - order.indexOf(b)));
  }
});

test('Bangla ফলা and রেফ are one key each, always there on both keyboards', () => {
  for (const style of ['focused', 'full']) {
    for (const word of ['প্রথম', 'বিদ্যালয়', 'টগর ফুল']) {
      const keys = keySet(keyboardLayout(word, 'bn', style, seeded(5)));
      for (const k of ['্র', '্য', '্ব', 'র্', '্']) assert.ok(keys.has(k), `${style} ${word}: no key for ${k}`);
    }
  }
  // প + র-ফলা + থ + ম is the same text as the word.
  assert.equal(['প', '্র', 'থ', 'ম'].join('').normalize('NFC'), 'প্রথম'.normalize('NFC'));
});
