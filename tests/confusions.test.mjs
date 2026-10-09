import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { distractors, pickBlanks } from '../js/confusions.js';
import { segment, highlightedTiles } from '../js/segment.js';

const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

test('English: look-alike letters first, never the right answer', () => {
  const d = distractors('b', 'en', 2, [], seeded());
  assert.deepEqual([...d].sort(), ['d', 'p']);
  assert.equal(distractors('e', 'en', 3, [], seeded()).includes('e'), false);
});

test('Bangla: swaps short/long vowel signs and look-alike consonants', () => {
  const d = distractors('ণি', 'bn', 3, [], seeded());
  assert.ok(d.includes('ণী'), d.join(','));
  assert.ok(d.includes('নি'), d.join(','));
  assert.ok(!d.includes('ণি'));
  assert.ok(distractors('ৎ', 'bn', 1, [], seeded()).includes('ত'));
  assert.ok(distractors('কাঁ', 'bn', 3, [], seeded()).includes('কা'), 'drops the chandrabindu');
});

test('Arabic: swaps taa marbuta and harakat, drops the dagger alif', () => {
  const d = distractors('ةٌ', 'ar', 3, [], seeded());
  assert.ok(d.some((x) => x.startsWith('ه') || x.startsWith('ت')), d.join(','));
  assert.ok(distractors('هٰ', 'ar', 3, [], seeded()).includes('ه'));
  assert.ok(distractors('بْ', 'ar', 2, [], seeded()).includes('بَ'));
});

test('every tile of every word gets enough different choices', () => {
  for (const [file, lang] of [['words-en', 'en'], ['words-bn', 'bn'], ['words-ar', 'ar']]) {
    const words = JSON.parse(readFileSync(new URL(`../data/${file}.json`, import.meta.url)));
    for (const w of words) {
      const tiles = segment(w.word, lang).filter((t) => !t.space).map((t) => t.text);
      for (const t of tiles) {
        const d = distractors(t, lang, 2, tiles, seeded(7));
        assert.equal(d.length, 2, `${w.id} ${t}`);
        assert.ok(!d.includes(t.normalize('NFC')), `${w.id} ${t}`);
        assert.equal(new Set(d).size, 2, `${w.id} ${t}`);
      }
    }
  }
});

test('blanks: the tricky tiles, at most three, never the whole word', () => {
  assert.deepEqual(pickBlanks([0, 2], [0, 1, 2]), [0, 2]);
  assert.equal(pickBlanks([0, 1, 2, 3, 4], [0, 1, 2, 3, 4, 5, 6, 7], 3, seeded()).length, 3);
  assert.equal(pickBlanks([0, 1], [0, 1], 3, seeded()).length, 1);
  for (const [file, lang] of [['words-en', 'en'], ['words-bn', 'bn'], ['words-ar', 'ar']]) {
    const words = JSON.parse(readFileSync(new URL(`../data/${file}.json`, import.meta.url)));
    for (const w of words) {
      const tiles = segment(w.word, lang);
      const letters = tiles.map((t, i) => (t.space ? -1 : i)).filter((i) => i >= 0);
      const blanks = pickBlanks([...highlightedTiles(tiles, w.word, w.highlight)], letters, 3, seeded(3));
      assert.ok(blanks.length >= 1 && blanks.length < letters.length || letters.length === 1, w.id);
    }
  }
});
