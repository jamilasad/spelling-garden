#!/usr/bin/env node
// Builds the pronunciation audio once and stores it in audio/<lang>/.
//   English words: a real human recording from the free dictionary API when it
//                  has one (UK first), otherwise the Mac voice "Daniel" (en-GB).
//   Bangla:        Mac voice "Piya".   Arabic: Mac voice "Majed".
//   Sentences:     same Mac voices.
// Recordings made on the Word Check page are never overwritten.
// Usage: node tools/build-audio.mjs [--force] [--only=en-03,bn-02]

import { readFile, writeFile, mkdir, rm, access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_FILE = path.join(ROOT, 'data/audio-index.json');

const VOICES = { en: 'Daniel', bn: 'Piya', ar: 'Majed' };
const RATE = { word: 140, sentence: 155 };
// Words whose dictionary recording may be the wrong pronunciation.
const PREFER_VOICE = new Set(['present']);

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = (args.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);

const exists = (p) => access(p).then(() => true, () => false);
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch { return fallback; }
}

async function speak(text, voice, rate, outM4a) {
  const tmp = outM4a.replace(/\.m4a$/, '.tmp.aiff');
  await run('say', ['-v', voice, '-r', String(rate), '-o', tmp, text]);
  await run('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '64000', tmp, outM4a]);
  await rm(tmp, { force: true });
}

async function dictionaryRecording(word, outBase) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return null;
    const entries = await res.json();
    const urls = entries.flatMap((e) => (e.phonetics || []).map((p) => p.audio)).filter(Boolean);
    const pick = urls.find((u) => /-uk\.mp3$/.test(u)) || urls.find((u) => /-(au|us)\.mp3$/.test(u)) || urls[0];
    if (!pick) return null;
    const audio = await fetch(pick.startsWith('//') ? `https:${pick}` : pick);
    if (!audio.ok) return null;
    const file = `${outBase}.mp3`;
    await writeFile(file, Buffer.from(await audio.arrayBuffer()));
    return { file, source: `dictionary (${pick.match(/-(uk|au|us)\.mp3$/)?.[1] || 'recording'})` };
  } catch {
    return null;
  }
}

async function main() {
  const lists = await readJson(path.join(ROOT, 'data/lists.json'), []);
  const index = await readJson(INDEX_FILE, {});
  let made = 0, kept = 0;

  for (const list of lists) {
    const words = await readJson(path.join(ROOT, list.file), []);
    const dir = path.join(ROOT, 'audio', list.lang);
    await mkdir(dir, { recursive: true });

    for (const w of words) {
      if (only.length && !only.includes(w.id)) continue;
      const entry = index[w.id] || {};

      // Word audio
      const keepWord = entry.word && entry.wordSource === 'recording'
        || (!force && entry.word && await exists(path.join(ROOT, entry.word)));
      if (keepWord) {
        kept++;
      } else {
        const base = path.join(dir, w.id);
        let got = null;
        if (list.lang === 'en' && !PREFER_VOICE.has(w.word)) got = await dictionaryRecording(w.word, base);
        if (!got) {
          await speak(w.word, VOICES[list.lang], RATE.word, `${base}.m4a`);
          got = { file: `${base}.m4a`, source: `mac voice ${VOICES[list.lang]}` };
        }
        entry.word = rel(got.file);
        entry.wordSource = got.source;
        made++;
        console.log(`  ${w.id}  ${w.word}  ← ${got.source}`);
      }

      // Sentence audio
      if (w.sentence) {
        const sFile = path.join(dir, `${w.id}-s.m4a`);
        if (!force && entry.sentence && await exists(sFile)) {
          kept++;
        } else {
          await speak(w.sentence, VOICES[list.lang], RATE.sentence, sFile);
          entry.sentence = rel(sFile);
          made++;
        }
      }
      index[w.id] = entry;
    }
  }

  await writeFile(INDEX_FILE, JSON.stringify(index, null, 2) + '\n');
  console.log(`\nDone: ${made} made, ${kept} already there. Index → data/audio-index.json`);
}

main().catch((err) => { console.error(err); process.exit(1); });
