#!/usr/bin/env node
// Builds the pronunciation audio once and stores it in audio/<lang>/.
// Two kinds of voices:
//   • Microsoft neural voices (very natural; free through Microsoft Edge's read-aloud service,
//     generated once and stored locally). Needs the local tool: python3 -m venv .venv && .venv/bin/pip install edge-tts
//       English: en-US-JennyNeural · Bangla: bn-BD-NabanitaNeural (Bangladesh) · Arabic: ar-SA-ZariyahNeural
//   • Mac voices (offline, built in): Samantha (US English), Piya (Bangla, India), Majed (Arabic)
// A voice name ending in "Neural" uses the Microsoft voice; any other name uses the Mac `say` command.
// Recordings made on the Word Check page are never overwritten.
// A word can give the voice a hint spelling with "say" / "sentenceSay" in its data, when the voice
// mispronounces the real spelling (e.g. চমৎকার → "চমোৎকার" so it says cho-mot-kar). The screen still shows the real word.
// Usage: node tools/build-audio.mjs [--force] [--lang=bn] [--only=en-03,bn-02]
//        [--voice-en=en-US-JennyNeural] [--voice-bn=bn-BD-NabanitaNeural] [--voice-ar=Majed] [--dictionary]
//   --dictionary  try human recordings from the free dictionary API first for English (mixed speakers).

import { readFile, writeFile, mkdir, rm, access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_FILE = path.join(ROOT, 'data/audio-index.json');

const args = process.argv.slice(2);
const arg = (name) => (args.find((a) => a.startsWith(`--${name}=`)) || '').slice(name.length + 3);
const force = args.includes('--force');
const useDictionary = args.includes('--dictionary');
const only = arg('only').split(',').filter(Boolean);
const onlyLang = arg('lang');

const EDGE_TTS = path.join(ROOT, '.venv', 'bin', 'edge-tts');
const NEURAL = { en: 'en-US-JennyNeural', bn: 'bn-BD-NabanitaNeural', ar: 'ar-SA-ZariyahNeural' };
const MAC = { en: 'Samantha', bn: 'Piya', ar: 'Majed' };
const RATE = { word: 135, sentence: 150 };              // Mac voices, words per minute
const NEURAL_RATE = { word: '-12%', sentence: '-6%' };   // a little slower for children
// Words whose dictionary recording may be the wrong pronunciation.
const PREFER_VOICE = new Set(['present']);

const exists = (p) => access(p).then(() => true, () => false);
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch { return fallback; }
}

const isNeural = (voice) => /Neural$/.test(voice);

/** Writes `${base}.m4a` (Mac voice) or `${base}.mp3` (neural voice); returns the file path. */
async function speak(text, voice, kind, base) {
  if (isNeural(voice)) {
    const out = `${base}.mp3`;
    for (let attempt = 1; ; attempt++) {
      try {
        await run(EDGE_TTS, ['--voice', voice, `--rate=${NEURAL_RATE[kind]}`, '--text', text, '--write-media', out]);
        return out;
      } catch (err) {
        if (attempt >= 3) throw err;
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  }
  const out = `${base}.m4a`;
  const tmp = `${base}.tmp.aiff`;
  await run('say', ['-v', voice, '-r', String(RATE[kind]), '-o', tmp, text]);
  await run('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '64000', tmp, out]);
  await rm(tmp, { force: true });
  return out;
}

// Removes an older generated file when the new one has a different name (e.g. .m4a → .mp3).
async function replaceOld(oldRel, newFile) {
  if (oldRel && oldRel !== rel(newFile) && !oldRel.startsWith('audio/rec/')) await rm(path.join(ROOT, oldRel), { force: true });
}

async function dictionaryRecording(word, outBase) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return null;
    const entries = await res.json();
    const urls = entries.flatMap((e) => (e.phonetics || []).map((p) => p.audio)).filter(Boolean);
    const pick = urls.find((u) => /-us\.mp3$/.test(u)) || urls.find((u) => /-(uk|au)\.mp3$/.test(u)) || urls[0];
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
  const haveNeural = await exists(EDGE_TTS);
  const VOICES = {};
  for (const lang of ['en', 'bn', 'ar']) {
    VOICES[lang] = arg(`voice-${lang}`) || (haveNeural ? NEURAL[lang] : MAC[lang]);
    if (isNeural(VOICES[lang]) && !haveNeural) throw new Error(`${VOICES[lang]} needs the edge-tts tool: python3 -m venv .venv && .venv/bin/pip install edge-tts`);
  }
  const lists = await readJson(path.join(ROOT, 'data/lists.json'), []);
  const index = await readJson(INDEX_FILE, {});
  let made = 0, kept = 0;

  for (const list of lists) {
    if (onlyLang && list.lang !== onlyLang) continue;
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
        if (useDictionary && list.lang === 'en' && !PREFER_VOICE.has(w.word)) got = await dictionaryRecording(w.word, base);
        if (!got) {
          const voice = VOICES[list.lang];
          const file = await speak(w.say || w.word, voice, 'word', base);
          got = { file, source: `${isNeural(voice) ? 'neural' : 'mac'} voice ${voice}` };
        }
        await replaceOld(entry.word, got.file);
        entry.word = rel(got.file);
        entry.wordSource = got.source;
        made++;
        console.log(`  ${w.id}  ${w.word}  ← ${got.source}`);
      }

      // Sentence audio
      if (w.sentence) {
        const keepSentence = entry.sentenceSource === 'recording'
          || (!force && entry.sentence && await exists(path.join(ROOT, entry.sentence)));
        if (keepSentence) {
          kept++;
        } else {
          const voice = VOICES[list.lang];
          const sFile = await speak(w.sentenceSay || w.sentence, voice, 'sentence', path.join(dir, `${w.id}-s`));
          await replaceOld(entry.sentence, sFile);
          entry.sentence = rel(sFile);
          entry.sentenceSource = `${isNeural(voice) ? 'neural' : 'mac'} voice ${voice}`;
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
