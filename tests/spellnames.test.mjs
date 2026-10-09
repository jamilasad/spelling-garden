import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bnTileName, spellingOf } from '../js/spellnames.js';

test('Bangla tile names follow the school way of spelling aloud', () => {
  assert.equal(bnTileName('ঙ্গ'), 'উঁয়ো-এ গ');
  assert.equal(bnTileName('বা'), 'ব-এ আ-কার');
  assert.equal(bnTileName('ণি'), 'মূর্ধন্য ণ-এ হ্রস্ব ই-কার');
  assert.equal(bnTileName('শ্রে'), 'তালব্য শ-এ র-ফলা এ-কার');
  assert.equal(bnTileName('দ্যা'), 'দ-এ য-ফলা আ-কার');
  assert.equal(bnTileName('কাঁ'), 'ক-এ আ-কার চন্দ্রবিন্দু');
  assert.equal(bnTileName('য়'), 'অন্তঃস্থ অ');
  assert.equal(bnTileName('য়ে'), 'অন্তঃস্থ অ-এ এ-কার');
  assert.equal(bnTileName('ৎ'), 'খণ্ড ত');
  assert.equal(bnTileName('ং'), 'অনুস্বার');
  assert.equal(bnTileName('ঐ'), 'ঐ');
  assert.equal(bnTileName('শী'), 'তালব্য শ-এ দীর্ঘ ঈ-কার');
  assert.equal(bnTileName('জ'), 'বর্গীয় জ');
});

test('মঙ্গলবার spelled aloud', () => {
  const s = spellingOf({ word: 'মঙ্গলবার', lang: 'bn' }).map((x) => x.name);
  assert.deepEqual(s, ['ম', 'উঁয়ো-এ গ', 'ল', 'ব-এ আ-কার', 'র']);
});

test('every Bangla and English word has a name for every tile', () => {
  for (const [file, lang] of [['words-bn', 'bn'], ['words-en', 'en']]) {
    for (const w of JSON.parse(readFileSync(new URL(`../data/${file}.json`, import.meta.url)))) {
      for (const p of spellingOf({ word: w.word, lang })) assert.ok(p.name && p.name.length, `${w.id} ${p.tile}`);
    }
  }
});
