import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { segment, highlightedTiles, maskWord } from '../js/segment.js';

const texts = (word, lang) => segment(word, lang).map((t) => t.text);

test('English: one tile per letter', () => {
  assert.deepEqual(texts('giraffe', 'en'), ['g', 'i', 'r', 'a', 'f', 'f', 'e']);
});

test('Bangla: conjuncts, vowel signs and chandrabindu stay together', () => {
  assert.deepEqual(texts('শ্রেণি', 'bn'), ['শ্রে', 'ণি']);
  assert.deepEqual(texts('বিদ্যালয়', 'bn'), ['বি', 'দ্যা', 'ল', 'য়']);
  assert.deepEqual(texts('মঙ্গলবার', 'bn'), ['ম', 'ঙ্গ', 'ল', 'বা', 'র']);
  assert.deepEqual(texts('চমৎকার', 'bn'), ['চ', 'ম', 'ৎ', 'কা', 'র']);
  assert.deepEqual(texts('কাঁঠাল', 'bn'), ['কাঁ', 'ঠা', 'ল']);
  assert.deepEqual(texts('প্রথম', 'bn'), ['প্র', 'থ', 'ম']);
  assert.deepEqual(texts('ব্যাঙ', 'bn'), ['ব্যা', 'ঙ']);
  assert.deepEqual(texts('দোয়েল', 'bn'), ['দো', 'য়ে', 'ল']);
});

test('Bangla: anusvara is its own tile; spaces split words', () => {
  assert.deepEqual(texts('বাংলাদেশ', 'bn'), ['বা', 'ং', 'লা', 'দে', 'শ']);
  const tiles = segment('টগর ফুল', 'bn');
  assert.deepEqual(tiles.map((t) => t.text), ['ট', 'গ', 'র', ' ', 'ফু', 'ল']);
  assert.equal(tiles[3].space, true);
});

test('Arabic: each letter carries its harakat', () => {
  assert.deepEqual(texts('هٰذِهِ', 'ar'), ['هٰ', 'ذِ', 'هِ']);
  assert.deepEqual(texts('اِثْنَانِ', 'ar'), ['اِ', 'ثْ', 'نَ', 'ا', 'نِ']);
  assert.deepEqual(texts('سَبْعَةٌ', 'ar'), ['سَ', 'بْ', 'عَ', 'ةٌ']);
});

test('Arabic: joiners keep the in-word letter shapes', () => {
  const ZWJ = '‍';
  const t = segment('حِذَاءٌ', 'ar').map((x) => x.display);
  // ح joins forward; ذ joins back only; ا and ء stand alone.
  assert.deepEqual(t, ['حِ' + ZWJ, ZWJ + 'ذَ', 'ا', 'ءٌ']);
});

test('every word in the lists segments back to itself', () => {
  for (const [file, lang] of [['words-en', 'en'], ['words-bn', 'bn'], ['words-ar', 'ar']]) {
    const words = JSON.parse(readFileSync(new URL(`../data/${file}.json`, import.meta.url)));
    for (const w of words) {
      assert.equal(texts(w.word, lang).join(''), w.word.normalize('NFC'), w.id);
    }
  }
});

test('every highlight in the lists matches at least one tile', () => {
  for (const [file, lang] of [['words-en', 'en'], ['words-bn', 'bn'], ['words-ar', 'ar']]) {
    const words = JSON.parse(readFileSync(new URL(`../data/${file}.json`, import.meta.url)));
    for (const w of words) {
      const s = w.word.normalize('NFC');
      let from = 0;
      for (const h of w.highlight || []) {
        const at = s.indexOf(h.normalize('NFC'), from);
        assert.ok(at >= 0, `${w.id}: highlight "${h}" not found in order`);
        from = at + h.normalize('NFC').length;
      }
      const hits = highlightedTiles(segment(w.word, lang), w.word, w.highlight);
      assert.ok(hits.size > 0, `${w.id} has no highlighted tile`);
    }
  }
});

test('highlights are searched in order', () => {
  const tiles = segment('bed', 'en');
  assert.deepEqual([...highlightedTiles(tiles, 'bed', ['b', 'd'])], [0, 2]);
  const bn = segment('বিদ্যালয়', 'bn');
  assert.deepEqual([...highlightedTiles(bn, 'বিদ্যালয়', ['দ্যা', 'য়'])], [1, 3]);
});

test('sentence masking hides the word, including inside longer forms', () => {
  assert.equal(maskWord('I make my bed every morning.', 'bed', '___'), 'I make my ___ every morning.');
  assert.equal(maskWord('আমি প্রথম শ্রেণিতে পড়ি।', 'শ্রেণি', '___'), 'আমি প্রথম ___তে পড়ি।');
  assert.equal(maskWord('Mango is my favourite.', 'mango', '___'), '___ is my favourite.');
});
