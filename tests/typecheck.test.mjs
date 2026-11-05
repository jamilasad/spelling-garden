import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSpelling } from '../js/typecheck.js';

const status = (tiles) => tiles.map((t) => `${t.text}${t.ok ? '' : '✗'}`);

test('an exact match is right; outside spaces and capitals in English are let off', () => {
  const r = checkSpelling('giraffe', 'giraffe', 'en');
  assert.equal(r.correct, true);
  assert.equal(r.firstWrong, -1);
  assert.ok(r.target.every((t) => t.ok));
  assert.equal(checkSpelling('  Giraffe ', 'giraffe', 'en').correct, true);
  assert.equal(checkSpelling('masked  dancers', 'masked dancers', 'en').correct, true);
  assert.equal(checkSpelling('maskeddancers', 'masked dancers', 'en').correct, false);
});

test('both words are compared in the same Unicode form (NFC)', () => {
  // ো typed as ে + া, and য় typed as one precomposed character.
  assert.equal(checkSpelling('দ\u09C7\u09BE\u09DF\u09C7ল', 'দোয়েল', 'bn').correct, true);
  // آ typed as alif + madda.
  assert.equal(checkSpelling('\u0627\u0653', '\u0622', 'ar').correct, true);
  // Shadda and kasra in either order are the same mark pair on paper.
  assert.equal(checkSpelling('مُدَر\u0650\u0651سَةٌ', 'مُدَر\u0651\u0650سَةٌ', 'ar').correct, true);
});

test('Bangla: ি vs ী and ণ vs ন are wrong, and the tile is found', () => {
  const a = checkSpelling('শ্রেনি', 'শ্রেণি', 'bn');
  assert.equal(a.correct, false);
  assert.equal(a.firstWrong, 1);
  assert.deepEqual(status(a.target), ['শ্রে', 'ণি✗']);
  assert.deepEqual(status(a.typed), ['শ্রে', 'নি✗']);

  const b = checkSpelling('শ্রেণী', 'শ্রেণি', 'bn');
  assert.equal(b.correct, false);
  assert.equal(b.firstWrong, 1);

  const c = checkSpelling('সহপাঠি', 'সহপাঠী', 'bn');
  assert.equal(c.firstWrong, 3);
  assert.deepEqual(status(c.target), ['স', 'হ', 'পা', 'ঠী✗']);
});

test('Bangla: a different conjunct form is wrong', () => {
  const r = checkSpelling('মংগলবার', 'মঙ্গলবার', 'bn');
  assert.equal(r.correct, false);
  assert.equal(r.firstWrong, 1);
  assert.deepEqual(status(r.target), ['ম', 'ঙ্গ✗', 'ল', 'বা', 'র']);
  assert.deepEqual(status(r.typed), ['ম', 'ং✗', 'গ✗', 'ল', 'বা', 'র']);
  // A missing হসন্ত leaves two letters instead of the joined one.
  assert.equal(checkSpelling('পরথম', 'প্রথম', 'bn').firstWrong, 0);
});

test('Arabic: harakat are required', () => {
  const bare = checkSpelling('قلم', 'قَلَمٌ', 'ar');
  assert.equal(bare.correct, false);
  assert.equal(bare.harakatOnly, true);
  assert.equal(bare.firstWrong, 0);
  assert.deepEqual(status(bare.target), ['قَ✗', 'لَ✗', 'مٌ✗']);

  const ending = checkSpelling('قَلَمُ', 'قَلَمٌ', 'ar');
  assert.equal(ending.correct, false);
  assert.equal(ending.harakatOnly, true);
  assert.equal(ending.firstWrong, 2);
  assert.deepEqual(status(ending.target), ['قَ', 'لَ', 'مٌ✗']);

  const letter = checkSpelling('سَبْعَهٌ', 'سَبْعَةٌ', 'ar');
  assert.equal(letter.harakatOnly, false);
  assert.equal(letter.firstWrong, 3);

  assert.equal(checkSpelling('قَلَمٌ', 'قَلَمٌ', 'ar').correct, true);
});

test('missing, extra and swapped letters: the first different tile', () => {
  const missing = checkSpelling('mountin', 'mountain', 'en');
  assert.equal(missing.firstWrong, 5);
  assert.equal(missing.missingAt, 5);
  assert.deepEqual(missing.target.map((t) => t.ok), [true, true, true, true, true, false, true, true]);
  assert.ok(missing.typed.every((t) => t.ok));

  const extra = checkSpelling('giraffee', 'giraffe', 'en');
  assert.equal(extra.firstWrong, 7);
  assert.equal(extra.missingAt, -1);
  assert.ok(extra.target.every((t) => t.ok));
  assert.deepEqual(extra.typed.map((t) => t.ok), [true, true, true, true, true, true, true, false]);

  const swapped = checkSpelling('recieve', 'receive', 'en');
  assert.equal(swapped.firstWrong, 3);
  assert.deepEqual(status(swapped.target), ['r', 'e', 'c', 'e✗', 'i✗', 'v', 'e']);

  const space = checkSpelling('টগরফুল', 'টগর ফুল', 'bn');
  assert.equal(space.firstWrong, 3);
  assert.equal(space.target[3].space, true);
  assert.equal(space.target[3].ok, false);
});
