// The living garden: drifting clouds, flying bees, falling petals and twinkles.
// It goes quiet while she listens and writes, and stays still when motion is off.
import { cloudHTML, beeFlyerHTML, petalHTML, leafHTML, hillsHTML, hasArt } from './art.js';
import { settings } from './store.js';

const MAX_FALLERS = 6;
let scene = null;
let ambient = null;
let spawnTimer = 0;
let calm = false;

const rand = (a, b) => a + Math.random() * (b - a);
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const motionAllowed = () =>
  settings().motion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function applyMotionSetting() {
  document.documentElement.classList.toggle('no-motion', !settings().motion);
  if (motionAllowed()) scheduleSpawn(); else clearTimeout(spawnTimer);
}

export function buildScene() {
  scene = document.getElementById('scene');
  const clouds = [
    { v: 1, top: 4, w: 230 }, { v: 2, top: 15, w: 150 }, { v: 3, top: 27, w: 190 }, { v: 1, top: 9, w: 120 },
  ].map((c) => {
    const dur = rand(95, 170);
    return `<div class="cloud" style="top:${c.top}%;--w:${c.w}px;--dur:${dur.toFixed(0)}s;--delay:-${rand(0, dur).toFixed(0)}s;--still-x:${rand(2, 80).toFixed(0)}vw">${cloudHTML(c.v)}</div>`;
  }).join('');
  const flyers = [
    { top: 28, size: 40, dur: 26, rev: false }, { top: 46, size: 32, dur: 34, rev: true },
  ].map((f) => `<div class="flyer${f.rev ? ' reverse' : ''}" style="--top:${f.top}%;--size:${f.size}px;--dur:${f.dur}s;--delay:-${rand(0, f.dur).toFixed(1)}s;--bob:${rand(2.2, 3.2).toFixed(1)}s;--still-x:${rand(10, 80).toFixed(0)}vw"><div class="bob">${beeFlyerHTML()}</div></div>`).join('');
  const sparkles = Array.from({ length: 5 }, () =>
    `<span class="sparkle" style="--x:${rand(6, 94).toFixed(0)}%;--y:${rand(58, 82).toFixed(0)}%;--dur:${rand(2.4, 4.2).toFixed(1)}s;--delay:-${rand(0, 4).toFixed(1)}s"></span>`).join('');

  scene.innerHTML = `
    <div class="sun"><div class="sun-rays"></div><div class="sun-disc"></div></div>
    <div class="clouds">${clouds}</div>
    <div class="hills">
      <div class="hill-layer hill-far">${hillsHTML('far')}</div>
      <div class="hill-layer hill-near">${hillsHTML('near')}</div>
      <div class="hill-layer hill-front">${hillsHTML('front')}</div>
    </div>
    <div class="ambient">${flyers}${sparkles}</div>`;
  scene.classList.toggle('scene-art', hasArt('scene-hills-far'));
  ambient = scene.querySelector('.ambient');
  applyMotionSetting();
}

function spawnFaller() {
  if (!ambient || calm || !motionAllowed() || document.visibilityState !== 'visible') return;
  if (ambient.querySelectorAll('.faller').length >= MAX_FALLERS) return;
  const isLeaf = Math.random() < 0.35;
  const art = isLeaf ? leafHTML(pickOne([1, 2, 3])) : petalHTML(pickOne(['yellow', 'yellow', 'pink', 'white']));
  const el = document.createElement('div');
  el.className = 'faller';
  el.style.cssText = `--x:${rand(2, 96).toFixed(1)}%;--size:${rand(isLeaf ? 26 : 18, isLeaf ? 38 : 30).toFixed(0)}px;--dur:${rand(10, 16).toFixed(1)}s;--sway:${rand(2.4, 4).toFixed(1)}s;--spin:${rand(4, 8).toFixed(1)}s;--turn:${pickOne([-1, 1]) * rand(200, 540).toFixed(0)}deg`;
  el.innerHTML = `<div class="sway">${art}</div>`;
  el.addEventListener('animationend', (e) => { if (e.target === el) el.remove(); });
  ambient.appendChild(el);
}

function scheduleSpawn() {
  clearTimeout(spawnTimer);
  if (!motionAllowed()) return;
  spawnTimer = setTimeout(() => { spawnFaller(); scheduleSpawn(); }, rand(2600, 4800));
}

/** Quiet garden while she concentrates. */
export function setCalm(on) {
  calm = on;
  if (scene) scene.classList.toggle('calm', on);
}
