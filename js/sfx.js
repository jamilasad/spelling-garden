// Small cheerful sounds, made in code — no sound files needed.
import { settings } from './store.js';

let ctx = null;

/** The one audio context shared by sound effects and the garden sounds. */
export function audioContext() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended' && document.visibilityState === 'visible') ctx.resume();
  return ctx;
}

/** The audio context only if sound has already started (never creates one). */
export const existingAudioContext = () => ctx;

function audioCtx() {
  return settings().sound ? audioContext() : null;
}

export function unlockSfx() {
  const c = audioContext();
  if (!c) return;
  const g = c.createGain();
  g.gain.value = 0;
  const o = c.createOscillator();
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.01);
}

function tone(freq, at, dur, { type = 'sine', gain = 0.16, to = null } = {}) {
  const c = audioCtx();
  if (!c) return;
  const t0 = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export const sfx = {
  tap() { tone(660, 0, 0.07, { type: 'triangle', gain: 0.07 }); },
  pop(i = 0) { tone(520 + i * 40, 0, 0.09, { type: 'triangle', gain: 0.09, to: 900 + i * 40 }); },
  chime() {
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.09, 0.45, { type: 'sine', gain: 0.13 }));
  },
  soft() {
    tone(392, 0, 0.28, { type: 'sine', gain: 0.1, to: 330 });
    tone(330, 0.2, 0.38, { type: 'sine', gain: 0.08, to: 294 });
  },
  whoosh() { tone(300, 0, 0.25, { type: 'sine', gain: 0.05, to: 900 }); },
  tada() {
    [523, 659, 784].forEach((f, i) => tone(f, i * 0.12, 0.3, { type: 'triangle', gain: 0.12 }));
    [523, 659, 784, 1047].forEach((f) => tone(f, 0.42, 0.9, { type: 'sine', gain: 0.07 }));
  },
  badge() { [880, 1109, 1319, 1760].forEach((f, i) => tone(f, i * 0.07, 0.5, { type: 'sine', gain: 0.1 })); },
};
