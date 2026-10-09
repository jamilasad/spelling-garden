// Plays the stored pronunciations. One shared <audio> element is "unlocked" on the
// first tap so iPad Safari lets later words play automatically.
import { data } from './data.js';
import { settings } from './store.js';
import { duckForSpeech } from './ambience.js';
import { spellingOf, spellKey, canSpell } from './spellnames.js';

const player = new Audio();
player.preload = 'auto';
let unlocked = false;
let silentUrl = '';
let busts = {};

function silentWav() {
  const samples = 800;
  const buf = new ArrayBuffer(44 + samples * 2);
  const v = new DataView(buf);
  const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + samples * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, samples * 2, true);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

export function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  try {
    silentUrl = silentUrl || silentWav();
    player.src = silentUrl;
    player.play().then(() => player.pause()).catch(() => {});
  } catch { /* ignore */ }
  if ('speechSynthesis' in window) {
    try { speechSynthesis.getVoices(); } catch { /* ignore */ }
  }
}

export function stopAudio() {
  spellRun++;
  try { player.pause(); } catch { /* ignore */ }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

/** Marks a word's audio as changed so the next play skips the browser cache. */
export function bustAudio(id) {
  busts[id] = Date.now();
}

function playUrl(url, rate) {
  return new Promise((resolve) => {
    stopAudio();
    const done = (ok) => { player.onended = player.onerror = null; resolve(ok); };
    player.onended = () => done(true);
    player.onerror = () => done(false);
    player.src = url;
    player.defaultPlaybackRate = rate;
    player.playbackRate = rate;
    player.preservesPitch = true;
    player.webkitPreservesPitch = true;
    const p = player.play();
    if (p) p.catch(() => done(false));
  });
}

const BCP47 = { en: 'en-US', bn: 'bn-BD', ar: 'ar-SA' };
function speak(text, lang, rate) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve(false);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = BCP47[lang] || lang;
    const voices = speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang === u.lang) || voices.find((v) => v.lang.startsWith(lang));
    if (voice) u.voice = voice;
    u.rate = rate;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
}

// ---------- Narrators ----------
export const voicesFor = (lang) => data.voices[lang] || [];
export const narratorOf = (lang) => settings().narrator?.[lang] || voicesFor(lang)[0]?.id || '';
export const voiceName = (lang, id) => voicesFor(lang).find((v) => v.id === id)?.name || '';

/** Narrators that actually have audio for this word, starting with the chosen one. */
export function voicesForWord(word) {
  const entry = data.audio[word.id] || {};
  const all = voicesFor(word.lang).map((v) => v.id);
  const have = all.filter((id, i) => (i === 0 ? entry.word : entry.voices?.[id]?.word));
  const first = narratorOf(word.lang);
  return have.includes(first) ? [first, ...have.filter((id) => id !== first)] : have;
}

function urlFor(word, kind, voice = narratorOf(word.lang)) {
  const entry = data.audio[word.id];
  if (!entry) return '';
  const isDefault = voice === voicesFor(word.lang)[0]?.id;
  const path = (!isDefault && entry.voices?.[voice]?.[kind]) || entry[kind];
  if (!path) return '';
  return busts[word.id] ? `${path}?v=${busts[word.id]}` : path;
}

// The garden fades almost to silence while a word or sentence is spoken.
async function withQuietGarden(play) {
  duckForSpeech(true);
  try { return await play(); } finally { duckForSpeech(false); }
}

export function sayWord(word, { slow = false, voice } = {}) {
  return withQuietGarden(async () => {
    const rate = slow ? 0.6 : settings().speechRate;
    const url = urlFor(word, 'word', voice);
    if (url && (await playUrl(url, rate))) return true;
    return speak(word.word, word.lang, rate);
  });
}

export function saySentence(word, { voice } = {}) {
  if (!word.sentence) return Promise.resolve(false);
  return withQuietGarden(async () => {
    const rate = settings().speechRate;
    const url = urlFor(word, 'sentence', voice);
    if (url && (await playUrl(url, rate))) return true;
    return speak(word.sentence, word.lang, rate);
  });
}

export const hasSentence = (word) => Boolean(word.sentence);

// ---------- Spelling aloud ----------
let spellRun = 0;

export const canSpellAloud = (word) => canSpell(word.lang);
export const spellClip = (tile, lang) => data.spell[spellKey(tile, lang)] || '';

/** Plays one piece's name (e.g. "উঁয়ো-এ গ"). */
export function sayPiece(tile, lang) {
  const url = spellClip(tile, lang);
  if (!url) return Promise.resolve(false);
  return withQuietGarden(() => playUrl(url, 1));
}

/**
 * Spells a word aloud piece by piece. onPiece(index) is called as each piece starts,
 * so the screen can light up the matching tile. Stops when another sound starts.
 */
export async function spellAloud(word, onPiece = () => {}) {
  const me = ++spellRun;
  const pieces = spellingOf(word);
  duckForSpeech(true);
  try {
    for (let i = 0; i < pieces.length; i++) {
      if (me !== spellRun) return false;
      onPiece(i, pieces[i]);
      const url = spellClip(pieces[i].tile, word.lang);
      if (url) await playUrl(url, 1);
      else await new Promise((r) => setTimeout(r, 700));
      await new Promise((r) => setTimeout(r, 180));
    }
    return me === spellRun;
  } finally {
    if (me === spellRun) { onPiece(-1); duckForSpeech(false); }
  }
}

export function stopSpelling() { spellRun++; }
