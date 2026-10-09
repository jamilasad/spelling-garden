// Garden sounds: a quiet loop of real morning-garden birdsong, and a real bee buzz for passing bees.
// Both recordings are public domain (CC0) — see README "Sound credits".
// The garden never competes with the spoken word: it fades almost to silence while a word plays,
// stays low while she writes, and is off during the Mock contest.
import { audioContext, existingAudioContext } from './sfx.js';
import { settings } from './store.js';

const FILES = { garden: 'audio/garden/garden-morning.m4a', bee: 'audio/garden/bee-buzz.m4a' };
const LEVEL = { normal: 0.24, calm: 0.05, speaking: 0.015 };

const buffers = {};
let gardenGain = null;
let gardenSource = null;
let running = false;
let mode = 'normal';     // 'normal' | 'calm'
let muted = false;       // the Mock contest is silent
let speaking = false;

async function buffer(name) {
  if (!buffers[name]) {
    buffers[name] = (async () => {
      const res = await fetch(FILES[name]);
      const data = await res.arrayBuffer();
      return new Promise((resolve, reject) => audioContext().decodeAudioData(data, resolve, reject));
    })();
  }
  return buffers[name];
}

function targetLevel() {
  if (muted) return 0;
  if (speaking) return LEVEL.speaking;
  return mode === 'calm' ? LEVEL.calm : LEVEL.normal;
}

function applyLevel(seconds = 0.6) {
  const ctx = audioContext();
  if (!gardenGain || !ctx) return;
  gardenGain.gain.cancelScheduledValues(ctx.currentTime);
  gardenGain.gain.setTargetAtTime(targetLevel(), ctx.currentTime, seconds / 3);
}

/** Starts the garden loop (call after the first tap — browsers need a gesture before playing sound). */
export async function startAmbience() {
  if (running || !settings().ambient) return;
  const ctx = audioContext();
  if (!ctx) return;
  running = true;
  try {
    const buf = await buffer('garden');
    if (!running) return;
    gardenGain = ctx.createGain();
    gardenGain.gain.value = 0;
    gardenGain.connect(ctx.destination);
    gardenSource = ctx.createBufferSource();
    gardenSource.buffer = buf;
    gardenSource.loop = true;
    gardenSource.connect(gardenGain);
    gardenSource.start();
    applyLevel(2.5);
  } catch {
    running = false;
  }
}

export function stopAmbience() {
  running = false;
  const ctx = audioContext();
  if (!gardenGain || !ctx) return;
  const g = gardenGain, src = gardenSource;
  g.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
  setTimeout(() => { try { src.stop(); } catch { /* already stopped */ } g.disconnect(); }, 900);
  gardenGain = null;
  gardenSource = null;
}

/** 'normal' on most screens, 'calm' while she listens and writes. */
export function setAmbienceMode(next) {
  mode = next;
  applyLevel();
}

/** Silence the garden completely (Mock contest). */
export function setAmbienceMuted(on) {
  muted = on;
  applyLevel(on ? 0.4 : 1.5);
}

export function duckForSpeech(on) {
  speaking = on;
  applyLevel(on ? 0.25 : 1.4);
}

/** A real bee buzz, panned from one side to the other. */
export async function buzz({ volume = 0.15, from = 0, to = 0, rate = 1 } = {}) {
  if (!settings().ambient || muted || speaking) return;
  const ctx = audioContext();
  if (!ctx || ctx.state !== 'running') return;
  try {
    const buf = await buffer('bee');
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    const len = buf.duration / rate;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.25);
    gain.gain.setValueAtTime(volume, t + Math.max(0.3, len - 0.5));
    gain.gain.linearRampToValueAtTime(0, t + len);
    let node = src.connect(gain);
    if (ctx.createStereoPanner) {
      const pan = ctx.createStereoPanner();
      pan.pan.setValueAtTime(from, t);
      pan.pan.linearRampToValueAtTime(to, t + len);
      node = node.connect(pan);
    }
    node.connect(ctx.destination);
    src.start();
  } catch { /* sound is optional */ }
}

// No garden sounds while the app is in the background.
document.addEventListener('visibilitychange', () => {
  const ctx = existingAudioContext();
  if (!ctx) return;
  if (document.visibilityState === 'hidden') ctx.suspend().catch(() => {});
  else ctx.resume().catch(() => {});
});
