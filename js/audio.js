// Plays the stored pronunciations. One shared <audio> element is "unlocked" on the
// first tap so iPad Safari lets later words play automatically.
import { data } from './data.js';
import { settings } from './store.js';

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

function urlFor(word, kind) {
  const entry = data.audio[word.id];
  const path = entry && entry[kind];
  if (!path) return '';
  return busts[word.id] ? `${path}?v=${busts[word.id]}` : path;
}

export async function sayWord(word, { slow = false } = {}) {
  const rate = slow ? 0.6 : settings().speechRate;
  const url = urlFor(word, 'word');
  if (url && (await playUrl(url, rate))) return true;
  return speak(word.word, word.lang, rate);
}

export async function saySentence(word) {
  if (!word.sentence) return false;
  const rate = settings().speechRate;
  const url = urlFor(word, 'sentence');
  if (url && (await playUrl(url, rate))) return true;
  return speak(word.sentence, word.lang, rate);
}

export const hasSentence = (word) => Boolean(word.sentence);
